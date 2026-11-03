-- ==============================================================================
-- 🏛️ EL MAESTRO MASTER SUPABASE MIGRATION (COMPLETE REVISION 2026)
-- ==============================================================================

-- 1. جدول ذاكرة التعلم الذاتي التراكمي (AI Continuous Self-Learning Memory)
CREATE TABLE IF NOT EXISTS public.ai_pedagogical_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  mistake_pattern TEXT NOT NULL,
  correction_rule TEXT NOT NULL,
  source_context TEXT,
  severity TEXT DEFAULT 'warning',
  applied_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الريلز التعليمية المتزامنة سحابياً (EduReels Cloud Store)
CREATE TABLE IF NOT EXISTS public.edu_reels (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  script TEXT NOT NULL,
  audio_url TEXT,
  style JSONB DEFAULT '{}'::jsonb,
  scenes JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  author_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تحديث جدول كروت السناتر (Vouchers) بحقول الربط بالمعلمين
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT 'المعلم المعتمد';
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'student';
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS batch_id TEXT;

-- 4. تحديث جدول المقررات (Books) بكافة حقول التحصين البيداغوجي
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS curriculum_stage TEXT DEFAULT 'عام';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_voice_narrator BOOLEAN DEFAULT true;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS has_interactive_lab BOOLEAN DEFAULT true;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS extracted_images JSONB DEFAULT '[]'::jsonb;

-- 5. تفعيل سياسات الأمان والحماية (RLS)
ALTER TABLE public.ai_pedagogical_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ai memory" ON public.ai_pedagogical_memory;
CREATE POLICY "Public read ai memory" ON public.ai_pedagogical_memory FOR SELECT USING (true);

DROP POLICY IF EXISTS "System insert ai memory" ON public.ai_pedagogical_memory;
CREATE POLICY "System insert ai memory" ON public.ai_pedagogical_memory FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read reels" ON public.edu_reels;
CREATE POLICY "Public read reels" ON public.edu_reels FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Instructors manage own reels" ON public.edu_reels;
CREATE POLICY "Instructors manage own reels" ON public.edu_reels FOR ALL USING (true);

-- تنشيط كاش الـ PostgREST
NOTIFY pgrst, 'reload schema';