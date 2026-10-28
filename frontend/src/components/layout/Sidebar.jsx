import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Settings, 
  FlaskConical, 
  LogOut, 
  FileSpreadsheet,
  ArrowLeftRight,
  Compass,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitch from '../common/ThemeSwitch';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [hasSeenTour, setHasSeenTour] = useState(false);

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
    setHasSeenTour(Boolean(localStorage.getItem('guest_tour_completed')));
  };

  useEffect(() => {
    loadUserFromStorage();
    const handleStorageChange = () => loadUserFromStorage();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isGuest = !user?.role || user?.role === 'demo' || user?.email === 'guest@pdf2sheet.com' || localStorage.getItem('token') === 'guest-demo-token';

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
      gradient: 'from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/30'
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings,
      gradient: 'from-slate-600 to-zinc-700',
      shadow: 'shadow-slate-500/30'
    },
  ];

  const handleStartTour = () => {
    window.dispatchEvent(new CustomEvent('open-guided-tour'));
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
    toast.success('Switched to Guest Reviewer Mode');
    window.location.reload();
  };

  const switchToPersonalMode = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demo_mode');
    toast.success('Switched to Personal Account mode');
    navigate('/login');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demo_mode');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside 
      aria-label="MacBook Floating Navigation Dock"
      className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 select-none overflow-visible"
    >
      {/* MacBook Glassmorphic Floating Dock Shelf (overflow-visible guarantees tooltips never get cut off) */}
      <div className="relative flex flex-col items-center gap-2 p-2 rounded-3xl bg-white/85 dark:bg-[#111827]/90 backdrop-blur-2xl border border-white/50 dark:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] transition-all duration-300 overflow-visible">
        
        {/* Top Gloss Highlight (MacBook glass rim) */}
        <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none rounded-t-full" />

        {/* 1. Brand App Icon (Top of Dock) */}
        <Link
          to="/dashboard"
          className="group relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 text-white shadow-lg shadow-orange-600/30 hover:scale-125 transition-transform duration-200 ease-out cursor-pointer"
          aria-label="PDF2Sheet Terminal"
        >
          <FileSpreadsheet className="w-5 h-5 group-hover:rotate-6 transition-transform" />
          
          {/* Tooltip on Hover */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-white text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-orange-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-orange-500/30 rotate-45" />
            PDF2Sheet Terminal
          </div>
        </Link>

        {/* Separator shelf line */}
        <div className="w-6 h-px bg-gray-200 dark:bg-white/[0.12] my-0.5" />

        {/* 2. Main Navigation Apps */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`group relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ease-out cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-tr ${item.gradient} text-white shadow-lg ${item.shadow} scale-110`
                    : 'bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gradient-to-tr hover:' + item.gradient + ' hover:scale-125 hover:shadow-lg'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />

                {/* Tooltip on Hover */}
                <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-white text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-orange-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-orange-500/30 rotate-45" />
                  {item.label}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Separator shelf line */}
        <div className="w-6 h-px bg-gray-200 dark:bg-white/[0.12] my-0.5" />

        {/* 3. Utility Actions from Navbar */}

        {/* Guided Tour Launcher */}
        <button
          onClick={handleStartTour}
          className="group relative flex items-center justify-center w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 hover:text-white hover:bg-gradient-to-tr hover:from-cyan-500 hover:to-blue-600 hover:scale-125 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 ease-out cursor-pointer"
          aria-label="Guided Tour"
        >
          <Compass className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />

          {/* Beacon ping for first-time guests */}
          {isGuest && !hasSeenTour && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
          )}

          {/* Tooltip on Hover */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-white text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-orange-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-orange-500/30 rotate-45" />
            Guided Tour
          </div>
        </button>

        {/* Live Google Sheet Shortcut */}
        <a
          href="https://docs.google.com/spreadsheets/d/10XdMg1XgLa8PlRGMDr3_XTZ_0Igu2lI8B5oj8C5B4rs"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-400 hover:text-white hover:bg-gradient-to-tr hover:from-teal-500 hover:to-emerald-600 hover:scale-125 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-200 ease-out cursor-pointer"
          aria-label="Live Google Sheet"
        >
          <FileSpreadsheet className="w-5 h-5" />
          
          {/* Tooltip on Hover */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-white text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-orange-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center gap-1.5">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-orange-500/30 rotate-45" />
            <span>Live Google Sheet</span>
            <ExternalLink className="w-3 h-3 text-teal-400" />
          </div>
        </a>

        {/* Mode Switcher Shortcut */}
        <button
          onClick={isGuest ? switchToPersonalMode : switchToGuestMode}
          className="group relative flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:to-orange-600 hover:scale-125 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-200 ease-out cursor-pointer"
          aria-label={isGuest ? "Switch to Personal Account" : "Switch to Guest Demo"}
        >
          <ArrowLeftRight className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />

          {/* Tooltip on Hover */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-white text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-orange-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-orange-500/30 rotate-45" />
            {isGuest ? 'Switch to Personal Account' : 'Switch to Guest Demo'}
          </div>
        </button>

        {/* Separator shelf line */}
        <div className="w-6 h-px bg-gray-200 dark:bg-white/[0.12] my-0.5" />

        {/* 4. Interactive Sky Theme Switch */}
        <div 
          onClick={toggleDarkMode}
          className="group relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-100/80 dark:bg-white/[0.06] hover:scale-110 transition-transform duration-200 cursor-pointer"
          aria-label="Toggle Theme"
        >
          <ThemeSwitch size="7px" />

          {/* Tooltip on Hover */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-white text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-orange-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-orange-500/30 rotate-45" />
            {darkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          </div>
        </div>

        {/* 5. Sign Out Button (Dock bottom) */}
        <button
          onClick={handleSignOut}
          className="group relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-100/80 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/15 hover:scale-125 transition-all duration-200 ease-out cursor-pointer"
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5 duration-200" />

          {/* Tooltip on Hover */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#0B0F19]/95 text-red-300 text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-red-500/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-[100] flex items-center">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B0F19] border-l border-b border-red-500/30 rotate-45" />
            Sign Out
          </div>
        </button>

      </div>
    </aside>
  );
}
