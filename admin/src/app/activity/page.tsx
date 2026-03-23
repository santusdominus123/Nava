'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ACTION_COLORS: Record<string, string> = {
  created_post: 'text-blue-400 bg-blue-500/10',
  commented: 'text-violet-400 bg-violet-500/10',
  prayer_request: 'text-rose-400 bg-rose-500/10',
  prayed_for: 'text-amber-400 bg-amber-500/10',
  completed_prayer: 'text-emerald-400 bg-emerald-500/10',
  created_group: 'text-teal-400 bg-teal-500/10',
  post_created: 'text-blue-400 bg-blue-500/10',
  comment_created: 'text-violet-400 bg-violet-500/10',
  prayer_answered: 'text-emerald-400 bg-emerald-500/10',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setActivities(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = activities.filter(a => a.created_at?.startsWith(todayStr)).length;
  const actionTypes = Array.from(new Set(activities.map(a => a.action)));
  const mostActive = actionTypes.reduce((max, action) => {
    const count = activities.filter(a => a.action === action).length;
    return count > (max.count || 0) ? { action, count } : max;
  }, { action: '', count: 0 } as { action: string; count: number });

  const filtered = actionFilter === 'all' ? activities : activities.filter(a => a.action === actionFilter);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Activity Feed</h1>
          <p className="text-gray-400 mt-1">Real-time user activity log — auto-refreshes every 10s</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-gray-300 font-medium">Live</span>
          </div>
          <button onClick={fetchActivities} className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-blue-400" /><span className="text-xs text-gray-500 font-medium uppercase">Total</span></div>
          <p className="text-2xl font-bold text-white">{activities.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-sm">📅</span><span className="text-xs text-gray-500 font-medium uppercase">Today</span></div>
          <p className="text-2xl font-bold text-white">{todayCount}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-sm">🔥</span><span className="text-xs text-gray-500 font-medium uppercase">Most Active</span></div>
          <p className="text-sm font-bold text-white">{mostActive.action || '—'}</p>
          <p className="text-xs text-gray-500">{mostActive.count} times</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <button onClick={() => setActionFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${actionFilter === 'all' ? 'bg-blue-500/15 text-blue-400' : 'text-gray-500 hover:text-white'}`}>All</button>
        {actionTypes.map(action => (
          <button key={action} onClick={() => setActionFilter(action)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${actionFilter === action ? 'bg-blue-500/15 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
            {action}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading && activities.length === 0 ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="glass-card rounded-xl p-4"><div className="h-3 w-1/4 rounded shimmer mb-2" /><div className="h-3 w-2/3 rounded shimmer" /></div>))}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16">
          <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => {
            const colorClass = ACTION_COLORS[item.action] || 'text-gray-400 bg-gray-500/10';
            return (
              <div key={item.id || i} className="glass-card rounded-xl p-4 card-hover flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass.split(' ')[1]}`}>
                  <Activity className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colorClass}`}>{item.action}</span>
                    <span className="text-[11px] text-gray-500">{timeAgo(item.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1 truncate">{item.description || '—'}</p>
                </div>
                <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{item.user_id?.slice(0, 8)}...</span>
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <span className="text-[9px] text-gray-600 bg-dark-700 rounded px-2 py-1 font-mono flex-shrink-0">{JSON.stringify(item.metadata).slice(0, 40)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
