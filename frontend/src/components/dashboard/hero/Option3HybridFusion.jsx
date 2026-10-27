import React, { useEffect, useRef, useState } from 'react';
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
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Activity,
  FileCheck2,
  Check
} from 'lucide-react';
import { clamp, easeOutCubic, lerp, range } from '../../../utils/math';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export default function Option3HybridFusion({ 
  onUploadClick, 
  onSyncEmailClick, 
  isSyncingEmail, 
  invoicesCount = 0, 
  syncRate = 100 
}) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const svgConduitRef = useRef(null);

  // Left Column: Floating Inflow Document & Scanner Refs
  const docWrapperRef = useRef(null);
  const docGleamRef = useRef(null);
  const laserRef = useRef(null);
  const laserBeamRef = useRef(null);
  const laserCoordRef = useRef(null);
  const auditStampRef = useRef(null);
  const boxVendorRef = useRef(null);
  const boxMetaRef = useRef(null);
  const boxItemsRef = useRef(null);
  const boxTotalRef = useRef(null);

  // Center Column: Workstation Diorama & Live Monitor Refs
  const workstationRef = useRef(null);
  const monitorGlowRef = useRef(null);
  const monitorScreenRef = useRef(null);
  const holoBeamRef = useRef(null);

  // Right Column: Telemetry JSON Terminal & Ejection Refs
  const terminalRef = useRef(null);
  const terminalBadgeRef = useRef(null);
  const jsonVendorRef = useRef(null);
  const jsonMetaRef = useRef(null);
  const jsonItemsRef = useRef(null);
  const jsonTotalRef = useRef(null);
  const lpuRateRef = useRef(null);
  const latencyRef = useRef(null);
  const ejectGroupRef = useRef(null);

  // Global Pipeline Progress Refs
  const progressPercentRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const reduced = useReducedMotion();

  // Mouse Parallax Physics Ref
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const sparksRef = useRef([]);

  // Mouse Move Listener for 3D Specular Parallax
  const handleMouseMove = (e) => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    mouse.current.targetX = (e.clientX - rect.left) / rect.width - 0.5;
    mouse.current.targetY = (e.clientY - rect.top) / rect.height - 0.5;
  };

  const handleMouseLeave = () => {
    mouse.current.targetX = 0;
    mouse.current.targetY = 0;
  };

  // Spark burst trigger on verification stamp impact
  const triggerImpactSparks = (originX, originY, color = '#34d399') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = originX - rect.left;
    const cy = originY - rect.top;

    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      sparksRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: 1.2 + Math.random() * 2.2,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.035,
        color
      });
    }
  };

  // 1. Interactive Starfield & Spark Physics Canvas (inspired by selene)
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

    let seed = 127;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const motes = Array.from({ length: 70 }, () => ({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.0003,
      vy: -0.00015 - rand() * 0.0003,
      r: 1.0 + rand() * 1.8,
      alpha: 0.15 + rand() * 0.55,
      hue: rand() > 0.6 ? 217 : rand() > 0.3 ? 160 : 270
    }));

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Constellation Web
      const maxDist = 95;
      for (let i = 0; i < motes.length; i++) {
        for (let j = i + 1; j < motes.length; j++) {
          const dx = (motes[i].x - motes[j].x) * width;
          const dy = (motes[i].y - motes[j].y) * height;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(motes[i].x * width, motes[i].y * height);
            ctx.lineTo(motes[j].x * width, motes[j].y * height);
            ctx.stroke();
          }
        }
      }

      // Floating Motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < 0) m.x = 1;
        if (m.x > 1) m.x = 0;
        if (m.y < 0) m.y = 1;
        if (m.y > 1) m.y = 0;

        ctx.fillStyle = `hsla(${m.hue}, 80%, 75%, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(m.x * width, m.y * height, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Active Sparks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.15; // gravity
        sp.alpha -= sp.decay;

        if (sp.alpha <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isMinimized]);

  // 2. High-Performance Frame Loop (Scroll & Parallax Engine)
  useEffect(() => {
    if (isMinimized) return;

    let animId;
    let targetP = 0;
    let smoothP = 0;
    let lastSmoothP = -1;
    let sparksTriggered = false;

    // SVG Conduit Path Generator
    const updateLaserConduit = (pathId, photonId, fromEl, toEl, progress, color) => {
      const svg = svgConduitRef.current;
      if (!svg || !fromEl || !toEl) return;
      const pathEl = svg.querySelector(`#${pathId}`);
      const photonEl = svg.querySelector(`#${photonId}`);
      if (!pathEl || !photonEl) return;

      if (progress <= 0 || progress >= 1) {
        pathEl.style.opacity = '0';
        photonEl.setAttribute('opacity', '0');
        return;
      }

      const sRect = svg.getBoundingClientRect();
      if (sRect.width === 0 || sRect.height === 0) return;

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      // Convert DOM client rects into SVG viewBox (1200 x 700)
      const scaleX = 1200 / sRect.width;
      const scaleY = 700 / sRect.height;

      const x1 = (fRect.right - sRect.left) * scaleX;
      const y1 = (fRect.top + fRect.height / 2 - sRect.top) * scaleY;
      const x2 = (tRect.left + tRect.width * 0.25 - sRect.left) * scaleX;
      const y2 = (tRect.top + tRect.height * 0.4 - sRect.top) * scaleY;

      const dx = Math.max(40, (x2 - x1) * 0.45);
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1 - 15}, ${x2 - dx} ${y2 + 10}, ${x2} ${y2}`;
      pathEl.setAttribute('d', d);

      const len = pathEl.getTotalLength ? pathEl.getTotalLength() : 300;
      pathEl.style.strokeDasharray = `${len}`;

      const k = easeOutCubic(progress);
      pathEl.style.strokeDashoffset = `${len * (1 - k)}`;
      pathEl.style.opacity = String(range(progress, 0.05, 0.25) * (1 - range(progress, 0.90, 1.0)));

      if (pathEl.getPointAtLength && k > 0.02 && k < 0.98) {
        const pt = pathEl.getPointAtLength(len * k);
        photonEl.setAttribute('cx', String(pt.x));
        photonEl.setAttribute('cy', String(pt.y));
        photonEl.setAttribute('opacity', '1');
      } else {
        photonEl.setAttribute('opacity', '0');
      }
    };

    const frameLoop = (time) => {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const mainEl = rootEl.closest('main') || window;
      const isWindow = mainEl === window;
      const rect = rootEl.getBoundingClientRect();
      const containerTop = isWindow ? 0 : mainEl.getBoundingClientRect().top;
      const containerHeight = isWindow ? window.innerHeight : mainEl.clientHeight;

      const relTop = rect.top - containerTop;
      const span = Math.max(1, rect.height - containerHeight);
      targetP = clamp(-relTop / span);

      // Fluid Momentum Lerp
      smoothP = lerp(smoothP, targetP, 0.14);
      if (Math.abs(smoothP - targetP) < 0.0001) smoothP = targetP;

      // Mouse Parallax Physics
      mouse.current.x = lerp(mouse.current.x, mouse.current.targetX, 0.08);
      mouse.current.y = lerp(mouse.current.y, mouse.current.targetY, 0.08);

      const p = smoothP;

      if (Math.abs(p - lastSmoothP) > 0.0001 || Math.abs(mouse.current.x - mouse.current.targetX) > 0.001) {
        lastSmoothP = p;

        // Telemetry Counters
        if (progressPercentRef.current) {
          progressPercentRef.current.textContent = `${Math.round(p * 100)}%`;
        }
        if (latencyRef.current) {
          const l = Math.max(110, Math.round(280 - p * 170));
          latencyRef.current.textContent = `${l}ms`;
        }
        if (lpuRateRef.current) {
          const rate = p > 0.22 ? Math.round(740 + p * 80) : 0;
          lpuRateRef.current.textContent = `${rate} T/s`;
        }

        const exit = easeOutCubic(range(p, 0.82, 1.0));
        const exitY = -exit * 60;

        // 1. LEFT ZONE: Floating Inflow Document (3D Tilt & Specular Physics)
        if (docWrapperRef.current) {
          const docInflow = easeOutCubic(range(p, 0.04, 0.32));
          const docX = lerp(-40, 0, docInflow) + mouse.current.x * 20;
          const docY = lerp(-30, 0, docInflow) + Math.sin(time * 0.002) * 5 + exitY * 0.8;
          const docScale = lerp(0.92, 1.0, docInflow);
          const rotX = lerp(12, 4, docInflow) - mouse.current.y * 10;
          const rotY = lerp(-18, -6, docInflow) + mouse.current.x * 12;
          const docOpacity = range(p, 0.02, 0.15) * (1 - range(p, 0.86, 0.98));

          docWrapperRef.current.style.transform = `perspective(1000px) translate3d(${docX}px, ${docY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${docScale})`;
          docWrapperRef.current.style.opacity = String(docOpacity);
        }

        // Laser Scan Sweep on Document
        if (laserRef.current && laserBeamRef.current) {
          const laserSweep = easeOutCubic(range(p, 0.22, 0.65));
          const laserOpacity = range(p, 0.20, 0.26) * (1 - range(p, 0.66, 0.74));

          laserRef.current.style.top = `${laserSweep * 100}%`;
          laserRef.current.style.opacity = String(laserOpacity);

          laserBeamRef.current.style.height = `${laserSweep * 100}%`;
          laserBeamRef.current.style.opacity = String(laserOpacity * 0.6);

          if (laserCoordRef.current) {
            laserCoordRef.current.textContent = `SCAN_Y: ${(laserSweep * 100).toFixed(1)}%`;
          }
        }

        // Bounding Boxes on Document
        const boxList = [
          { ref: boxVendorRef, jsonRef: jsonVendorRef, rangeStart: 0.24, rangeEnd: 0.38, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
          { ref: boxMetaRef, jsonRef: jsonMetaRef, rangeStart: 0.36, rangeEnd: 0.50, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
          { ref: boxItemsRef, jsonRef: jsonItemsRef, rangeStart: 0.48, rangeEnd: 0.62, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
          { ref: boxTotalRef, jsonRef: jsonTotalRef, rangeStart: 0.58, rangeEnd: 0.72, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' }
        ];

        boxList.forEach(({ ref, jsonRef, rangeStart, rangeEnd, color, bg }) => {
          if (ref.current) {
            const active = easeOutCubic(range(p, rangeStart, rangeEnd));
            ref.current.style.borderColor = active > 0.1 ? color : 'rgba(255, 255, 255, 0.08)';
            ref.current.style.backgroundColor = active > 0.1 ? bg : 'transparent';
          }
          if (jsonRef.current) {
            const lit = p >= rangeStart + 0.04;
            jsonRef.current.style.opacity = lit ? '1' : '0.25';
            jsonRef.current.style.transform = lit ? 'translate3d(0, 0, 0)' : 'translate3d(6px, 0, 0)';
          }
        });

        // Verification Stamp on Document
        if (auditStampRef.current) {
          const stampProgress = easeOutCubic(range(p, 0.64, 0.76));
          const stampOpacity = range(p, 0.62, 0.70);
          const stampScale = lerp(1.7, 1.0, stampProgress);
          auditStampRef.current.style.opacity = String(stampOpacity);
          auditStampRef.current.style.transform = `scale(${stampScale}) rotate(-12deg)`;

          if (stampProgress > 0.95 && !sparksTriggered && docWrapperRef.current) {
            sparksTriggered = true;
            const r = docWrapperRef.current.getBoundingClientRect();
            triggerImpactSparks(r.left + r.width * 0.5, r.top + r.height * 0.5, '#34d399');
          } else if (stampProgress < 0.2) {
            sparksTriggered = false;
          }
        }

        // 2. CENTER ZONE: Workstation Diorama & Live Operator Hub
        if (workstationRef.current) {
          const wsParallaxY = lerp(0, -20, p) + exitY * 0.6;
          const wsScale = lerp(1.03, 1.0, easeOutCubic(range(p, 0, 0.35)));
          const mouseWsX = mouse.current.x * 8;
          const mouseWsY = mouse.current.y * 8;
          workstationRef.current.style.transform = `translate3d(${mouseWsX}px, ${wsParallaxY + mouseWsY}px, 0) scale(${wsScale})`;
        }

        const screenPower = easeOutCubic(range(p, 0.15, 0.40));
        if (monitorGlowRef.current) {
          monitorGlowRef.current.style.opacity = String(screenPower * 0.85);
        }
        if (monitorScreenRef.current) {
          monitorScreenRef.current.style.opacity = String(screenPower);
        }
        if (holoBeamRef.current) {
          const beamActive = range(p, 0.18, 0.70);
          holoBeamRef.current.style.opacity = String(beamActive * 0.45);
        }

        // SVG Laser Conduits (Document Boxes -> Operator Monitor)
        if (monitorScreenRef.current) {
          updateLaserConduit('conduitVendor', 'photonVendor', boxVendorRef.current, monitorScreenRef.current, range(p, 0.25, 0.45), '#34d399');
          updateLaserConduit('conduitMeta', 'photonMeta', boxMetaRef.current, monitorScreenRef.current, range(p, 0.38, 0.58), '#38bdf8');
          updateLaserConduit('conduitItems', 'photonItems', boxItemsRef.current, monitorScreenRef.current, range(p, 0.50, 0.70), '#fbbf24');
          updateLaserConduit('conduitTotal', 'photonTotal', boxTotalRef.current, monitorScreenRef.current, range(p, 0.60, 0.80), '#c084fc');
        }

        // 3. RIGHT ZONE: Telemetry JSON Terminal & Sheets Sync
        if (terminalRef.current) {
          const termInflow = easeOutCubic(range(p, 0.12, 0.38));
          const termX = lerp(40, 0, termInflow) - mouse.current.x * 12;
          const termY = lerp(20, 0, termInflow) + exitY * 0.7;
          const termOpacity = range(p, 0.10, 0.24) * (1 - range(p, 0.86, 0.98));

          terminalRef.current.style.transform = `translate3d(${termX}px, ${termY}px, 0)`;
          terminalRef.current.style.opacity = String(termOpacity);
        }

        if (terminalBadgeRef.current) {
          if (p < 0.20) {
            terminalBadgeRef.current.textContent = 'STANDBY · AWAITING INFLOW';
            terminalBadgeRef.current.className = 'font-mono text-[10px] sm:text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700';
          } else if (p < 0.68) {
            terminalBadgeRef.current.textContent = 'GROQ LPU · OPTICAL RECONCILIATION';
            terminalBadgeRef.current.className = 'font-mono text-[10px] sm:text-xs px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/35 animate-pulse';
          } else {
            terminalBadgeRef.current.textContent = 'RECONCILED · LEDGER COMMITTED';
            terminalBadgeRef.current.className = 'font-mono text-[10px] sm:text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/35';
          }
        }

        // Ejected Ledger Capsule
        if (ejectGroupRef.current) {
          const ejProgress = easeOutCubic(range(p, 0.74, 0.95));
          const ejOpacity = range(p, 0.72, 0.80) * (1 - range(p, 0.98, 1.0));
          const ejY = lerp(-20, 30, ejProgress);
          ejectGroupRef.current.style.opacity = String(ejOpacity);
          ejectGroupRef.current.style.transform = `translate3d(0, ${ejY}px, 0) scale(${lerp(0.95, 1.0, ejProgress)})`;
        }

        if (scrollIndicatorRef.current) {
          scrollIndicatorRef.current.style.opacity = String(1 - range(p, 0.78, 0.92));
        }
      }

      animId = requestAnimationFrame(frameLoop);
    };

    animId = requestAnimationFrame(frameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isMinimized]);

  const scrollToTable = () => {
    const tableEl = document.getElementById('invoices-table-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isMinimized) {
    return (
      <div className="w-full mb-4 p-4 rounded-3xl bg-[#0B0F19] border border-white/[0.08] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Hybrid Command Deck Minimized</p>
            <p className="text-xs font-mono text-slate-400">Option 3: Diorama & OCR Fusion Engine Online</p>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer"
        >
          <ChevronDown className="w-4 h-4 text-cyan-400" />
          <span>Expand Command Deck</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={rootRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[780px] h-[860px] sm:h-[900px] lg:h-[920px] xl:h-[950px] mb-8 select-none"
    >
      {/* COMMAND DECK GLASS HOUSING */}
      <div className="sticky top-4 w-full h-full rounded-3xl overflow-hidden bg-[#070A13]/95 border border-cyan-500/20 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.85)] flex flex-col justify-between">
        
        {/* Dynamic Starfield Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full pointer-events-none z-0"
        />

        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* TOP COMMAND STRIP */}
        <div className="relative z-30 px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#070A13]/80 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <div>
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide">
                HYBRID FUSION COMMAND DECK
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-mono text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                LPU_DUAL_STREAM_V3
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncEmailClick}
              disabled={isSyncingEmail}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-slate-300 transition-all cursor-pointer disabled:opacity-50"
              title="Poll IMAP Inbox"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSyncingEmail ? 'Scanning...' : 'Poll Inbox'}</span>
            </button>

            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-mono text-cyan-300 font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Upload PDF</span>
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Minimize command deck"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTER PANORAMIC STAGE: 3-ZONE FUSION */}
        <div ref={stageRef} className="relative flex-1 w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between z-10 overflow-hidden">
          
          {/* FULL-STAGE SVG CONDUIT OVERLAY (Document -> Workstation Monitor) */}
          <svg
            ref={svgConduitRef}
            className="absolute inset-0 size-full pointer-events-none z-25 overflow-visible"
            viewBox="0 0 1200 700"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="holoConeOpt3" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#818cf8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>

              <filter id="laserGlowOpt3" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Volumetric Hologram Light Cone projecting from monitor to invoice */}
            <polygon
              ref={holoBeamRef}
              points="600,320 330,170 330,520 600,430"
              fill="url(#holoConeOpt3)"
              style={{ opacity: 0 }}
            />

            {/* 4 Dynamic Laser Conduit Paths */}
            <path id="conduitVendor" fill="none" stroke="#34d399" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset="300" opacity="0" filter="url(#laserGlowOpt3)" />
            <circle id="photonVendor" r="4.5" fill="#6ee7b7" opacity="0" filter="url(#laserGlowOpt3)" />

            <path id="conduitMeta" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset="300" opacity="0" filter="url(#laserGlowOpt3)" />
            <circle id="photonMeta" r="4.5" fill="#bae6fd" opacity="0" filter="url(#laserGlowOpt3)" />

            <path id="conduitItems" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset="300" opacity="0" filter="url(#laserGlowOpt3)" />
            <circle id="photonItems" r="4.5" fill="#fde68a" opacity="0" filter="url(#laserGlowOpt3)" />

            <path id="conduitTotal" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset="300" opacity="0" filter="url(#laserGlowOpt3)" />
            <circle id="photonTotal" r="4.5" fill="#f5d0fe" opacity="0" filter="url(#laserGlowOpt3)" />
          </svg>

          {/* ======================================================== */}
          {/* ZONE 1 (LEFT): FLOATING INFLOW DOCUMENT & OPTICAL SCANNER */}
          {/* ======================================================== */}
          <div 
            ref={docWrapperRef}
            className="w-full lg:w-[32%] xl:w-[30%] max-w-[340px] lg:max-w-none z-20 pointer-events-none will-change-transform flex-shrink-0"
            style={{ opacity: 0 }}
          >
            <div className="relative rounded-2xl bg-[#0C101D]/90 backdrop-blur-xl border border-white/20 p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
              
              {/* Laser Scanning Line & Coordinate HUD */}
              <div
                ref={laserRef}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-20 pointer-events-none"
                style={{ top: '0%', opacity: 0 }}
              >
                <div className="absolute right-2 -top-4 font-mono text-[8px] text-emerald-400 font-bold bg-black/80 px-1 py-0.2 rounded border border-emerald-500/40">
                  <span ref={laserCoordRef}>SCAN_Y: 0%</span>
                </div>
              </div>

              {/* Laser Scan Light Sweep Curtain */}
              <div
                ref={laserBeamRef}
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-emerald-500/15 to-transparent pointer-events-none z-10"
                style={{ height: '0%', opacity: 0 }}
              />

              {/* Document Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">RAW INFLOW</span>
                    <span className="text-xs font-bold text-white tracking-tight">Invoice #9041</span>
                  </div>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  PDF 1.7
                </span>
              </div>

              {/* Bounding Box 1: Vendor */}
              <div 
                ref={boxVendorRef}
                className="p-2 rounded-lg border border-white/[0.08] mb-2.5 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">VENDOR_NAME</span>
                  <span className="text-[8px] font-mono text-emerald-400">99.8% CONF</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5">ACME Cloud Services, Inc.</p>
              </div>

              {/* Bounding Box 2: Meta */}
              <div 
                ref={boxMetaRef}
                className="p-2 rounded-lg border border-white/[0.08] mb-2.5 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">INVOICE_META</span>
                  <span className="text-[8px] font-mono text-cyan-400">OCR_MATCH</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300 mt-0.5">
                  <span className="font-mono text-[10px]">INV-2026-9041</span>
                  <span className="font-mono text-[10px]">OCT 27, 2026</span>
                </div>
              </div>

              {/* Bounding Box 3: Items */}
              <div 
                ref={boxItemsRef}
                className="p-2 rounded-lg border border-white/[0.08] mb-2.5 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">LINE_ITEMS</span>
                  <span className="text-[8px] font-mono text-amber-400">3 PARSED</span>
                </div>
                <p className="text-[10px] text-slate-300 font-mono mt-0.5">Dual Groq LPU Compute Cluster × 1 mo</p>
              </div>

              {/* Bounding Box 4: Grand Total */}
              <div 
                ref={boxTotalRef}
                className="p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] flex items-center justify-between transition-colors duration-150"
              >
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">RECONCILED_TOTAL</span>
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">$4,850.00 USD</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  LEDGER_READY
                </span>
              </div>

              {/* Verification Stamp Landing */}
              <div
                ref={auditStampRef}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                style={{ opacity: 0 }}
              >
                <div className="w-28 h-28 rounded-full border-4 border-emerald-400 bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                  <ShieldCheck className="w-7 h-7 text-emerald-400 mb-0.5" />
                  <span className="text-[9px] font-mono font-black text-emerald-300 tracking-wider">VERIFIED</span>
                  <span className="text-[7px] font-mono text-emerald-400">GROQ LPU CORE</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ZONE 2 (CENTER): WORKSTATION DIORAMA & OPERATOR HUB      */}
          {/* ======================================================== */}
          <div className="relative flex-1 h-full flex items-center justify-center px-2 z-15 overflow-hidden">
            <div 
              ref={workstationRef}
              className="relative aspect-[944/704] h-full max-h-[580px] w-full max-w-[620px] pointer-events-none will-change-transform flex items-center justify-center"
            >
              {/* Master Upscaled Workstation Illustration */}
              <picture className="w-full h-full flex items-center justify-center">
                <source srcSet="/landing/workstation_upscaled.webp" type="image/webp" />
                <img
                  src="/landing/workstation_upscaled.png"
                  alt="Upscaled Operator Workstation"
                  className="h-full w-full object-contain object-center drop-shadow-2xl"
                  loading="eager"
                />
              </picture>

              {/* Micro-Detail 1: Steam wisps rising from coffee cup */}
              <div
                className="absolute pointer-events-none z-14 flex items-center justify-center"
                style={{ left: '24.5%', top: '44%', width: '3%', height: '5%' }}
              >
                <div className="w-1 h-3 bg-white/20 rounded-full blur-[1px] animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="w-1 h-4 bg-white/15 rounded-full blur-[1.5px] animate-pulse -ml-0.5" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              </div>

              {/* Micro-Detail 2: Power cord active green LED on wall outlet */}
              <div
                className="absolute pointer-events-none z-14 flex items-center justify-center"
                style={{ left: '71.2%', top: '75%', width: '1.5%', height: '2%' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
              </div>

              {/* LIVE CYBERNETIC MONITOR DISPLAY (Anchored onto Illustrated Screen) */}
              <div
                ref={monitorScreenRef}
                className="absolute pointer-events-none z-15 will-change-transform flex items-center justify-center"
                style={{
                  left: '46.2%',
                  top: '40.5%',
                  width: '18%',
                  height: '19%',
                  opacity: 0
                }}
              >
                {/* Holographic glowing scan beam from the monitor */}
                <div
                  ref={monitorGlowRef}
                  className="absolute -inset-12 bg-gradient-to-tr from-cyan-500/25 via-indigo-500/20 to-transparent blur-2xl rounded-full pointer-events-none"
                  style={{ opacity: 0 }}
                />

                {/* Terminal Screen Inside Illustrated Monitor */}
                <div className="w-full h-full bg-[#070B14]/95 border border-cyan-400/60 rounded-sm p-1.5 font-mono text-[7px] sm:text-[8px] text-cyan-300 flex flex-col justify-between overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  <div className="flex items-center justify-between border-b border-cyan-500/30 pb-0.5">
                    <span className="flex items-center gap-1 font-bold text-white text-[7px]">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      GROQ_LPU_OCR
                    </span>
                    <span className="text-[7px] text-cyan-400 font-bold">240ms</span>
                  </div>
                  <div className="space-y-0.5 leading-tight text-[6px] sm:text-[7px] text-slate-300">
                    <p className="truncate text-emerald-300">&gt; INGESTING BUFFER...</p>
                    <p className="truncate text-cyan-200">&gt; PARSING INV-2026-9041</p>
                    <p className="truncate text-amber-200">&gt; MATCH: ACME CLOUD</p>
                    <p className="truncate text-purple-200 font-bold">&gt; LEDGER: $4,850.00 USD</p>
                  </div>
                  <div className="pt-0.5 border-t border-cyan-500/20 text-[6px] flex justify-between text-slate-400">
                    <span>RFC 2177</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ZONE 3 (RIGHT): TELEMETRY HUD & GOOGLE SHEETS LEDGER      */}
          {/* ======================================================== */}
          <div 
            ref={terminalRef}
            className="w-full lg:w-[32%] xl:w-[30%] max-w-[340px] lg:max-w-none z-20 pointer-events-none will-change-transform flex-shrink-0"
            style={{ opacity: 0 }}
          >
            <div className="relative rounded-2xl bg-[#0C101D]/90 backdrop-blur-xl border border-white/20 p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
              
              {/* Terminal Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    PARSED_JSON_STREAM
                  </span>
                </div>
                <span ref={terminalBadgeRef} className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  STANDBY
                </span>
              </div>

              {/* JSON Code View */}
              <div className="font-mono text-[10px] sm:text-[11px] leading-relaxed space-y-1 text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                <div className="text-slate-400">&#123;</div>
                <div ref={jsonVendorRef} className="pl-4 transition-all duration-150" style={{ opacity: 0.25 }}>
                  <span className="text-emerald-400">"vendor"</span>: <span className="text-emerald-200">"ACME Cloud Services"</span>,
                </div>
                <div ref={jsonMetaRef} className="pl-4 transition-all duration-150" style={{ opacity: 0.25 }}>
                  <span className="text-cyan-400">"invoiceNumber"</span>: <span className="text-cyan-200">"INV-2026-9041"</span>,
                </div>
                <div ref={jsonItemsRef} className="pl-4 transition-all duration-150" style={{ opacity: 0.25 }}>
                  <span className="text-amber-400">"lineItems"</span>: <span className="text-amber-200">[3 verified items]</span>,
                </div>
                <div ref={jsonTotalRef} className="pl-4 transition-all duration-150" style={{ opacity: 0.25 }}>
                  <span className="text-purple-400">"grandTotal"</span>: <span className="text-purple-200 font-bold">$4,850.00 USD</span>,
                </div>
                <div className="pl-4">
                  <span className="text-cyan-400">"syncLedger"</span>: <span className="text-emerald-300 font-bold">"Google Sheets (Active)"</span>
                </div>
                <div className="text-slate-400">&#125;</div>
              </div>

              {/* Hardware Gauges */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[9px] font-mono text-slate-400 block">LPU LATENCY</span>
                  <span ref={latencyRef} className="text-cyan-300 font-extrabold text-xs sm:text-sm tabular-nums">240ms</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[9px] font-mono text-slate-400 block">THROUGHPUT</span>
                  <span ref={lpuRateRef} className="text-emerald-400 font-extrabold text-xs sm:text-sm">750 T/s</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[9px] font-mono text-slate-400 block">DOCS SYNCED</span>
                  <span className="text-white font-extrabold text-xs sm:text-sm">{invoicesCount} Docs</span>
                </div>
              </div>

              {/* Ejected Ledger Capsule (ready to drop into table) */}
              <div
                ref={ejectGroupRef}
                className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-indigo-500/15 border border-emerald-500/40 backdrop-blur-md shadow-xl flex items-center justify-between pointer-events-auto"
                style={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">Google Sheets Ready</p>
                    <p className="text-[9px] font-mono text-emerald-300">INV-2026-9041 · $4,850.00</p>
                  </div>
                </div>

                <button
                  onClick={scrollToTable}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <span>Commit</span>
                  <ArrowDown className="w-3 h-3 animate-bounce" />
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM STATUS & SCAN TRACKER STRIP */}
        <div className="relative z-30 p-3 sm:p-4 border-t border-white/[0.08] bg-[#070A13]/80 backdrop-blur-md flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-semibold">Dual Groq LPU Core & Operator Bridge Online</span>
          </div>

          <div ref={scrollIndicatorRef} className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-slate-400 text-xs">Scroll to reconcile:</span>
            <button
              onClick={scrollToTable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-600 text-white font-bold shadow-md transition-all cursor-pointer text-xs"
            >
              <span>Scan Progress</span>
              <span ref={progressPercentRef} className="font-mono text-cyan-200 tabular-nums font-extrabold">
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
