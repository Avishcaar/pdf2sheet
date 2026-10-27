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
  FileText,
  Lock,
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
  const stageRef = useRef(null);
  const svgConduitRef = useRef(null);
  
  // Parallax Layer Refs
  const roomBgRef = useRef(null);
  const holoBeamRef = useRef(null);
  const monitorGlowRef = useRef(null);
  const monitorScreenRef = useRef(null);
  
  // 3 New Illustrated Cards
  const cardHandRef = useRef(null);      // illustration 2: Hand presenting invoice (Intake)
  const cardScanRef = useRef(null);      // illustration 1: Invoice with dollar coin + laser scan (Processing)
  const cardVerifiedRef = useRef(null);  // illustration 3: Reconciled invoice with green checkmark (Verified)

  const laserRef = useRef(null);
  const laserBeamRef = useRef(null);

  // SVG Data Conduit Paths & Photons
  const pathVendorRef = useRef(null);
  const pathTotalRef = useRef(null);
  const photonVendorRef = useRef(null);
  const photonTotalRef = useRef(null);

  // Bounding Boxes on Floating Invoice
  const boxVendorRef = useRef(null);
  const boxTotalRef = useRef(null);

  // Holographic HUD & Terminal
  const hudTerminalRef = useRef(null);
  const terminalBadgeRef = useRef(null);
  const lpuRateRef = useRef(null);
  const ejectGroupRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const progressPercentRef = useRef(null);
  const latencyRef = useRef(null);
  const downstreamBeamRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const reduced = useReducedMotion();

  // Mouse Parallax Ref for physical 3D depth
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const sparksRef = useRef([]);

  // 1. Mouse Move Listener for Multi-plane Parallax
  const handleMouseMove = (e) => {
    if (!rootRef.current) return;
    const cardEl = rootRef.current.querySelector('.sticky') || rootRef.current;
    const rect = cardEl.getBoundingClientRect();
    mouse.current.targetX = (e.clientX - rect.left) / rect.width - 0.5;
    mouse.current.targetY = (e.clientY - rect.top) / rect.height - 0.5;
  };

  const handleMouseLeave = () => {
    mouse.current.targetX = 0;
    mouse.current.targetY = 0;
  };

  // Spark burst trigger on verification impact
  const triggerImpactSparks = (originX, originY, color = '#34d399') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = originX - rect.left;
    const cy = originY - rect.top;

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.0;
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

  // 2. Cosmic Ambient Dust Canvas (selene-inspired background depth)
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

    // 80 floating motes
    let seed = 91;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const motes = Array.from({ length: 80 }, () => ({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.00025,
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

      // Faint constellation lines
      const maxDist = 90;
      for (let i = 0; i < motes.length; i++) {
        for (let j = i + 1; j < motes.length; j++) {
          const dx = (motes[i].x - motes[j].x) * width;
          const dy = (motes[i].y - motes[j].y) * height;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(motes[i].x * width, motes[i].y * height);
            ctx.lineTo(motes[j].x * width, motes[j].y * height);
            ctx.stroke();
          }
        }
      }

      // Render motes
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
        sp.vy += 0.12; // gravity
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

  // 3. Multi-Layer Parallax Physics Loop
  useEffect(() => {
    if (isMinimized) return;

    let animId;
    let targetP = 0;
    let smoothP = 0;
    let lastSmoothP = -1;
    let sparksTriggered = false;

    // SVG Conduit Path Generator with responsive scaling
    const updateConduit = (pathEl, photonEl, fromEl, toEl, progress, color) => {
      if (!pathEl || !fromEl || !toEl || !svgConduitRef.current) return;
      const svg = svgConduitRef.current;
      const sRect = svg.getBoundingClientRect();
      if (sRect.width === 0 || sRect.height === 0) return;

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      const scaleX = 944 / sRect.width;
      const scaleY = 704 / sRect.height;

      const x1 = (fRect.right - sRect.left) * scaleX;
      const y1 = (fRect.top + fRect.height / 2 - sRect.top) * scaleY;
      const x2 = (tRect.left - sRect.left) * scaleX;
      const y2 = (tRect.top + tRect.height / 2 - sRect.top) * scaleY;

      const dx = Math.max(30, (x2 - x1) * 0.5);
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      pathEl.setAttribute('d', d);

      const len = pathEl.getTotalLength ? pathEl.getTotalLength() : 250;
      pathEl.style.strokeDasharray = `${len}`;

      const k = easeOutCubic(progress);
      pathEl.style.strokeDashoffset = `${len * (1 - k)}`;
      pathEl.style.opacity = String(range(progress, 0.05, 0.25) * (1 - range(progress, 0.90, 1.0)));

      if (photonEl && pathEl.getPointAtLength && k > 0.01 && k < 0.99) {
        const pt = pathEl.getPointAtLength(len * k);
        photonEl.setAttribute('cx', String(pt.x));
        photonEl.setAttribute('cy', String(pt.y));
        photonEl.setAttribute('opacity', '1');
      } else if (photonEl) {
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
      smoothP = lerp(smoothP, targetP, 0.10);
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

        const exit = easeOutCubic(range(p, 0.78, 1.0));
        const exitY = -exit * 70;

        // 1. Master Workstation Background (Desk, Operator, Monitor & Room)
        if (roomBgRef.current) {
          const bgParallaxY = lerp(0, -25, p) + exitY * 0.5;
          const bgScale = lerp(1.04, 1.0, easeOutCubic(range(p, 0, 0.4)));
          const mouseBgX = mouse.current.x * 6;
          const mouseBgY = mouse.current.y * 6;
          roomBgRef.current.style.transform = `translate3d(${mouseBgX}px, ${bgParallaxY + mouseBgY}px, 0) scale(${bgScale})`;
        }

        // 2. Active Computer Monitor Screen & Hologram Light Beam Cone
        const screenPower = easeOutCubic(range(p, 0.18, 0.45));
        if (monitorGlowRef.current) {
          monitorGlowRef.current.style.opacity = String(screenPower * 0.85);
        }
        if (monitorScreenRef.current) {
          monitorScreenRef.current.style.opacity = String(screenPower);
        }
        if (holoBeamRef.current) {
          const beamActive = range(p, 0.22, 0.75);
          holoBeamRef.current.style.opacity = String(beamActive * 0.55);
        }

        // 3. Illustration 2: Hand presenting Raw Invoice (card_doc_2)
        // Floats in from the left on scroll start (p in 0.04 to 0.45)
        if (cardHandRef.current) {
          const handInflow = easeOutCubic(range(p, 0.04, 0.36));
          const handX = lerp(-80, 0, handInflow) + mouse.current.x * 24;
          const handY = lerp(-30, 0, handInflow) + Math.sin(time * 0.002) * 6 + exitY * 0.8;
          const handRot = lerp(-14, -4, handInflow) + mouse.current.x * 8;
          const handScale = lerp(0.86, 1.0, handInflow);
          const handOpacity = range(p, 0.03, 0.16) * (1 - range(p, 0.78, 0.94));

          cardHandRef.current.style.transform = `perspective(1000px) translate3d(${handX}px, ${handY}px, 0) rotate(${handRot}deg) scale(${handScale})`;
          cardHandRef.current.style.opacity = String(handOpacity);
        }

        // 4. Illustration 1: Invoice with Dollar Coin & Optical Laser Scan (card_doc_1)
        // Floats into center-left directly in path of monitor beam (p in 0.16 to 0.70)
        if (cardScanRef.current) {
          const scanInflow = easeOutCubic(range(p, 0.16, 0.42));
          const scanX = lerp(-50, 0, scanInflow) + mouse.current.x * 18;
          const scanY = lerp(25, 0, scanInflow) + Math.sin(time * 0.0022 + 1.0) * 5 + exitY * 0.82;
          const scanRot = lerp(12, 3, scanInflow) - mouse.current.y * 8;
          const scanScale = lerp(0.88, 1.0, scanInflow);
          const scanOpacity = range(p, 0.12, 0.24) * (1 - range(p, 0.82, 0.96));

          cardScanRef.current.style.transform = `perspective(1000px) translate3d(${scanX}px, ${scanY}px, 0) rotateX(${scanRot}deg) scale(${scanScale})`;
          cardScanRef.current.style.opacity = String(scanOpacity);
        }

        // Laser Scan Bar on cardScanRef
        if (laserRef.current && laserBeamRef.current) {
          const laserSweep = easeOutCubic(range(p, 0.26, 0.66));
          const laserOpacity = range(p, 0.24, 0.30) * (1 - range(p, 0.66, 0.74));

          laserRef.current.style.top = `${laserSweep * 100}%`;
          laserRef.current.style.opacity = String(laserOpacity);

          laserBeamRef.current.style.height = `${laserSweep * 100}%`;
          laserBeamRef.current.style.opacity = String(laserOpacity * 0.65);
        }

        // Bounding Boxes on cardScanRef
        if (boxVendorRef.current) {
          const vA = easeOutCubic(range(p, 0.28, 0.44));
          boxVendorRef.current.style.borderColor = vA > 0.1 ? '#34d399' : 'rgba(255, 255, 255, 0.1)';
          boxVendorRef.current.style.backgroundColor = vA > 0.1 ? 'rgba(52, 211, 153, 0.12)' : 'transparent';
        }
        if (boxTotalRef.current) {
          const tA = easeOutCubic(range(p, 0.48, 0.64));
          boxTotalRef.current.style.borderColor = tA > 0.1 ? '#c084fc' : 'rgba(255, 255, 255, 0.1)';
          boxTotalRef.current.style.backgroundColor = tA > 0.1 ? 'rgba(192, 132, 252, 0.14)' : 'transparent';
        }

        // SVG Data Conduits (cardScanRef -> Monitor Screen)
        const progVendor = range(p, 0.30, 0.52);
        updateConduit(pathVendorRef.current, photonVendorRef.current, boxVendorRef.current, monitorScreenRef.current, progVendor, '#34d399');

        const progTotal = range(p, 0.50, 0.70);
        updateConduit(pathTotalRef.current, photonTotalRef.current, boxTotalRef.current, monitorScreenRef.current, progTotal, '#c084fc');

        // 5. Illustration 3: Verified Invoice with Green Checkmark (card_doc_3)
        // Floats into top-right on reconciliation (p in 0.44 to 0.90)
        if (cardVerifiedRef.current) {
          const verInflow = easeOutCubic(range(p, 0.44, 0.68));
          const verBounce = Math.sin(verInflow * Math.PI) * 6;
          const verX = lerp(70, 0, verInflow) + mouse.current.x * 16;
          const verY = lerp(-25, 0, verInflow) + verBounce + Math.sin(time * 0.0025 + 1.8) * 5 + exitY * 0.85;
          const verRot = lerp(14, 5, verInflow) - mouse.current.x * 6;
          const verScale = lerp(0.85, 1.0, verInflow);
          const verOpacity = range(p, 0.40, 0.52) * (1 - range(p, 0.84, 0.98));

          cardVerifiedRef.current.style.transform = `perspective(1000px) translate3d(${verX}px, ${verY}px, 0) rotate(${verRot}deg) scale(${verScale})`;
          cardVerifiedRef.current.style.opacity = String(verOpacity);

          if (verInflow > 0.92 && !sparksTriggered && cardVerifiedRef.current) {
            sparksTriggered = true;
            const r = cardVerifiedRef.current.getBoundingClientRect();
            triggerImpactSparks(r.left + r.width * 0.7, r.top + r.height * 0.7, '#34d399');
          } else if (verInflow < 0.2) {
            sparksTriggered = false;
          }
        }

        // 6. Holographic HUD Telemetry Window (Right Side)
        if (hudTerminalRef.current) {
          const hudIn = easeOutCubic(range(p, 0.16, 0.42));
          const hudX = lerp(50, 0, hudIn) - mouse.current.x * 10;
          const hudY = lerp(20, 0, hudIn) + exitY * 0.7;
          const hudOpacity = range(p, 0.14, 0.28) * (1 - range(p, 0.82, 0.96));

          hudTerminalRef.current.style.transform = `translate3d(${hudX}px, ${hudY}px, 0)`;
          hudTerminalRef.current.style.opacity = String(hudOpacity);

          // Reveal JSON Lines progressively
          const jsonLines = hudTerminalRef.current.querySelectorAll('.hud-json-line');
          jsonLines.forEach((line, idx) => {
            const threshold = 0.24 + idx * 0.08;
            if (p >= threshold) {
              line.style.opacity = '1';
              line.style.transform = 'translate3d(0, 0, 0)';
            } else {
              line.style.opacity = '0.2';
              line.style.transform = 'translate3d(10px, 0, 0)';
            }
          });
        }

        // Terminal Badge
        if (terminalBadgeRef.current) {
          if (p < 0.20) {
            terminalBadgeRef.current.textContent = 'STANDBY · AWAITING INFLOW';
            terminalBadgeRef.current.className = 'font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700';
          } else if (p < 0.65) {
            terminalBadgeRef.current.textContent = 'GROQ LPU · OPTICAL RECONCILIATION';
            terminalBadgeRef.current.className = 'font-mono text-xs px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/35 animate-pulse';
          } else {
            terminalBadgeRef.current.textContent = 'RECONCILED · LEDGER COMMITTED';
            terminalBadgeRef.current.className = 'font-mono text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/35';
          }
        }

        // 7. Ejection Group (Committed Ledger Row ready to drop into table)
        if (ejectGroupRef.current) {
          const ejProgress = easeOutCubic(range(p, 0.70, 0.94));
          const ejOpacity = range(p, 0.68, 0.76) * (1 - range(p, 0.96, 1.0));
          const ejY = lerp(-25, 45, ejProgress);
          ejectGroupRef.current.style.opacity = String(ejOpacity);
          ejectGroupRef.current.style.transform = `translate3d(0, ${ejY}px, 0) scale(${lerp(0.96, 1.0, ejProgress)})`;
        }

        // 8. Downstream Handover Beam to Table (p > 0.82)
        if (downstreamBeamRef.current) {
          const beamOp = range(p, 0.82, 0.92) * (1 - range(p, 0.97, 1.0));
          downstreamBeamRef.current.style.opacity = String(beamOp);
        }

        // 9. Scroll indicator fade out
        if (scrollIndicatorRef.current) {
          scrollIndicatorRef.current.style.opacity = String(1 - range(p, 0.72, 0.88));
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
      <div className="w-full mb-4 p-4 rounded-3xl bg-[#0B0F19] border border-white/[0.08] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Parallax Workstation Minimized</p>
            <p className="text-xs font-mono text-slate-400">RFC 2177 Push Active · Dual Groq LPU Engine Online</p>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-semibold transition-all cursor-pointer"
        >
          <ChevronDown className="w-4 h-4 text-indigo-400" />
          <span>Restore Workstation</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={rootRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full mb-8 select-none"
      style={{ height: '240vh' }}
    >
      {/* 3D PARALLAX CONTAINER */}
      <div className="sticky top-2 sm:top-4 w-full h-[calc(100vh-2.5rem)] min-h-[640px] max-h-[860px] rounded-3xl overflow-hidden bg-[#070A13]/95 border border-indigo-500/20 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.85)] flex flex-col justify-between">
        
        {/* Dynamic Starfield Canvas Background (Layer 0) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full pointer-events-none z-0"
        />

        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Control Bar */}
        <div className="relative z-30 px-6 py-4 border-b border-white/[0.08] bg-[#070A13]/80 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide">
                AUTOMATED WORKSTATION PIPELINE
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-mono text-emerald-400/80 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                LPU_PARALLAX_ONLINE
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
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isSyncingEmail ? 'Scanning...' : 'Sync Email'}</span>
            </button>

            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-mono text-indigo-300 font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Direct Ingest</span>
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Minimize pipeline hero"
            >
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Center Stage: The Multi-Layer Parallax Workstation */}
        <div className="relative flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-4 z-10 overflow-hidden">
          
          {/* STAGE CONTAINER (Strictly registered 944:704 aspect ratio box) */}
          <div ref={stageRef} className="relative aspect-[944/704] h-full max-h-full max-w-full flex items-center justify-center">
            
            {/* SVG OVERLAY: Volumetric Hologram Light Cone & Fiber Data Streams */}
            <svg
              ref={svgConduitRef}
              className="absolute inset-0 size-full pointer-events-none z-22 overflow-visible"
              viewBox="0 0 944 704"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="holoConeGrad" x1="100%" y1="50%" x2="0%" y2="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#818cf8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>

                <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Volumetric Hologram Light Cone projecting from monitor to floating scan invoice */}
              <polygon
                ref={holoBeamRef}
                points="450,290 200,210 200,510 450,380"
                fill="url(#holoConeGrad)"
                style={{ opacity: 0 }}
              />

              {/* Conduit 1: Vendor */}
              <path ref={pathVendorRef} fill="none" stroke="#34d399" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset="300" opacity="0" filter="url(#laserGlow)" />
              <circle ref={photonVendorRef} r="4.5" fill="#6ee7b7" opacity="0" filter="url(#laserGlow)" />

              {/* Conduit 2: Total */}
              <path ref={pathTotalRef} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset="300" opacity="0" filter="url(#laserGlow)" />
              <circle ref={photonTotalRef} r="4.5" fill="#f5d0fe" opacity="0" filter="url(#laserGlow)" />
            </svg>

            {/* LAYER 1: Master Upscaled Workstation Diorama (Operator, Desk, Monitor & Room) */}
            <div
              ref={roomBgRef}
              className="absolute inset-0 size-full flex items-center justify-center pointer-events-none will-change-transform z-10"
            >
              <picture className="w-full h-full flex items-center justify-center">
                <source srcSet="/landing/workstation_upscaled.webp" type="image/webp" />
                <img
                  src="/landing/workstation_upscaled.png"
                  alt="Desktop Workspace"
                  className="h-full w-full object-contain object-center drop-shadow-2xl"
                  loading="eager"
                />
              </picture>

              {/* Micro-Detail 1: Steam wisps rising from purple coffee cup */}
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

              {/* LAYER 2: Live Cybernetic Monitor Display (Anchored right onto the illustrated monitor!) */}
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
                  className="absolute -inset-16 bg-gradient-to-tr from-cyan-500/25 via-indigo-500/20 to-transparent blur-2xl rounded-full pointer-events-none"
                  style={{ opacity: 0 }}
                />

                {/* Terminal Code Screen inside Monitor */}
                <div className="w-full h-full bg-[#070B14]/95 border border-cyan-400/60 rounded-sm p-1.5 font-mono text-[8px] sm:text-[9px] text-cyan-300 flex flex-col justify-between overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                  <div className="flex items-center justify-between border-b border-cyan-500/30 pb-0.5">
                    <span className="flex items-center gap-1 font-bold text-white text-[7px] sm:text-[8px]">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      GROQ_LPU_OCR
                    </span>
                    <span className="text-[7px] text-cyan-400 font-bold">240ms</span>
                  </div>
                  <div className="space-y-0.5 leading-tight text-[7px] sm:text-[8px] text-slate-300">
                    <p className="truncate text-emerald-300">&gt; INGESTING BUFFER...</p>
                    <p className="truncate text-cyan-200">&gt; PARSING INV-2026-9041</p>
                    <p className="truncate text-amber-200">&gt; MATCH: ACME CLOUD</p>
                    <p className="truncate text-purple-200 font-bold">&gt; LEDGER: $4,850.00 USD</p>
                  </div>
                  <div className="pt-0.5 border-t border-cyan-500/20 text-[6px] sm:text-[7px] flex justify-between text-slate-400">
                    <span>RFC 2177</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 3 (ILLUSTRATION 2): Hand Presenting Incoming Invoice (card_doc_2) */}
            <div
              ref={cardHandRef}
              className="absolute left-[3%] sm:left-[5%] top-[12%] sm:top-[14%] w-36 sm:w-44 lg:w-52 z-26 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl opacity-60" />
                <picture className="relative block w-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]">
                  <source srcSet="/landing/card_doc_2.webp" type="image/webp" />
                  <img
                    src="/landing/card_doc_2.png"
                    alt="Intake Invoice Presentation"
                    className="w-full h-auto object-contain"
                    loading="eager"
                  />
                </picture>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0C101D]/90 border border-blue-400/40 text-[9px] font-mono text-blue-300 font-bold whitespace-nowrap shadow-lg">
                  01 · INTAKE
                </div>
              </div>
            </div>

            {/* LAYER 4 (ILLUSTRATION 1): Active Optical Scanning & Valuation (card_doc_1) */}
            <div
              ref={cardScanRef}
              className="absolute left-[14%] sm:left-[17%] top-[26%] sm:top-[28%] w-48 sm:w-56 lg:w-64 z-28 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="relative rounded-2xl bg-[#0C101D]/92 backdrop-blur-xl border border-white/20 p-3 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
                {/* Illustration 1 Graphic with Laser Scan */}
                <div className="relative w-full h-24 sm:h-28 mb-2 flex items-center justify-center overflow-hidden rounded-xl bg-black/40">
                  <picture className="h-full drop-shadow-md">
                    <source srcSet="/landing/card_doc_1.webp" type="image/webp" />
                    <img
                      src="/landing/card_doc_1.png"
                      alt="Invoice Optical Scanning"
                      className="h-full w-auto object-contain"
                      loading="eager"
                    />
                  </picture>

                  {/* Laser Scanning Line & Beam */}
                  <div
                    ref={laserBeamRef}
                    className="absolute inset-x-0 top-0 bg-gradient-to-b from-cyan-500/35 via-indigo-500/15 to-transparent pointer-events-none"
                    style={{ height: '0%', opacity: 0 }}
                  />
                  <div
                    ref={laserRef}
                    className="absolute inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_#22d3ee] pointer-events-none flex items-center justify-between px-2"
                    style={{ top: '0%', opacity: 0 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_10px_#34d399] animate-ping" />
                  </div>
                </div>

                {/* Bounding Boxes on Illustration 1 */}
                <div className="space-y-1.5 font-mono text-[10px] sm:text-[11px]">
                  <div
                    ref={boxVendorRef}
                    className="p-1 rounded border border-dashed border-white/10 transition-colors flex justify-between items-center"
                  >
                    <span className="text-slate-400 text-[8px] sm:text-[9px]">VENDOR</span>
                    <span className="font-bold text-white text-[9px] sm:text-[10px] truncate">Acme Cloud Infra</span>
                  </div>
                  <div
                    ref={boxTotalRef}
                    className="p-1 rounded border border-dashed border-white/10 transition-colors flex justify-between items-center"
                  >
                    <span className="text-slate-400 text-[8px] sm:text-[9px]">TOTAL</span>
                    <span className="font-extrabold text-emerald-400 text-xs sm:text-sm">$4,850.00 USD</span>
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-white/10 flex justify-between items-center text-[8px] sm:text-[9px] font-mono text-cyan-300">
                  <span>02 · GROQ LPU SCAN</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200">240ms</span>
                </div>
              </div>
            </div>

            {/* LAYER 5 (ILLUSTRATION 3): Reconciled Invoice with Green Checkmark (card_doc_3) */}
            <div
              ref={cardVerifiedRef}
              className="absolute right-[8%] sm:right-[12%] top-[14%] sm:top-[16%] w-40 sm:w-48 lg:w-52 z-27 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 rounded-full blur-xl opacity-75 animate-pulse" />
                <div className="relative rounded-2xl bg-[#0C101D]/92 backdrop-blur-xl border border-emerald-500/40 p-3 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
                  <picture className="block w-full h-24 sm:h-28 mb-2 flex items-center justify-center drop-shadow-[0_15px_25px_rgba(52,211,153,0.35)]">
                    <source srcSet="/landing/card_doc_3.webp" type="image/webp" />
                    <img
                      src="/landing/card_doc_3.png"
                      alt="Verified Invoice Row"
                      className="h-full w-auto object-contain"
                      loading="eager"
                    />
                  </picture>
                  <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px]">
                    <span className="text-emerald-400 font-bold">03 · RECONCILED</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40">
                      100% MATCH
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 6: Holographic Extraction HUD Terminal (Right-Center) */}
            <div
              ref={hudTerminalRef}
              className="absolute right-2 sm:right-6 bottom-[10%] sm:bottom-[12%] w-68 sm:w-76 lg:w-84 z-30 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="rounded-2xl border border-white/[0.12] bg-[#0A0D18]/95 backdrop-blur-xl shadow-2xl p-3.5 sm:p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-wider">SHEETS_DISPATCH</span>
                  </div>
                  <span ref={terminalBadgeRef} className="font-mono text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    STANDBY
                  </span>
                </div>

                {/* Progressively Revealed JSON Payload */}
                <div className="space-y-1 text-[10px] sm:text-[11px] leading-relaxed text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-400">&#123;</div>
                  <div className="hud-json-line pl-3 transition-all duration-200" style={{ opacity: 0.2 }}>
                    <span className="text-emerald-400">"vendor"</span>: <span className="text-emerald-200">"Acme Cloud Infra"</span>,
                  </div>
                  <div className="hud-json-line pl-3 transition-all duration-200" style={{ opacity: 0.2 }}>
                    <span className="text-cyan-400">"invoiceNo"</span>: <span className="text-cyan-200">"INV-2026-9041"</span>,
                  </div>
                  <div className="hud-json-line pl-3 transition-all duration-200" style={{ opacity: 0.2 }}>
                    <span className="text-purple-400">"amount"</span>: <span className="text-purple-200 font-bold">$4,850.00 USD</span>,
                  </div>
                  <div className="hud-json-line pl-3 transition-all duration-200" style={{ opacity: 0.2 }}>
                    <span className="text-indigo-400">"syncLedger"</span>: <span className="text-emerald-300 font-bold">"Google Sheets"</span>
                  </div>
                  <div className="text-slate-400">&#125;</div>
                </div>

                {/* Telemetry Hardware Stats */}
                <div className="mt-2.5 pt-2 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400 block text-[9px]">LPU</span>
                    <span ref={latencyRef} className="text-cyan-300 font-extrabold text-xs tabular-nums">240ms</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400 block text-[9px]">RATE</span>
                    <span ref={lpuRateRef} className="text-emerald-400 font-extrabold text-xs">750 T/s</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400 block text-[9px]">DOCS</span>
                    <span className="text-white font-extrabold text-xs">{invoicesCount} Docs</span>
                  </div>
                </div>

                {/* Ejected Data Capsule */}
                <div
                  ref={ejectGroupRef}
                  className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-indigo-500/20 border border-emerald-500/40 backdrop-blur-md shadow-xl flex items-center justify-between"
                  style={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <p className="text-[10px] font-bold text-white leading-none">Sheets Ready</p>
                      <p className="text-[8px] font-mono text-emerald-300 leading-none mt-0.5">INV-9041 Committed</p>
                    </div>
                  </div>
                  <button
                    onClick={scrollToTable}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-extrabold transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <span>Commit</span>
                    <ArrowDown className="w-3 h-3 animate-bounce" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Status Ribbon & Interactive Scroll Prompt */}
        <div className="relative z-30 px-6 py-3.5 border-t border-white/[0.08] bg-[#070A13]/80 backdrop-blur-md flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-semibold">Dual Groq LPU Workstation Synchronized</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">Real-Time Optical Reconciliation</span>
          </div>

          <div
            ref={scrollIndicatorRef}
            className="flex items-center gap-3"
          >
            <span className="hidden sm:inline text-slate-400 text-xs">Scroll to reconcile:</span>
            <button
              onClick={scrollToTable}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold shadow-md transition-all cursor-pointer text-xs"
            >
              <span>Scan Progress</span>
              <span ref={progressPercentRef} className="font-mono text-indigo-200 tabular-nums font-extrabold">
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
