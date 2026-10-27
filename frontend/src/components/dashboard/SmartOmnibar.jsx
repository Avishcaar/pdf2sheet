import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SmartOmnibar({ onFilterChange, activeFilter, onClearFilter }) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const quickChips = [
        { label: '💵 > $1,000', query: 'invoices with amount greater than 1000' },
        { label: '⚠️ Math Discrepancies', query: 'show invoices with math discrepancies' },
        { label: '🇮🇳 INR Invoices', query: 'show all invoices in INR currency' },
        { label: '🏢 Stripe Invoices', query: 'invoices from Stripe' },
        { label: '⏳ Review Needed', query: 'invoices needing manual review' }
    ];

    const handleSubmit = async (searchQuery) => {
        const text = searchQuery !== undefined ? searchQuery : query;
        if (!text || !text.trim()) {
            onClearFilter();
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Parsing natural language query with Groq AI...');

        try {
            const res = await api.post('/invoices/nl-query', { query: text.trim() });
            if (res.data?.filter) {
                onFilterChange(res.data.filter);
                toast.success(res.data.filter.explanation || 'Filter applied!', { id: toastId });
            }
        } catch (err) {
            console.error('NL Query Error:', err);
            toast.error(err.response?.data?.error || 'Failed to interpret search query', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChipClick = (chipQuery) => {
        setQuery(chipQuery);
        handleSubmit(chipQuery);
    };

    return (
        <div className="space-y-2.5">
            {/* Search Input Bar */}
            <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1 text-violet-500 pointer-events-none">
                    <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    placeholder='Ask AI or search... (e.g. "show invoices over $500", "discrepancies", "Stripe")'
                    className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                onClearFilter();
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            title="Clear input"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || !query.trim()}
                        className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 shadow-sm transition cursor-pointer"
                    >
                        <span>Ask</span>
                        <CornerDownLeft className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Quick Chips & Active Filter Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Prompt Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">Try:</span>
                    {quickChips.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleChipClick(chip.query)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-violet-500/10 dark:bg-white/[0.04] dark:hover:bg-violet-500/15 border border-transparent hover:border-violet-500/30 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 text-[11px] transition-all cursor-pointer font-medium"
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* Active AI Filter Indicator */}
                {activeFilter?.active && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-700 dark:text-violet-300 text-[11px] font-medium animate-fadeIn">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[280px]">
                            {activeFilter.explanation || 'AI Filter Active'}
                        </span>
                        <button
                            onClick={() => {
                                setQuery('');
                                onClearFilter();
                            }}
                            className="p-0.5 rounded-md hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 transition"
                            title="Remove filter"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
