import { useState, useMemo } from 'react';
import { useVendors } from '../../hooks/useVendors';
import AddVendorModal from '../../components/vendors/AddVendorModal';
import EditVendorModal from '../../components/vendors/EditVendorModal';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { 
    Store, 
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
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Vendors
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Directory of recognized supplier profiles and extraction rules.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* 3-KPI Metrics Strip - Uiverse Concentric Architecture */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Total Discovered Vendors (Indigo) */}
                <div className="rounded-[25px] overflow-hidden border border-indigo-500/30 bg-[#0F1426] shadow-[0_12px_30px_rgba(15,20,38,0.6)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50">
                    <div className="relative p-5 overflow-hidden text-white bg-gradient-to-br from-[#1E2548] to-[#141A35]">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[70%] -right-[35%] w-[220px] h-[220px] rounded-full bg-indigo-500/25 blur-[0.5px]" />
                            <div className="absolute -top-[50%] -right-[20%] w-[150px] h-[150px] rounded-full bg-blue-400/25" />
                            <div className="absolute -top-[25%] -right-[5%] w-[75px] h-[75px] rounded-full bg-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10">
                                        <Store className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                                        Discovered Vendors
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold">
                                    IDENTITY DB
                                </span>
                            </div>

                            <div className="mt-4 flex items-end justify-between">
                                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                                    {stats.total}
                                </div>
                                <span className="text-[11px] font-mono text-indigo-200/80">
                                    Mapped Identities
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full bg-[#0B0E1B] px-4 py-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06] text-[10px] font-mono text-slate-300">
                        <span>AUTO-LEARNED FROM INBOX</span>
                        <span className="text-cyan-300 font-bold">100% STORED</span>
                    </div>
                </div>

                {/* 2. Spatial Coordinate Rules (Emerald) */}
                <div className="rounded-[25px] overflow-hidden border border-emerald-500/30 bg-[#0B1E19] shadow-[0_12px_30px_rgba(11,30,25,0.6)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50">
                    <div className="relative p-5 overflow-hidden text-white bg-gradient-to-br from-[#123E33] to-[#0A261F]">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[70%] -right-[35%] w-[220px] h-[220px] rounded-full bg-emerald-500/25 blur-[0.5px]" />
                            <div className="absolute -top-[50%] -right-[20%] w-[150px] h-[150px] rounded-full bg-teal-400/25" />
                            <div className="absolute -top-[25%] -right-[5%] w-[75px] h-[75px] rounded-full bg-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10">
                                        <Crosshair className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                                        Learned Coordinates
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-bold">
                                    BOUNDING BOX
                                </span>
                            </div>

                            <div className="mt-4 flex items-end justify-between">
                                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                                    {stats.coordinateRules}
                                </div>
                                <span className="text-[11px] font-mono text-emerald-200/80">
                                    Precision Coordinates
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full bg-[#061411] px-4 py-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06] text-[10px] font-mono text-slate-300">
                        <span>ZERO-TOUCH PARSING</span>
                        <span className="text-emerald-300 font-bold">SPATIAL MEM</span>
                    </div>
                </div>

                {/* 3. Heuristic Rules (Cyan) */}
                <div className="rounded-[25px] overflow-hidden border border-cyan-500/30 bg-[#0A1A2A] shadow-[0_12px_30px_rgba(10,26,42,0.6)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50">
                    <div className="relative p-5 overflow-hidden text-white bg-gradient-to-br from-[#0F3554] to-[#0A2238]">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[70%] -right-[35%] w-[220px] h-[220px] rounded-full bg-cyan-500/25 blur-[0.5px]" />
                            <div className="absolute -top-[50%] -right-[20%] w-[150px] h-[150px] rounded-full bg-sky-400/25" />
                            <div className="absolute -top-[25%] -right-[5%] w-[75px] h-[75px] rounded-full bg-indigo-400/70 shadow-[0_0_20px_rgba(129,140,248,0.6)]" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10">
                                        <Cpu className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                                        Heuristic Proximity
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold">
                                    FALLBACK
                                </span>
                            </div>

                            <div className="mt-4 flex items-end justify-between">
                                <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                                    {stats.heuristicRules}
                                </div>
                                <span className="text-[11px] font-mono text-cyan-200/80">
                                    Proximity Fallbacks
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full bg-[#050E17] px-4 py-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06] text-[10px] font-mono text-slate-300">
                        <span>TOKEN PROXIMITY</span>
                        <span className="text-cyan-300 font-bold">ACTIVE</span>
                    </div>
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
                <div className="p-16 flex flex-col items-center justify-center">
                    <Loader size="28px" subtitle="Loading vendor models..." />
                </div>
            ) : filteredVendors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredVendors.map((vendor) => {
                        const rulesCount = vendor.extractionRules?.length || 0;
                        const hasCoordinates = vendor.extractionRules?.some(r => r.method === 'coordinate');

                        return (
                            <div
                                key={vendor._id}
                                className="rounded-[25px] overflow-hidden border border-indigo-500/25 bg-[#0F1426] shadow-[0_12px_30px_rgba(15,20,38,0.5)] hover:shadow-xl hover:border-indigo-400/50 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                            >
                                {/* Upper Info Section with Concentric Circles Background */}
                                <div className="relative p-5 overflow-hidden text-white flex-1 flex flex-col justify-between bg-gradient-to-br from-[#1A2244] to-[#10162E]">
                                    {/* Concentric Circles Background */}
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                        <div className="absolute -top-[70%] -right-[35%] w-[220px] h-[220px] rounded-full bg-indigo-500/20 blur-[0.5px]" />
                                        <div className="absolute -top-[50%] -right-[20%] w-[150px] h-[150px] rounded-full bg-blue-400/20" />
                                        <div className="absolute -top-[25%] -right-[5%] w-[75px] h-[75px] rounded-full bg-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                                    </div>

                                    <div className="relative z-10">
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-sm border border-cyan-400/30 shadow-md">
                                                    {vendor.vendorName?.charAt(0) || 'V'}
                                                </div>
                                                <div className="min-w-0 pr-1">
                                                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                                        {vendor.vendorName}
                                                    </h3>
                                                    <p className="text-xs font-mono text-indigo-200/80 flex items-center gap-1 mt-0.5 truncate">
                                                        <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                                                        <span className="truncate">{vendor.senderEmail || 'No sender email'}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 font-bold ${
                                                hasCoordinates
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                            }`}>
                                                {hasCoordinates ? 'LEARNED' : 'HEURISTIC'}
                                            </span>
                                        </div>

                                        {/* Extraction Rules List */}
                                        <div className="space-y-1.5 my-3">
                                            <p className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                                                Active Field Bounding Boxes ({rulesCount})
                                            </p>

                                            {rulesCount > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {vendor.extractionRules.map((rule, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-black/30 border border-white/10 text-slate-200"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                rule.method === 'coordinate' ? 'bg-emerald-400' : 'bg-cyan-400'
                                                            }`} />
                                                            <span className="font-medium capitalize">{rule.targetField}</span>
                                                            {rule.method === 'coordinate' && (
                                                                <span className="text-[10px] font-mono text-cyan-300/80">
                                                                    ({Math.round(rule.coordinates?.x || 0)}, {Math.round(rule.coordinates?.y || 0)})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-indigo-200/60 italic font-mono">
                                                    No extraction rules mapped yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Recessed Days-Section Dock Strip */}
                                <div className="flex items-center justify-between w-full bg-[#0B0E1B] p-2 gap-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06]">
                                    <button
                                        onClick={() => setEditingVendor(vendor)}
                                        className="flex-1 py-1.5 px-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer hover:scale-95 flex items-center justify-center gap-1.5"
                                    >
                                        <span>EDIT RULES</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/simulate')}
                                        className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all cursor-pointer hover:scale-95 shadow-sm flex items-center justify-center gap-1"
                                        title="Simulate invoice for this vendor"
                                    >
                                        <span>TEST BILL</span>
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
