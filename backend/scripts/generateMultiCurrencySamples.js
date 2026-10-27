import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePdfPath = path.join(__dirname, '../uploads/basicapi.pdf');

async function createInrPdf() {
    const baseBytes = fs.readFileSync(basePdfPath);
    const pdfDoc = await PDFDocument.load(baseBytes);
    while (pdfDoc.getPageCount() > 1) pdfDoc.removePage(1);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Clear background
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText('Apollo Hospitals Enterprises Ltd', { x: 50, y: height - 60, size: 18, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
    page.drawText('Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006', { x: 50, y: height - 80, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('GSTIN: 33AAACA1123P1ZL | PAN: AAACA1123P | UPI: apollo@icici', { x: 50, y: height - 95, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

    // Title & Invoice Info
    page.drawText('TAX INVOICE', { x: 440, y: height - 60, size: 16, font: fontBold, color: rgb(0.2, 0.5, 0.2) });
    page.drawText('Invoice #: APOLLO-IND-9841', { x: 420, y: height - 80, size: 10, font: fontBold });
    page.drawText('Date: 24-10-2026', { x: 420, y: height - 95, size: 10, font });
    page.drawText('Due Date: 07-11-2026', { x: 420, y: height - 110, size: 10, font });

    // Horizontal Divider
    page.drawLine({ start: { x: 50, y: height - 130 }, end: { x: 550, y: height - 130 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    // Table Header
    page.drawRectangle({ x: 50, y: height - 165, width: 500, height: 25, color: rgb(0.95, 0.95, 0.98) });
    page.drawText('Description', { x: 60, y: height - 155, size: 10, font: fontBold });
    page.drawText('Qty', { x: 330, y: height - 155, size: 10, font: fontBold });
    page.drawText('Unit Price (INR)', { x: 380, y: height - 155, size: 10, font: fontBold });
    page.drawText('Amount (INR)', { x: 470, y: height - 155, size: 10, font: fontBold });

    // Line 1
    page.drawText('Specialist Medical Consultation & Diagnostic', { x: 60, y: height - 190, size: 10, font });
    page.drawText('1', { x: 340, y: height - 190, size: 10, font });
    page.drawText('Rs. 4,500.00', { x: 390, y: height - 190, size: 10, font });
    page.drawText('Rs. 4,500.00', { x: 470, y: height - 190, size: 10, font });

    // Line 2
    page.drawText('Radiology & Contrast MRI Scan (Brain & Spine)', { x: 60, y: height - 215, size: 10, font });
    page.drawText('1', { x: 340, y: height - 215, size: 10, font });
    page.drawText('Rs. 6,050.00', { x: 390, y: height - 215, size: 10, font });
    page.drawText('Rs. 6,050.00', { x: 470, y: height - 215, size: 10, font });

    // Line Divider
    page.drawLine({ start: { x: 50, y: height - 235 }, end: { x: 550, y: height - 235 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

    // Totals
    page.drawText('Subtotal:', { x: 380, y: height - 260, size: 10, font });
    page.drawText('Rs. 10,550.00', { x: 470, y: height - 260, size: 10, font });

    page.drawText('CGST (9%):', { x: 380, y: height - 280, size: 10, font });
    page.drawText('Rs. 950.00', { x: 470, y: height - 280, size: 10, font });

    page.drawText('SGST (9%):', { x: 380, y: height - 300, size: 10, font });
    page.drawText('Rs. 950.00', { x: 470, y: height - 300, size: 10, font });

    // Grand Total Box
    page.drawRectangle({ x: 370, y: height - 340, width: 180, height: 30, color: rgb(0.9, 0.95, 0.9) });
    page.drawText('Total Amount Due:', { x: 380, y: height - 330, size: 11, font: fontBold, color: rgb(0.1, 0.4, 0.1) });
    page.drawText('Rs. 12,450.00', { x: 470, y: height - 330, size: 11, font: fontBold, color: rgb(0.1, 0.4, 0.1) });

    // Indian Rupee text
    page.drawText('Currency: INR (Indian Rupees - Rs. 12,450/- only)', { x: 50, y: height - 380, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Payment Instructions: Remit to Apollo Hospitals via NEFT / UPI ID: apollo@icici', { x: 50, y: height - 400, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

    return await pdfDoc.save();
}

async function createEurPdf() {
    const baseBytes = fs.readFileSync(basePdfPath);
    const pdfDoc = await PDFDocument.load(baseBytes);
    while (pdfDoc.getPageCount() > 1) pdfDoc.removePage(1);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Clear background
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText('SAP Deutschland SE & Co. KG', { x: 50, y: height - 60, size: 18, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
    page.drawText('Hasso-Plattner-Ring 7, 69190 Walldorf, Germany', { x: 50, y: height - 80, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('USt-IdNr.: DE 143454247 | WEEE-Reg.-Nr. DE 70355461', { x: 50, y: height - 95, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

    // Title & Invoice Info
    page.drawText('RECHNUNG / INVOICE', { x: 400, y: height - 60, size: 15, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
    page.drawText('Invoice #: SAP-EUR-44921', { x: 400, y: height - 80, size: 10, font: fontBold });
    page.drawText('Date: 15-10-2026', { x: 400, y: height - 95, size: 10, font });
    page.drawText('Due Date: 30-10-2026', { x: 400, y: height - 110, size: 10, font });

    // Horizontal Divider
    page.drawLine({ start: { x: 50, y: height - 130 }, end: { x: 550, y: height - 130 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    // Table Header
    page.drawRectangle({ x: 50, y: height - 165, width: 500, height: 25, color: rgb(0.95, 0.95, 0.98) });
    page.drawText('Description', { x: 60, y: height - 155, size: 10, font: fontBold });
    page.drawText('Qty', { x: 330, y: height - 155, size: 10, font: fontBold });
    page.drawText('Unit Price (EUR)', { x: 380, y: height - 155, size: 10, font: fontBold });
    page.drawText('Amount (EUR)', { x: 470, y: height - 155, size: 10, font: fontBold });

    // Line 1
    page.drawText('SAP S/4HANA Cloud Subscription - Enterprise Tier', { x: 60, y: height - 190, size: 10, font });
    page.drawText('1', { x: 340, y: height - 190, size: 10, font });
    page.drawText('EUR 2,857.14', { x: 385, y: height - 190, size: 10, font });
    page.drawText('EUR 2,857.14', { x: 470, y: height - 190, size: 10, font });

    // Line Divider
    page.drawLine({ start: { x: 50, y: height - 215 }, end: { x: 550, y: height - 215 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

    // Totals
    page.drawText('Nettobetrag (Subtotal):', { x: 330, y: height - 240, size: 10, font });
    page.drawText('EUR 2,857.14', { x: 470, y: height - 240, size: 10, font });

    page.drawText('MwSt (19.0% VAT):', { x: 330, y: height - 260, size: 10, font });
    page.drawText('EUR 542.86', { x: 470, y: height - 260, size: 10, font });

    // Grand Total Box
    page.drawRectangle({ x: 320, y: height - 300, width: 230, height: 30, color: rgb(0.9, 0.93, 0.98) });
    page.drawText('Gesamtbetrag (Total):', { x: 330, y: height - 290, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.6) });
    page.drawText('EUR 3,400.00', { x: 470, y: height - 290, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.6) });

    // SEPA wire details
    page.drawText('Currency: EUR (Euro)', { x: 50, y: height - 340, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('SEPA Bank Details: Deutsche Bank AG | BIC: DEUTDEDBFRA', { x: 50, y: height - 360, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('IBAN: DE89 3704 0044 0532 0130 00', { x: 50, y: height - 375, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });

    return await pdfDoc.save();
}

async function main() {
    const inrBytes = await createInrPdf();
    const eurBytes = await createEurPdf();

    const targets = [
        path.join(__dirname, '../../frontend/public/samples'),
        path.join(__dirname, '../../frontend/dist/samples'),
        path.join(__dirname, '../uploads/samples')
    ];

    for (const dir of targets) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'apollo-inr-invoice.pdf'), inrBytes);
        fs.writeFileSync(path.join(dir, 'sap-eur-invoice.pdf'), eurBytes);
        console.log(`Saved sample PDFs to ${dir}`);
    }
}

main().catch(err => {
    console.error('Failed to generate multi-currency samples:', err);
    process.exit(1);
});
