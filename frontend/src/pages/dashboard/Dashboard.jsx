import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useInvoices from '../../hooks/useInvoices';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../services/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import InvoiceDrawer from '../../components/invoices/InvoiceDrawer';
import { exportToCsv, exportToJson } from '../../utils/exportUtils';
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
    Plus
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Dashboard() {
    const { data: invoices, isLoading, error, refetch } = useInvoices();
    const navigate = useNavigate();
    const { darkMode } = useTheme();

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
    const [isBatchDelete, setIsBatchDelete] = useState(false);

    // Copied indicator
    const [copiedId, setCopiedId] = useState(null);

    // KPI Metrics
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
            return isNaN(parsed) ? acc : acc + parsed;
        }, 0);

        return { total, processed, review, syncRate, totalAmount };
    }, [invoices]);

    // Filtered & Sorted Invoices
    const processedInvoices = useMemo(() => {
        if (!invoices) return [];

        let list = [...invoices];

        // Status Filter
        if (statusFilter !== 'all') {
            list = list.filter(i => i.status === statusFilter);
        }

        // Search Query
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
                const aVal = parseFloat(String(a.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;
                const bVal = parseFloat(String(b.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;
                return bVal - aVal;
            }
            if (sortBy === 'amount_asc') {
                const aVal = parseFloat(String(a.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;
                const bVal = parseFloat(String(b.extractedData?.totalAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;
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
    }, [invoices, statusFilter, searchQuery, sortBy]);

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

    return (
        <div className="max-w-7xl mx-auto space-y-8 relative pb-16">
            <Toaster position="top-center" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        Invoices Command Center
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            Auto-Pilot
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        High-precision invoice extraction pipeline syncing live with Google Sheets.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate('/simulate')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Simulate Incoming Bill
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-300 transition"
                        title="Refresh data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 4-KPI Metric Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Invoices */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total Invoices
                        </span>
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-400">
                            <FileText className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                        {stats.total}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Ingested across all connected inboxes
                    </p>
                </div>

                {/* 2. Total Extracted Volume */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Parsed Volume
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white truncate">
                        ${stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Structured financial throughput
                    </p>
                </div>

                {/* 3. Auto-Pilot Rate */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Auto-Pilot Rate
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                        {stats.syncRate}%
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="mt-2 w-full bg-gray-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stats.syncRate}%` }} 
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {stats.processed} of {stats.total} zero-touch syncs
                    </p>
                </div>

                {/* 4. Action Required */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Needs Review
                        </span>
                        <div className={`p-2 rounded-xl ${stats.review > 0 ? 'bg-amber-500/15 text-amber-500 animate-pulse' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400'}`}>
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        {stats.review}
                        {stats.review > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-sans">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {stats.review === 0 ? 'All caught up · Zero backlog' : 'Awaiting spatial coordinate learning'}
                    </p>
                </div>
            </div>

            {/* Filter, Search & Export Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.06] self-start">
                        {[
                            { id: 'all', label: 'All Invoices', count: stats.total },
                            { id: 'processed', label: 'Auto-Pilot', count: stats.processed },
                            { id: 'review_needed', label: 'Needs Review', count: stats.review },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                                    statusFilter === tab.id
                                        ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    statusFilter === tab.id
                                        ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 font-mono'
                                        : 'bg-gray-200/60 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 font-mono'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Right Toolbar Controls: Search, Sort & Export */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search vendor, #, amount..."
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] text-xs font-medium text-gray-700 dark:text-gray-300 transition"
                                title="Export to CSV"
                            >
                                <Download className="w-3.5 h-3.5" />
                                CSV
                            </button>
                            <button
                                onClick={() => handleExportFiltered('json')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] text-xs font-medium text-gray-700 dark:text-gray-300 transition"
                                title="Export to JSON"
                            >
                                JSON
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Batch Selection Bar */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                                {selectedIds.size} invoice{selectedIds.size > 1 ? 's' : ''} selected
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleExportFiltered('csv')}
                                    className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 transition"
                                >
                                    Export Selected
                                </button>
                                <button
                                    onClick={handleDeleteBatch}
                                    className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition"
                                >
                                    Delete Selected
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Invoices Table Container */}
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center space-y-4">
                        <div className="w-9 h-9 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Syncing invoices from database...</p>
                    </div>
                ) : processedInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-[11px] uppercase tracking-wider font-semibold bg-gray-50/80 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.06]">
                                <tr>
                                    <th className="px-5 py-3.5 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === processedInvoices.length && processedInvoices.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 dark:border-white/[0.2] text-violet-600 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-5 py-3.5">Vendor / Sender</th>
                                    <th className="px-5 py-3.5">Invoice #</th>
                                    <th className="px-5 py-3.5">Dates</th>
                                    <th className="px-5 py-3.5 font-mono">Total Amount</th>
                                    <th className="px-5 py-3.5">Confidence</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                                {processedInvoices.map((invoice, idx) => {
                                    const isSelected = selectedIds.has(invoice._id);
                                    const confScore = invoice.confidenceScore ?? (invoice.status === 'processed' ? 95 : 45);
                                    const isHighConf = confScore >= 80;

                                    return (
                                        <tr
                                            key={invoice._id}
                                            onClick={() => setDrawerInvoice(invoice)}
                                            className={`group cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-violet-50/60 dark:bg-violet-950/20'
                                                    : 'hover:bg-gray-50/70 dark:hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-5 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => toggleSelectRow(invoice._id, e)}
                                                    className="rounded border-gray-300 dark:border-white/[0.2] text-violet-600 focus:ring-violet-500 cursor-pointer"
                                                />
                                            </td>

                                            {/* Vendor / Email */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30 text-violet-600 dark:text-violet-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-violet-500/20">
                                                        {invoice.vendorName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {invoice.vendorName || 'Unknown Vendor'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
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
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {invoice.extractedData?.invoiceDate || '—'}
                                                    </span>
                                                    {invoice.extractedData?.dueDate && (
                                                        <span className="text-[10px] text-gray-400">
                                                            Due: {invoice.extractedData.dueDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                                    ${invoice.extractedData?.totalAmount || '0.00'}
                                                </span>
                                            </td>

                                            {/* Confidence Score Pill */}
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                                                    isHighConf
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : confScore >= 60
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                    <Sparkles className="w-3 h-3" />
                                                    {confScore}%
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4">
                                                {invoice.status === 'processed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Auto-Pilot
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/review/${invoice._id}`);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
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
                                                        onClick={() => navigate(`/review/${invoice._id}`)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition"
                                                        title="Open in Visual Coordinate Mapper"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSingle(invoice._id, e)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
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
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center mb-4 text-gray-400">
                            <FileText className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {searchQuery || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices in the system yet'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try clearing your search query or switching your status filter to see other invoices.'
                                : 'Simulate an incoming email bill with a sample PDF to see the automatic extraction engine in action.'}
                        </p>
                        {searchQuery || statusFilter !== 'all' ? (
                            <button
                                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                                className="px-4 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 transition"
                            >
                                Reset Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/simulate')}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Simulate an Invoice Now
                            </button>
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
        </div>
    );
}
