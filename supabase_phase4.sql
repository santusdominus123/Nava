-- Phase 4: Rate limiting, error logs, and profile enhancements

-- Add reminder_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit logs table
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_user ON rate_limit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created ON rate_limit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_reminder ON profiles(reminder_enabled, reminder_hour);
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium);

-- RLS for error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all error logs" ON error_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- RLS for rate_limit_logs
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limit logs" ON rate_limit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own rate limit logs" ON rate_limit_logs
  FOR SELECT USING (auth.uid() = user_id);
