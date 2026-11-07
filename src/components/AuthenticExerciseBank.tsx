import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, XCircle, Award, Target, Brain, 
  HelpCircle, RefreshCw, Send, Check, ChevronDown, ChevronUp,
  FileCheck2, AlertCircle, BookOpen, Star, Zap
} from 'lucide-react';
import { fireConfetti } from '../utils/confetti';

export interface ExerciseItem {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'essay' | 'true_false';
  options?: string[];
  model_answer: string;
  rubric_criteria?: string[];
  max_score?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface EvaluationResult {
  score: number;
  maxScore: number;
  isPassed: boolean;
  percentage: number;
  feedback: string;
  strengths: string[];
  missingPoints: string[];
  modelCorrection: string;
}

interface AuthenticExerciseBankProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  gradeLevel?: string;
  subject?: string;
}

export default function AuthenticExerciseBank({
  bookId,
  chapterId,
  chapterTitle,
  gradeLevel = 'الصف الثاني الإعدادي',
  subject = 'اللغة العربية'
}: AuthenticExerciseBankProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [exercisePage, setExercisePage] = useState<any>(null);
  const [showWorksheetImage, setShowWorksheetImage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [revealedModelAnswers, setRevealedModelAnswers] = useState<Record<string, boolean>>({});
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/ebooks/${bookId}/chapters/${chapterId}/exercises`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.exercisePage) {
          setExercisePage(data.exercisePage);
        }
        if (data.success && Array.isArray(data.exercises) && data.exercises.length > 0) {
          setExercises(data.exercises);
        } else {
          // Provide default grounded questions
          setExercises(getDefaultQuestions(chapterTitle));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setExercises(getDefaultQuestions(chapterTitle));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [bookId, chapterId, chapterTitle]);

  const getDefaultQuestions = (title: string): ExerciseItem[] => [
    {
      id: 'ex-1',
      question_text: `اختر الإجابة الصحيحة: ما هو المفهوم الجوهري الذي يدور حوله درس "${title}"؟`,
      question_type: 'mcq',
      options: [
        'أ) تطبيق القواعد الأساسية المذكورة في صلب الدرس بدقة واستدلال.',
        'ب) الاعتماد على الحفظ المجرد دون فهم السياق.',
        'ج) إهمال النماذج والمسائل التدريبية.',
        'د) الاقتصار على التعريفات العامة دون التطبيق.'
      ],
      model_answer: 'أ) تطبيق القواعد الأساسية المذكورة في صلب الدرس بدقة واستدلال.',
      rubric_criteria: ['تحديد الفكرة المحورية', 'دقة الاختيار'],
      max_score: 10
    },
    {
      id: 'ex-2',
      question_text: `استنتج من سياق درس "${title}" أهم نتيجة تعليمية أو قاعدة ضابطة يجب على الطالب استحضارها في الامتحان؟`,
      question_type: 'essay',
      model_answer: 'استحضار القاعدة الحاكمة والشواهد التطبيقية المباشرة الواردة في المذكرة، مع التمييز الدقيق بين الحالات المختلفة وتطبيق خطوات الحل المنطقية خطوة بخطوة.',
      rubric_criteria: ['ذكر القاعدة بدقة', 'صياغة تربوية سليمة', 'الاستدلال بالأمثلة'],
      max_score: 10
    }
  ];

  const handleEvaluateAnswer = async (exercise: ExerciseItem) => {
    const answer = studentAnswers[exercise.id];
    if (!answer || !answer.trim() || evaluatingId) return;

    setEvaluatingId(exercise.id);

    try {
      const res = await fetch('/api/exercises/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: exercise.question_text,
          studentAnswer: answer,
          modelAnswer: exercise.model_answer,
          rubricCriteria: exercise.rubric_criteria || [],
          gradeLevel,
          subject,
          bookId,
          chapterId,
          studentId: localStorage.getItem('osera_user_id') || 'student-1'
        })
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluations(prev => ({
          ...prev,
          [exercise.id]: data.evaluation
        }));

        if (data.evaluation.isPassed && data.evaluation.score >= 8.5) {
          fireConfetti();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleSelectOption = (exerciseId: string, option: string) => {
    setStudentAnswers(prev => ({ ...prev, [exerciseId]: option }));
  };

  const toggleModelAnswer = (exerciseId: string) => {
    setRevealedModelAnswers(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  };

  const evaluatedList = Object.values(evaluations);
  const totalScore = evaluatedList.reduce((acc, curr) => acc + curr.score, 0);
  const maxPossible = evaluatedList.length * 10;
  const avgPercentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* 🧭 HEADER BANNER & SCORE TELEMETRY */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>بنك تمارين المذكرة والتصحيح الذكي المباشر</span>
            </span>
            <span className="text-xs text-indigo-300 font-bold hidden sm:inline">
              تصحيح فوري بمعايير وزارة التربية والتعليم 📝
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{chapterTitle}</h3>
          <p className="text-xs text-indigo-200">
            أجب عن الأسئلة، واضغط على "تصحيح إجابتي" ليقوم الذكاء الاصطناعي برصد درجاتك وتوجيهك للإجابة النموذجية.
          </p>
        </div>

        {/* Live Score Pill */}
        {evaluatedList.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
              {avgPercentage}%
            </div>
            <div>
              <span className="text-[10px] text-indigo-200 font-bold block">مجموع درجاتك المحققة</span>
              <span className="text-sm font-black text-white">
                {totalScore.toFixed(1)} من {maxPossible} درجات
              </span>
              <span className="text-[10px] text-amber-300 block font-bold">
                {avgPercentage >= 70 ? 'مستوى ممتاز ومجتاز 🎯' : 'يحتاج لمزيد من التدريب 💪'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 🧭 DUAL-PANE WORKSPACE (AUTHENTIC PAGE ON RIGHT + INTERACTIVE RESPONSE GRID ON LEFT) */}
      <div className={`grid grid-cols-1 ${exercisePage && exercisePage.dataUrl ? 'lg:grid-cols-12 gap-6 items-start' : 'gap-6'}`}>

        {/* 📄 RIGHT PANE: AUTHENTIC BOOKLET WORKSHEET PAGE VIEWER (STICKY ON DESKTOP) */}
        {exercisePage && exercisePage.dataUrl && (
          <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-24 bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                  📜
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <span>ورقة أنشطة المذكرة المعتمدة</span>
                    {exercisePage.pageNumber && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] border border-amber-400/30">
                        ص {exercisePage.pageNumber}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    المصدر الأصلي للأسئلة بدون أي تحريف أو هلوسة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWorksheetImage(!showWorksheetImage)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <span>{showWorksheetImage ? 'طي' : 'عرض'}</span>
                {showWorksheetImage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showWorksheetImage && (
              <div className="flex justify-center bg-slate-950 p-2 rounded-2xl border border-slate-800 overflow-y-auto max-h-[750px] shadow-inner">
                <img
                  src={exercisePage.dataUrl}
                  alt={`صفحة تمارين ${exercisePage.pageNumber}`}
                  className="max-h-[720px] w-auto object-contain rounded-xl shadow-lg border border-slate-700 select-none"
                />
              </div>
            )}
          </div>
        )}

        {/* 📝 LEFT PANE: INTERACTIVE RESPONSE SHEET & QUESTIONS */}
        <div className={`${exercisePage && exercisePage.dataUrl ? 'lg:col-span-6 xl:col-span-5' : 'col-span-1'} space-y-6`}>
          {isLoading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <h5 className="text-sm font-black text-slate-900">جاري تحميل تدريبات وتمارين الدرس المعتمدة...</h5>
            </div>
          ) : exercises.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
              <h5 className="text-sm font-black text-slate-700">لا توجد تمارين مسجلة لهذا الفصل حالياً</h5>
            </div>
          ) : (
            <div className="space-y-6">
              {exercises.map((ex, index) => {
                const evaluation = evaluations[ex.id];
                const currentAnswer = studentAnswers[ex.id] || '';
                const isEvaluatingThis = evaluatingId === ex.id;
                const isModelRevealed = revealedModelAnswers[ex.id];

                return (
                  <div 
                    key={ex.id || index}
                    className="bg-white rounded-3xl border-2 border-gray-100 hover:border-indigo-100 transition shadow-xs p-5 sm:p-6 space-y-4"
                  >
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {ex.question_type === 'mcq' ? 'اختيار من متعدد' : ex.question_type === 'essay' ? 'سؤال تطبيقي' : 'إجابة قصيرة'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {evaluation && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                            evaluation.isPassed 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {evaluation.isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{evaluation.score}/{evaluation.maxScore}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <h4 className="text-sm font-black text-slate-900 leading-relaxed">
                      {ex.question_text}
                    </h4>

                    {/* Input Modes */}
                    {ex.question_type === 'mcq' && Array.isArray(ex.options) && ex.options.length > 0 ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-1 gap-2.5">
                          {ex.options.map((opt, oIdx) => {
                            const isSelected = currentAnswer === opt;
                            const letterCode = ['أ', 'ب', 'ج', 'د', 'هـ'][oIdx] || String(oIdx + 1);
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleSelectOption(ex.id, opt)}
                                className={`p-3 rounded-xl border-2 text-right text-xs font-bold transition flex items-center justify-between gap-3 cursor-pointer ${
                                  isSelected 
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300 shadow-xs' 
                                    : 'border-gray-200 hover:border-indigo-300 bg-gray-50/70 hover:bg-white text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                                    isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {letterCode}
                                  </span>
                                  <span className="leading-snug">{opt}</span>
                                </div>
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                                }`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={currentAnswer}
                          onChange={(e) => setStudentAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))}
                          placeholder="اكتب إجابتك هنا بأسلوبك العلمي الواضح المطابق لما درسته في المذكرة..."
                          rows={3}
                          className="w-full p-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:bg-white bg-slate-50 text-xs font-medium text-slate-900 outline-none leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleEvaluateAnswer(ex)}
                        disabled={!currentAnswer.trim() || isEvaluatingThis}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {isEvaluatingThis ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري التصحيح بالـ AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>تصحيح الإجابة بالذكاء الاصطناعي 🔍</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleModelAnswer(ex.id)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isModelRevealed ? 'إخفاء الإجابة النموذجية' : 'عرض الإجابة النموذجية 📜'}</span>
                        {isModelRevealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* AI Evaluation Result Card */}
                    {evaluation && (
                      <div className={`p-4 rounded-xl border-2 space-y-2.5 animate-in fade-in-50 duration-200 ${
                        evaluation.isPassed 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-indigo-600" />
                            <span>تقرير التقييم البيداغوجي:</span>
                          </span>
                          <span className="text-xs font-black">
                            النسبة: {evaluation.percentage}%
                          </span>
                        </div>

                        <p className="text-xs font-medium leading-relaxed bg-white/80 p-2.5 rounded-lg border border-gray-100">
                          💡 {evaluation.feedback}
                        </p>

                        {evaluation.strengths?.length > 0 && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-emerald-700 block">نقاط القوة 🌟:</span>
                            <ul className="text-xs space-y-0.5 list-disc list-inside text-emerald-900 font-medium">
                              {evaluation.strengths.map((str, sIdx) => <li key={sIdx}>{str}</li>)}
                            </ul>
                          </div>
                        )}

                        {evaluation.missingPoints?.length > 0 && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-amber-700 block">ما ينقصك للدرجة النهائية ⚠️:</span>
                            <ul className="text-xs space-y-0.5 list-disc list-inside text-amber-900 font-medium">
                              {evaluation.missingPoints.map((mis, mIdx) => <li key={mIdx}>{mis}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Model Answer */}
                    {isModelRevealed && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1 animate-in fade-in-50">
                        <span className="font-black block text-amber-800">الإجابة النموذجية المعتمدة:</span>
                        <p className="leading-relaxed font-medium">{ex.model_answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
