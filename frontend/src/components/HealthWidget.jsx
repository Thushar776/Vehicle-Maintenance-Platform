import React from 'react';

const HealthWidget = ({ score, size = 120 }) => {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'stroke-emerald-500';
  let textClass = 'text-emerald-400';
  let bgClass = 'bg-emerald-500/10 border-emerald-500/20';
  let statusText = 'Excellent';
  let descText = 'Vehicle requires no immediate attention.';

  if (score < 50) {
    colorClass = 'stroke-rose-500';
    textClass = 'text-rose-400';
    bgClass = 'bg-rose-500/10 border-rose-500/20';
    statusText = 'Critical';
    descText = 'Immediate service overdue for essential systems.';
  } else if (score < 80) {
    colorClass = 'stroke-amber-500';
    textClass = 'text-amber-400';
    bgClass = 'bg-amber-500/10 border-amber-500/20';
    statusText = 'Warning';
    descText = 'Service is due soon for some parts.';
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-darkBg-900/40 border border-darkBg-850 shadow-inner">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Radial SVG Gauge */}
        <svg className="w-full h-full transform -rotate-95" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-darkBg-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Centered Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-100 tracking-tight">{score}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Health</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-1.5 ${bgClass}`}>
          {statusText}
        </span>
        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
          {descText}
        </p>
      </div>
    </div>
  );
};

export default HealthWidget;
