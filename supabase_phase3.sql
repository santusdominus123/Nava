-- =============================================
-- PHASE 3: Social, Analytics, Onboarding Tables
-- =============================================

-- USER INTERESTS (onboarding preferences)
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL CHECK (interest IN ('prayer', 'study', 'devotional', 'community', 'meditation')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

-- PRAYER REQUESTS (social)
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  prayer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRAYER REQUEST PRAYERS (who prayed for what)
CREATE TABLE IF NOT EXISTS prayer_request_prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- PRAYER GROUPS
CREATE TABLE IF NOT EXISTS prayer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_color TEXT DEFAULT '#1C3D5A',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRAYER GROUP MEMBERS
CREATE TABLE IF NOT EXISTS prayer_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES prayer_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- COMMUNITY POSTS (shared verses, reflections)
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES prayer_groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  verse_reference TEXT,
  verse_text TEXT,
  post_type TEXT DEFAULT 'reflection' CHECK (post_type IN ('reflection', 'prayer_request', 'testimony', 'verse_share')),
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POST LIKES
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  screen_name TEXT,
  session_id TEXT,
  platform TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER DAILY REMINDER SETTINGS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_hour INTEGER DEFAULT 8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_minute INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user ON prayer_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_recent ON prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_groups_public ON prayer_groups(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON prayer_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON prayer_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_group ON community_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_recent ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, created_at DESC);

-- =============================================
-- RLS POLICIES
-- =============================================

-- User interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);

-- Prayer requests
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prayer requests" ON prayer_requests FOR SELECT USING (true);
CREATE POLICY "Users can create prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests" ON prayer_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own requests" ON prayer_requests FOR DELETE USING (auth.uid() = user_id);

-- Prayer request prayers
ALTER TABLE prayer_request_prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prayers" ON prayer_request_prayers FOR SELECT USING (true);
CREATE POLICY "Users can pray" ON prayer_request_prayers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prayer groups
ALTER TABLE prayer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public groups" ON prayer_groups FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Users can create groups" ON prayer_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update groups" ON prayer_groups FOR UPDATE USING (auth.uid() = created_by);

-- Group members
ALTER TABLE prayer_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group members" ON prayer_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON prayer_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON prayer_group_members FOR DELETE USING (auth.uid() = user_id);

-- Community posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (auth.uid() = user_id);

-- Post likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Analytics (insert only for users, select for admins via service role)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Increment prayer count
CREATE OR REPLACE FUNCTION increment_prayer_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_prayer_added ON prayer_request_prayers;
CREATE TRIGGER on_prayer_added
  AFTER INSERT ON prayer_request_prayers
  FOR EACH ROW EXECUTE FUNCTION increment_prayer_count();

-- Increment like count
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_added ON post_likes;
CREATE TRIGGER on_like_added
  AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION increment_like_count();

-- Decrement like count
CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_removed ON post_likes;
CREATE TRIGGER on_like_removed
  AFTER DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_like_count();

-- Increment member count
CREATE OR REPLACE FUNCTION increment_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prayer_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_member_joined ON prayer_group_members;
CREATE TRIGGER on_member_joined
  AFTER INSERT ON prayer_group_members
  FOR EACH ROW EXECUTE FUNCTION increment_member_count();
