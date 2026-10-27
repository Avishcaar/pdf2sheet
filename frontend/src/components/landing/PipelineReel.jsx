import React, { useEffect, useRef, useState } from 'react';
import { Mail, Cpu, Calculator, FileSpreadsheet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { clamp, pinProgress, range } from '../../utils/math';
import { onFrame } from '../../utils/scroll';

const SECTION_VH = 340;

const PIPELINE_STEPS = [
  {
    step: '01',
    badge: 'EVENT-DRIVEN INGESTION',
    title: 'RFC 2177 IMAP IDLE Push',
    desc: 'Bypasses legacy periodic polling with a persistent TCP socket. Inbound email attachments are streamed directly into the processing worker within 240ms of delivery.',
    icon: Mail,
    accent: 'emerald',
    stats: [
      { label: 'Latency', value: '< 240ms' },
      { label: 'Socket Mode', value: 'RFC 2177 IDLE' },
      { label: 'Payload Support', value: 'PDF, JPG, PNG' },
    ],
  },
  {
    step: '02',
    badge: 'ACCELERATED VISION LPU',
    title: 'Groq LPU Multimodal OCR',
    desc: 'High-throughput inference extracts tabular line items, addresses, GST/VAT identifiers, and international currency symbols (₹, €, $, £) with spatial bounding precision.',
    icon: Cpu,
    accent: 'indigo',
    stats: [
      { label: 'Inference Model', value: 'Llama-3.3-70B' },
      { label: 'Throughput', value: '840 tokens/s' },
      { label: 'Confidence Score', value: '98.8% Avg' },
    ],
  },
  {
    step: '03',
    badge: 'ARITHMETIC INTEGRITY',
    title: 'Forensic Mathematical Audit',
    desc: 'Autonomous cross-reconciliation ensures subtotal + computed taxes match grand total down to the cent. Flagged discrepancies are routed to the visual human verification queue.',
    icon: Calculator,
    accent: 'violet',
    stats: [
      { label: 'Verification', value: 'Subtotal + Tax = Total' },
      { label: 'Discrepancy Check', value: 'Zero False Positives' },
      { label: 'Review Queue', value: '1-Click Visual Drawer' },
    ],
  },
  {
    step: '04',
    badge: 'CLOUD SPREADSHEET RECONCILIATION',
    title: 'Two-Way Google Sheets Sync',
    desc: 'Instantly appends validated accounting records to designated Google Spreadsheets using official OAuth2 service tokens, with duplicate detection and cell formatting.',
    icon: FileSpreadsheet,
    accent: 'emerald',
    stats: [
      { label: 'Sync Target', value: 'Google Sheets API v4' },
      { label: 'Conflict Mode', value: 'Deduplicated' },
      { label: 'History Sync', value: 'Bidirectional' },
    ],
  },
];

export default function PipelineReel() {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const barRef = useRef(null);
  const countRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let lastP = -1;

    return onFrame(() => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track) return;

      const { p, rect, vh } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const vw = window.innerWidth;
      const k = range(p, 0.04, 0.96);

      // Travel distance for horizontal carousel
      const travel = Math.max(0, track.offsetLeft + track.scrollWidth - vw * 0.92);
      track.style.transform = `translate3d(${-k * travel}px, 0, 0)`;

      let nearest = 0;
      let best = Infinity;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const r = card.getBoundingClientRect();
        const off = (r.left + r.width / 2 - vw * 0.58) / vw;
        const a = clamp(Math.abs(off) * 1.5);
        card.style.opacity = String(1 - a * 0.5);
        card.style.transform = `scale(${1 - a * 0.06})`;

        if (Math.abs(off) < best) {
          best = Math.abs(off);
          nearest = i;
        }
      });

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${k})`;
      }
      if (countRef.current) {
        countRef.current.textContent = `0${nearest + 1}`;
      }
    });
  }, []);

  return (
    <section
      ref={rootRef}
      id="pipeline"
      aria-labelledby="pipeline-title"
      className="relative bg-[#0B0F19] border-t border-white/[0.06]"
      style={{ height: `${SECTION_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16 md:flex-row md:items-center md:pt-0">
        {/* Left Column: Fixed System Overview */}
        <div className="relative z-10 shrink-0 px-6 sm:px-8 md:w-[32vw] md:pl-[6vw] md:pr-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] uppercase tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            System Architecture
          </div>

          <h2
            id="pipeline-title"
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight"
          >
            The Autonomous Ingestion Reel
          </h2>

          <p className="mt-4 text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
            Every step is event-driven and zero-overhead: from background IMAP socket arrival,
            through Groq vision parsing, to certified financial ledger insertion.
          </p>

          <div
            className="mt-8 flex items-center gap-4 font-mono text-xs text-slate-400 uppercase"
            aria-hidden="true"
          >
            <span className="flex items-center gap-1.5">
              <span ref={countRef} className="text-white font-bold text-sm">
                01
              </span>
              <span className="text-slate-600">/</span>
              <span>04</span>
            </span>
            <span className="relative h-1 w-32 rounded-full bg-white/10 overflow-hidden">
              <span
                ref={barRef}
                className="absolute inset-0 origin-left bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                style={{ transform: 'scaleX(0)' }}
              />
            </span>
          </div>
        </div>

        {/* Right Horizontal Reel Track */}
        <ol
          ref={trackRef}
          className="mt-6 flex gap-6 pl-6 will-change-transform sm:pl-8 md:mt-0 md:gap-8 md:pl-0"
        >
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.step}
                ref={(el) => {
                  if (el) cardRefs.current[i] = el;
                }}
                className="w-[82vw] sm:w-[50vw] md:w-[clamp(20rem,28vw,26rem)] shrink-0 origin-bottom"
              >
                <div className="group relative flex flex-col justify-between h-[420px] rounded-xl p-6 sm:p-7 bg-[#111827] border border-white/[0.08] hover:border-indigo-500/40 shadow-xl transition-all duration-300">
                  {/* Step Header */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">
                        STEP {step.step}
                      </span>
                    </div>

                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-2">
                      {step.badge}
                    </span>

                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Telemetry Stats Grid */}
                  <div className="pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2">
                    {step.stats.map((s, idx) => (
                      <div key={idx} className="font-mono">
                        <p className="text-[10px] text-slate-500 uppercase truncate">
                          {s.label}
                        </p>
                        <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
