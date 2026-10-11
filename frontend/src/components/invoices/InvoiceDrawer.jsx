import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    X, 
    FileText, 
    Calendar, 
    Hash, 
    DollarSign, 
    Mail, 
    CheckCircle, 
    Clock, 
    ExternalLink, 
    Trash2, 
    Copy, 
    Check, 
    Sparkles,
    ArrowUpRight
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function InvoiceDrawer({ invoice, isOpen, onClose, onDelete, onApprove }) {
    const navigate = useNavigate();
    const [copiedField, setCopiedField] = useState(null);

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

    if (!invoice) return null;

    const copyToClipboard = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`Copied ${fieldName}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const confidence = invoice.confidenceScore ?? (invoice.status === 'processed' ? 95 : 45);
    const isProcessed = invoice.status === 'processed';

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0B0F19] border-l border-gray-200 dark:border-white/[0.08] shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-500/20">
                                    {invoice.vendorName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        {invoice.vendorName || 'Unknown Vendor'}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {invoice.senderEmail || 'No sender email'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Hero Amount & Confidence Card */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/[0.03] dark:to-white/[0.01] border border-gray-200/80 dark:border-white/[0.08]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Extracted Amount
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidence)}`}>
                                        <Sparkles className="w-3 h-3" />
                                        {confidence}% Confidence
                                    </span>
                                </div>

                                <div className="text-3xl font-bold font-mono text-gray-900 dark:text-white mb-3">
                                    ${invoice.extractedData?.totalAmount || '0.00'}
                                </div>

                                {/* Confidence Progress Bar */}
                                <div className="w-full bg-gray-200 dark:bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${Math.min(confidence, 100)}%` }}
                                    />
                                </div>

                                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                    <span>Engine: {invoice.vendorMapId ? 'Coordinate Mapping (Learned)' : 'Heuristic Scan'}</span>
                                    <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                                        {isProcessed ? 'Auto-Synced to Sheet' : 'Pending Verification'}
                                    </span>
                                </div>
                            </div>

                            {/* Status Pill Section */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/[0.06]">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Processing Status
                                </span>
                                {isProcessed ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Processed & Synced
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        <Clock className="w-3.5 h-3.5" />
                                        Review Required
                                    </span>
                                )}
                            </div>

                            {/* Extracted Fields Grid */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Captured Metadata
                                </h3>

                                <div className="space-y-2">
                                    {/* Invoice Number */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E293B]/40 border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Hash className="w-4 h-4 text-violet-500" />
                                            <div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">Invoice Number</p>
                                                <p className="text-sm font-medium font-mono text-gray-900 dark:text-gray-100">
                                                    {invoice.extractedData?.invoiceNumber || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {invoice.extractedData?.invoiceNumber && (
                                            <button
                                                onClick={() => copyToClipboard(invoice.extractedData.invoiceNumber, 'Invoice #')}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
                                            >
                                                {copiedField === 'Invoice #' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Invoice Date */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E293B]/40 border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Calendar className="w-4 h-4 text-cyan-500" />
                                            <div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">Invoice Date</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {invoice.extractedData?.invoiceDate || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E293B]/40 border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">Due Date</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {invoice.extractedData?.dueDate || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Original File */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#1E293B]/40 border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                            <div className="overflow-hidden">
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">Source Attachment</p>
                                                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                                                    {invoice.originalFileName || 'invoice.pdf'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-6 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#0B0F19] space-y-2.5">
                            <button
                                onClick={() => navigate(`/review/${invoice._id}`)}
                                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in Visual Mapper
                            </button>

                            {!isProcessed && onApprove && (
                                <button
                                    onClick={() => onApprove(invoice)}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve & Push to Sheet
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
