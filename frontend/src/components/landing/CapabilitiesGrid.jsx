import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Layers, Terminal, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { useReveals } from '../../hooks/useReveals';

const CAPABILITIES = [
  {
    id: 'currencies',
    badge: 'GLOBAL COMMERCE',
    title: 'Multi-Currency Glyphs',
    description:
      'Detects native symbols across ₹ (INR), € (EUR), $ (USD), and £ (GBP) directly from raw invoice text and raster scans without coercing foreign bills to USD.',
    icon: DollarSign,
    features: [
      'Preserves symbol & ISO currency code',
      'Supports mixed-currency tax columns',
      'Unified 4-currency dashboard filter',
    ],
    cta: 'Learn more',
  },
  {
    id: 'review-drawer',
    badge: 'HUMAN-IN-THE-LOOP',
    title: 'Visual Coordinate Mapper',
    description:
      'Invoices with arithmetic mismatches or confidence thresholds below 90% are routed to an interactive visual drawer with PDF coordinate bounding boxes.',
    icon: Layers,
    features: [
      'Point-and-click coordinate tagging',
      'Real-time vendor template learning',
      'Zero spreadsheet corruption',
    ],
    cta: 'Explore mapper',
    featured: true,
  },
  {
    id: 'simulator',
    badge: 'ENGINEERING SANDBOX',
    title: 'DevTools Ingestion Sandbox',
    description:
      'Test edge cases, corrupted PDFs, currency variants, and high-frequency delivery bursts with simulated vendor scenarios in a zero-risk sandbox.',
    icon: Terminal,
    features: [
      'Pre-built AWS, Uber & GitHub scenarios',
      'Real-time SSE telemetry inspector',
      'Instant test email dispatch',
    ],
    cta: 'Open Simulator',
    to: '/simulate',
  },
];

export default function CapabilitiesGrid() {
  const ref = useReveals();

  return (
    <section
      ref={ref}
      id="capabilities"
      aria-labelledby="capabilities-title"
      className="relative bg-[#0B0F19] px-4 sm:px-6 md:px-[6vw] py-24 sm:py-32 border-t border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto">
        <div
          data-reveal
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Engine Features
            </div>
            <h2
              id="capabilities-title"
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight"
            >
              Architected for Precision Accounting
            </h2>
          </div>
          <p className="font-mono text-xs text-slate-400 uppercase">
            0% Hallucination · 100% Math Reconciliation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                data-reveal
                style={{ transitionDelay: `${i * 120}ms` }}
                className={`group relative flex flex-col justify-between rounded-xl p-7 bg-[#111827] border transition-all duration-300 hover:-translate-y-1 ${
                  cap.featured
                    ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {cap.featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-600 text-white uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {cap.badge}
                  </span>

                  <h3 className="mt-3 text-lg font-bold text-white tracking-tight">
                    {cap.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {cap.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 pt-5 border-t border-white/[0.06]">
                    {cap.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-300"
                      >
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  {cap.to ? (
                    <Link
                      to={cap.to}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors"
                    >
                      <span>{cap.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors"
                    >
                      <span>{cap.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
