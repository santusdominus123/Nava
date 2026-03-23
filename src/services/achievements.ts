import { supabase } from '../utils/supabase';

export interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const ALL_BADGES: Badge[] = [
  { key: 'first_prayer', name: 'First Prayer', description: 'Complete your first guided prayer', icon: 'hand-left', color: '#8B5CF6' },
  { key: '7_day_streak', name: '7-Day Streak', description: 'Maintain a 7-day activity streak', icon: 'flame', color: '#F97316' },
  { key: '30_day_streak', name: '30-Day Warrior', description: 'Maintain a 30-day streak', icon: 'trophy', color: '#C9A227' },
  { key: 'first_post', name: 'First Post', description: 'Share your first community post', icon: 'chatbubble', color: '#5A8DEE' },
  { key: '10_verses_saved', name: 'Verse Collector', description: 'Save 10 Bible verses', icon: 'book', color: '#4CAF50' },
  { key: 'group_creator', name: 'Group Creator', description: 'Create your first prayer group', icon: 'people', color: '#E53935' },
  { key: 'first_devotional', name: 'Daily Reader', description: 'Read your first devotional', icon: 'sunny', color: '#F59E0B' },
  { key: '5_prayers_answered', name: 'Faithful', description: 'Mark 5 prayers as answered', icon: 'checkmark-done', color: '#10B981' },
  { key: 'voice_messenger', name: 'Voice Messenger', description: 'Send your first voice note', icon: 'mic', color: '#6366F1' },
  { key: 'bible_scholar', name: 'Bible Scholar', description: 'Ask 50 questions to the AI', icon: 'school', color: '#1C3D5A' },
];

export async function checkAndUnlockBadges(userId: string, context: {
  streakDays?: number;
  savedVersesCount?: number;
  chatCount?: number;
  answeredPrayersCount?: number;
}): Promise<string[]> {
  const newBadges: string[] = [];

  const { data: existing } = await supabase
    .from('user_achievements')
    .select('badge_key')
    .eq('user_id', userId);

  const unlockedKeys = new Set((existing || []).map((a: any) => a.badge_key));

  const toCheck: { key: string; condition: boolean }[] = [
    { key: '7_day_streak', condition: (context.streakDays || 0) >= 7 },
    { key: '30_day_streak', condition: (context.streakDays || 0) >= 30 },
    { key: '10_verses_saved', condition: (context.savedVersesCount || 0) >= 10 },
    { key: 'bible_scholar', condition: (context.chatCount || 0) >= 50 },
    { key: '5_prayers_answered', condition: (context.answeredPrayersCount || 0) >= 5 },
  ];

  for (const check of toCheck) {
    if (check.condition && !unlockedKeys.has(check.key)) {
      try {
        await supabase.from('user_achievements').insert({ user_id: userId, badge_key: check.key });
        newBadges.push(check.key);
      } catch {}
    }
  }

  return newBadges;
}

export async function getUserBadges(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_achievements')
    .select('badge_key')
    .eq('user_id', userId);
  return (data || []).map((a: any) => a.badge_key);
}
