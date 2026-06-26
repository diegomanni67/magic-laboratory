-- ============================================================
-- Laboratorio: comentarios/feedback sobre las prácticas subidas
-- (la tabla practice_videos ya existía en el schema original)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES practice_videos(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_comments_video_id ON practice_comments(video_id);

ALTER TABLE practice_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations on practice_comments" ON practice_comments;
CREATE POLICY "Enable all operations on practice_comments" ON practice_comments
  FOR ALL USING (true);

-- ============================================================
-- Crónicas: relatos y experiencias de los magos
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'anecdota',
  author TEXT NOT NULL,
  author_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS story_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(category);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations on stories" ON stories;
DROP POLICY IF EXISTS "Enable all operations on story_comments" ON story_comments;
CREATE POLICY "Enable all operations on stories" ON stories
  FOR ALL USING (true);
CREATE POLICY "Enable all operations on story_comments" ON story_comments
  FOR ALL USING (true);

-- Función para incrementar vistas de una crónica de forma atómica
CREATE OR REPLACE FUNCTION increment_story_views(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stories SET views = views + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Archivo Maestro: curaduría manual de excelencia (solo admins
-- pueden agregar/editar/borrar; cualquiera puede leer)
-- ============================================================
CREATE TABLE IF NOT EXISTS master_archive (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tecnica',
  link_url TEXT,
  added_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_archive_category ON master_archive(category);
CREATE INDEX IF NOT EXISTS idx_master_archive_created_at ON master_archive(created_at);

ALTER TABLE master_archive ENABLE ROW LEVEL SECURITY;

-- Lectura pública. Ojo: a propósito NO hay policy de INSERT/UPDATE/DELETE
-- para anon/authenticated -- esas operaciones solo las puede hacer el
-- cliente admin (service role) desde las API routes, después de verificar
-- en el servidor que el usuario tiene role = 'ADMIN' en la tabla users.
DROP POLICY IF EXISTS "Anyone can read master_archive" ON master_archive;
CREATE POLICY "Anyone can read master_archive" ON master_archive
  FOR SELECT USING (true);
