-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Practice Videos Table (for magic practice submissions)
CREATE TABLE IF NOT EXISTS practice_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  author TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_role TEXT NOT NULL,
  technique_category TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}'
);

-- Forum Threads Table (for discussions and techniques)
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_role TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replies INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}'
);

-- Forum Replies Table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE
);

-- Material Links Table (for magic resources and tutorials)
CREATE TABLE IF NOT EXISTS material_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  added_by TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Table (for technical critiques of practice videos)
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES practice_videos(id) ON DELETE CASCADE,
  analysis_text TEXT NOT NULL,
  technical_score INTEGER,
  performance_score INTEGER,
  suggestions TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  areas_for_improvement TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT NOT NULL
);

-- Magic Events Table (for congresses and conventions)
CREATE TABLE IF NOT EXISTS magic_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  registration_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (for authentication and user management)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'APPRENTICE',
  specialties TEXT[] DEFAULT '{}',
  practice_schedule TEXT,
  avatar TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_videos_technique_category ON practice_videos(technique_category);
CREATE INDEX IF NOT EXISTS idx_practice_videos_created_at ON practice_videos(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_videos_difficulty_level ON practice_videos(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at ON forum_threads(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned ON forum_threads(pinned);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_material_links_subcategory_id ON material_links(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_video_id ON ai_analyses(video_id);
CREATE INDEX IF NOT EXISTS idx_magic_events_event_date ON magic_events(event_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);

-- Auto-create user profile on signup (is_approved defaults to false)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment counters
CREATE OR REPLACE FUNCTION increment(column_name TEXT, table_name TEXT, row_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  current_value := current_value + 1;
  
  EXECUTE format('UPDATE %I SET %I = $2 WHERE id = $1', table_name, column_name)
  USING row_id, current_value;
  
  RETURN current_value;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE practice_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for practice_videos (allow all operations for now)
CREATE POLICY "Enable all operations on practice_videos" ON practice_videos
  FOR ALL USING (true);

-- Policies for forum_threads (allow all operations for now)
CREATE POLICY "Enable all operations on forum_threads" ON forum_threads
  FOR ALL USING (true);

-- Policies for forum_replies (allow all operations for now)
CREATE POLICY "Enable all operations on forum_replies" ON forum_replies
  FOR ALL USING (true);

-- Policies for material_links (allow all operations for now)
CREATE POLICY "Enable all operations on material_links" ON material_links
  FOR ALL USING (true);

-- Policies for ai_analyses (allow all operations for now)
CREATE POLICY "Enable all operations on ai_analyses" ON ai_analyses
  FOR ALL USING (true);

-- Policies for magic_events (allow all operations for now)
CREATE POLICY "Enable all operations on magic_events" ON magic_events
  FOR ALL USING (true);

-- Policies for users
DROP POLICY IF EXISTS "Enable all operations on users" ON users;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );
