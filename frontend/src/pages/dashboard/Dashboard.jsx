import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useInvoices from '../../hooks/useInvoices';
import { useUserProfile } from '../../hooks/useUser';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../services/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import InvoiceDrawer from '../../components/invoices/InvoiceDrawer';
import SpendAnalytics from '../../components/dashboard/SpendAnalytics';
import WorkstationScrollHero from '../../components/dashboard/WorkstationScrollHero';
import RecruiterGuideBanner from '../../components/dashboard/RecruiterGuideBanner';
import CfoBriefModal from '../../components/dashboard/CfoBriefModal';
import SmartOmnibar from '../../components/dashboard/SmartOmnibar';
import { exportToCsv, exportToJson } from '../../utils/exportUtils';
import { convertCurrency, formatCurrency } from '../../utils/currencyUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    CheckCircle, 
    Clock, 
    Trash2, 
    Edit3, 
    AlertCircle, 
    Mail, 
    Search, 
    Download, 
    Zap, 
    DollarSign, 
    SlidersHorizontal, 
    Eye, 
    Copy, 
    Check, 
    Sparkles, 
    ArrowUpDown, 
    RefreshCw,
    X,
    Plus,
    ShieldCheck,
    AlertTriangle,
    UploadCloud,
    Globe
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Dashboard() {
    const { data: invoices, isLoading, error, refetch } = useInvoices();
    const { data: userProfile } = useUserProfile();
    const navigate = useNavigate();
    const { darkMode } = useTheme();

    // Multi-Currency Normalizer State
    const [baseCurrency, setBaseCurrency] = useState('USD'); // 'USD' | 'INR' | 'EUR' | 'GBP'

    // Natural Language Search Filter
    const [nlFilter, setNlFilter] = useState(null);

    // CFO Brief State
    const [isCfoModalOpen, setIsCfoModalOpen] = useState(false);
    const [cfoBriefData, setCfoBriefData] = useState(null);
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

    // Filtering & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'processed' | 'review_needed'
    const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'confidence_desc'

    // Selected Rows for Batch Actions
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Drawer state
    const [drawerInvoice, setDrawerInvoice] = useState(null);

    // Delete Modal state
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
    const [isBatchDelete, setIsBatchDelete] = useState(false);

    // Copied indicator
    const [copiedId, setCopiedId] = useState(null);

    // Direct Upload state
    const [isUploadingRandom, setIsUploadingRandom] = useState(false);
    const [isSyncingEmail, setIsSyncingEmail] = useState(false);
    const [isIngestingSample, setIsIngestingSample] = useState(false);

    // KPI Metrics (Normalized to baseCurrency)
    const stats = useMemo(() => {
        if (!invoices || invoices.length === 0) {
            return { total: 0, processed: 0, review: 0, syncRate: 0, totalAmount: 0 };
        }
        const total = invoices.length;
        const processed = invoices.filter(i => i.status === 'processed').length;
        const review = invoices.filter(i => i.status === 'review_needed').length;
        const syncRate = total > 0 ? Math.round((processed / total) * 100) : 0;
        
        const totalAmount = invoices.reduce((acc, curr) => {
            const raw = curr.extractedData?.totalAmount;
            if (!raw) return acc;
            const parsed = parseFloat(String(raw).replace(/[^0-9.-]+/g, ''));
            const num = isNaN(parsed) ? 0 : parsed;
            const invCurr = curr.extractedData?.currency || 'USD';
            return acc + convertCurrency(num, invCurr, baseCurrency);
        }, 0);

        return { total, processed, review, syncRate, totalAmount };
    }, [invoices, baseCurrency]);

    // Filtered & Sorted Invoices
    const processedInvoices = useMemo(() => {
        if (!invoices) return [];

        let list = [...invoices];

        // Status Filter
        if (statusFilter !== 'all') {
            list = list.filter(i => i.status === statusFilter);
        }

        // Natural Language AI Filter
        if (nlFilter && nlFilter.active) {
            if (nlFilter.vendorName) {
                const v = nlFilter.vendorName.toLowerCase();
                list = list.filter(i => 
                    (i.vendorName && i.vendorName.toLowerCase().includes(v)) ||
                    (i.extractedData?.vendorName && i.extractedData.vendorName.toLowerCase().includes(v))
                );
            }
            if (nlFilter.minAmount !== null && nlFilter.minAmount !== undefined) {
                list = list.filter(i => {
                    const raw = i.extractedData?.totalAmount;
                    const parsed = raw ? parseFloat(String(raw).replace(/[^0-9.-]+/g, '')) : 0;
                    const converted = convertCurrency(parsed, i.extractedData?.currency || 'USD', baseCurrency);
                    return converted >= nlFilter.minAmount;
                });
            }
            if (nlFilter.maxAmount !== null && nlFilter.maxAmount !== undefined) {
                list = list.filter(i => {
                    const raw = i.extractedData?.totalAmount;
                    const parsed = raw ? parseFloat(String(raw).replace(/[^0-9.-]+/g, '')) : 0;
                    const converted = convertCurrency(parsed, i.extractedData?.currency || 'USD', baseCurrency);
                    return converted <= nlFilter.maxAmount;
                });
            }
            if (nlFilter.currency) {
                const c = nlFilter.currency.toUpperCase();
                list = list.filter(i => (i.extractedData?.currency || 'USD').toUpperCase() === c);
            }
            if (nlFilter.status) {
                list = list.filter(i => i.status === nlFilter.status);
            }
            if (nlFilter.mathDiscrepancyOnly) {
                list = list.filter(i => i.extractedData?.mathAudit && i.extractedData.mathAudit.isValid === false);
            }
            if (nlFilter.searchTerm) {
                const s = nlFilter.searchTerm.toLowerCase();
                list = list.filter(i => 
                    (i.vendorName && i.vendorName.toLowerCase().includes(s)) ||
                    (i.senderEmail && i.senderEmail.toLowerCase().includes(s)) ||
                    (i.extractedData?.invoiceNumber && String(i.extractedData.invoiceNumber).toLowerCase().includes(s))
                );
            }
        }

        // Standard Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(i => 
                (i.vendorName && i.vendorName.toLowerCase().includes(q)) ||
                (i.senderEmail && i.senderEmail.toLowerCase().includes(q)) ||
                (i.extractedData?.invoiceNumber && String(i.extractedData.invoiceNumber).toLowerCase().includes(q)) ||
                (i.extractedData?.totalAmount && String(i.extractedData.totalAmount).includes(q))
            );
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === 'date_desc') {
                return new Date(b.createdAt || b.processedAt || 0) - new Date(a.createdAt || a.processedAt || 0);
            }
            if (sortBy === 'date_asc') {
                return new Date(a.createdAt || a.processedAt || 0) - new Date(b.createdAt || b.processedAt || 0);
            }
            if (sortBy === 'amount_desc') {
                const aVal = convertCurrency(parseFloat(String(a.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0, a.extractedData?.currency || 'USD', baseCurrency);
                const bVal = convertCurrency(parseFloat(String(b.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0, b.extractedData?.currency || 'USD', baseCurrency);
                return bVal - aVal;
            }
            if (sortBy === 'amount_asc') {
                const aVal = convertCurrency(parseFloat(String(a.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0, a.extractedData?.currency || 'USD', baseCurrency);
                const bVal = convertCurrency(parseFloat(String(b.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0, b.extractedData?.currency || 'USD', baseCurrency);
                return aVal - bVal;
            }
            if (sortBy === 'confidence_desc') {
                const aConf = a.confidenceScore ?? (a.status === 'processed' ? 95 : 45);
                const bConf = b.confidenceScore ?? (b.status === 'processed' ? 95 : 45);
                return bConf - aConf;
            }
            return 0;
        });

        return list;
    }, [invoices, statusFilter, searchQuery, sortBy, nlFilter, baseCurrency]);

    // Batch Selection Helpers
    const toggleSelectAll = () => {
        if (selectedIds.size === processedInvoices.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(processedInvoices.map(i => i._id)));
        }
    };

    const toggleSelectRow = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Actions
    const handleDeleteSingle = (id, e) => {
        if (e) e.stopPropagation();
        setDeleteId(id);
        setIsBatchDelete(false);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteBatch = () => {
        if (selectedIds.size === 0) return;
        setIsBatchDelete(true);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            if (isBatchDelete) {
                const ids = Array.from(selectedIds);
                await Promise.all(ids.map(id => api.delete(`/invoices/${id}`)));
                toast.success(`Deleted ${ids.length} invoices`);
                setSelectedIds(new Set());
            } else if (deleteId) {
                await api.delete(`/invoices/${deleteId}`);
                toast.success('Invoice deleted');
                if (drawerInvoice?._id === deleteId) {
                    setDrawerInvoice(null);
                }
            }
            refetch();
        } catch (err) {
            console.error('Delete failed:', err);
            toast.error('Failed to delete invoice');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            setIsBatchDelete(false);
        }
    };

    const handleClearAllInvoices = async () => {
        const toastId = toast.loading('Clearing all invoices from database...');
        try {
            const res = await api.delete('/invoices/all');
            toast.success(res.data.message || 'All invoices cleared successfully!', { id: toastId });
            setSelectedIds(new Set());
            refetch();
        } catch (err) {
            console.error('Clear all failed:', err);
            toast.error(err.response?.data?.error || 'Failed to clear invoices', { id: toastId });
        } finally {
            setIsClearAllModalOpen(false);
        }
    };

    const handleApproveFromDrawer = async (invoice) => {
        try {
            await api.post(`/invoices/${invoice._id}/process`, {
                vendorName: invoice.vendorName,
                extractedData: invoice.extractedData
            });
            toast.success('Invoice approved & pushed to Sheet!');
            refetch();
            setDrawerInvoice(null);
        } catch (err) {
            console.error(err);
            toast.error('Failed to approve invoice');
        }
    };

    const handleCopy = (text, id, e) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(`Copied: ${text}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExportFiltered = (type = 'csv') => {
        const dataToExport = selectedIds.size > 0 
            ? processedInvoices.filter(i => selectedIds.has(i._id))
            : processedInvoices;

        if (dataToExport.length === 0) {
            toast.error('No invoices to export');
            return;
        }

        if (type === 'csv') {
            exportToCsv(dataToExport, `pdf2sheet-invoices-${new Date().toISOString().slice(0,10)}.csv`);
            toast.success(`Exported ${dataToExport.length} invoices to CSV`);
        } else {
            exportToJson(dataToExport, `pdf2sheet-invoices-${new Date().toISOString().slice(0,10)}.json`);
            toast.success(`Exported ${dataToExport.length} invoices to JSON`);
        }
    };

    const handleDirectUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file');
            return;
        }

        setIsUploadingRandom(true);
        const toastId = toast.loading(`Analyzing "${file.name}" with Groq LPU AI...`);

        try {
            const formData = new FormData();
            formData.append('invoice', file);

            const response = await api.post('/email/test-upload', formData);

            toast.success(
                `Ingested: ${response.data.data?.vendorName || 'Invoice'} (${formatCurrency(response.data.data?.extractedData?.totalAmount || '0.00', response.data.data?.extractedData?.currency || 'USD')})`,
                { id: toastId, duration: 4000 }
            );

            refetch();
        } catch (err) {
            console.error('Direct upload failed:', err);
            toast.error(err.response?.data?.error || 'Failed to extract invoice', { id: toastId });
        } finally {
            setIsUploadingRandom(false);
            e.target.value = '';
        }
    };

    const handleIngestSample = async (scenarioOrPath = 'aws', sampleName = 'aws-invoice.pdf', vendor = 'AWS Cloud') => {
        let scenarioId = 'aws';
        if (typeof scenarioOrPath === 'string') {
            const lower = scenarioOrPath.toLowerCase();
            if (lower.includes('stripe')) scenarioId = 'stripe';
            else if (lower.includes('sap')) scenarioId = 'sap';
            else if (lower.includes('apollo')) scenarioId = 'apollo';
            else if (lower.includes('github')) scenarioId = 'github';
            else scenarioId = 'aws';
        }

        const displayVendor = vendor || (scenarioId === 'stripe' ? 'Stripe SaaS' : 'AWS Cloud');

        setIsIngestingSample(true);
        const toastId = toast.loading(`Loading sample "${displayVendor}" and analyzing with Groq LPU AI...`);
        try {
            const uploadRes = await api.post('/email/sample-ingest', {
                scenarioId,
                vendorName: displayVendor
            });

            const invoiceData = uploadRes.data?.data;
            toast.success(
                `🎉 Ingested: ${invoiceData?.vendorName || displayVendor} (${formatCurrency(invoiceData?.extractedData?.totalAmount || '0.00', invoiceData?.extractedData?.currency || 'USD')})`,
                { id: toastId, duration: 5000 }
            );
            refetch();
        } catch (err) {
            console.error('Sample ingestion error:', err);
            toast.error(err.response?.data?.error || 'Failed to analyze sample invoice', { id: toastId });
        } finally {
            setIsIngestingSample(false);
        }
    };

    const handleSyncEmail = async (forceParam = false) => {
        const force = typeof forceParam === 'boolean' ? forceParam : false;
        setIsSyncingEmail(true);
        const toastId = toast.loading(force ? 'Force re-importing all inbox invoices...' : 'Scanning Gmail inbox (jaltaasholaa@gmail.com)...');
        try {
            const res = await api.post('/email/sync', { force });
            const data = res.data;
            if (data?.newInvoicesCount > 0) {
                const names = data.ingestedInvoices?.map(i => `${i.vendorName} (${i.currency} ${i.totalAmount})`).join(', ');
                toast.success(`🎉 Ingested ${data.newInvoicesCount} new invoice(s): ${names}!`, { id: toastId, duration: 5000 });
            } else {
                toast.success(data?.message || 'Inbox checked. All invoices are up to date.', { id: toastId });
            }
            refetch();
        } catch (err) {
            console.error('Email sync failed:', err);
            toast.error(err.response?.data?.error || err.message || 'Could not check email inbox', { id: toastId });
        } finally {
            setIsSyncingEmail(false);
        }
    };

    const handleGenerateCfoBrief = async () => {
        setIsCfoModalOpen(true);
        fetchCfoBrief();
    };

    const fetchCfoBrief = async () => {
        setIsGeneratingBrief(true);
        try {
            const res = await api.post('/invoices/cfo-brief', { baseCurrency });
            setCfoBriefData(res.data?.data);
        } catch (err) {
            console.error('CFO Brief failed:', err);
            toast.error(err.response?.data?.error || 'Failed to generate CFO Brief');
        } finally {
            setIsGeneratingBrief(false);
        }
    };

    return (
        <div className="w-full space-y-4 relative pb-16">
            <Toaster position="top-center" />

            {/* Recruiter & Interviewer Welcome / Quick Action Guide */}
            <RecruiterGuideBanner 
                onIngestSample={handleIngestSample}
                isIngesting={isIngestingSample}
                onOpenCfoBrief={handleGenerateCfoBrief}
            />

            {/* Interactive Multi-Layer Scroll-Driven Workstation */}
            <WorkstationScrollHero
                onUploadClick={() => document.getElementById('direct-upload-input')?.click()}
                onSyncEmailClick={() => handleSyncEmail(false)}
                isSyncingEmail={isSyncingEmail}
                onIngestSampleClick={handleIngestSample}
                isIngestingSample={isIngestingSample}
                invoicesCount={invoices?.length || 0}
                syncRate={stats.syncRate}
            />

            {/* Page Header */}
            <div id="invoices-table-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Invoices
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Centralized document extraction and live Google Sheets ledger sync.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Base Currency Selector */}
                    <div className="flex items-center p-0.5 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg text-xs font-mono">
                        {['USD', 'EUR', 'INR', 'GBP'].map(curr => (
                            <button
                                key={curr}
                                onClick={() => setBaseCurrency(curr)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                                    baseCurrency === curr
                                        ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                                title={`Portfolio normalization: ${curr}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>

                    {/* Quick Demo Ingest Button for Reviewers */}
                    <button
                        onClick={() => handleIngestSample('/samples/aws-invoice.pdf', 'aws-invoice.pdf', 'AWS Cloud')}
                        disabled={isIngestingSample}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        title="1-Click Demo Ingestion (AWS Cloud)"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{isIngestingSample ? 'Ingesting...' : '⚡ Ingest Sample'}</span>
                    </button>

                    {/* Direct Upload Any Invoice */}
                    <label className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium ${
                        isUploadingRandom 
                            ? 'bg-violet-700 text-white cursor-wait opacity-80' 
                            : 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer shadow-xs active:scale-[0.98]'
                    } transition-all`}>
                        {isUploadingRandom ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingRandom ? 'Extracting...' : 'Upload Invoice'}</span>
                        <input
                            id="direct-upload-input"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            disabled={isUploadingRandom}
                            onChange={handleDirectUpload}
                        />
                    </label>

                    {/* Sync Email */}
                    <button
                        onClick={() => handleSyncEmail(false)}
                        disabled={isSyncingEmail}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-gray-300 transition active:scale-[0.98] cursor-pointer"
                        title="Scan connected Gmail inbox (jaltaasholaa@gmail.com)"
                    >
                        <Mail className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 ${isSyncingEmail ? 'animate-spin' : ''}`} />
                        <span>{isSyncingEmail ? 'Scanning...' : 'Sync Email'}</span>
                    </button>

                    {/* Financial Brief */}
                    <button
                        onClick={handleGenerateCfoBrief}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-gray-300 transition cursor-pointer"
                        title="Generate financial summary report"
                    >
                        <FileText className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span>Financial Brief</span>
                    </button>

                    {/* Simulator Presets */}
                    <button
                        onClick={() => navigate('/simulate')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-gray-300 transition cursor-pointer"
                        title="Open simulation runner"
                    >
                        <span>Simulator</span>
                    </button>

                    {stats.total > 0 && (
                        <button
                            onClick={() => setIsClearAllModalOpen(true)}
                            className="p-2 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-rose-500 hover:border-rose-500/30 transition cursor-pointer"
                            title="Clear all invoices"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <button
                        onClick={() => refetch()}
                        className="p-2 rounded-lg border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 transition cursor-pointer"
                        title="Refresh data"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Google Sheets Reconnect / Sync Alert */}
            {userProfile && !userProfile.hasGoogleConnection && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Google Sheets Disconnected
                            </p>
                            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                                Invoices are parsed and saved in database, but automatic push to Google Sheets requires connecting your Google account.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/settings')}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-xs transition whitespace-nowrap self-start sm:self-auto cursor-pointer"
                    >
                        Connect Google Sheets
                    </button>
                </div>
            )}

            {/* 4-KPI Metric Strip (Styled with Uiverse Concentric Solar & Dual-Zone Architecture) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Invoices (Indigo / Royal Violet) */}
                <div className="rounded-[25px] overflow-hidden border border-indigo-500/30 bg-[#0F1426] shadow-[0_12px_30px_rgba(15,20,38,0.6)] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-indigo-500/20 group">
                    {/* Upper Info Section with Concentric Circles */}
                    <div className="relative p-5 overflow-hidden text-white flex flex-col justify-between min-h-[148px] bg-gradient-to-br from-[#1E2548] to-[#141A35]">
                        {/* Background Design: 3 Concentric Solar/Orbital Circles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[75%] -right-[40%] w-[280px] h-[280px] rounded-full bg-indigo-500/30 blur-[0.5px]" />
                            <div className="absolute -top-[60%] -right-[25%] w-[190px] h-[190px] rounded-full bg-blue-400/30" />
                            <div className="absolute -top-[30%] -right-[5%] w-[95px] h-[95px] rounded-full bg-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.7)]" />
                        </div>

                        {/* Top Metadata Row */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10">
                                    <FileText className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                                    Total Invoices
                                </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold">
                                RFC 2177
                            </span>
                        </div>

                        {/* Bottom Metric & Sub-Range Row */}
                        <div className="relative z-10 flex items-end justify-between mt-3">
                            <div>
                                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                                    {stats.total}
                                </div>
                                <div className="text-[11px] text-indigo-200/80 font-mono mt-0.5">
                                    {stats.processed} Synced · {stats.review} In Review
                                </div>
                            </div>
                            <div className="text-right text-[11px] font-mono text-slate-300">
                                <div className="text-xs text-white font-bold">100% Ingest</div>
                                <div className="text-[10px] text-indigo-300">Zero Loss</div>
                            </div>
                        </div>
                    </div>

                    {/* Recessed Days-Section Dock Strip */}
                    <div className="flex items-center justify-between w-full bg-[#0B0E1B] p-1.5 gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06]">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 ${
                                statusFilter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                            }`}
                        >
                            <span>ALL ({stats.total})</span>
                        </button>
                        <button
                            onClick={() => setStatusFilter('processed')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 ${
                                statusFilter === 'processed'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                            }`}
                        >
                            <span>SYNCED ({stats.processed})</span>
                        </button>
                        <button
                            onClick={() => setStatusFilter('review_needed')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 ${
                                statusFilter === 'review_needed'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                            }`}
                        >
                            <span>REVIEW ({stats.review})</span>
                        </button>
                    </div>
                </div>

                {/* 2. Total Normalized Volume (Emerald / Forest Mint) */}
                <div className="rounded-[25px] overflow-hidden border border-emerald-500/30 bg-[#0B1E19] shadow-[0_12px_30px_rgba(11,30,25,0.6)] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-emerald-500/20 group">
                    {/* Upper Info Section with Concentric Circles */}
                    <div className="relative p-5 overflow-hidden text-white flex flex-col justify-between min-h-[148px] bg-gradient-to-br from-[#123E33] to-[#0A261F]">
                        {/* Background Design: 3 Concentric Solar/Orbital Circles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[75%] -right-[40%] w-[280px] h-[280px] rounded-full bg-emerald-500/30 blur-[0.5px]" />
                            <div className="absolute -top-[60%] -right-[25%] w-[190px] h-[190px] rounded-full bg-teal-400/30" />
                            <div className="absolute -top-[30%] -right-[5%] w-[95px] h-[95px] rounded-full bg-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.7)]" />
                        </div>

                        {/* Top Metadata Row */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10">
                                    <DollarSign className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                                    Normalized Volume
                                </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-bold">
                                {baseCurrency} BASE
                            </span>
                        </div>

                        {/* Bottom Metric & Sub-Range Row */}
                        <div className="relative z-10 flex items-end justify-between mt-3">
                            <div className="min-w-0 pr-2">
                                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm truncate">
                                    {formatCurrency(stats.totalAmount, baseCurrency)}
                                </div>
                                <div className="text-[11px] text-emerald-200/80 font-mono mt-0.5 truncate">
                                    Consolidated Supplier Volume
                                </div>
                            </div>
                            <div className="text-right text-[11px] font-mono text-slate-300 shrink-0">
                                <div className="text-xs text-amber-300 font-bold">{invoices?.length || 0} Bills</div>
                                <div className="text-[10px] text-emerald-300">Multi-Curr</div>
                            </div>
                        </div>
                    </div>

                    {/* Recessed Days-Section Dock Strip */}
                    <div className="flex items-center justify-between w-full bg-[#061411] p-1.5 gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06]">
                        {['USD', 'EUR', 'INR'].map((curr) => (
                            <button
                                key={curr}
                                onClick={() => setBaseCurrency(curr)}
                                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 ${
                                    baseCurrency === curr
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                                }`}
                            >
                                <span>{curr} {curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '₹'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Automation Rate (Cyan / Cyber Blue) */}
                <div className="rounded-[25px] overflow-hidden border border-cyan-500/30 bg-[#0A1A2A] shadow-[0_12px_30px_rgba(10,26,42,0.6)] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/20 group">
                    {/* Upper Info Section with Concentric Circles */}
                    <div className="relative p-5 overflow-hidden text-white flex flex-col justify-between min-h-[148px] bg-gradient-to-br from-[#0F3554] to-[#0A2238]">
                        {/* Background Design: 3 Concentric Solar/Orbital Circles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[75%] -right-[40%] w-[280px] h-[280px] rounded-full bg-cyan-500/30 blur-[0.5px]" />
                            <div className="absolute -top-[60%] -right-[25%] w-[190px] h-[190px] rounded-full bg-sky-400/30" />
                            <div className="absolute -top-[30%] -right-[5%] w-[95px] h-[95px] rounded-full bg-indigo-400/80 shadow-[0_0_25px_rgba(129,140,248,0.7)]" />
                        </div>

                        {/* Top Metadata Row */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10">
                                    <Zap className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                                    Automation Rate
                                </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold">
                                GROQ LPU AI
                            </span>
                        </div>

                        {/* Bottom Metric & Sub-Range Row */}
                        <div className="relative z-10 flex items-end justify-between mt-3">
                            <div>
                                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                                    {stats.syncRate}%
                                </div>
                                <div className="text-[11px] text-cyan-200/80 font-mono mt-0.5">
                                    Automated Spreadsheet Sync
                                </div>
                            </div>
                            <div className="text-right text-[11px] font-mono text-slate-300">
                                <div className="text-xs text-cyan-300 font-bold">&lt;280ms</div>
                                <div className="text-[10px] text-slate-400">Avg Latency</div>
                            </div>
                        </div>
                    </div>

                    {/* Recessed Days-Section Dock Strip */}
                    <div className="flex items-center justify-between w-full bg-[#050E17] p-1.5 gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06]">
                        <button
                            onClick={() => handleSyncEmail(false)}
                            disabled={isSyncingEmail}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]"
                        >
                            <span>{isSyncingEmail ? 'SYNCING...' : 'SYNC IMAP'}</span>
                        </button>
                        <button
                            onClick={() => handleIngestSample('aws', 'aws-invoice.pdf', 'AWS Cloud')}
                            disabled={isIngestingSample}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                        >
                            <span>INGEST AWS</span>
                        </button>
                        <button
                            onClick={handleGenerateCfoBrief}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]"
                        >
                            <span>CFO BRIEF</span>
                        </button>
                    </div>
                </div>

                {/* 4. Review Queue (Warm Sunset Coral / Gold - Exact Uiverse Reference Aesthetic) */}
                <div className="rounded-[25px] overflow-hidden border border-amber-500/30 bg-[#281318] shadow-[0_12px_30px_rgba(40,19,24,0.6)] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-amber-500/20 group">
                    {/* Upper Info Section with Concentric Circles */}
                    <div className="relative p-5 overflow-hidden text-white flex flex-col justify-between min-h-[148px] bg-gradient-to-br from-[#EC7263] via-[#CA5861] to-[#974859]">
                        {/* Background Design: 3 Concentric Solar/Orbital Circles (Exact Uiverse geometry) */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[80%] -right-[50%] w-[300px] h-[300px] rounded-full bg-[#EFC745] opacity-40 blur-[0.5px]" />
                            <div className="absolute -top-[70%] -right-[30%] w-[210px] h-[210px] rounded-full bg-[#EFC745] opacity-40" />
                            <div className="absolute -top-[35%] -right-[8%] w-[100px] h-[100px] rounded-full bg-[#EFC745] opacity-100 shadow-[0_0_25px_rgba(239,199,69,0.8)]" />
                        </div>

                        {/* Top Metadata Row */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-black/20 backdrop-blur-md text-amber-200 border border-white/20">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                                    Review Queue
                                </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/25 text-white border border-white/25 font-bold">
                                FORENSIC AUDIT
                            </span>
                        </div>

                        {/* Bottom Metric & Sub-Range Row */}
                        <div className="relative z-10 flex items-end justify-between mt-3">
                            <div>
                                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                                    {stats.review}
                                </div>
                                <div className="text-[11px] text-white/90 font-mono mt-0.5">
                                    Requires Human Verification
                                </div>
                            </div>
                            <div className="text-right text-[11px] font-mono text-white/95">
                                <div className="text-xs text-[#EFC745] font-extrabold">{stats.review === 0 ? 'ALL VERIFIED' : 'ACTION REQ'}</div>
                                <div className="text-[10px] text-white/80">Sum Integrity</div>
                            </div>
                        </div>
                    </div>

                    {/* Recessed Days-Section Dock Strip (Exact Uiverse #974859 / #a75265) */}
                    <div className="flex items-center justify-between w-full bg-[#974859] p-1.5 gap-1.5 shadow-[inset_0_2px_5px_#753644] border-t border-black/15">
                        <button
                            onClick={() => setStatusFilter('review_needed')}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 bg-[#a75265] text-white shadow-[inset_0_1px_3px_#974859]"
                        >
                            <span>SHOW QUEUE</span>
                        </button>
                        <button
                            onClick={() => setNlFilter(prev => ({ ...prev, active: true, mathDiscrepancyOnly: !prev.mathDiscrepancyOnly }))}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 ${
                                nlFilter?.mathDiscrepancyOnly
                                    ? 'bg-[#EFC745] text-slate-900 shadow-md font-extrabold'
                                    : 'bg-[#a75265] text-white shadow-[inset_0_1px_3px_#974859]'
                            }`}
                        >
                            <span>MATH AUDIT</span>
                        </button>
                        <button
                            onClick={() => { setStatusFilter('all'); setNlFilter({ active: false }); }}
                            className="flex-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer hover:scale-95 bg-[#a75265] text-white shadow-[inset_0_1px_3px_#974859]"
                        >
                            <span>RESET</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Spend & Supplier Analytics */}
            <SpendAnalytics invoices={invoices} baseCurrency={baseCurrency} />

            {/* Unified Filter, Search & Export Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.06] self-start">
                        {[
                            { id: 'all', label: 'All Invoices', count: stats.total },
                            { id: 'processed', label: 'Processed', count: stats.processed },
                            { id: 'review_needed', label: 'Needs Review', count: stats.review },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                                    statusFilter === tab.id
                                        ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                                    statusFilter === tab.id
                                        ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 font-mono'
                                        : 'bg-gray-200/60 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 font-mono'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Right Toolbar Controls: Integrated Search, Sort & Export */}
                    <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
                        {/* Unified Search Input */}
                        <div className="relative flex-1 sm:w-80 sm:flex-none">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search vendor, invoice #, amount..."
                                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-violet-500 transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-xs text-gray-700 dark:text-gray-300">
                            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer text-xs"
                            >
                                <option value="date_desc" className="dark:bg-[#111827]">Newest First</option>
                                <option value="date_asc" className="dark:bg-[#111827]">Oldest First</option>
                                <option value="amount_desc" className="dark:bg-[#111827]">Amount: High to Low</option>
                                <option value="amount_asc" className="dark:bg-[#111827]">Amount: Low to High</option>
                                <option value="confidence_desc" className="dark:bg-[#111827]">Confidence: High to Low</option>
                            </select>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleExportFiltered('csv')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] text-xs font-medium text-gray-700 dark:text-gray-300 transition cursor-pointer"
                                title="Export to CSV"
                            >
                                <Download className="w-3.5 h-3.5" />
                                CSV
                            </button>
                            <button
                                onClick={() => handleExportFiltered('json')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] text-xs font-medium text-gray-700 dark:text-gray-300 transition cursor-pointer"
                                title="Export to JSON"
                            >
                                <Download className="w-3.5 h-3.5" />
                                JSON
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Filter Chips & Active Filter Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-white/[0.04] text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mr-1">Quick Filters:</span>
                        {[
                            { label: '> $1,000', filter: { active: true, minAmount: 1000, explanation: 'Amount > $1,000' } },
                            { label: 'Math Discrepancy', filter: { active: true, mathDiscrepancyOnly: true, explanation: 'Math Discrepancies' } },
                            { label: 'INR (₹)', filter: { active: true, currency: 'INR', explanation: 'Currency: INR' } },
                            { label: 'EUR (€)', filter: { active: true, currency: 'EUR', explanation: 'Currency: EUR' } },
                        ].map((chip, idx) => {
                            const isCurrent = nlFilter?.explanation === chip.filter.explanation;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setNlFilter(isCurrent ? null : chip.filter)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                        isCurrent
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            );
                        })}
                    </div>

                    {nlFilter?.active && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-medium">
                            <span>Filter: {nlFilter.explanation}</span>
                            <button
                                onClick={() => setNlFilter(null)}
                                className="p-0.5 hover:text-violet-800 dark:hover:text-violet-200 cursor-pointer"
                                title="Clear filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Batch Action Toolbar */}
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-violet-600 dark:text-violet-400">
                                {selectedIds.size} invoice{selectedIds.size > 1 ? 's' : ''} selected
                            </span>
                            <span className="text-gray-400">|</span>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition underline cursor-pointer"
                            >
                                Deselect all
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleExportFiltered('csv')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 font-medium transition cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export Selected
                            </button>
                            <button
                                onClick={handleDeleteBatch}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium transition cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Invoices Data Table */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoices...</p>
                    </div>
                ) : processedInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/75 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 w-10">
                                        <input
                                            type="checkbox"
                                            checked={processedInvoices.length > 0 && selectedIds.size === processedInvoices.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded text-violet-600 border-gray-300 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-5 py-3.5">Vendor & Engine</th>
                                    <th className="px-5 py-3.5">Invoice #</th>
                                    <th className="px-5 py-3.5">Date / Due</th>
                                    <th className="px-5 py-3.5">Amount ({baseCurrency})</th>
                                    <th className="px-5 py-3.5">Confidence</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                {processedInvoices.map((invoice) => {
                                    const isSelected = selectedIds.has(invoice._id);
                                    const isProcessed = invoice.status === 'processed';
                                    const confScore = invoice.confidenceScore ?? (isProcessed ? 95 : 45);
                                    const isHighConf = confScore >= 80;
                                    const invCurrency = invoice.extractedData?.currency || 'USD';
                                    const rawTotal = invoice.extractedData?.totalAmount || '0.00';
                                    const parsedNum = parseFloat(String(rawTotal).replace(/[^0-9.-]/g, '')) || 0;
                                    const convertedTotal = convertCurrency(parsedNum, invCurrency, baseCurrency);

                                    return (
                                        <tr 
                                            key={invoice._id}
                                            onClick={() => setDrawerInvoice(invoice)}
                                            className={`hover:bg-gray-50/60 dark:hover:bg-white/[0.02] cursor-pointer transition-colors group ${
                                                isSelected ? 'bg-violet-50/40 dark:bg-violet-500/[0.04]' : ''
                                            }`}
                                        >
                                            {/* Row Checkbox */}
                                            <td className="px-5 py-4" onClick={(e) => toggleSelectRow(invoice._id, e)}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 rounded text-violet-600 border-gray-300 focus:ring-violet-500 cursor-pointer"
                                                />
                                            </td>

                                            {/* Vendor Name */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
                                                            {invoice.vendorName || invoice.extractedData?.vendorName || 'Auto-Detected Vendor'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                                            <Mail className="w-3 h-3 shrink-0" />
                                                            {invoice.senderEmail || 'No Email'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Invoice # */}
                                            <td className="px-5 py-4">
                                                {invoice.extractedData?.invoiceNumber ? (
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            {invoice.extractedData.invoiceNumber}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleCopy(invoice.extractedData.invoiceNumber, invoice._id, e)}
                                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition"
                                                            title="Copy Invoice #"
                                                        >
                                                            {copiedId === invoice._id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic font-mono">—</span>
                                                )}
                                            </td>

                                            {/* Date / Due Date */}
                                            <td className="px-5 py-4">
                                                <div className="text-xs flex flex-col">
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {invoice.extractedData?.invoiceDate || '—'}
                                                    </span>
                                                    {invoice.extractedData?.dueDate && (
                                                        <span className="text-[10px] text-gray-400">
                                                            Due: {invoice.extractedData.dueDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Amount, Multi-Currency Normalization & Math Audit */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(rawTotal, invCurrency)}
                                                    </span>
                                                    {invCurrency.toUpperCase() !== baseCurrency.toUpperCase() && (
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            ≈ {formatCurrency(convertedTotal, baseCurrency)}
                                                        </span>
                                                    )}
                                                    {invoice.extractedData?.mathAudit && (
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium ${
                                                            invoice.extractedData.mathAudit.isValid !== false
                                                                ? 'text-emerald-500'
                                                                : 'text-amber-500'
                                                        }`}>
                                                            {invoice.extractedData.mathAudit.isValid !== false ? (
                                                                <>
                                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                                    100% Match
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertTriangle className="w-2.5 h-2.5" />
                                                                    Δ {formatCurrency(invoice.extractedData.mathAudit.discrepancy || '0.00', invCurrency)}
                                                                </>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Confidence Score */}
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium ${
                                                    isHighConf
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : confScore >= 60
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                    {confScore}%
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4">
                                                {invoice.status === 'processed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Processed
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/review/${invoice._id}`);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
                                                        title="Click to map coordinates"
                                                    >
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Review Needed
                                                    </button>
                                                )}
                                            </td>

                                            {/* Action Icons */}
                                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setDrawerInvoice(invoice)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
                                                        title="Quick View Drawer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSingle(invoice._id, e)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="py-16 px-4 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {nlFilter?.active || searchQuery ? 'No matching invoices found' : 'No invoices in your database'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
                            {nlFilter?.active || searchQuery 
                                ? 'Try adjusting your AI filter or search terms.' 
                                : 'Upload a PDF invoice or send an email attachment to populate your command center.'}
                        </p>
                        {nlFilter?.active || searchQuery ? (
                            <button
                                onClick={() => {
                                    setNlFilter(null);
                                    setSearchQuery('');
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition cursor-pointer"
                            >
                                Clear All Filters
                            </button>
                        ) : (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                    onClick={() => navigate('/simulate')}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    Simulate an Invoice
                                </button>
                                <button
                                    onClick={() => handleSyncEmail(true)}
                                    disabled={isSyncingEmail}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 transition cursor-pointer"
                                    title="Re-import historical invoices from jaltaasholaa@gmail.com"
                                >
                                    <Mail className={`w-3.5 h-3.5 text-violet-500 ${isSyncingEmail ? 'animate-spin' : ''}`} />
                                    Re-import Inbox Invoices
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Slide-Over Quick View Drawer */}
            <InvoiceDrawer
                invoice={drawerInvoice}
                isOpen={!!drawerInvoice}
                onClose={() => setDrawerInvoice(null)}
                onDelete={(id) => {
                    handleDeleteSingle(id);
                }}
                onApprove={handleApproveFromDrawer}
            />

            {/* CFO Intelligence Brief Modal */}
            <CfoBriefModal
                isOpen={isCfoModalOpen}
                onClose={() => setIsCfoModalOpen(false)}
                briefData={cfoBriefData}
                isLoading={isGeneratingBrief}
                onRefresh={fetchCfoBrief}
                baseCurrency={baseCurrency}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title={isBatchDelete ? `Delete ${selectedIds.size} Invoices` : "Delete Invoice"}
                message={
                    isBatchDelete
                        ? `Are you sure you want to permanently delete these ${selectedIds.size} invoices? This action cannot be undone.`
                        : "Are you sure you want to delete this invoice? This action cannot be undone."
                }
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteId(null);
                    setIsBatchDelete(false);
                }}
                confirmText={isBatchDelete ? "Delete All Selected" : "Delete"}
                isDanger={true}
            />

            {/* Clear All Invoices Confirmation Modal */}
            <ConfirmationModal
                isOpen={isClearAllModalOpen}
                title="Clear All Invoices from Database?"
                message="Are you sure you want to delete ALL invoices from MongoDB? This will also reset the IMAP email cache so you can test re-sending and re-ingesting invoices from scratch."
                onConfirm={handleClearAllInvoices}
                onCancel={() => setIsClearAllModalOpen(false)}
                confirmText="Yes, Clear Everything"
                isDanger={true}
            />
        </div>
    );
}
