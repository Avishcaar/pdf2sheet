import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, ArrowUp } from 'lucide-react';
import { scrollToHash } from '../../utils/scroll';

export default function LandingFooter() {
  return (
    <footer className="bg-[#0B0F19] border-t border-white/[0.08] text-slate-400 font-mono text-xs py-12 px-4 sm:px-6 md:px-[6vw]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Brand & Telemetry */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-white font-sans font-semibold text-sm">
            <div className="w-6 h-6 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <span>PDF2Sheet</span>
          </div>

          <span className="hidden sm:inline text-slate-600">|</span>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RFC 2177 Push Active · Groq Vision LPU Online</span>
          </div>
        </div>

        {/* Center: System Links */}
        <div className="flex items-center gap-6 text-[11px]">
          <Link to="/dashboard" className="hover:text-white transition-colors">
            Terminal
          </Link>
          <Link to="/simulate" className="hover:text-white transition-colors">
            Simulator
          </Link>
          <Link to="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="hover:text-white transition-colors">
            Register
          </Link>
        </div>

        {/* Right: Scroll to top */}
        <button
          onClick={() => scrollToHash('#top')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
        >
          <span>Return to Top</span>
          <ArrowUp className="w-3 h-3 text-indigo-400" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
        <p>© 2026 PDF2Sheet Financial Document Intelligence. Apache 2.0 License.</p>
        <p>Telemetry Latency: 240ms · Dual-Engine OCR Reconciled</p>
      </div>
    </footer>
  );
}
