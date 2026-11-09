import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, MessageSquare, Bot, HelpCircle, Radio, Clock, 
  X, ChevronUp, ChevronDown, Lightbulb, Play, ArrowLeft, Volume2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface FloatingAiMascotProps {
  onOpenSupport?: () => void;
  onOpenAiTutor?: () => void;
}

export const FloatingAiMascot: React.FC<FloatingAiMascotProps> = ({
  onOpenSupport,
  onOpenAiTutor
}) => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [bubbleText, setBubbleText] = useState('مرحباً بك! أنا المساعد الذكي Osera AI 🦉 كيف أساعدك اليوم؟');
  const [bubbleIcon, setBubbleIcon] = useState('✨');
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [scrollYOffset, setScrollYOffset] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Dynamic Scroll & Section Detection
  useEffect(() => {
    let timeoutId: any = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      const scrollRatio = scrollY / (fullHeight - windowHeight || 1);

      setScrollYOffset(Math.sin(scrollY / 100) * 8); // subtle floating bobbing

      // Detect Context from Path & Scroll
      if (location.pathname === '/reels') {
        setBubbleText('شاهد ريلز تعليمية مكثفة في 60 ثانية 🎬');
        setBubbleIcon('🎬');
      } else if (location.pathname.includes('/book/')) {
        setBubbleText('أنا معك في كل صفحة! اسألني عن أي نقطة غامضة 💡');
        setBubbleIcon('📖');
      } else if (scrollRatio > 0.75) {
        setBubbleText('هل لديك استفسار أو اقتراح؟ فريق الدعم جاهز لمساعدتك 🎫');
        setBubbleIcon('💬');
      } else if (scrollRatio > 0.45) {
        setBubbleText('جرب بودكاست كريم وفرح أو الامتحانات الموقوتة 🎧⏱️');
        setBubbleIcon('🎙️');
      } else if (scrollRatio > 0.2) {
        setBubbleText('استكشف مئات المقررات المعتمدة والمذكرات الذكية 📚');
        setBubbleIcon('🚀');
      } else {
        setBubbleText('مرحباً بك! أنا المساعد الذكي Osera AI 🦉 كيف أساعدك اليوم؟');
        setBubbleIcon('✨');
      }

      setIsBubbleVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Keep bubble alive or fade softly
      }, 5000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  // Periodic greeting alternation
  useEffect(() => {
    const greetings = [
      { text: 'هل تعلم أنه يمكنك توليد مذكرة تفاعلية كاملة في دقيقة؟ ⚡', icon: '🤖' },
      { text: 'استمع لشرح الدرس بصوت كريم وفرح كحوار تفاعلي 🎧', icon: '🎙️' },
      { text: 'امتحن نفسك في 5 دقائق مع بنك الأسئلة الموقوت ⏱️', icon: '📝' },
      { text: 'تواجه مشكلة أو لديك فكرة؟ أرسل تذكرة دعم فني وسنرد فوراً 💬', icon: '🎫' },
      { text: 'شاهد كبسولات معرفية سريعة في قسم ريلز المعرفة 🎬', icon: '✨' }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (!isExpanded) {
        index = (index + 1) % greetings.length;
        setBubbleText(greetings[index].text);
        setBubbleIcon(greetings[index].icon);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 left-5 z-40 p-3 bg-gradient-to-tr from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-teal-500/30 transition transform hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-1.5 font-bold text-xs"
        title="إظهار المساعد الذكي"
        dir={dir}
      >
        <span className="text-base animate-bounce">🦉</span>
        <span className="hidden sm:inline">المساعد الذكي</span>
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start select-none font-sans print:hidden"
      dir={dir}
      style={{
        transform: `translateY(${scrollYOffset}px)`,
        transition: 'transform 0.3s ease-out'
      }}
    >
      {/* 💬 INTERACTIVE FLOATING SPEECH BUBBLE */}
      {isBubbleVisible && !isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="mb-3 max-w-xs p-3.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/10 text-xs text-slate-800 font-bold cursor-pointer hover:border-teal-400 transition animate-fade-in relative group"
        >
          {/* Subtle Glow Ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition" />
          
          <div className="flex items-start gap-2 relative z-10">
            <span className="text-base shrink-0">{bubbleIcon}</span>
            <p className="leading-snug text-slate-700 text-[11px] font-semibold">
              {bubbleText}
            </p>
          </div>

          {/* Mini Tail Pointer */}
          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
        </div>
      )}

      {/* 🌟 EXPANDED QUICK ACTION MENU */}
      {isExpanded && (
        <div className="mb-3 w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 shadow-2xl shadow-slate-900/20 text-xs space-y-3 animate-scale-up">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-black">
                🦉
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs">Osera AI Companion</h4>
                <span className="text-[10px] text-emerald-600 font-bold">● متصل وجاهز للخدمة</span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 font-medium">
            اختر ما تود القيام به وسأرشدك إليه فوراً:
          </p>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                setIsExpanded(false);
                if (onOpenAiTutor) onOpenAiTutor();
                else navigate('/marketplace');
              }}
              className="w-full p-2.5 bg-gradient-to-r from-teal-50 to-indigo-50 hover:from-teal-100 hover:to-indigo-100 border border-teal-200 text-teal-900 rounded-xl font-black text-xs text-right flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>المعلم الخصوصي الذكي (STEM)</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsExpanded(false);
                navigate('/reels');
              }}
              className="w-full p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl font-bold text-xs text-right flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-600" />
                <span>ريلز المعرفة التعليمية (60s)</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsExpanded(false);
                if (onOpenSupport) onOpenSupport();
              }}
              className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl font-bold text-xs text-right flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                <span>مركز الشكاوى والدعم الفني 🎫</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 🦉 MAIN FLOATING BOT AVATAR BUTTON */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative group w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-xl shadow-teal-500/30 flex items-center justify-center text-2xl transition transform group-hover:scale-105 active:scale-95 cursor-pointer border border-white/30"
          title="مساعد Osera AI الذكي"
        >
          {/* Animated Glow Halo */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-400 to-indigo-400 opacity-40 blur-sm group-hover:opacity-75 transition animate-pulse" />
          
          <span className="relative z-10 transform group-hover:rotate-6 transition">
            🦉
          </span>

          {/* Live Online Dot */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full z-20" />
        </button>

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className="w-6 h-6 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] transition cursor-pointer shadow-xs"
          title="تصغير"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
