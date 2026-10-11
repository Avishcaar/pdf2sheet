import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useQueryClient } from '@tanstack/react-query';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { 
    ArrowLeft, 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    RotateCcw, 
    Sparkles, 
    CheckCircle, 
    Clock, 
    Calendar, 
    Hash, 
    DollarSign, 
    Store, 
    Mail, 
    Crosshair, 
    X, 
    Save, 
    Table, 
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const FIELD_CONFIGS = [
    { key: 'vendorName', label: 'Vendor Name', icon: Store, placeholder: 'e.g., Stripe, AWS, Acme Corp', color: 'violet' },
    { key: 'invoiceNumber', label: 'Invoice #', icon: Hash, placeholder: 'e.g., INV-2026-001', color: 'cyan' },
    { key: 'invoiceDate', label: 'Invoice Date', icon: Calendar, placeholder: 'DD-MM-YYYY or MM/DD/YYYY', color: 'emerald' },
    { key: 'dueDate', label: 'Due Date', icon: Clock, placeholder: 'DD-MM-YYYY or MM/DD/YYYY', color: 'amber' },
    { key: 'totalAmount', label: 'Total Amount ($)', icon: DollarSign, placeholder: 'e.g., 1250.00', color: 'blue', isMono: true },
];

export default function VisualMapper() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { darkMode } = useTheme();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.1);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedField, setSelectedField] = useState('totalAmount');
    const [hoveredField, setHoveredField] = useState(null);
    const [highlightedBoxes, setHighlightedBoxes] = useState({});

    // Mappings State
    const [mappings, setMappings] = useState({
        vendorName: '',
        invoiceDate: '',
        totalAmount: '',
        invoiceNumber: '',
        dueDate: ''
    });

    const pdfWrapperRef = useRef(null);

    // Fetch Invoice & PDF Blob
    useEffect(() => {
        let isMounted = true;
        let createdBlobUrl = null;

        const fetchInvoiceData = async () => {
            try {
                // Try specific get endpoint, fallback to list
                let foundInvoice = null;
                try {
                    const res = await api.get(`/invoices/${invoiceId}`);
                    foundInvoice = res.data?.data;
                } catch {
                    const listRes = await api.get('/invoices');
                    foundInvoice = listRes.data?.data?.find(inv => inv._id === invoiceId);
                }

                if (!foundInvoice) {
                    toast.error('Invoice not found');
                    navigate('/dashboard');
                    return;
                }

                if (isMounted) {
                    setInvoice(foundInvoice);
                    setMappings({
                        vendorName: foundInvoice.vendorName || '',
                        invoiceDate: foundInvoice.extractedData?.invoiceDate || '',
                        invoiceNumber: foundInvoice.extractedData?.invoiceNumber || '',
                        totalAmount: foundInvoice.extractedData?.totalAmount || '',
                        dueDate: foundInvoice.extractedData?.dueDate || ''
                    });

                    // Download PDF Blob
                    try {
                        const pdfRes = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
                        createdBlobUrl = URL.createObjectURL(pdfRes.data);
                        if (isMounted) setPdfUrl(createdBlobUrl);
                    } catch (pdfErr) {
                        console.error('PDF Fetch Error:', pdfErr);
                        toast.error('Could not download PDF attachment');
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load invoice');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (invoiceId) fetchInvoiceData();

        return () => {
            isMounted = false;
            if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
        };
    }, [invoiceId, navigate]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    // Text Selection Event on PDF Canvas
    const handleTextSelection = (e) => {
        if (!selectedField) return;

        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            // Calculate selection bounding box relative to wrapper for visual pin
            let relativeBox = null;
            if (selection.rangeCount > 0 && pdfWrapperRef.current) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const wrapperRect = pdfWrapperRef.current.getBoundingClientRect();
                relativeBox = {
                    top: rect.top - wrapperRect.top + pdfWrapperRef.current.scrollTop,
                    left: rect.left - wrapperRect.left + pdfWrapperRef.current.scrollLeft,
                    width: rect.width,
                    height: rect.height,
                    text: text
                };
            }

            setMappings(prev => ({
                ...prev,
                [selectedField]: text
            }));

            if (relativeBox) {
                setHighlightedBoxes(prev => ({
                    ...prev,
                    [selectedField]: relativeBox
                }));
            }

            const fieldLabel = FIELD_CONFIGS.find(f => f.key === selectedField)?.label || selectedField;
            toast.success(`Mapped "${text}" to ${fieldLabel}`, { icon: '🎯' });

            selection.removeAllRanges();

            // Auto-advance to next empty field for seamless workflow
            const currentIndex = FIELD_CONFIGS.findIndex(f => f.key === selectedField);
            const nextEmptyField = FIELD_CONFIGS.slice(currentIndex + 1).find(f => !mappings[f.key]);
            if (nextEmptyField) {
                setSelectedField(nextEmptyField.key);
            }
        }
    };

    const handleSaveAndSync = async () => {
        setIsSaving(true);
        try {
            const payload = {
                vendorName: mappings.vendorName,
                extractedData: {
                    invoiceDate: mappings.invoiceDate,
                    invoiceNumber: mappings.invoiceNumber,
                    totalAmount: mappings.totalAmount,
                    dueDate: mappings.dueDate
                }
            };

            const response = await api.post(`/invoices/${invoiceId}/process`, payload);

            if (response.data.warning) {
                toast((t) => (
                    <div className="flex flex-col">
                        <span className="font-bold text-amber-500">Saved, but Sheet Sync Failed!</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                            {response.data.message?.split('Failed: ')[1] || 'Check your Google Sheet ID in settings.'}
                        </span>
                    </div>
                ), { icon: '⚠️', duration: 5000 });
            } else {
                toast.success('Rules Learned & Synced to Google Sheet!', { icon: '🚀' });
            }

            queryClient.invalidateQueries(['invoices']);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to save rules');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-[#0B0F19] space-y-4">
                <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Loading Visual Coordinate Mapper...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-[#0B0F19]">
            <Toaster position="top-center" />

            {/* Top Workspace Bar */}
            <header className="h-14 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-white/[0.08] px-4 flex items-center justify-between z-30 shrink-0">
                {/* Back & Breadcrumb */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.08]" />
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Review & Learn:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {mappings.vendorName || invoice?.senderEmail || 'Invoice'}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        Spatial OCR
                    </span>
                </div>

                {/* PDF Viewport Controls */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06]">
                    <button
                        onClick={() => setScale(s => Math.max(0.6, s - 0.1))}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.08] transition"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono px-2 text-gray-700 dark:text-gray-300 min-w-[3.5rem] text-center select-none">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(2.2, s + 0.1))}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.08] transition"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-3 w-px bg-gray-300 dark:bg-white/[0.1] mx-0.5" />
                    <button
                        onClick={() => setScale(1.0)}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.08] transition text-xs font-mono"
                        title="Reset 100%"
                    >
                        1:1
                    </button>
                    <button
                        onClick={() => setScale(1.35)}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.08] transition"
                        title="Fit to Viewport"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    {numPages && numPages > 1 && (
                        <>
                            <div className="h-3 w-px bg-gray-300 dark:bg-white/[0.1] mx-0.5" />
                            <div className="flex items-center gap-1 text-xs">
                                <button
                                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                    disabled={pageNumber <= 1}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-gray-500">
                                    {pageNumber}/{numPages}
                                </span>
                                <button
                                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                                    disabled={pageNumber >= numPages}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Header Status */}
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Dual-Core Coordinate Engine
                    </span>
                </div>
            </header>

            {/* Split-Screen Main Workstation */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANE: Interactive PDF Canvas Stage (65% width) */}
                <div
                    ref={pdfWrapperRef}
                    onMouseUp={handleTextSelection}
                    className="flex-1 relative overflow-auto flex flex-col items-center p-6 bg-slate-900/95 dark:bg-[#070A11] transition-colors"
                    style={{ cursor: selectedField ? 'crosshair' : 'default' }}
                >
                    {/* Instructional HUD Banner */}
                    <div className="sticky top-0 z-20 mb-4 px-4 py-2 rounded-xl bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border border-gray-200 dark:border-white/[0.1] shadow-lg flex items-center gap-2.5 text-xs">
                        <Crosshair className="w-4 h-4 text-violet-500 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                            Active Target:{' '}
                            <strong className="text-violet-600 dark:text-violet-400 uppercase">
                                {FIELD_CONFIGS.find(f => f.key === selectedField)?.label}
                            </strong>
                            {' — '}Highlight text on the PDF to learn its coordinate bounding box.
                        </span>
                    </div>

                    {/* PDF Document Container */}
                    {pdfUrl ? (
                        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10">
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(err) => toast.error(`PDF Render Error: ${err.message}`)}
                                loading={
                                    <div className="p-20 text-center text-xs font-mono text-gray-400 flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                        Rendering Vector PDF Canvas...
                                    </div>
                                }
                                error={
                                    <div className="p-16 text-center text-xs text-rose-400">
                                        Failed to load invoice PDF document.
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={false}
                                    className="react-pdf-page-container"
                                />
                            </Document>
                        </div>
                    ) : (
                        <div className="p-20 text-center text-xs font-mono text-gray-400">
                            No PDF attached to this invoice.
                        </div>
                    )}
                </div>

                {/* RIGHT PANE: Precision Field Inspector & Live Sheet Mirror (35% width, min 380px) */}
                <div className="w-[420px] shrink-0 h-full bg-white dark:bg-[#111827] border-l border-gray-200 dark:border-white/[0.08] flex flex-col overflow-hidden shadow-xl z-20">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-gray-200 dark:border-white/[0.08] shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Field Mapping Inspector
                                <Sparkles className="w-4 h-4 text-violet-500" />
                            </h2>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {invoice?.status === 'processed' ? 'Verified' : 'Human Review'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Sender Email:{' '}
                            <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                                {invoice?.senderEmail || 'N/A'}
                            </span>
                        </p>
                    </div>

                    {/* Scrollable Fields List */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="space-y-3">
                            {FIELD_CONFIGS.map(config => {
                                const isSelected = selectedField === config.key;
                                const value = mappings[config.key];
                                const hasValue = Boolean(value && value.trim());

                                return (
                                    <div
                                        key={config.key}
                                        onClick={() => setSelectedField(config.key)}
                                        onMouseEnter={() => setHoveredField(config.key)}
                                        onMouseLeave={() => setHoveredField(null)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20'
                                                : hasValue
                                                ? 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1E293B]/40 hover:border-gray-300 dark:hover:border-white/[0.15]'
                                                : 'border-dashed border-gray-300 dark:border-white/[0.1] bg-gray-50/50 dark:bg-white/[0.01]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <config.icon className={`w-4 h-4 ${isSelected ? 'text-violet-500' : 'text-gray-400'}`} />
                                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {hasValue ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Mapped
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 italic">
                                                        Click & Highlight
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Direct Input Value */}
                                        <div className="relative mt-2">
                                            <input
                                                type="text"
                                                value={value || ''}
                                                onChange={(e) => setMappings({ ...mappings, [config.key]: e.target.value })}
                                                placeholder={config.placeholder}
                                                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none transition ${
                                                    config.isMono ? 'font-mono' : ''
                                                } bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 ${
                                                    isSelected
                                                        ? 'border-violet-400 focus:ring-1 focus:ring-violet-400'
                                                        : 'border-gray-200 dark:border-white/[0.08]'
                                                }`}
                                            />
                                            {hasValue && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMappings({ ...mappings, [config.key]: '' });
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    title="Clear field"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Live "Google Sheet Row Mirror" Preview Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-500/20 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Table className="w-3.5 h-3.5" />
                                    Google Sheet Live Mirror
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">Sheet1!A:E</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">
                                The exact row that will be committed to your connected spreadsheet:
                            </p>

                            {/* Spreadsheet Table Preview */}
                            <div className="overflow-x-auto rounded-lg border border-emerald-500/30 bg-white dark:bg-[#0B0F19]">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-emerald-600 text-white font-medium text-[10px]">
                                        <tr>
                                            <th className="px-2 py-1.5">Vendor</th>
                                            <th className="px-2 py-1.5">Invoice #</th>
                                            <th className="px-2 py-1.5">Date</th>
                                            <th className="px-2 py-1.5">Amount</th>
                                            <th className="px-2 py-1.5">Due</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-x divide-gray-100 dark:divide-white/[0.04] font-mono text-gray-800 dark:text-gray-200">
                                        <tr className="divide-x divide-gray-100 dark:divide-white/[0.04]">
                                            <td className="px-2 py-1.5 font-sans font-medium truncate max-w-[80px]">
                                                {mappings.vendorName || '—'}
                                            </td>
                                            <td className="px-2 py-1.5 truncate max-w-[70px]">
                                                {mappings.invoiceNumber || '—'}
                                            </td>
                                            <td className="px-2 py-1.5">
                                                {mappings.invoiceDate || '—'}
                                            </td>
                                            <td className="px-2 py-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                ${mappings.totalAmount || '0.00'}
                                            </td>
                                            <td className="px-2 py-1.5">
                                                {mappings.dueDate || '—'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-5 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#111827] space-y-2 shrink-0">
                        <button
                            onClick={handleSaveAndSync}
                            disabled={isSaving}
                            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Learning Coordinates & Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Learn Coordinates & Sync to Sheets</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-2 px-4 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 font-medium text-xs transition"
                        >
                            Cancel & Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
