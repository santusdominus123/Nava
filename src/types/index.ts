export interface Verse {
  reference: string;
  text: string;
}

export interface Devotional {
  id: string;
  date: string;
  verse: Verse;
  reflection: string;
  prayer: string;
}

export interface PrayerCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  steps: PrayerStep[];
}

export interface PrayerStep {
  title: string;
  instruction: string;
  duration: number; // seconds
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SavedVerse {
  id: string;
  verse: Verse;
  savedAt: Date;
}

export interface UserProfile {
  name: string;
  darkMode: boolean;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  cover_color: string;
  total_days: number;
  is_premium: boolean;
}

export interface ReadingPlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  verse_reference: string;
  verse_text: string;
  reflection: string;
}

export interface UserReadingPlan {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

export interface StreakDay {
  date: string;
  activity_type: 'devotional' | 'prayer' | 'chat' | 'reading_plan';
}

export interface VerseNote {
  id: string;
  user_id: string;
  verse_reference: string;
  verse_text: string;
  note: string;
  highlight_color: string;
  created_at: string;
  updated_at: string;
}

export interface PremiumStatus {
  isPremium: boolean;
  plan: 'monthly' | 'yearly' | null;
  expiresAt: Date | null;
}
