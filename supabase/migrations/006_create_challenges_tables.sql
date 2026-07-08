-- Migration: Create challenges, challenge_submissions, and challenge_votes tables
-- This enables the weekly magic challenge feature

-- Challenges table (weekly challenges)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge submissions table (user video submissions)
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id) -- One submission per user per challenge
);

-- Challenge votes table (voting system)
CREATE TABLE IF NOT EXISTS challenge_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, user_id) -- One vote per user per submission
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user_id ON challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_submission_id ON challenge_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_user_id ON challenge_votes(user_id);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;

-- Policies for challenges (public read, admin write)
CREATE POLICY "Public can read challenges" ON challenges
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN')
  );

CREATE POLICY "Admins can update challenges" ON challenges
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN')
  );

-- Policies for challenge_submissions
CREATE POLICY "Users can read all submissions" ON challenge_submissions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own submission" ON challenge_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submission" ON challenge_submissions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for challenge_votes
CREATE POLICY "Users can read all votes" ON challenge_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own vote" ON challenge_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote" ON challenge_votes
  FOR DELETE USING (auth.uid() = user_id);
