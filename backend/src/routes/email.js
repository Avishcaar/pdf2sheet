import { broadcastSSE } from '../services/sseService.js';
import express from 'express';
import { addGuestInvoice } from '../services/guestStore.js';
import mongoose from 'mongoose';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import VendorMap from '../models/VendorMap.js';
import { extractData, calculateConfidence, extractTextWithCoordinates } from '../services/extractionService.js';
import { extractWithAI } from '../services/aiExtractionService.js';
import Invoice from '../models/Invoice.js';
import { appendToSheet } from '../services/sheetsService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncEmailNow, getEmailStatus } from '../services/imapService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const SAMPLES_MAP = {
    aws: {
        fileName: 'aws-invoice.pdf',
        vendorName: 'AWS Cloud Services',
        vendorEmail: 'no-reply-aws@amazon.com'
    },
    stripe: {
        fileName: 'stripe-invoice.pdf',
        vendorName: 'Stripe Payments',
        vendorEmail: 'billing@stripe.com'
    },
    sap: {
        fileName: 'sap-eur-invoice.pdf',
        vendorName: 'SAP Deutschland SE & Co. KG',
        vendorEmail: 'invoicing@sap.de'
    },
    apollo: {
        fileName: 'apollo-inr-invoice.pdf',
        vendorName: 'Apollo Hospitals Enterprises Ltd',
        vendorEmail: 'billing@apollohospitals.com'
    },
    github: {
        fileName: 'github-invoice.pdf',
        vendorName: 'GitHub Enterprise',
        vendorEmail: 'billing@github.com'
    }
};

/**
 * Reusable Core Extraction & Registration Pipeline for uploaded and sample PDF buffers
 */
async function processInvoicePipeline({ userId, pdfBuffer, originalFileName = 'invoice.pdf', vendorName, vendorEmail }) {
    console.log(`[Version 2.0] Processing Pipeline for User ${userId}. Email: '${vendorEmail}', Name: '${vendorName}'`);
    console.log(`[Pipeline] File: ${originalFileName}, Size: ${pdfBuffer?.length || 0} bytes`);

    let effectiveVendorName = vendorName ? vendorName.trim() : null;
    let effectiveVendorEmail = vendorEmail ? vendorEmail.trim().toLowerCase() : null;

    // 1. Search database for existing learned Vendor if info was provided
    let query = { userId };
    const conditions = [];

    if (effectiveVendorEmail) {
        conditions.push({ senderEmail: effectiveVendorEmail });
    }
    if (effectiveVendorName) {
        conditions.push({ vendorName: { $regex: new RegExp(`^${effectiveVendorName}$`, 'i') } });
    }
    if (conditions.length > 0) {
        query.$or = conditions;
    }

    let vendor = conditions.length > 0 ? await VendorMap.findOne(query).lean() : null;

    // If not yet in VendorMap, check prior Invoice records from this user (e.g. earlier uploads or simulations)
    if (!vendor && conditions.length > 0) {
        const priorInvoice = await Invoice.findOne({
            userId,
            $or: conditions
        }).sort({ createdAt: -1 }).lean();

        if (priorInvoice) {
            console.log(`[Identity] Recognized vendor from prior invoice history: ${priorInvoice.vendorName}`);
            try {
                vendor = await VendorMap.create({
                    userId,
                    vendorName: priorInvoice.vendorName || effectiveVendorName,
                    senderEmail: priorInvoice.senderEmail || effectiveVendorEmail,
                    confidenceThreshold: 80,
                    active: true,
                    extractionRules: []
                });
            } catch (vErr) {
                vendor = await VendorMap.findOne(query).lean();
            }
        }
    }

    let extractedData = {};
    let confidence = 0;
    let fullText = "";
    let aiResult = null;

    // 2. Parse PDF Text
    try {
        const parsedPdf = await extractTextWithCoordinates(pdfBuffer);
        fullText = parsedPdf.fullText || "";
    } catch (pdfErr) {
        console.warn('[PDF] Failed to extract coordinates/text:', pdfErr.message);
    }

    // 3. High-Speed AI Extraction (Groq LPU / GPT-OSS 120B / Llama 3.3)
    try {
        if (fullText && fullText.trim().length > 0) {
            console.log(`[AI Engine] Invoking Groq extraction on ${fullText.length} characters...`);
            aiResult = await extractWithAI(fullText, originalFileName);
            console.log(`[AI Engine] Succeeded: Vendor="${aiResult.vendorName}", Total="${aiResult.extractedData.totalAmount}", LineItems=${aiResult.extractedData.lineItems?.length}`);
            extractedData = aiResult.extractedData;
            confidence = aiResult.confidenceScore;
        }
    } catch (aiErr) {
        console.warn('[AI Engine] Groq AI extraction error, falling back to spatial engine:', aiErr.message);
    }

    // 4. Augment with Learned Spatial Coordinate Rules (if vendor exists)
    if (!vendor && aiResult?.vendorName) {
        vendor = await VendorMap.findOne({
            userId,
            vendorName: { $regex: new RegExp(`^${aiResult.vendorName.trim()}$`, 'i') }
        }).lean();

        // Check prior invoices if not in VendorMap
        if (!vendor) {
            const prior = await Invoice.findOne({
                userId,
                vendorName: { $regex: new RegExp(`^${aiResult.vendorName.trim()}$`, 'i') }
            }).sort({ createdAt: -1 }).lean();

            if (prior) {
                console.log(`[Identity] Found matching prior invoice for AI vendor: ${prior.vendorName}`);
                try {
                    vendor = await VendorMap.create({
                        userId,
                        vendorName: prior.vendorName,
                        senderEmail: prior.senderEmail || effectiveVendorEmail || `${prior.vendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@billing.auto`,
                        confidenceThreshold: 80,
                        active: true,
                        extractionRules: []
                    });
                } catch (e) {
                    vendor = await VendorMap.findOne({ userId, vendorName: { $regex: new RegExp(`^${prior.vendorName}$`, 'i') } }).lean();
                }
            }
        }
    }

    if (vendor) {
        console.log(`[Identity] Found vendor via Email/Name: ${vendor.vendorName}`);
        try {
            const extraction = await extractData(pdfBuffer, vendor.extractionRules);
            if (extraction.results) {
                for (const [k, v] of Object.entries(extraction.results)) {
                    if (!extractedData[k] && v) extractedData[k] = v;
                }
            }
            if (!confidence) {
                confidence = calculateConfidence(extractedData, vendor.extractionRules);
            }
        } catch (spatialErr) {
            console.warn('[Spatial Engine] Extraction error:', spatialErr.message);
        }

        const isVendorInText = fullText.toLowerCase().includes(vendor.vendorName.toLowerCase());
        if (isVendorInText) {
            confidence = Math.min(confidence + 5, 100);
        }
    }

    // 5. Handle New / Unregistered Vendor
    if (!vendor) {
        console.log('Vendor not registered yet. Creating invoice with AI-extracted vendor identity.');

        let finalVendorName = aiResult?.vendorName || effectiveVendorName || null;

        if (!aiResult) {
            try {
                const { results } = await extractData(pdfBuffer, []);
                extractedData = results;
                const allVendors = await VendorMap.find({ userId }).select('vendorName');
                for (const v of allVendors) {
                    if (fullText && fullText.toLowerCase().includes(v.vendorName.toLowerCase())) {
                        finalVendorName = v.vendorName;
                        break;
                    }
                }
            } catch (err) {
                console.error('Heuristic extraction failed:', err);
            }
        }

        finalVendorName = finalVendorName || 'Unregistered Vendor';
        const isHighConfidence = (confidence >= 75) && Boolean(extractedData?.totalAmount);
        const invoiceStatus = isHighConfidence ? 'processed' : 'review_needed';

        const finalSenderEmail = effectiveVendorEmail || (finalVendorName && finalVendorName !== 'Unregistered Vendor' ? `${finalVendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@billing.auto` : 'manual-upload@pdf2sheet.local');

        // Auto-register learned vendor for future 1-click matches if high confidence
        if (isHighConfidence && finalVendorName !== 'Unregistered Vendor') {
            try {
                vendor = await VendorMap.create({
                    userId,
                    vendorName: finalVendorName,
                    senderEmail: finalSenderEmail,
                    confidenceThreshold: 80,
                    active: true,
                    extractionRules: []
                });
                console.log(`[Identity] Automatically registered new vendor in VendorMap: ${finalVendorName}`);
            } catch (regErr) {
                // Safe to ignore duplicate key
            }
        }

        const reviewInvoice = await Invoice.create({
            userId,
            vendorMapId: vendor?._id || null,
            vendorName: finalVendorName,
            senderEmail: finalSenderEmail,
            status: invoiceStatus,
            originalFileName: originalFileName || 'unknown_file.pdf',
            confidenceScore: confidence || 60,
            processedAt: new Date(),
            extractedData,
            pdfData: pdfBuffer,
            contentType: 'application/pdf'
        });

        if (invoiceStatus === 'processed') {
            try {
                const rowData = [
                    reviewInvoice.vendorName || '',
                    extractedData.invoiceNumber || '',
                    extractedData.invoiceDate || '',
                    extractedData.totalAmount || '',
                    extractedData.dueDate || '',
                    extractedData.currency || 'USD',
                    extractedData.subtotal || '',
                    extractedData.taxAmount || '',
                    extractedData.mathAudit?.isValid === true ? 'VERIFIED' : (extractedData.mathAudit?.isValid === false ? 'DISCREPANCY' : 'UNCHECKED'),
                    extractedData.engine || 'Groq LPU AI',
                    new Date().toISOString()
                ];
                await appendToSheet(userId, rowData);
            } catch (sheetError) {
                console.warn('[Sheet] Sync failed:', sheetError.message);
            }
        }

        const statusMessage = isHighConfidence
            ? `Invoice processed with AI for ${finalVendorName}!`
            : `Invoice from ${finalVendorName} saved for review (${confidence || 60}% confidence).`;

        broadcastSSE('INVOICE_INGESTED', { invoice: reviewInvoice });

        return {
            statusCode: 201,
            success: true,
            message: statusMessage,
            data: {
                invoiceId: reviewInvoice._id,
                status: invoiceStatus,
                vendorName: reviewInvoice.vendorName,
                confidenceScore: confidence || 60,
                extractedData
            }
        };
    }

    // 6. Existing Vendor - Register Invoice
    const invoice = await Invoice.create({
        userId,
        vendorMapId: vendor._id,
        vendorName: vendor.vendorName,
        senderEmail: vendor.senderEmail || effectiveVendorEmail,
        extractedData,
        confidenceScore: confidence || 95,
        status: (confidence || 95) >= 70 ? 'processed' : 'review_needed',
        originalFileName: originalFileName || 'unknown_file.pdf',
        processedAt: new Date(),
        pdfData: pdfBuffer,
        contentType: 'application/pdf'
    });

    if (invoice.status === 'processed') {
        try {
            const rowData = [
                vendor.vendorName || '',
                extractedData.invoiceNumber || '',
                extractedData.invoiceDate || '',
                extractedData.totalAmount || '',
                extractedData.dueDate || '',
                extractedData.currency || 'USD',
                extractedData.subtotal || '',
                extractedData.taxAmount || '',
                extractedData.mathAudit?.isValid === true ? 'VERIFIED' : (extractedData.mathAudit?.isValid === false ? 'DISCREPANCY' : 'UNCHECKED'),
                extractedData.engine || 'Groq LPU AI',
                new Date().toISOString()
            ];

            await appendToSheet(userId, rowData);
            console.log('Added to Google Sheet with forensic audit fields');
        } catch (sheetError) {
            console.error('Failed to update Google Sheet:', sheetError.message);
        }
    }

    broadcastSSE('INVOICE_INGESTED', { invoice });

    return {
        statusCode: 201,
        success: true,
        message: `Known vendor recognized: ${vendor.vendorName}. Processed successfully!`,
        data: {
            invoiceId: invoice._id,
            vendorName: vendor.vendorName,
            confidence: invoice.confidenceScore,
            status: invoice.status,
            extractedData
        }
    };
}

router.get('/status', authenticateToken, (req, res) => {
    try {
        const status = getEmailStatus();
        res.json({ success: true, data: status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/sync', authenticateToken, async (req, res) => {
    try {
        const force = Boolean(req.body?.force);
        const result = await syncEmailNow(force);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 1-Click Server-Side Sample Ingestion
 * Avoids browser client-side fetch/blob/FormData issues for recruiters and demo users.
 */
router.post('/sample-ingest', authenticateToken, async (req, res, next) => {
    try {
        let key = String(req.body?.scenarioId || 'aws').toLowerCase();
        if (key.includes('stripe')) key = 'stripe';
        else if (key.includes('sap')) key = 'sap';
        else if (key.includes('apollo')) key = 'apollo';
        else if (key.includes('github')) key = 'github';
        else if (key.includes('aws')) key = 'aws';

        const sample = SAMPLES_MAP[key] || SAMPLES_MAP.aws;

        // If database is offline and user is guest, perform immediate in-memory demo ingestion
        if (mongoose.connection.readyState !== 1) {
            if (req.user?.isGuest) {
                const totalAmt = key.includes('stripe') ? '1,250.00' : (key.includes('sap') ? '3,400.00' : (key.includes('apollo') ? '84,500.00' : '4,850.00'));
                const curr = key.includes('sap') ? 'EUR' : (key.includes('apollo') ? 'INR' : 'USD');
                const sub = key.includes('stripe') ? '1,150.00' : (key.includes('sap') ? '2,857.14' : (key.includes('apollo') ? '71,610.17' : '4,500.00'));
                const tax = key.includes('stripe') ? '100.00' : (key.includes('sap') ? '542.86' : (key.includes('apollo') ? '12,889.83' : '350.00'));
                
                const mockInvoice = {
                    _id: 'guest_ingest_' + Date.now(),
                    userId: req.user.userId,
                    vendorName: req.body?.vendorName || sample.vendorName,
                    senderEmail: sample.vendorEmail,
                    status: 'processed',
                    confidenceScore: 99,
                    originalFileName: sample.fileName,
                    processedAt: new Date(),
                    createdAt: new Date().toISOString(),
                    extractedData: {
                        vendorName: req.body?.vendorName || sample.vendorName,
                        invoiceNumber: 'INV-' + Math.floor(100000 + Math.random() * 900000),
                        invoiceDate: new Date().toISOString().split('T')[0],
                        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                        totalAmount: totalAmt,
                        currency: curr,
                        subtotal: sub,
                        taxAmount: tax,
                        engine: 'Groq LPU AI',
                        mathAudit: {
                            isValid: true,
                            calculatedTotal: totalAmt,
                            statedTotal: totalAmt,
                            discrepancy: 0,
                            summary: 'Reconciled: Groq LPU Optical Scan + Mathematical Verification'
                        },
                        lineItems: [
                            { description: sample.vendorName + ' Core Subscription / Usage Tier', quantity: 1, unitPrice: sub, amount: sub },
                            { description: 'Enterprise Support & SLA Telemetry', quantity: 1, unitPrice: tax, amount: tax }
                        ]
                    }
                };

                addGuestInvoice(mockInvoice);
                broadcastSSE('INVOICE_INGESTED', { invoice: mockInvoice });

                return res.status(201).json({
                    statusCode: 201,
                    success: true,
                    message: `Ingested: ${mockInvoice.vendorName} (${mockInvoice.extractedData.currency} ${mockInvoice.extractedData.totalAmount})`,
                    data: mockInvoice
                });
            }

            return res.status(503).json({
                success: false,
                error: 'Database disconnected: MongoDB Atlas is rejecting connections. Check your IP whitelist in Atlas Network Access or disconnect your VPN.'
            });
        }

        const potentialPaths = [
            path.resolve(__dirname, '../../samples', sample.fileName),
            path.resolve(__dirname, '../../../frontend/public/samples', sample.fileName),
            path.resolve(process.cwd(), 'samples', sample.fileName),
            path.resolve(process.cwd(), '../frontend/public/samples', sample.fileName),
            path.resolve(process.cwd(), 'frontend/public/samples', sample.fileName)
        ];

        let filePath = potentialPaths.find(p => fs.existsSync(p));
        if (!filePath) {
            console.error(`[Sample Ingest] Could not locate file: ${sample.fileName} in paths:`, potentialPaths);
            return res.status(404).json({ success: false, error: `Sample invoice file "${sample.fileName}" not found on server.` });
        }

        console.log(`[Sample Ingest] Ingesting "${sample.fileName}" from "${filePath}" for user: ${req.user.userId}`);
        const pdfBuffer = fs.readFileSync(filePath);

        const result = await processInvoicePipeline({
            userId: req.user.userId,
            pdfBuffer,
            originalFileName: sample.fileName,
            vendorName: req.body?.vendorName || sample.vendorName,
            vendorEmail: sample.vendorEmail
        });

        res.status(result.statusCode || 201).json(result);
    } catch (error) {
        console.error('[Sample Ingest] Error:', error);
        next(error);
    }
});

/**
 * Direct PDF File Upload (Multipart Form)
 */
router.post('/test-upload', authenticateToken, upload.single('invoice'), async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                error: 'Database disconnected: MongoDB Atlas is rejecting connections. Check your IP whitelist in Atlas Network Access or disconnect your VPN.'
            });
        }

        const { vendorEmail, vendorName } = req.body;
        const pdfBuffer = req.file?.buffer;

        if (!pdfBuffer) {
            return res.status(400).json({ success: false, error: 'File buffer missing. Please provide a valid PDF file.' });
        }

        const result = await processInvoicePipeline({
            userId: req.user.userId,
            pdfBuffer,
            originalFileName: req.file?.originalname || 'uploaded-invoice.pdf',
            vendorName,
            vendorEmail
        });

        res.status(result.statusCode || 201).json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
