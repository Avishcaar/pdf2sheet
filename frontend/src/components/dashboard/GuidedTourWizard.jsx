import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export const TOUR_STEPS = [
  {
    id: 'workstation',
    targetId: 'workstation-hero-section',
    title: '3D Workstation',
    description: 'Document intake & optical laser scanning diorama.',
    techStack: ['Three.js', 'Canvas 2D', 'WebGL'],
    highlights: ['Isometric diorama', 'Laser scanning', 'Client memory']
  },
  {
    id: 'kpis',
    targetId: 'kpi-metrics-section',
    title: 'System Health & SLAs',
    description: 'Ingestion telemetry & real-time queue health.',
    techStack: ['MongoDB', 'Timeseries', 'Recharts'],
    highlights: ['Real-time SLAs', 'Sub-50ms index', 'Sync tracking']
  },
  {
    id: 'analytics',
    targetId: 'spend-analytics-section',
    title: 'Spend Analytics',
    description: 'Multi-currency normalization across global exchange rates.',
    techStack: ['Frankfurter FX', 'Decimal.js', 'Chart.js'],
    highlights: ['Spot conversions', 'USD/EUR/INR/GBP', 'Zero loss']
  },
  {
    id: 'ledger',
    targetId: 'invoices-table-section',
    title: 'Invoices Ledger',
    description: 'Extracted invoices with deep inspection drawer.',
    techStack: ['OCR / DocAI', 'PDF-Lib', 'Canvas Box'],
    highlights: ['Bounding boxes', 'Field confidence', 'Instant drawer']
  },
  {
    id: 'sample-ingest',
    targetId: 'tour-sample-ingest-btn',
    title: '1-Click Sample Demo',
    description: 'Live AWS invoice parsing pipeline simulation.',
    techStack: ['AWS S3', 'Node Streams', 'SSE'],
    highlights: ['Binary chunk stream', 'Event loops', 'Live ledger sync']
  }
];

export default function GuidedTourWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  // Listen for global custom event to open tour from Sidebar
  useEffect(() => {
    const handleOpen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('open-guided-tour', handleOpen);
    return () => window.removeEventListener('open-guided-tour', handleOpen);
  }, []);

  // Lock manual user scrolling when tour is open so user stays focused
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const preventScroll = (e) => {
      if (e.target.closest && e.target.closest('.tour-popover-card')) return;
      e.preventDefault();
    };

    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [isOpen]);

  // Measure and track target DOM element for spotlight cutout
  const measureTarget = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    if (!step?.targetId) return;

    const el = document.getElementById(step.targetId);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const isButton = el.offsetHeight < 65;
    const padding = isButton ? 8 : 12;

    const x = Math.max(8, rect.left - padding);
    const y = Math.max(8, rect.top - padding);
    const width = Math.min(window.innerWidth - 16, rect.width + padding * 2);
    const height = rect.height + padding * 2;
    const borderRadius = isButton ? 14 : 20;

    setTargetRect({
      x,
      y,
      width,
      height,
      borderRadius,
    });
  }, [isOpen, currentStep]);

  // Scroll target element into view smoothly whenever current step changes
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    if (!step?.targetId) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      measureTarget();
      const t1 = setTimeout(measureTarget, 120);
      const t2 = setTimeout(measureTarget, 350);
      const t3 = setTimeout(measureTarget, 650);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, currentStep, measureTarget]);

  // Continuous tracking on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      measureTarget();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, measureTarget]);

  // Keyboard navigation: Escape to skip, ArrowRight / Enter for next, ArrowLeft for back
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('guest_tour_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFinalStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9990] select-none pointer-events-none">
      {/* ── 1. Full-Screen Backdrop with SVG Cutout Mask ────────────────────────── */}
      <svg 
        className="fixed inset-0 w-full h-full pointer-events-auto"
        style={{ zIndex: 9991 }}
        onClick={handleDismiss}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White = opaque backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            
            {/* Black cutout = transparent hole around target element */}
            {targetRect && (
              <motion.rect
                animate={{
                  x: targetRect.x,
                  y: targetRect.y,
                  width: targetRect.width,
                  height: targetRect.height,
                  rx: targetRect.borderRadius,
                  ry: targetRect.borderRadius,
                }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Darkened overlay applied through mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 8, 18, 0.76)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ── 2. Glowing Spotlight Ring Around Target ───────────────────── */}
      {targetRect && (
        <motion.div
          animate={{
            top: targetRect.y,
            left: targetRect.x,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: targetRect.borderRadius,
          }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="fixed pointer-events-none z-[9992] border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
        />
      )}

      {/* ── 3. Minimalist Top-Left Fixed HUD Card (Zero Icons, Transparent Glass) ─ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="tour-popover-card fixed top-6 left-6 z-[9995] pointer-events-auto w-[320px] max-w-[calc(100vw-32px)] rounded-2xl bg-[#0B0F19]/70 backdrop-blur-2xl border border-white/10 p-4 shadow-2xl text-white flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Step ${currentStep + 1}: ${step.title}`}
      >
        {/* Header: Step Counter & Step Dots & End Button */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>

          <div className="flex items-center gap-2">
            {/* Step Dot Indicators */}
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-3.5 bg-cyan-400'
                      : 'w-1 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* End Tour Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-mono text-slate-400 hover:text-white px-1 py-0.5 rounded transition cursor-pointer"
              title="End Tour (Esc)"
              aria-label="End Tour"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex flex-col gap-1.5 py-1">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {step.title}
          </h3>

          <p className="text-xs text-slate-300 leading-normal">
            {step.description}
          </p>

          {/* Minimal Tech Chips Row */}
          <div className="flex items-center flex-wrap gap-1 pt-0.5">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase mr-1">Tech:</span>
            {step.techStack.map((tech, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950/70 text-cyan-200 border border-cyan-500/30"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Keyword Highlights */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {step.highlights.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.07]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
          >
            End Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 rounded-lg border border-white/15 hover:bg-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer active:scale-95"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              {isFinalStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
