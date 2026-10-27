import React, { useEffect } from 'react';
import LandingNav from '../../components/landing/LandingNav';
import HeroScrollStage from '../../components/landing/HeroScrollStage';
import PipelineReel from '../../components/landing/PipelineReel';
import DataflowTrajectory from '../../components/landing/DataflowTrajectory';
import CapabilitiesGrid from '../../components/landing/CapabilitiesGrid';
import LandingCTA from '../../components/landing/LandingCTA';
import LandingFooter from '../../components/landing/LandingFooter';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { startScroll } from '../../utils/scroll';

export default function LandingPage() {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Start ultra-smooth Lenis and requestAnimationFrame scroll loop
    const cleanup = startScroll(reduced);
    return cleanup;
  }, [reduced]);

  return (
    <div className="bg-[#0B0F19] min-h-screen text-slate-100 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
      <LandingNav />
      <main>
        <HeroScrollStage />
        <PipelineReel />
        <DataflowTrajectory />
        <CapabilitiesGrid />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
