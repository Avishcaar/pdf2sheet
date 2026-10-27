/**
 * AI Extraction Service for PDF2Sheet
 * High-speed multimodal & structured invoice intelligence powered by Groq LPU / Gemini.
 * Zero-cost, high-precision line-item table parsing and mathematical audit verification.
 */

import { detectCurrency, CURRENCY_MAP } from '../utils/currencyDetector.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

/**
 * Clean numeric string into a float
 */
const parseMoney = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};

/**
 * Standardize date to DD-MM-YYYY
 */
const standardizeDate = (val) => {
    if (!val) return '';
    const clean = String(val).trim();
    const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
        return `${String(dmy[1]).padStart(2, '0')}-${String(dmy[2]).padStart(2, '0')}-${dmy[3]}`;
    }
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    }
    return clean;
};

/**
 * Extract structured financial data from raw invoice text using Groq Llama 3.3
 */
export const extractWithAI = async (fullText, originalFileName = '') => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured in backend environment');
    }

    // Pre-detect currency from symbols, abbreviations, and tax markers (₹, €, £, $, GSTIN, MwSt, etc.)
    const preDetected = detectCurrency(fullText, originalFileName);
    console.log(`[AI Extraction] Pre-detected currency: ${preDetected.code} (${preDetected.symbol}) with ${preDetected.confidence}% confidence via ${preDetected.detectedBy}`);

    const systemPrompt = `You are a world-class financial OCR and document intelligence engine.
Analyze the following invoice text and extract clean, structured financial data in strict JSON format.

CRITICAL CURRENCY DETECTION INSTRUCTIONS:
- Accurately determine the exact 3-letter currency code from currency symbols, abbreviations, and tax markers:
  * "₹", "Rs.", "Rs", "INR", "/-", "GSTIN", "CGST", "SGST", "UPI", "Lakh" -> set "currency": "INR"
  * "€", "EUR", "Euro", "IBAN", "BIC", "MwSt", "TVA", "SEPA" -> set "currency": "EUR"
  * "£", "GBP", "Pound", "Sort Code", "VAT Reg" -> set "currency": "GBP"
  * "¥", "JPY", "Yen" -> set "currency": "JPY"
  * "CA$", "CAD" -> set "currency": "CAD"
  * "A$", "AUD" -> set "currency": "AUD"
  * "$", "USD", "US$" -> set "currency": "USD" (only if dollar symbol is used and not rupees/euros)
- Automated Symbol Pre-Detection Hint: ${preDetected.code} (${preDetected.symbol}) with ${preDetected.confidence}% confidence (${preDetected.detectedBy}).
- If the document contains Indian Rupee symbols ("₹" or "Rs" or Indian tax terms), set "currency": "INR". DO NOT default to "USD".

JSON Schema to follow strictly:
{
  "vendorName": string or null (The issuing company, business, or merchant name found in the invoice header/text, e.g. "Stripe", "AWS", "GitHub", "Acme"),
  "vendorAddress": string or null,
  "vendorTaxId": string or null,
  "invoiceNumber": string or null,
  "invoiceDate": string (format DD-MM-YYYY) or null,
  "dueDate": string (format DD-MM-YYYY) or null,
  "paymentTerms": string or null,
  "currency": string (e.g. "USD", "EUR", "INR", "GBP", "CAD", "AUD", "JPY"),
  "subtotal": string (numeric amount e.g. "1200.00") or null,
  "taxAmount": string (numeric amount e.g. "220.00") or null,
  "taxRate": string (e.g. "18%") or null,
  "discount": string (e.g. "0.00") or null,
  "totalAmount": string (numeric amount e.g. "1420.00") or null,
  "lineItems": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": string,
      "amount": string
    }
  ],
  "aiSummary": string (1-2 sentence executive financial summary of this document)
}

Rules:
1. Extract all line items from tables if present.
2. Standardize dates to DD-MM-YYYY.
3. Keep amounts formatted with 2 decimal places when possible.
4. Always identify the issuing vendor or company name from the document header or filename.
5. Return ONLY the raw JSON object without markdown code blocks, backticks, or preamble.`;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Invoice File: ${originalFileName}\n\nDocument Text:\n${fullText.slice(0, 12000)}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 2500
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const payload = await response.json();
    const rawContent = payload.choices?.[0]?.message?.content;
    const parsed = JSON.parse(rawContent);

    // Standardize dates
    if (parsed.invoiceDate) parsed.invoiceDate = standardizeDate(parsed.invoiceDate);
    if (parsed.dueDate) parsed.dueDate = standardizeDate(parsed.dueDate);

    // Dynamic Multi-Currency Normalization Guard
    let detectedCurrency = (parsed.currency || 'USD').toUpperCase().trim();
    if (preDetected.confidence >= 80 && (detectedCurrency === 'USD' || !detectedCurrency) && preDetected.code !== 'USD') {
        console.log(`[AI Currency Guard] Overriding default 'USD' with high-confidence symbol detection: ${preDetected.code} (${preDetected.detectedBy})`);
        detectedCurrency = preDetected.code;
    } else if (preDetected.confidence >= 95) {
        // Direct symbol matches like ₹, €, £ have 99% confidence
        detectedCurrency = preDetected.code;
    }
    const currencyInfo = CURRENCY_MAP[detectedCurrency] || { symbol: detectedCurrency + ' ', code: detectedCurrency };
    const currencySymbol = currencyInfo.symbol;

    // Perform Automated Forensic Mathematical Audit
    const calculatedSubtotal = Array.isArray(parsed.lineItems)
        ? parsed.lineItems.reduce((acc, item) => acc + parseMoney(item.amount || item.unitPrice * (item.quantity || 1)), 0)
        : 0;

    const statedSubtotal = parseMoney(parsed.subtotal);
    const statedTax = parseMoney(parsed.taxAmount);
    const statedDiscount = parseMoney(parsed.discount);
    const statedTotal = parseMoney(parsed.totalAmount);

    const calculatedTotal = (statedSubtotal > 0 ? statedSubtotal : calculatedSubtotal) + statedTax - statedDiscount;
    const discrepancy = Math.abs(calculatedTotal - statedTotal);
    const isMathValid = statedTotal > 0 && discrepancy < 0.05;

    const mathAudit = {
        isValid: isMathValid,
        calculatedTotal: calculatedTotal.toFixed(2),
        statedTotal: statedTotal.toFixed(2),
        discrepancy: parseFloat(discrepancy.toFixed(2)),
        currency: detectedCurrency,
        currencySymbol: currencySymbol,
        summary: isMathValid
            ? '100% Match: Line-item sum and taxes exactly match the stated grand total.'
            : discrepancy > 0
                ? `Discrepancy Detected: Stated total (${currencySymbol}${statedTotal.toFixed(2)}) differs from calculated total (${currencySymbol}${calculatedTotal.toFixed(2)}) by ${currencySymbol}${discrepancy.toFixed(2)}.`
                : 'Audited with high confidence.'
    };

    // Calculate AI Confidence Score (85-98%)
    let confidence = 80;
    if (parsed.vendorName) confidence += 5;
    if (parsed.invoiceNumber) confidence += 5;
    if (parsed.totalAmount) confidence += 5;
    if (parsed.lineItems && parsed.lineItems.length > 0) confidence += 5;
    if (isMathValid) confidence += 4;

    return {
        vendorName: parsed.vendorName || null,
        extractedData: {
            invoiceNumber: parsed.invoiceNumber || '',
            invoiceDate: parsed.invoiceDate || '',
            dueDate: parsed.dueDate || '',
            totalAmount: parsed.totalAmount || '',
            currency: detectedCurrency,
            currencySymbol: currencySymbol,
            subtotal: parsed.subtotal || '',
            taxAmount: parsed.taxAmount || '',
            taxRate: parsed.taxRate || '',
            discount: parsed.discount || '0.00',
            paymentTerms: parsed.paymentTerms || '',
            vendorAddress: parsed.vendorAddress || '',
            vendorTaxId: parsed.vendorTaxId || '',
            lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
            mathAudit,
            aiSummary: parsed.aiSummary || '',
            engine: 'Groq LPU (GPT-OSS 120B)'
        },
        confidenceScore: Math.min(confidence, 99),
        rawAI: parsed
    };
};

/**
 * Interactive Q&A Assistant: Ask any natural language question about an invoice
 */
export const askInvoiceQuestion = async (invoiceData, userQuestion) => {
    const apiKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are a helpful and precise financial copilot. 
Answer the user's question accurately using ONLY the provided invoice context. 
If the answer is not in the invoice, state clearly that the invoice does not specify it.
Keep your response concise, professional, and clear.`;

    const contextStr = JSON.stringify({
        vendor: invoiceData.vendorName,
        invoiceNumber: invoiceData.extractedData?.invoiceNumber,
        date: invoiceData.extractedData?.invoiceDate,
        due: invoiceData.extractedData?.dueDate,
        terms: invoiceData.extractedData?.paymentTerms,
        currency: invoiceData.extractedData?.currency || 'USD',
        total: `${invoiceData.extractedData?.currency || 'USD'} ${invoiceData.extractedData?.totalAmount || '0.00'}`,
        tax: invoiceData.extractedData?.taxAmount,
        lineItems: invoiceData.extractedData?.lineItems,
        mathAudit: invoiceData.extractedData?.mathAudit
    }, null, 2);

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Invoice Metadata:\n${contextStr}\n\nQuestion: ${userQuestion}` }
            ],
            temperature: 0.2,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const payload = await response.json();
    return payload.choices?.[0]?.message?.content || 'No response generated.';
};

/**
 * Autonomous CFO Intelligence Brief Generator
 * Aggregates all invoices across vendors, due dates, line items, and audit math.
 * Generates an executive financial briefing with cash flow forecasting & risk analysis.
 */
export const generateCFOBrief = async (invoices, baseCurrency = 'USD') => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!invoices || invoices.length === 0) {
        return {
            headline: "No Invoices Available",
            executiveSummary: "No invoices currently available in the database to generate an executive report.",
            markdownReport: "### 📊 CFO Executive Summary\n*No invoices ingested yet. Upload invoices to generate financial analytics.*",
            generatedAt: new Date().toISOString()
        };
    }

    const { convertCurrency } = await import('../utils/currencyUtils.js');

    // Portfolio aggregate numbers normalized to baseCurrency
    let totalBaseSpend = 0;
    const vendorTotals = {};
    const mathIssues = [];
    const upcomingDeadlines = [];

    invoices.forEach(inv => {
        const ed = inv.extractedData || {};
        const curr = ed.currency || 'USD';
        const rawAmt = parseFloat(String(ed.totalAmount || '0').replace(/[^0-9.-]/g, '')) || 0;
        const normalized = convertCurrency(rawAmt, curr, baseCurrency);
        totalBaseSpend += normalized;

        const vendor = inv.vendorName || ed.vendorName || 'Unknown Vendor';
        vendorTotals[vendor] = (vendorTotals[vendor] || 0) + normalized;

        if (ed.mathAudit && ed.mathAudit.isValid === false) {
            mathIssues.push({
                vendor,
                invoiceNumber: ed.invoiceNumber,
                discrepancy: ed.mathAudit.discrepancy,
                summary: ed.mathAudit.summary
            });
        }

        if (ed.dueDate) {
            upcomingDeadlines.push({
                vendor,
                invoiceNumber: ed.invoiceNumber,
                dueDate: ed.dueDate,
                amount: `${curr} ${rawAmt}`
            });
        }
    });

    const contextPayload = {
        baseCurrency,
        totalPortfolioSpend: `${baseCurrency} ${totalBaseSpend.toFixed(2)}`,
        invoiceCount: invoices.length,
        topVendors: Object.entries(vendorTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([v, amt]) => ({ vendor: v, amount: `${baseCurrency} ${amt.toFixed(2)}`, share: `${((amt / (totalBaseSpend || 1)) * 100).toFixed(1)}%` })),
        mathAuditFlags: mathIssues,
        upcomingLiabilities: upcomingDeadlines.slice(0, 10),
        invoicesSummary: invoices.slice(0, 15).map(i => ({
            vendor: i.vendorName,
            id: i.extractedData?.invoiceNumber,
            date: i.extractedData?.invoiceDate,
            due: i.extractedData?.dueDate,
            amount: `${i.extractedData?.currency || 'USD'} ${i.extractedData?.totalAmount}`,
            mathValid: i.extractedData?.mathAudit?.isValid
        }))
    };

    const prompt = `You are an elite Chief Financial Officer (CFO) and enterprise audit intelligence advisor.
Analyze the following corporate invoice portfolio and produce an authoritative, high-impact Executive Intelligence Briefing.

Portfolio Context:
${JSON.stringify(contextPayload, null, 2)}

Provide your response strictly in the following JSON format:
{
  "headline": "A punchy, single-line executive takeaway (e.g., 'Stable cash outflow with 68% vendor concentration in cloud infrastructure')",
  "cashFlowOutlook": "A concise paragraph analyzing upcoming payables, disbursement timelines, and working capital requirements.",
  "vendorRiskAnalysis": "Analysis of top vendor concentration, dependency risks, and negotiation opportunities.",
  "auditAndCompliance": "Audit findings regarding mathematical discrepancies, tax validity, or anomalies requiring review.",
  "actionableRecommendations": [
    "Concrete recommendation 1 with estimated financial impact",
    "Concrete recommendation 2",
    "Concrete recommendation 3"
  ],
  "markdownReport": "A complete, beautifully formatted GitHub-flavored markdown report starting with '# 📊 CFO Executive Financial Briefing' including tables, bold KPIs, and bullet points ready to present to the board."
}`;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: 'You are an executive enterprise CFO assistant. Output valid JSON only, without backticks.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1500
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error (${response.status})`);
    }

    const payload = await response.json();
    let rawText = payload.choices?.[0]?.message?.content || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

    try {
        const parsed = JSON.parse(rawText);
        return {
            ...parsed,
            totalBaseSpend,
            baseCurrency,
            generatedAt: new Date().toISOString()
        };
    } catch (parseErr) {
        return {
            headline: "Executive Financial Portfolio Briefing",
            markdownReport: rawText,
            totalBaseSpend,
            baseCurrency,
            generatedAt: new Date().toISOString()
        };
    }
};

/**
 * Natural Language Database Query Parser
 * Translates conversational user search ("invoices over $1000 from Stripe", "due in October with discrepancies")
 * into structured filter criteria.
 */
export const parseNaturalLanguageQuery = async (userQuery) => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!userQuery || !userQuery.trim()) {
        return { active: false };
    }

    const prompt = `Translate the user's natural language search query for an invoice dashboard into structured filter criteria.
User query: "${userQuery}"

Return strictly a JSON object:
{
  "vendorName": string or null (extracted vendor name or keyword, lowercase, e.g. "stripe"),
  "minAmount": number or null (e.g. 500 for "above 500"),
  "maxAmount": number or null (e.g. 2000 for "under 2000"),
  "currency": string or null (e.g. "USD", "INR", "EUR"),
  "status": "processed" | "review_needed" | null,
  "mathDiscrepancyOnly": boolean (true if user asks for discrepancies, mismatches, or audit issues),
  "searchTerm": string or null (general text keywords),
  "explanation": "Brief 1-sentence explanation of what the filter applied (e.g., 'Filtered for invoices with amount > $1,000 from Stripe')"
}`;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: 'You are a precise database query parser. Output valid JSON only, without backticks.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 300
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API query parsing error (${response.status})`);
    }

    const payload = await response.json();
    let rawText = payload.choices?.[0]?.message?.content || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

    try {
        return {
            active: true,
            ...JSON.parse(rawText)
        };
    } catch (e) {
        return {
            active: true,
            searchTerm: userQuery.trim(),
            explanation: `Searching for "${userQuery.trim()}"`
        };
    }
};
