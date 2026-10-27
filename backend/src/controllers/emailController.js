import Invoice from '../models/Invoice.js';
import VendorMap from '../models/VendorMap.js';
import User from '../models/User.js';
import { extractTextWithCoordinates } from '../services/extractionService.js';
import { extractWithAI } from '../services/aiExtractionService.js';
import { appendToSheet } from '../services/sheetsService.js';

export const receiveEmailWebhook = async (req, res) => {
    try {
        const sender = req.body.sender || '';
        const subject = req.body.subject || '';

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No PDF attachment found'
            });
        }

        let user = null;
        if (req.body.to) {
            user = await User.findOne({ 'settings.forwardingEmail': req.body.to });
        }
        if (!user && req.body.userId) {
            user = await User.findById(req.body.userId);
        }
        if (!user) {
            // Default to primary system user if unmapped
            user = await User.findOne({}).sort({ createdAt: 1 });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No user registered to receive invoices'
            });
        }

        // 1. Text & Coordinate Parsing
        const { fullText } = await extractTextWithCoordinates(req.file.buffer);

        // 2. High-Speed Multimodal AI Extraction (Groq LPU)
        let aiResult = null;
        let extractedData = {};
        let confidence = 85;

        if (fullText && fullText.trim().length > 0) {
            aiResult = await extractWithAI(fullText, req.file.originalname);
            extractedData = aiResult.extractedData;
            confidence = aiResult.confidenceScore;
        }

        const finalVendorName = aiResult?.vendorName || req.body.vendorName || 'Auto-Detected Vendor';
        const invoiceStatus = confidence >= 70 && extractedData.totalAmount ? 'processed' : 'review_needed';

        const invoice = await Invoice.create({
            userId: user._id,
            vendorName: finalVendorName,
            senderEmail: sender || `${finalVendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}@billing.auto`,
            originalFileName: req.file.originalname,
            status: invoiceStatus,
            extractedData,
            confidenceScore: confidence,
            processedAt: new Date(),
            pdfData: req.file.buffer,
            contentType: 'application/pdf'
        });

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
                    extractedData.engine || 'Groq LPU Webhook Ingest',
                    new Date().toISOString()
                ];
                await appendToSheet(user._id, rowData);
                console.log(`[Email Webhook] Auto-synced invoice ${invoice._id} to sheet.`);
            } catch (sheetErr) {
                console.warn('[Email Webhook] Sheet sync notice:', sheetErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Email processed successfully with Groq AI',
            invoiceId: invoice._id,
            data: extractedData,
            confidence: confidence
        });

    } catch (err) {
        console.error('[Email Webhook] Error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
