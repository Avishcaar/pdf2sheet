import Imap from 'imap';
import { simpleParser } from 'mailparser';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { extractTextWithCoordinates } from './extractionService.js';
import { extractWithAI } from './aiExtractionService.js';
import { appendToSheet } from './sheetsService.js';
import { broadcastSSE } from './sseService.js';

let client = null;
let currentBox = null;
let isConnected = false;
let isScanning = false;
let scanStartTime = 0;
let initialScanCompleted = false;
let reconnectTimer = null;
let periodicScanTimer = null;

let lastSyncTimestamp = null;
let lastSyncReport = {
    totalScanned: 0,
    newInvoicesFound: 0,
    ingestedInvoices: [],
    lastStatus: 'Idle'
};

const IMAP_CONFIG = {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000,
    connTimeout: 30000,
    keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: false
    }
};

/**
 * Ingests a single raw email message, extracts PDF attachments,
 * runs Groq LPU AI extraction, saves to MongoDB, broadcasts SSE, and pushes to Google Sheets.
 */
const processEmailBuffer = async (rawBuffer, emailUid = null, defaultUser, force = false) => {
    try {
        const parsed = await simpleParser(rawBuffer);
        const senderAddress = parsed.from?.value?.[0]?.address || parsed.from?.text || 'unknown@domain.com';
        const subject = parsed.subject || 'No Subject';

        // 1. Guard against resurrecting emails received BEFORE the user cleared their database
        if (!force && defaultUser.settings?.clearedInvoicesAt) {
            const emailTime = parsed.date ? new Date(parsed.date).getTime() : 0;
            const clearedTime = new Date(defaultUser.settings.clearedInvoicesAt).getTime();
            if (emailTime <= clearedTime) {
                console.log(`[IMAP Ingest] Skipping historical email from "${senderAddress}" received (${parsed.date}) before user cleared DB (${defaultUser.settings.clearedInvoicesAt}).`);
                return null;
            }
        }

        const pdfAttachments = (parsed.attachments || []).filter(a => {
            const ct = (a.contentType || '').toLowerCase();
            const fn = (a.filename || '').toLowerCase();
            return ct === 'application/pdf' || fn.endsWith('.pdf');
        });

        if (pdfAttachments.length === 0) {
            return null;
        }

        console.log(`[IMAP Ingest] Found ${pdfAttachments.length} PDF attachment(s) in email from "${senderAddress}" (Subject: "${subject}")`);

        const ingestedItems = [];

        for (const attachment of pdfAttachments) {
            const filename = attachment.filename || 'email-invoice.pdf';

            // 2. Guard against resurrecting an invoice file that the user explicitly deleted
            if (!force && defaultUser.settings?.deletedInvoices?.length > 0) {
                const isExplicitlyDeleted = defaultUser.settings.deletedInvoices.some(d =>
                    d.filename?.toLowerCase() === filename.toLowerCase() &&
                    (!d.senderEmail || d.senderEmail.toLowerCase() === senderAddress.toLowerCase())
                );
                if (isExplicitlyDeleted) {
                    console.log(`[IMAP Ingest] Invoice "${filename}" was explicitly deleted by user. Skipping resurrection.`);
                    continue;
                }
            }

            // 3. Check if this invoice is already saved in MongoDB
            const existingInvoice = await Invoice.findOne({
                userId: defaultUser._id,
                originalFileName: filename,
                senderEmail: senderAddress
            });

            if (existingInvoice) {
                console.log(`[IMAP Ingest] Invoice "${filename}" from "${senderAddress}" already exists in DB. Skipping duplicate.`);
                continue;
            }

            console.log(`[IMAP Ingest] Processing new invoice PDF: "${filename}" (${attachment.size} bytes)...`);

            // 1. Spatial text extraction
            const { fullText } = await extractTextWithCoordinates(attachment.content);

            // 2. Groq LPU AI Extraction
            let aiResult = null;
            let extractedData = {};
            let confidence = 85;

            if (fullText && fullText.trim().length > 0) {
                console.log(`[IMAP Ingest] Extracting with Groq LPU AI (${fullText.length} chars)...`);
                aiResult = await extractWithAI(fullText, filename);
                extractedData = aiResult.extractedData || {};
                confidence = aiResult.confidenceScore || 85;
            }

            const finalVendorName = aiResult?.vendorName || 'Auto-Detected Vendor';
            const invoiceStatus = confidence >= 70 && extractedData.totalAmount ? 'processed' : 'review_needed';

            // 3. Save to MongoDB
            const invoice = await Invoice.create({
                userId: defaultUser._id,
                vendorName: finalVendorName,
                senderEmail: senderAddress,
                status: invoiceStatus,
                originalFileName: filename,
                confidenceScore: confidence,
                processedAt: new Date(),
                extractedData,
                pdfData: attachment.content,
                contentType: 'application/pdf'
            });

            console.log(`[IMAP Ingest] Ingested invoice ${invoice._id} for "${finalVendorName}" (${extractedData.currency || '$'}${extractedData.totalAmount || '0.00'})!`);

            // 4. Broadcast live Server-Sent Event (SSE) to update connected browsers instantly (< 5ms)
            try {
                broadcastSSE('INVOICE_INGESTED', {
                    invoice: {
                        _id: invoice._id,
                        vendorName: finalVendorName,
                        invoiceNumber: extractedData.invoiceNumber || 'N/A',
                        totalAmount: extractedData.totalAmount || '0.00',
                        currency: extractedData.currency || 'USD',
                        status: invoiceStatus,
                        source: 'EMAIL'
                    }
                });
            } catch (sseErr) {
                // ignore
            }

            // 5. Sync to Google Sheet if processed
            if (invoiceStatus === 'processed') {
                try {
                    const rowData = [
                        finalVendorName,
                        extractedData.invoiceNumber || '',
                        extractedData.invoiceDate || '',
                        extractedData.totalAmount || '',
                        extractedData.dueDate || '',
                        extractedData.currency || 'USD',
                        extractedData.subtotal || '',
                        extractedData.taxAmount || '',
                        extractedData.mathAudit?.isValid === true ? 'VERIFIED' : (extractedData.mathAudit?.isValid === false ? 'DISCREPANCY' : 'UNCHECKED'),
                        extractedData.engine || 'Groq LPU Email Ingest',
                        new Date().toISOString()
                    ];
                    await appendToSheet(defaultUser._id, rowData);
                    console.log(`[IMAP Ingest] Synced invoice to Google Sheet!`);
                } catch (sheetErr) {
                    console.warn(`[IMAP Ingest] Sheet sync note: ${sheetErr.message}`);
                }
            }

            ingestedItems.push({
                id: invoice._id,
                vendorName: finalVendorName,
                invoiceNumber: extractedData.invoiceNumber || 'N/A',
                totalAmount: extractedData.totalAmount || '0.00',
                currency: extractedData.currency || 'USD',
                originalFileName: filename,
                senderEmail: senderAddress
            });
        }

        return ingestedItems;
    } catch (err) {
        console.error('[IMAP Ingest] Error processing email buffer:', err.message);
        return null;
    }
};

/**
 * Scans recent messages from an open box using sequence numbers.
 */
const scanRecentMessages = (imapInstance, box, count = 1) => {
    return new Promise((resolve) => {
        if (!box || !box.messages || typeof box.messages.total !== 'number') {
            return resolve([]);
        }
        const total = box.messages.total;
        if (total === 0) {
            return resolve([]);
        }

        const startSeq = Math.max(1, total - count + 1);
        const endSeq = total;

        console.log(`[IMAP Ingest] Fetching sequence range ${startSeq}:${endSeq} (${Math.min(total, count)} message(s))...`);

        const messages = [];
        let completed = false;

        const timer = setTimeout(() => {
            if (!completed) {
                completed = true;
                console.warn('[IMAP Ingest] Stream fetch timeout (12s), returning gathered messages');
                resolve(messages);
            }
        }, 12000);

        try {
            const fetchStream = imapInstance.seq.fetch(`${startSeq}:${endSeq}`, {
                bodies: '',
                struct: true
            });

            fetchStream.on('message', (msg, seqno) => {
                let uid = null;
                let fullBody = '';

                msg.on('attributes', (attrs) => {
                    uid = attrs.uid;
                });

                msg.on('body', (stream) => {
                    stream.on('data', (chunk) => {
                        fullBody += chunk.toString('binary');
                    });
                });

                msg.once('end', () => {
                    messages.push({ seqno, uid, buffer: Buffer.from(fullBody, 'binary') });
                });
            });

            fetchStream.once('error', (err) => {
                clearTimeout(timer);
                if (!completed) {
                    completed = true;
                    console.warn('[IMAP Ingest] Seq fetch error:', err.message);
                    resolve(messages);
                }
            });

            fetchStream.once('end', () => {
                clearTimeout(timer);
                if (!completed) {
                    completed = true;
                    resolve(messages);
                }
            });
        } catch (fetchErr) {
            clearTimeout(timer);
            if (!completed) {
                completed = true;
                console.warn('[IMAP Ingest] Seq fetch invocation error:', fetchErr.message);
                resolve(messages);
            }
        }
    });
};

/**
 * Core Ingestion Scan: Inspects the latest emails, processes any PDFs,
 * and updates internal status reports.
 */
export const fetchNewEmails = async ({ count = 5, force = false } = {}) => {
    const safeCount = Math.min(Math.max(Number(count) || 1, 1), 8);

    if (force) {
        console.log('[IMAP Ingest] Force sync requested: resetting cleared timestamp.');
        const user = await User.findOne({}).sort({ createdAt: 1 });
        if (user) {
            await User.findByIdAndUpdate(user._id, {
                $set: { 'settings.clearedInvoicesAt': null, 'settings.deletedInvoices': [] }
            });
        }
    }

    if (isScanning) {
        if (Date.now() - scanStartTime > 25000) {
            console.warn('[IMAP Ingest] Stale scan lock detected (>25s). Auto-recovering lock.');
            isScanning = false;
        } else {
            console.log('[IMAP Ingest] Scan already in progress. Skipping duplicate.');
            return {
                success: true,
                inProgress: true,
                message: 'Scan already in progress.',
                stats: lastSyncReport
            };
        }
    }

    isScanning = true;
    scanStartTime = Date.now();

    try {
        const defaultUser = await User.findOne({}).sort({ createdAt: 1 });
        if (!defaultUser) {
            return { success: false, message: 'No registered user found in database.' };
        }

        if (!client || !isConnected) {
            console.log('[IMAP Ingest] Client not currently connected. Connecting on demand...');
            await initClient();
        }

        if (!client || !isConnected) {
            return { success: false, message: 'Could not connect to Gmail IMAP.' };
        }

        console.log(`[IMAP Ingest] Scanning latest ${safeCount} message(s) from INBOX...`);
        const messages = await scanRecentMessages(client, currentBox, safeCount);
        console.log(`[IMAP Ingest] Downloaded ${messages.length} message(s). Inspecting for invoices...`);

        // Process newest messages first
        messages.reverse();

        const newlyIngested = [];
        for (const item of messages) {
            const results = await processEmailBuffer(item.buffer, item.uid, defaultUser, force);
            if (results && results.length > 0) {
                newlyIngested.push(...results);
            }
        }

        lastSyncTimestamp = new Date();
        const summary = newlyIngested.length > 0
            ? `Successfully ingested ${newlyIngested.length} new invoice(s): ${newlyIngested.map(i => `${i.vendorName} (${i.currency} ${i.totalAmount})`).join(', ')}!`
            : `Scanned ${messages.length} recent emails. All invoices up to date.`;

        lastSyncReport = {
            totalScanned: messages.length,
            newInvoicesFound: newlyIngested.length,
            ingestedInvoices: newlyIngested,
            lastStatus: summary
        };

        console.log(`[IMAP Ingest] ${summary}`);

        return {
            success: true,
            message: summary,
            account: process.env.IMAP_USER,
            scannedCount: messages.length,
            newInvoicesCount: newlyIngested.length,
            ingestedInvoices: newlyIngested
        };

    } catch (err) {
        console.error('[IMAP Ingest] Scan error:', err.message);
        return {
            success: false,
            message: `Scan error: ${err.message}`
        };
    } finally {
        isScanning = false;
    }
};

/**
 * Initializes and connects the persistent IMAP client with RFC 2177 IDLE.
 */
const initClient = () => {
    return new Promise((resolve) => {
        const imapUser = process.env.IMAP_USER;
        const imapPassword = process.env.IMAP_PASSWORD;

        if (!imapUser || !imapPassword) {
            return resolve(false);
        }

        try {
            if (client) {
                try { client.end(); } catch (e) {}
            }

            client = new Imap({
                user: imapUser,
                password: imapPassword,
                host: IMAP_CONFIG.host,
                port: IMAP_CONFIG.port,
                tls: IMAP_CONFIG.tls,
                tlsOptions: IMAP_CONFIG.tlsOptions,
                authTimeout: IMAP_CONFIG.authTimeout,
                connTimeout: IMAP_CONFIG.connTimeout,
                keepalive: IMAP_CONFIG.keepalive
            });

            client.once('ready', () => {
                isConnected = true;
                console.log(`[IMAP Listener] Successfully authenticated as: ${imapUser}`);

                client.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        console.error('[IMAP Listener] Failed to open INBOX:', err.message);
                        return resolve(false);
                    }

                    currentBox = box;
                    console.log(`[IMAP Listener] INBOX ready (Total: ${box.messages.total}). RFC 2177 IDLE active.`);

                    // Setup periodic fallback background scan every 60s
                    if (periodicScanTimer) clearInterval(periodicScanTimer);
                    periodicScanTimer = setInterval(() => {
                        if (isConnected && initialScanCompleted) {
                            fetchNewEmails({ count: 3 }).catch(e => {
                                console.warn('[IMAP Listener] Periodic scan note:', e.message);
                            });
                        }
                    }, 60000);

                    resolve(true);
                });
            });

            // Real-time mail arrival event (fires within milliseconds of delivery via RFC IDLE)
            client.on('mail', (numNewMsgs) => {
                if (!initialScanCompleted) {
                    return; // Ignore the initial bulk count on first connect
                }
                const safeCount = Math.min(Math.max(Number(numNewMsgs) || 1, 1), 3);
                console.log(`[IMAP Listener] Real-time mail push received: ${numNewMsgs} message(s). Ingesting newest ${safeCount} immediately...`);
                fetchNewEmails({ count: safeCount }).catch(e => {
                    console.warn('[IMAP Listener] Auto-ingest notice:', e.message);
                });
            });

            client.on('error', (err) => {
                console.warn('[IMAP Listener] Socket warning:', err.message);
                isConnected = false;
            });

            client.on('close', (hadError) => {
                isConnected = false;
                console.log('[IMAP Listener] Connection closed. Auto-reconnecting in 15 seconds...');
                scheduleReconnect();
            });

            client.on('end', () => {
                isConnected = false;
            });

            console.log('[IMAP Listener] Connecting to Gmail IMAP with RFC 2177 IDLE push...');
            client.connect();

        } catch (e) {
            console.error('[IMAP Listener] Setup error:', e.message);
            resolve(false);
        }
    });
};

const scheduleReconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
        console.log('[IMAP Listener] Attempting reconnect...');
        initClient().then(success => {
            if (success) {
                console.log('[IMAP Listener] Reconnected successfully.');
            }
        });
    }, 15000);
};

/**
 * Public bootstrap method called on server startup.
 */
export const connectImap = async () => {
    const imapUser = process.env.IMAP_USER;
    if (!imapUser || !process.env.IMAP_PASSWORD) {
        console.log('[IMAP Listener] IMAP_USER or IMAP_PASSWORD not configured. Standing by.');
        return;
    }

    const connected = await initClient();
    if (connected) {
        // Run initial scan 2 seconds after startup to ingest any pending emails
        setTimeout(async () => {
            try {
                await fetchNewEmails({ count: 3 });
            } catch (e) {
                console.warn('[IMAP Listener] Startup scan note:', e.message);
            } finally {
                initialScanCompleted = true;
                console.log('[IMAP Listener] Initial scan complete. Sub-second real-time mail listener active.');
            }
        }, 2000);
    }
};

export const clearProcessedUids = () => {
    console.log('[IMAP Listener] Cache reset requested.');
};

export const syncEmailNow = async (force = false) => {
    console.log('[IMAP Listener] Manual sync triggered via API. Force:', force);
    return await fetchNewEmails({ count: 5, force });
};

export const getEmailStatus = () => {
    return {
        configured: Boolean(process.env.IMAP_USER && process.env.IMAP_PASSWORD),
        account: process.env.IMAP_USER || null,
        isConnected,
        isScanning,
        inboxTotal: currentBox?.messages?.total || 0,
        lastSyncTimestamp,
        lastSyncReport
    };
};
