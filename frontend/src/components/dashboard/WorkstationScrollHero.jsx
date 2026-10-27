import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Terminal, 
  CheckCircle2, 
  Mail, 
  UploadCloud, 
  ArrowDown, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Scan, 
  Cpu, 
  Database, 
  FileText, 
  Zap, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { clamp, easeOutCubic, lerp, range } from '../../utils/math';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function WorkstationScrollHero({ 
  onUploadClick, 
  onSyncEmailClick, 
  isSyncingEmail, 
  invoicesCount = 0, 
  syncRate = 100 
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  
  // DOM Refs for direct style manipulation (60-120fps, bypass React re-renders)
  const docWrapperRef = useRef(null);
  const laserRef = useRef(null);
  const laserBeamRef = useRef(null);
  const boxVendorRef = useRef(null);
  const boxMetaRef = useRef(null);
  const boxItemsRef = useRef(null);
  const boxTotalRef = useRef(null);
  const terminalJsonRef = useRef(null);
  const terminalBadgeRef = useRef(null);
  const ejectGroupRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const progressPercentRef = useRef(null);
  const latencyRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const reduced = useReducedMotion();

  // Particle Canvas Setup (drifting data motes inspired by Selene)
  useEffect(() => {
    if (isMinimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Initialize 80 floating data particles
    let seed = 42;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const motes = Array.from({ length: 80 }, () => ({
      x: rand(),
      y: rand(),
      r: 0.8 + rand() * 1.8,
      speed: 0.15 + rand() * 0.45,
      alpha: 0.2 + rand() * 0.6,
      hue: rand() > 0.6 ? 217 : rand() > 0.3 ? 160 : 260 // Cyan, Emerald, Indigo
    }));

    let lastTime = performance.now();

    const renderParticles = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (const m of motes) {
        if (!reduced) {
          m.y -= m.speed * dt * 0.12;
          m.x += Math.sin(time * 0.001 + m.y * 10) * 0.0003;
          if (m.y < 0) m.y = 1;
          if (m.x < 0) m.x = 1;
          if (m.x > 1) m.x = 0;
        }

        ctx.fillStyle = m.hue === 160 
          ? `rgba(52, 211, 153, ${m.alpha * 0.7})` 
          : m.hue === 217 
          ? `rgba(56, 189, 248, ${m.alpha * 0.7})` 
          : `rgba(167, 139, 250, ${m.alpha * 0.6})`;

        ctx.beginPath();
        ctx.arc(m.x * width, m.y * height, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderParticles);
    };

    animId = requestAnimationFrame(renderParticles);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isMinimized, reduced]);

  // Scroll Choreography Frame Loop
  useEffect(() => {
    if (isMinimized) return;
    const root = rootRef.current;
    if (!root) return;

    let animId;
    let lastP = -1;

    const frameLoop = () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const mainEl = rootEl.closest('main') || window;
      const isWindow = mainEl === window;
      const rect = rootEl.getBoundingClientRect();
      const containerTop = isWindow ? 0 : mainEl.getBoundingClientRect().top;
      const containerHeight = isWindow ? window.innerHeight : mainEl.clientHeight;

      const relTop = rect.top - containerTop;
      const span = Math.max(1, rect.height - containerHeight);
      const p = clamp(-relTop / span);

      if (Math.abs(p - lastP) > 0.0002) {
        lastP = p;

        // 1. Percentage counter & Telemetry Latency
        if (progressPercentRef.current) {
          progressPercentRef.current.textContent = `${Math.round(p * 100)}%`;
        }
        if (latencyRef.current) {
          const l = Math.max(120, Math.round(280 - p * 160));
          latencyRef.current.textContent = `${l}ms`;
        }

        // 2. Document 3D Inflow and Perspective Unfold
        // p: 0.0 -> 0.35 (tilts from 14deg down to 0deg flat, scales into crisp view)
        if (docWrapperRef.current) {
          const unfold = easeOutCubic(range(p, 0.0, 0.32));
          const rotX = lerp(12, 0, unfold);
          const rotY = lerp(-10, 0, unfold);
          const scale = lerp(0.92, 1.0, unfold);
          const transY = lerp(20, 0, unfold);
          const exit = easeOutCubic(range(p, 0.78, 1.0));
          const exitY = -exit * 60;
          const exitScale = lerp(1.0, 0.92, exit);
          const opacity = lerp(1.0, 0.25, exit);

          docWrapperRef.current.style.transform = `perspective(1200px) translate3d(0, ${transY + exitY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale * exitScale})`;
          docWrapperRef.current.style.opacity = String(opacity);
        }

        // 3. Laser Scan Bar & Sweeping Beam
        // p: 0.20 -> 0.75 (sweeps from 0% top down to 100% bottom of document)
        if (laserRef.current && laserBeamRef.current) {
          const laserActive = range(p, 0.16, 0.78);
          const laserSweep = easeOutCubic(range(p, 0.20, 0.74));
          const laserOpacity = range(p, 0.18, 0.25) * (1 - range(p, 0.74, 0.80));

          laserRef.current.style.top = `${laserSweep * 100}%`;
          laserRef.current.style.opacity = String(laserOpacity);

          laserBeamRef.current.style.height = `${laserSweep * 100}%`;
          laserBeamRef.current.style.opacity = String(laserOpacity * 0.45);
        }

        // 4. Bounding Box Illuminations triggered as laser passes each region
        const updateBox = (el, start, end, activeBorder, activeBg) => {
          if (!el) return;
          const a = easeOutCubic(range(p, start, end));
          const tag = el.querySelector('.box-tag');
          if (a > 0.05) {
            el.style.borderColor = activeBorder;
            el.style.backgroundColor = activeBg;
            el.style.boxShadow = `0 0 ${Math.round(a * 15)}px ${activeBorder}33`;
          } else {
            el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            el.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            el.style.boxShadow = 'none';
          }
          if (tag) {
            tag.style.opacity = String(a);
            tag.style.transform = `scale(${lerp(0.85, 1.0, a)})`;
          }
        };

        // Box 1: Vendor Header (triggered at p > 0.22)
        updateBox(boxVendorRef.current, 0.22, 0.32, 'rgb(52, 211, 153)', 'rgba(52, 211, 153, 0.1)');

        // Box 2: Meta / Invoice Number (triggered at p > 0.36)
        updateBox(boxMetaRef.current, 0.36, 0.46, 'rgb(34, 211, 238)', 'rgba(34, 211, 238, 0.1)');

        // Box 3: Line Items (triggered at p > 0.48)
        updateBox(boxItemsRef.current, 0.48, 0.58, 'rgb(129, 140, 248)', 'rgba(129, 140, 248, 0.1)');

        // Box 4: Total & Tax (triggered at p > 0.60)
        updateBox(boxTotalRef.current, 0.60, 0.70, 'rgb(192, 132, 252)', 'rgba(192, 132, 252, 0.12)');

        // 5. Terminal JSON Stream & Badge
        if (terminalBadgeRef.current) {
          if (p < 0.22) {
            terminalBadgeRef.current.textContent = 'STANDBY · AWAITING BUFFER';
            terminalBadgeRef.current.className = 'font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700';
          } else if (p < 0.68) {
            terminalBadgeRef.current.textContent = 'GROQ LPU · OCR SCAN IN PROGRESS';
            terminalBadgeRef.current.className = 'font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse';
          } else {
            terminalBadgeRef.current.textContent = 'RECONCILED · LEDGER COMMITTED';
            terminalBadgeRef.current.className = 'font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30';
          }
        }

        if (terminalJsonRef.current) {
          // Progressively reveal JSON lines as p advances
          const lines = terminalJsonRef.current.querySelectorAll('.json-line');
          lines.forEach((line, idx) => {
            const threshold = 0.22 + idx * 0.08;
            if (p >= threshold) {
              line.style.opacity = '1';
              line.style.transform = 'translate3d(0, 0, 0)';
            } else {
              line.style.opacity = '0.15';
              line.style.transform = 'translate3d(6px, 0, 0)';
            }
          });
        }

        // 6. Ejection Group (Data Pills flying towards ledger)
        // p: 0.72 -> 0.96
        if (ejectGroupRef.current) {
          const ejProgress = easeOutCubic(range(p, 0.72, 0.94));
          const ejOpacity = range(p, 0.70, 0.78) * (1 - range(p, 0.95, 1.0));
          const ejY = lerp(-20, 40, ejProgress);
          ejectGroupRef.current.style.opacity = String(ejOpacity);
          ejectGroupRef.current.style.transform = `translate3d(0, ${ejY}px, 0)`;
        }

        // 7. Scroll indicator fade out
        if (scrollIndicatorRef.current) {
          scrollIndicatorRef.current.style.opacity = String(1 - range(p, 0.70, 0.85));
        }
      }

      animId = requestAnimationFrame(frameLoop);
    };

    animId = requestAnimationFrame(frameLoop);

    return () => {
      cancelAnimationFrame(animId);
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
      <div className="w-full mb-3 p-3.5 rounded-2xl bg-[#0B0F19] border border-white/[0.08] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Digital OCR Pipeline Minimized</p>
            <p className="text-[11px] font-mono text-slate-400">RFC 2177 Push Active · Dual Groq LPU Engine Ready</p>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span>Expand Pipeline</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full mb-2"
      style={{ height: '240vh' }}
    >
      <div className="sticky top-0 w-full h-[540px] sm:h-[580px] lg:h-[620px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#070A11] flex flex-col justify-between select-none">
        
        {/* Layer 0: Dynamic Canvas Background with drifting data particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full pointer-events-none z-0"
        />

        {/* Ambient Radial Gradient Glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Top Control Bar & Telemetry HUD */}
        <div className="relative z-30 p-4 sm:p-5 flex items-center justify-between border-b border-white/[0.06] bg-[#070A11]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Autonomous OCR Pipeline
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  RFC 2177 ACTIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
                Optical Document Intelligence · Groq LPU Inference · Live Google Sheets Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick action buttons right in the bar */}
            <button
              onClick={onUploadClick}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>

            <button
              onClick={onSyncEmailClick}
              disabled={isSyncingEmail}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Mail className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingEmail ? 'animate-spin' : ''}`} />
              <span>{isSyncingEmail ? 'Syncing...' : 'Sync Email'}</span>
            </button>

            <Link
              to="/simulate"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulator</span>
            </Link>

            <button
              onClick={scrollToTable}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              title="Jump straight to invoices table"
            >
              <span>Skip</span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              title="Minimize pipeline hero"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Center Stage: Split Screen (Left: 3D Document Scan, Right: Live Extraction Terminal) */}
        <div className="relative flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-8 gap-6 z-10 overflow-hidden">
          
          {/* LEFT: 3D Glassmorphic Invoice Document */}
          <div className="w-full lg:w-[52%] max-w-lg flex items-center justify-center">
            <div
              ref={docWrapperRef}
              className="relative w-full max-w-[420px] aspect-[1/1.3] bg-white/[0.04] backdrop-blur-xl border border-white/[0.14] rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] will-change-transform overflow-hidden flex flex-col justify-between"
              style={{
                transform: 'perspective(1200px) rotateX(12deg) rotateY(-10deg) scale(0.92)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* Laser Scanning Bar and Beam */}
              <div
                ref={laserBeamRef}
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-cyan-500/20 via-indigo-500/10 to-transparent pointer-events-none will-change-transform z-20"
                style={{ height: '0%', opacity: 0 }}
              />
              <div
                ref={laserRef}
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee,0_0_30px_#818cf8] pointer-events-none will-change-transform z-30 flex items-center justify-center"
                style={{ top: '0%', opacity: 0 }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-ping" />
              </div>

              {/* DOCUMENT CONTENT */}
              <div className="space-y-4 relative z-10">
                {/* 1. Document Header / Vendor */}
                <div
                  ref={boxVendorRef}
                  className="relative p-2 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform"
                >
                  <div 
                    className="box-tag absolute -top-2.5 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-black font-mono text-[9px] font-bold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    VENDOR · 99.8%
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Acme Cloud Infrastructure Inc.</h3>
                      <p className="text-[10px] text-slate-300 font-mono">billing@acmecloud.io · San Francisco, CA</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-mono text-xs font-bold">
                      AC
                    </div>
                  </div>
                </div>

                {/* 2. Metadata: Invoice # & Dates */}
                <div
                  ref={boxMetaRef}
                  className="relative p-2 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform"
                >
                  <div 
                    className="box-tag absolute -top-2.5 right-2 px-1.5 py-0.5 rounded bg-cyan-500 text-black font-mono text-[9px] font-bold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    META · 99.4%
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">INVOICE NO</span>
                      <span className="text-white font-semibold">INV-2026-9041</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ISSUE DATE</span>
                      <span className="text-white font-semibold">2026-10-27</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">TERMS</span>
                      <span className="text-emerald-400 font-semibold">NET 30</span>
                    </div>
                  </div>
                </div>

                {/* 3. Line Items Table */}
                <div
                  ref={boxItemsRef}
                  className="relative p-2 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform space-y-1.5"
                >
                  <div 
                    className="box-tag absolute -top-2.5 right-2 px-1.5 py-0.5 rounded bg-indigo-500 text-white font-mono text-[9px] font-bold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    3 ITEMS · 99.1%
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 border-b border-white/10 pb-1">
                    <span>DESCRIPTION</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-200">
                    <span className="truncate pr-2">Enterprise GPU Cluster (L40S)</span>
                    <span className="text-white font-medium">$3,400.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-200">
                    <span className="truncate pr-2">Global Edge CDN Bandwidth</span>
                    <span className="text-white font-medium">$950.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-200">
                    <span className="truncate pr-2">Encrypted Bucket Storage</span>
                    <span className="text-white font-medium">$500.00</span>
                  </div>
                </div>

                {/* 4. Total Amount & Currency */}
                <div
                  ref={boxTotalRef}
                  className="relative p-2.5 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform"
                >
                  <div 
                    className="box-tag absolute -top-2.5 right-2 px-1.5 py-0.5 rounded bg-purple-500 text-white font-mono text-[9px] font-bold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    TOTAL · 100%
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-200 block">TOTAL PAYABLE (USD)</span>
                      <span className="text-xl font-bold font-mono text-white tracking-tight">$4,850.00</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Ledger Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark & Footer */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Groq LPU Llama-3-Vision Checked
                </span>
                <span>AUTHENTIC RFC 2177</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Telemetry Terminal & JSON Inspector */}
          <div className="w-full lg:w-[48%] max-w-lg flex flex-col justify-center space-y-3">
            {/* Terminal Window Header */}
            <div className="rounded-xl border border-white/[0.1] bg-[#0B0F19]/90 backdrop-blur-md shadow-2xl p-4 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">
                    extraction_stream.json
                  </span>
                </div>
                <span ref={terminalBadgeRef} className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  STANDBY · AWAITING BUFFER
                </span>
              </div>

              {/* JSON Lines Stream */}
              <div ref={terminalJsonRef} className="space-y-1 text-[11px] leading-relaxed">
                <div className="json-line transition-all duration-200 text-slate-400 font-mono">
                  &#123;
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"status"</span>: <span className="text-emerald-300">"RECONCILED"</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"vendor"</span>: <span className="text-amber-300">"Acme Cloud Infrastructure Inc."</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"invoiceNumber"</span>: <span className="text-indigo-300">"INV-2026-9041"</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"date"</span>: <span className="text-slate-200">"2026-10-27"</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"currency"</span>: <span className="text-purple-300">"USD"</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"totalAmount"</span>: <span className="text-emerald-400 font-bold">4850.00</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"lineItems"</span>: <span className="text-slate-400">[3 extracted]</span>,
                </div>
                <div className="json-line transition-all duration-200 pl-4 font-mono">
                  <span className="text-cyan-400">"syncLedger"</span>: <span className="text-emerald-300">"Google Sheets (Active)"</span>
                </div>
                <div className="json-line transition-all duration-200 text-slate-400 font-mono">
                  &#125;
                </div>
              </div>

              {/* Hardware & Pipeline Telemetry Stats Bar */}
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[9px]">LPU INFERENCE</span>
                  <span ref={latencyRef} className="text-cyan-300 font-bold tabular-nums">240ms</span>
                </div>
                <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[9px]">MATCH RATE</span>
                  <span className="text-emerald-400 font-bold">{syncRate}% Auto</span>
                </div>
                <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[9px]">TOTAL INVOICES</span>
                  <span className="text-white font-bold">{invoicesCount} Docs</span>
                </div>
              </div>
            </div>

            {/* Ejected Data Flight Pills (appears at p > 0.70 streaming into table) */}
            <div
              ref={ejectGroupRef}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/30 backdrop-blur-md shadow-xl transition-all will-change-transform flex items-center justify-between"
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white">Streaming Record to Live Ledger</p>
                  <p className="text-[10px] font-mono text-emerald-300">INV-2026-9041 · $4,850.00 USD</p>
                </div>
              </div>
              <button
                onClick={scrollToTable}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-bold hover:bg-emerald-400 transition-colors cursor-pointer shadow"
              >
                <span>View Row</span>
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Status Ribbon & Interactive Scroll Prompt */}
        <div className="relative z-30 p-3 sm:p-4 border-t border-white/[0.06] bg-[#070A11]/60 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-medium">Pipeline Telemetry Online</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">Llama-3-Vision & DeepSeek OCR Core</span>
          </div>

          <div
            ref={scrollIndicatorRef}
            className="flex items-center gap-2.5"
          >
            <span className="hidden sm:inline text-slate-400">Scroll to sweep OCR:</span>
            <button
              onClick={scrollToTable}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold shadow-lg transition-all cursor-pointer text-xs"
            >
              <span>Scan Progress</span>
              <span ref={progressPercentRef} className="font-mono text-indigo-200 tabular-nums font-bold">
                0%
              </span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
