'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, TrendingUp, RefreshCw } from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-dark-700/50';
  const intensity = value / max;
  if (intensity > 0.8) return 'bg-blue-400';
  if (intensity > 0.6) return 'bg-blue-500';
  if (intensity > 0.4) return 'bg-blue-500/70';
  if (intensity > 0.2) return 'bg-blue-500/40';
  return 'bg-blue-500/20';
}

export default function EngagementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch('/api/engagement');
    setData(await res.json());
    setLoading(false);
  }

  const heatmap: number[][] = data?.heatmap || Array.from({ length: 7 }, () => new Array(24).fill(0));
  const maxVal = Math.max(...heatmap.flat(), 1);
  const hourTotals: number[] = data?.hourTotals || new Array(24).fill(0);
  const maxHourTotal = Math.max(...hourTotals, 1);

  // Daily trend chart
  const dailyTrend: Record<string, number> = data?.dailyTrend || {};
  const trendDays = Object.keys(dailyTrend).sort();
  const trendValues = trendDays.map(d => dailyTrend[d]);
  const maxTrend = Math.max(...trendValues, 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Engagement</h1>
          <p className="text-gray-400 mt-1">Activity heatmap and engagement patterns (last 30 days)</p>
        </div>
        <button onClick={fetchData} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Total Events</span>
          </div>
          <p className="text-2xl font-bold text-white">{(data?.totalEvents || 0).toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Peak Hour</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{data?.peakHour != null ? `${data.peakHour}:00` : '--'}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-gray-500 font-medium uppercase">Peak Day</span>
          </div>
          <p className="text-2xl font-bold text-violet-400">{data?.peakDay != null ? DAY_NAMES[data.peakDay] : '--'}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">📊</span>
            <span className="text-xs text-gray-500 font-medium uppercase">Avg/Day</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {trendDays.length > 0 ? Math.round(trendValues.reduce((a, b) => a + b, 0) / trendDays.length) : 0}
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-white mb-4">Activity Heatmap — Day x Hour</h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Hour labels */}
            <div className="flex mb-1 ml-12">
              {HOUR_LABELS.filter((_, i) => i % 2 === 0).map(label => (
                <span key={label} className="text-[9px] text-gray-600 font-mono" style={{ width: 'calc(100% / 12)', minWidth: 40 }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap rows */}
            <div className="space-y-1">
              {heatmap.map((dayData, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium w-10 text-right">{DAY_NAMES[dayIdx]}</span>
                  <div className="flex gap-[2px] flex-1">
                    {dayData.map((count, hourIdx) => (
                      <div
                        key={hourIdx}
                        className={`flex-1 h-7 rounded-sm ${getHeatColor(count, maxVal)} transition-all hover:ring-1 hover:ring-blue-400/50 cursor-default`}
                        title={`${DAY_NAMES[dayIdx]} ${HOUR_LABELS[hourIdx]}: ${count} events`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-[10px] text-gray-500">Less</span>
              <div className="w-4 h-4 rounded-sm bg-dark-700/50" />
              <div className="w-4 h-4 rounded-sm bg-blue-500/20" />
              <div className="w-4 h-4 rounded-sm bg-blue-500/40" />
              <div className="w-4 h-4 rounded-sm bg-blue-500/70" />
              <div className="w-4 h-4 rounded-sm bg-blue-500" />
              <div className="w-4 h-4 rounded-sm bg-blue-400" />
              <span className="text-[10px] text-gray-500">More</span>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Distribution Bar Chart */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-white mb-4">Hourly Distribution</h2>
        <div className="flex items-end gap-[3px] h-32">
          {hourTotals.map((count: number, hour: number) => {
            const h = Math.max(2, (count / maxHourTotal) * 128);
            const now = new Date().getHours();
            return (
              <div key={hour} className="flex flex-col items-center flex-1 group cursor-default">
                <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{count}</span>
                <div
                  className={`w-full rounded-t-sm transition-all ${hour === now ? 'bg-blue-400 shadow-lg shadow-blue-400/20' : count > 0 ? 'bg-blue-500/50 hover:bg-blue-500/70' : 'bg-dark-700/50'}`}
                  style={{ height: h }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {[0, 4, 8, 12, 16, 20].map(h => (
            <span key={h} className="text-[9px] text-gray-600 font-mono">{h.toString().padStart(2, '0')}:00</span>
          ))}
        </div>
      </div>

      {/* 30 Day Trend */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">30-Day Activity Trend</h2>
        {trendDays.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-8">No data yet</p>
        ) : (
          <>
            <div className="flex items-end gap-[2px] h-24">
              {trendDays.map(day => {
                const val = dailyTrend[day];
                const h = Math.max(2, (val / maxTrend) * 96);
                return (
                  <div key={day} className="flex-1 group cursor-default relative">
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-violet-500/50 to-violet-400/30 hover:from-violet-500/70 hover:to-violet-400/50 transition-all"
                      style={{ height: h }}
                      title={`${day}: ${val} events`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-gray-600">{trendDays[0]}</span>
              <span className="text-[9px] text-gray-600">{trendDays[trendDays.length - 1]}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
