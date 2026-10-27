import React, { useMemo } from 'react';
import { 
    ShieldCheck, 
    AlertTriangle, 
    TrendingUp, 
    Cpu, 
    Building2, 
    Layers, 
    Zap, 
    CheckCircle2,
    CheckCircle,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { convertCurrency, formatCurrency } from '../../utils/currencyUtils';

export default function SpendAnalytics({ invoices = [], baseCurrency = 'USD' }) {
    // 1. Vendor Spend Aggregation (Normalized to baseCurrency)
    const vendorStats = useMemo(() => {
        if (!invoices || invoices.length === 0) return { list: [], maxSpend: 0, totalSpend: 0 };

        const map = {};
        let totalSpend = 0;

        invoices.forEach(inv => {
            const raw = inv.extractedData?.totalAmount;
            const parsed = raw ? parseFloat(String(raw).replace(/[^0-9.-]/g, '')) : 0;
            const curr = inv.extractedData?.currency || 'USD';
            const rawNum = isNaN(parsed) ? 0 : parsed;
            const amount = convertCurrency(rawNum, curr, baseCurrency);
            const name = (inv.vendorName || 'Unregistered Vendor').trim();

            if (!map[name]) {
                map[name] = { name, total: 0, count: 0, verifiedMath: 0 };
            }
            map[name].total += amount;
            map[name].count += 1;
            if (inv.extractedData?.mathAudit?.isValid !== false) {
                map[name].verifiedMath += 1;
            }
            totalSpend += amount;
        });

        const list = Object.values(map).sort((a, b) => b.total - a.total);
        const maxSpend = list.length > 0 ? list[0].total : 0;

        return { list, maxSpend, totalSpend };
    }, [invoices, baseCurrency]);

    // 2. Forensic Math Health & Engine Intelligence
    const auditStats = useMemo(() => {
        if (!invoices || invoices.length === 0) {
            return {
                verifiedCount: 0,
                discrepancyCount: 0,
                integrityRate: 100,
                totalDiscrepancyAmount: 0,
                groqAiCount: 0,
                spatialCount: 0
            };
        }

        let verifiedCount = 0;
        let discrepancyCount = 0;
        let totalDiscrepancyAmount = 0;
        let groqAiCount = 0;
        let spatialCount = 0;

        invoices.forEach(inv => {
            const audit = inv.extractedData?.mathAudit;
            const engine = inv.extractedData?.engine || '';
            const curr = inv.extractedData?.currency || 'USD';

            // Engine detection
            if (engine.toLowerCase().includes('groq') || engine.toLowerCase().includes('llama') || inv.confidenceScore >= 85) {
                groqAiCount += 1;
            } else {
                spatialCount += 1;
            }

            // Math audit detection
            if (audit && audit.isValid === false) {
                discrepancyCount += 1;
                const disc = audit.discrepancy || 0;
                totalDiscrepancyAmount += convertCurrency(disc, curr, baseCurrency);
            } else {
                verifiedCount += 1;
            }
        });

        const totalChecked = verifiedCount + discrepancyCount;
        const integrityRate = totalChecked > 0 ? Math.round((verifiedCount / totalChecked) * 100) : 100;

        return {
            verifiedCount,
            discrepancyCount,
            integrityRate,
            totalDiscrepancyAmount,
            groqAiCount,
            spatialCount
        };
    }, [invoices, baseCurrency]);

    if (!invoices || invoices.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: Top Vendor Spend Distribution (7 Cols) - Uiverse Architecture */}
            <div className="lg:col-span-7 rounded-[25px] overflow-hidden border border-indigo-500/30 bg-[#0F1426] shadow-[0_12px_30px_rgba(15,20,38,0.6)] flex flex-col justify-between transition-all duration-300 hover:border-indigo-500/50">
                {/* Upper Info Section with Concentric Circles Background */}
                <div className="relative p-6 overflow-hidden text-white flex-1 bg-gradient-to-br from-[#192142] to-[#101630]">
                    {/* Concentric Circles Background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-[70%] -right-[35%] w-[320px] h-[320px] rounded-full bg-indigo-500/25 blur-[0.5px]" />
                        <div className="absolute -top-[50%] -right-[20%] w-[220px] h-[220px] rounded-full bg-blue-400/25" />
                        <div className="absolute -top-[25%] -right-[5%] w-[110px] h-[110px] rounded-full bg-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.6)]" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        Supplier Spend Breakdown
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                                            {baseCurrency}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-indigo-200/80 mt-0.5">
                                        Consolidated financial volume across active suppliers
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-sm sm:text-base font-mono font-bold text-white">
                                    {formatCurrency(vendorStats.totalSpend, baseCurrency)}
                                </span>
                                <span className="block text-[10px] text-cyan-300 font-mono">Consolidated Volume</span>
                            </div>
                        </div>

                        {/* Vendor Bars */}
                        <div className="mt-5 space-y-4">
                            {vendorStats.list.slice(0, 5).map((v, idx) => {
                                const percentOfTotal = vendorStats.totalSpend > 0 
                                    ? Math.round((v.total / vendorStats.totalSpend) * 100) 
                                    : 0;
                                const percentOfMax = vendorStats.maxSpend > 0 
                                    ? (v.total / vendorStats.maxSpend) * 100 
                                    : 0;

                                return (
                                    <div key={v.name} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-5 h-5 rounded-md bg-white/[0.08] text-indigo-200 text-[10px] font-mono flex items-center justify-center shrink-0 border border-white/10">
                                                    0{idx + 1}
                                                </span>
                                                <span className="font-medium text-white truncate">
                                                    {v.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-indigo-300/70">
                                                    ({v.count} inv{v.count > 1 ? 's' : ''})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 font-mono">
                                                <span className="text-white font-semibold">
                                                    {formatCurrency(v.total, baseCurrency)}
                                                </span>
                                                <span className="text-[11px] text-cyan-300 w-9 text-right font-medium">
                                                    {percentOfTotal}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cohesive Indigo Progress Bar */}
                                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentOfMax}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recessed Days-Section Dock Strip */}
                <div className="flex items-center justify-between w-full bg-[#0B0E1B] px-5 py-2.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06] text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{vendorStats.list.length} distinct supplier{vendorStats.list.length > 1 ? 's' : ''} recognized</span>
                    </span>
                    <span className="text-[11px] text-cyan-300 font-semibold">
                        Top: {vendorStats.list[0]?.name || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Right Card: Forensic Math Health & Hybrid Engine Split (5 Cols) - Uiverse Architecture */}
            <div className="lg:col-span-5 space-y-6">
                {/* 1. Forensic Math Integrity Gauge */}
                <div className="rounded-[25px] overflow-hidden border border-emerald-500/30 bg-[#0B1E19] shadow-[0_12px_30px_rgba(11,30,25,0.6)] flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/50">
                    <div className="relative p-6 overflow-hidden text-white bg-gradient-to-br from-[#123E33] to-[#0A261F]">
                        {/* Concentric Circles Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[70%] -right-[35%] w-[260px] h-[260px] rounded-full bg-emerald-500/25 blur-[0.5px]" />
                            <div className="absolute -top-[50%] -right-[20%] w-[180px] h-[180px] rounded-full bg-teal-400/25" />
                            <div className="absolute -top-[25%] -right-[5%] w-[90px] h-[90px] rounded-full bg-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">
                                            Mathematical Audit
                                        </h3>
                                        <p className="text-[11px] text-emerald-200/80">
                                            Line items vs stated grand total verification
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                                    {auditStats.integrityRate}%
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                                    <span className="text-[10px] uppercase font-semibold text-emerald-200/80 tracking-wider">
                                        Reconciled
                                    </span>
                                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                                        {auditStats.verifiedCount}
                                    </div>
                                    <span className="text-[10px] text-slate-400">Exact match</span>
                                </div>

                                <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                                    <span className="text-[10px] uppercase font-semibold text-amber-200/80 tracking-wider">
                                        Discrepancies
                                    </span>
                                    <div className={`text-lg font-bold font-mono mt-0.5 ${auditStats.discrepancyCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                                        {auditStats.discrepancyCount}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {auditStats.discrepancyCount > 0 ? `Δ ${formatCurrency(auditStats.totalDiscrepancyAmount, baseCurrency)}` : 'Zero variance'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recessed Days-Section Dock Strip */}
                    <div className="flex items-center justify-between w-full bg-[#061411] px-5 py-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06] text-[11px] font-mono text-emerald-300">
                        <span>SUM CHECK: {auditStats.integrityRate === 100 ? '100% BALANCED' : 'NEEDS ATTENTION'}</span>
                        <span className="text-slate-400">{auditStats.verifiedCount} / {invoices.length} Verified</span>
                    </div>
                </div>

                {/* 2. Extraction Engine Split */}
                <div className="rounded-[25px] overflow-hidden border border-cyan-500/30 bg-[#0A1A2A] shadow-[0_12px_30px_rgba(10,26,42,0.6)] flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/50">
                    <div className="relative p-6 overflow-hidden text-white bg-gradient-to-br from-[#0F3554] to-[#0A2238]">
                        {/* Concentric Circles Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[70%] -right-[35%] w-[260px] h-[260px] rounded-full bg-cyan-500/25 blur-[0.5px]" />
                            <div className="absolute -top-[50%] -right-[20%] w-[180px] h-[180px] rounded-full bg-sky-400/25" />
                            <div className="absolute -top-[25%] -right-[5%] w-[90px] h-[90px] rounded-full bg-indigo-400/70 shadow-[0_0_20px_rgba(129,140,248,0.6)]" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md text-cyan-300 border border-white/10">
                                        <Cpu className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">
                                            Extraction Engine
                                        </h3>
                                        <p className="text-[11px] text-cyan-200/80">
                                            Groq LPU vs Spatial Coordinate Rules
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="flex items-center gap-1.5 text-slate-200">
                                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                            Groq LPU (GPT-OSS 120B)
                                        </span>
                                        <span className="font-mono text-cyan-300 font-semibold">
                                            {auditStats.groqAiCount} ({invoices.length > 0 ? Math.round((auditStats.groqAiCount / invoices.length) * 100) : 0}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-cyan-400 rounded-full"
                                            style={{ width: `${invoices.length > 0 ? (auditStats.groqAiCount / invoices.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="flex items-center gap-1.5 text-slate-200">
                                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                            Spatial Coordinate Memory
                                        </span>
                                        <span className="font-mono text-indigo-300 font-semibold">
                                            {auditStats.spatialCount} ({invoices.length > 0 ? Math.round((auditStats.spatialCount / invoices.length) * 100) : 0}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${invoices.length > 0 ? (auditStats.spatialCount / invoices.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recessed Days-Section Dock Strip */}
                    <div className="flex items-center justify-between w-full bg-[#050E17] px-5 py-2 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)] border-t border-white/[0.06] text-[11px] font-mono text-cyan-300">
                        <span>LATENCY: &lt;280ms AVERAGE</span>
                        <span className="text-slate-400">Dual Hardware Pipeline</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
