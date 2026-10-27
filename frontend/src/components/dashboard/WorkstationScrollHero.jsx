import React, { useState } from 'react';
import { Sparkles, Layers } from 'lucide-react';
import Option1DigitalOcr from './hero/Option1DigitalOcr';
import Option2ParallaxDiorama from './hero/Option2ParallaxDiorama';
import Option3HybridFusion from './hero/Option3HybridFusion';

export default function WorkstationScrollHero(props) {
  const [selectedOption, setSelectedOption] = useState(() => {
    return localStorage.getItem('hero_option_choice') || '3';
  });

  const handleSelectOption = (opt) => {
    setSelectedOption(opt);
    localStorage.setItem('hero_option_choice', opt);
  };

  return (
    <div className="relative w-full">
      {/* Option Comparison Switcher Bar */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#090D1A]/90 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-1.5 px-2.5 text-slate-400 font-mono text-[11px] font-semibold hidden md:flex">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>HERO MODE:</span>
          </div>

          <button
            onClick={() => handleSelectOption('1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedOption === '1'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Option 1: Digital OCR
          </button>

          <button
            onClick={() => handleSelectOption('2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedOption === '2'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Option 2: Parallax Diorama
          </button>

          <button
            onClick={() => handleSelectOption('3')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedOption === '3'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Option 3: Hybrid Fusion</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-100 font-extrabold border border-cyan-300/30">
              ACTIVE
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive Scroll Active</span>
        </div>
      </div>

      {/* Hero Option Mounts */}
      {selectedOption === '1' && <Option1DigitalOcr {...props} />}
      {selectedOption === '2' && <Option2ParallaxDiorama {...props} />}
      {selectedOption === '3' && <Option3HybridFusion {...props} />}
    </div>
  );
}
