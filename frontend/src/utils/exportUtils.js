/**
 * Utility functions to export invoice data to CSV and JSON files
 */

export function exportToCsv(invoices, filename = 'invoices-export.csv') {
    if (!invoices || invoices.length === 0) return;

    const headers = [
        'Vendor Name',
        'Sender Email',
        'Invoice Number',
        'Invoice Date',
        'Due Date',
        'Total Amount',
        'Status',
        'Confidence Score (%)',
        'Original File',
        'Processed At'
    ];

    const rows = invoices.map(inv => [
        `"${(inv.vendorName || 'Unknown').replace(/"/g, '""')}"`,
        `"${(inv.senderEmail || '').replace(/"/g, '""')}"`,
        `"${(inv.extractedData?.invoiceNumber || '').replace(/"/g, '""')}"`,
        `"${(inv.extractedData?.invoiceDate || '').replace(/"/g, '""')}"`,
        `"${(inv.extractedData?.dueDate || '').replace(/"/g, '""')}"`,
        `"${(inv.extractedData?.totalAmount || '0.00').replace(/"/g, '""')}"`,
        `"${inv.status || ''}"`,
        inv.confidenceScore || 0,
        `"${(inv.originalFileName || '').replace(/"/g, '""')}"`,
        `"${inv.processedAt || inv.createdAt || ''}"`
    ]);

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

export function exportToJson(invoices, filename = 'invoices-export.json') {
    if (!invoices || invoices.length === 0) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
