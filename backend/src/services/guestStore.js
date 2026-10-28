// In-memory demo store for isolated Guest/Recruiter sessions
// Allows instantaneous demo evaluation without database latency or network blocking

const GUEST_USER_ID = '6ae0f1989e78e3eb2b71ff9c';

const INITIAL_INVOICES = [
    {
        _id: 'guest_inv_aws_01',
        userId: GUEST_USER_ID,
        vendorName: 'AWS Cloud Services',
        senderEmail: 'no-reply-aws@amazon.com',
        status: 'processed',
        confidenceScore: 99,
        originalFileName: 'aws-invoice.pdf',
        processedAt: new Date(Date.now() - 3600000 * 2),
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        extractedData: {
            vendorName: 'AWS Cloud Services',
            invoiceNumber: 'INV-AWS-882194',
            invoiceDate: '2026-03-15',
            dueDate: '2026-04-15',
            totalAmount: '4,850.00',
            currency: 'USD',
            subtotal: '4,500.00',
            taxAmount: '350.00',
            engine: 'Groq LPU AI',
            mathAudit: {
                isValid: true,
                calculatedTotal: '4850.00',
                statedTotal: '4850.00',
                discrepancy: 0,
                summary: 'Reconciled: Subtotal ($4,500.00) + Tax ($350.00) = $4,850.00'
            },
            lineItems: [
                { description: 'Amazon Elastic Compute Cloud (EC2) US-East', quantity: 1, unitPrice: '3,200.00', amount: '3,200.00' },
                { description: 'CloudFront Content Delivery Network & Data Transfer', quantity: 1, unitPrice: '1,300.00', amount: '1,300.00' }
            ]
        }
    },
    {
        _id: 'guest_inv_stripe_02',
        userId: GUEST_USER_ID,
        vendorName: 'Stripe SaaS Infrastructure',
        senderEmail: 'billing@stripe.com',
        status: 'processed',
        confidenceScore: 97,
        originalFileName: 'stripe-invoice.pdf',
        processedAt: new Date(Date.now() - 3600000 * 18),
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        extractedData: {
            vendorName: 'Stripe SaaS Infrastructure',
            invoiceNumber: 'STRIPE-90218',
            invoiceDate: '2026-03-10',
            dueDate: '2026-03-24',
            totalAmount: '1,250.00',
            currency: 'USD',
            subtotal: '1,150.00',
            taxAmount: '100.00',
            engine: 'Groq LPU AI',
            mathAudit: {
                isValid: true,
                calculatedTotal: '1250.00',
                statedTotal: '1250.00',
                discrepancy: 0,
                summary: 'Reconciled: Subtotal ($1,150.00) + Tax ($100.00) = $1,250.00'
            },
            lineItems: [
                { description: 'Stripe Payments Processing Volume Fee', quantity: 1, unitPrice: '850.00', amount: '850.00' },
                { description: 'Stripe Radar Anti-Fraud & Chargeback Protection', quantity: 1, unitPrice: '300.00', amount: '300.00' }
            ]
        }
    },
    {
        _id: 'guest_inv_sap_03',
        userId: GUEST_USER_ID,
        vendorName: 'SAP Enterprise Solutions',
        senderEmail: 'invoices@sap.de',
        status: 'processed',
        confidenceScore: 96,
        originalFileName: 'sap-eur-invoice.pdf',
        processedAt: new Date(Date.now() - 3600000 * 36),
        createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
        extractedData: {
            vendorName: 'SAP Enterprise Solutions',
            invoiceNumber: 'SAP-DE-44102',
            invoiceDate: '2026-03-05',
            dueDate: '2026-04-05',
            totalAmount: '3,400.00',
            currency: 'EUR',
            subtotal: '2,857.14',
            taxAmount: '542.86',
            engine: 'Groq LPU AI',
            mathAudit: {
                isValid: true,
                calculatedTotal: '3400.00',
                statedTotal: '3400.00',
                discrepancy: 0,
                summary: 'Reconciled: EUR €2,857.14 + VAT 19% (€542.86) = €3,400.00'
            },
            lineItems: [
                { description: 'SAP S/4HANA Cloud ERP Enterprise License (EUR)', quantity: 1, unitPrice: '2,857.14', amount: '2,857.14' }
            ]
        }
    },
    {
        _id: 'guest_inv_apollo_04',
        userId: GUEST_USER_ID,
        vendorName: 'Apollo Telemetry Platform',
        senderEmail: 'finance@apollo.in',
        status: 'processed',
        confidenceScore: 95,
        originalFileName: 'apollo-inr-invoice.pdf',
        processedAt: new Date(Date.now() - 3600000 * 72),
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        extractedData: {
            vendorName: 'Apollo Telemetry Platform',
            invoiceNumber: 'APL-IN-98124',
            invoiceDate: '2026-02-28',
            dueDate: '2026-03-28',
            totalAmount: '84,500.00',
            currency: 'INR',
            subtotal: '71,610.17',
            taxAmount: '12,889.83',
            engine: 'Groq LPU AI',
            mathAudit: {
                isValid: true,
                calculatedTotal: '84500.00',
                statedTotal: '84500.00',
                discrepancy: 0,
                summary: 'Reconciled: INR ₹71,610.17 + 18% GST (₹12,889.83) = ₹84,500.00'
            },
            lineItems: [
                { description: 'GraphQL Enterprise Gateway Monitoring (INR)', quantity: 1, unitPrice: '71,610.17', amount: '71,610.17' }
            ]
        }
    }
];

let guestInvoices = [...INITIAL_INVOICES];

export const getGuestInvoices = () => {
    return [...guestInvoices];
};

export const addGuestInvoice = (invoice) => {
    guestInvoices.unshift(invoice);
    return invoice;
};

export const deleteGuestInvoice = (id) => {
    guestInvoices = guestInvoices.filter(inv => inv._id !== id);
    return true;
};

export const clearGuestInvoices = () => {
    guestInvoices = [];
    return true;
};

export const getGuestInvoiceById = (id) => {
    return guestInvoices.find(inv => inv._id === id) || null;
};
