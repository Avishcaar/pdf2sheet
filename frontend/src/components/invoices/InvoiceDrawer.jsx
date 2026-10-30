import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    X, 
    FileText, 
    Calendar, 
    Hash, 
    Mail, 
    CheckCircle, 
    Clock, 
    ExternalLink, 
    Trash2, 
    Copy, 
    Check, 
    Send,
    Bot,
    Calculator,
    AlertTriangle,
    Layers,
    Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency, convertCurrency, CURRENCY_SYMBOLS } from '../../utils/currencyUtils';

export default function InvoiceDrawer({ invoice, isOpen, onClose, onDelete, onApprove }) {
    const navigate = useNavigate();
    const [copiedField, setCopiedField] = useState(null);

    // AI Chat State
    const [question, setQuestion] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset chat history when opening new invoice
    useEffect(() => {
        if (invoice) {
            setChatHistory([]);
            setQuestion('');
        }
    }, [invoice?._id]);

    if (!invoice) return null;

    const copyToClipboard = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleAskQuestion = async (e) => {
        e?.preventDefault();
        if (!question.trim() || chatLoading) return;

        const userQ = question.trim();
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userQ }]);
        setChatLoading(true);

        try {
            const res = await api.post(`/invoices/${invoice._id}/ask`, { question: userQ });
            setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to get answer');
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Could not connect to AI Copilot. Please verify your Groq API key.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const extracted = invoice.extractedData || {};
    const lineItems = extracted.lineItems || [];
    const mathAudit = extracted.mathAudit;
    const confidence = invoice.confidenceScore !== null && invoice.confidenceScore !== undefined && Number.isFinite(Number(invoice.confidenceScore))
        ? Number(invoice.confidenceScore)
        : null;
    const isProcessed = invoice.status === 'processed';
    const engineName = extracted.engine || (invoice.vendorMapId ? 'Spatial mapping' : null);

    const getConfidenceColor = (score) => {
        if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 invoice-sheet-backdrop"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#0B0F19] border-l border-gray-200 dark:border-white/[0.08] shadow-2xl z-50 flex flex-col overflow-hidden invoice-sheet-drawer"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between invoice-sheet-header">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                                    {invoice.vendorName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        {invoice.vendorName || 'Unknown Vendor'}
                                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08]">
                                            {extracted.currency || 'USD'}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {invoice.senderEmail || 'No sender email'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                type="button"
                                aria-label="Close invoice details"
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 invoice-sheet-content">
                            {/* Hero Amount & Confidence Card */}
                            <div className="p-5 rounded-2xl bg-gray-50/75 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] invoice-sheet-total">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Total Extracted
                                    </span>
                                    {confidence !== null && <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${getConfidenceColor(confidence)}`}>
                                        {confidence}% confidence
                                    </span>}
                                </div>

                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl font-bold font-mono text-gray-900 dark:text-white">
                                        {formatCurrency(extracted.totalAmount || 0, extracted.currency || 'USD')}
                                    </span>
                                    {extracted.currency && extracted.currency.toUpperCase() !== 'USD' && (
                                        <span className="text-xs font-mono text-gray-400">
                                            (≈ {formatCurrency(convertCurrency(extracted.totalAmount || 0, extracted.currency, 'USD'), 'USD')})
                                        </span>
                                    )}
                                </div>

                                {/* Confidence Progress Bar */}
                                {confidence !== null && <div className="w-full bg-gray-200 dark:bg-white/[0.08] rounded-full h-1.5 overflow-hidden" aria-label={`Confidence ${confidence}%`}>
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%` }}
                                    />
                                </div>}

                                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                    {engineName && <span>Extraction: <strong>{engineName}</strong></span>}
                                    <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                                        {isProcessed ? 'Processed' : 'Pending verification'}
                                    </span>
                                </div>
                            </div>

                            {/* Executive Summary (if present) */}
                            {extracted.aiSummary && (
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] text-xs">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        Executive Summary
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {extracted.aiSummary}
                                    </p>
                                </div>
                            )}

                            {/* Mathematical Audit Banner */}
                            {mathAudit && (
                                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                                    mathAudit.isValid 
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300'
                                }`}>
                                    {mathAudit.isValid ? (
                                        <Calculator className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold flex items-center justify-between mb-0.5">
                                            <span>Mathematical Audit</span>
                                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                                Calculated: {formatCurrency(mathAudit.calculatedTotal, extracted.currency || 'USD')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] opacity-90 leading-relaxed">
                                            {mathAudit.summary}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Itemized Line Items Table */}
                            {lineItems.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5" />
                                            Extracted Line Items ({lineItems.length})
                                        </h3>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.08]">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-white/[0.06]">
                                                <tr>
                                                    <th className="py-2 px-3">Description</th>
                                                    <th className="py-2 px-2 text-center">Qty</th>
                                                    <th className="py-2 px-2 text-right">Price</th>
                                                    <th className="py-2 px-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                                {lineItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                                                        <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200 max-w-[180px] truncate" title={item.description}>
                                                            {item.description || '—'}
                                                        </td>
                                                        <td className="py-2 px-2 text-center text-gray-500 dark:text-gray-400 font-mono">
                                                            {item.quantity || 1}
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-gray-500 dark:text-gray-400 font-mono">
                                                            {item.unitPrice ? formatCurrency(item.unitPrice, extracted.currency || 'USD') : '—'}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-semibold font-mono text-gray-900 dark:text-gray-100">
                                                            {item.amount ? formatCurrency(item.amount, extracted.currency || 'USD') : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Captured Metadata Grid */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                    <Receipt className="w-3.5 h-3.5" />
                                    Captured Metadata
                                </h3>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Invoice Number */}
                                    <div className="p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06]">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                            <Hash className="w-3 h-3 text-violet-500" /> Invoice Number
                                        </p>
                                        <p className="text-xs font-medium font-mono text-gray-900 dark:text-gray-100 truncate">
                                            {extracted.invoiceNumber || '—'}
                                        </p>
                                    </div>

                                    {/* Invoice Date */}
                                    <div className="p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06]">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                            <Calendar className="w-3 h-3 text-cyan-500" /> Issue Date
                                        </p>
                                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                            {extracted.invoiceDate || '—'}
                                        </p>
                                    </div>

                                    {/* Due Date */}
                                    <div className="p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06]">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                            <Clock className="w-3 h-3 text-amber-500" /> Due Date
                                        </p>
                                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                            {extracted.dueDate || '—'}
                                        </p>
                                    </div>

                                    {/* Tax / VAT */}
                                    <div className="p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/[0.06]">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                            <Calculator className="w-3 h-3 text-emerald-500" /> Tax / VAT
                                        </p>
                                        <p className="text-xs font-medium font-mono text-gray-900 dark:text-gray-100">
                                            {extracted.taxAmount ? formatCurrency(extracted.taxAmount, extracted.currency || 'USD') : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* "Ask Document" AI Interactive Copilot Box */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-transparent border border-violet-500/20 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                            Ask Document AI Copilot
                                        </h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            Powered by Groq LPU — ask anything about payment terms, vendor, or line items
                                        </p>
                                    </div>
                                </div>

                                {/* Chat Thread */}
                                {chatHistory.length > 0 && (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {chatHistory.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={`p-2.5 rounded-xl text-xs ${
                                                    msg.role === 'user'
                                                        ? 'bg-violet-600 text-white ml-6'
                                                        : 'bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-800 dark:text-gray-200 mr-6'
                                                }`}
                                            >
                                                {msg.content}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Input Form */}
                                <form onSubmit={handleAskQuestion} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="e.g. What are the payment terms?"
                                        disabled={chatLoading}
                                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E293B]/70 border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !question.trim()}
                                        className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl transition text-xs font-medium flex items-center gap-1 shadow-sm"
                                    >
                                        {chatLoading ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-6 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#0B0F19] space-y-2.5 invoice-sheet-footer">
                            <button
                                onClick={() => navigate(`/review/${invoice._id}`)}
                                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in Visual Mapper (Coordinate Mode)
                            </button>

                            {!isProcessed && onApprove && (
                                <button
                                    onClick={() => onApprove(invoice)}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve & Push to Google Sheet
                                </button>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onDelete(invoice._id)}
                                    className="flex-1 py-2 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-xl transition text-xs font-medium flex items-center justify-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Record
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 rounded-xl transition text-xs font-medium"
                                >
                                    Close Drawer
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
