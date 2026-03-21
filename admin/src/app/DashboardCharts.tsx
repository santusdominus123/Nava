'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
} from 'recharts';

interface Props {
  weeklyStreaks: { streak_date: string; count: number }[];
  chatSparkline: number[];
  eventBreakdown: Record<string, number>;
  hourlyActivity: number[];
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    padding: '12px 16px',
  },
  labelStyle: { color: '#94A3B8', fontSize: 11, fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: '#E2E8F0', fontSize: 12 },
};

export default function DashboardCharts({ weeklyStreaks, chatSparkline, eventBreakdown }: Props) {
  const streakData = weeklyStreaks.map((s) => ({
    date: new Date(s.streak_date).toLocaleDateString('en', { weekday: 'short' }),
    users: s.count,
  }));

  // Build chat data for last 7 days
  const chatData = chatSparkline.map((count, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { date: d.toLocaleDateString('en', { weekday: 'short' }), messages: count };
  });

  // Top events for donut chart
  const eventData = Object.entries(eventBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count], i) => ({ name: name.replace(/_/g, ' '), value: count, color: COLORS[i % COLORS.length] }));

  const totalEvents = eventData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Weekly Activity - Gradient Area */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-white">Daily Active Users</h2>
          <span className="text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md bg-dark-700/50">7 days</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Users with streak activity</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={streakData}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2.5} fill="url(#blueGrad)" dot={{ fill: '#3B82F6', stroke: '#0F172A', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Chat Messages */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-white">AI Chat Messages</h2>
          <span className="text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md bg-dark-700/50">7 days</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Messages sent per day</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chatData} barCategoryGap="25%">
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="messages" fill="url(#purpleGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Event Breakdown Donut */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-white">Event Breakdown</h2>
          <span className="text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md bg-dark-700/50">30 days</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">{totalEvents.toLocaleString()} total events</p>
        {eventData.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={eventData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                    {eventData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{totalEvents}</p>
                  <p className="text-[9px] text-gray-500 uppercase">events</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {eventData.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-gray-400 truncate flex-1">{item.name}</span>
                  <span className="text-[11px] font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-gray-600 text-sm">
            No events tracked yet
          </div>
        )}
      </div>
    </div>
  );
}
