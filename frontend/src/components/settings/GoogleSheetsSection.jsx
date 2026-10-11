import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUpdateSettings } from '../../hooks/useUser';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { 
    Table, 
    CheckCircle, 
    AlertCircle, 
    ExternalLink, 
    Key, 
    Sparkles, 
    RefreshCw, 
    LogOut,
    Check
} from 'lucide-react';

export default function GoogleSheetsSection({ user }) {
    const { darkMode } = useTheme();
    const [spreadsheetId, setSpreadsheetId] = useState('');
    const updateSettings = useUpdateSettings();

    useEffect(() => {
        if (user?.spreadsheetId) {
            setSpreadsheetId(user.spreadsheetId);
        }
    }, [user]);

    const handleConnect = () => {
        const userId = user?._id;
        window.location.href = `${import.meta.env.VITE_API_URL}/sheets/auth?userId=${userId}`;
    };

    const handleDisconnect = async () => {
        try {
            const response = await api.post('/sheets/disconnect');

            if (response.status === 200) {
                toast.success('Disconnected from Google Sheets');
                window.location.reload();
            } else {
                toast.error('Failed to disconnect');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to disconnect');
        }
    };

    const handleSaveSpreadsheet = async () => {
        if (!spreadsheetId.trim()) {
            toast.error('Please enter a spreadsheet ID');
            return;
        }

        try {
            await updateSettings.mutateAsync({ spreadsheetId });
            toast.success('Spreadsheet ID saved successfully', { icon: '💾' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save spreadsheet ID');
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.06] shadow-sm space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Table className="w-5 h-5 text-emerald-500" />
                        Google Sheets Cloud Integration
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Two-way live synchronization of extracted financial invoice rows to your Google Drive.
                    </p>
                </div>

                {user?.hasGoogleConnection ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active OAuth2
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]">
                        Not Linked
                    </span>
                )}
            </div>

            {/* OAuth Connection Status Banner */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0B0F19] border border-gray-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        OAuth2 Authorization
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {user?.hasGoogleConnection
                            ? `Connected as ${user.googleEmail || 'Google Account'}. Token refresh active.`
                            : 'Connect your Google account to grant write access to your spreadsheets.'}
                    </p>
                </div>

                <div>
                    {user?.hasGoogleConnection ? (
                        <button
                            onClick={handleDisconnect}
                            className="px-3.5 py-1.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs font-medium transition"
                        >
                            Disconnect Account
                        </button>
                    ) : (
                        <button
                            onClick={handleConnect}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-500/20 transition flex items-center gap-2 cursor-pointer"
                        >
                            Connect Google Sheets
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Target Spreadsheet Configuration */}
            <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Target Spreadsheet ID
                </label>
                <p className="text-[11px] text-gray-400">
                    Extracted from your spreadsheet URL: <code>https://docs.google.com/spreadsheets/d/<strong>YOUR_SPREADSHEET_ID</strong>/edit</code>
                </p>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white font-mono placeholder:text-gray-400 outline-none focus:border-violet-500 transition"
                    />
                    <button
                        onClick={handleSaveSpreadsheet}
                        disabled={updateSettings.isPending}
                        className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                        {updateSettings.isPending ? 'Saving...' : 'Save ID'}
                    </button>
                </div>
            </div>

            {/* Interactive Virtual Spreadsheet Preview Mirror */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        In-App Virtual Google Sheet Mirror
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Target Tab: Sheet1</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-emerald-500/30 bg-white dark:bg-[#0B0F19] shadow-inner">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-emerald-600 text-white font-medium text-[11px]">
                            <tr>
                                <th className="px-3 py-2">Col A: Vendor</th>
                                <th className="px-3 py-2">Col B: Invoice #</th>
                                <th className="px-3 py-2">Col C: Date</th>
                                <th className="px-3 py-2">Col D: Total ($)</th>
                                <th className="px-3 py-2">Col E: Due Date</th>
                                <th className="px-3 py-2">Col F: Ingest Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04] text-[11px] font-mono text-gray-700 dark:text-gray-300">
                            <tr className="hover:bg-emerald-500/5 transition">
                                <td className="px-3 py-2 font-sans font-medium text-gray-900 dark:text-gray-100">Stripe Payments</td>
                                <td className="px-3 py-2">INV-STRIPE-8842</td>
                                <td className="px-3 py-2">12-01-2026</td>
                                <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">$1,420.00</td>
                                <td className="px-3 py-2">26-01-2026</td>
                                <td className="px-3 py-2 text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> Auto-Synced</td>
                            </tr>
                            <tr className="hover:bg-emerald-500/5 transition">
                                <td className="px-3 py-2 font-sans font-medium text-gray-900 dark:text-gray-100">AWS Cloud Services</td>
                                <td className="px-3 py-2">INV-AWS-2026-90</td>
                                <td className="px-3 py-2">15-01-2026</td>
                                <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">$2,845.50</td>
                                <td className="px-3 py-2">30-01-2026</td>
                                <td className="px-3 py-2 text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> Auto-Synced</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
