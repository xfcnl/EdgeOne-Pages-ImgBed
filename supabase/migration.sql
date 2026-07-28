-- EdgeOne-Pages-ImgBed: Database Schema
-- Run this in Supabase SQL Editor

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 1. Images table
CREATE TABLE images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  thumbnail   TEXT,
  filename    TEXT NOT NULL,
  size        BIGINT,
  mime_type   TEXT,
  width       INT,
  height      INT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  metadata    JSONB DEFAULT '{}'
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_images_select" ON images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_images_insert" ON images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "own_images_delete" ON images
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);

-- 2. Albums table
CREATE TABLE albums (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_albums_select" ON albums
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_albums_insert" ON albums
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "own_albums_update" ON albums
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_albums_delete" ON albums
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_albums_user_id ON albums(user_id);

-- 3. Album-Images junction table
CREATE TABLE album_images (
  album_id    UUID REFERENCES albums(id) ON DELETE CASCADE,
  image_id    UUID REFERENCES images(id) ON DELETE CASCADE,
  sort_order  INT DEFAULT 0,
  added_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (album_id, image_id)
);

ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_album_images_select" ON album_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM albums WHERE id = album_id AND user_id = auth.uid())
  );

CREATE POLICY "own_album_images_insert" ON album_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM albums WHERE id = album_id AND user_id = auth.uid())
  );

CREATE POLICY "own_album_images_delete" ON album_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM albums WHERE id = album_id AND user_id = auth.uid())
  );

CREATE INDEX idx_album_images_album ON album_images(album_id);
CREATE INDEX idx_album_images_image ON album_images(image_id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('edgeone-pages-imgbed', 'edgeone-pages-imgbed', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "give_authenticated_users_access_to_bucket" ON storage.objects
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_public_read_access" ON storage.objects
  FOR SELECT USING (bucket_id = 'edgeone-pages-imgbed');
