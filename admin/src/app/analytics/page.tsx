import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, Eye, MousePointerClick, Users, Zap } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import AnalyticsCharts from './AnalyticsCharts';

export const revalidate = 30;

async function getAnalytics() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const yesterdayStart = new Date(Date.now() - 86400000).toISOString();

  const [
    { data: events },
    { data: events30d },
    { data: dailyActive },
    { count: todayEvents },
    { count: yesterdayEvents },
  ] = await Promise.all([
    supabase.from('analytics_events').select('event_name, created_at, user_id').gte('created_at', sevenDaysAgo),
    supabase.from('analytics_events').select('event_name, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('user_streaks').select('streak_date, user_id').gte('streak_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayStart).lt('created_at', new Date().toISOString().split('T')[0]),
  ]);

  // Event counts by type (7d)
  const eventCounts: Record<string, number> = {};
  (events || []).forEach((e: any) => {
    eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
  });

  // Event counts by type (30d)
  const eventCounts30d: Record<string, number> = {};
  (events30d || []).forEach((e: any) => {
    eventCounts30d[e.event_name] = (eventCounts30d[e.event_name] || 0) + 1;
  });

  // Unique users (7d)
  const uniqueUsers = new Set((events || []).map((e: any) => e.user_id).filter(Boolean));

  // Events per day (30d trend)
  const eventsPerDay: Record<string, number> = {};
  (events30d || []).forEach((e: any) => {
    const day = new Date(e.created_at).toISOString().split('T')[0];
    eventsPerDay[day] = (eventsPerDay[day] || 0) + 1;
  });
  const eventsTrend = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    eventsTrend.push({ date: d, count: eventsPerDay[d] || 0 });
  }

  // DAU trend (30d)
  const dauMap: Record<string, Set<string>> = {};
  (dailyActive || []).forEach((s: any) => {
    if (!dauMap[s.streak_date]) dauMap[s.streak_date] = new Set();
    dauMap[s.streak_date].add(s.user_id);
  });
  const dauTrend = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    dauTrend.push({ date: d, count: dauMap[d]?.size || 0 });
  }

  // Top users
  const userActivity: Record<string, number> = {};
  (events || []).forEach((e: any) => {
    if (e.user_id) userActivity[e.user_id] = (userActivity[e.user_id] || 0) + 1;
  });
  const topActiveUsers = Object.entries(userActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([id, count]) => ({ id: id.slice(0, 8) + '...', count }));

  // Events sparkline (7d)
  const eventsSparkline = eventsTrend.slice(-7).map(d => d.count);

  return {
    eventCounts,
    eventCounts30d,
    topActiveUsers,
    dauTrend,
    eventsTrend,
    totalEvents7d: events?.length || 0,
    totalEvents30d: events30d?.length || 0,
    uniqueUsers7d: uniqueUsers.size,
    todayEvents: todayEvents ?? 0,
    yesterdayEvents: yesterdayEvents ?? 0,
    eventsSparkline,
  };
}

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  const eventGrowth = a.yesterdayEvents > 0 ? (((a.todayEvents - a.yesterdayEvents) / a.yesterdayEvents) * 100).toFixed(0) : '0';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-gray-400 mt-1">Deep insights into user behavior and engagement</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatsCard title="Events Today" value={a.todayEvents} icon={Zap} color="blue" change={`${eventGrowth}% vs yesterday`} changeType={Number(eventGrowth) >= 0 ? 'positive' : 'negative'} />
        <StatsCard title="Events (7d)" value={a.totalEvents7d} icon={BarChart3} color="purple" sparkline={a.eventsSparkline} change={`${a.totalEvents30d} in 30d`} changeType="neutral" />
        <StatsCard title="Unique Users (7d)" value={a.uniqueUsers7d} icon={Users} color="green" change="Active users" changeType="neutral" />
        <StatsCard title="Avg Events/Day" value={Math.round(a.totalEvents30d / 30)} icon={TrendingUp} color="amber" change="30-day average" changeType="neutral" />
      </div>

      {/* Event Type Cards */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Event Types (7 days)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Object.entries(a.eventCounts)
            .sort(([, x], [, y]) => y - x)
            .slice(0, 12)
            .map(([name, count]) => (
              <div key={name} className="glass-card rounded-xl p-4 card-hover">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide truncate">{name.replace(/_/g, ' ')}</p>
                <p className="text-xl font-bold text-white mt-1">{count.toLocaleString()}</p>
                {a.eventCounts30d[name] && (
                  <p className="text-[10px] text-gray-600 mt-1">{a.eventCounts30d[name]} in 30d</p>
                )}
              </div>
            ))}
          {Object.keys(a.eventCounts).length === 0 && (
            <div className="col-span-full glass-card rounded-xl p-12 text-center">
              <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No events tracked yet</p>
              <p className="text-gray-600 text-xs mt-1">Analytics events will appear once users interact with the app</p>
            </div>
          )}
        </div>
      </div>

      <AnalyticsCharts dauTrend={a.dauTrend} topUsers={a.topActiveUsers} eventsTrend={a.eventsTrend} />
    </div>
  );
}
