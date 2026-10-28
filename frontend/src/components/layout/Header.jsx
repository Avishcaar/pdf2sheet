import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, ArrowLeftRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);

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
        const handleStorageChange = () => loadUserFromStorage();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Close user dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const titleMap = {
        '/dashboard': 'Workstation Overview',
        '/vendors': 'Vendor Intelligence',
        '/settings': 'Pipeline Settings',
        '/simulate': 'Multi-Currency Simulator',
    };

    const pageTitle = titleMap[location.pathname] || 'Dashboard';
    const isGuest = !user?.role || user?.role === 'demo' || user?.email === 'guest@pdf2sheet.com' || localStorage.getItem('token') === 'guest-demo-token';

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
        toast.success('Switched to Guest Reviewer Mode');
        window.location.reload();
    };

    const switchToPersonalMode = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('demo_mode');
        toast.success('Switched to Personal Account');
        navigate('/login');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('demo_mode');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <header className="h-16 border-b border-gray-200 dark:border-white/[0.06] px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl z-40 sticky top-0">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between h-full">
                {/* Left: Page Title & Mode Badge */}
                <div className="flex items-center gap-3">
                    <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        {pageTitle}
                    </h1>
                    
                    {isGuest ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            GUEST REVIEWER MODE
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400">
                            PERSONAL ACCOUNT
                        </span>
                    )}
                </div>

                {/* Right: Only the Profile Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer bg-white/50 dark:bg-white/[0.02]"
                        aria-label="User Profile Menu"
                    >
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-orange-500/20">
                            {user?.firstName?.charAt(0) || 'G'}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {user?.firstName || 'Guest'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest Reviewer'}
                                    </p>
                                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                                        {isGuest ? 'LIVE DEMO' : 'PERSONAL'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                                    {user?.email || 'guest@pdf2sheet.com'}
                                </p>
                            </div>

                            <div className="p-1.5 space-y-1">
                                {isGuest ? (
                                    <button
                                        onClick={switchToPersonalMode}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Switch to Personal Account</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={switchToGuestMode}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Switch to Guest Demo</span>
                                    </button>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
