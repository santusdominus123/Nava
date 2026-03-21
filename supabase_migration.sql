-- =============================================
-- BibleGuideAI Database Tables
-- =============================================

-- 1. PROFILES - User profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Friend',
  dark_mode BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  daily_reminder BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  premium_plan TEXT CHECK (premium_plan IN ('monthly', 'yearly')),
  premium_expires_at TIMESTAMPTZ,
  has_finished_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SAVED_VERSES - Bookmarked verses
CREATE TABLE IF NOT EXISTS saved_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  text TEXT NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHAT_MESSAGES - AI chat history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEVOTIONALS - Daily devotional logs
CREATE TABLE IF NOT EXISTS devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  reflection TEXT,
  prayer TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 5. PRAYER_LOGS - Prayer session tracking
CREATE TABLE IF NOT EXISTS prayer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_saved_verses_user ON saved_verses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_devotionals_user_date ON devotionals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_user ON prayer_logs(user_id, created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SAVED_VERSES policies
CREATE POLICY "Users can view own verses" ON saved_verses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verses" ON saved_verses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own verses" ON saved_verses FOR DELETE USING (auth.uid() = user_id);

-- CHAT_MESSAGES policies
CREATE POLICY "Users can view own chats" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- DEVOTIONALS policies
CREATE POLICY "Users can view own devotionals" ON devotionals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devotionals" ON devotionals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devotionals" ON devotionals FOR UPDATE USING (auth.uid() = user_id);

-- PRAYER_LOGS policies
CREATE POLICY "Users can view own prayers" ON prayer_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prayers" ON prayer_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Friend'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
