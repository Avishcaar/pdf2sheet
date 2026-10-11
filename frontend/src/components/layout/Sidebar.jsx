import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Settings, FlaskConical, LogOut, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sidebar() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/vendors', label: 'Vendors', icon: Store },
        { path: '/simulate', label: 'Simulator', icon: FlaskConical },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <aside className="w-64 shrink-0 bg-white dark:bg-[#0B0F19] border-r border-gray-200 dark:border-white/[0.06] flex flex-col h-screen transition-colors duration-150">
            {/* Section 1 — Logo */}
            <div className="px-6 h-16 flex items-center border-b border-gray-200 dark:border-white/[0.06]">
                <div>
                    <div className="flex items-center leading-none">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">PDF2</span>
                        <span className="font-bold text-lg text-violet-500">Sheet</span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wider uppercase mt-1">
                        Invoice Automation
                    </p>
                </div>
            </div>

            {/* Section 2 — Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                                isActive
                                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Section 3 — Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-white/[0.06]">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
