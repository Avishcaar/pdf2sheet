import { useState, useMemo } from 'react';
import { useVendors } from '../../hooks/useVendors';
import AddVendorModal from '../../components/vendors/AddVendorModal';
import EditVendorModal from '../../components/vendors/EditVendorModal';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
    Store, 
    Sparkles, 
    Crosshair, 
    Layers, 
    Search, 
    Plus, 
    ExternalLink, 
    Mail, 
    CheckCircle, 
    Clock, 
    X,
    Cpu,
    ArrowUpRight
} from 'lucide-react';

export default function Vendors() {
    const { data: vendors, isLoading, error } = useVendors();
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    // KPI Metrics
    const stats = useMemo(() => {
        if (!vendors || vendors.length === 0) {
            return { total: 0, coordinateRules: 0, heuristicRules: 0 };
        }
        let coordinateRules = 0;
        let heuristicRules = 0;

        vendors.forEach(v => {
            (v.extractionRules || []).forEach(r => {
                if (r.method === 'coordinate') coordinateRules++;
                else heuristicRules++;
            });
        });

        return {
            total: vendors.length,
            coordinateRules,
            heuristicRules
        };
    }, [vendors]);

    // Filtered Vendors
    const filteredVendors = useMemo(() => {
        if (!vendors) return [];
        if (!searchQuery.trim()) return vendors;
        const q = searchQuery.toLowerCase().trim();
        return vendors.filter(v => 
            (v.vendorName && v.vendorName.toLowerCase().includes(q)) ||
            (v.senderEmail && v.senderEmail.toLowerCase().includes(q))
        );
    }, [vendors, searchQuery]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        Vendors & Learned Models
                        <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            Coordinate Hub
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Directory of discovered invoice senders, spatial bounding box rules, and OCR confidence weights.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Add Vendor Rule
                    </button>
                </div>
            </div>

            {/* 3-KPI Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Total Discovered Vendors */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Discovered Vendors
                        </span>
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                            <Store className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono text-gray-900 dark:text-white">
                        {stats.total}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Email identities mapped in database
                    </p>
                </div>

                {/* 2. Spatial Coordinate Rules */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Learned Coordinates
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Crosshair className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono text-gray-900 dark:text-white">
                        {stats.coordinateRules}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        100% precision spatial bounding boxes
                    </p>
                </div>

                {/* 3. Heuristic Rules */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Heuristic Proximity
                        </span>
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                            <Cpu className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-3xl font-bold font-mono text-gray-900 dark:text-white">
                        {stats.heuristicRules}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Keyword & token proximity fallbacks
                    </p>
                </div>
            </div>

            {/* Search Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search vendor name or sender email..."
                        className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-violet-500 transition"
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

                <span className="text-xs text-gray-400 font-mono hidden sm:inline-block">
                    Showing {filteredVendors.length} of {stats.total} vendors
                </span>
            </div>

            {/* Vendor Cards Grid */}
            {isLoading ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Loading vendor models...</p>
                </div>
            ) : filteredVendors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredVendors.map((vendor) => {
                        const rulesCount = vendor.extractionRules?.length || 0;
                        const hasCoordinates = vendor.extractionRules?.some(r => r.method === 'coordinate');

                        return (
                            <div
                                key={vendor._id}
                                className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center text-sm border border-violet-500/20">
                                                {vendor.vendorName?.charAt(0) || 'V'}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {vendor.vendorName}
                                                </h3>
                                                <p className="text-xs font-mono text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3" />
                                                    {vendor.senderEmail || 'No sender email'}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                            hasCoordinates
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        }`}>
                                            {hasCoordinates ? 'Learned' : 'Heuristic'}
                                        </span>
                                    </div>

                                    {/* Extraction Rules List */}
                                    <div className="space-y-1.5 my-4">
                                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                            Active Field Bounding Boxes ({rulesCount})
                                        </p>

                                        {rulesCount > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {vendor.extractionRules.map((rule, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] text-gray-700 dark:text-gray-300"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            rule.method === 'coordinate' ? 'bg-emerald-500' : 'bg-cyan-500'
                                                        }`} />
                                                        <span className="font-medium capitalize">{rule.targetField}</span>
                                                        {rule.method === 'coordinate' && (
                                                            <span className="text-[10px] font-mono text-gray-400">
                                                                (x:{Math.round(rule.coordinates?.x || 0)}, y:{Math.round(rule.coordinates?.y || 0)})
                                                            </span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">
                                                No extraction rules mapped yet.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingVendor(vendor)}
                                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04] text-xs font-medium text-gray-700 dark:text-gray-300 transition flex items-center justify-center gap-1.5"
                                    >
                                        Edit Rules
                                    </button>
                                    <button
                                        onClick={() => navigate('/simulate')}
                                        className="py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-xs font-medium transition flex items-center justify-center gap-1"
                                        title="Simulate invoice for this vendor"
                                    >
                                        Test Bill
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-16 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] flex items-center justify-center mb-4 text-gray-400">
                        <Store className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {searchQuery ? 'No matching vendors' : 'No learned vendors yet'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                        {searchQuery
                            ? 'Try clearing your search query to see all registered vendors.'
                            : 'Upload a sample invoice in the simulator to automatically create your first vendor profile.'}
                    </p>
                    {searchQuery ? (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-4 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300 transition"
                        >
                            Reset Search
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/simulate')}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/20 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Simulate First Vendor Invoice
                        </button>
                    )}
                </div>
            )}

            <AddVendorModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />

            <EditVendorModal
                isOpen={!!editingVendor}
                onClose={() => setEditingVendor(null)}
                vendor={editingVendor}
            />
        </div>
    );
}
