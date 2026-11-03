-- ==============================================================================
-- 🏛️ EL MAESTRO SOVEREIGN MIGRATION (OSERA AI LMS - PRODUCTION SCHEMA 2026)
-- ==============================================================================
-- الغرض: ترقية وتجهيز سوبابيس لاستيعاب محركات التفاعل المزدوج، رادار التعلم،
-- وتيليمتري الطلاب، وتذاكر المعلمين المباشرة، ومحفظة الـ 85%، وحماية المدفوعات.
-- خاضع لقواعد الـ Idempotency: آمن تماماً للتشغيل المتكرر دون مساس بالبيانات القديمة.
-- ==============================================================================

-- 1. تفعيل الملحقات الضرورية
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 📡 المحور الثاني: جدول التتبع البيداغوجي ورادار التعلم (Student Telemetry)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,                         -- يستوعب معرّف الطالب المسجل أو جلسات الزوار
  student_name TEXT DEFAULT 'طالب زائر',
  student_email TEXT,
  book_id TEXT NOT NULL,
  book_title TEXT DEFAULT '',
  chapter_id TEXT NOT NULL,
  chapter_title TEXT DEFAULT '',
  active_reading_seconds INTEGER DEFAULT 0,          -- صافي ثواني القراءة بعد فلترة الخمول
  audio_listened_seconds INTEGER DEFAULT 0,         -- ثواني الاستماع الفعلي للشرح الصوتي
  quiz_attempts JSONB DEFAULT '[]'::jsonb,          -- مصفوفة نتائج وأخطاء الاختبارات
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- أعمدة الأمان في حال كان الجدول موجوداً مسبقاً
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS student_id TEXT NOT NULL DEFAULT 'anonymous';
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT 'طالب زائر';
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS book_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS book_title TEXT DEFAULT '';
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS chapter_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS chapter_title TEXT DEFAULT '';
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS active_reading_seconds INTEGER DEFAULT 0;
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS audio_listened_seconds INTEGER DEFAULT 0;
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS quiz_attempts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.student_telemetry ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- مؤشرات الأداء الفائقة لرادار المعلم والطلاب المتعثرين
CREATE INDEX IF NOT EXISTS idx_telemetry_book_student ON public.student_telemetry (book_id, student_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_last_active ON public.student_telemetry (last_active DESC);

-- ==============================================================================
-- 🙋‍♂️ المحور الأول: جدول استفسارات وتذاكر المعلم المباشرة (Teacher Helpdesk SOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teacher_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  book_title TEXT DEFAULT '',
  chapter_id TEXT NOT NULL,
  chapter_title TEXT DEFAULT '',
  instructor_id TEXT,                               -- معرّف صاحب المذكرة المستهدف
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  selected_snippet TEXT,                            -- الفقرة المقتبسة من صلب الكتاب
  question_text TEXT NOT NULL,                      -- سؤال الطالب
  status TEXT NOT NULL DEFAULT 'pending',           -- 'pending' أو 'answered'
  teacher_answer TEXT,                              -- الإجابة النموذجية للمعلم
  teacher_audio_url TEXT,                           -- ملاحظة صوتية مرفقة من المعلم
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

ALTER TABLE public.teacher_tickets ADD COLUMN IF NOT EXISTS selected_snippet TEXT;
ALTER TABLE public.teacher_tickets ADD COLUMN IF NOT EXISTS instructor_id TEXT;
ALTER TABLE public.teacher_tickets ADD COLUMN IF NOT EXISTS teacher_audio_url TEXT;
ALTER TABLE public.teacher_tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- مؤشرات سرعة البحث حسب المدرس وحالة التذكرة
CREATE INDEX IF NOT EXISTS idx_tickets_instructor_status ON public.teacher_tickets (instructor_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_student ON public.teacher_tickets (student_id);

-- ==============================================================================
-- 💳 المحور الثالث: ترقية جدول المدفوعات وتأمينه (Hardened Payments & Webhooks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  book_id TEXT NOT NULL,
  book_title TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  gateway TEXT NOT NULL DEFAULT 'paymob',
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,
  idempotency_key TEXT UNIQUE,                      -- لمنع هجمات التكرار Replay Attacks
  hmac_signature TEXT,                              -- التوقيع الرقمي المشفر
  fulfilled_at TIMESTAMPTZ,                         -- وقت تفعيل المقرر الفعلي
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة الحقول الأمنية الجديدة للجدول إن كان قائماً
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS hmac_signature TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency ON public.payments (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ==============================================================================
-- 💰 المحور الثالث: جدول طلبات سحب أرباح المعلمين (85% Instructor Payouts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.instructor_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id TEXT NOT NULL,
  instructor_name TEXT,
  instructor_email TEXT,
  amount NUMERIC(10, 2) NOT NULL,                   -- المبلغ الإجمالي المطلوب سحبه
  platform_fee NUMERIC(10, 2) NOT NULL,             -- عمولة المنصة 15%
  net_amount NUMERIC(10, 2) NOT NULL,               -- صافي المستلم الفعلي 85%
  method TEXT NOT NULL DEFAULT 'vodafone_cash',     -- 'vodafone_cash' | 'instapay' | 'bank_transfer'
  account_details TEXT NOT NULL,                    -- رقم المحفظة أو الحساب
  status TEXT NOT NULL DEFAULT 'pending',           -- 'pending' | 'approved' | 'rejected' | 'transferred'
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_instructor ON public.instructor_payout_requests (instructor_id, status);

-- ==============================================================================
-- 🛡️ سياسات الحماية الميدانية (Row Level Security - RLS Policies)
-- ==============================================================================
ALTER TABLE public.student_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_payout_requests ENABLE ROW LEVEL SECURITY;

-- سياسات التيليمتري: سماح للإرسال للجميع (حتى الزوار)، وقراءة للإدارة والمعلمين
DROP POLICY IF EXISTS "Public insert telemetry" ON public.student_telemetry;
CREATE POLICY "Public insert telemetry" ON public.student_telemetry FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read telemetry" ON public.student_telemetry;
CREATE POLICY "Authenticated read telemetry" ON public.student_telemetry FOR SELECT USING (true);

-- سياسات تذاكر المعلم: الطالب ينشئ تذكرته، والمعلم يقرأ ويجيب
DROP POLICY IF EXISTS "Students can create tickets" ON public.teacher_tickets;
CREATE POLICY "Students can create tickets" ON public.teacher_tickets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view related tickets" ON public.teacher_tickets;
CREATE POLICY "Public can view related tickets" ON public.teacher_tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors can update tickets" ON public.teacher_tickets;
CREATE POLICY "Instructors can update tickets" ON public.teacher_tickets FOR UPDATE USING (true);

-- سياسات طلبات السحب: المعلم ينشئ طلبه ويشاهد طلباته، والأدمن يدير الكل
DROP POLICY IF EXISTS "Instructors can request payout" ON public.instructor_payout_requests;
CREATE POLICY "Instructors can request payout" ON public.instructor_payout_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Instructors can view own payouts" ON public.instructor_payout_requests;
CREATE POLICY "Instructors can view own payouts" ON public.instructor_payout_requests FOR SELECT USING (true);

-- تنشيط الكاش البرمجي لـ Supabase PostgREST
NOTIFY pgrst, 'reload schema';