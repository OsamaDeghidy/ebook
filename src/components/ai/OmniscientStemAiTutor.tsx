import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, X, MessageSquare, Send, RefreshCw, BookOpen, Brain, 
  Code, Calculator, FlaskConical, HelpCircle, ChevronLeft, Mic, Volume2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OmniscientStemAiTutorProps {
  bookId?: string;
  bookTitle?: string;
  currentChapterTitle?: string;
  chapterContent?: string;
  bookCategory?: string;
}

export const OmniscientStemAiTutor: React.FC<OmniscientStemAiTutorProps> = ({
  bookId,
  bookTitle,
  currentChapterTitle,
  chapterContent,
  bookCategory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `جاهز لمساعدتك في فهم وشرح درس **(${currentChapterTitle || 'هذا الفصل'})** مباشرة. تفضل بسؤالك وسأجيبك فوراً! 💡`,
      time: 'الآن'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Update greeting message when book/chapter changes
  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text: `جاهز لمساعدتك في فهم وشرح درس **(${currentChapterTitle || 'هذا الفصل'})** مباشرة. تفضل بسؤالك وسأجيبك فوراً! 💡`,
        time: 'الآن'
      }
    ]);
  }, [currentChapterTitle]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || question).trim();
    if (!queryText || isLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: queryText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/stem-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          bookTitle,
          chapterTitle: currentChapterTitle,
          chapterContent,
          bookCategory,
          question: queryText
        })
      });

      const data = await res.json();
      const aiMsg = {
        sender: 'ai' as const,
        text: data.answer || 'تم تحليل السؤال وتقديم الشرح.',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `💡 **شرح المعلم الذكي Osera AI:**\n\nبناءً على درس **(${currentChapterTitle || 'المقرر'})**:\n* يرجى إعادة إرسال السؤال أو صياغته للحصول على شرح مفصل.`,
          time: 'الآن'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const metaLower = `${bookTitle || ''} ${currentChapterTitle || ''} ${bookCategory || ''}`.toLowerCase();
  const isKG = /kg|kindergarten|رياض\s*الأطفال|روضة|حضانة|تمهيدي|أولى\s*ابتدائي|حرف\s|حروف\s|أبجدية/.test(metaLower);
  const isIslamicOrHumanities = !isKG && /دين|إسلام|قرآن|سورة|تفسير|حديث|فقه|عقيدة|تاريخ|جغرافيا|دراسات|أدب|بلاغة|نحو|شريعة|قانون/.test(metaLower);

  const promptChips = isKG ? [
    { label: '🎈 احكيلي قصة', prompt: 'احكيلي حكاية قصيرة وممتعة وبسيطة جداً عن موضوع هذا الدرس للأطفال' },
    { label: '🔤 كيف أنطقها؟', prompt: 'كيف أنطق هذا الحرف بالحركات والأصوات الصحيحة مع كلمات وأمثلة مصورة؟' },
    { label: '🎮 العب معي لعبة', prompt: 'اقترح لعبة سريعة ومسلية لاكتشاف الحرف وأصواته' },
    { label: '✨ لخصها لبطل صغير', prompt: 'لخص لي هذا الدرس في كلمات بسيطة وتشجيع لطيف' }
  ] : isIslamicOrHumanities ? [
    { label: '📖 التفسير والمعنى', prompt: 'اشرح لي المعنى الإجمالي والمقصود بأسلوب سهل ومباشر' },
    { label: '💡 العبرة المستفادة', prompt: 'ما هي أهم العبر والقيم العملية المستفادة من هذا الدرس؟' },
    { label: '❓ أسئلة متوقعة', prompt: 'ما هي أهم الأسئلة المتوقعة مع إجاباتها النموذجية؟' },
    { label: '📝 تلخيص الدرس', prompt: 'لخص لي عناصر الدرس في نقاط محددة واضحة' }
  ] : [
    { label: '💡 بسطهالي بمثال', prompt: '💡 بسطهالي بمثال واقعي من الحياة اليومية' },
    { label: '📐 خطوات الحل', prompt: 'اشرح لي خطوات حل وتطبيق القوانين الرياضية في هذا الدرس' },
    { label: '🔥 فخ الامتحان', prompt: 'ما هو أهم فخ أو خطأ شائع يقع فيه الطلاب في هذا الدرس؟' },
    { label: '📝 ملخص القوانين', prompt: 'لخص لي أهم القوانين والمفاهيم الجوهرية في هذا الدرس' }
  ];

  return (
    <>
      {/* 🌟 COMPACT SLEEK FLOATING TRIGGER */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 group flex items-center gap-2 p-2.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-lg border border-slate-700/80 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="اسأل المعلم الذكي عن أي نقطة في الدرس 💡"
          aria-label="اسأل المعلم الذكي"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="hidden group-hover:inline-block text-xs font-bold text-slate-100 transition-all pr-0.5 pl-2 whitespace-nowrap animate-fade-in">
            اسأل المعلم الذكي 💡
          </span>
        </button>
      )}

      {/* 🌟 SLIDE-OVER OMNISCIENT CHAT DRAWER */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[450px] bg-white shadow-2xl border-r border-gray-200 flex flex-col animate-slide-in-left text-right" dir="rtl">
          {/* HEADER */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                ⚡
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">المعلم الأكاديمي الذكي (Osera AI)</h3>
                <p className="text-[10px] text-teal-300 truncate max-w-[240px]">
                  مساعد درس: {currentChapterTitle || bookTitle || 'المقرر الدراسي'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* QUICK TOPIC PROMPT CHIPS */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-bold">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-900 rounded-lg shrink-0 transition"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs space-y-2'
                  }`}
                >
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>المعلم الذكي يقوم بتحليل وفحص المعادلات والقوانين...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اكتب سؤالك، مسألتك، أو معادلتك هنا..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
            />

            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default OmniscientStemAiTutor;
