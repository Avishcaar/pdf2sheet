import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, Sparkles, Layers, Cpu, FileSpreadsheet } from 'lucide-react';
import { scrollToHash } from '../../utils/scroll';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/20'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault();
            scrollToHash('#top');
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
            PDF2Sheet
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              IMAP PUSH
            </span>
          </span>
        </Link>

        {/* Section Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
          <a
            href="#pipeline"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash('#pipeline');
            }}
            className="hover:text-white transition-colors"
          >
            Pipeline
          </a>
          <a
            href="#trajectory"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash('#trajectory');
            }}
            className="hover:text-white transition-colors"
          >
            Dataflow
          </a>
          <a
            href="#capabilities"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash('#capabilities');
            }}
            className="hover:text-white transition-colors"
          >
            Capabilities
          </a>
          <Link
            to="/simulate"
            className="hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Simulator
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
          >
            <span>Launch Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
