import { supabase } from '../utils/supabase';

// ── Profile ──────────────────────────────────────────────────────────

export async function syncProfile(
  userId: string,
  data: {
    name?: string;
    dark_mode?: boolean;
    notifications_enabled?: boolean;
    daily_reminder?: boolean;
    has_finished_onboarding?: boolean;
  },
) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...data }, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    console.error('syncProfile error:', err);
  }
}

export async function fetchProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('fetchProfile error:', err);
    return null;
  }
}

// ── Saved Verses ─────────────────────────────────────────────────────

export async function syncSavedVerses(
  userId: string,
  verses: Array<{
    id: string;
    verse: { reference: string; text: string };
    savedAt: Date;
  }>,
) {
  try {
    // Delete all existing saved verses for this user
    const { error: deleteError } = await supabase
      .from('saved_verses')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    if (verses.length === 0) return;

    // Insert new verses
    const rows = verses.map((v) => ({
      user_id: userId,
      reference: v.verse.reference,
      text: v.verse.text,
      saved_at: v.savedAt,
    }));

    const { error: insertError } = await supabase
      .from('saved_verses')
      .insert(rows);

    if (insertError) throw insertError;
  } catch (err) {
    console.error('syncSavedVerses error:', err);
  }
}

export async function fetchSavedVerses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('saved_verses')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      verse: {
        reference: row.reference,
        text: row.text,
      },
      savedAt: new Date(row.saved_at),
    }));
  } catch (err) {
    console.error('fetchSavedVerses error:', err);
    return [];
  }
}

// ── Chat Messages ────────────────────────────────────────────────────

export async function syncChatMessages(
  userId: string,
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: Date;
  }>,
) {
  try {
    const rows = messages.map((m) => ({
      id: m.id,
      user_id: userId,
      role: m.role,
      content: m.content,
      created_at: m.timestamp,
    }));

    const { error } = await supabase
      .from('chat_messages')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;
  } catch (err) {
    console.error('syncChatMessages error:', err);
  }
}

export async function fetchChatMessages(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.created_at),
    }));
  } catch (err) {
    console.error('fetchChatMessages error:', err);
    return [];
  }
}

// ── Streaks ──────────────────────────────────────────────────────────

export async function logStreak(
  userId: string,
  activityType: 'devotional' | 'prayer' | 'chat' | 'reading_plan',
) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { error } = await supabase
      .from('user_streaks')
      .upsert(
        { user_id: userId, date: today, activity_type: activityType },
        { onConflict: 'user_id,date,activity_type', ignoreDuplicates: true },
      );

    if (error) throw error;
  } catch (err) {
    console.error('logStreak error:', err);
  }
}

export async function fetchWeeklyStreaks(userId: string) {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    // Calculate Monday of the current week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const mondayStr = monday.toISOString().split('T')[0];

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_streaks')
      .select('date, activity_type')
      .eq('user_id', userId)
      .gte('date', mondayStr)
      .lte('date', sundayStr)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      date: row.date,
      activity_type: row.activity_type,
    }));
  } catch (err) {
    console.error('fetchWeeklyStreaks error:', err);
    return [];
  }
}

export async function fetchCurrentStreak(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    // Get unique dates in descending order
    const uniqueDates = [...new Set(data.map((row: any) => row.date))];

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (err) {
    console.error('fetchCurrentStreak error:', err);
    return 0;
  }
}
