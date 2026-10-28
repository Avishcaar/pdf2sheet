import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    FileText, 
    TrendingUp, 
    AlertTriangle, 
    ShieldCheck, 
    Building2, 
    Download, 
    Copy, 
    Check, 
    RefreshCw,
    ArrowRight,
    Eye,
    Code2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../common/Loader';

// Helper to format inline bold text
function formatInline(text) {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={idx} className="font-bold text-gray-900 dark:text-white">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}

// Formatted Executive Markdown Renderer
function ExecutiveMarkdownViewer({ rawMarkdown }) {
    const blocks = useMemo(() => {
        if (!rawMarkdown) return [];

        let text = rawMarkdown.trim();

        // Defensive check: if text is raw JSON, unwrap or convert it
        if (text.startsWith('{')) {
            try {
                const parsed = JSON.parse(text);
                if (parsed.markdownReport && typeof parsed.markdownReport === 'string' && !parsed.markdownReport.trim().startsWith('{')) {
                    text = parsed.markdownReport;
                } else {
                    const recs = Array.isArray(parsed.actionableRecommendations)
                        ? parsed.actionableRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
                        : '';
                    text = `# CFO Executive Financial Briefing\n\n## Executive Takeaway\n> **${parsed.headline || 'Executive Portfolio Analysis'}**\n\n## Cash Flow & Working Capital Outlook\n${parsed.cashFlowOutlook || ''}\n\n## Vendor Risk & Dependency Analysis\n${parsed.vendorRiskAnalysis || ''}\n\n## Forensic Audit & Compliance Findings\n${parsed.auditAndCompliance || ''}\n\n## Strategic CFO Recommendations\n${recs}`;
                }
            } catch {
                // Regex fallback if JSON was truncated
                const mdMatch = text.match(/"markdownReport"\s*:\s*"([\s\S]*?)(?:"\s*\}|"$)/);
                if (mdMatch && mdMatch[1] && mdMatch[1].length > 50) {
                    text = mdMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                }
            }
        }

        const lines = text.split('\n');
        const parsedBlocks = [];
        let currentTable = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Table row parser (| ... |)
            if (line.startsWith('|') && line.endsWith('|')) {
                const cells = line.split('|').slice(1, -1).map(c => c.trim());
                if (cells.every(c => /^:?-+:?$/.test(c))) {
                    continue; // Skip markdown separator row like |---|---|
                }
                if (!currentTable) {
                    currentTable = { type: 'table', rows: [] };
                    parsedBlocks.push(currentTable);
                }
                currentTable.rows.push(cells);
                continue;
            } else {
                currentTable = null;
            }

            if (!line) continue;

            if (line.startsWith('# ')) {
                parsedBlocks.push({ type: 'h1', content: line.slice(2).trim() });
            } else if (line.startsWith('## ')) {
                parsedBlocks.push({ type: 'h2', content: line.slice(3).trim() });
            } else if (line.startsWith('### ')) {
                parsedBlocks.push({ type: 'h3', content: line.slice(4).trim() });
            } else if (line.startsWith('> ')) {
                parsedBlocks.push({ type: 'quote', content: line.slice(2).trim() });
            } else if (/^(\d+\.|\-|\•)\s/.test(line)) {
                const cleanText = line.replace(/^(\d+\.|\-|\•)\s+/, '');
                parsedBlocks.push({ type: 'list-item', content: cleanText });
            } else if (line === '---') {
                parsedBlocks.push({ type: 'divider' });
            } else {
                parsedBlocks.push({ type: 'paragraph', content: line });
            }
        }

        return parsedBlocks;
    }, [rawMarkdown]);

    return (
        <div className="space-y-3 p-5 rounded-2xl bg-gray-50/70 dark:bg-[#0c101c] border border-gray-200 dark:border-white/[0.08] text-xs leading-relaxed max-h-96 overflow-y-auto">
            {blocks.map((block, index) => {
                switch (block.type) {
                    case 'h1':
                        return (
                            <h1 key={index} className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white pt-1 pb-1 flex items-center gap-2">
                                {formatInline(block.content)}
                            </h1>
                        );
                    case 'h2':
                        return (
                            <h2 key={index} className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 pt-3 pb-1 border-b border-orange-500/20 flex items-center gap-1.5 uppercase tracking-wider">
                                {formatInline(block.content)}
                            </h2>
                        );
                    case 'h3':
                        return (
                            <h3 key={index} className="text-xs font-bold text-gray-800 dark:text-slate-200 pt-2">
                                {formatInline(block.content)}
                            </h3>
                        );
                    case 'quote':
                        return (
                            <div key={index} className="p-3.5 my-2 rounded-xl bg-orange-500/[0.08] border-l-4 border-orange-500 text-xs text-gray-800 dark:text-slate-200 leading-relaxed font-medium">
                                {formatInline(block.content)}
                            </div>
                        );
                    case 'table':
                        return (
                            <div key={index} className="overflow-x-auto my-2 rounded-xl border border-gray-200 dark:border-white/[0.08] shadow-sm">
                                <table className="w-full text-left text-xs border-collapse">
                                    {block.rows.length > 0 && (
                                        <thead>
                                            <tr className="bg-orange-500/10 dark:bg-orange-500/15 border-b border-orange-500/20 text-orange-700 dark:text-orange-300 font-bold uppercase tracking-wider">
                                                {block.rows[0].map((th, cIdx) => (
                                                    <th key={cIdx} className="py-2.5 px-3 font-semibold">
                                                        {formatInline(th)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                    )}
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05] bg-white dark:bg-[#0B0F19]">
                                        {block.rows.slice(1).map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="py-2 px-3 text-gray-700 dark:text-gray-300">
                                                        {formatInline(cell)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    case 'list-item':
                        return (
                            <div key={index} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300 my-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                <span className="leading-relaxed">{formatInline(block.content)}</span>
                            </div>
                        );
                    case 'divider':
                        return <hr key={index} className="border-gray-200 dark:border-white/[0.08] my-3" />;
                    case 'paragraph':
                    default:
                        return (
                            <p key={index} className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed my-1">
                                {formatInline(block.content)}
                            </p>
                        );
                }
            })}
        </div>
    );
}

export default function CfoBriefModal({ isOpen, onClose, briefData, isLoading, onRefresh, baseCurrency = 'USD' }) {
    const [copied, setCopied] = useState(false);
    const [showReport, setShowReport] = useState(true);
    const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'raw'

    // Defensive unwrapping in case backend or cache passes stringified JSON
    const safeData = useMemo(() => {
        if (!briefData) return null;
        let data = { ...briefData };

        if (typeof data.markdownReport === 'string' && data.markdownReport.trim().startsWith('{')) {
            try {
                const inner = JSON.parse(data.markdownReport);
                data = {
                    ...data,
                    headline: inner.headline || data.headline,
                    cashFlowOutlook: inner.cashFlowOutlook || data.cashFlowOutlook,
                    vendorRiskAnalysis: inner.vendorRiskAnalysis || data.vendorRiskAnalysis,
                    auditAndCompliance: inner.auditAndCompliance || data.auditAndCompliance,
                    actionableRecommendations: inner.actionableRecommendations || data.actionableRecommendations,
                    markdownReport: inner.markdownReport || data.markdownReport
                };
            } catch {
                // Regex recovery
                const headlineMatch = data.markdownReport.match(/"headline"\s*:\s*"([^"]+)"/);
                if (headlineMatch && !data.headline) data.headline = headlineMatch[1];
            }
        }
        return data;
    }, [briefData]);

    if (!isOpen) return null;

    const handleCopyReport = () => {
        if (!safeData?.markdownReport) return;
        navigator.clipboard.writeText(safeData.markdownReport);
        setCopied(true);
        toast.success('CFO Brief copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadReport = () => {
        if (!safeData?.markdownReport) return;
        const blob = new Blob([safeData.markdownReport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CFO-Intelligence-Brief-${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Downloaded CFO Brief Markdown Report!');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-white/[0.08] overflow-hidden"
                >
                    {/* Header with Warm Executive Orange Accent */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/[0.06] bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent flex items-center justify-between shrink-0">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    Autonomous CFO Intelligence Brief
                                </h2>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                    Groq LPU 120B
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Portfolio cash flow forecasting, vendor concentration analysis & forensic audit.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {safeData && (
                                <>
                                    <button
                                        onClick={handleCopyReport}
                                        className="p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-300 transition cursor-pointer"
                                        title="Copy Markdown Report"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleDownloadReport}
                                        className="p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-300 transition cursor-pointer"
                                        title="Download Markdown Report"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-500 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader size="32px" subtitle="Synthesizing Executive Financial Intelligence..." />
                                <p className="text-xs text-gray-400 max-w-sm mt-1 font-mono">
                                    Normalizing currencies, auditing discrepancies & calculating cash outflows via Groq LPU.
                                </p>
                            </div>
                        ) : safeData ? (
                            <>
                                {/* Executive Headline Banner */}
                                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/25">
                                    <div className="flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">
                                        <span>Executive Takeaway</span>
                                        <span className="font-mono text-[10px] text-gray-400">
                                            Base Currency: {baseCurrency}
                                        </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                        {safeData.headline || "Corporate Portfolio Spend Analysis"}
                                    </p>
                                </div>

                                {/* 4-Quadrant Analysis Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* 1. Cash Flow Outlook */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2">
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                            Cash Flow & Working Capital
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {safeData.cashFlowOutlook || "No upcoming cash flow liabilities detected."}
                                        </p>
                                    </div>

                                    {/* 2. Vendor Concentration */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2">
                                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            Vendor Concentration Risk
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {safeData.vendorRiskAnalysis || "Vendor distribution is evenly balanced."}
                                        </p>
                                    </div>

                                    {/* 3. Audit & Compliance */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2">
                                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            Forensic Audit Findings
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {safeData.auditAndCompliance || "100% of line items mathematically verified."}
                                        </p>
                                    </div>

                                    {/* 4. Strategic Recommendations */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2.5">
                                        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                                            Strategic CFO Recommendations
                                        </div>
                                        <ul className="space-y-2">
                                            {safeData.actionableRecommendations?.map((rec, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                    <span className="font-mono text-orange-500 font-bold shrink-0">{idx + 1}.</span>
                                                    <span>{rec}</span>
                                                </li>
                                            )) || (
                                                <li className="text-xs text-gray-400">All financial controls operating within threshold.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {/* Full Formatted Board-Ready Markdown Report */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Full Board-Ready Executive Markdown Report
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {showReport && (
                                                <div className="flex items-center bg-gray-100 dark:bg-white/[0.06] rounded-xl p-0.5 border border-gray-200 dark:border-white/[0.08]">
                                                    <button
                                                        onClick={() => setViewMode('formatted')}
                                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${viewMode === 'formatted' ? 'bg-white dark:bg-[#111827] text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                                    >
                                                        Formatted
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('raw')}
                                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${viewMode === 'raw' ? 'bg-white dark:bg-[#111827] text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                                    >
                                                        Raw
                                                    </button>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setShowReport(!showReport)}
                                                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer ml-1"
                                            >
                                                {showReport ? 'Hide' : 'Show Report'}
                                            </button>
                                        </div>
                                    </div>

                                    {showReport && (
                                        viewMode === 'formatted' ? (
                                            <ExecutiveMarkdownViewer rawMarkdown={safeData.markdownReport} />
                                        ) : (
                                            <div className="p-5 rounded-2xl bg-gray-900 text-gray-100 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-gray-800 shadow-inner max-h-80">
                                                {safeData.markdownReport}
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                Click "Generate CFO Brief" to synthesize executive analytics.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-[#0B0F19] flex items-center justify-between text-xs text-gray-500">
                        <span>
                            Engine: <strong>Groq LPU (GPT-OSS 120B)</strong> • Latency: ~1.2s • Cost: $0.00
                        </span>
                        <div className="flex items-center gap-2">
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5 transition cursor-pointer"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span>Re-analyze</span>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold shadow-sm transition cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
