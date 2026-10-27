import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorMapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendorMap'
    },
    senderEmail: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
    },
    vendorName: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'failed', 'review_needed'],
        default: 'pending'
    },
    extractedData: {
        invoiceNumber: String,
        invoiceDate: String,
        totalAmount: String,
        dueDate: String,
        currency: { type: String, default: 'USD' },
        subtotal: String,
        taxAmount: String,
        taxRate: String,
        discount: String,
        paymentTerms: String,
        vendorAddress: String,
        vendorTaxId: String,
        lineItems: [{
            description: String,
            quantity: Number,
            unitPrice: String,
            amount: String
        }],
        mathAudit: {
            type: mongoose.Schema.Types.Mixed,
            default: () => ({
                isValid: true,
                calculatedTotal: '0.00',
                statedTotal: '0.00',
                discrepancy: 0,
                summary: 'Audited'
            })
        },
        aiSummary: String,
        engine: { type: String, default: 'Spatial Heuristics' }
    },
    confidenceScore: {
        type: Number,
        default: 0
    },
    originalFileName: String,
    processedAt: Date,
    pdfData: {
        type: Buffer,
        required: false
    },
    contentType: {
        type: String,
        default: 'application/pdf'
    }
}, {
    timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
