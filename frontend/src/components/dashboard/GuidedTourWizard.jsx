import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Layers, 
  Gauge, 
  ShieldCheck, 
  FileSpreadsheet, 
  Zap, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TOUR_STEPS = [
  {
    id: 'workstation',
    targetId: 'workstation-hero-section',
    stepNumber: '01',
    badge: '01 · EXTRACTION ENGINE',
    title: 'Interactive 3D Workstation',
    description: 'Visual diorama demonstrating real-time document intake, optical laser scanning, and verified spreadsheet dispatch.',
    icon: Layers,
    accentColor: 'orange',
    accentHex: '#f97316'
  },
  {
    id: 'kpis',
    targetId: 'kpi-metrics-section',
    stepNumber: '02',
    badge: '02 · SYSTEM METRICS',
    title: 'Operational Health & SLAs',
    description: 'Real-time telemetry tracking total invoices ingested, total volume, automated sync rate, and human verification queues.',
    icon: Gauge,
    accentColor: 'cyan',
    accentHex: '#06b6d4'
  },
  {
    id: 'analytics',
    targetId: 'spend-analytics-section',
    stepNumber: '03',
    badge: '03 · SPEND ANALYTICS',
    title: 'Currency Normalization & Analytics',
    description: 'Supplier spend distributions automatically converted and normalized across global currencies (USD, EUR, INR, GBP).',
    icon: ShieldCheck,
    accentColor: 'emerald',
    accentHex: '#10b981'
  },
  {
    id: 'ledger',
    targetId: 'invoices-table-section',
    stepNumber: '04',
    badge: '04 · PRODUCTION DATABASE',
    title: 'Invoices Ledger & Drawer Inspection',
    description: 'Centralized database of all processed invoices. Click any row to slide open the deep inspection drawer with bounding boxes and field confidence.',
    icon: FileSpreadsheet,
    accentColor: 'orange',
    accentHex: '#ea580c'
  },
  {
    id: 'sample-ingest',
    targetId: 'tour-sample-ingest-btn',
    stepNumber: '05',
    badge: '05 · INTERACTIVE DEMO',
    title: '1-Click Sample Ingestion',
    description: 'Test the live pipeline! Click "Ingest Sample" to simulate an incoming AWS invoice and watch it parse into your ledger in real-time.',
    icon: Zap,
    accentColor: 'amber',
    accentHex: '#f59e0b',
    interactiveAction: {
      type: 'ingest-sample',
      label: 'Click to Ingest AWS Sample Now'
    }
  }
];

export default function GuidedTourWizard({ 
  onIngestSample, 
  isIngestingSample 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const popoverRef = useRef(null);

  // Listen for global custom event to open tour from Header or Banner
  useEffect(() => {
    const handleOpen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('open-guided-tour', handleOpen);
    return () => window.removeEventListener('open-guided-tour', handleOpen);
  }, []);

  // Measure and track target DOM element
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
    const borderRadius = isButton ? 14 : 24;

    // Check vertical space for popover
    const spaceBelow = window.innerHeight - (y + height);
    const spaceAbove = y;
    const placement = spaceBelow >= 240 ? 'bottom' : spaceAbove >= 240 ? 'top' : (spaceBelow >= spaceAbove ? 'bottom' : 'top');

    setTargetRect({
      x,
      y,
      width,
      height,
      borderRadius,
      placement,
      centerX: x + width / 2,
      rawTop: rect.top,
      rawBottom: rect.bottom
    });
  }, [isOpen, currentStep]);

  // Scroll target element into view whenever current step changes
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    if (!step?.targetId) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Measure after scroll has begun and finished
      measureTarget();
      const t1 = setTimeout(measureTarget, 150);
      const t2 = setTimeout(measureTarget, 400);
      const t3 = setTimeout(measureTarget, 700);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, currentStep, measureTarget]);

  // Dynamic continuous tracking on scroll & resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      measureTarget();
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
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

  const handleActionClick = () => {
    const step = TOUR_STEPS[currentStep];
    if (step.interactiveAction?.type === 'ingest-sample' && onIngestSample) {
      onIngestSample('/samples/aws-invoice.pdf', 'aws-invoice.pdf', 'AWS Cloud');
      // Advance to next or finish
      setTimeout(() => {
        handleNext();
      }, 600);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isFinalStep = currentStep === TOUR_STEPS.length - 1;

  // Popover sizing & smart positioning
  const popoverWidth = typeof window !== 'undefined' ? Math.min(420, window.innerWidth - 32) : 420;
  let popoverLeft = 16;
  let popoverTop = 16;
  let caretLeft = 32;

  if (targetRect) {
    popoverLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetRect.centerX - popoverWidth / 2));
    caretLeft = Math.max(24, Math.min(popoverWidth - 34, targetRect.centerX - popoverLeft - 7));

    if (targetRect.placement === 'bottom') {
      popoverTop = Math.min(window.innerHeight - 260, targetRect.y + targetRect.height + 14);
    } else {
      popoverTop = Math.max(16, targetRect.y - 250);
    }
  }

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

      {/* ── 2. Glowing Animated Spotlight Ring Around Target ───────────────────── */}
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
          className="fixed pointer-events-none z-[9992] border-2 border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.5),inset_0_0_15px_rgba(34,211,238,0.2)] ring-4 ring-indigo-500/25"
        >
          {/* Pulsing Corner Radar Beacons */}
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-80" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping opacity-80" />
        </motion.div>
      )}

      {/* ── 3. Transparent Interactive Passthrough for Highlighted Element ──────── */}
      {targetRect && (
        <div
          onClick={(e) => {
            // Allow clicks on highlighted buttons to trigger normally
            e.stopPropagation();
          }}
          style={{
            position: 'fixed',
            top: targetRect.y,
            left: targetRect.x,
            width: targetRect.width,
            height: targetRect.height,
            zIndex: 9993,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* ── 4. Floating Popover Tooltip Anchored Next to Target ────────────────── */}
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          top: popoverTop,
          left: popoverLeft
        }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        style={{
          width: popoverWidth,
          zIndex: 9995,
        }}
        className="fixed pointer-events-auto rounded-3xl overflow-hidden border border-orange-500/30 bg-[#0B0F20]/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-5 text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pointer Arrow Caret */}
        {targetRect && (
          <div
            className={`absolute w-3.5 h-3.5 bg-[#0B0F20] border-orange-500/40 transform rotate-45 pointer-events-none ${
              targetRect.placement === 'bottom'
                ? '-top-[8px] border-t border-l'
                : '-bottom-[8px] border-b border-r'
            }`}
            style={{ left: caretLeft }}
          />
        )}

        {/* Top Header Row with Station Indicator & Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
              {step.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Dot Indicators */}
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Go to Step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* Skip / Close Button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
              title="Skip tour (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="py-3.5 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-cyan-300 border border-white/10 shrink-0">
              <StepIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              {step.title}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-0.5">
            {step.description}
          </p>

          {/* Interactive Action Button (e.g. for Step 5: Test Ingest) */}
          {step.interactiveAction && (
            <div className="pt-2">
              <button
                onClick={handleActionClick}
                disabled={isIngestingSample}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{isIngestingSample ? 'Ingesting Sample...' : step.interactiveAction.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer active:scale-95"
            >
              <span>{isFinalStep ? 'Finish Tour' : 'Next'}</span>
              {isFinalStep ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
