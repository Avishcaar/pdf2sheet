import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Settings, 
  FlaskConical, 
  LogOut, 
  FileSpreadsheet,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sidebar() {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Invoices', 
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-indigo-500/30'
    },
    { 
      path: '/vendors', 
      label: 'Vendors', 
      icon: Store,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30'
    },
    { 
      path: '/simulate', 
      label: 'Simulator', 
      icon: FlaskConical,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/30'
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings,
      gradient: 'from-slate-600 to-zinc-700',
      shadow: 'shadow-slate-500/30'
    },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside 
      aria-label="MacBook Floating Navigation Dock"
      className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 select-none"
    >
      {/* MacBook Glassmorphic Floating Dock Shelf */}
      <div className="relative flex flex-col items-center gap-2 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-white/75 dark:bg-[#111827]/80 backdrop-blur-2xl border border-white/40 dark:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] transition-all duration-300">
        
        {/* Top Gloss Highlight (MacBook glass rim) */}
        <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none rounded-t-full" />

        {/* Brand App Icon (Top of Dock) */}
        <Link
          to="/dashboard"
          className="group relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/30 hover:scale-125 transition-transform duration-200 ease-out cursor-pointer mb-1"
          title="PDF2Sheet Invoices Terminal"
        >
          <FileSpreadsheet className="w-5 h-5 group-hover:rotate-6 transition-transform" />
          
          {/* macOS Floating Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#0B0F19]/90 text-white text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-50">
            PDF2Sheet Terminal
          </div>
        </Link>

        {/* Separator shelf line */}
        <div className="w-6 h-px bg-gray-200 dark:bg-white/[0.12] my-0.5" />

        {/* Main Dock Navigation Apps */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl transition-all duration-200 ease-out cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-tr ${item.gradient} text-white shadow-lg ${item.shadow} scale-110`
                    : 'bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gradient-to-tr hover:' + item.gradient + ' hover:scale-125 hover:shadow-lg'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />

                {/* macOS Floating Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#0B0F19]/90 text-white text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-50">
                  {item.label}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Separator shelf line */}
        <div className="w-6 h-px bg-gray-200 dark:bg-white/[0.12] my-0.5" />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:text-amber-400 hover:bg-amber-400/10 hover:scale-125 transition-all duration-200 ease-out cursor-pointer"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
          ) : (
            <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12 duration-300" />
          )}

          {/* macOS Floating Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#0B0F19]/90 text-white text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-50">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </div>
        </button>

        {/* Sign Out Button (Trash / Eject Position on Dock) */}
        <button
          onClick={handleSignOut}
          className="group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-100/80 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/15 hover:scale-125 transition-all duration-200 ease-out cursor-pointer"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 duration-200" />

          {/* macOS Floating Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#0B0F19]/90 text-red-300 text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-50">
            Sign Out
          </div>
        </button>

      </div>
    </aside>
  );
}
