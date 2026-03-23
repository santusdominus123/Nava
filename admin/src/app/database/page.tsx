import { supabase } from '@/lib/supabase';
import { Database, Table, Shield, Key, Hash, Clock } from 'lucide-react';

export const revalidate = 120;

const tables = [
  // Core
  { name: 'profiles', description: 'User profiles with preferences', rls: true, category: 'Core' },
  { name: 'saved_verses', description: 'User saved/bookmarked verses', rls: true, category: 'Core' },
  { name: 'chat_messages', description: 'AI chat conversation history', rls: true, category: 'Core' },
  { name: 'prayer_logs', description: 'User prayer journal entries', rls: true, category: 'Core' },
  { name: 'user_reading_plans', description: 'User progress on reading plans', rls: true, category: 'Core' },
  { name: 'user_streaks', description: 'Daily activity streak tracking', rls: true, category: 'Core' },
  { name: 'verse_notes', description: 'Personal notes on verses', rls: true, category: 'Core' },
  { name: 'user_interests', description: 'Onboarding interest selections', rls: true, category: 'Core' },
  // Content
  { name: 'devotionals', description: 'Daily devotional content', rls: true, category: 'Content' },
  { name: 'daily_devotionals', description: 'Admin-managed daily devotionals', rls: true, category: 'Content' },
  { name: 'verse_of_day', description: 'Daily verse of the day', rls: true, category: 'Content' },
  { name: 'reading_plans', description: 'Bible reading plan definitions', rls: true, category: 'Content' },
  { name: 'reading_plan_days', description: 'Individual days in reading plans', rls: true, category: 'Content' },
  // Social
  { name: 'community_posts', description: 'Social feed posts', rls: true, category: 'Social' },
  { name: 'post_likes', description: 'Post like records', rls: true, category: 'Social' },
  { name: 'post_comments', description: 'Comments on posts', rls: true, category: 'Social' },
  { name: 'post_reactions', description: 'Emoji reactions on posts', rls: true, category: 'Social' },
  { name: 'post_bookmarks', description: 'User bookmarked posts', rls: true, category: 'Social' },
  { name: 'post_reports', description: 'Reported content for moderation', rls: true, category: 'Social' },
  { name: 'prayer_requests', description: 'Community prayer requests', rls: true, category: 'Social' },
  { name: 'prayer_request_prayers', description: 'Users praying for requests', rls: true, category: 'Social' },
  { name: 'prayer_groups', description: 'Prayer group definitions', rls: true, category: 'Social' },
  { name: 'prayer_group_members', description: 'Group membership records', rls: true, category: 'Social' },
  { name: 'group_messages', description: 'Group chat messages', rls: true, category: 'Social' },
  { name: 'activity_feed', description: 'User activity log entries', rls: true, category: 'Social' },
  // Engagement
  { name: 'user_achievements', description: 'Unlocked badges and achievements', rls: true, category: 'Engagement' },
  // Moderation
  { name: 'banned_words', description: 'Auto-moderation banned word list', rls: true, category: 'Moderation' },
  // System
  { name: 'push_tokens', description: 'Expo push notification tokens', rls: true, category: 'System' },
  { name: 'analytics_events', description: 'App analytics tracking', rls: true, category: 'System' },
  { name: 'error_logs', description: 'Client error reports', rls: true, category: 'System' },
  { name: 'rate_limit_logs', description: 'API rate limit audit log', rls: true, category: 'System' },
];

const categories = ['Core', 'Content', 'Social', 'Engagement', 'Moderation', 'System'];
const categoryColors: Record<string, string> = {
  Core: 'from-blue-500 to-blue-600',
  Content: 'from-violet-500 to-violet-600',
  Social: 'from-emerald-500 to-emerald-600',
  Engagement: 'from-rose-500 to-rose-600',
  Moderation: 'from-red-500 to-red-600',
  System: 'from-amber-500 to-amber-600',
};
const categoryBadgeColors: Record<string, string> = {
  Core: 'bg-blue-500/15 text-blue-400',
  Content: 'bg-violet-500/15 text-violet-400',
  Social: 'bg-emerald-500/15 text-emerald-400',
  Engagement: 'bg-rose-500/15 text-rose-400',
  Moderation: 'bg-red-500/15 text-red-400',
  System: 'bg-amber-500/15 text-amber-400',
};

async function getTableCounts() {
  const counts: Record<string, number> = {};
  for (const t of tables) {
    try {
      const { count } = await supabase.from(t.name).select('*', { count: 'exact', head: true });
      counts[t.name] = count ?? 0;
    } catch {
      counts[t.name] = 0;
    }
  }
  return counts;
}

export default async function DatabasePage() {
  const counts = await getTableCounts();
  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Database</h1>
        <p className="text-gray-400 mt-1">Supabase PostgreSQL schema overview</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tables</p>
          <p className="text-2xl font-bold text-white mt-1">{tables.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Rows</p>
          <p className="text-2xl font-bold text-white mt-1">{totalRows.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">RLS Enabled</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{tables.filter(t => t.rls).length}/{tables.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Migrations</p>
          <p className="text-2xl font-bold text-white mt-1">4</p>
        </div>
      </div>

      {/* Tables by Category */}
      {categories.map((cat) => {
        const catTables = tables.filter(t => t.category === cat);
        return (
          <div key={cat} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${categoryColors[cat]}`} />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{cat}</h2>
              <span className="text-[10px] text-gray-600">{catTables.length} tables</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {catTables.map((table) => (
                <div key={table.name} className="glass-card rounded-xl p-4 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${categoryColors[cat]} flex items-center justify-center`}>
                        <Table className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-mono">{table.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{table.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700/30">
                    <div className="flex items-center gap-2">
                      {table.rls && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400">
                          <Shield className="w-2.5 h-2.5" /> RLS
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${categoryBadgeColors[cat]}`}>{cat}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-bold text-gray-400">{(counts[table.name] || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Storage Buckets */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Storage Buckets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[
            { name: 'post-images', description: 'Community post image attachments' },
            { name: 'user-avatars', description: 'User profile avatar photos' },
            { name: 'group-avatars', description: 'Prayer group avatar images' },
            { name: 'chat-audio', description: 'Voice message audio files' },
            { name: 'devotional-images', description: 'Devotional cover images' },
          ].map((bucket) => (
            <div key={bucket.name} className="glass-card rounded-xl p-4 card-hover">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-mono">{bucket.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{bucket.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-700/30">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-400">
                  <Shield className="w-2.5 h-2.5" /> Public
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Info */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-3">Connection</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Project Ref</p>
            <code className="text-xs font-mono text-blue-400">univyfkzocecqstdgtoy</code>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">API URL</p>
            <code className="text-xs font-mono text-blue-400">https://univyfkzocecqstdgtoy.supabase.co</code>
          </div>
        </div>
      </div>
    </div>
  );
}
