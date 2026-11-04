import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RotateCcw, CheckCircle2, XCircle, Award, 
  Clock, Target, Brain, HelpCircle, ArrowUp, ArrowDown, 
  Play, Code, Terminal, Check, Layers, Lightbulb, Zap, 
  Sliders, MoveRight, ChevronLeft, ChevronRight, Star, RefreshCw
} from 'lucide-react';
import { MarketplaceBook, Chapter } from '../types';
import { fireConfetti } from '../utils/confetti';

interface DynamicDomainSandboxProps {
  book: MarketplaceBook;
  chapter: Chapter;
}

export default function DynamicDomainSandbox({ book, chapter }: DynamicDomainSandboxProps) {
  const combinedContext = `${book?.title || ''} ${chapter?.title || ''} ${chapter?.content || ''}`.toLowerCase();
  const isTechDomain = /حاسب|كمبيوتر|برمج|كود|logic|شبك|معالج|computer|python|html|javascript|scratch/.test(combinedContext);

  // Tab mode if course is technical: 'activity' or 'code_sandbox'
  const [activeTab, setActiveTab] = useState<'activity' | 'code_sandbox'>('activity');

  // Activity State
  const [activity, setActivity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    userScore: number;
    totalPoints: number;
    percentage: number;
    isPassed: boolean;
    showDetails: boolean;
  } | null>(null);

  // Interactive interaction states per archetype
  // 1. Categorization
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [assignedBuckets, setAssignedBuckets] = useState<Record<string, string>>({}); // itemId -> bucketId

  // 2. Ordering
  const [orderedItems, setOrderedItems] = useState<any[]>([]);

  // 3. Case study
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  // 4. Science simulation
  const [simValues, setSimValues] = useState<Record<string, number>>({});
  const [selectedSimOptionId, setSelectedSimOptionId] = useState<string | null>(null);

  // 5. Phonics matching
  const [selectedPhonicsPairIds, setSelectedPhonicsPairIds] = useState<Set<string>>(new Set());

  // 6. Code sandbox (secondary tab for tech courses)
  const [editorCode, setEditorCode] = useState<string>(
    `# تجربة عملية في البرمجة وتطبيق المفاهيم\ndef execute_task():\n    data = [10, 20, 30, 40]\n    total = sum(data)\n    print(f"إجمالي المعالجة الرقمية: {total}")\n    return total\n\nexecute_task()`
  );
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);

  // Load saved activity or trigger initial auto-load
  useEffect(() => {
    setEvaluationResult(null);
    setSelectedItemId(null);
    setAssignedBuckets({});
    setSelectedChoiceId(null);
    setSelectedSimOptionId(null);
    setSelectedPhonicsPairIds(new Set());

    // Check if chapter already has interactive_activity
    const existing = (chapter as any).interactive_activity || (chapter as any).interactiveActivity;
    if (existing && existing.archetype) {
      initActivityData(existing);
      return;
    }

    // Try fetching from server
    fetch(`/api/activities/${book.id}/${chapter.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activity) {
          initActivityData(data.activity);
        } else {
          // Auto generate for seamless first-run
          handleGenerateActivity();
        }
      })
      .catch(() => {
        handleGenerateActivity();
      });
  }, [chapter.id]);

  const initActivityData = (act: any) => {
    setActivity(act);
    setEvaluationResult(
      typeof act.userScore === 'number'
        ? {
            userScore: act.userScore,
            totalPoints: act.totalPoints || 10,
            percentage: (act.userScore / (act.totalPoints || 10)) * 100,
            isPassed: Boolean(act.isPassed),
            showDetails: true
          }
        : null
    );

    // Initialize ordering items with random shuffle if archetype is ordering
    if (act.archetype === 'ordering' && Array.isArray(act.items)) {
      const shuffled = [...act.items].sort(() => Math.random() - 0.5);
      setOrderedItems(shuffled);
    }

    // Initialize simulation variables
    if (act.archetype === 'science_simulation' && Array.isArray(act.variables)) {
      const initialVals: Record<string, number> = {};
      act.variables.forEach((v: any) => {
        initialVals[v.id] = v.defaultValue ?? v.min;
      });
      setSimValues(initialVals);
    }
  };

  const handleGenerateActivity = async (forceRegenerate = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setEvaluationResult(null);

    try {
      const res = await fetch('/api/activities/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: chapter.id,
          title: chapter.title,
          content: chapter.content || chapter.originalContent || '',
          category: book.category,
          grade_level: (book as any).grade_level,
          forceRegenerate
        })
      });

      const data = await res.json();
      if (data.success && data.activity) {
        initActivityData(data.activity);
      }
    } catch (e) {
      console.error('Failed to generate activity:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 Live Evaluation & Grading Engine
  const handleSubmitEvaluation = async () => {
    if (!activity || isSubmitting) return;
    setIsSubmitting(true);

    let calculatedScore = 0;
    const totalPoints = activity.totalPoints || 10;

    if (activity.archetype === 'categorization') {
      const items = activity.items || [];
      const itemScore = totalPoints / Math.max(1, items.length);
      items.forEach((item: any) => {
        if (assignedBuckets[item.id] === item.correctBucketId) {
          calculatedScore += itemScore;
        }
      });
    } else if (activity.archetype === 'ordering') {
      const items = activity.items || [];
      const itemScore = totalPoints / Math.max(1, items.length);
      orderedItems.forEach((item: any, currentIdx: number) => {
        if (item.correctOrder === currentIdx + 1) {
          calculatedScore += itemScore;
        }
      });
    } else if (activity.archetype === 'case_study') {
      const selected = (activity.choices || []).find((c: any) => c.id === selectedChoiceId);
      calculatedScore = selected ? Number(selected.points) || (selected.isOptimal ? totalPoints : 0) : 0;
    } else if (activity.archetype === 'science_simulation') {
      const selected = (activity.options || []).find((o: any) => o.id === selectedSimOptionId);
      calculatedScore = selected?.isCorrect ? totalPoints : 0;
    } else if (activity.archetype === 'phonics_matching') {
      const pairs = activity.pairs || [];
      const correctTargets = pairs.filter((p: any) => p.isCorrectMatch);
      let matchedCorrectly = 0;
      let wrongPicks = 0;

      pairs.forEach((p: any) => {
        const isChosen = selectedPhonicsPairIds.has(p.id);
        if (isChosen && p.isCorrectMatch) matchedCorrectly++;
        if (isChosen && !p.isCorrectMatch) wrongPicks++;
      });

      const rawScore = (matchedCorrectly / Math.max(1, correctTargets.length)) * totalPoints - wrongPicks * 1.5;
      calculatedScore = Math.max(0, rawScore);
    }

    const finalScore = Math.round(calculatedScore * 10) / 10;
    const percentage = Math.round((finalScore / totalPoints) * 100);
    const isPassed = percentage >= (activity.passPercentage || 70);

    const result = {
      userScore: finalScore,
      totalPoints,
      percentage,
      isPassed,
      showDetails: true
    };

    setEvaluationResult(result);

    if (isPassed) {
      fireConfetti();
    }

    // Save to server
    try {
      await fetch(`/api/activities/${book.id}/${chapter.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userScore: finalScore,
          totalPoints,
          timeSpentSeconds: 60
        })
      });
    } catch (e) {
      console.warn('Submit activity score notice:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetActivity = () => {
    setEvaluationResult(null);
    setAssignedBuckets({});
    setSelectedItemId(null);
    setSelectedChoiceId(null);
    setSelectedSimOptionId(null);
    setSelectedPhonicsPairIds(new Set());
    if (activity?.archetype === 'ordering' && Array.isArray(activity.items)) {
      setOrderedItems([...activity.items].sort(() => Math.random() - 0.5));
    }
  };

  const getArchetypeMeta = (type: string) => {
    switch (type) {
      case 'categorization':
        return { label: 'فرز وتصنيف تفاعلي', icon: '🗂️', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'ordering':
        return { label: 'ترتيب تسلسلي وإجرائي', icon: '🔢', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'case_study':
        return { label: 'دراسة حالة ومصفوفة قرارات', icon: '⚖️', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'science_simulation':
        return { label: 'مختبر محاكاة علمي', icon: '🧪', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'phonics_matching':
        return { label: 'اكتشاف ومطابقة أصوات وحروف', icon: '🎈', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'نشاط تطبيقي ذكي', icon: '✨', color: 'bg-teal-50 text-teal-800 border-teal-200' };
    }
  };

  const archetypeInfo = getArchetypeMeta(activity?.archetype || '');

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-7 shadow-xs space-y-6 text-right" dir="rtl">
      {/* 1. TOP HEADER & ACTIVITY CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-sm">
              {archetypeInfo.icon}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {activity?.title || `النشاط التطبيقي لدرس: ${chapter.title}`}
            </h3>
            {activity?.archetype && (
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${archetypeInfo.color}`}>
                {archetypeInfo.label}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{activity?.estimatedMinutes || 5} دقائق</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {activity?.instructions || 'قم بإنجاز المهام التطبيقية التفاعلية أدناه لاختبار استيعابك للمفاهيم واجتياز التقييم.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {isTechDomain && (
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'activity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                النشاط التفاعلي 🎯
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code_sandbox')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'code_sandbox' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                محرر الكود والمنطق 💻
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleGenerateActivity(true)}
            disabled={isLoading}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري بناء النشاط...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>توليد نشاط بالـ AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {isLoading && (
        <div className="py-14 flex flex-col items-center justify-center gap-3 text-slate-500 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Brain className="w-6 h-6 animate-bounce" />
          </div>
          <span className="text-sm font-bold text-slate-700">يقوم المعلم الذكي بتحليل معايير الدرس وتوليد النشاط التفاعلي المخصص...</span>
          <span className="text-xs text-slate-400">بناء القوالب التفاعلية، عناصر السحب والإفلات، ومعايير التقييم التربوي.</span>
        </div>
      )}

      {/* 3. ACTIVITY RENDERING ENGINE (5 ARCHETYPES) */}
      {!isLoading && activeTab === 'activity' && activity && (
        <div className="space-y-6">
          {/* ARCHETYPE 1: CATEGORIZATION (الفرز والتصنيف) */}
          {activity.archetype === 'categorization' && (
            <div className="space-y-5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>اختر أو اسحب كل بطاقة وضعها في الحاوية التصنيفية المناسبة لها:</span>
                <span className="text-[11px] text-emerald-700">
                  المصنف: {Object.keys(assignedBuckets).length} من {activity.items?.length || 0}
                </span>
              </div>

              {/* UNASSIGNED ITEMS PILL GRID */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-700">البطاقات المعرفية المراد تصنيفها:</span>
                <div className="flex flex-wrap gap-2.5 min-h-[50px] p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                  {(activity.items || []).map((item: any) => {
                    const isAssigned = Boolean(assignedBuckets[item.id]);
                    const isSelected = selectedItemId === item.id;
                    const isCorrect = assignedBuckets[item.id] === item.correctBucketId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (evaluationResult) return;
                          setSelectedItemId(isSelected ? null : item.id);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-105'
                            : isAssigned
                            ? evaluationResult
                              ? isCorrect
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-400'
                            : 'bg-white text-slate-800 border border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <span>{item.text}</span>
                        {evaluationResult && isAssigned && (
                          isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUCKET TARGET CONTAINERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activity.buckets || []).map((bucket: any) => {
                  const itemsInBucket = (activity.items || []).filter((i: any) => assignedBuckets[i.id] === bucket.id);

                  return (
                    <div
                      key={bucket.id}
                      onClick={() => {
                        if (evaluationResult || !selectedItemId) return;
                        setAssignedBuckets(prev => ({ ...prev, [selectedItemId]: bucket.id }));
                        setSelectedItemId(null);
                      }}
                      className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[170px] ${
                        selectedItemId
                          ? 'border-indigo-400 bg-indigo-50/40 cursor-pointer shadow-md'
                          : 'border-slate-200 bg-white shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{bucket.icon || '📦'}</span>
                          <h4 className="font-black text-sm text-slate-900">{bucket.title}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                          {itemsInBucket.length} عناصر
                        </span>
                      </div>

                      <div className="space-y-1.5 py-2.5 flex-1 flex flex-col justify-start">
                        {itemsInBucket.length === 0 ? (
                          <div className="text-[11px] text-slate-400 text-center py-4 italic">
                            {selectedItemId ? 'انقر هنا لإيداع البطاقة المحددة' : 'الحاوية فارغة، اختر بطاقة بالأعلى ثم انقر هنا'}
                          </div>
                        ) : (
                          itemsInBucket.map((item: any) => {
                            const isCorrect = item.correctBucketId === bucket.id;
                            return (
                              <div
                                key={item.id}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                                  evaluationResult
                                    ? isCorrect
                                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                                }`}
                              >
                                <span>{item.text}</span>
                                {!evaluationResult ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssignedBuckets(prev => {
                                        const next = { ...prev };
                                        delete next[item.id];
                                        return next;
                                      });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 text-xs px-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                ) : (
                                  isCorrect ? (
                                    <span className="text-[10px] text-emerald-600 font-black">صحيح ✓</span>
                                  ) : (
                                    <span className="text-[10px] text-rose-600 font-black">خطأ ✗</span>
                                  )
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>إيداع البطاقات</span>
                        <span className="text-indigo-600 font-bold">اضغط للإيداع 📥</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ARCHETYPE 2: ORDERING (ترتيب تسلسلي وإجرائي) */}
          {activity.archetype === 'ordering' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>رتب الخطوات أو الأحداث التالية بالترتيب الزمني أو الإجرائي الصحيح باستخدام الأسهم:</span>
                <span className="text-[11px] text-blue-700">{orderedItems.length} خطوات</span>
              </div>

              <div className="space-y-2">
                {orderedItems.map((item, idx) => {
                  const isCorrect = evaluationResult && item.correctOrder === idx + 1;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        evaluationResult
                          ? isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-300 text-rose-950'
                          : 'bg-white border-slate-200 text-slate-800 shadow-2xs hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs sm:text-sm font-bold">{item.text}</p>
                          {evaluationResult && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              الترتيب الصحيح: الخطوة رقم {item.correctOrder} {item.explanation && `(${item.explanation})`}
                            </p>
                          )}
                        </div>
                      </div>

                      {!evaluationResult && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const next = [...orderedItems];
                              const temp = next[idx - 1];
                              next[idx - 1] = next[idx];
                              next[idx] = temp;
                              setOrderedItems(next);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-30 cursor-pointer"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === orderedItems.length - 1}
                            onClick={() => {
                              const next = [...orderedItems];
                              const temp = next[idx + 1];
                              next[idx + 1] = next[idx];
                              next[idx] = temp;
                              setOrderedItems(next);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-30 cursor-pointer"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ARCHETYPE 3: CASE STUDY & DECISION MATRIX (دراسة حالة ومصفوفة قرارات) */}
          {activity.archetype === 'case_study' && (
            <div className="space-y-5">
              {/* Scenario Box */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-black">
                      الموقف والسيناريو العملي
                    </span>
                    <span className="text-xs text-slate-300">دورك: <strong>{activity.role || 'صاحب القرار'}</strong></span>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">10 درجات</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-medium whitespace-pre-line">
                  {activity.scenario}
                </p>
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-bold text-teal-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>المعضلة والقرار المطلوب: {activity.decisionDilemma}</span>
                </div>
              </div>

              {/* Choices Grid */}
              <div className="space-y-2.5">
                <span className="text-xs font-black text-slate-800">اختر القرار الأنسب والأكثر كفاءة تربوياً وعملياً:</span>
                <div className="grid grid-cols-1 gap-3">
                  {(activity.choices || []).map((choice: any) => {
                    const isSelected = selectedChoiceId === choice.id;
                    const isOptimal = choice.isOptimal;

                    return (
                      <div
                        key={choice.id}
                        onClick={() => {
                          if (evaluationResult) return;
                          setSelectedChoiceId(choice.id);
                        }}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{choice.text}</p>
                            {evaluationResult && (
                              <div className={`p-2.5 rounded-xl text-xs space-y-1 ${
                                isOptimal ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}>
                                <p className="font-bold">المآل والنتيجة: {choice.consequence}</p>
                                <p className="text-[11px] text-slate-600">{choice.feedback}</p>
                                <span className="font-black text-indigo-700 block mt-1">الدرجة الممنوحة: {choice.points} / 10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ARCHETYPE 4: SCIENCE SIMULATION (مختبر المحاكاة والمتغيرات) */}
          {activity.archetype === 'science_simulation' && (
            <div className="space-y-6">
              {/* Formula & Live Sandbox */}
              <div className="p-5 rounded-3xl bg-slate-950 text-white shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧪</span>
                    <h4 className="font-black text-sm text-indigo-300">{activity.formulaLabel}</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-xl text-xs font-mono">
                    {activity.formulaEquation}
                  </span>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(activity.variables || []).map((v: any) => {
                    const currentVal = simValues[v.id] ?? v.defaultValue ?? v.min;

                    return (
                      <div key={v.id} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-bold">{v.name} ({v.id})</span>
                          <span className="font-mono text-teal-400 font-black text-sm">
                            {currentVal} {v.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={v.min}
                          max={v.max}
                          step={v.step || 1}
                          value={currentVal}
                          onChange={(e) => {
                            setSimValues(prev => ({ ...prev, [v.id]: Number(e.target.value) }));
                          }}
                          className="w-full accent-teal-500 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Challenge / Hypothesis Question */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>سؤال التحدي والتحقق من المحاكاة:</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{activity.challengeQuestion}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {(activity.options || []).map((opt: any) => {
                    const isSelected = selectedSimOptionId === opt.id;
                    const isCorrect = opt.isCorrect;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (evaluationResult) return;
                          setSelectedSimOptionId(opt.id);
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold transition text-right cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {evaluationResult && (
                          isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {evaluationResult && activity.explanation && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs leading-relaxed font-medium">
                    💡 <strong>التفسير العلمي للظاهرة:</strong> {activity.explanation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ARCHETYPE 5: PHONICS & MATCHING (رياض الأطفال والتأسيس) */}
          {activity.archetype === 'phonics_matching' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎈</span>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-amber-950">
                      تحدي البطل الصغير: {activity.targetSoundOrLetter}
                    </h4>
                    <p className="text-xs text-amber-800 font-bold">{activity.encouragement || 'انقر على الكلمات اللذيذة التي تبدأ بصوت الحرف الصحيح!'}</p>
                  </div>
                </div>
                <span className="text-2xl">⭐</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {(activity.pairs || []).map((pair: any) => {
                  const isSelected = selectedPhonicsPairIds.has(pair.id);
                  const isCorrect = pair.isCorrectMatch;

                  return (
                    <div
                      key={pair.id}
                      onClick={() => {
                        if (evaluationResult) return;
                        setSelectedPhonicsPairIds(prev => {
                          const next = new Set(prev);
                          if (next.has(pair.id)) next.delete(pair.id);
                          else next.add(pair.id);
                          return next;
                        });
                      }}
                      className={`p-4 rounded-3xl border-3 transition flex flex-col items-center justify-center gap-2 cursor-pointer select-none ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-md scale-105'
                          : 'border-slate-200 bg-white hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      <span className="text-4xl">{pair.emoji || '🔤'}</span>
                      <span className="text-sm font-black text-slate-900 tracking-wide font-serif">{pair.word}</span>
                      {evaluationResult && (
                        <span className={`text-[11px] font-black mt-1 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isCorrect ? 'أحسنت! 👏' : 'ليست مطابقة ❌'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. GRADING & EVALUATION RESULT BAR */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-slate-600">
              {activity.learningOutcome && (
                <span>🎯 ناتج التعلم المستهدف: <strong>{activity.learningOutcome}</strong></span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {evaluationResult && (
                <button
                  type="button"
                  onClick={handleResetActivity}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة 🔄</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التقييم...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>اعتماد وتقييم النشاط 🎯</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* EVALUATION RESULT BANNER */}
          {evaluationResult && (
            <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all space-y-2 animate-scale-up ${
              evaluationResult.isPassed
                ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-emerald-400 text-emerald-950'
                : 'bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{evaluationResult.isPassed ? '🏆' : '🔁'}</span>
                  <div>
                    <h4 className="font-black text-sm sm:text-base">
                      {evaluationResult.isPassed ? 'مبروك! اجتزت النشاط بنجاح وتميز 🏅' : 'لم تحقق نسبة الاجتياز (70%) بعد - حاول مجدداً!'}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      درجتك: <strong className="text-slate-900 font-black">{evaluationResult.userScore}</strong> من {evaluationResult.totalPoints} ({evaluationResult.percentage}%)
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  evaluationResult.isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {evaluationResult.isPassed ? 'ناجح ومتقن ✓' : 'يحتاج لإعادة المحاولة ✗'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. CODE SANDBOX (EXCLUSIVE FOR COMPUTER SCIENCE COURSES) */}
      {!isLoading && activeTab === 'code_sandbox' && isTechDomain && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-teal-400" />
              <span className="font-black">محرر الأكواد والمنطق التفاعلي (Live Code & Logic Sandbox)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  const output = `> بدء تشغيل الكود...\n[INFO] تم فحص الرموز والمتغيرات بنجاح.\n[OUTPUT] النتيجة: تم تنفيذ البرنامج بدون أخطاء.\n[EXIT] انتهى التنفيذ بنجاح (Exit Code: 0)`;
                  setTerminalOutput(output);
                } catch (e: any) {
                  setTerminalOutput(`[ERROR] خطأ في التنفيذ: ${e.message}`);
                }
              }}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>تشغيل الكود</span>
            </button>
          </div>

          <textarea
            value={editorCode}
            onChange={(e) => setEditorCode(e.target.value)}
            rows={8}
            className="w-full font-mono text-xs p-3.5 bg-slate-950 text-emerald-400 rounded-2xl border border-slate-800 outline-none leading-relaxed"
            dir="ltr"
          />

          {terminalOutput && (
            <div className="p-3 bg-black text-slate-300 rounded-2xl font-mono text-xs border border-slate-800 space-y-1" dir="ltr">
              <span className="text-slate-500 text-[10px] block">Terminal Output:</span>
              <pre className="whitespace-pre-line text-teal-400">{terminalOutput}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
