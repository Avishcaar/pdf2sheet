import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, CheckCircle2, ArrowDown } from 'lucide-react';
import { clamp, easeOutCubic, lerp, pinProgress, range } from '../../utils/math';
import { onFrame, scrollToHash } from '../../utils/scroll';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const STAGE_VH = 360;

export default function HeroScrollStage() {
  const rootRef = useRef(null);
  const backRef = useRef(null);
  const personRef = useRef(null);
  const titleRef = useRef(null);
  const hudRef = useRef(null);
  const invMemoRef = useRef(null);
  const invCheckRef = useRef(null);
  const invBadgeRef = useRef(null);
  const scanDataRef = useRef(null);
  const clockRef = useRef(null);
  const latencyRef = useRef(null);
  const progressPercentRef = useRef(null);

  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    let lastP = -1;

    return onFrame((time) => {
      const root = rootRef.current;
      if (!root) return;
      const { p, rect } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const exit = range(p, 0.75, 1.0);
      const settle = easeOutCubic(range(p, 0, 0.45));
      const rise = easeOutCubic(range(p, 0.04, 0.38));

      // 1. Background workstation: subtle zoom and depth
      if (backRef.current) {
        const bgScale = lerp(1.06, 1.0, settle);
        const bgY = lerp(0, -5, p) - exit * 18;
        backRef.current.style.transform = `translate3d(0, ${bgY}vh, 0) scale(${bgScale})`;
      }

      // 2. Operator Foreground Layer (person sitting at the desk)
      // Loads as user scrolls, rising from below to take position at the workstation
      if (personRef.current) {
        const personY = lerp(18, 0, rise) - exit * 45;
        const personOpacity = clamp(range(p, 0.02, 0.25) * 1.5);
        personRef.current.style.transform = `translate3d(0, ${personY}vh, 0) scale(${lerp(1.04, 1.0, rise)})`;
        personRef.current.style.opacity = String(personOpacity);
      }

      // 3. Title & Subtitle: fully visible initially (p=0), yields as user scrolls deeper
      if (titleRef.current) {
        const tOut = range(p, 0.32, 0.48);
        const titleY = -p * 12;
        titleRef.current.style.opacity = String(1 - tOut);
        titleRef.current.style.transform = `translate3d(0, ${titleY}vh, 0)`;
      }

      // 4. Floating Invoices Stream (fly in as user scrolls)
      // Invoice 1: Memo card with dollar icon drifting from top-left into monitor
      if (invMemoRef.current) {
        const mProgress = easeOutCubic(range(p, 0.12, 0.58));
        const mX = lerp(-35, -4, mProgress);
        const mY = lerp(-40, 8, mProgress) - exit * 30;
        const mScale = lerp(1.4, 0.85, mProgress);
        const mRotate = lerp(-18, -4, mProgress);
        const mOpacity = range(p, 0.10, 0.24) * (1 - range(p, 0.64, 0.74));
        invMemoRef.current.style.transform = `translate3d(${mX}vw, ${mY}vh, 0) scale(${mScale}) rotate(${mRotate}deg)`;
        invMemoRef.current.style.opacity = String(mOpacity);
      }

      // Invoice 2: Checkmark verified document floating in from right
      if (invCheckRef.current) {
        const cProgress = easeOutCubic(range(p, 0.18, 0.64));
        const cX = lerp(35, 12, cProgress);
        const cY = lerp(-25, 14, cProgress) - exit * 35;
        const cScale = lerp(1.3, 0.9, cProgress);
        const cRotate = lerp(16, 5, cProgress);
        const cOpacity = range(p, 0.15, 0.28) * (1 - range(p, 0.68, 0.76));
        invCheckRef.current.style.transform = `translate3d(${cX}vw, ${cY}vh, 0) scale(${cScale}) rotate(${cRotate}deg)`;
        invCheckRef.current.style.opacity = String(cOpacity);
      }

      // Invoice 3: Hand delivery circular badge
      if (invBadgeRef.current) {
        const bProgress = easeOutCubic(range(p, 0.24, 0.68));
        const bX = lerp(28, 4, bProgress);
        const bY = lerp(35, 20, bProgress) - exit * 40;
        const bScale = lerp(1.2, 0.8, bProgress);
        const bRotate = lerp(22, 8, bProgress);
        const bOpacity = range(p, 0.20, 0.32) * (1 - range(p, 0.72, 0.80));
        invBadgeRef.current.style.transform = `translate3d(${bX}vw, ${bY}vh, 0) scale(${bScale}) rotate(${bRotate}deg)`;
        invBadgeRef.current.style.opacity = String(bOpacity);
      }

      // 5. Holographic Extraction HUD Pill (locks onto monitor)
      if (scanDataRef.current) {
        const sProgress = easeOutCubic(range(p, 0.40, 0.72));
        const sOpacity = range(p, 0.36, 0.48) * (1 - range(p, 0.78, 0.88));
        const sY = lerp(12, 0, sProgress) - exit * 25;
        scanDataRef.current.style.transform = `translate3d(0, ${sY}vh, 0) scale(${lerp(0.9, 1.0, sProgress)})`;
        scanDataRef.current.style.opacity = String(sOpacity);
      }

      // 6. Corner Telemetry HUD: visible from the start
      if (hudRef.current) {
        const hudOpacity = 1 - range(p, 0.85, 0.95);
        hudRef.current.style.opacity = String(hudOpacity);
      }

      // Telemetry readouts update
      if (progressPercentRef.current) {
        progressPercentRef.current.textContent = `${Math.round(p * 100)}%`;
      }
      if (latencyRef.current) {
        const l = Math.max(180, Math.round(240 - p * 60));
        latencyRef.current.textContent = `${l}ms`;
      }
      if (clockRef.current) {
        const secs = Math.floor(p * 240);
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        clockRef.current.textContent = `00:${mm}:${ss}`;
      }
    });
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      aria-label="Autonomous Document Ingestion Workstation"
      className="relative bg-[#0B0F19]"
      style={{ height: `${STAGE_VH}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center bg-[#0B0F19]">
        {/* Layer 0: Room & Workstation Background (Loaded as site loads) */}
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
              fetchPriority="high"
            />
          </picture>
          {/* Subtle vignette blend into the dark slate obsidian */}
          <div className="absolute inset-0 bg-radial from-transparent via-[#0B0F19]/20 to-[#0B0F19]/80 pointer-events-none" />
        </div>

        {/* Layer 1: Pinned Center Title & Subtitle (Fully visible at load) */}
        <div
          ref={titleRef}
          className="absolute inset-x-4 top-[14%] sm:top-[16%] md:top-[18%] max-w-3xl mx-auto text-center z-10 will-change-transform"
          style={{ opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.15] text-xs font-mono font-medium text-indigo-300 mb-4 backdrop-blur-md shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            RFC 2177 IMAP IDLE PUSH · GROQ LPU PARSER
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-lg">
            Zero-Latency Invoices. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-white">
              Real-Time Verified Sheets.
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Catches incoming bill attachments from email inboxes the second they arrive,
            reconciles multi-currency line items with Groq LPU, and pushes validated accounting
            rows directly to Google Sheets.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/simulate"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-all"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Simulate Ingestion</span>
            </Link>
          </div>
        </div>

        {/* Layer 2: Floating Invoices Stream (Drifts in as user scrolls) */}
        {/* Memo Card with Dollar Coin */}
        <div
          ref={invMemoRef}
          className="absolute z-20 pointer-events-none will-change-transform w-36 sm:w-48 md:w-56 drop-shadow-2xl"
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
          className="absolute z-20 pointer-events-none will-change-transform w-32 sm:w-44 md:w-52 drop-shadow-2xl"
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
          className="absolute z-20 pointer-events-none will-change-transform w-28 sm:w-36 md:w-44 drop-shadow-2xl"
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
          style={{ opacity: 0, transform: 'translate3d(0, 18vh, 0)' }}
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

        {/* Layer 4: Holographic Extraction Data Tag (locks onto monitor) */}
        <div
          ref={scanDataRef}
          className="absolute z-30 pointer-events-none will-change-transform bottom-[32%] sm:bottom-[34%] md:bottom-[36%] w-11/12 max-w-md mx-auto"
          style={{ opacity: 0 }}
        >
          <div className="p-3.5 rounded-xl bg-[#0B0F19]/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px] font-semibold text-white tracking-wide uppercase">
                  EXTRACTED & RECONCILED
                </span>
              </div>
              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                GROQ LPU 240ms
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left font-mono">
              <div>
                <p className="text-[10px] text-slate-400">Vendor</p>
                <p className="text-xs font-semibold text-white truncate">Acme Services</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Currency & Total</p>
                <p className="text-xs font-semibold text-emerald-400">₹42,500.00</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Math Audit</p>
                <p className="text-xs font-semibold text-indigo-300">100% Match</p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Live Sync to Google Sheets
              </span>
              <span>Invoice #INV-2026-089</span>
            </div>
          </div>
        </div>

        {/* Layer 5: Corner Telemetry HUD Overlay (Visible at load) */}
        <div
          ref={hudRef}
          aria-hidden="true"
          className="absolute inset-4 sm:inset-6 md:inset-8 pointer-events-none font-mono text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider z-40 flex flex-col justify-between"
          style={{ opacity: 1 }}
        >
          {/* Top Bar Telemetry */}
          <div className="flex items-start justify-between">
            <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-white/[0.08] backdrop-blur-md">
              <p className="text-white font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                IMAP Push Active
              </p>
              <p className="text-slate-400">
                Ingestion Latency: <span ref={latencyRef} className="text-indigo-300 tabular-nums">240ms</span>
              </p>
            </div>

            <div className="space-y-1 text-right bg-black/60 p-2.5 rounded-lg border border-white/[0.08] backdrop-blur-md">
              <p className="text-white font-medium">Session Clock</p>
              <p ref={clockRef} className="text-indigo-300 tabular-nums font-mono">
                00:00:00
              </p>
            </div>
          </div>

          {/* Bottom Bar Telemetry & Scroll Prompt */}
          <div className="flex items-end justify-between">
            <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-white/[0.08] backdrop-blur-md">
              <p className="text-white font-medium">Reconciliation Core</p>
              <p className="text-slate-400">
                Currencies: <span className="text-indigo-300 font-semibold">$ · € · ₹ · £</span>
              </p>
            </div>

            <button
              onClick={() => scrollToHash('#pipeline')}
              className="pointer-events-auto flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-600 px-3.5 py-2 rounded-lg border border-indigo-500/40 text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
            >
              <span>Scroll to Ingest Invoices</span>
              <span ref={progressPercentRef} className="text-indigo-200 font-semibold tabular-nums">
                0%
              </span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
