import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { consumeGuidedTourRequest, GUIDED_TOUR_EVENT } from '../../utils/guidedTour';

const TOUR_STEPS = [
  {
    id: 'intake',
    targetId: 'invoice-intake-section',
    title: 'Bring in an invoice',
    description: 'Upload a PDF, sync your inbox, or start with a sample invoice.'
  },
  {
    id: 'workstation',
    targetId: 'workstation-hero-section',
    title: 'Follow the document',
    description: 'Explore the illustrated path from PDF intake to a spreadsheet row. This scene uses sample data.'
  },
  {
    id: 'kpis',
    targetId: 'kpi-metrics-section',
    title: 'See what needs attention',
    description: 'Check invoice totals, processed records, and items waiting for review.'
  },
  {
    id: 'analytics',
    targetId: 'spend-analytics-section',
    title: 'Compare your spend',
    description: 'View vendor totals and compare invoice amounts in your selected currency.'
  },
  {
    id: 'ledger',
    targetId: 'invoices-table-section',
    title: 'Review the invoice register',
    description: 'Search invoices, open their details, and review extracted fields before sending records to Sheets.'
  },
  {
    id: 'sample-ingest',
    targetId: 'tour-sample-ingest-btn',
    title: 'Try a sample invoice',
    description: 'Load a sample to see extraction fill the register. The simulator has more suppliers and currencies to try.'
  }
];

export default function GuidedTourWizard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const consumedLocationKey = useRef(null);
  const popoverRef = useRef(null);

  const openTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('guest_tour_completed', 'true');
    setIsOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleDismiss();
    }
  }, [currentStep, handleDismiss]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const request = consumeGuidedTourRequest(location.state);
    if (!request || consumedLocationKey.current === location.key) return;

    const frame = window.requestAnimationFrame(() => {
      consumedLocationKey.current = location.key;
      openTour();
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: request.remainingState },
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location, navigate, openTour]);

  // Listen for global custom event to open tour from Sidebar
  useEffect(() => {
    window.addEventListener(GUIDED_TOUR_EVENT, openTour);
    return () => window.removeEventListener(GUIDED_TOUR_EVENT, openTour);
  }, [openTour]);

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

  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const popover = popoverRef.current;
    const previouslyFocused = document.activeElement;
    const focusableSelector = 'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    popover.focus({ preventScroll: true });

    const containFocus = (event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(popover.querySelectorAll(focusableSelector))
        .filter((element) => !element.hidden && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const focused = document.activeElement;

      if (!first || !last) {
        event.preventDefault();
        popover.focus({ preventScroll: true });
      } else if (event.shiftKey && (focused === first || focused === popover || !popover.contains(focused))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (focused === last || focused === popover || !popover.contains(focused))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', containFocus);
    return () => {
      document.removeEventListener('keydown', containFocus);
      if (previouslyFocused?.isConnected && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
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
      let frame;
      const scheduleMeasurement = () => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(measureTarget);
      };
      scheduleMeasurement();
      window.addEventListener('scroll', scheduleMeasurement, true);
      const observer = new ResizeObserver(scheduleMeasurement);
      observer.observe(el);
      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener('scroll', scheduleMeasurement, true);
        observer.disconnect();
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
        e.preventDefault();
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Enter') {
        const interactiveTarget = e.target instanceof Element && e.target.closest('button, a[href], input, select, textarea, summary, [role="button"], [contenteditable]:not([contenteditable="false"])');
        if (!interactiveTarget) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss, handleNext, handlePrev]);

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
              <Motion.rect
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
        <Motion.div
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
      <Motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="tour-popover-card fixed top-6 left-6 z-[9995] pointer-events-auto w-[320px] max-w-[calc(100vw-32px)] rounded-2xl bg-[#0B0F19]/70 backdrop-blur-2xl border border-white/10 p-4 shadow-2xl text-white flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Step ${currentStep + 1}: ${step.title}`}
        aria-describedby="guided-tour-description"
        tabIndex={-1}
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
                  aria-label={`Step ${idx + 1}: ${s.title}`}
                  aria-current={currentStep === idx ? 'step' : undefined}
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
        <div className="flex flex-col gap-1.5 py-1" aria-live="polite" aria-atomic="true">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {step.title}
          </h3>

          <p id="guided-tour-description" className="text-xs text-slate-300 leading-normal">
            {step.description}
          </p>

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
      </Motion.div>
    </div>
  );
}
