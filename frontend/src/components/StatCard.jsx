import React from 'react';

const StatCard = ({ title, value, icon, description, trend, trendType = 'neutral' }) => {
  const trendColor = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div className="glass-card flex items-start justify-between relative overflow-hidden group hover:border-brand-500/30">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-colors duration-300 pointer-events-none" />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-3xl font-bold text-slate-100 tracking-tight">{value}</span>
        
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${trendColor[trendType]}`}>
                {trend}
              </span>
            )}
            {description && <span className="text-xs text-slate-500">{description}</span>}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-darkBg-850 p-3 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 shadow-md">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
