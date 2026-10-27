import { broadcastSSE } from '../services/sseService.js';
import express from 'express';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

import { syncEmailNow, getEmailStatus } from '../services/imapService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

router.post('/test-upload', authenticateToken, upload.single('invoice'), async (req, res, next) => {
    try {
        const { vendorEmail, vendorName } = req.body;
        const pdfBuffer = req.file?.buffer;

        console.log(`[Version 2.0] Processing Upload. Email: '${vendorEmail}', Name: '${vendorName}'`);
        console.log(`[Upload] File received: ${req.file?.originalname}, Size: ${req.file?.size}, Buffer: ${pdfBuffer ? 'Present' : 'MISSING'}`);

        if (!pdfBuffer) {
            return res.status(400).json({ success: false, error: 'File buffer missing. Please provide a valid PDF file.' });
        }

        let effectiveVendorName = vendorName ? vendorName.trim() : null;
        let effectiveVendorEmail = vendorEmail ? vendorEmail.trim().toLowerCase() : null;

        // 1. Search database for existing learned Vendor if info was provided
        let query = { userId: req.user.userId };
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

        // 3. High-Speed AI Extraction (Groq Llama 3.3)
        try {
            if (fullText && fullText.trim().length > 0) {
                console.log(`[AI Engine] Invoking Groq Llama 3.3 extraction on ${fullText.length} characters...`);
                aiResult = await extractWithAI(fullText, req.file.originalname);
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
                userId: req.user.userId,
                vendorName: { $regex: new RegExp(`^${aiResult.vendorName.trim()}$`, 'i') }
            }).lean();
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

            let finalVendorName = aiResult?.vendorName || vendorName || null;

            if (!aiResult) {
                try {
                    const { results } = await extractData(pdfBuffer, []);
                    extractedData = results;
                    const allVendors = await VendorMap.find({ userId: req.user.userId }).select('vendorName');
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

            const isHighConfidence = confidence >= 80 && extractedData?.totalAmount;
            const invoiceStatus = isHighConfidence ? 'processed' : 'review_needed';

            const finalSenderEmail = effectiveVendorEmail || (finalVendorName && finalVendorName !== 'Unregistered Vendor' ? `${finalVendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@billing.auto` : 'manual-upload@pdf2sheet.local');

            const reviewInvoice = await Invoice.create({
                userId: req.user.userId,
                vendorName: finalVendorName || 'Unregistered Vendor',
                senderEmail: finalSenderEmail,
                status: invoiceStatus,
                originalFileName: req.file ? req.file.originalname : 'unknown_file.pdf',
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
                        extractedData.engine || 'Groq LPU (GPT-OSS 120B)',
                        new Date().toISOString()
                    ];
                    await appendToSheet(req.user.userId, rowData);
                } catch (sheetError) {
                    console.warn('[Sheet] Sync failed:', sheetError.message);
                }
            }

            return res.status(201).json({
                success: true,
                message: isHighConfidence ? 'Invoice processed with AI!' : 'Vendor not found. Invoice saved for review.',
                _broadcast: broadcastSSE('INVOICE_INGESTED', { invoice: reviewInvoice }),
                data: {
                    invoiceId: reviewInvoice._id,
                    status: invoiceStatus,
                    vendorName: reviewInvoice.vendorName,
                    confidenceScore: confidence || 60,
                    extractedData
                }
            });
        }

        // 6. Existing Vendor - Register Invoice
        const invoice = await Invoice.create({
            userId: req.user.userId,
            vendorMapId: vendor._id,
            vendorName: vendor.vendorName,
            senderEmail: vendor.senderEmail || vendorEmail,
            extractedData,
            confidenceScore: confidence,
            status: confidence >= 70 ? 'processed' : 'review_needed',
            originalFileName: req.file.originalname,
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
                    extractedData.engine || 'Groq LPU (Llama 3.3 70B)',
                    new Date().toISOString()
                ];

                await appendToSheet(req.user.userId, rowData);
                console.log('Added to Google Sheet with forensic audit fields');
            } catch (sheetError) {
                console.error('Failed to update Google Sheet:', sheetError.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Invoice processed successfully with AI',
            data: {
                invoiceId: invoice._id,
                vendorName: vendor.vendorName,
                confidence,
                status: invoice.status,
                extractedData
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
