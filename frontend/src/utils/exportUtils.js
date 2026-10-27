/**
 * Utility functions to export invoice data to CSV and JSON files
 * Enhanced for Enterprise Financial Audit with Math Verification and Line-Item Breakdown
 */
import { CURRENCY_SYMBOLS } from './currencyUtils.js';

export function exportToCsv(invoices, filename = 'invoices-audit-export.csv') {
    if (!invoices || invoices.length === 0) return;

    const headers = [
        'Vendor Name',
        'Sender Email',
        'Invoice Number',
        'Invoice Date',
        'Due Date',
        'Currency',
        'Subtotal',
        'Tax Amount',
        'Total Amount',
        'Math Audit Status',
        'Math Discrepancy',
        'Math Audit Summary',
        'AI Engine',
        'Line Items Count',
        'Line Items Summary',
        'AI Summary',
        'Status',
        'Confidence Score (%)',
        'Original File',
        'Processed At'
    ];

    const rows = invoices.map(inv => {
        const ext = inv.extractedData || {};
        const curr = (ext.currency || 'USD').toUpperCase();
        const sym = CURRENCY_SYMBOLS[curr] || '$';
        const audit = ext.mathAudit || {};
        const items = ext.lineItems || [];
        const itemsSummary = items
            .map(it => `${it.quantity || 1}x ${it.description || 'Item'} (${sym}${it.amount || it.unitPrice || '0'})`)
            .join('; ');
        const auditStatus = audit.isValid === true ? 'VERIFIED' : audit.isValid === false ? 'DISCREPANCY' : 'UNCHECKED';

        return [
            `"${(inv.vendorName || 'Unknown').replace(/"/g, '""')}"`,
            `"${(inv.senderEmail || '').replace(/"/g, '""')}"`,
            `"${(ext.invoiceNumber || '').replace(/"/g, '""')}"`,
            `"${(ext.invoiceDate || '').replace(/"/g, '""')}"`,
            `"${(ext.dueDate || '').replace(/"/g, '""')}"`,
            `"${(ext.currency || 'USD').replace(/"/g, '""')}"`,
            `"${(ext.subtotal || '').replace(/"/g, '""')}"`,
            `"${(ext.taxAmount || '').replace(/"/g, '""')}"`,
            `"${(ext.totalAmount || '0.00').replace(/"/g, '""')}"`,
            `"${auditStatus}"`,
            `"${audit.discrepancy !== undefined ? sym + audit.discrepancy : sym + '0.00'}"`,
            `"${(audit.summary || '').replace(/"/g, '""')}"`,
            `"${(ext.engine || 'Groq LPU / Spatial').replace(/"/g, '""')}"`,
            items.length,
            `"${itemsSummary.replace(/"/g, '""')}"`,
            `"${(ext.aiSummary || '').replace(/"/g, '""')}"`,
            `"${inv.status || ''}"`,
            inv.confidenceScore || 0,
            `"${(inv.originalFileName || '').replace(/"/g, '""')}"`,
            `"${inv.processedAt || inv.createdAt || ''}"`
        ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportToJson(invoices, filename = 'invoices-audit-export.json') {
    if (!invoices || invoices.length === 0) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
