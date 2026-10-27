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
            {/* Left Card: Top Vendor Spend Distribution (7 Cols) */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    Supplier Spend Breakdown
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08]">
                                        {baseCurrency}
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Consolidated financial volume across active suppliers
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                                {formatCurrency(vendorStats.totalSpend, baseCurrency)}
                            </span>
                            <span className="block text-[10px] text-gray-400">Total Volume</span>
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
                                            <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 text-[10px] font-mono flex items-center justify-center shrink-0">
                                                0{idx + 1}
                                            </span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {v.name}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                                                ({v.count} inv{v.count > 1 ? 's' : ''})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 font-mono">
                                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                                {formatCurrency(v.total, baseCurrency)}
                                            </span>
                                            <span className="text-[11px] text-gray-400 w-9 text-right font-medium">
                                                {percentOfTotal}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Cohesive Indigo Progress Bar */}
                                    <div className="w-full bg-gray-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentOfMax}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full rounded-full bg-violet-600 dark:bg-violet-500"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {vendorStats.list.length} distinct supplier{vendorStats.list.length > 1 ? 's' : ''} recognized
                    </span>
                    <span className="font-mono text-[11px] text-gray-400">
                        Top supplier: {vendorStats.list[0]?.name || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Right Card: Forensic Math Health & Hybrid Engine Split (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
                {/* 1. Forensic Math Integrity Gauge */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${auditStats.discrepancyCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Mathematical Audit
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Line items vs stated grand total verification
                                </p>
                            </div>
                        </div>

                        <span className={`text-xl font-bold font-mono ${auditStats.integrityRate >= 95 ? 'text-emerald-500' : auditStats.integrityRate >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {auditStats.integrityRate}%
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0B0F19] border border-gray-100 dark:border-white/[0.04]">
                            <span className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                                Reconciled
                            </span>
                            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {auditStats.verifiedCount}
                            </div>
                            <span className="text-[10px] text-gray-400">Exact match</span>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0B0F19] border border-gray-100 dark:border-white/[0.04]">
                            <span className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                                Discrepancies
                            </span>
                            <div className={`text-lg font-bold font-mono mt-0.5 ${auditStats.discrepancyCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                                {auditStats.discrepancyCount}
                            </div>
                            <span className="text-[10px] text-gray-400">
                                {auditStats.discrepancyCount > 0 ? `Δ ${formatCurrency(auditStats.totalDiscrepancyAmount, baseCurrency)}` : 'Zero variance'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Extraction Engine Split */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                                <Cpu className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Extraction Engine
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Groq LPU vs Spatial Coordinate Rules
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                    <Zap className="w-3.5 h-3.5 text-violet-500" />
                                    Groq LPU (GPT-OSS 120B)
                                </span>
                                <span className="font-mono text-gray-900 dark:text-white font-semibold">
                                    {auditStats.groqAiCount} ({invoices.length > 0 ? Math.round((auditStats.groqAiCount / invoices.length) * 100) : 0}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-violet-500 rounded-full"
                                    style={{ width: `${invoices.length > 0 ? (auditStats.groqAiCount / invoices.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                                    Spatial Coordinate Memory
                                </span>
                                <span className="font-mono text-gray-900 dark:text-white font-semibold">
                                    {auditStats.spatialCount} ({invoices.length > 0 ? Math.round((auditStats.spatialCount / invoices.length) * 100) : 0}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: `${invoices.length > 0 ? (auditStats.spatialCount / invoices.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
