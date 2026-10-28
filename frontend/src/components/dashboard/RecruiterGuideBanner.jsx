import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function RecruiterGuideBanner({ onIngestSample, isIngesting }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  if (isDismissed) return null;

  const handleSampleClick = (scenario, filename, vendor) => {
    setSelectedSample(scenario);
    if (onIngestSample) {
      onIngestSample(`/samples/${filename}`, filename, vendor);
    }
  };

  const samples = [
    { id: 'aws', label: 'AWS (USD)', file: 'aws-invoice.pdf', vendor: 'AWS Cloud Services' },
    { id: 'stripe', label: 'Stripe (USD)', file: 'stripe-invoice.pdf', vendor: 'Stripe' },
    { id: 'sap', label: 'SAP (EUR)', file: 'sap-eur-invoice.pdf', vendor: 'SAP Deutschland' },
  ];

  return (
    <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0f1424] border border-gray-200/80 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
      
      {/* Left: Status Pill & Description */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Sandbox
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
          Select a sample invoice to test automated extraction and spreadsheet sync:
        </p>
      </div>

      {/* Right: Interactive Sample Triggers */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {samples.map((s) => {
            const isLoadingThis = isIngesting && selectedSample === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSampleClick(s.id, s.file, s.vendor)}
                disabled={isIngesting}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/15 text-orange-700 dark:text-orange-300 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                title={`Ingest sample invoice from ${s.vendor}`}
              >
                {isLoadingThis ? 'Ingesting...' : s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition cursor-pointer ml-1"
          title="Dismiss sandbox notice"
          aria-label="Dismiss sandbox notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
