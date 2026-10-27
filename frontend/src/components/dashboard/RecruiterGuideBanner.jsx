import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  FlaskConical, 
  ExternalLink, 
  FileSpreadsheet, 
  Cpu, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  FileText,
  BarChart3,
  HelpCircle,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecruiterGuideBanner({ onIngestSample, isIngesting, onOpenCfoBrief }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (isDismissed) {
    return (
      <div className="w-full mb-4 flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-mono transition-all cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Show Recruiter Demo Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 rounded-3xl bg-gradient-to-r from-[#0C101F] via-[#10172B] to-[#0C101F] border border-indigo-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient background flares */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-24 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            RECRUITER & INTERVIEWER DEMO MODE
          </span>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
            Zero Friction · All APIs Live
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={isExpanded ? 'Collapse guide' : 'Expand guide'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="relative z-10 pt-3.5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Welcome! <strong className="text-white">PDF2Sheet</strong> is an autonomous invoice processing pipeline. It captures invoices from email (IMAP) or uploads, extracts structured financial entities using <strong className="text-cyan-300 font-mono">Groq LPU (Llama 3.3 70B)</strong> in <span className="text-emerald-400 font-mono font-bold">&lt;280ms</span>, verifies mathematical integrity, and writes clean data directly into <strong className="text-emerald-300">Google Sheets</strong>.
          </p>

          {/* Quick 1-Click Interactive Test Actions - Uiverse Concentric Aesthetic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Quick Action 1: Ingest AWS Sample */}
            <button
              onClick={() => onIngestSample('aws', 'aws-invoice.pdf', 'AWS Cloud')}
              disabled={isIngesting}
              className="relative rounded-[22px] overflow-hidden border border-indigo-500/30 bg-[#0F1426] p-3.5 text-left transition-all duration-200 group cursor-pointer disabled:opacity-50 hover:-translate-y-0.5 hover:border-indigo-400/60 shadow-lg"
            >
              {/* Concentric Solar Rings */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[70%] -right-[40%] w-[160px] h-[160px] rounded-full bg-indigo-500/20 blur-[0.5px]" />
                <div className="absolute -top-[50%] -right-[20%] w-[110px] h-[110px] rounded-full bg-blue-400/20" />
                <div className="absolute -top-[25%] -right-[5%] w-[55px] h-[55px] rounded-full bg-cyan-400/60" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    1-Click Ingest Sample
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/15 px-1.5 py-0.2 rounded border border-cyan-400/30">
                    AWS $2,845
                  </span>
                </div>
                <p className="text-[10px] text-indigo-200/80 leading-snug">
                  Run Groq LPU on a real AWS Cloud invoice without uploading files.
                </p>
              </div>
            </button>

            {/* Quick Action 2: Ingest Stripe Sample */}
            <button
              onClick={() => onIngestSample('stripe', 'stripe-invoice.pdf', 'Stripe SaaS')}
              disabled={isIngesting}
              className="relative rounded-[22px] overflow-hidden border border-purple-500/30 bg-[#170E28] p-3.5 text-left transition-all duration-200 group cursor-pointer disabled:opacity-50 hover:-translate-y-0.5 hover:border-purple-400/60 shadow-lg"
            >
              {/* Concentric Solar Rings */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[70%] -right-[40%] w-[160px] h-[160px] rounded-full bg-purple-500/20 blur-[0.5px]" />
                <div className="absolute -top-[50%] -right-[20%] w-[110px] h-[110px] rounded-full bg-pink-400/20" />
                <div className="absolute -top-[25%] -right-[5%] w-[55px] h-[55px] rounded-full bg-purple-300/60" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                    Ingest Stripe SaaS
                  </span>
                  <span className="text-[9px] font-mono text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-400/30">
                    Stripe $1,420
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/80 leading-snug">
                  Parse SaaS fee structure with high confidence coordinate match.
                </p>
              </div>
            </button>

            {/* Quick Action 3: Open Simulator */}
            <Link
              to="/simulate"
              className="relative rounded-[22px] overflow-hidden border border-emerald-500/30 bg-[#0B1E19] p-3.5 text-left transition-all duration-200 group cursor-pointer block hover:-translate-y-0.5 hover:border-emerald-400/60 shadow-lg"
            >
              {/* Concentric Solar Rings */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[70%] -right-[40%] w-[160px] h-[160px] rounded-full bg-emerald-500/20 blur-[0.5px]" />
                <div className="absolute -top-[50%] -right-[20%] w-[110px] h-[110px] rounded-full bg-teal-400/20" />
                <div className="absolute -top-[25%] -right-[5%] w-[55px] h-[55px] rounded-full bg-amber-400/60" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                    Multi-Currency Lab
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-400/30">
                    EUR € · INR ₹
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80 leading-snug">
                  Simulate SAP Deutschland (EUR) and Apollo Hospital (INR GST).
                </p>
              </div>
            </Link>

            {/* Quick Action 4: Live Google Sheet */}
            <a
              href="https://docs.google.com/spreadsheets/d/10XdMg1XgLa8PlRGMDr3_XTZ_0Igu2lI8B5oj8C5B4rs"
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-[22px] overflow-hidden border border-teal-500/30 bg-[#0A2222] p-3.5 text-left transition-all duration-200 group cursor-pointer block hover:-translate-y-0.5 hover:border-teal-400/60 shadow-lg"
            >
              {/* Concentric Solar Rings */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[70%] -right-[40%] w-[160px] h-[160px] rounded-full bg-teal-500/20 blur-[0.5px]" />
                <div className="absolute -top-[50%] -right-[20%] w-[110px] h-[110px] rounded-full bg-cyan-400/20" />
                <div className="absolute -top-[25%] -right-[5%] w-[55px] h-[55px] rounded-full bg-emerald-300/60" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                    Live Google Sheet
                  </span>
                  <ExternalLink className="w-3 h-3 text-teal-300" />
                </div>
                <p className="text-[10px] text-teal-200/80 leading-snug">
                  Inspect the synchronized live Google Spreadsheet in a new tab.
                </p>
              </div>
            </a>
          </div>

          {/* Architecture Pipeline Pills */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">PIPELINE:</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-300">
                1. IMAP RFC 2177
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                2. Groq LPU (Llama 3.3 70B)
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                3. Math Audit
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                4. Google Sheets v4 API
              </span>
            </div>

            <button
              onClick={onOpenCfoBrief}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Launch CFO AI Spend Brief</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
