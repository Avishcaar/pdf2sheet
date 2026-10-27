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
import { clamp, easeOutCubic, lerp, range } from '../../../utils/math';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export default function Option2ParallaxDiorama({ 
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
  const invoice1Ref = useRef(null);
  const invoice2Ref = useRef(null);
  const laserRef = useRef(null);
  const laserBeamRef = useRef(null);
  const auditStampRef = useRef(null);

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
    const rect = rootRef.current.getBoundingClientRect();
    mouse.current.targetX = (e.clientX - rect.left) / rect.width - 0.5;
    mouse.current.targetY = (e.clientY - rect.top) / rect.height - 0.5;
  };

  const handleMouseLeave = () => {
    mouse.current.targetX = 0;
    mouse.current.targetY = 0;
  };

  // 2. Interactive Canvas Background (Floating Motes & Energy Sparks)
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

    let seed = 137;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const motes = Array.from({ length: 80 }, () => ({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.0003,
      vy: -0.0002 - rand() * 0.0004,
      r: 1.0 + rand() * 1.8,
      alpha: 0.2 + rand() * 0.6,
      hue: rand() > 0.6 ? 217 : rand() > 0.3 ? 160 : 270
    }));

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Draw faint constellation lines
      const maxDist = 90;
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

      // Draw motes
      for (const m of motes) {
        if (!reduced) {
          m.x += m.vx;
          m.y += m.vy;
          if (m.y < 0) m.y = 1;
          if (m.x < 0) m.x = 1;
          if (m.x > 1) m.x = 0;
        }

        ctx.fillStyle = m.hue === 160 
          ? `rgba(52, 211, 153, ${m.alpha})` 
          : m.hue === 217 
          ? `rgba(56, 189, 248, ${m.alpha})` 
          : `rgba(168, 85, 247, ${m.alpha})`;

        ctx.beginPath();
        ctx.arc(m.x * width, m.y * height, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Dynamic Spark Bursts
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt * 60;
        s.y += s.vy * dt * 60;
        s.life -= dt * 2.2;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
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
  }, [isMinimized, reduced]);

  // Helper to trigger spark explosion
  const triggerImpactSparks = (x, y, color) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const cRect = canvas.getBoundingClientRect();
    const spawnX = x - cRect.left;
    const spawnY = y - cRect.top;

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.2;
      sparksRef.current.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.4 + Math.random() * 2.2,
        color: color,
        life: 1.0
      });
    }
  };

  // 3. Multi-Layer Parallax Scroll Choreography Frame Loop
  useEffect(() => {
    if (isMinimized) return;
    const root = rootRef.current;
    if (!root) return;

    let animId;
    let smoothP = 0;
    let targetP = 0;
    let lastSmoothP = -1;
    let sparksTriggered = false;

    // Helper for SVG conduit inking & photon travel
    const updateConduit = (pathEl, photonEl, fromEl, toEl, progress, color) => {
      if (!pathEl || !fromEl || !toEl || !svgConduitRef.current) return;
      const svg = svgConduitRef.current;
      const sRect = svg.getBoundingClientRect();
      if (sRect.width === 0) return;

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
      smoothP = lerp(smoothP, targetP, 0.14);
      if (Math.abs(smoothP - targetP) < 0.0001) smoothP = targetP;

      // Mouse Parallax Physics
      mouse.current.x = lerp(mouse.current.x, mouse.current.targetX, 0.08);
      mouse.current.y = lerp(mouse.current.y, mouse.current.targetY, 0.08);

      const p = smoothP;

      if (Math.abs(p - lastSmoothP) > 0.0001 || Math.abs(mouse.current.x - mouse.current.targetX) > 0.001) {
        lastSmoothP = p;

        // 1. Telemetry Counters
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

        // 2. Master Workstation Diorama (Upscaled Operator, Desk, Monitor & Room)
        // Moves smoothly with subtle depth and 3D parallax
        if (roomBgRef.current) {
          const bgParallaxY = lerp(0, -25, p) + exitY * 0.5;
          const bgScale = lerp(1.04, 1.0, easeOutCubic(range(p, 0, 0.4)));
          const mouseBgX = mouse.current.x * 6;
          const mouseBgY = mouse.current.y * 6;
          roomBgRef.current.style.transform = `translate3d(${mouseBgX}px, ${bgParallaxY + mouseBgY}px, 0) scale(${bgScale})`;
        }

        // 3. Active Computer Monitor Screen & Hologram Light Beam Cone
        const screenPower = easeOutCubic(range(p, 0.18, 0.45));
        if (monitorGlowRef.current) {
          monitorGlowRef.current.style.opacity = String(screenPower * 0.85);
        }
        if (monitorScreenRef.current) {
          monitorScreenRef.current.style.opacity = String(screenPower);
        }
        if (holoBeamRef.current) {
          // Projects outward from monitor towards floating invoice
          const beamActive = range(p, 0.22, 0.75);
          holoBeamRef.current.style.opacity = String(beamActive * 0.55);
        }

        // 5. Layer 4: Floating Invoice 1 (Raw Inflow Document with 3D Perspective Tilt)
        if (invoice1Ref.current) {
          const inv1Inflow = easeOutCubic(range(p, 0.08, 0.38));
          const inv1X = lerp(-80, 0, inv1Inflow) + mouse.current.x * 24;
          const inv1Y = lerp(-50, 0, inv1Inflow) + Math.sin(time * 0.002) * 6 + exitY * 0.8;
          const inv1Scale = lerp(0.88, 1.0, inv1Inflow);
          const inv1RotX = lerp(14, 6, inv1Inflow) - mouse.current.y * 10;
          const inv1RotY = lerp(-20, -10, inv1Inflow) + mouse.current.x * 12;
          const inv1Opacity = range(p, 0.05, 0.20) * (1 - range(p, 0.82, 0.96));

          invoice1Ref.current.style.transform = `perspective(1000px) translate3d(${inv1X}px, ${inv1Y}px, 0) rotateX(${inv1RotX}deg) rotateY(${inv1RotY}deg) scale(${inv1Scale})`;
          invoice1Ref.current.style.opacity = String(inv1Opacity);
        }

        // Laser Scan Bar on Floating Invoice 1
        if (laserRef.current && laserBeamRef.current) {
          const laserSweep = easeOutCubic(range(p, 0.28, 0.68));
          const laserOpacity = range(p, 0.26, 0.32) * (1 - range(p, 0.68, 0.76));

          laserRef.current.style.top = `${laserSweep * 100}%`;
          laserRef.current.style.opacity = String(laserOpacity);

          laserBeamRef.current.style.height = `${laserSweep * 100}%`;
          laserBeamRef.current.style.opacity = String(laserOpacity * 0.65);
        }

        // Bounding Boxes on Floating Invoice
        if (boxVendorRef.current) {
          const vA = easeOutCubic(range(p, 0.30, 0.44));
          boxVendorRef.current.style.borderColor = vA > 0.1 ? '#34d399' : 'rgba(255, 255, 255, 0.1)';
          boxVendorRef.current.style.backgroundColor = vA > 0.1 ? 'rgba(52, 211, 153, 0.12)' : 'transparent';
        }
        if (boxTotalRef.current) {
          const tA = easeOutCubic(range(p, 0.50, 0.64));
          boxTotalRef.current.style.borderColor = tA > 0.1 ? '#c084fc' : 'rgba(255, 255, 255, 0.1)';
          boxTotalRef.current.style.backgroundColor = tA > 0.1 ? 'rgba(192, 132, 252, 0.14)' : 'transparent';
        }

        // SVG Data Conduits (Floating Invoice -> Monitor Screen)
        const progVendor = range(p, 0.32, 0.52);
        updateConduit(pathVendorRef.current, photonVendorRef.current, boxVendorRef.current, monitorScreenRef.current, progVendor, '#34d399');

        const progTotal = range(p, 0.52, 0.72);
        updateConduit(pathTotalRef.current, photonTotalRef.current, boxTotalRef.current, monitorScreenRef.current, progTotal, '#c084fc');

        // 6. Layer 5: Floating Invoice 2 (Verified Document with Green Checkmark)
        if (invoice2Ref.current) {
          const inv2Inflow = easeOutCubic(range(p, 0.42, 0.70));
          const inv2X = lerp(70, 0, inv2Inflow) + mouse.current.x * 18;
          const inv2Y = lerp(-30, 0, inv2Inflow) + Math.sin(time * 0.0025 + 1.2) * 6 + exitY * 0.85;
          const inv2Scale = lerp(0.85, 1.0, inv2Inflow);
          const inv2Rot = lerp(16, 8, inv2Inflow) - mouse.current.x * 6;
          const inv2Opacity = range(p, 0.40, 0.52) * (1 - range(p, 0.82, 0.96));

          invoice2Ref.current.style.transform = `translate3d(${inv2X}px, ${inv2Y}px, 0) rotate(${inv2Rot}deg) scale(${inv2Scale})`;
          invoice2Ref.current.style.opacity = String(inv2Opacity);
        }

        // 7. Audit Verification Stamp on Scanned Invoice
        if (auditStampRef.current) {
          const stampProgress = easeOutCubic(range(p, 0.58, 0.72));
          const stampOpacity = range(p, 0.56, 0.64);
          const stampScale = lerp(1.7, 1.0, stampProgress);
          auditStampRef.current.style.opacity = String(stampOpacity);
          auditStampRef.current.style.transform = `scale(${stampScale}) rotate(-14deg)`;

          if (stampProgress > 0.95 && !sparksTriggered && invoice1Ref.current) {
            sparksTriggered = true;
            const r = invoice1Ref.current.getBoundingClientRect();
            triggerImpactSparks(r.left + r.width / 2, r.top + r.height / 2, '#34d399');
          } else if (stampProgress < 0.2) {
            sparksTriggered = false;
          }
        }

        // 8. Holographic HUD Telemetry Window (Right Side)
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

        // 9. Ejection Group (Committed Ledger Row ready to drop into table)
        if (ejectGroupRef.current) {
          const ejProgress = easeOutCubic(range(p, 0.70, 0.94));
          const ejOpacity = range(p, 0.68, 0.76) * (1 - range(p, 0.96, 1.0));
          const ejY = lerp(-25, 45, ejProgress);
          ejectGroupRef.current.style.opacity = String(ejOpacity);
          ejectGroupRef.current.style.transform = `translate3d(0, ${ejY}px, 0) scale(${lerp(0.96, 1.0, ejProgress)})`;
        }

        // 10. Downstream Handover Beam to Table (p > 0.82)
        if (downstreamBeamRef.current) {
          const beamOp = range(p, 0.82, 0.92) * (1 - range(p, 0.97, 1.0));
          downstreamBeamRef.current.style.opacity = String(beamOp);
        }

        // 11. Scroll indicator fade out
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span>Expand Workstation</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full mb-4"
      style={{ height: '280vh' }}
    >
      <div className="sticky top-0 w-full min-h-[760px] h-[820px] sm:h-[860px] lg:h-[880px] xl:h-[900px] rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#06080F] flex flex-col justify-between select-none">
        
        {/* Layer 0: Dynamic Canvas Background with constellation particles and sparks */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full pointer-events-none z-0"
        />

        {/* Ambient Radial Gradient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[560px] h-[560px] bg-indigo-600/[0.09] rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.09] rounded-full blur-3xl pointer-events-none z-0" />

        {/* Downstream Handover Beam to Invoices Table */}
        <div
          ref={downstreamBeamRef}
          className="absolute bottom-0 inset-x-0 h-10 flex items-center justify-center pointer-events-none z-30 transition-opacity"
          style={{ opacity: 0 }}
        >
          <div className="w-2 h-full bg-gradient-to-b from-emerald-400/80 via-emerald-400 to-transparent shadow-[0_0_20px_#34d399] rounded-full animate-pulse" />
        </div>

        {/* Top Control Bar & Telemetry HUD */}
        <div className="relative z-30 p-5 sm:p-6 flex items-center justify-between border-b border-white/[0.06] bg-[#06080F]/70 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Autonomous Workstation · Multi-Layer Parallax
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  RFC 2177 ACTIVE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 hidden sm:block mt-0.5">
                Multi-Depth Ingestion · Dual Groq LPU OCR · Live Google Sheets Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onUploadClick}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>

            <button
              onClick={onSyncEmailClick}
              disabled={isSyncingEmail}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Mail className={`w-4 h-4 text-indigo-400 ${isSyncingEmail ? 'animate-spin' : ''}`} />
              <span>{isSyncingEmail ? 'Syncing...' : 'Sync Email'}</span>
            </button>

            <Link
              to="/simulate"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Simulator</span>
            </Link>

            <button
              onClick={scrollToTable}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-medium"
              title="Jump straight to invoices table"
            >
              <span>Skip</span>
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
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

              {/* Volumetric Hologram Light Cone projecting from monitor to floating invoice */}
              <polygon
                ref={holoBeamRef}
                points="450,290 190,170 190,470 450,380"
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
                  alt="Upscaled Workstation Master"
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

            {/* LAYER 4: Floating Invoice 1 (Raw Inflow Document with Active Laser Scan) */}
            <div
              ref={invoice1Ref}
              className="absolute left-[8%] sm:left-[12%] top-[20%] sm:top-[22%] w-56 sm:w-64 lg:w-72 z-25 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="relative rounded-2xl bg-[#0C101D]/92 backdrop-blur-xl border border-white/20 p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
                {/* Laser Scanning Line & Beam */}
                <div
                  ref={laserBeamRef}
                  className="absolute inset-x-0 top-0 bg-gradient-to-b from-cyan-500/30 via-indigo-500/15 to-transparent pointer-events-none"
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

                {/* Audit Stamp */}
                <div
                  ref={auditStampRef}
                  className="absolute bottom-3 right-3 z-30 pointer-events-none will-change-transform"
                  style={{ opacity: 0 }}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/20 backdrop-blur-xs flex flex-col items-center justify-center p-1 shadow-[0_0_18px_rgba(52,211,153,0.5)]">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                    <span className="font-mono text-[8px] font-black text-emerald-300 tracking-tighter">RFC 2177</span>
                    <span className="font-mono text-[7px] text-emerald-400 font-bold uppercase tracking-widest">AUDITED</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-mono text-xs font-bold text-white tracking-wide">COMMERCIAL INVOICE</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/25 font-bold">
                    RFC 2177 INTAKE
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {/* Bounding Box 1: Vendor */}
                  <div
                    ref={boxVendorRef}
                    className="p-1.5 rounded-lg border border-dashed border-white/10 transition-colors"
                  >
                    <span className="text-slate-400 text-[10px] block">VENDOR</span>
                    <span className="font-bold text-white text-xs sm:text-sm">Acme Cloud Infrastructure Inc.</span>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400 text-[9px] block">INVOICE NO</span>
                      <span className="font-semibold text-white">INV-2026-9041</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] block">TERMS</span>
                      <span className="font-semibold text-emerald-400">NET 30</span>
                    </div>
                  </div>

                  {/* Bounding Box 2: Total */}
                  <div
                    ref={boxTotalRef}
                    className="p-2 rounded-lg border border-dashed border-white/10 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-slate-400 text-[9px] block">TOTAL AMOUNT</span>
                      <span className="font-extrabold text-emerald-400 text-sm sm:text-base">$4,850.00 USD</span>
                    </div>
                    <span className="font-mono text-[9px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      GROQ 100%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 5: Floating Invoice 2 (Verified Document with Green Checkmark) */}
            <div
              ref={invoice2Ref}
              className="absolute right-[8%] sm:right-[12%] top-[18%] sm:top-[20%] w-44 sm:w-52 z-25 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="relative rounded-2xl bg-[#0C101D]/92 backdrop-blur-xl border border-emerald-500/40 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Verified Ledger Row</p>
                    <p className="text-[10px] font-mono text-emerald-400">100% Normalized</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="text-emerald-300 font-bold">Auto-Reconciled</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Target</span>
                    <span className="text-cyan-300 font-bold">Google Sheets</span>
                  </p>
                </div>
              </div>
            </div>

            {/* LAYER 6: Holographic Extraction HUD Terminal (Right-Center) */}
            <div
              ref={hudTerminalRef}
              className="absolute right-2 sm:right-6 bottom-[12%] sm:bottom-[14%] w-72 sm:w-80 lg:w-96 z-30 pointer-events-none will-change-transform"
              style={{ opacity: 0 }}
            >
              <div className="rounded-2xl border border-white/[0.12] bg-[#0A0D18]/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5 font-mono text-xs">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">
                      extraction_stream.json
                    </span>
                  </div>
                  <span ref={terminalBadgeRef} className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                    STANDBY
                  </span>
                </div>

                <div className="space-y-1 text-xs leading-relaxed">
                  <div className="hud-json-line text-slate-400">&#123;</div>
                  <div className="hud-json-line pl-4">
                    <span className="text-cyan-400">"vendor"</span>: <span className="text-amber-300 font-semibold">"Acme Cloud Infrastructure"</span>,
                  </div>
                  <div className="hud-json-line pl-4">
                    <span className="text-cyan-400">"invoiceNo"</span>: <span className="text-indigo-300 font-semibold">"INV-2026-9041"</span>,
                  </div>
                  <div className="hud-json-line pl-4">
                    <span className="text-cyan-400">"total"</span>: <span className="text-emerald-400 font-bold">$4,850.00 USD</span>,
                  </div>
                  <div className="hud-json-line pl-4">
                    <span className="text-cyan-400">"reconciled"</span>: <span className="text-emerald-300 font-bold">true</span>
                  </div>
                  <div className="hud-json-line text-slate-400">&#125;</div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-[10px]">
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
            </div>

            {/* Ejected Data Flight Capsule (Ready to drop into table at p > 0.70) */}
            <div
              ref={ejectGroupRef}
              className="absolute left-1/2 -translate-x-1/2 bottom-2 z-35 w-full max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-indigo-500/20 border border-emerald-500/40 backdrop-blur-xl shadow-2xl transition-all will-change-transform flex items-center justify-between"
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Record Ready for Google Sheets</p>
                  <p className="text-xs font-mono text-emerald-300">INV-2026-9041 · $4,850.00 USD (Reconciled)</p>
                </div>
              </div>
              <button
                onClick={scrollToTable}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <span>Commit Row</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Status Ribbon & Interactive Scroll Prompt */}
        <div className="relative z-30 p-4 sm:p-5 border-t border-white/[0.06] bg-[#06080F]/70 backdrop-blur-md flex items-center justify-between text-xs sm:text-sm font-mono text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-semibold">Parallax Ingestion Online</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">RFC 2177 Workstation Parallax Engine</span>
          </div>

          <div
            ref={scrollIndicatorRef}
            className="flex items-center gap-3"
          >
            <span className="hidden sm:inline text-slate-400 text-xs sm:text-sm">Scroll to ingest:</span>
            <button
              onClick={scrollToTable}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold shadow-lg transition-all cursor-pointer text-xs sm:text-sm"
            >
              <span>Ingest Progress</span>
              <span ref={progressPercentRef} className="font-mono text-indigo-200 tabular-nums font-extrabold">
                0%
              </span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
