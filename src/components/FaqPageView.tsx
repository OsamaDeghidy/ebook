import React, { useState } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, 
  Video, Mic, ShieldCheck, GraduationCap, Laptop, Award, ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface FaqItem {
  question: string;
  answer: string;
  category: 'general' | 'students' | 'instructors' | 'ai_features';
}

export const FAQ_DATA: FaqItem[] = [
  {
    category: 'general',
    question: 'ما هي منصة ebook osera ai؟',
    answer: 'منصة ebook osera ai هي المنصة التعليمية العربية الأولى المتخصصة في تحويل الكتب والمذكرات والمقررات الدراسية (PDF) إلى كتب ذكية تفاعلية مدعومة بالذكاء الاصطناعي، تشمل شروحات ميسرة، بنوك أسئلة موقوتة، بودكاست حواري، وريلز تعليمية سريعة.'
  },
  {
    category: 'general',
    question: 'ما هي المناهج والمراحل الدراسية التي تدعمها منصة ebook osera ai؟',
    answer: 'تدعم المنصة جميع المراحل التعليمية: مرحلة التعليم الأساسي والابتدائي، الإعدادي، المرحلة الثانوية (شعبتي علمي وأدبي وفق أحدث مواصفات وزارة التربية والتعليم)، بالإضافة إلى المقررات الجامعية، الشهادات الدولية (American / IGCSE / French)، ودورات البرمجة والذكاء الاصطناعي وتطوير الذات.'
  },
  {
    category: 'ai_features',
    question: 'كيف يتم تحويل المذكرة أو الـ PDF إلى كتاب تفاعلي ذكي؟',
    answer: 'بمجرد رفع ملف المذكرة أو الكتاب بصيغة PDF، يقوم محرك الذكاء الاصطناعي المتطور (Gemini Pro) بتحليل المنهج، وتفكيكه إلى فصول تفاعلية، واستخراج المفاهيم الأساسية، وتوليد أمثلة محلولة خطوة بخطوة، مع إنتاج بودكاست صوتي وريلز وبنك اختبارات تقييمي تلقائياً.'
  },
  {
    category: 'ai_features',
    question: 'ما هو استوديو البودكاست التعليمي (كريم وفرح)؟',
    answer: 'هو نظام توليد صوتي درامي متطور يقوم فيه مذيعان افتراضيان بالذكاء الاصطناعي (كريم وفرح) بمناقشة محتوى كل فصل وطرح الأسئلة الشائعة وتفسير القوانين والمسائل بأسلوب شيق وجذاب يرسخ المعلومة في ذهن الطالب.'
  },
  {
    category: 'ai_features',
    question: 'ما هي ميزة ريلز التعليم (EduReels 100% Studio)؟',
    answer: 'تتيح المنصة تحويل أي درس إلى مقطع ريلز تعليمي تفاعلي مدته من 40 إلى 60 ثانية يحتوي على سيناريو مركز، شرائح بصرية ديناميكية، ونشاط تفاعلي سريع لمساعدة الطالب على مراجعة الدرس في ثوانٍ معدودة.'
  },
  {
    category: 'students',
    question: 'هل يمكنني تجربة الكتب والاختبارات مجاناً؟',
    answer: 'نعم، توفر منصة ebook osera ai العديد من الكتب والمقررات المجانية بالكامل، بالإضافة إلى إمكانية معاينة الفصول الأولى من أي كتاب، والاستفادة من بنك الأسئلة والمساعد الذكي مجاناً.'
  },
  {
    category: 'students',
    question: 'كيف يساعدني المعلم الذكي (Contextual AI Tutor) أثناء المذاكرة؟',
    answer: 'في كل صفحة درس، يتواجد مساعد ذكي متصل بسياق المنهج الحالي، يمكنك سؤاله في أي وقت عن أي نقطة غامضة، أو طلب إعادة شرح المسألة بطريقة مختلفة، أو طلب أمثلة وتدريبات إضافية.'
  },
  {
    category: 'instructors',
    question: 'كيف يمكن للمدرسين والمؤسسات التعليمية الاستفادة من المنصة؟',
    answer: 'يمكن للمعلمين إنشاء حساب معلم ونشر مذكراتهم الخاصة ككتب ذكية تفاعلية، وإصدار كروت شحن للسناتر والطلاب، ومتابعة أداء الطلاب وإحصائيات الاستيعاب، وحماية محتواهم الأكاديمي بعلامات مائية رقمية وتشفير كامل.'
  },
  {
    category: 'instructors',
    question: 'هل حقوق الملكية الفكرية للمذكرات والمقررات محمية؟',
    answer: 'نعم تماماً، يتم حماية جميع الملفات بنظام Dynamic Watermarking يطبع بيانات المشترك على المحتوى لمنع التسريب، مع تشفير السيرفرات السحابية وضمان عدم مشاركة المادة الخام خارج المنصة.'
  },
  {
    category: 'general',
    question: 'كيف يمكنني التواصل مع الدعم الفني لمنصة ebook osera ai؟',
    answer: 'فريق الدعم الفني متاح على مدار الساعة عبر الواتساب على الرقم (+201066906132) أو عبر البريد الإلكتروني (support@osera-ai.com).'
  }
];

export function FaqPageView() {
  const navigate = useNavigate();
  const { dir, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'students' | 'instructors' | 'ai_features'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = activeCategory === 'all' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8" dir={dir}>
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl backdrop-blur-md transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-black border border-teal-400/30">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>مركز المساعدة والأسئلة الشائعة</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
          الأسئلة الشائعة حول منصة <span className="text-teal-400">ebook osera ai</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-3 leading-relaxed">
          كل ما تحتاج معرفته عن تحويل الكتب الذكية، استوديو البودكاست، بنوك الامتحانات، وطريقة استفادة الطلاب والمدرسين من المنصة.
        </p>

        {/* CATEGORY PILLS */}
        <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/10">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'general', label: 'عام عن المنصة' },
            { id: 'ai_features', label: 'ميزات الذكاء الاصطناعي' },
            { id: 'students', label: 'للطلاب وأولياء الأمور' },
            { id: 'instructors', label: 'للمعلمين والسناتر' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as any);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-teal-400 text-slate-950 shadow-md scale-105'
                  : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ACCORDION LIST */}
      <div className="space-y-3.5">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isOpen ? 'border-teal-400 shadow-md ring-1 ring-teal-400/20' : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold transition-colors ${
                    isOpen ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                    {faq.question}
                  </h3>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-teal-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-slate-700 text-xs sm:text-sm leading-relaxed border-t border-gray-100 pt-4 animate-fade-in">
                  <p className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 font-medium">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CONTACT CALLOUT */}
      <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
        <div>
          <h4 className="font-black text-base text-slate-900">هل لديك استفسار آخر لم تجد إجابته؟</h4>
          <p className="text-xs text-slate-600 mt-1">فريق الدعم الفني جاهز للإجابة على جميع تساؤلاتك ومساعدتك في أي وقت.</p>
        </div>
        <a
          href="https://wa.me/201066906132"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          تواصل عبر واتساب 💬
        </a>
      </div>

    </div>
  );
}
