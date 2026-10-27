/**
 * Currency Symbol & Context Detection Engine
 * Accurately detects currency from symbols (₹, €, £, $, ¥), abbreviations (INR, EUR, GBP, USD),
 * and jurisdictional tax markers (GSTIN, CGST, SGST, MwSt, TVA, VAT, SEPA, UPI).
 */

export const CURRENCY_MAP = {
    INR: {
        code: 'INR',
        symbol: '₹',
        name: 'Indian Rupee',
        symbols: ['₹', 'rs.', 'rs ', 'inr', 'rupees', 'rupee', '/-'],
        taxMarkers: ['gstin', 'cgst', 'sgst', 'igst', 'pan no', 'pan:', 'upi', 'lakh', 'crore', 'pincode', 'pin code']
    },
    EUR: {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        symbols: ['€', 'eur', 'euro', 'euros'],
        taxMarkers: ['iban', 'bic', 'sepa', 'mwst', 'tva', 'ust.', 'btw', 'iva']
    },
    GBP: {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        symbols: ['£', 'gbp', 'pound', 'pounds', 'sterling'],
        taxMarkers: ['sort code', 'vat reg', 'hmrc']
    },
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        symbols: ['$', 'usd', 'us$', 'dollar', 'dollars'],
        taxMarkers: ['ein:', 'ein ', 'ssn', 'routing number', 'zip code', 'delaware']
    },
    CAD: {
        code: 'CAD',
        symbol: 'CA$',
        name: 'Canadian Dollar',
        symbols: ['ca$', 'cad', 'c$'],
        taxMarkers: ['gst/hst', 'hst', 'pst', 'cra']
    },
    AUD: {
        code: 'AUD',
        symbol: 'A$',
        name: 'Australian Dollar',
        symbols: ['a$', 'aud'],
        taxMarkers: ['abn:', 'abn ', 'acn', 'bas']
    },
    JPY: {
        code: 'JPY',
        symbol: '¥',
        name: 'Japanese Yen',
        symbols: ['¥', 'jpy', 'yen'],
        taxMarkers: ['消費税', 'japan']
    }
};

/**
 * Analyzes raw document text and filename to determine the invoice currency with confidence.
 * @param {string} text - Extracted document text
 * @param {string} fileName - File name if available
 * @returns {{ code: string, symbol: string, confidence: number, detectedBy: string }}
 */
export const detectCurrency = (text = '', fileName = '') => {
    if (!text && !fileName) {
        return { code: 'USD', symbol: '$', confidence: 50, detectedBy: 'Default Fallback' };
    }

    const combined = `${fileName} ${text}`.toLowerCase();

    // 1. Check for distinct non-ambiguous unicode symbols
    if (text.includes('₹') || text.includes('\u20B9') || text.includes('\u20A8')) {
        return { code: 'INR', symbol: '₹', confidence: 99, detectedBy: 'Direct Rupee Symbol (₹)' };
    }
    if (text.includes('€') || text.includes('\u20AC')) {
        return { code: 'EUR', symbol: '€', confidence: 99, detectedBy: 'Direct Euro Symbol (€)' };
    }
    if (text.includes('£') || text.includes('\u00A3')) {
        return { code: 'GBP', symbol: '£', confidence: 99, detectedBy: 'Direct Pound Symbol (£)' };
    }
    if (text.includes('¥') || text.includes('\u00A5')) {
        return { code: 'JPY', symbol: '¥', confidence: 99, detectedBy: 'Direct Yen Symbol (¥)' };
    }

    // 2. Score by symbol occurrences & tax markers
    const scores = {
        INR: 0,
        EUR: 0,
        GBP: 0,
        USD: 0,
        CAD: 0,
        AUD: 0,
        JPY: 0
    };

    // INR Scoring
    if (/\b(inr|rs\.?|rupees?)\b/i.test(combined)) scores.INR += 5;
    if (/\d+\s*\/-/.test(text)) scores.INR += 4; // e.g. 500/-
    if (/gstin|cgst|sgst|igst/i.test(combined)) scores.INR += 6;
    if (/\bupi\b/i.test(combined)) scores.INR += 3;

    // EUR Scoring
    if (/\b(eur|euros?)\b/i.test(combined)) scores.EUR += 5;
    if (/iban|bic|sepa|mwst|tva|ust\./i.test(combined)) scores.EUR += 6;

    // GBP Scoring
    if (/\b(gbp|pounds?|sterling)\b/i.test(combined)) scores.GBP += 5;
    if (/sort code|vat reg/i.test(combined)) scores.GBP += 5;

    // CAD Scoring
    if (/\b(cad|c\$|ca\$)\b/i.test(combined)) scores.CAD += 5;
    if (/gst\/hst|hst|pst/i.test(combined)) scores.CAD += 5;

    // AUD Scoring
    if (/\b(aud|a\$)\b/i.test(combined)) scores.AUD += 5;
    if (/\babn\b/i.test(combined)) scores.AUD += 5;

    // JPY Scoring
    if (/\b(jpy|yen)\b/i.test(combined)) scores.JPY += 5;

    // USD Scoring
    if (/\b(usd|us\$)\b/i.test(combined)) scores.USD += 5;
    if (text.includes('$')) scores.USD += 3;
    if (/routing number|delaware|ein/i.test(combined)) scores.USD += 4;

    // Find highest scoring currency
    let bestCurrency = 'USD';
    let highestScore = 0;

    for (const [curr, score] of Object.entries(scores)) {
        if (score > highestScore) {
            highestScore = score;
            bestCurrency = curr;
        }
    }

    if (highestScore > 0) {
        const info = CURRENCY_MAP[bestCurrency];
        return {
            code: bestCurrency,
            symbol: info.symbol,
            confidence: Math.min(60 + highestScore * 5, 98),
            detectedBy: `Contextual Pattern Scoring (${bestCurrency}: score ${highestScore})`
        };
    }

    // Default fallback
    return {
        code: 'USD',
        symbol: '$',
        confidence: 60,
        detectedBy: 'Default Fallback ($)'
    };
};
