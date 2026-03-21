'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from 'recharts';

interface Props {
  dauTrend: { date: string; count: number }[];
  topUsers: { id: string; count: number }[];
  eventsTrend: { date: string; count: number }[];
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    padding: '12px 16px',
  },
  labelStyle: { color: '#94A3B8', fontSize: 11 },
  itemStyle: { color: '#E2E8F0', fontSize: 12 },
};

export default function AnalyticsCharts({ dauTrend, topUsers, eventsTrend }: Props) {
  return (
    <div className="space-y-6">
      {/* Full-width event trend */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-white">Event Volume (30 days)</h2>
          <span className="text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md bg-dark-700/50">
            {eventsTrend.reduce((a, b) => a + b.count, 0).toLocaleString()} total
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">All tracked events per day</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={eventsTrend}>
            <defs>
              <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              interval={4}
            />
            <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={35} />
            <Tooltip {...tooltipStyle} labelFormatter={(d) => new Date(d as string).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} />
            <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} fill="url(#eventGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAU Trend */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-white">Daily Active Users</h2>
            <span className="text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md bg-dark-700/50">30 days</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Unique users with streaks</p>
          {dauTrend.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dauTrend}>
                <defs>
                  <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en', { day: 'numeric' })}
                  interval={5}
                />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={25} />
                <Tooltip {...tooltipStyle} labelFormatter={(d) => new Date(d as string).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fill="url(#dauGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-600 text-sm">No DAU data yet</div>
          )}
        </div>

        {/* Most Active Users */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-white">Most Active Users</h2>
            <span className="text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md bg-dark-700/50">7 days</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">By event count</p>
          {topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, i) => {
                const max = Math.max(...topUsers.map(u => u.count), 1);
                const colors = ['from-blue-500 to-blue-600', 'from-violet-500 to-violet-600', 'from-emerald-500 to-emerald-600', 'from-amber-500 to-amber-600'];
                return (
                  <div key={user.id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-[9px] text-white font-bold`}>
                          {i + 1}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{user.id}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{user.count} events</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-1.5">
                      <div className={`bg-gradient-to-r ${colors[i % colors.length]} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${(user.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-600 text-sm">No user activity yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
