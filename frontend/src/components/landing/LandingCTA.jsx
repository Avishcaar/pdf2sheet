import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useReveals } from '../../hooks/useReveals';

export default function LandingCTA() {
  const ref = useReveals();

  return (
    <section
      ref={ref}
      id="simulator"
      className="relative bg-[#0B0F19] px-4 sm:px-6 md:px-[6vw] py-24 border-t border-white/[0.06]"
    >
      <div
        data-reveal
        className="max-w-5xl mx-auto rounded-2xl p-8 sm:p-12 md:p-16 bg-gradient-to-b from-[#111827] to-[#0B0F19] border border-indigo-500/30 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background Radial Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            READY FOR DEPLOYMENT
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto">
            Automate Financial Ingestion With Single-Millisecond Push
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Eliminate manual invoice data entry, currency conversion friction, and spreadsheet typos
            with real-time IMAP IDLE ingestion.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Launch Invoices Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/simulate"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm transition-all"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Simulate Deliveries</span>
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Zero Configuration IMAP
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              OAuth2 Certified Google API
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              4 Currencies Supported
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
