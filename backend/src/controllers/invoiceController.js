import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import VendorMap from '../models/VendorMap.js';
import { appendToSheet } from '../services/sheetsService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export const getInvoices = async (req, res) => {
    try {
        let invoices = await Invoice.find({ userId: req.user.userId })
            .populate('vendorMapId', 'vendorName extractionRules senderEmail')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

export const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findOne({ _id: id, userId: req.user.userId })
            .populate('vendorMapId');

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        res.json({ success: true, data: invoice });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let invoice = await Invoice.findOne({ _id: id, userId: req.user.userId });

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (updates.extractedData) {
            if (!invoice.extractedData) invoice.extractedData = {}; for (const [k, v] of Object.entries(updates.extractedData)) { if (v !== undefined) invoice.extractedData[k] = v; } invoice.markModified('extractedData');
        }
        if (updates.status) {
            invoice.status = updates.status;
        }
        if (updates.vendorName) {
            invoice.vendorName = updates.vendorName;
        }

        await invoice.save();

        if (updates.status === 'processed') {
            try {
                const ed = invoice.extractedData || {};
                const rowData = [
                    invoice.vendorName || updates.vendorName || '',
                    ed.invoiceNumber || '',
                    ed.invoiceDate || '',
                    ed.totalAmount || '',
                    ed.dueDate || '',
                    ed.currency || 'USD',
                    ed.subtotal || '',
                    ed.taxAmount || '',
                    ed.mathAudit?.isValid === true ? 'VERIFIED' : (ed.mathAudit?.isValid === false ? 'DISCREPANCY' : 'UNCHECKED'),
                    ed.engine || 'Manual Approval',
                    new Date().toISOString()
                ];

                await appendToSheet(req.user.userId, rowData);
            } catch (sheetError) {
                console.error('Failed to sync manually approved invoice:', sheetError);
            }
        }

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInvoicePdf = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[PDF Serve] Request for Invoice ID: ${id}`);

        const invoice = await Invoice.findOne({ _id: id, userId: req.user.userId });

        if (!invoice) {
            console.log('[PDF Serve] Invoice not found in DB');
            return res.status(404).json({ success: false, error: 'PDF not found' });
        }

        if (invoice.pdfData) {
            console.log(`[PDF Serve] Serving from Database Buffer. Size: ${invoice.pdfData.length} bytes`);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', invoice.pdfData.length);
            return res.send(invoice.pdfData);
        }

        if (invoice.filePath) {
            const filePath = path.join(UPLOADS_DIR, invoice.filePath);
            if (fs.existsSync(filePath)) {
                console.log('[PDF Serve] Serving from Disk (Legacy)');
                res.setHeader('Content-Type', 'application/pdf');
                return res.sendFile(filePath);
            }
        }

        return res.status(404).json({ success: false, error: 'PDF File not found' });

    } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ success: false, error: 'Failed to serve PDF' });
    }
};

const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';

    const cleanStr = String(dateStr).replace(/Date[:\s]*/i, '').trim();
    let date = new Date(cleanStr);

    if (isNaN(date.getTime())) {
        const parts = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (parts) {
            return `${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}-${parts[3]}`;
        }
        return dateStr;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

export const processAndLearn = async (req, res) => {
    try {
        const { id } = req.params;
        const { extractedData, vendorName } = req.body;
        const userId = req.user.userId;

        const invoice = await Invoice.findOne({ _id: id, userId });
        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        if (extractedData) {
            if (extractedData.invoiceDate) extractedData.invoiceDate = formatDateToDDMMYYYY(extractedData.invoiceDate);
            if (extractedData.dueDate) extractedData.dueDate = formatDateToDDMMYYYY(extractedData.dueDate);

            if (!invoice.extractedData) invoice.extractedData = {}; for (const [k, v] of Object.entries(extractedData)) { if (v !== undefined) invoice.extractedData[k] = v; } invoice.markModified('extractedData');
        }
        if (vendorName) invoice.vendorName = vendorName;
        invoice.status = 'processed';
        invoice.processedAt = new Date();

        await invoice.save();

        if (invoice.pdfData && extractedData) {
            try {
                const { extractTextWithCoordinates, normalizeDate, findCoordinates } = await import('../services/extractionService.js');
                const { textItems } = await extractTextWithCoordinates(invoice.pdfData);

                const normalize = (str) => String(str || '').toLowerCase().trim();
                const safeEmail = normalize(invoice.senderEmail);
                const safeVendorName = normalize(vendorName);

                console.log(`[DEBUG-LOOKUP] Starting Vendor Resolution...`);
                console.log(`[DEBUG-LOOKUP] UserID: ${userId}`);
                console.log(`[DEBUG-LOOKUP] Email Target: "${safeEmail}" (Original: "${invoice.senderEmail}")`);
                console.log(`[DEBUG-LOOKUP] Name Target: "${safeVendorName}"`);

                let vendorMap = null;

                if (safeEmail) {
                    vendorMap = await VendorMap.findOne({ senderEmail: safeEmail, userId });

                    if (vendorMap) {
                        console.log(`[DEBUG-LOOKUP] Search by Email Result: FOUND (${vendorMap._id}) - Name: "${vendorMap.vendorName}"`);

                        // User Request: If email matches, assume it IS the same vendor.
                        // We do NOT check for name mismatch or unlink anymore.
                        // We trust the email identity.
                    } else {
                        console.log(`[DEBUG-LOOKUP] Search by Email Result: NOT FOUND`);
                    }
                }

                if (!vendorMap && safeVendorName) {
                    console.log(`[Learning] Vendor not found by email (${safeEmail}). Searching by name: "${safeVendorName}"`);
                    vendorMap = await VendorMap.findOne({
                        userId,
                        vendorName: { $regex: new RegExp(`^${safeVendorName}$`, 'i') }
                    });
                    console.log(`[DEBUG-LOOKUP] Search by Name Result:`, vendorMap ? `FOUND (${vendorMap._id})` : 'NOT FOUND');

                    if (vendorMap) {

                        if (invoice.senderEmail && vendorMap.senderEmail !== invoice.senderEmail) {
                            const oldEmail = vendorMap.senderEmail;
                            vendorMap.senderEmail = invoice.senderEmail;
                            await vendorMap.save();
                        }
                    } else {
                        // console.log(`[Learning] Vendor "${vendorName}" NOT found by name either.`);
                    }
                }

                if (!vendorMap && vendorName) {
                    vendorMap = new VendorMap({
                        userId,
                        vendorName,
                        senderEmail: invoice.senderEmail,
                        extractionRules: []
                    });
                }

                if (vendorMap) {
                    for (const [key, value] of Object.entries(extractedData)) {
                        if (!value) continue;

                        const matchBox = findCoordinates(textItems, value, key);

                        if (matchBox) {
                            console.log(`[Learning] Learned Rule '${key}' @ [${matchBox.x}, ${matchBox.y}]`);
                            const ruleIndex = vendorMap.extractionRules.findIndex(r => r.targetField === key);
                            const newRule = {
                                targetField: key,
                                method: 'coordinate',
                                coordinates: {
                                    x: matchBox.x,
                                    y: matchBox.y,
                                    width: matchBox.width,
                                    height: matchBox.height,
                                    pageIndex: matchBox.pageIndex
                                },
                                confidence: 0.95
                            };

                            if (ruleIndex >= 0) {
                                vendorMap.extractionRules[ruleIndex] = newRule;
                            } else {
                                vendorMap.extractionRules.push(newRule);
                            }
                        } else {
                            console.log(`[Learning] Could not find coordinates for '${key}': "${value}" in PDF text.`);
                        }
                    }
                    await vendorMap.save();
                    console.log(`[Learning] Updated rules for ${vendorName}`);
                }
            } catch (learnErr) {
                console.error('[Learning] Failed to learn coordinates:', learnErr);
            }
        }



        try {
            const ed = invoice.extractedData || {};
            const rowData = [
                invoice.vendorName || vendorName || '',
                ed.invoiceNumber || '',
                ed.invoiceDate || '',
                ed.totalAmount || '',
                ed.dueDate || '',
                ed.currency || 'USD',
                ed.subtotal || '',
                ed.taxAmount || '',
                ed.mathAudit?.isValid === true ? 'VERIFIED' : (ed.mathAudit?.isValid === false ? 'DISCREPANCY' : 'UNCHECKED'),
                ed.engine || 'Learned Spatial Coordinates',
                new Date().toISOString()
            ];
            await appendToSheet(userId, rowData);
            console.log(`[Sheet] Synced invoice ${id}`);
            res.json({ success: true, message: 'Invoice processed and rules learned & Synced to Sheet!' });

        } catch (sheetErr) {
            console.error('[Sheet] Sync failed:', sheetErr);
            res.json({
                success: true,
                message: 'Invoice processed, but Sheet Sync Failed: ' + (sheetErr.message || 'Unknown Error'),
                warning: true
            });
        }

    } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({ success: false, error: 'Failed to process invoice' });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Delete Debug] Attempting to delete Invoice ID: ${id} for User ID: ${req.user.userId}`);
        const invoice = await Invoice.findOne({ _id: id, userId: req.user.userId });

        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        if (invoice.filePath) {
            try {
                const filePath = path.resolve(path.join(UPLOADS_DIR, invoice.filePath));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fsErr) {
                console.error('Failed to delete legacy file:', fsErr);
            }
        }

        if (invoice.originalFileName) {
            await User.findByIdAndUpdate(req.user.userId, {
                $push: {
                    'settings.deletedInvoices': {
                        filename: invoice.originalFileName,
                        senderEmail: invoice.senderEmail || '',
                        deletedAt: new Date()
                    }
                }
            });
        }

        await Invoice.deleteOne({ _id: id });

        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete invoice' });
    }
};


export const clearAllInvoices = async (req, res) => {
    try {
        const result = await Invoice.deleteMany({ userId: req.user.userId });
        
        // Record timestamp so background email sync never resurrects emails received before this clear
        await User.findByIdAndUpdate(req.user.userId, {
            $set: {
                'settings.clearedInvoicesAt': new Date(),
                'settings.deletedInvoices': []
            }
        });
        try {
            const { clearProcessedUids } = await import('../services/imapService.js');
            clearProcessedUids();
        } catch (e) {
            // ignore if imapService not active
        }
        res.json({
            success: true,
            message: `Successfully cleared ${result.deletedCount} invoices from database`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Clear all error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear invoices' });
    }
};

export const askInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ success: false, error: 'Question is required' });
        }

        const invoice = await Invoice.findOne({ _id: id, userId: req.user.userId });
        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        const { askInvoiceQuestion } = await import('../services/aiExtractionService.js');
        const answer = await askInvoiceQuestion(invoice, question);

        res.json({ success: true, answer });
    } catch (error) {
        console.error('Ask invoice error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to answer question' });
    }
};

export const getCFOExecutiveBrief = async (req, res) => {
    try {
        const { baseCurrency = 'USD' } = req.body;
        const invoices = await Invoice.find({ userId: req.user.userId }).sort({ createdAt: -1 });

        const { generateCFOBrief } = await import('../services/aiExtractionService.js');
        const brief = await generateCFOBrief(invoices, baseCurrency);

        res.json({ success: true, data: brief });
    } catch (error) {
        console.error('CFO Brief Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate CFO brief' });
    }
};

export const parseInvoiceQueryNL = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.json({ success: true, filter: { active: false } });
        }

        const { parseNaturalLanguageQuery } = await import('../services/aiExtractionService.js');
        const filter = await parseNaturalLanguageQuery(query);

        res.json({ success: true, filter });
    } catch (error) {
        console.error('NL Query Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to parse query' });
    }
};
