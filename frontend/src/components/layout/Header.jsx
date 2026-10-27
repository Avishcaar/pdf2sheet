import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sun, Moon, ChevronDown, LogOut, User, Sparkles, ExternalLink, FileSpreadsheet, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState(null);

    const loadUserFromStorage = () => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (userData && token && token !== 'guest-demo-token') {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error('Failed to parse user from localStorage', e);
            }
        } else {
            // Default guest user
            setUser({
                firstName: 'Guest',
                lastName: 'Reviewer',
                email: 'guest@pdf2sheet.com',
                role: 'demo'
            });
        }
    };

    useEffect(() => {
        loadUserFromStorage();
    }, []);

    const titleMap = {
        '/dashboard': 'Workstation Overview',
        '/vendors': 'Vendor Intelligence',
        '/settings': 'Pipeline Settings',
        '/simulate': 'Multi-Currency Simulator',
    };

    const pageTitle = titleMap[location.pathname] || 'Dashboard';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('demo_mode');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const switchToGuestMode = () => {
        localStorage.setItem('token', 'guest-demo-token');
        localStorage.setItem('demo_mode', 'true');
        localStorage.setItem('user', JSON.stringify({
            _id: '6ae0f1989e78e3eb2b71ff9c',
            email: 'guest@pdf2sheet.com',
            firstName: 'Guest',
            lastName: 'Reviewer',
            role: 'demo'
        }));
        toast.success('Switched to isolated Guest Reviewer Mode!', { icon: '🚀' });
        window.location.reload();
    };

    const isGuest = !user?.role || user?.role === 'demo' || user?.email === 'guest@pdf2sheet.com' || localStorage.getItem('token') === 'guest-demo-token';

    return (
        <header className="h-16 border-b border-gray-200 dark:border-white/[0.06] px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl z-40 sticky top-0">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                    <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
                    
                    {isGuest ? (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            GUEST REVIEWER MODE
                        </span>
                    ) : (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400">
                            PERSONAL ACCOUNT
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mode Switcher Shortcut */}
                    {!isGuest && (
                        <button
                            onClick={switchToGuestMode}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold shadow-md transition-all cursor-pointer active:scale-95"
                            title="Switch to isolated Guest Reviewer Mode"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span className="hidden sm:inline">Switch to Guest Demo</span>
                            <span className="sm:hidden">Demo</span>
                        </button>
                    )}

                    {/* Live Google Sheet Shortcut */}
                    <a
                        href="https://docs.google.com/spreadsheets/d/10XdMg1XgLa8PlRGMDr3_XTZ_0Igu2lI8B5oj8C5B4rs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-xs font-mono text-teal-400 font-semibold transition-all shadow-sm"
                        title="Open live connected Google Spreadsheet"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Live Google Sheet</span>
                        <ExternalLink className="w-3 h-3 text-teal-500" />
                    </a>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        aria-label="Toggle theme"
                    >
                        {darkMode ? (
                            <Sun className="w-[18px] h-[18px] text-amber-300" />
                        ) : (
                            <Moon className="w-[18px] h-[18px]" />
                        )}
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                                {user?.firstName?.charAt(0) || 'G'}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {user?.firstName || 'Guest'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] shadow-2xl z-50 py-1.5 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest Reviewer'}
                                        </p>
                                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                                            {isGuest ? 'LIVE DEMO' : 'PERSONAL'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email || 'guest@pdf2sheet.com'}
                                    </p>
                                </div>

                                {!isGuest ? (
                                    <button
                                        onClick={switchToGuestMode}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                    >
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                        <span>Switch to Guest Reviewer Mode</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                                    >
                                        <User className="w-4 h-4 text-indigo-400" />
                                        <span>Sign in to Personal Account</span>
                                    </button>
                                )}

                                <a
                                    href="https://docs.google.com/spreadsheets/d/10XdMg1XgLa8PlRGMDr3_XTZ_0Igu2lI8B5oj8C5B4rs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-teal-400 hover:bg-teal-500/10 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Connected Google Sheet</span>
                                    </span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Reset / Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
