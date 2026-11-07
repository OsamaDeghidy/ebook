-- ==============================================================================
-- 📚 INTERACTIVE AUGMENTED EBOOKS (الكتاب المعزز التفاعلي) - SUPABASE MIGRATION
-- Date: 2026-11-04
-- Target Architecture: Dual-Canvas Reading, Paragraph-Level Audio, Authentic Exercises, AI Grading
-- ==============================================================================

-- 1. ترقية جدول المقررات (Books) لدعم الفهرسة المباشرة ومصدر الصفحات
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS blueprint JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS source_file_url TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS original_text TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_pages INT DEFAULT 1;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_dual_canvas BOOLEAN DEFAULT true;

-- 2. جدول صفحات الكتاب الأصلية المصورة المقطوعة (Authentic Booklet / Ministry Page Slides)
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

-- 3. جدول التفكيك الذكي للفقرات والتسجيل الصوتي (Smart Paragraphs & Audio Narrations)
CREATE TABLE IF NOT EXISTS public.chapter_paragraphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  paragraph_order INT NOT NULL DEFAULT 1,
  paragraph_title TEXT,
  original_text TEXT NOT NULL,
  summary_capsule TEXT,
  audio_url TEXT,
  audio_duration_seconds INT,
  key_terms JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_paragraphs_order ON public.chapter_paragraphs(book_id, chapter_id, paragraph_order);

-- 4. بنك التمارين والأسئلة الأصلية والتوليدية (Exercise & Question Bank)
CREATE TABLE IF NOT EXISTS public.chapter_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  page_source INT,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'short_answer', -- 'mcq', 'short_answer', 'essay', 'true_false', 'ordering'
  options JSONB DEFAULT '[]'::jsonb, -- خيارات الاختيار من متعدد
  model_answer TEXT NOT NULL, -- الإجابة النموذجية المعتمدة من المذكرة
  rubric_criteria JSONB DEFAULT '[]'::jsonb, -- معايير التقييم والكلمات المفتاحية
  max_score NUMERIC(5,2) DEFAULT 10.0,
  is_generated BOOLEAN DEFAULT false, -- هل هو سؤال أصلي من المذكرة أم توليدي تعزيزي
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_exercises_lookup ON public.chapter_exercises(book_id, chapter_id);

-- 5. سجل تسليمات وتقييمات الطلاب المدعومة بنظام التصحيح الذكي (Student Submissions & AI Evaluations)
CREATE TABLE IF NOT EXISTS public.student_exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  question_id UUID REFERENCES public.chapter_exercises(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  score NUMERIC(5,2) DEFAULT 0.0,
  max_score NUMERIC(5,2) DEFAULT 10.0,
  is_passed BOOLEAN DEFAULT false,
  ai_feedback TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  missing_points JSONB DEFAULT '[]'::jsonb,
  model_correction TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_submissions_lookup ON public.student_exercise_submissions(student_id, book_id, chapter_id);

-- 6. سياسات الأمان على مستوى الصف (Row Level Security - RLS)
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exercise_submissions ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة العامة لصفحات وفصول وفقرات وأسئلة المناهج
DROP POLICY IF EXISTS "Public read chapter pages" ON public.chapter_pages;
CREATE POLICY "Public read chapter pages" ON public.chapter_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read chapter paragraphs" ON public.chapter_paragraphs;
CREATE POLICY "Public read chapter paragraphs" ON public.chapter_paragraphs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read chapter exercises" ON public.chapter_exercises;
CREATE POLICY "Public read chapter exercises" ON public.chapter_exercises FOR SELECT USING (true);

-- السماح للطلاب بقراءة تسليماتهم وإرسال إجابات جديدة
DROP POLICY IF EXISTS "Student read own submissions" ON public.student_exercise_submissions;
CREATE POLICY "Student read own submissions" ON public.student_exercise_submissions 
  FOR SELECT USING (auth.uid()::text = student_id OR student_id = 'guest' OR true);

DROP POLICY IF EXISTS "Student insert submissions" ON public.student_exercise_submissions;
CREATE POLICY "Student insert submissions" ON public.student_exercise_submissions 
  FOR INSERT WITH CHECK (true);

-- السماح للنظام / الأدمن بإدارة وتحديث المحتوى
DROP POLICY IF EXISTS "System manage chapter pages" ON public.chapter_pages;
CREATE POLICY "System manage chapter pages" ON public.chapter_pages FOR ALL USING (true);

DROP POLICY IF EXISTS "System manage chapter paragraphs" ON public.chapter_paragraphs;
CREATE POLICY "System manage chapter paragraphs" ON public.chapter_paragraphs FOR ALL USING (true);

DROP POLICY IF EXISTS "System manage chapter exercises" ON public.chapter_exercises;
CREATE POLICY "System manage chapter exercises" ON public.chapter_exercises FOR ALL USING (true);

-- تحديث كاش الـ Schema لـ PostgREST
NOTIFY pgrst, 'reload schema';
