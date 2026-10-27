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
  ArrowRight
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
  const svgConduitRef = useRef(null);
  
  // DOM element refs for direct style manipulation (60-120fps)
  const intakeBadgeRef = useRef(null);
  const docWrapperRef = useRef(null);
  const docGleamRef = useRef(null);
  const auditStampRef = useRef(null);

  // Laser Optics & Waveform
  const laserRef = useRef(null);
  const laserBeamRef = useRef(null);
  const laserGridRef = useRef(null);
  const laserWaveRef = useRef(null);
  const laserCoordRef = useRef(null);

  // Document Bounding Boxes
  const boxVendorRef = useRef(null);
  const boxMetaRef = useRef(null);
  const boxItemsRef = useRef(null);
  const boxTotalRef = useRef(null);

  // Target lines in the JSON terminal
  const jsonVendorRef = useRef(null);
  const jsonMetaRef = useRef(null);
  const jsonItemsRef = useRef(null);
  const jsonTotalRef = useRef(null);

  // SVG Data Conduit Paths & Traveling Photons
  const pathVendorRef = useRef(null);
  const pathMetaRef = useRef(null);
  const pathItemsRef = useRef(null);
  const pathTotalRef = useRef(null);
  const photonVendorRef = useRef(null);
  const photonMetaRef = useRef(null);
  const photonItemsRef = useRef(null);
  const photonTotalRef = useRef(null);

  // Telemetry HUD Elements
  const terminalBadgeRef = useRef(null);
  const lpuRateRef = useRef(null);
  const ejectGroupRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const progressPercentRef = useRef(null);
  const latencyRef = useRef(null);
  const downstreamBeamRef = useRef(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const reduced = useReducedMotion();

  // Mouse Parallax Ref for physical glass tilt
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const sparksRef = useRef([]);

  // 1. Mouse Move Listener for 3D Specular Parallax
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

  // 2. Interactive Canvas Background (Constellation, Sparks & Photonic Bursts)
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

    // Initialize 80 floating motes
    let seed = 89;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const motes = Array.from({ length: 80 }, () => ({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.0003,
      vy: -0.0002 - rand() * 0.0004,
      r: 1.0 + rand() * 1.8,
      alpha: 0.2 + rand() * 0.6,
      hue: rand() > 0.6 ? 217 : rand() > 0.3 ? 160 : 270 // Cyan, Emerald, Purple
    }));

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Draw faint constellation lines between nearby motes
      const maxDist = 90;
      for (let i = 0; i < motes.length; i++) {
        for (let j = i + 1; j < motes.length; j++) {
          const dx = (motes[i].x - motes[j].x) * width;
          const dy = (motes[i].y - motes[j].y) * height;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.14;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
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

      // Render Dynamic Spark Bursts (from photon terminal impacts)
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

  // Helper to trigger spark explosion on canvas
  const triggerImpactSparks = (x, y, color) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const cRect = canvas.getBoundingClientRect();
    const spawnX = x - cRect.left;
    const spawnY = y - cRect.top;

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 4.0;
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

  // 3. High-Precision Fluid Momentum Scroll Choreography
  useEffect(() => {
    if (isMinimized) return;
    const root = rootRef.current;
    if (!root) return;

    let animId;
    let smoothP = 0;
    let targetP = 0;
    let lastSmoothP = -1;
    let prevKValues = [0, 0, 0, 0];

    // Helper to calculate and draw SVG curve between two elements
    const updateConduit = (index, pathEl, photonEl, fromEl, toEl, progress, color) => {
      if (!pathEl || !fromEl || !toEl || !svgConduitRef.current) return;
      const svg = svgConduitRef.current;
      const sRect = svg.getBoundingClientRect();
      if (sRect.width === 0) return;

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      // Right-center of source box -> Left-center of target JSON line
      const x1 = fRect.right - sRect.left;
      const y1 = fRect.top + fRect.height / 2 - sRect.top;
      const x2 = tRect.left - sRect.left;
      const y2 = tRect.top + tRect.height / 2 - sRect.top;

      const dx = Math.max(45, (x2 - x1) * 0.5);
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      pathEl.setAttribute('d', d);

      const len = pathEl.getTotalLength ? pathEl.getTotalLength() : 320;
      pathEl.style.strokeDasharray = `${len}`;

      // Inking progress (0 to 1)
      const k = easeOutCubic(progress);
      pathEl.style.strokeDashoffset = `${len * (1 - k)}`;
      pathEl.style.opacity = String(range(progress, 0.05, 0.25) * (1 - range(progress, 0.90, 1.0)));

      // Moving energy photon
      if (photonEl && pathEl.getPointAtLength && k > 0.01 && k < 0.99) {
        const pt = pathEl.getPointAtLength(len * k);
        photonEl.setAttribute('cx', String(pt.x));
        photonEl.setAttribute('cy', String(pt.y));
        photonEl.setAttribute('opacity', '1');
      } else if (photonEl) {
        photonEl.setAttribute('opacity', '0');
      }

      // Spark burst trigger on impact threshold
      if (k >= 0.92 && prevKValues[index] < 0.92) {
        triggerImpactSparks(tRect.left, tRect.top + tRect.height / 2, color);
      }
      prevKValues[index] = k;

      // Target Line Flash on Impact
      if (k >= 0.92) {
        toEl.style.opacity = '1';
        toEl.style.transform = 'translate3d(0, 0, 0)';
        toEl.style.color = color;
        toEl.style.textShadow = `0 0 14px ${color}aa`;
        toEl.style.backgroundColor = `${color}18`;
      } else if (k > 0.05) {
        toEl.style.opacity = String(0.25 + k * 0.7);
        toEl.style.transform = `translate3d(${lerp(12, 0, k)}px, 0, 0)`;
        toEl.style.backgroundColor = 'transparent';
      } else {
        toEl.style.opacity = '0.2';
        toEl.style.transform = 'translate3d(12px, 0, 0)';
        toEl.style.color = '';
        toEl.style.textShadow = 'none';
        toEl.style.backgroundColor = 'transparent';
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

      // Smooth mouse parallax physics
      mouse.current.x = lerp(mouse.current.x, mouse.current.targetX, 0.08);
      mouse.current.y = lerp(mouse.current.y, mouse.current.targetY, 0.08);

      const p = smoothP;

      if (Math.abs(p - lastSmoothP) > 0.0001 || Math.abs(mouse.current.x - mouse.current.targetX) > 0.001) {
        lastSmoothP = p;

        // 1. Percentage counter & Telemetry Latency
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

        // 2. Intake Envelope Badge (p: 0.00 -> 0.22)
        if (intakeBadgeRef.current) {
          const inProgress = easeOutCubic(range(p, 0.0, 0.16));
          const outProgress = range(p, 0.16, 0.26);
          const badgeY = lerp(-18, 0, inProgress) + outProgress * 25;
          const badgeOpacity = (1 - outProgress);
          intakeBadgeRef.current.style.transform = `translate3d(0, ${badgeY}px, 0) scale(${lerp(0.96, 1.0, inProgress)})`;
          intakeBadgeRef.current.style.opacity = String(badgeOpacity);
        }

        // 3. Document 3D Inflow & Specular Mouse Parallax
        if (docWrapperRef.current) {
          const unfold = easeOutCubic(range(p, 0.06, 0.32));
          const rotX = lerp(14, 0, unfold);
          const rotY = lerp(-12, 0, unfold);
          const scale = lerp(0.92, 1.0, unfold);
          const transY = lerp(20, 0, unfold);

          const exit = easeOutCubic(range(p, 0.78, 1.0));
          const exitY = -exit * 50;
          const exitScale = lerp(1.0, 0.92, exit);
          const opacity = lerp(1.0, 0.2, exit);

          const mouseTiltX = -mouse.current.y * 10;
          const mouseTiltY = mouse.current.x * 12;

          docWrapperRef.current.style.transform = `perspective(1200px) translate3d(0, ${transY + exitY}px, 0) rotateX(${rotX + mouseTiltX}deg) rotateY(${rotY + mouseTiltY}deg) scale(${scale * exitScale})`;
          docWrapperRef.current.style.opacity = String(opacity);
        }

        // Dynamic Glass Gleam
        if (docGleamRef.current) {
          const gleamX = 50 + mouse.current.x * 90;
          const gleamY = 50 + mouse.current.y * 90;
          docGleamRef.current.style.background = `radial-gradient(circle at ${gleamX}% ${gleamY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
        }

        // 4. Laser Scan Bar, Sweeping Grid, Oscilloscope Wave & Coordinates
        if (laserRef.current && laserBeamRef.current) {
          const laserSweep = easeOutCubic(range(p, 0.20, 0.74));
          const laserOpacity = range(p, 0.18, 0.24) * (1 - range(p, 0.75, 0.82));

          laserRef.current.style.top = `${laserSweep * 100}%`;
          laserRef.current.style.opacity = String(laserOpacity);

          laserBeamRef.current.style.height = `${laserSweep * 100}%`;
          laserBeamRef.current.style.opacity = String(laserOpacity * 0.55);

          if (laserGridRef.current) {
            laserGridRef.current.style.height = `${laserSweep * 100}%`;
            laserGridRef.current.style.opacity = String(laserOpacity * 0.35);
          }

          if (laserCoordRef.current) {
            const yCoord = Math.round(laserSweep * 560);
            laserCoordRef.current.textContent = `Y:${yCoord}px · 600DPI`;
          }

          // Oscilloscope Sine Wave along Laser
          if (laserWaveRef.current) {
            let waveD = 'M 0 7';
            const width = 440;
            const freq = 0.06;
            const speed = time * 0.008;
            const scrollDelta = Math.abs(p - lastSmoothP);
            const amp = 4.0 + Math.min(7, scrollDelta * 180);
            for (let x = 0; x <= width; x += 18) {
              const y = 7 + Math.sin(x * freq + speed) * amp;
              waveD += ` L ${x} ${y.toFixed(1)}`;
            }
            laserWaveRef.current.setAttribute('d', waveD);
          }
        }

        // 5. Bounding Box Illuminations & Reticle Snapping
        const updateBox = (el, start, end, activeBorder, activeBg) => {
          if (!el) return;
          const a = easeOutCubic(range(p, start, end));
          const tag = el.querySelector('.box-tag');
          const reticles = el.querySelectorAll('.reticle-corner');

          if (a > 0.05) {
            el.style.borderColor = activeBorder;
            el.style.backgroundColor = activeBg;
            el.style.boxShadow = `0 0 ${Math.round(a * 24)}px ${activeBorder}44`;
          } else {
            el.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            el.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            el.style.boxShadow = 'none';
          }
          if (tag) {
            tag.style.opacity = String(a);
            tag.style.transform = `scale(${lerp(0.85, 1.0, a)})`;
          }
          reticles.forEach((r) => {
            r.style.opacity = String(a);
            r.style.borderColor = activeBorder;
          });
        };

        // Box 1: Vendor Header (p: 0.22 -> 0.32)
        updateBox(boxVendorRef.current, 0.22, 0.32, '#34d399', 'rgba(52, 211, 153, 0.12)');
        // Box 2: Meta / Invoice Number (p: 0.36 -> 0.46)
        updateBox(boxMetaRef.current, 0.36, 0.46, '#22d3ee', 'rgba(34, 211, 238, 0.12)');
        // Box 3: Line Items (p: 0.48 -> 0.58)
        updateBox(boxItemsRef.current, 0.48, 0.58, '#818cf8', 'rgba(129, 140, 248, 0.12)');
        // Box 4: Total & Tax (p: 0.60 -> 0.70)
        updateBox(boxTotalRef.current, 0.60, 0.70, '#c084fc', 'rgba(192, 132, 252, 0.14)');

        // 6. SVG Data Conduit Streams (Box -> JSON line photon transfers)
        const progVendor = range(p, 0.24, 0.40);
        updateConduit(0, pathVendorRef.current, photonVendorRef.current, boxVendorRef.current, jsonVendorRef.current, progVendor, '#fcd34d');

        const progMeta = range(p, 0.38, 0.54);
        updateConduit(1, pathMetaRef.current, photonMetaRef.current, boxMetaRef.current, jsonMetaRef.current, progMeta, '#38bdf8');

        const progItems = range(p, 0.50, 0.66);
        updateConduit(2, pathItemsRef.current, photonItemsRef.current, boxItemsRef.current, jsonItemsRef.current, progItems, '#a78bfa');

        const progTotal = range(p, 0.62, 0.78);
        updateConduit(3, pathTotalRef.current, photonTotalRef.current, boxTotalRef.current, jsonTotalRef.current, progTotal, '#34d399');

        // 7. Holographic Audit Stamp (Stamps at p > 0.64)
        if (auditStampRef.current) {
          const stampProgress = easeOutCubic(range(p, 0.64, 0.76));
          const stampOpacity = range(p, 0.63, 0.70);
          const stampScale = lerp(1.6, 1.0, stampProgress);
          const stampRot = lerp(-25, -12, stampProgress);
          auditStampRef.current.style.opacity = String(stampOpacity);
          auditStampRef.current.style.transform = `scale(${stampScale}) rotate(${stampRot}deg)`;
        }

        // 8. Terminal Header & LPU Status Badge
        if (terminalBadgeRef.current) {
          if (p < 0.20) {
            terminalBadgeRef.current.textContent = 'STANDBY · AWAITING BUFFER';
            terminalBadgeRef.current.className = 'font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700';
          } else if (p < 0.68) {
            terminalBadgeRef.current.textContent = 'GROQ LPU · 750 T/s PARSING';
            terminalBadgeRef.current.className = 'font-mono text-xs px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/35 animate-pulse';
          } else {
            terminalBadgeRef.current.textContent = 'RECONCILED · LEDGER COMMITTED';
            terminalBadgeRef.current.className = 'font-mono text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/35';
          }
        }

        // 9. Ejection Group (Committed Ledger Row ready to drop into table)
        if (ejectGroupRef.current) {
          const ejProgress = easeOutCubic(range(p, 0.72, 0.94));
          const ejOpacity = range(p, 0.70, 0.78) * (1 - range(p, 0.96, 1.0));
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
            <p className="text-sm font-bold text-white">Autonomous OCR Pipeline Minimized</p>
            <p className="text-xs font-mono text-slate-400">RFC 2177 Push Active · Dual Groq LPU Engine Online</p>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span>Expand Pipeline</span>
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
                  Autonomous OCR Pipeline
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  RFC 2177 ACTIVE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 hidden sm:block mt-0.5">
                Optical Document Intelligence · Dual Groq LPU Engine · Live Google Sheets Ledger
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

        {/* Center Stage: Split Screen with SVG Neural Data Conduits */}
        <div className="relative flex-1 flex flex-col lg:flex-row items-center justify-center px-6 sm:px-8 lg:px-12 py-4 sm:py-6 gap-8 sm:gap-10 lg:gap-12 z-10">
          
          {/* Incoming Email Intake Hologram Badge (Appears at start, drops invoice into scanner) */}
          <div
            ref={intakeBadgeRef}
            className="absolute top-2 sm:top-3 z-40 px-4 py-2 rounded-full bg-indigo-950/85 border border-indigo-500/40 backdrop-blur-md shadow-xl flex items-center gap-2.5 pointer-events-none will-change-transform"
            style={{ opacity: 0 }}
          >
            <Mail className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span className="font-mono text-xs sm:text-sm text-white">
              INCOMING RFC 2177 ATTACHMENT: <span className="text-cyan-300 font-bold">invoice_acme_9041.pdf</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* SVG DATA CONDUITS (Beams firing data from Document to JSON Terminal) */}
          <svg
            ref={svgConduitRef}
            className="absolute inset-0 size-full pointer-events-none z-25 hidden lg:block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Path 1: Vendor */}
            <path ref={pathVendorRef} fill="none" stroke="#34d399" strokeWidth="2.5" strokeDasharray="320" strokeDashoffset="320" opacity="0" filter="url(#glow)" />
            <circle ref={photonVendorRef} r="5" fill="#6ee7b7" opacity="0" filter="url(#glow)" />

            {/* Path 2: Meta */}
            <path ref={pathMetaRef} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="320" strokeDashoffset="320" opacity="0" filter="url(#glow)" />
            <circle ref={photonMetaRef} r="5" fill="#a5f3fc" opacity="0" filter="url(#glow)" />

            {/* Path 3: Line Items */}
            <path ref={pathItemsRef} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="320" strokeDashoffset="320" opacity="0" filter="url(#glow)" />
            <circle ref={photonItemsRef} r="5" fill="#c7d2fe" opacity="0" filter="url(#glow)" />

            {/* Path 4: Total */}
            <path ref={pathTotalRef} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="320" strokeDashoffset="320" opacity="0" filter="url(#glow)" />
            <circle ref={photonTotalRef} r="5" fill="#f5d0fe" opacity="0" filter="url(#glow)" />
          </svg>

          {/* LEFT: 3D High-Tech Invoice Document with Specular Gleam */}
          <div className="w-full lg:w-[48%] max-w-[480px] lg:max-w-[500px] flex items-center justify-center">
            <div
              ref={docWrapperRef}
              className="relative w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.14] rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] will-change-transform overflow-hidden flex flex-col justify-between"
              style={{
                transform: 'perspective(1200px) rotateX(14deg) rotateY(-12deg) scale(0.92)',
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
              }}
            >
              {/* Dynamic Specular Glass Gleam Overlay */}
              <div
                ref={docGleamRef}
                className="absolute inset-0 pointer-events-none z-12 will-change-transform"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)' }}
              />

              {/* Laser Scanning Grid Wash & Oscilloscope Bar */}
              <div
                ref={laserGridRef}
                className="absolute inset-x-0 top-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:18px_18px] pointer-events-none will-change-transform z-15"
                style={{ height: '0%', opacity: 0 }}
              />

              <div
                ref={laserBeamRef}
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-cyan-500/25 via-indigo-500/15 to-transparent pointer-events-none will-change-transform z-20"
                style={{ height: '0%', opacity: 0 }}
              />

              <div
                ref={laserRef}
                className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_25px_#22d3ee,0_0_50px_#38bdf8] pointer-events-none will-change-transform z-30 flex items-center justify-between px-3"
                style={{ top: '0%', opacity: 0 }}
              >
                <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_14px_#22d3ee] animate-ping" />
                
                {/* Oscilloscope Micro-Waveform */}
                <div className="flex items-center gap-2">
                  <svg className="w-28 h-3.5 overflow-visible pointer-events-none hidden sm:block">
                    <path
                      ref={laserWaveRef}
                      d="M 0 7 L 440 7"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.8"
                      opacity="0.85"
                    />
                  </svg>
                  <span ref={laserCoordRef} className="font-mono text-[9px] text-cyan-200 tracking-wider bg-black/60 px-1.5 py-0.5 rounded shadow">
                    Y:0px · 600DPI
                  </span>
                </div>

                <div className="w-3 h-3 rounded-full bg-emerald-300 shadow-[0_0_14px_#34d399] animate-ping" />
              </div>

              {/* Holographic Verification Stamp (Stamps when complete) */}
              <div
                ref={auditStampRef}
                className="absolute bottom-4 right-4 pointer-events-none z-22 will-change-transform"
                style={{ opacity: 0, transform: 'scale(1.6) rotate(-25deg)' }}
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-1.5 bg-emerald-500/15 backdrop-blur-xs shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mb-0.5" />
                  <span className="font-mono text-[8px] sm:text-[9px] font-black text-emerald-300 tracking-tighter uppercase leading-none">
                    RFC 2177
                  </span>
                  <span className="font-mono text-[7px] sm:text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                    AUDITED
                  </span>
                </div>
              </div>

              {/* DOCUMENT CONTENT */}
              <div className="space-y-4 relative z-10">
                {/* 1. Document Header / Vendor */}
                <div
                  ref={boxVendorRef}
                  className="relative p-3.5 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform"
                >
                  {/* AI Vision Reticle Target Marks */}
                  <span className="reticle-corner absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 opacity-0 transition-opacity" />

                  <div 
                    className="box-tag absolute -top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500 text-black font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    VENDOR · 99.8%
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Acme Cloud Infrastructure Inc.</h3>
                      <p className="text-xs sm:text-sm text-slate-300 font-mono mt-0.5">billing@acmecloud.io · San Francisco, CA</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-mono text-xs sm:text-sm font-bold shadow-inner">
                      AC
                    </div>
                  </div>
                </div>

                {/* 2. Metadata: Invoice # & Dates */}
                <div
                  ref={boxMetaRef}
                  className="relative p-3.5 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform"
                >
                  <span className="reticle-corner absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 opacity-0 transition-opacity" />

                  <div 
                    className="box-tag absolute -top-3 right-3 px-2 py-0.5 rounded-md bg-cyan-500 text-black font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    META · 99.4%
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-mono text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">INVOICE NO</span>
                      <span className="text-white font-bold">INV-2026-9041</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">ISSUE DATE</span>
                      <span className="text-white font-bold">2026-10-27</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">TERMS</span>
                      <span className="text-emerald-400 font-bold">NET 30</span>
                    </div>
                  </div>
                </div>

                {/* 3. Line Items Table */}
                <div
                  ref={boxItemsRef}
                  className="relative p-3.5 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform space-y-2"
                >
                  <span className="reticle-corner absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 opacity-0 transition-opacity" />

                  <div 
                    className="box-tag absolute -top-3 right-3 px-2 py-0.5 rounded-md bg-indigo-500 text-white font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    3 ITEMS · 99.1%
                  </div>

                  <div className="flex justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-white/10 pb-1.5">
                    <span>DESCRIPTION</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-mono text-slate-200">
                    <span className="truncate pr-2">Enterprise GPU Cluster (L40S)</span>
                    <span className="text-white font-bold">$3,400.00</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-mono text-slate-200">
                    <span className="truncate pr-2">Global Edge CDN Bandwidth</span>
                    <span className="text-white font-bold">$950.00</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-mono text-slate-200">
                    <span className="truncate pr-2">Encrypted Storage Bucket</span>
                    <span className="text-white font-bold">$500.00</span>
                  </div>
                </div>

                {/* 4. Total Amount & Currency */}
                <div
                  ref={boxTotalRef}
                  className="relative p-3.5 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors will-change-transform"
                >
                  <span className="reticle-corner absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 opacity-0 transition-opacity" />
                  <span className="reticle-corner absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 opacity-0 transition-opacity" />

                  <div 
                    className="box-tag absolute -top-3 right-3 px-2 py-0.5 rounded-md bg-purple-500 text-white font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider shadow pointer-events-none will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    TOTAL · 100%
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] sm:text-xs font-mono text-purple-200 block font-medium">TOTAL PAYABLE (USD)</span>
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-white tracking-tight mt-0.5 block">$4,850.00</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Ledger Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark & Verification Footer */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] sm:text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Groq LPU Llama-3-Vision Verified
                </span>
                <span className="font-semibold text-slate-300">AUTHENTIC RFC 2177</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Telemetry Terminal & Target Inspector */}
          <div className="w-full lg:w-[48%] max-w-[520px] lg:max-w-[560px] flex flex-col justify-center space-y-4">
            {/* Terminal Window Header */}
            <div className="rounded-2xl border border-white/[0.1] bg-[#0A0D18]/92 backdrop-blur-md shadow-2xl p-5 sm:p-6 font-mono text-xs sm:text-sm overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-sm" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-sm" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-200">
                    extraction_stream.json
                  </span>
                </div>

                {/* Hardware Pulse Equalizer & Status */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-end gap-1 h-3.5">
                    <span className="w-1 h-2.5 bg-indigo-400 animate-pulse rounded-full" />
                    <span className="w-1 h-3.5 bg-cyan-400 animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-2 bg-emerald-400 animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
                  </div>
                  <span ref={terminalBadgeRef} className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                    STANDBY · AWAITING BUFFER
                  </span>
                </div>
              </div>

              {/* JSON Lines Stream (Directly targets of SVG fiber conduits) */}
              <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed select-text">
                <div className="text-slate-400 font-mono font-bold">&#123;</div>
                <div className="pl-5 font-mono">
                  <span className="text-cyan-400 font-medium">"status"</span>: <span className="text-emerald-300 font-bold">"RECONCILED"</span>,
                </div>
                
                {/* Target 1: Vendor */}
                <div ref={jsonVendorRef} className="pl-5 font-mono transition-transform duration-150 will-change-transform rounded px-1.5 -mx-1.5 py-0.5" style={{ opacity: 0.2 }}>
                  <span className="text-cyan-400 font-medium">"vendor"</span>: <span>"Acme Cloud Infrastructure Inc."</span>,
                </div>

                {/* Target 2: Meta / Invoice Number */}
                <div ref={jsonMetaRef} className="pl-5 font-mono transition-transform duration-150 will-change-transform rounded px-1.5 -mx-1.5 py-0.5" style={{ opacity: 0.2 }}>
                  <span className="text-cyan-400 font-medium">"invoiceNumber"</span>: <span>"INV-2026-9041"</span>,
                </div>

                <div className="pl-5 font-mono">
                  <span className="text-cyan-400 font-medium">"date"</span>: <span className="text-slate-200">"2026-10-27"</span>,
                </div>
                <div className="pl-5 font-mono">
                  <span className="text-cyan-400 font-medium">"currency"</span>: <span className="text-purple-300 font-semibold">"USD"</span>,
                </div>

                {/* Target 4: Total Amount */}
                <div ref={jsonTotalRef} className="pl-5 font-mono transition-transform duration-150 will-change-transform rounded px-1.5 -mx-1.5 py-0.5" style={{ opacity: 0.2 }}>
                  <span className="text-cyan-400 font-medium">"totalAmount"</span>: <span className="font-extrabold text-white">4850.00</span>,
                </div>

                {/* Target 3: Line Items */}
                <div ref={jsonItemsRef} className="pl-5 font-mono transition-transform duration-150 will-change-transform rounded px-1.5 -mx-1.5 py-0.5" style={{ opacity: 0.2 }}>
                  <span className="text-cyan-400 font-medium">"lineItems"</span>: <span>[3 items parsed & verified]</span>,
                </div>

                <div className="pl-5 font-mono">
                  <span className="text-cyan-400 font-medium">"syncLedger"</span>: <span className="text-emerald-300 font-bold">"Google Sheets (Active)"</span>
                </div>
                <div className="text-slate-400 font-mono font-bold">&#125;</div>
              </div>

              {/* Hardware & Pipeline Telemetry Stats Bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] sm:text-[11px] font-mono">LPU INFERENCE</span>
                  <span ref={latencyRef} className="text-cyan-300 font-extrabold text-sm sm:text-base tabular-nums">240ms</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] sm:text-[11px] font-mono">THROUGHPUT</span>
                  <span ref={lpuRateRef} className="text-emerald-400 font-extrabold text-sm sm:text-base">750 T/s</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] sm:text-[11px] font-mono">TOTAL INVOICES</span>
                  <span className="text-white font-extrabold text-sm sm:text-base">{invoicesCount} Docs</span>
                </div>
              </div>
            </div>

            {/* Ejected Data Flight Capsule (Ready to drop into table at p > 0.72) */}
            <div
              ref={ejectGroupRef}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-indigo-500/15 border border-emerald-500/40 backdrop-blur-md shadow-2xl transition-all will-change-transform flex items-center justify-between"
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Record Ready for Google Sheets</p>
                  <p className="text-xs font-mono text-emerald-300 mt-0.5">INV-2026-9041 · $4,850.00 USD (Reconciled)</p>
                </div>
              </div>
              <button
                onClick={scrollToTable}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <span>Commit to Row</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Status Ribbon & Interactive Scroll Prompt */}
        <div className="relative z-30 p-4 sm:p-5 border-t border-white/[0.06] bg-[#06080F]/70 backdrop-blur-md flex items-center justify-between text-xs sm:text-sm font-mono text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-white font-semibold">Pipeline Telemetry Online</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">Llama-3-Vision & DeepSeek OCR Core</span>
          </div>

          <div
            ref={scrollIndicatorRef}
            className="flex items-center gap-3"
          >
            <span className="hidden sm:inline text-slate-400 text-xs sm:text-sm">Scroll to sweep OCR:</span>
            <button
              onClick={scrollToTable}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold shadow-lg transition-all cursor-pointer text-xs sm:text-sm"
            >
              <span>Scan Progress</span>
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
