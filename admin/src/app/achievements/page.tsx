import { supabase } from '@/lib/supabase';
import { Award, Trophy, Users, Star } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

export const revalidate = 30;

const BADGE_CONFIG: Record<string, { name: string; description: string; color: string }> = {
  first_prayer: { name: 'First Prayer', description: 'Complete first guided prayer', color: 'violet' },
  '7_day_streak': { name: '7-Day Streak', description: 'Maintain a 7-day streak', color: 'amber' },
  '30_day_streak': { name: '30-Day Warrior', description: 'Maintain a 30-day streak', color: 'orange' },
  first_post: { name: 'First Post', description: 'Share first community post', color: 'blue' },
  '10_verses_saved': { name: 'Verse Collector', description: 'Save 10 Bible verses', color: 'emerald' },
  group_creator: { name: 'Group Creator', description: 'Create a prayer group', color: 'teal' },
  first_devotional: { name: 'Daily Reader', description: 'Read first devotional', color: 'yellow' },
  '5_prayers_answered': { name: 'Faithful', description: 'Mark 5 prayers answered', color: 'green' },
  voice_messenger: { name: 'Voice Messenger', description: 'Send first voice note', color: 'indigo' },
  bible_scholar: { name: 'Bible Scholar', description: 'Ask 50 questions to AI', color: 'purple' },
};

async function getAchievementData() {
  const { data: achievements } = await supabase
    .from('user_achievements')
    .select('*')
    .order('unlocked_at', { ascending: false });

  const entries = achievements || [];
  const uniqueUsers = new Set(entries.map((a: any) => a.user_id)).size;

  // Count per badge
  const badgeCounts: Record<string, number> = {};
  entries.forEach((a: any) => {
    badgeCounts[a.badge_key] = (badgeCounts[a.badge_key] || 0) + 1;
  });

  const mostPopular = Object.entries(badgeCounts).sort(([, a], [, b]) => b - a)[0];

  return { entries, totalBadges: entries.length, uniqueUsers, badgeCounts, mostPopular };
}

export default async function AchievementsPage() {
  const data = await getAchievementData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Achievements</h1>
        <p className="text-gray-400 mt-1">User badge management and distribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatsCard title="Total Badges Unlocked" value={data.totalBadges} icon={Award} color="amber" />
        <StatsCard title="Users with Badges" value={data.uniqueUsers} icon={Users} color="blue" />
        <StatsCard title="Most Popular" value={data.mostPopular ? BADGE_CONFIG[data.mostPopular[0]]?.name || data.mostPopular[0] : '—'} icon={Trophy} color="purple" change={data.mostPopular ? `${data.mostPopular[1]} unlocked` : ''} changeType="neutral" />
      </div>

      {/* Badge Distribution */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-white mb-4">Badge Distribution</h2>
        <div className="space-y-3">
          {Object.entries(BADGE_CONFIG).map(([key, config]) => {
            const count = data.badgeCounts[key] || 0;
            const maxCount = Math.max(...Object.values(data.badgeCounts), 1);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md bg-${config.color}-500/15 flex items-center justify-center`}>
                      <Star className={`w-3 h-3 text-${config.color}-400`} />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">{config.name}</span>
                    <span className="text-[10px] text-gray-600">{config.description}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5">
                  <div className={`bg-gradient-to-r from-${config.color}-500 to-${config.color}-400 h-1.5 rounded-full transition-all`} style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Unlocks */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">Recent Unlocks</h2>
        <div className="space-y-2">
          {data.entries.slice(0, 20).map((entry: any, i: number) => {
            const config = BADGE_CONFIG[entry.badge_key] || { name: entry.badge_key, color: 'gray' };
            return (
              <div key={i} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${config.color}-500/10 flex items-center justify-center`}>
                    <Award className={`w-4 h-4 text-${config.color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{config.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{entry.user_id?.slice(0, 16)}...</p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500">
                  {entry.unlocked_at ? new Date(entry.unlocked_at).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
            );
          })}
          {data.entries.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-8">No badges unlocked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
