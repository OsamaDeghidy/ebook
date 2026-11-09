import React from 'react';
import { 
  Building2, ShieldCheck, Target, Sparkles, Award, 
  Users, CheckCircle2, ArrowLeft, Phone, Mail, Globe, Brain, BookOpen, GraduationCap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export function AboutPageView() {
  const navigate = useNavigate();
  const { dir, t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-10" dir={dir}>
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl backdrop-blur-md transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-black border border-teal-400/30">
            <Building2 className="w-3.5 h-3.5" />
            <span>منصة ebook osera ai للحلول والتعليم الذكي</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
          عن منصة <span className="text-teal-400">ebook osera ai</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-base max-w-3xl mt-4 leading-relaxed font-medium">
          المنصة التعليمية الأولى عربياً المتخصصة في إعادة ابتكار المذكرات والكتب الدراسية وتحويلها إلى بيئات تعلم تفاعلية متعددة الوسائط (Multimodal AI Learning Ecosystem)، تجمع بين الشرح الأكاديمي الرصين، البودكاست الحواري، ريلز المراجعة السريعة، والاختبارات التقييمية الذكية.
        </p>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 mt-8 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-xl sm:text-2xl font-black text-teal-400">+50,000</span>
            <span className="text-[11px] text-slate-300 font-bold">سؤال في بنك الأسئلة</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-xl sm:text-2xl font-black text-amber-400">100%</span>
            <span className="text-[11px] text-slate-300 font-bold">تغطية للمناهج العربية</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-xl sm:text-2xl font-black text-indigo-400">40-60s</span>
            <span className="text-[11px] text-slate-300 font-bold">مدة الريلز التعليمي</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-xl sm:text-2xl font-black text-emerald-400">24/7</span>
            <span className="text-[11px] text-slate-300 font-bold">معلم ذكي متاح دائماً</span>
          </div>
        </div>
      </div>

      {/* MISSION & VISION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">رسالتنا التعليمية</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            تمكين كل طالب عربي في مختلف المراحل الدراسية والجامعية من الوصول إلى محتوى تعليمي تفاعلي عالي الجودة يُبسط أصعب المفاهيم الرياضية والعلمية واللغوية عبر وسائط حديثة تناسب الجيل الرقمي.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Brain className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">رؤيتنا التقنية</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            الريادة في توظيف نماذج الذكاء الاصطناعي التوليدي والتعلم الصوتي والبصري لتوفير تجربة تعليمية مخصصة لكل طالب ومساعدة المعلمين على مضاعفة أثرهم الأكاديمي وحماية حقوقهم الفكرية.
          </p>
        </div>
      </div>

      {/* CORE VALUES & E-E-A-T STANDARDS */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-600 block">معايير الجودة والمصداقية</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">ركائز الأمان والجودة في ebook osera ai</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-600 font-black text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>دقة علمية معيارية</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              تتم مراجعة المخرجات الأكاديمية والنماذج التوليدية لتتوافق بدقة مع المناهج الوزارية المعتمدة والكتب المدرسية الرسمية.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
              <Users className="w-4 h-4" />
              <span>حماية حقوق المعلمين</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              علامات مائية رقمية ذكية لحماية المذكرات والكتب من التسريب مع توفير نظام كروت وإحصائيات متكامل للسناتر التعليمية.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
              <GraduationCap className="w-4 h-4" />
              <span>تعلم متعدد الوسائط</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              تنوع فريد بين القراءة المعمقة، البودكاست الصوتي، الريلز السريعة، والاختبارات التفاعلية لضمان ثبات المعلومة.
            </p>
          </div>
        </div>
      </div>

      {/* COMPANY OFFICIAL INFO & CONTACT */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-md border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h4 className="font-black text-lg text-white">منصة ebook osera ai</h4>
            <p className="text-xs text-slate-300 mt-1">تطوير منظومات التعلم الرقمي والذكاء الاصطناعي التوليدي</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-black">
            سجل تجاري وبطاقة ضريبية معتمدة
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <Phone className="w-4 h-4 text-teal-400 shrink-0" />
            <span>الهاتف / واتساب: +201066906132</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <Mail className="w-4 h-4 text-teal-400 shrink-0" />
            <span>البريد: support@osera-ai.com</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
            <Globe className="w-4 h-4 text-teal-400 shrink-0" />
            <span>الموقع: www.ebook.osera-ai.com</span>
          </div>
        </div>
      </div>

    </div>
  );
}
