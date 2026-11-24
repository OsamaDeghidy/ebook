-- ==============================================================================
-- 🚀 SUPABASE MASTER MIGRATION: BOOKLET & DUAL-CANVAS PERSISTENCE (2026-11-24)
-- ==============================================================================
-- Description: Consolidated, idempotent migration script to support booklet
-- storage persistence, sequential segmentation, exercise banks, and chapter pages.

-- 1. Ensure required columns in public.books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS source_file_url TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS blueprint JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS page_offset INT DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS last_processed_page INT DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_pages INT DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_fully_completed BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS original_text TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;

-- 2. Create public.chapter_pages table
CREATE TABLE IF NOT EXISTS public.chapter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL,
  page_label TEXT,
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_book_chapter_page UNIQUE (book_id, chapter_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_chapter_pages_lookup ON public.chapter_pages(book_id, chapter_id, page_number);

-- 3. Create public.chapter_exercises table
CREATE TABLE IF NOT EXISTS public.chapter_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  page_source INT,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq',
  options JSONB DEFAULT '[]'::jsonb,
  model_answer TEXT NOT NULL,
  rubric_criteria JSONB DEFAULT '[]'::jsonb,
  max_score NUMERIC(5,2) DEFAULT 10.0,
  is_generated BOOLEAN DEFAULT false,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_exercises_lookup ON public.chapter_exercises(book_id, chapter_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_exercises ENABLE ROW LEVEL SECURITY;

-- 5. Policies for public.chapter_pages
DROP POLICY IF EXISTS "Public read chapter pages" ON public.chapter_pages;
CREATE POLICY "Public read chapter pages" ON public.chapter_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write chapter pages" ON public.chapter_pages;
CREATE POLICY "Allow write chapter pages" ON public.chapter_pages FOR ALL USING (true) WITH CHECK (true);

-- 6. Policies for public.chapter_exercises
DROP POLICY IF EXISTS "Public read chapter exercises" ON public.chapter_exercises;
CREATE POLICY "Public read chapter exercises" ON public.chapter_exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write chapter exercises" ON public.chapter_exercises;
CREATE POLICY "Allow write chapter exercises" ON public.chapter_exercises FOR ALL USING (true) WITH CHECK (true);

-- 7. Create Supabase Storage Buckets for Booklets and Sliced Pages
INSERT INTO storage.buckets (id, name, public)
VALUES ('booklets', 'booklets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pages', 'book-pages', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage Bucket Policies
DROP POLICY IF EXISTS "Public Access Booklets" ON storage.objects;
CREATE POLICY "Public Access Booklets" ON storage.objects FOR SELECT USING (bucket_id = 'booklets');

DROP POLICY IF EXISTS "Public Access Book Pages" ON storage.objects;
CREATE POLICY "Public Access Book Pages" ON storage.objects FOR SELECT USING (bucket_id = 'book-pages');

DROP POLICY IF EXISTS "Allow Upload Booklets" ON storage.objects;
CREATE POLICY "Allow Upload Booklets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'booklets');

DROP POLICY IF EXISTS "Allow Upload Book Pages" ON storage.objects;
CREATE POLICY "Allow Upload Book Pages" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-pages');

DROP POLICY IF EXISTS "Allow Update Booklets" ON storage.objects;
CREATE POLICY "Allow Update Booklets" ON storage.objects FOR UPDATE USING (bucket_id = 'booklets');

DROP POLICY IF EXISTS "Allow Update Book Pages" ON storage.objects;
CREATE POLICY "Allow Update Book Pages" ON storage.objects FOR UPDATE USING (bucket_id = 'book-pages');
