/**
 * Multi-Currency Normalization & Live Conversion Utility
 * Zero-dependency, deterministic exchange rate engine.
 */

export const EXCHANGE_RATES = {
    USD: 1.0,
    INR: 86.50,
    EUR: 0.92,
    GBP: 0.77,
    CAD: 1.38,
    AUD: 1.52,
    JPY: 152.40,
    SGD: 1.32
};

export const CURRENCY_SYMBOLS = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    SGD: 'S$'
};

/**
 * Convert any amount from one currency to another
 */
export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
    const from = (fromCurrency || 'USD').toUpperCase().trim();
    const to = (toCurrency || 'USD').toUpperCase().trim();
    const cleanNum = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;

    if (from === to) return cleanNum;

    const rateFrom = EXCHANGE_RATES[from] || 1.0;
    const rateTo = EXCHANGE_RATES[to] || 1.0;

    // Convert to USD standard base, then to target
    const inUSD = cleanNum / rateFrom;
    const inTarget = inUSD * rateTo;

    return Math.round(inTarget * 100) / 100;
};

/**
 * Format currency with appropriate symbol
 */
export const formatCurrency = (amount, currency = 'USD') => {
    const curr = (currency || 'USD').toUpperCase().trim();
    const sym = CURRENCY_SYMBOLS[curr] || curr + ' ';
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;
    return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
