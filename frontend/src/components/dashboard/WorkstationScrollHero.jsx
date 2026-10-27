import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Mail, 
  UploadCloud, 
  ArrowDown, 
  ChevronDown,
  Sparkles,
  ChevronUp
} from 'lucide-react';
import { clamp, easeOutCubic, lerp, range } from '../../utils/math';
import { onFrame } from '../../utils/scroll';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function WorkstationScrollHero({ 
  onUploadClick, 
  onSyncEmailClick, 
  isSyncingEmail, 
  invoicesCount = 0,
  syncRate = 100 
}) {
  const rootRef = useRef(null);
  const backRef = useRef(null);
  const personRef = useRef(null);
  const titleRef = useRef(null);
  const hudRef = useRef(null);
  const invMemoRef = useRef(null);
  const invCheckRef = useRef(null);
  const invBadgeRef = useRef(null);
  const scanDataRef = useRef(null);
  const progressPercentRef = useRef(null);
  const latencyRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let lastP = -1;
    const root = rootRef.current;
    if (!root) return;
    const container = root.closest('main') || window;

    const updateFrame = () => {
      if (isMinimized) return;
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const rect = rootEl.getBoundingClientRect();
      const mainEl = rootEl.closest('main');
      const containerTop = mainEl ? mainEl.getBoundingClientRect().top : 0;
      const containerHeight = mainEl ? mainEl.clientHeight : window.innerHeight;

      const relTop = rect.top - containerTop;
      const span = Math.max(1, rect.height - containerHeight);
      const p = clamp(-relTop / span);

      if (Math.abs(p - lastP) < 0.0005) return;
      lastP = p;

      // Tight, responsive transitions (120vh scroll track)
      const exit = range(p, 0.65, 0.95);
      const settle = easeOutCubic(range(p, 0, 0.35));
      const rise = easeOutCubic(range(p, 0.02, 0.32));

      // 1. Background workstation depth
      if (backRef.current) {
        const bgScale = lerp(1.04, 1.0, settle);
        const bgY = lerp(0, -3, p) - exit * 12;
        backRef.current.style.transform = `translate3d(0, ${bgY}vh, 0) scale(${bgScale})`;
      }

      // 2. Operator Foreground Layer (person sitting at the desk)
      // Rises from below as user scrolls down into the dashboard
      if (personRef.current) {
        const personY = lerp(15, 0, rise) - exit * 35;
        const personOpacity = clamp(range(p, 0.02, 0.22) * 1.5);
        personRef.current.style.transform = `translate3d(0, ${personY}vh, 0) scale(${lerp(1.02, 1.0, rise)})`;
        personRef.current.style.opacity = String(personOpacity);
      }

      // 3. Title & Subtitle: visible at load (p=0), yields gracefully as invoices converge
      if (titleRef.current) {
        const tOut = range(p, 0.22, 0.40);
        const titleY = -p * 10;
        titleRef.current.style.opacity = String(1 - tOut);
        titleRef.current.style.transform = `translate3d(0, ${titleY}vh, 0)`;
      }

      // 4. Floating Invoices Stream (swift drift into monitor)
      // Invoice 1: Memo card with dollar icon
      if (invMemoRef.current) {
        const mProgress = easeOutCubic(range(p, 0.08, 0.48));
        const mX = lerp(-25, -2, mProgress);
        const mY = lerp(-28, 5, mProgress) - exit * 20;
        const mScale = lerp(1.25, 0.85, mProgress);
        const mRotate = lerp(-14, -3, mProgress);
        const mOpacity = range(p, 0.06, 0.18) * (1 - range(p, 0.55, 0.70));
        invMemoRef.current.style.transform = `translate3d(${mX}vw, ${mY}vh, 0) scale(${mScale}) rotate(${mRotate}deg)`;
        invMemoRef.current.style.opacity = String(mOpacity);
      }

      // Invoice 2: Checkmark verified document floating in from right
      if (invCheckRef.current) {
        const cProgress = easeOutCubic(range(p, 0.12, 0.52));
        const cX = lerp(25, 8, cProgress);
        const cY = lerp(-18, 8, cProgress) - exit * 22;
        const cScale = lerp(1.2, 0.88, cProgress);
        const cRotate = lerp(14, 4, cProgress);
        const cOpacity = range(p, 0.10, 0.22) * (1 - range(p, 0.58, 0.72));
        invCheckRef.current.style.transform = `translate3d(${cX}vw, ${cY}vh, 0) scale(${cScale}) rotate(${cRotate}deg)`;
        invCheckRef.current.style.opacity = String(cOpacity);
      }

      // Invoice 3: Hand delivery circular badge
      if (invBadgeRef.current) {
        const bProgress = easeOutCubic(range(p, 0.16, 0.56));
        const bX = lerp(20, 2, bProgress);
        const bY = lerp(24, 12, bProgress) - exit * 24;
        const bScale = lerp(1.1, 0.78, bProgress);
        const bRotate = lerp(18, 5, bProgress);
        const bOpacity = range(p, 0.14, 0.26) * (1 - range(p, 0.60, 0.75));
        invBadgeRef.current.style.transform = `translate3d(${bX}vw, ${bY}vh, 0) scale(${bScale}) rotate(${bRotate}deg)`;
        invBadgeRef.current.style.opacity = String(bOpacity);
      }

      // 5. Holographic Extraction HUD Pill that locks onto the monitor
      if (scanDataRef.current) {
        const sProgress = easeOutCubic(range(p, 0.30, 0.60));
        const sOpacity = range(p, 0.28, 0.38) * (1 - range(p, 0.68, 0.82));
        const sY = lerp(8, 0, sProgress) - exit * 16;
        scanDataRef.current.style.transform = `translate3d(0, ${sY}vh, 0) scale(${lerp(0.94, 1.0, sProgress)})`;
        scanDataRef.current.style.opacity = String(sOpacity);
      }

      // 6. Corner Telemetry HUD: visible from start
      if (hudRef.current) {
        const hudOpacity = 1 - range(p, 0.75, 0.90);
        hudRef.current.style.opacity = String(hudOpacity);
      }

      if (progressPercentRef.current) {
        progressPercentRef.current.textContent = `${Math.round(p * 100)}%`;
      }
      if (latencyRef.current) {
        const l = Math.max(180, Math.round(240 - p * 60));
        latencyRef.current.textContent = `${l}ms`;
      }
    };

    const unsubFrame = onFrame(updateFrame);
    if (container.addEventListener) {
      container.addEventListener('scroll', updateFrame, { passive: true });
    }

    return () => {
      unsubFrame();
      if (container.removeEventListener) {
        container.removeEventListener('scroll', updateFrame);
      }
    };
  }, [isMinimized]);

  const scrollToTable = () => {
    const tableEl = document.getElementById('invoices-table-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isMinimized) {
    return (
      <div className="w-full mb-3 p-3.5 rounded-2xl bg-[#0B0F19] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Autonomous Workstation Minimized</p>
            <p className="text-[11px] font-mono text-slate-400">IMAP Push Active · Groq LPU OCR Online</p>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span>Expand Workstation</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full mb-3"
      style={{ height: '120vh' }}
    >
      <div className="sticky top-0 w-full h-[440px] sm:h-[480px] lg:h-[510px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#0B0F19]">
        {/* Layer 0: Workstation Background Room (Loads as page loads) */}
        <div
          ref={backRef}
          className="absolute inset-0 size-full will-change-transform flex items-center justify-center pointer-events-none"
        >
          <picture className="w-full h-full">
            <source srcSet="/landing/workstation_back.webp" type="image/webp" />
            <img
              src="/landing/workstation_back.jpg"
              alt="Autonomous Invoice Workstation"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </picture>
          {/* Subtle gradient vignette to blend into dark obsidian frame */}
          <div className="absolute inset-0 bg-radial from-transparent via-[#0B0F19]/25 to-[#0B0F19]/80 pointer-events-none" />
        </div>

        {/* Layer 1: Pinned Center Title & Quick Action Bar (Visible at load) */}
        <div
          ref={titleRef}
          className="absolute inset-x-4 top-[8%] sm:top-[10%] max-w-3xl mx-auto text-center z-10 will-change-transform"
          style={{ opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.15] text-[11px] font-mono font-medium text-indigo-300 mb-2.5 backdrop-blur-md shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            RFC 2177 IMAP PUSH · DUAL-ENGINE GROQ LPU
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
            Autonomous Document Workstation
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed drop-shadow">
            Catches incoming bill attachments from email inboxes in real-time, reconciles
            multi-currency line items with Groq LPU, and syncs directly to Google Sheets.
          </p>

          {/* Quick Action Buttons directly in the Hero */}
          <div className="mt-4 flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Invoice</span>
            </button>

            <button
              onClick={onSyncEmailClick}
              disabled={isSyncingEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Mail className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingEmail ? 'animate-spin' : ''}`} />
              <span>{isSyncingEmail ? 'Syncing...' : 'Sync Email'}</span>
            </button>

            <Link
              to="/simulate"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulator</span>
            </Link>
          </div>
        </div>

        {/* Layer 2: Floating Invoices Stream (Drifts in as user scrolls) */}
        {/* Memo Card with Dollar Coin */}
        <div
          ref={invMemoRef}
          className="absolute z-20 pointer-events-none will-change-transform w-28 sm:w-40 md:w-48 drop-shadow-2xl"
          style={{ opacity: 0 }}
        >
          <img
            src="/landing/invoice_memo.webp"
            alt="Invoice Memo"
            className="w-full h-auto"
            loading="lazy"
          />
        </div>

        {/* Verified Invoice Document with Checkmark */}
        <div
          ref={invCheckRef}
          className="absolute z-20 pointer-events-none will-change-transform w-28 sm:w-36 md:w-44 drop-shadow-2xl"
          style={{ opacity: 0 }}
        >
          <img
            src="/landing/invoice_check.webp"
            alt="Verified Invoice"
            className="w-full h-auto"
            loading="lazy"
          />
        </div>

        {/* Handheld Invoice Badge */}
        <div
          ref={invBadgeRef}
          className="absolute z-20 pointer-events-none will-change-transform w-24 sm:w-32 md:w-36 drop-shadow-2xl"
          style={{ opacity: 0 }}
        >
          <img
            src="/landing/invoice_badge.webp"
            alt="Invoice Token"
            className="w-full h-auto"
            loading="lazy"
          />
        </div>

        {/* Layer 3: Foreground Operator Layer (Rises into position on scroll) */}
        <div
          ref={personRef}
          className="absolute inset-0 size-full will-change-transform flex items-center justify-center pointer-events-none z-25"
          style={{ opacity: 0, transform: 'translate3d(0, 15vh, 0)' }}
        >
          <picture className="w-full h-full">
            <source srcSet="/landing/person_layer.webp" type="image/webp" />
            <img
              src="/landing/person_layer.png"
              alt="Operator Layer"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </picture>
        </div>

        {/* Layer 4: Holographic Extraction HUD Pill (locks onto monitor) */}
        <div
          ref={scanDataRef}
          className="absolute z-30 pointer-events-none will-change-transform bottom-[24%] sm:bottom-[26%] w-11/12 max-w-sm mx-auto"
          style={{ opacity: 0 }}
        >
          <div className="p-3 rounded-xl bg-[#0B0F19]/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-[10px] font-semibold text-white tracking-wide uppercase">
                  EXTRACTED & RECONCILED
                </span>
              </div>
              <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                GROQ LPU 240ms
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left font-mono">
              <div>
                <p className="text-[9px] text-slate-400">Total Invoices</p>
                <p className="text-xs font-semibold text-white">{invoicesCount} Docs</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400">Currency</p>
                <p className="text-xs font-semibold text-emerald-400">₹ · € · $ · £</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400">Auto-Reconcile</p>
                <p className="text-xs font-semibold text-indigo-300">{syncRate}% Rate</p>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Live Sync to Google Sheets
              </span>
              <span>Sub-Second Telemetry</span>
            </div>
          </div>
        </div>

        {/* Layer 5: Corner Telemetry HUD & Scroll Prompt */}
        <div
          ref={hudRef}
          aria-hidden="true"
          className="absolute inset-3 sm:inset-5 pointer-events-none font-mono text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider z-40 flex flex-col justify-between"
          style={{ opacity: 1 }}
        >
          {/* Top Bar Telemetry */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 bg-black/60 p-2 rounded-lg border border-white/[0.08] backdrop-blur-md">
              <p className="text-white font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                IMAP Push Active
              </p>
              <p className="text-slate-400">
                OCR Latency: <span ref={latencyRef} className="text-indigo-300 tabular-nums">240ms</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer backdrop-blur-md text-[10px]"
                title="Minimize workstation banner"
              >
                <span>Minimize</span>
                <ChevronUp className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={scrollToTable}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer backdrop-blur-md text-[10px]"
                title="Jump straight to invoices table"
              >
                <span>Jump to Table</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>
            </div>
          </div>

          {/* Bottom Bar Scroll Prompt */}
          <div className="flex items-end justify-between">
            <div className="space-y-0.5 bg-black/60 p-2 rounded-lg border border-white/[0.08] backdrop-blur-md">
              <p className="text-white font-medium">Reconciliation Core</p>
              <p className="text-slate-400">
                Currencies: <span className="text-indigo-300 font-semibold">$ · € · ₹ · £</span>
              </p>
            </div>

            <button
              onClick={scrollToTable}
              className="pointer-events-auto flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-500/40 text-white transition-all cursor-pointer backdrop-blur-md shadow-lg text-[10px]"
            >
              <span>Scroll to Ingest</span>
              <span ref={progressPercentRef} className="text-indigo-200 font-semibold tabular-nums">
                0%
              </span>
              <ArrowDown className="w-3 h-3 animate-bounce text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
