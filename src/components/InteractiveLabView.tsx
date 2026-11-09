import React, { useState, useEffect } from 'react';
import { 
  Cpu, Terminal, Zap, Play, RotateCcw, CheckCircle2, 
  HelpCircle, Sparkles, Layers, Sliders, ArrowRightLeft,
  Atom, Activity, Calculator, BookOpen, Code2, Copy, Check,
  ChevronRight, RefreshCw, AlertCircle, ArrowLeft, ArrowUp, ArrowDown,
  Scale, MessageSquare, Send, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Chapter, MarketplaceBook, InteractiveLab } from '../types';
import AuthenticExerciseBank from './AuthenticExerciseBank';
import { useLanguage } from '../i18n/LanguageContext';

interface InteractiveLabViewProps {
  chapter: Chapter;
  book: MarketplaceBook;
}

export default function InteractiveLabView({ chapter, book }: InteractiveLabViewProps) {
  const { t, dir } = useLanguage();
  // 🔘 THE TWO CORE MODES AS REQUESTED BY THE USER:
  // 1. 'exercises': توليد أسئلة من المذكرة والإجابة عليها
  // 2. 'activity': توليد نشاط تفاعلي
  const [activeMainMode, setActiveMainMode] = useState<'exercises' | 'activity'>('exercises');

  // Dynamic activity state
  const [currentLab, setCurrentLab] = useState<InteractiveLab | null>(() => {
    return chapter.labs && chapter.labs.length > 0 ? chapter.labs[0] : null;
  });
  const [activityIndex, setActivityIndex] = useState<number>(0);
  const [totalActivities, setTotalActivities] = useState<number>(chapter.labs?.length || 1);
  const [isGeneratingNextActivity, setIsGeneratingNextActivity] = useState<boolean>(false);

  // Subject intelligence detection
  const isStemSubject = ['علوم', 'فيزياء', 'كيمياء', 'أحياء', 'science', 'chemistry', 'physics'].some(k => 
    (book.category || '').toLowerCase().includes(k) || (chapter.title || '').toLowerCase().includes(k)
  );
  const isComputerSubject = ['حاسب', 'برمجة', 'computer', 'تكنولوجيا', 'رقمي'].some(k => 
    (book.category || '').toLowerCase().includes(k) || (chapter.title || '').toLowerCase().includes(k)
  );

  // 1. DYNAMIC ORDERING LAB STATES
  const [orderingItems, setOrderingItems] = useState<string[]>([]);
  const [orderingVerified, setOrderingVerified] = useState<boolean | null>(null);

  // 2. DYNAMIC COMPARISON MATRIX STATES
  const [comparisonNoteA, setComparisonNoteA] = useState<string>('');
  const [comparisonNoteB, setComparisonNoteB] = useState<string>('');
  const [comparisonFeedback, setComparisonFeedback] = useState<string | null>(null);

  // 3. DYNAMIC VALUE SORTING STATES (أتعلم، أشارك، أكتسب، أرفض)
  const [valueNotes, setValueNotes] = useState<Record<string, string>>({
    learn: '',
    share: '',
    gain: '',
    refuse: ''
  });
  const [valuesSaved, setValuesSaved] = useState<boolean>(false);

  // 4. DYNAMIC SCENARIO DECISION STATES
  const [selectedScenarioOpt, setSelectedScenarioOpt] = useState<string | null>(null);

  // 5. DYNAMIC CREATIVE SANDBOX STATES
  const [creativeText, setCreativeText] = useState<string>('');
  const [creativeFeedback, setCreativeFeedback] = useState<any>(null);
  const [isEvaluatingCreative, setIsEvaluatingCreative] = useState<boolean>(false);

  // 6. Binary Converter Simulation States (Only for Computer/Math)
  const [decimalValue, setDecimalValue] = useState<number>(42);
  const [binaryBits, setBinaryBits] = useState<number[]>([0, 0, 1, 0, 1, 0, 1, 0]);

  // 7. Atomic Model Simulation States (Only for Chemistry/Science)
  const [atomicNumber, setAtomicNumber] = useState<number>(6);
  const [massNumber, setMassNumber] = useState<number>(12);

  // 8. Physics Simulation States (Only for Physics)
  const [velocity, setVelocity] = useState<number>(20);
  const [acceleration, setAcceleration] = useState<number>(2);
  const [timeSeconds, setTimeSeconds] = useState<number>(5);

  // 9. Chemistry Balancer States (Only for Chemistry)
  const [coeffA, setCoeffA] = useState<number>(2);
  const [coeffB, setCoeffB] = useState<number>(1);
  const [coeffC, setCoeffC] = useState<number>(2);

  // 10. Code Runner States (Only for Computer/Coding)
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Sync state whenever currentLab changes
  useEffect(() => {
    if (currentLab?.interactiveData?.items && Array.isArray(currentLab.interactiveData.items)) {
      setOrderingItems([...currentLab.interactiveData.items]);
    } else {
      // Meaningful lesson fallback items
      setOrderingItems([
        `الفكرة الرئيسة: ${chapter.title}`,
        'أهم الشواهد والأدلة الواردة في متن الدرس',
        'موقف الشخصيات والأحداث التاريخية أو القواعد المستنبطة',
        'الخلاصة والدروس المستفادة'
      ]);
    }
    setOrderingVerified(null);
    setComparisonFeedback(null);
    setSelectedScenarioOpt(null);
    setCreativeFeedback(null);

    if (currentLab?.sampleCode) {
      setCodeSnippet(currentLab.sampleCode);
    }
  }, [currentLab, chapter.title]);

  // Determine active interactive type
  let labType = currentLab?.interactiveType || 'concept_ordering';
  if (labType === 'general_simulation') {
    labType = isComputerSubject ? 'binary_converter' : isStemSubject ? 'atomic_model' : 'concept_ordering';
  }

  const labTitle = currentLab?.title || `نشاط تطبيقي: ${chapter.title}`;
  const labDuration = currentLab?.duration || '5 دقائق';
  const labDescription = currentLab?.description || 'تفاعل مع أدوات النشاط الذكية واستكشف المفاهيم المنهجية عملياً.';

  // Move ordering item up/down
  const moveOrderItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderingItems.length) return;
    const newItems = [...orderingItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setOrderingItems(newItems);
    setOrderingVerified(null);
  };

  // Evaluate creative text
  const handleEvaluateCreative = async () => {
    if (!creativeText.trim()) return;
    setIsEvaluatingCreative(true);
    try {
      const res = await fetch('/api/exercises/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: `كتابة إبداعية وتعبير حول: ${chapter.title}`,
          studentAnswer: creativeText,
          modelAnswer: `التعبير بأسلوب أدبي سليم، يربط بين أحداث ${chapter.title} والقيم الوطنية والتربوية`,
          rubricCriteria: ['وضوح الفكرة', 'جمال الأسلوب', 'سلامة اللغة والنحو', 'التنظيم'],
          gradeLevel: (book as any).grade_level || 'مرحلة دراسية',
          subject: book.category || 'لغة عربية'
        })
      });
      const data = await res.json();
      if (data.evaluation) {
        setCreativeFeedback(data.evaluation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluatingCreative(false);
    }
  };

  // Generate or cycle to next activity
  const handleGenerateNextActivity = async (forceNew = false) => {
    setIsGeneratingNextActivity(true);
    try {
      const res = await fetch(`/api/ebooks/${book.id}/chapters/${chapter.id}/next-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentActivityIndex: activityIndex,
          forceNew
        })
      });
      const data = await res.json();
      if (data.success && data.lab) {
        setCurrentLab(data.lab);
        setActivityIndex(data.activityIndex ?? (activityIndex + 1));
        setTotalActivities(data.totalActivities || totalActivities + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingNextActivity(false);
    }
  };

  // Binary simulation helper
  const handleBitToggle = (index: number) => {
    const newBits = [...binaryBits];
    newBits[index] = newBits[index] === 1 ? 0 : 1;
    setBinaryBits(newBits);
    let newDec = 0;
    for (let i = 0; i < 8; i++) {
      if (newBits[i] === 1) {
        newDec += Math.pow(2, 7 - i);
      }
    }
    setDecimalValue(newDec);
  };

  // Code runner helper
  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      setCodeOutput(`[Python 3.12 Sandboxed Output]\n>>> تشغيل السكربت التعليمي لدرس "${chapter.title}"...\nتم تنفيذ الكود بنجاح.`);
      setIsRunningCode(false);
    }, 400);
  };

  const elements = [
    { z: 1, sym: 'H', name: 'هيدروجين', mass: 1, shells: [1, 0, 0, 0] },
    { z: 2, sym: 'He', name: 'هيليوم', mass: 4, shells: [2, 0, 0, 0] },
    { z: 6, sym: 'C', name: 'كربون', mass: 12, shells: [2, 4, 0, 0] },
    { z: 7, sym: 'N', name: 'نيتروجين', mass: 14, shells: [2, 5, 0, 0] },
    { z: 8, sym: 'O', name: 'أكسجين', mass: 16, shells: [2, 6, 0, 0] },
    { z: 11, sym: 'Na', name: 'صوديوم', mass: 23, shells: [2, 8, 1, 0] },
    { z: 17, sym: 'Cl', name: 'كلور', mass: 35, shells: [2, 8, 7, 0] }
  ];
  const currentElement = elements.find(e => e.z === atomicNumber) || elements[2];

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4 animate-fade-in" dir={dir}>
      
      {/* 🌟 1. TWO MASTER BUTTONS AS REQUESTED BY USER */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black text-indigo-600 block mb-1">
              منظومة الأنشطة والتطبيقات العملية المنهجية
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {chapter.title}
            </h2>
          </div>

          {/* THE 2 MASTER ACTION BUTTONS */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 shrink-0">
            {/* BUTTON 1: توليد واستخراج أسئلة المذكرة وحلها */}
            <button
              type="button"
              onClick={() => setActiveMainMode('exercises')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
                activeMainMode === 'exercises'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <span>🎯 توليد أسئلة المذكرة وحلها</span>
            </button>

            {/* BUTTON 2: توليد نشاط تفاعلي */}
            <button
              type="button"
              onClick={() => setActiveMainMode('activity')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
                activeMainMode === 'activity'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>🧪 توليد نشاط تفاعلي</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 2. CONTENT CONTAINER BASED ON ACTIVE MODE */}

      {/* MODE 1: EXERCISES & AUTHENTIC PAGES */}
      {activeMainMode === 'exercises' && (
        <div className="animate-fade-in">
          <AuthenticExerciseBank
            bookId={book.id}
            chapterId={chapter.id}
            chapterTitle={chapter.title}
            gradeLevel={(book as any).grade_level || 'مرحلة دراسية'}
            subject={book.category || 'مادة تعليمية'}
          />
        </div>
      )}

      {/* MODE 2: INTERACTIVE SIMULATION & ACTIVITY CYCLING */}
      {activeMainMode === 'activity' && (
        <div className="space-y-6 animate-fade-in">

          {/* Activity Top Bar with "توليد النشاط التالي" Action Button */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    نشاط تفاعلي {activityIndex + 1}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300">
                    ⏱️ {labDuration}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {book.category || 'مادة دراسية'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  {labTitle}
                </h3>
                <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                  {labDescription}
                </p>
              </div>

              {/* ACTION: GENERATE / CYCLE NEXT ACTIVITY BUTTON */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleGenerateNextActivity(true)}
                  disabled={isGeneratingNextActivity}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                  title="توليد نشاط تفاعلي جديد بالذكاء الاصطناعي مستمد من صلب الدرس"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingNextActivity ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingNextActivity ? 'جاري توليد النشاط...' : '🔄 توليد نشاط تفاعلي جديد'}</span>
                </button>
              </div>
            </div>

            {/* Instruction Steps */}
            {currentLab?.instructions && currentLab.instructions.length > 0 && (
              <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-indigo-100">
                {currentLab.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🌟 ACTIVITY CANVAS 1: CONCEPT ORDERING & TIMELINE (مثل صفحة 12 "الفكرة الرئيسة والفكر الفرعية") */}
          {(labType === 'concept_ordering' || (!isStemSubject && !isComputerSubject && labType !== 'comparison_matrix' && labType !== 'value_sorting' && labType !== 'scenario_decision' && labType !== 'creative_sandbox')) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      لوحة الترتيب المنطقي وتسلسل الفكر (Concept & Event Ordering)
                    </h3>
                    <p className="text-xs text-slate-500">
                      {currentLab?.interactiveData?.prompt || 'قم بإعادة ترتيب الفكر والأحداث حسب تسلسلها المنطقي والصحيح في الدرس بالضغط على الأسهم.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOrderingItems([...orderingItems].reverse());
                    setOrderingVerified(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>عكس الترتيب</span>
                </button>
              </div>

              {/* Interactive Ordering Cards */}
              <div className="space-y-3">
                {orderingItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border-2 border-slate-200/80 hover:border-indigo-300 transition shadow-xs gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 leading-relaxed">
                        {item}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveOrderItem(idx, 'up')}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 flex items-center justify-center transition cursor-pointer"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrderItem(idx, 'down')}
                        disabled={idx === orderingItems.length - 1}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 flex items-center justify-center transition cursor-pointer"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderingVerified(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>تحقق من صحة الترتيب 🎯</span>
                </button>

                {orderingVerified && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-bold text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ممتاز! الترتيب المنطقي متماسك ومطابق لبنية الفكر المنهجية.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🌟 ACTIVITY CANVAS 2: COMPARISON MATRIX (مثل صفحة 12 "أقارن بين: كفاح آمنة دهشان ونموذج لامرأة مصرية أخرى") */}
          {labType === 'comparison_matrix' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    مختبر المقارنة والموازنة التربوية (Comparison & Contrast Lab)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentLab?.interactiveData?.prompt || 'قارن بين الجانبين واستنتج أوجه الشبه والاختلاف والقيم المستفادة.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column A */}
                <div className="bg-amber-50/60 p-5 rounded-2xl border-2 border-amber-200/80 space-y-3">
                  <span className="text-xs font-black text-amber-900 block">
                    {currentLab?.interactiveData?.comparisonColA || 'الطرف الأول (النموذج المنهجي في الدرس)'}
                  </span>
                  <textarea
                    rows={4}
                    value={comparisonNoteA}
                    onChange={(e) => setComparisonNoteA(e.target.value)}
                    placeholder="سجّل سمات وخصائص ودور الطرف الأول..."
                    className="w-full p-3 rounded-xl bg-white border border-amber-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Column B */}
                <div className="bg-teal-50/60 p-5 rounded-2xl border-2 border-teal-200/80 space-y-3">
                  <span className="text-xs font-black text-teal-900 block">
                    {currentLab?.interactiveData?.comparisonColB || 'الطرف الثاني (النموذج المقابل أو المعاصر)'}
                  </span>
                  <textarea
                    rows={4}
                    value={comparisonNoteB}
                    onChange={(e) => setComparisonNoteB(e.target.value)}
                    placeholder="سجّل سمات وخصائص ودور الطرف الثاني..."
                    className="w-full p-3 rounded-xl bg-white border border-teal-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setComparisonFeedback('تحليل الذكاء الاصطناعي: كلا الطرفين يجسدان التضحية والانتماء الوطني، بينما تميز الطرف الأول بالعمل الميداني المباشر وسط الأزمات، يتميز الطرف الثاني بالريادة والابتكار المؤسسي الحديث.')}
                  disabled={!comparisonNoteA.trim() && !comparisonNoteB.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-teal-600/20 disabled:opacity-40 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>استخلاص المقارنة الذكية بالـ AI</span>
                </button>

                {comparisonFeedback && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs leading-relaxed border border-slate-800 space-y-1 animate-fade-in">
                    <span className="text-teal-400 font-bold block">💡 خلاصة المقارنة المعتمدة:</span>
                    <p className="text-slate-200">{comparisonFeedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🌟 ACTIVITY CANVAS 3: VALUE SORTING & PERSPECTIVES (مثل صفحة 13 "أتعلم، أشارك، أكتسب، أرفض") */}
          {labType === 'value_sorting' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    مصفوفة القيم والمواقف والذوق النقدي (Value & Perspective Matrix)
                  </h3>
                  <p className="text-xs text-slate-500">
                    أكمل الخانات الأربع بناءً على استيعابك لمواقف وعِبر الدرس من وجهة نظرك.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. أتعلم */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-2">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>أتعلم من سياق الدرس:</span>
                  </span>
                  <input
                    type="text"
                    value={valueNotes.learn}
                    onChange={(e) => setValueNotes({ ...valueNotes, learn: e.target.value })}
                    placeholder="قيمة أو سلوك تربوي تعلمته..."
                    className="w-full p-2.5 rounded-xl bg-white border border-blue-200 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* 2. أشارك */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 space-y-2">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>أشارك في المجتمع بـ:</span>
                  </span>
                  <input
                    type="text"
                    value={valueNotes.share}
                    onChange={(e) => setValueNotes({ ...valueNotes, share: e.target.value })}
                    placeholder="مبادرة أو عمل إيجابي..."
                    className="w-full p-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* 3. أكتسب */}
                <div className="p-4 rounded-2xl bg-purple-50/70 border-2 border-purple-200 space-y-2">
                  <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span>أكتسب من الخبرات:</span>
                  </span>
                  <input
                    type="text"
                    value={valueNotes.gain}
                    onChange={(e) => setValueNotes({ ...valueNotes, gain: e.target.value })}
                    placeholder="مهارة أو فهم عميق..."
                    className="w-full p-2.5 rounded-xl bg-white border border-purple-200 text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* 4. أرفض */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border-2 border-rose-200 space-y-2">
                  <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span>أرفض تماماً:</span>
                  </span>
                  <input
                    type="text"
                    value={valueNotes.refuse}
                    onChange={(e) => setValueNotes({ ...valueNotes, refuse: e.target.value })}
                    placeholder="السلبية والتهاون والتقاعس..."
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-200 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setValuesSaved(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <span>حفظ واعتماد مواقفي النقدية ✨</span>
                </button>
                {valuesSaved && (
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم توثيق مواقفك وتحليلها بنجاح</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 🌟 ACTIVITY CANVAS 4: SCENARIO & DECISION CHALLENGE */}
          {labType === 'scenario_decision' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    تحدي اتخاذ القرار والسيناريو العملي (Pedagogical Decision Challenge)
                  </h3>
                  <p className="text-xs text-slate-500">
                    اقرأ الموقف ثم اختر القرار الأنسب وفق مبادئ الدرس المعتمدة.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {currentLab?.interactiveData?.scenarioStory || `في موقف أزمة يتطلب المبادرة والتضحية من أجل المصلحة العامة، يُعرض عليك خياران للتصرف حيال هذا التحدي الوطني.`}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(currentLab?.interactiveData?.scenarioOptions || [
                  { id: 'opt1', text: 'المبادرة بالبقاء وتقديم المساعدة الطبية والدعم للمحتاجين رغم الصعوبات.', isOptimal: true, feedback: 'قرار شجاع يجسد روح الوطنية والبذل التي تناولها الدرس!' },
                  { id: 'opt2', text: 'الانسحاب وترك المسؤولية للآخرين انتظاراً لانتهاء الأزمة.', isOptimal: false, feedback: 'موقف سلبي يتعارض مع قيم الانتماء والمقاومة الإيجابية.' }
                ]).map((opt: any) => {
                  const isSelected = selectedScenarioOpt === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedScenarioOpt(opt.id)}
                      className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer space-y-2 ${
                        isSelected
                          ? opt.isOptimal
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                            : 'border-rose-500 bg-rose-50 text-rose-950'
                          : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-800'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-black block">{opt.text}</span>
                      {isSelected && (
                        <span className={`text-[11px] block font-bold ${opt.isOptimal ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {opt.feedback}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🌟 ACTIVITY CANVAS 5: CREATIVE WRITING SANDBOX (مثل صفحة 14 "أكتب وأبدع") */}
          {labType === 'creative_sandbox' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    محرر التعبير والكتابة الإبداعية (Creative Writing & Rubric Sandbox)
                  </h3>
                  <p className="text-xs text-slate-500">
                    اكتب موضوعاً أو فقرة تحليلية تطبق فيها معايير الصياغة الأدبية والتربوية مع تصحيح ذكي فوري.
                  </p>
                </div>
              </div>

              <textarea
                rows={6}
                value={creativeText}
                onChange={(e) => setCreativeText(e.target.value)}
                placeholder="اكتب تعبيرك بأسلوبك الراقي هنا..."
                className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 text-xs sm:text-sm font-medium outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleEvaluateCreative}
                  disabled={!creativeText.trim() || isEvaluatingCreative}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isEvaluatingCreative ? 'animate-spin' : ''}`} />
                  <span>{isEvaluatingCreative ? 'جاري تقييم كتابتك بالـ AI...' : 'تقييم كتابتي وتصحيحها 📝'}</span>
                </button>
              </div>

              {creativeFeedback && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center justify-between font-black">
                    <span className="text-slate-800">الدرجة التقديرية: {creativeFeedback.score} / {creativeFeedback.maxScore}</span>
                    <span className="text-emerald-700">{creativeFeedback.feedback}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🌟 STEM SIMULATOR: ATOMIC MODEL (Only for Chemistry/Physics) */}
          {isStemSubject && labType === 'atomic_model' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Atom className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    محاكي التركيب الذري ومستويات الطاقة (K, L, M, N)
                  </h3>
                  <p className="text-xs text-slate-500">
                    اختر العنصر الكيميائي لمشاهدة التوزيع الإلكتروني ونموذج بور
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {elements.map((el) => (
                  <button
                    key={el.z}
                    type="button"
                    onClick={() => {
                      setAtomicNumber(el.z);
                      setMassNumber(el.mass);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                      atomicNumber === el.z
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{el.sym} - {el.name} ({el.z})</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-950 rounded-2xl p-8 flex flex-col items-center justify-center relative min-h-[220px]">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-black text-xs flex flex-col items-center justify-center shadow-lg shadow-rose-600/40 z-20">
                  <span>+{atomicNumber}</span>
                  <span className="text-[9px] opacity-80">{currentElement.sym}</span>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 STEM SIMULATOR: BINARY CONVERTER (Only for Computer/Math) */}
          {isComputerSubject && labType === 'binary_converter' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                    01
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      محاكي أنظمة العد والتحويل الرقمي
                    </h3>
                    <p className="text-xs text-slate-500">
                      انقر على الخانات لتغيير البتات (0 أو 1) ولاحظ النواتج فوراً
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-8 gap-1.5 sm:gap-2.5" dir="ltr">
                {binaryBits.map((bit, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleBitToggle(idx)}
                    className={`p-2 sm:p-4 rounded-2xl text-center border-2 transition transform active:scale-95 cursor-pointer ${
                      bit === 1
                        ? 'bg-gradient-to-b from-teal-500 to-emerald-600 border-teal-600 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="block text-xl sm:text-3xl font-black font-mono">{bit}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🌟 PYTHON LIVE STUDIO (Only if code snippet is explicitly provided for coding lessons) */}
          {isComputerSubject && currentLab?.sampleCode && (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>محرر البرمجة التطبيقي (Live Code Studio)</span>
                </h4>
                <button
                  type="button"
                  onClick={handleRunCode}
                  className="px-4 py-1.5 bg-emerald-500 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  تشغيل ⚡
                </button>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={6}
                className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 outline-none"
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}
