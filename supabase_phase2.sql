-- =============================================
-- PHASE 2: Additional Tables
-- =============================================

CREATE TABLE IF NOT EXISTS reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_color TEXT DEFAULT '#1C3D5A',
  total_days INTEGER NOT NULL DEFAULT 7,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, day_number)
);

CREATE TABLE IF NOT EXISTS user_reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, plan_id)
);

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('devotional', 'prayer', 'chat', 'reading_plan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, activity_type)
);

CREATE TABLE IF NOT EXISTS verse_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  note TEXT,
  highlight_color TEXT DEFAULT '#C9A227',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_reading_plan_days_plan ON reading_plan_days(plan_id, day_number);
CREATE INDEX IF NOT EXISTS idx_user_reading_plans_user ON user_reading_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_date ON user_streaks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_verse_notes_user ON verse_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- RLS
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON reading_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can view plan days" ON reading_plan_days FOR SELECT USING (true);

ALTER TABLE user_reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_reading_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_reading_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_reading_plans FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE verse_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON verse_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON verse_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON verse_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON verse_notes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tokens" ON push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tokens" ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tokens" ON push_tokens FOR DELETE USING (auth.uid() = user_id);

-- SEED: Reading Plans
INSERT INTO reading_plans (id, title, description, cover_color, total_days, is_premium) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Psalms of Comfort', 'Find peace and strength through the most comforting Psalms.', '#5A8DEE', 7, false),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'The Life of Jesus', 'Walk through the key moments of Jesus'' life and ministry.', '#1C3D5A', 7, false),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Proverbs for Wisdom', 'Daily wisdom from the book of Proverbs for modern life.', '#C9A227', 7, false),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Faith in Hard Times', 'Scriptures to strengthen your faith during trials.', '#8B5CF6', 7, true),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Love & Relationships', 'Biblical wisdom for building healthy relationships.', '#E53935', 7, true)
ON CONFLICT DO NOTHING;

INSERT INTO reading_plan_days (plan_id, day_number, title, verse_reference, verse_text, reflection) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 1, 'The Lord is My Shepherd', 'Psalm 23:1-3', 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.', 'God provides everything you need. Rest in His provision today.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 2, 'God is Our Refuge', 'Psalm 46:1-3', 'God is our refuge and strength, a very present help in trouble. Therefore we will not fear though the earth gives way.', 'No matter what shakes around you, God remains your unshakeable foundation.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 3, 'Fearfully Made', 'Psalm 139:13-14', 'For you formed my inward parts; you knitted me together in my mother''s womb. I praise you, for I am fearfully and wonderfully made.', 'You are not an accident. Every detail of your life was crafted with divine intention.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 4, 'Joy in the Morning', 'Psalm 30:5', 'For his anger is but for a moment, and his favor is for a lifetime. Weeping may tarry for the night, but joy comes with the morning.', 'Your current pain is temporary. Hold on — joy is on its way.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 5, 'Wait on the Lord', 'Psalm 27:13-14', 'I believe that I shall look upon the goodness of the Lord in the land of the living! Wait for the Lord; be strong, and let your heart take courage.', 'Waiting is not passive — it is an active trust in God''s perfect timing.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 6, 'He Heals the Brokenhearted', 'Psalm 147:3', 'He heals the brokenhearted and binds up their wounds.', 'Bring your broken pieces to God. He specializes in restoration.'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 7, 'Blessed Assurance', 'Psalm 91:1-2', 'He who dwells in the shelter of the Most High will abide in the shadow of the Almighty. I will say to the Lord, "My refuge and my fortress, my God, in whom I trust."', 'You have completed this journey. Carry this assurance with you always.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 1, 'The Birth of Hope', 'Luke 2:10-11', 'The angel said to them, "Fear not, for behold, I bring you good news of great joy. For unto you is born this day in the city of David a Savior, who is Christ the Lord."', 'The greatest story ever told began in the humblest of places.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 2, 'Baptism and Beginning', 'Matthew 3:16-17', 'And when Jesus was baptized, the heavens were opened to him, and he saw the Spirit of God descending like a dove. A voice from heaven said, "This is my beloved Son."', 'Jesus'' public ministry began with divine affirmation. You too are beloved.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 3, 'The Sermon on the Mount', 'Matthew 5:3-4', 'Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they shall be comforted.', 'Jesus turned the world''s values upside down. True blessing comes through humility.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 4, 'Walking on Water', 'Matthew 14:29-31', 'He said, "Come." So Peter got out of the boat and walked on the water and came to Jesus. But when he saw the wind, he was afraid.', 'Keep your eyes on Jesus, not on the storm around you.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 5, 'The Last Supper', 'John 13:34-35', 'A new commandment I give to you, that you love one another: just as I have loved you, you also are to love one another.', 'Love is not just a feeling — it is the defining mark of a follower of Christ.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 6, 'The Cross', 'John 19:30', 'When Jesus had received the sour wine, he said, "It is finished," and he bowed his head and gave up his spirit.', 'The most powerful words ever spoken. Your debt has been paid in full.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 7, 'The Resurrection', 'Matthew 28:5-6', 'The angel said to the women, "Do not be afraid, for I know that you seek Jesus who was crucified. He is not here, for he has risen, as he said."', 'Death could not hold Him. And because He lives, you can face tomorrow.')
ON CONFLICT DO NOTHING;
