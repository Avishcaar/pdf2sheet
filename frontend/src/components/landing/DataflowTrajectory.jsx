import React, { useEffect, useRef, useState } from 'react';
import { Mail, Cpu, Calculator, FileSpreadsheet, Check, ArrowRight } from 'lucide-react';
import { clamp, easeOutCubic, pinProgress, range } from '../../utils/math';
import { onFrame } from '../../utils/scroll';

const SECTION_VH = 320;
const WINDOW = [0.06, 0.92];
const TOTAL_BYTES = 1248500;

const NODES = [
  { id: 'imap', title: 'IMAP Push', cx: 160, cy: 300, icon: Mail, label: 'Email Socket' },
  { id: 'ocr', title: 'Groq LPU', cx: 480, cy: 180, icon: Cpu, label: 'Vision Inference' },
  { id: 'math', title: 'Math Audit', cx: 780, cy: 420, icon: Calculator, label: 'Arithmetic Engine' },
  { id: 'sheet', title: 'Google Sheets', cx: 1060, cy: 300, icon: FileSpreadsheet, label: 'Verified Ledger' },
];

const PATH_D = `M${NODES[0].cx} ${NODES[0].cy} C 300 300, 340 180, ${NODES[1].cx} ${NODES[1].cy} C 620 180, 640 420, ${NODES[2].cx} ${NODES[2].cy} C 920 420, 940 300, ${NODES[3].cx} ${NODES[3].cy}`;

export default function DataflowTrajectory() {
  const rootRef = useRef(null);
  const pathRef = useRef(null);
  const tokenRef = useRef(null);
  const bytesRef = useRef(null);
  const activeNodeRef = useRef(null);
  const [currentNodeIdx, setCurrentNodeIdx] = useState(0);

  useEffect(() => {
    let lastP = -1;
    let pathLength = 0;
    if (pathRef.current) {
      pathLength = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${pathLength} ${pathLength}`;
      pathRef.current.style.strokeDashoffset = `${pathLength}`;
    }

    return onFrame(() => {
      const root = rootRef.current;
      const path = pathRef.current;
      const token = tokenRef.current;
      if (!root || !path || !token) return;

      const { p, rect, vh } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const u = range(p, WINDOW[0], WINDOW[1]);
      const progressEased = easeOutCubic(u);

      // Draw SVG path
      const drawOffset = pathLength * (1 - progressEased);
      path.style.strokeDashoffset = String(drawOffset);

      // Move data packet token along SVG path
      const pt = path.getPointAtLength(pathLength * progressEased);
      token.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

      // Update byte counter
      if (bytesRef.current) {
        const bytes = Math.round(progressEased * TOTAL_BYTES);
        bytesRef.current.textContent = bytes.toLocaleString('en-US');
      }

      // Update active node
      const currentIdx = Math.min(
        NODES.length - 1,
        Math.floor(progressEased * NODES.length)
      );
      if (currentIdx !== activeNodeRef.current) {
        activeNodeRef.current = currentIdx;
        setCurrentNodeIdx(currentIdx);
      }
    });
  }, []);

  return (
    <section
      ref={rootRef}
      id="trajectory"
      aria-labelledby="trajectory-title"
      className="relative bg-[#0B0F19] border-t border-white/[0.06]"
      style={{ height: `${SECTION_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-4 sm:px-6 md:px-[6vw] py-12">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between max-w-7xl mx-auto w-full mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Vector Ingestion Path
            </div>
            <h2
              id="trajectory-title"
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight"
            >
              Real-Time Document Telemetry
            </h2>
          </div>

          <div className="font-mono text-xs text-slate-400 uppercase bg-black/40 px-4 py-2 rounded-lg border border-white/[0.06] backdrop-blur-sm">
            Payload Processed:{' '}
            <span ref={bytesRef} className="text-emerald-400 font-bold tabular-nums">
              0
            </span>{' '}
            Bytes
          </div>
        </div>

        {/* Interactive SVG Flow Diagram */}
        <div className="relative flex-1 flex items-center justify-center max-w-6xl mx-auto w-full">
          <svg
            viewBox="0 0 1200 600"
            className="w-full h-auto max-h-[500px]"
            role="img"
            aria-label="Invoice data trajectory vector diagram"
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Inactive Background Rail */}
            <path
              d={PATH_D}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="4"
              strokeDasharray="6 6"
            />

            {/* Active Drawing Flight Path */}
            <path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              filter="url(#glow)"
              strokeLinecap="round"
            />

            {/* Traveling Data Packet Token */}
            <g ref={tokenRef} transform={`translate(${NODES[0].cx}, ${NODES[0].cy})`}>
              <circle r="14" fill="#6366F1" opacity="0.3" className="animate-ping" />
              <circle r="9" fill="#8B5CF6" />
              <circle r="5" fill="#FFFFFF" />
            </g>

            {/* Node Stations */}
            {NODES.map((node, i) => {
              const isPassed = currentNodeIdx >= i;
              const isCurrent = currentNodeIdx === i;
              return (
                <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                  {/* Outer Ring */}
                  <circle
                    r="34"
                    fill="#111827"
                    stroke={
                      isCurrent
                        ? '#8B5CF6'
                        : isPassed
                        ? '#10B981'
                        : 'rgba(255, 255, 255, 0.12)'
                    }
                    strokeWidth={isCurrent ? '3' : '2'}
                  />

                  {/* Inner Status Indicator */}
                  <circle
                    r="26"
                    fill={
                      isCurrent
                        ? 'rgba(139, 92, 246, 0.2)'
                        : isPassed
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)'
                    }
                  />

                  {/* Node Label Text */}
                  <text
                    y="-46"
                    textAnchor="middle"
                    fill={isCurrent ? '#FFFFFF' : '#94A3B8'}
                    fontFamily="Inter, sans-serif"
                    fontSize="13"
                    fontWeight="700"
                  >
                    {node.title}
                  </text>
                  <text
                    y="-62"
                    textAnchor="middle"
                    fill="#64748B"
                    fontFamily="monospace"
                    fontSize="10"
                    fontWeight="600"
                  >
                    0{i + 1}
                  </text>
                  <text
                    y="50"
                    textAnchor="middle"
                    fill="#64748B"
                    fontFamily="monospace"
                    fontSize="10"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Current Stage Status Banner */}
        <div className="max-w-xl mx-auto w-full mt-4 p-4 rounded-xl bg-[#111827] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
              0{currentNodeIdx + 1}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {NODES[currentNodeIdx].title}
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                {NODES[currentNodeIdx].label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-emerald-400 font-medium">
              Pipeline Live
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
