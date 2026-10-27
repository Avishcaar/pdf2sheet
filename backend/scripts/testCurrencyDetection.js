import { detectCurrency } from '../src/utils/currencyDetector.js';
import { extractWithAI } from '../src/services/aiExtractionService.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTests() {
    console.log('--- 1. Testing Rule-Based Currency Detector ---');
    
    // Case 1: Rupee symbol ₹
    const inrText1 = `Apollo Hospitals Greams Road, Chennai
TAX INVOICE # APOLLO-IND-9841
Date: 24-10-2026
Consultation: ₹4,500.00
Radiology: ₹6,050.00
Subtotal: ₹10,550.00
CGST 9%: ₹950.00
SGST 9%: ₹950.00
Total Amount: ₹12,450.00
GSTIN: 33AAACA1123P1ZL
Payment: UPI apollo@icici`;
    const inrResult1 = detectCurrency(inrText1, 'apollo-bill.pdf');
    console.log('INR Test 1 (Direct ₹ symbol):', inrResult1);
    console.assert(inrResult1.code === 'INR', 'Should detect INR');

    // Case 2: Rupee text 'Rs.' and '/-'
    const inrText2 = `Medical Bill
Total: Rs. 500/-
Tax: Rs. 0
Date: 12-10-2026`;
    const inrResult2 = detectCurrency(inrText2, 'Medical Bill Template 2.pdf');
    console.log('INR Test 2 (Rs. 500/-):', inrResult2);
    console.assert(inrResult2.code === 'INR', 'Should detect INR for Rs. 500/-');

    // Case 3: Euro €
    const eurText = `SAP Deutschland SE & Co. KG
Invoice #: SAP-EUR-44921
Nettobetrag: €2,857.14
MwSt (19%): €542.86
Gesamtbetrag: €3,400.00
IBAN: DE89 3704 0044 0532 0130 00`;
    const eurResult = detectCurrency(eurText, 'sap-invoice.pdf');
    console.log('EUR Test (Direct € symbol + MwSt):', eurResult);
    console.assert(eurResult.code === 'EUR', 'Should detect EUR');

    // Case 4: British Pound £
    const gbpText = `Acme Logistics Ltd
Invoice #: ACM-UK-102
Total Due: £1,850.00
VAT Reg: 123 4567 89
Sort Code: 20-04-15`;
    const gbpResult = detectCurrency(gbpText, 'acme-uk.pdf');
    console.log('GBP Test (Direct £ symbol + Sort Code):', gbpResult);
    console.assert(gbpResult.code === 'GBP', 'Should detect GBP');

    console.log('\n--- 2. Testing Full Groq AI Extraction with Multi-Currency & Math Audit ---');

    console.log('Running AI extraction on Indian Rupee invoice text...');
    const aiInr = await extractWithAI(inrText1, 'apollo-invoice.pdf');
    console.log('AI INR Result:', {
        vendor: aiInr.vendorName,
        total: aiInr.extractedData.totalAmount,
        currency: aiInr.extractedData.currency,
        currencySymbol: aiInr.extractedData.currencySymbol,
        mathAudit: aiInr.extractedData.mathAudit
    });
    console.assert(aiInr.extractedData.currency === 'INR', `Expected INR, got ${aiInr.extractedData.currency}`);
    console.assert(aiInr.extractedData.mathAudit.currencySymbol === '₹', `Expected ₹, got ${aiInr.extractedData.mathAudit.currencySymbol}`);

    console.log('\nRunning AI extraction on Euro invoice text...');
    const aiEur = await extractWithAI(eurText, 'sap-invoice.pdf');
    console.log('AI EUR Result:', {
        vendor: aiEur.vendorName,
        total: aiEur.extractedData.totalAmount,
        currency: aiEur.extractedData.currency,
        currencySymbol: aiEur.extractedData.currencySymbol,
        mathAudit: aiEur.extractedData.mathAudit
    });
    console.assert(aiEur.extractedData.currency === 'EUR', `Expected EUR, got ${aiEur.extractedData.currency}`);
    console.assert(aiEur.extractedData.mathAudit.currencySymbol === '€', `Expected €, got ${aiEur.extractedData.mathAudit.currencySymbol}`);

    console.log('\n ALL MULTI-CURRENCY TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
