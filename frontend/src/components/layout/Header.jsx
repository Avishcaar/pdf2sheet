import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sun, Moon, ChevronDown, LogOut, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Header() {
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error('Failed to parse user from localStorage', e);
            }
        }
    }, []);

    const titleMap = {
        '/dashboard': 'Overview',
        '/vendors': 'Vendors',
        '/settings': 'Settings',
        '/simulate': 'Simulator',
    };

    const pageTitle = titleMap[location.pathname] || '';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <header className="h-16 border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-6 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl">
            <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                    aria-label="Toggle theme"
                >
                    {darkMode ? (
                        <Sun className="w-[18px] h-[18px]" />
                    ) : (
                        <Moon className="w-[18px] h-[18px]" />
                    )}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-semibold">
                            {user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user?.firstName || 'User'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1E293B] shadow-lg shadow-black/[0.08] dark:shadow-black/30 z-50 py-1 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                    {user?.email || 'No email'}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
