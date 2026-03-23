import { supabase } from '@/lib/supabase';
import { Users, Crown, Heart, TrendingUp, MessageSquare, BookOpen, Flame, Globe, AlertTriangle, Award, Bookmark, ThumbsUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import DashboardCharts from './DashboardCharts';

export const revalidate = 30;

async function getStats() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: totalPrayers },
    { count: totalChatMessages },
    { count: totalPosts },
    { count: totalDevotionals },
    { data: recentSignups },
    { data: weeklyStreaks },
    { data: recentActivity },
    { data: chatByDay },
    { count: pendingReports },
    { count: totalBadges },
    { count: totalBookmarks },
    { count: totalReactions },
    { count: totalComments },
    { count: totalGroups },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('prayer_logs').select('*', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
    supabase.from('community_posts').select('*', { count: 'exact', head: true }),
    supabase.from('devotionals').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, email, is_premium, streak_count, created_at').order('created_at', { ascending: false }).limit(8),
    supabase.from('user_streaks').select('streak_date, count').gte('streak_date', sevenDaysAgo).order('streak_date'),
    supabase.from('analytics_events').select('event_name, created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(200),
    supabase.from('chat_messages').select('created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('created_at'),
    supabase.from('post_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('user_achievements').select('*', { count: 'exact', head: true }),
    supabase.from('post_bookmarks').select('*', { count: 'exact', head: true }),
    supabase.from('post_reactions').select('*', { count: 'exact', head: true }),
    supabase.from('post_comments').select('*', { count: 'exact', head: true }),
    supabase.from('prayer_groups').select('*', { count: 'exact', head: true }),
  ]);

  const { count: activeToday } = await supabase
    .from('user_streaks')
    .select('*', { count: 'exact', head: true })
    .eq('streak_date', todayStr);

  // Build sparklines from weekly streaks
  const streakSparkline = (weeklyStreaks || []).map((s: any) => s.count || 0);
  while (streakSparkline.length < 7) streakSparkline.unshift(0);

  // Chat messages per day (last 7 days)
  const chatPerDay: Record<string, number> = {};
  (chatByDay || []).forEach((m: any) => {
    const day = new Date(m.created_at).toISOString().split('T')[0];
    chatPerDay[day] = (chatPerDay[day] || 0) + 1;
  });
  const chatSparkline: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    chatSparkline.push(chatPerDay[d] || 0);
  }

  // Event breakdown for pie chart
  const eventBreakdown: Record<string, number> = {};
  (recentActivity || []).forEach((e: any) => {
    eventBreakdown[e.event_name] = (eventBreakdown[e.event_name] || 0) + 1;
  });

  // Activity heatmap (last 30 days by hour)
  const hourlyActivity: number[] = new Array(24).fill(0);
  (recentActivity || []).forEach((e: any) => {
    const hour = new Date(e.created_at).getHours();
    hourlyActivity[hour]++;
  });

  return {
    totalUsers: totalUsers ?? 0,
    premiumUsers: premiumUsers ?? 0,
    totalPrayers: totalPrayers ?? 0,
    totalChatMessages: totalChatMessages ?? 0,
    totalPosts: totalPosts ?? 0,
    totalDevotionals: totalDevotionals ?? 0,
    activeToday: activeToday ?? 0,
    recentSignups: recentSignups ?? [],
    weeklyStreaks: weeklyStreaks ?? [],
    streakSparkline,
    chatSparkline,
    eventBreakdown,
    hourlyActivity,
    conversionRate: totalUsers ? ((premiumUsers ?? 0) / totalUsers * 100).toFixed(1) : '0',
    pendingReports: pendingReports ?? 0,
    totalBadges: totalBadges ?? 0,
    totalBookmarks: totalBookmarks ?? 0,
    totalReactions: totalReactions ?? 0,
    totalComments: totalComments ?? 0,
    totalGroups: totalGroups ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{greeting}, Admin</h1>
          <p className="text-gray-400 mt-1">Here&apos;s what&apos;s happening with Nava today</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-gray-300 font-medium">Live</span>
          </div>
          <div className="glass-card rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-400">{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatsCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" sparkline={stats.streakSparkline} change={`${stats.activeToday} active today`} changeType="positive" />
        <StatsCard title="Premium Subscribers" value={stats.premiumUsers} icon={Crown} color="amber" change={`${stats.conversionRate}% conversion`} changeType="positive" />
        <StatsCard title="AI Conversations" value={stats.totalChatMessages} icon={MessageSquare} color="purple" sparkline={stats.chatSparkline} change="Last 7 days" changeType="neutral" />
        <StatsCard title="Total Prayers" value={stats.totalPrayers} icon={Heart} color="rose" change={`${stats.totalPosts} community posts`} changeType="neutral" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Active Today', value: stats.activeToday, icon: '🟢' },
          { label: 'Devotionals', value: stats.totalDevotionals, icon: '📖' },
          { label: 'Community Posts', value: stats.totalPosts, icon: '💬' },
          { label: 'Streak Rate', value: stats.totalUsers > 0 ? `${((stats.activeToday / stats.totalUsers) * 100).toFixed(0)}%` : '0%', icon: '🔥' },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-4 card-hover">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
          </div>
        ))}
      </div>

      {/* Community & Engagement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Comments', value: stats.totalComments, color: 'text-violet-400' },
          { label: 'Reactions', value: stats.totalReactions, color: 'text-pink-400' },
          { label: 'Bookmarks', value: stats.totalBookmarks, color: 'text-amber-400' },
          { label: 'Badges', value: stats.totalBadges, color: 'text-emerald-400' },
          { label: 'Groups', value: stats.totalGroups, color: 'text-teal-400' },
          { label: 'Pending Reports', value: stats.pendingReports, color: stats.pendingReports > 0 ? 'text-red-400' : 'text-gray-400' },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-3 card-hover">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{item.label}</span>
            <p className={`text-lg font-bold mt-0.5 ${item.color}`}>{item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        weeklyStreaks={stats.weeklyStreaks}
        chatSparkline={stats.chatSparkline}
        eventBreakdown={stats.eventBreakdown}
        hourlyActivity={stats.hourlyActivity}
      />

      {/* Bottom section: Recent Signups + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        {/* Recent Signups */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Signups</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest user registrations</p>
            </div>
            <span className="text-xs text-gray-500 px-3 py-1.5 rounded-lg bg-dark-700/50">{stats.totalUsers} total</span>
          </div>
          <div className="space-y-1">
            {stats.recentSignups.map((user: any, i: number) => (
              <div key={user.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                      ['bg-gradient-to-br from-blue-500 to-blue-600', 'bg-gradient-to-br from-violet-500 to-violet-600', 'bg-gradient-to-br from-emerald-500 to-emerald-600', 'bg-gradient-to-br from-amber-500 to-amber-600', 'bg-gradient-to-br from-rose-500 to-rose-600'][i % 5]
                    }`}>
                      {(user.full_name || user.email || '?')[0].toUpperCase()}
                    </div>
                    {user.is_premium && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                        <Crown className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{user.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {user.streak_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-orange-400 font-medium">{user.streak_count}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-gray-500 font-mono">
                    {new Date(user.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
            {stats.recentSignups.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No users yet</p>
                <p className="text-gray-600 text-xs mt-1">Users will appear here once they sign up</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Engagement Score */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Engagement Score</h3>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Overall Health</span>
                <span className="text-xs font-bold text-emerald-400">
                  {stats.totalUsers > 0 ? Math.min(100, Math.round((stats.activeToday / Math.max(stats.totalUsers, 1)) * 100 + (stats.premiumUsers / Math.max(stats.totalUsers, 1)) * 200 + (stats.totalChatMessages > 0 ? 30 : 0))) : 0}%
                </span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, stats.totalUsers > 0 ? Math.round((stats.activeToday / Math.max(stats.totalUsers, 1)) * 100 + (stats.premiumUsers / Math.max(stats.totalUsers, 1)) * 200 + (stats.totalChatMessages > 0 ? 30 : 0)) : 0)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{stats.activeToday}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">DAU</p>
              </div>
              <div className="text-center border-x border-dark-700">
                <p className="text-lg font-bold text-white">{stats.conversionRate}%</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">CVR</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{stats.totalUsers > 0 ? Math.round(stats.totalChatMessages / stats.totalUsers) : 0}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Msg/User</p>
              </div>
            </div>
          </div>

          {/* Top Events */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Top Events (30d)</h3>
            <div className="space-y-3">
              {Object.entries(stats.eventBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => {
                  const maxCount = Math.max(...Object.values(stats.eventBreakdown), 1);
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400 truncate max-w-[150px]">{name}</span>
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-violet-500 h-1.5 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(stats.eventBreakdown).length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No events tracked yet</p>
              )}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Peak Activity Hours</h3>
            <div className="flex items-end justify-between gap-[2px] h-16">
              {stats.hourlyActivity.map((count: number, hour: number) => {
                const max = Math.max(...stats.hourlyActivity, 1);
                const h = Math.max(2, (count / max) * 64);
                const isNow = new Date().getHours() === hour;
                return (
                  <div key={hour} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-full rounded-sm transition-all ${isNow ? 'bg-blue-400' : count > 0 ? 'bg-blue-500/40' : 'bg-dark-700'}`}
                      style={{ height: h }}
                      title={`${hour}:00 — ${count} events`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-gray-600">00:00</span>
              <span className="text-[9px] text-gray-600">06:00</span>
              <span className="text-[9px] text-gray-600">12:00</span>
              <span className="text-[9px] text-gray-600">18:00</span>
              <span className="text-[9px] text-gray-600">23:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
