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
    const [isCreating, setIsCreating] = useState(false);
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

    const handleAutoCreateSpreadsheet = async () => {
        setIsCreating(true);
        const toastId = toast.loading('Creating and styling a new Google Spreadsheet in your account...');
        try {
            const res = await api.post('/sheets/create');
            setSpreadsheetId(res.data.spreadsheetId);
            toast.success('Brand new Google Sheet created & linked!', { id: toastId });
            window.location.reload();
        } catch (err) {
            console.error('Create sheet error:', err);
            toast.error(err.response?.data?.error || 'Failed to auto-create spreadsheet', { id: toastId });
        } finally {
            setIsCreating(false);
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
                            ? `Connected as ${user.googleEmail || 'jaltaasholaa@gmail.com'}. Full write permissions active.`
                            : 'Connect your Google account to grant write access to your spreadsheets.'}
                    </p>
                </div>

                <div>
                    {user?.hasGoogleConnection ? (
                        <button
                            onClick={handleDisconnect}
                            className="px-3.5 py-1.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs font-medium transition cursor-pointer"
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

            {!user?.hasGoogleConnection && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 text-sm">⚠️ CRITICAL:</span>
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white">Must Check the Google Sheets Box During Sign-In:</p>
                        <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                            When Google prompts you with <em>"Select what PDF2Sheet can access"</em>, you <strong>MUST check the box</strong> next to:
                            <br />
                            <strong className="underline">☑️ "See, edit, create, and delete all your Google Sheets spreadsheets"</strong>.
                            <br />
                            If this box is left unchecked, Google will block all spreadsheet write attempts with <em>"insufficient authentication scopes"</em>.
                        </p>
                    </div>
                </div>
            )}

            {/* Target Spreadsheet Configuration */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Target Spreadsheet ID
                    </label>
                    {user?.hasGoogleConnection && (
                        <button
                            onClick={handleAutoCreateSpreadsheet}
                            disabled={isCreating}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 cursor-pointer disabled:opacity-50"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isCreating ? 'Creating Sheet...' : '✨ 1-Click Auto-Create & Link New Sheet'}
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        placeholder="e.g., 1RF1Dp09PaJSaaX1vOkr4ZVSxHwhsmra-D9T0PwZWdOQ"
                        className="flex-1 min-w-[240px] px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white font-mono placeholder:text-gray-400 outline-none focus:border-violet-500 transition"
                    />
                    <button
                        onClick={handleSaveSpreadsheet}
                        disabled={updateSettings.isPending}
                        className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                        {updateSettings.isPending ? 'Saving...' : 'Save ID'}
                    </button>
                    {spreadsheetId && (
                        <a
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs transition"
                            title="Open Google Sheet in new tab"
                        >
                            <span>Open Connected Sheet</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>

                {user?.hasGoogleConnection && (
                    <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                            <strong className="text-gray-900 dark:text-gray-200">Connected Google Account:</strong> <code className="text-violet-600 dark:text-violet-400 font-mono">{user.googleEmail || 'jaltaasholaa@gmail.com'}</code>
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                            💡 <em>If using a spreadsheet created by your personal account (e.g. <code>aavishkark@gmail.com</code>), open that spreadsheet $\rightarrow$ click the blue <strong>Share</strong> button $\rightarrow$ add <code>{user.googleEmail || 'jaltaasholaa@gmail.com'}</code> as <strong>Editor</strong> (or set General access to "Anyone with the link" $\rightarrow$ Editor).</em>
                        </p>
                    </div>
                )}
            </div>

            {/* Interactive Virtual Spreadsheet Preview Mirror */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        In-App Live Sync Preview
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Target Tab: Sheet1</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-emerald-500/30 bg-white dark:bg-[#0B0F19] shadow-inner">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#1F2937] text-white font-medium text-[11px]">
                            <tr>
                                <th className="px-3 py-2">Vendor</th>
                                <th className="px-3 py-2">Invoice #</th>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Total ($)</th>
                                <th className="px-3 py-2">Due Date</th>
                                <th className="px-3 py-2">Forensic Math Audit</th>
                                <th className="px-3 py-2">AI Engine</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04] text-[11px] font-mono text-gray-700 dark:text-gray-300">
                            <tr className="hover:bg-emerald-500/5 transition">
                                <td className="px-3 py-2 font-sans font-medium text-gray-900 dark:text-gray-100">Stripe Payments</td>
                                <td className="px-3 py-2">INV-STRIPE-8842</td>
                                <td className="px-3 py-2">12-01-2026</td>
                                <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">$1,420.00</td>
                                <td className="px-3 py-2">26-01-2026</td>
                                <td className="px-3 py-2 text-emerald-500">VERIFIED (100%)</td>
                                <td className="px-3 py-2 text-violet-500">Groq LPU (GPT-OSS 120B)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
