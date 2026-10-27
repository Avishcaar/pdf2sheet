import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { Sparkles, ArrowRight, ShieldCheck, Play } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { darkMode, toggleDarkMode } = useTheme();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleGuestAccess = () => {
        localStorage.setItem('token', 'guest-demo-token');
        localStorage.setItem('user', JSON.stringify({
            _id: '6ac54b3cfe90e970a92ea608',
            email: 'guest@pdf2sheet.com',
            firstName: 'Guest',
            lastName: 'Reviewer',
            role: 'demo'
        }));
        toast.success('Welcome, Reviewer! Launching live workstation environment...', { icon: '🚀' });
        navigate('/dashboard');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData?.details && errorData.details.length > 0) {
                errorData.details.forEach(detail => {
                    toast.error(detail.message);
                });
            } else {
                toast.error(errorData?.error || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0B0F19]' : 'bg-gradient-to-br from-slate-50 via-violet-50/40 to-slate-100'} flex items-center justify-center p-4 transition-colors duration-300`}>
            <Toaster position="top-center" />

            <button
                onClick={toggleDarkMode}
                className={`fixed top-6 right-6 p-3 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow-lg hover:scale-110 transition-transform duration-200 z-50`}
                aria-label="Toggle dark mode"
            >
                {darkMode ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
            </button>

            <div className={`w-full max-w-5xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 transition-colors duration-300`}>
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                    <div className="mb-6">
                        <div className="text-violet-500 font-bold text-sm mb-1 tracking-wider">PDF2SHEET PIPELINE</div>
                        <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome</h1>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>
                            Automated AI Invoice Ingestion & Google Sheets Sync
                        </p>
                    </div>

                    {/* Recruiter / Guest Demo Access Callout */}
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/30">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                RESUME / PORTFOLIO REVIEW
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                                NO LOGIN REQUIRED
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                            Evaluating this project for an interview? Jump straight into the full interactive dashboard with pre-loaded invoices and Groq LPU OCR.
                        </p>
                        <button
                            type="button"
                            onClick={handleGuestAccess}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Explore as Guest Reviewer</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative flex items-center justify-center my-4">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                        <span className="absolute px-3 bg-white dark:bg-gray-800 text-[11px] font-mono text-gray-400 uppercase">
                            or log in with credentials
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-blue-50/50 border-blue-100 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm transition`}
                                placeholder="name@domain.com"
                            />
                        </div>

                        <div>
                            <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                                Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-blue-50/50 border-blue-100 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm transition`}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold text-sm rounded-xl shadow-md transform transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Don't have an account yet?{' '}
                            <Link to="/register" className="text-violet-500 hover:text-violet-600 font-semibold transition">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                <div className={`hidden md:flex ${darkMode ? 'bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E293B]' : 'bg-gradient-to-br from-violet-100/50 via-slate-100 to-violet-50'} items-center justify-center p-12 relative overflow-hidden transition-colors duration-300`}>
                    <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-violet-900/20 via-transparent to-cyan-900/10' : 'bg-gradient-to-br from-violet-200/20 via-transparent to-blue-200/20'}`}></div>
                    <div className="relative z-10 text-center max-w-sm">
                        <div className={`w-28 h-28 mx-auto mb-6 ${darkMode ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white shadow-xl'} rounded-3xl flex items-center justify-center text-indigo-400`}>
                            <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                        </div>
                        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                            Dual Groq LPU Engine
                        </h2>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Sub-300ms OCR optical extraction, coordinate-level bounding box mapping, and automated real-time dispatch to Google Sheets.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
