import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose';
  sparkline?: number[];
}

const colorMap = {
  blue: { bg: 'from-blue-500/20 to-blue-600/5', text: 'text-blue-400', glow: 'glow-blue', icon: 'from-blue-500 to-blue-600' },
  green: { bg: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-400', glow: 'glow-green', icon: 'from-emerald-500 to-emerald-600' },
  purple: { bg: 'from-violet-500/20 to-violet-600/5', text: 'text-violet-400', glow: 'glow-purple', icon: 'from-violet-500 to-violet-600' },
  amber: { bg: 'from-amber-500/20 to-amber-600/5', text: 'text-amber-400', glow: 'glow-amber', icon: 'from-amber-500 to-amber-600' },
  rose: { bg: 'from-rose-500/20 to-rose-600/5', text: 'text-rose-400', glow: 'glow-blue', icon: 'from-rose-500 to-rose-600' },
};

export default function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon, color = 'blue', sparkline }: StatsCardProps) {
  const c = colorMap[color];
  const changeColor = { positive: 'text-emerald-400', negative: 'text-red-400', neutral: 'text-gray-400' }[changeType];

  return (
    <div className={`glass-card rounded-2xl p-6 card-hover relative overflow-hidden`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-white tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            {change && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${changeColor}`}>
                {changeType === 'positive' && <span>↑</span>}
                {changeType === 'negative' && <span>↓</span>}
                {change}
              </div>
            )}
          </div>

          {/* Mini sparkline */}
          {sparkline && sparkline.length > 0 && (
            <div className="flex items-end gap-[3px] h-10">
              {sparkline.map((v, i) => {
                const max = Math.max(...sparkline, 1);
                const h = Math.max(4, (v / max) * 40);
                return (
                  <div
                    key={i}
                    className={`w-[5px] rounded-full ${c.text} opacity-60`}
                    style={{ height: h, backgroundColor: 'currentColor' }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
