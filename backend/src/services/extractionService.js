
import PDFParser from 'pdf2json';
import { detectCurrency } from '../utils/currencyDetector.js';

const DEFAULT_RULES = [
    { targetField: 'invoiceNumber', method: 'keyword_proximity', keyword: 'Invoice Number', searchDirection: 'auto' },
    { targetField: 'invoiceNumber', method: 'keyword_proximity', keyword: 'Invoice #', searchDirection: 'auto' },
    { targetField: 'invoiceNumber', method: 'keyword_proximity', keyword: 'Inv #', searchDirection: 'auto' },
    { targetField: 'invoiceNumber', method: 'keyword_proximity', keyword: '#', searchDirection: 'right' },
    { targetField: 'totalAmount', method: 'keyword_proximity', keyword: 'Total Amount', searchDirection: 'auto' },
    { targetField: 'totalAmount', method: 'keyword_proximity', keyword: 'Grand Total', searchDirection: 'auto' },
    { targetField: 'totalAmount', method: 'keyword_proximity', keyword: 'Total', searchDirection: 'auto' },
    { targetField: 'totalAmount', method: 'keyword_proximity', keyword: 'Amount Due', searchDirection: 'auto' },
    { targetField: 'invoiceDate', method: 'keyword_proximity', keyword: 'Invoice Date', searchDirection: 'auto' },
    { targetField: 'invoiceDate', method: 'keyword_proximity', keyword: 'Date:', searchDirection: 'auto' },
    { targetField: 'invoiceDate', method: 'keyword_proximity', keyword: 'Date', searchDirection: 'auto' },
    { targetField: 'dueDate', method: 'keyword_proximity', keyword: 'Due Date', searchDirection: 'auto' },
    { targetField: 'dueDate', method: 'keyword_proximity', keyword: 'DueDate', searchDirection: 'auto' }
];

export const normalizeDate = (val) => {
    if (!val) return '';
    let cleanVal = String(val).trim();

    cleanVal = cleanVal
        .replace(/Invoice\s*Date[:\s]*/i, '')
        .replace(/Due\s*Date[:\s]*/i, '')
        .replace(/Date[:\s]*/i, '')
        .trim();

    const dmyMatch = cleanVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const d = parseInt(dmyMatch[1], 10);
        const m = parseInt(dmyMatch[2], 10);
        const y = parseInt(dmyMatch[3], 10);
        return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
    }

    const date = new Date(cleanVal);
    if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${d}-${m}-${y}`;
    }

    return val;
};

const cleanExtractedValue = (key, rawValue) => {
    if (!rawValue) return '';
    let val = rawValue.trim();

    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('total')) {
        val = val.replace(/Balance\s*Due[:\s]*/gi, '')
            .replace(/Total\s*Amount[:\s]*/gi, '')
            .replace(/Total[:\s]*/gi, '')
            .replace(/Amount[:\s]*/gi, ' ');

        const matches = val.match(/[\d,]+\.\d{2}/g);

        if (matches && matches.length > 0) {
            const best = matches.reduce((prev, curr) => {
                const pVal = parseFloat(prev.replace(/,/g, ''));
                const cVal = parseFloat(curr.replace(/,/g, ''));
                return (cVal > pVal) ? curr : prev;
            });
            val = best;
        } else {
            val = val.replace(/[^0-9.,-]/g, '');
        }
    }

    if (key === 'invoiceNumber') {
        val = val.replace(/^[:\s#]+/, '')
            .replace(/Invoice\s*#\s*/i, '')
            .replace(/Inv\s*#\s*/i, '')
            .replace(/Invoice\s*No\.?\s*/i, '')
            .replace(/^[:\s#]+/, '')
            .trim();
    }

    if (key.toLowerCase().includes('date')) {
        val = val.replace(/Invoice\s*Date[:\s]*/gi, '')
            .replace(/Due\s*Date[:\s]*/gi, '')
            .replace(/Date[:\s]*/gi, '')
            .replace(/^[:\s]+/, '')
            .trim();
        const std = normalizeDate(val);
        if (std && std.match(/^\d{2}-\d{2}-\d{4}$/)) {
            val = std;
        }
    }

    return val;
};

const assembleLines = (textItems) => {
    if (!textItems || textItems.length === 0) return [];

    const sorted = [...textItems].sort((a, b) => {
        if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
        if (Math.abs(a.y - b.y) > 0.5) return a.y - b.y;
        return a.x - b.x;
    });

    const lines = [];
    let currentLine = [];
    let lastItem = null;

    sorted.forEach(item => {
        if (!lastItem) {
            currentLine.push(item);
        } else {
            const samePage = item.pageIndex === lastItem.pageIndex;
            const sameRow = Math.abs(item.y - lastItem.y) < 0.5;

            if (samePage && sameRow) {
                currentLine.push(item);
            } else {
                lines.push(currentLine);
                currentLine = [item];
            }
        }
        lastItem = item;
    });
    if (currentLine.length > 0) lines.push(currentLine);

    return lines.map(lineItems => {
        const first = lineItems[0];
        const last = lineItems[lineItems.length - 1];

        let fullStr = '';
        let minX = first.x;
        let minY = first.y;
        let maxX = last.x + last.width;
        let maxHeight = 0;

        lineItems.forEach((it, idx) => {
            if (idx > 0) {
                const prev = lineItems[idx - 1];
                const gap = it.x - (prev.x + prev.width);
                if (gap > 0.4) fullStr += ' ';
            }
            fullStr += it.str;
            maxHeight = Math.max(maxHeight, it.height);
        });

        return {
            str: fullStr,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxHeight,
            pageIndex: first.pageIndex
        };
    });
};

export const findCoordinates = (textItems, targetValue, fieldKey = '') => {
    if (!targetValue || !textItems) return null;

    const matchTarget = String(targetValue).trim();
    const isDate = fieldKey.toLowerCase().includes('date');
    const isAmount = fieldKey.toLowerCase().includes('amount') || fieldKey.toLowerCase().includes('total');

    let normTargetDate = null;
    if (isDate) {
        normTargetDate = normalizeDate(matchTarget);
    }

    const isMatch = (str) => {
        const raw = str.trim();
        if (raw === matchTarget) return true;
        if (isDate && normTargetDate) {
            const normRaw = normalizeDate(raw);
            if (normRaw === normTargetDate) return true;
        }
        if (isAmount) {
            const cleanRaw = raw.replace(/[^0-9.]/g, '');
            const cleanTarget = matchTarget.replace(/[^0-9.]/g, '');
            if (cleanRaw && cleanRaw === cleanTarget) return true;
        }
        return false;
    };

    for (const item of textItems) {
        if (isMatch(item.str)) {
            return {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height || 1,
                pageIndex: item.pageIndex
            };
        }
    }

    const assembledLines = assembleLines(textItems);
    for (const line of assembledLines) {
        if (isMatch(line.str)) {
            return {
                x: line.x, y: line.y, width: line.width, height: line.height, pageIndex: line.pageIndex
            };
        }

        const idx = line.str.indexOf(matchTarget);
        if (idx >= 0) {
            const totalLen = line.str.length;
            const targetLen = matchTarget.length;
            const avgCharWidth = line.width / totalLen;

            const subX = line.x + (idx * avgCharWidth);
            const subW = targetLen * avgCharWidth;

            return {
                x: subX,
                y: line.y,
                width: subW,
                height: line.height,
                pageIndex: line.pageIndex
            };
        }
    }
    return null;
};

export const extractTextWithCoordinates = async (buffer) => {
    // 1. Primary Engine: PDFParser (pdf2json) for precise spatial coordinates
    try {
        const result = await new Promise((resolve, reject) => {
            const pdfParser = new PDFParser();
            const timeout = setTimeout(() => reject(new Error('pdf2json Parse Timeout')), 4000);

            pdfParser.on("pdfParser_dataError", errData => {
                clearTimeout(timeout);
                reject(errData?.parserError || new Error('pdf2json parser error'));
            });

            pdfParser.on("pdfParser_dataReady", pdfData => {
                clearTimeout(timeout);
                let fullText = '';
                const textItems = [];

                if (pdfData && pdfData.Pages) {
                    pdfData.Pages.forEach((page, pageIndex) => {
                        if (page.Texts) {
                            page.Texts.forEach(textBlock => {
                                if (textBlock.R) {
                                    textBlock.R.forEach(run => {
                                        let str = '';
                                        try { str = decodeURIComponent(run.T); } catch (e) { str = run.T; }
                                        if (!str || str.trim().length === 0) return;

                                        textItems.push({
                                            str: str,
                                            x: textBlock.x,
                                            y: textBlock.y,
                                            width: textBlock.w,
                                            height: 1,
                                            pageIndex: pageIndex
                                        });
                                    });
                                }
                            });
                        }
                    });
                }

                const lines = assembleLines(textItems);
                fullText = lines.map(l => l.str).join('\n');

                resolve({ fullText, textItems, pageCount: pdfData?.Pages?.length || 1 });
            });

            pdfParser.parseBuffer(buffer);
        });

        if (result && result.fullText && result.fullText.trim().length > 0) {
            return result;
        }
    } catch (primaryErr) {
        console.warn(`[PDF Engine] Primary parser notice (${primaryErr.message || primaryErr}). Falling back to modern PDF engine...`);
    }

    // 2. Resilient Fallback Engine: Mozilla PDF.js via PDFParse (handles all modern PDF 1.7 / xref streams)
    try {
        const { PDFParse } = await import('pdf-parse');
        const uint8 = new Uint8Array(buffer);
        const parser = new PDFParse(uint8);
        const textData = await parser.getText();

        let fullText = '';
        if (textData && textData.pages && textData.pages.length > 0) {
            fullText = textData.pages.map(p => p.text).join('\n');
        } else if (typeof textData === 'string') {
            fullText = textData;
        }

        const textItems = [];
        const lines = fullText.split('\n').filter(l => l.trim().length > 0);
        lines.forEach((line, idx) => {
            textItems.push({
                str: line.trim(),
                x: 10,
                y: 10 + (idx * 2),
                width: line.length,
                height: 1,
                pageIndex: 0
            });
        });

        console.log(`[PDF Engine] Modern parser fallback succeeded: ${fullText.length} characters parsed.`);
        return {
            fullText,
            textItems,
            pageCount: textData?.pages?.length || 1
        };
    } catch (fallbackErr) {
        console.error('[PDF Engine] All PDF extractors failed:', fallbackErr.message);
        return { fullText: '', textItems: [], pageCount: 0 };
    }
};

export const extractData = async (buffer, rules) => {
    try {
        const { textItems, fullText } = await extractTextWithCoordinates(buffer);
        const results = {};
        const activeRules = (rules && rules.length > 0) ? rules : DEFAULT_RULES;

        for (const rule of activeRules) {
            if (results[rule.targetField]) continue;

            if (rule.method === 'coordinate' && rule.coordinates) {
                const { x, y, width, height, pageIndex } = rule.coordinates;

                const matches = textItems.filter(item => {
                    if (item.pageIndex !== pageIndex) return false;

                    const openX = Math.max(x, item.x);
                    const closeX = Math.min(x + width, item.x + item.width);
                    const openY = Math.max(y, item.y);
                    const closeY = Math.min(y + height, item.y + (item.height || 1));

                    if (openX < closeX && openY < closeY) {
                        const intersectionArea = (closeX - openX) * (closeY - openY);
                        const itemArea = item.width * (item.height || 1);
                        return (intersectionArea / itemArea) > 0.3 || (intersectionArea / (width * height)) > 0.5;
                    }
                    return false;
                });

                if (matches.length > 0) {
                    const insideLines = assembleLines(matches);

                    if (insideLines.length > 0) {
                        const parts = insideLines.map(l => l.str);
                        const joinedStr = parts.join(' ');

                        const cleanVal = cleanExtractedValue(rule.targetField, joinedStr);
                        if (cleanVal) {
                            results[rule.targetField] = cleanVal;
                        }
                    }
                }
            }

            else if (rule.method === 'keyword_proximity' && rule.keyword) {
                const lines = assembleLines(textItems);

                const keyLineIndex = lines.findIndex(l => l.str.toLowerCase().includes(rule.keyword.toLowerCase()));

                if (keyLineIndex >= 0) {
                    const keyLine = lines[keyLineIndex];
                    let extractedRaw = '';

                    const cleanLine = keyLine.str.replace(new RegExp(rule.keyword, 'i'), '').trim();
                    if (cleanLine.replace(/[:\-\s]/g, '').length > 0) {
                        extractedRaw = cleanLine;
                    }
                    else if (lines[keyLineIndex + 1]) {
                        const nextLine = lines[keyLineIndex + 1];
                        if (nextLine.pageIndex === keyLine.pageIndex && (nextLine.y - keyLine.y) < 2.0) {
                            extractedRaw = nextLine.str;
                        }
                    }

                    if (extractedRaw) {
                        const cleanVal = cleanExtractedValue(rule.targetField, extractedRaw);
                        if (cleanVal) {
                            results[rule.targetField] = cleanVal;
                        }
                    }
                }
            }
        }

        if (!results.currency && fullText) {
            const detected = detectCurrency(fullText);
            results.currency = detected.code;
        } else if (!results.currency) {
            results.currency = 'USD';
        }

        return { results, textItems, fullText };
    } catch (e) { throw e; }
};

export const calculateConfidence = (extractedData, rules) => {
    if (!extractedData || Object.keys(extractedData).length === 0) return 0;
    if (!rules || rules.length === 0) {
        const foundCount = Object.keys(extractedData).length;
        return Math.min(foundCount * 20, 60);
    }
    const totalFields = rules.length;
    let foundFields = 0;
    rules.forEach(rule => { if (extractedData[rule.targetField]) foundFields++; });
    return Math.round((foundFields / totalFields) * 100);
};
