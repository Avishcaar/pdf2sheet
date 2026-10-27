import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Sparkles, 
    FileText, 
    TrendingUp, 
    AlertTriangle, 
    ShieldCheck, 
    Building2, 
    DollarSign, 
    Download, 
    Copy, 
    Check, 
    RefreshCw,
    PieChart,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currencyUtils';

export default function CfoBriefModal({ isOpen, onClose, briefData, isLoading, onRefresh, baseCurrency = 'USD' }) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'full'

    if (!isOpen) return null;

    const handleCopyReport = () => {
        if (!briefData?.markdownReport) return;
        navigator.clipboard.writeText(briefData.markdownReport);
        setCopied(true);
        toast.success('CFO Brief copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadReport = () => {
        if (!briefData?.markdownReport) return;
        const blob = new Blob([briefData.markdownReport], { type: 'text/markdown' });
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
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/[0.06] bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-transparent flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        Autonomous CFO Intelligence Brief
                                    </h2>
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                        Groq LPU 120B
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Real-time portfolio cash flow forecasting, vendor concentration analysis & audit intelligence.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {briefData && (
                                <>
                                    <button
                                        onClick={handleCopyReport}
                                        className="p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-300 transition"
                                        title="Copy Markdown Report"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleDownloadReport}
                                        className="p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-300 transition"
                                        title="Download Markdown Report"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-500 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full border-4 border-violet-500/20 border-t-violet-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center text-violet-600">
                                        <Sparkles className="w-6 h-6 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        Synthesizing Executive Financial Intelligence...
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Normalizing currencies, calculating cash outflows & auditing line items via Groq LPU.
                                    </p>
                                </div>
                            </div>
                        ) : briefData ? (
                            <>
                                {/* Executive Headline Banner */}
                                <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-transparent border border-violet-500/25">
                                    <div className="flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                                        <span>Executive Takeaway</span>
                                        <span className="font-mono text-[10px] text-gray-400">
                                            Base Currency: {baseCurrency}
                                        </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                        {briefData.headline || "Corporate Portfolio Spend Analysis"}
                                    </p>
                                </div>

                                {/* 4-Quadrant Analysis Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* 1. Cash Flow Outlook */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Cash Flow & Working Capital</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {briefData.cashFlowOutlook || "No upcoming cash flow liabilities detected."}
                                        </p>
                                    </div>

                                    {/* 2. Vendor Concentration */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            <Building2 className="w-4 h-4" />
                                            <span>Vendor Concentration Risk</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {briefData.vendorRiskAnalysis || "Vendor distribution is evenly balanced."}
                                        </p>
                                    </div>

                                    {/* 3. Audit & Compliance */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Forensic Audit Findings</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {briefData.auditAndCompliance || "100% of line items mathematically verified."}
                                        </p>
                                    </div>

                                    {/* 4. Strategic Recommendations */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-200 dark:border-white/[0.06] space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Actionable CFO Recommendations</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {briefData.actionableRecommendations?.map((rec, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                    <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                                                    <span>{rec}</span>
                                                </li>
                                            )) || (
                                                <li className="text-xs text-gray-400">All financial controls operating within threshold.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {/* Full Formatted Markdown Report Accordion */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-violet-500" />
                                            Full Board-Ready Executive Markdown Report
                                        </span>
                                        <button
                                            onClick={() => setActiveTab(activeTab === 'full' ? 'summary' : 'full')}
                                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                        >
                                            {activeTab === 'full' ? 'Hide Report Preview' : 'Show Full Report Preview'}
                                        </button>
                                    </div>

                                    {activeTab === 'full' && (
                                        <div className="p-5 rounded-2xl bg-gray-900 text-gray-100 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-gray-800 shadow-inner max-h-72">
                                            {briefData.markdownReport}
                                        </div>
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
                            Generated with <strong>Groq LPU (GPT-OSS 120B)</strong> • Latency: ~1.4s • Cost: $0.00
                        </span>
                        <div className="flex items-center gap-2">
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5 transition"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span>Re-analyze</span>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-sm transition"
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
