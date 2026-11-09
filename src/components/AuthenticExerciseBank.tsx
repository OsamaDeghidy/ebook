import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, XCircle, Award, Target, Brain, 
  HelpCircle, RefreshCw, Send, Check, ChevronDown, ChevronUp,
  FileCheck2, AlertCircle, BookOpen, Star, Zap, Search, Layers, FileText,
  Upload, ImageIcon
} from 'lucide-react';
import { fireConfetti } from '../utils/confetti';
import MathRenderer from './MathRenderer';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, dir } = useLanguage();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [exercisePage, setExercisePage] = useState<any>(null);
  const [exercisePages, setExercisePages] = useState<any[]>([]);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [showWorksheetImage, setShowWorksheetImage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [revealedModelAnswers, setRevealedModelAnswers] = useState<Record<string, boolean>>({});
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  // Manual Page Input State (Human-in-the-Loop Fallback)
  const [manualPageInput, setManualPageInput] = useState('');
  const [hasExercisePages, setHasExercisePages] = useState<boolean | null>(null);
  const [serverNotice, setServerNotice] = useState<string>('');
  const [pageViewFilter, setPageViewFilter] = useState<'exercises' | 'all'>('exercises');

  // External Exam Sheet Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingExam, setIsUploadingExam] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string>('');

  const fetchExercises = (force = false, pageNum?: string) => {
    setIsGeneratingMore(true);
    let url = `/api/ebooks/${bookId}/chapters/${chapterId}/exercises?`;
    if (force) url += 'force=true&';
    if (pageNum) url += `page=${encodeURIComponent(pageNum)}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (typeof data.hasExercisePages === 'boolean') {
          setHasExercisePages(data.hasExercisePages);
        }
        if (data.message) {
          setServerNotice(data.message);
        }
        if (Array.isArray(data.allPages)) {
          setAllPages(data.allPages);
        }
        if (Array.isArray(data.exercisePages) && data.exercisePages.length > 0) {
          setExercisePages(data.exercisePages);
          setExercisePage(data.exercisePages[0]);
          setSelectedPageIndex(0);
          setHasExercisePages(true);
        } else if (data.exercisePage) {
          setExercisePages([data.exercisePage]);
          setExercisePage(data.exercisePage);
          setSelectedPageIndex(0);
          setHasExercisePages(true);
        } else if (Array.isArray(data.allPages) && data.allPages.length > 0) {
          setExercisePages(data.allPages);
          setExercisePage(data.allPages[0]);
          setSelectedPageIndex(0);
        } else {
          setExercisePages([]);
          setExercisePage(null);
          if (data.hasExercisePages === false) {
            setHasExercisePages(false);
          }
        }
        if (data.success && Array.isArray(data.exercises) && data.exercises.length > 0) {
          setExercises(data.exercises);
        } else {
          setExercises([]);
        }
      })
      .catch(() => {
        setExercises([]);
        setHasExercisePages(false);
      })
      .finally(() => {
        setIsLoading(false);
        setIsGeneratingMore(false);
      });
  };

  useEffect(() => {
    fetchExercises(false);
  }, [bookId, chapterId, chapterTitle]);

  const handleManualPageSubmit = () => {
    if (!manualPageInput.trim()) return;
    setIsLoading(true);
    fetchExercises(true, manualPageInput.trim());
  };

  const handleExtractSinglePage = (pageNumber: number | string) => {
    setIsLoading(true);
    fetchExercises(true, String(pageNumber));
  };

  const handleUploadExamSheets = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingExam(true);
    setUploadNotice('جاري قراءة الصور وفحص ورقة الامتحان بالذكاء الاصطناعي...');

    try {
      const readAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const imagesDataUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const b64 = await readAsBase64(files[i]);
        imagesDataUrls.push(b64);
      }

      const res = await fetch(`/api/ebooks/${bookId}/chapters/${chapterId}/upload-exercise-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagesDataUrls })
      });

      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.uploadedPages)) {
          setAllPages(prev => [...prev, ...data.uploadedPages]);
          setExercisePages(prev => [...prev, ...data.uploadedPages]);
          setExercisePage(data.uploadedPages[0]);
          setSelectedPageIndex(0);
          setHasExercisePages(true);
        }
        if (Array.isArray(data.newExercises) && data.newExercises.length > 0) {
          setExercises(prev => [...data.newExercises, ...prev]);
          fireConfetti();
        }
        setUploadNotice(data.message || 'تم فحص ورقة الامتحان واستخراج الأسئلة بنجاح وحفظها بالمذكرة!');
        setTimeout(() => setUploadNotice(''), 6000);
      } else {
        setUploadNotice(data.error || 'فشل فحص ورقة الامتحان.');
      }
    } catch (err: any) {
      setUploadNotice('حدث خطأ أثناء رفع ورقة الامتحان: ' + err.message);
    } finally {
      setIsUploadingExam(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRevealAllAnswers = () => {
    const allRevealed: Record<string, boolean> = {};
    exercises.forEach(ex => {
      allRevealed[ex.id] = true;
    });
    setRevealedModelAnswers(allRevealed);
  };

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
        if (data.evaluation.isPassed) {
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

  // Active pages list based on filter
  const displayedPages = pageViewFilter === 'exercises' && exercisePages.length > 0 ? exercisePages : (allPages.length > 0 ? allPages : exercisePages);

  return (
    <div className="space-y-6 animate-fade-in" dir={dir}>
      
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

          {/* Action Buttons for Extracting Questions & Revealing Answers */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fetchExercises(true)}
              disabled={isGeneratingMore}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingMore ? 'animate-spin' : ''}`} />
              <span>{isGeneratingMore ? 'جاري فحص واستخراج الأسئلة...' : '⚡ استخراج أسئلة كافة صفحات التمارين'}</span>
            </button>

            {/* Manual Page Input Toolbar */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15">
              <span className="text-[11px] text-indigo-200 font-bold shrink-0">رقم الصفحة:</span>
              <input
                type="text"
                value={manualPageInput}
                onChange={(e) => setManualPageInput(e.target.value)}
                placeholder="مثلاً: 12 أو 12-14"
                className="w-24 px-2 py-0.5 bg-black/40 border border-white/20 rounded-lg text-xs text-white text-center font-bold outline-none focus:border-amber-400 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleManualPageSubmit()}
              />
              <button
                type="button"
                onClick={handleManualPageSubmit}
                disabled={!manualPageInput.trim() || isGeneratingMore}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-black rounded-lg transition cursor-pointer flex items-center gap-1"
                title="جلب ورندرة صفحة التمارين ذات هذا الرقم المطبوع"
              >
                <Search className="w-3 h-3" />
                <span>جلب</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRevealAllAnswers}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>💡 حل وإظهار الإجابات النموذجية لجميع الأسئلة</span>
            </button>

            {/* 📤 Upload Exam Sheet Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadExamSheets}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingExam}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer border border-emerald-400/30 disabled:opacity-50"
            >
              {isUploadingExam ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>{isUploadingExam ? 'جاري فحص الامتحان...' : '📤 رفع ورقة امتحان أو أسئلة خارجية'}</span>
            </button>
          </div>

          {/* Upload Status Banner */}
          {uploadNotice && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
          )}
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
          <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-24 bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl space-y-4">
            
            {/* Top Bar with Page Type & View Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                  📜
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <span>صفحة المذكرة الأصلية</span>
                    {exercisePage.pageNumber && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] border border-amber-400/30">
                        ص {exercisePage.pageNumber}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    المصدر الأصلي للأسئلة بدون أي تحريف
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Single Page Extract Trigger */}
                {exercisePage.pageNumber && (
                  <button
                    type="button"
                    onClick={() => handleExtractSinglePage(exercisePage.pageNumber)}
                    disabled={isGeneratingMore}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    title="استخراج أسئلة هذه الصفحة فقط المعروضة أمامك حالياً"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>فحص ص {exercisePage.pageNumber} ⚡</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowWorksheetImage(!showWorksheetImage)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <span>{showWorksheetImage ? 'طي' : 'عرض'}</span>
                  {showWorksheetImage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 📑 Comprehensive Page Selector Strip (All Pages + Exercises) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">عرض الصفحات:</span>
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPageViewFilter('exercises')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        pageViewFilter === 'exercises' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      صفحات التمارين ({exercisePages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageViewFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        pageViewFilter === 'all' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      كافة صفحات الدرس ({allPages.length || exercisePages.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Page Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {displayedPages.map((page, pIdx) => {
                  const isSelected = exercisePage?.pageNumber === page.pageNumber;
                  const isExPage = exercisePages.some(ep => ep.pageNumber === page.pageNumber);
                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setSelectedPageIndex(pIdx);
                        setExercisePage(page);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300 font-bold'
                          : isExPage
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <span>ص {page.pageNumber || pIdx + 1}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : isExPage ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {isExPage ? 'تدريبات' : 'شرح'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rendered Physical Page Image */}
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
          ) : hasExercisePages === false || (exercises.length === 0 && !exercisePage) ? (
            /* ⚠️ CASE: NO EXERCISE PAGES DETECTED - PROMPT USER FOR PRINTED PAGE NUMBER */
            <div className="py-12 px-6 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-amber-300 shadow-xs max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h5 className="text-base font-black text-slate-800">
                  لا تتوفر صفحة تمارين تم اكتشافها تلقائياً لهذا الدرس
                </h5>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  يرجى إدخال رقم الصفحة المكتوب أسفل صفحة المذكرة في يدك، وسيقوم النظام بمعايرتها وعرضها واستخراج كافة أسئلتها بدقة:
                </p>
              </div>

              <div className="flex items-center gap-2 max-w-sm mx-auto pt-2">
                <input
                  type="text"
                  value={manualPageInput}
                  onChange={(e) => setManualPageInput(e.target.value)}
                  placeholder="رقم الصفحة مثلاً: 12 أو 12-14"
                  className="flex-1 p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none text-xs sm:text-sm font-bold text-center"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualPageSubmit()}
                />
                <button
                  type="button"
                  onClick={handleManualPageSubmit}
                  disabled={!manualPageInput.trim() || isGeneratingMore}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {isGeneratingMore ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  <span>فحص واستخراج</span>
                </button>
              </div>
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
                          {ex.question_type === 'mcq' ? 'اختيار من متعدد' : ex.question_type === 'true_false' ? 'صح أو خطأ' : ex.question_type === 'essay' ? 'سؤال تطبيقي' : 'إجابة قصيرة'}
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

                    {/* Question Text with KaTeX & MathRenderer Support */}
                    <div className="text-sm font-black text-slate-900 leading-relaxed">
                      <MathRenderer text={ex.question_text} />
                    </div>

                    {/* Input Modes */}
                    {ex.question_type === 'true_false' ? (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {['(✓) صواب / صح', '(✗) خطأ'].map((choice, cIdx) => {
                          const isSelected = currentAnswer === choice;
                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => handleSelectOption(ex.id, choice)}
                              className={`p-3.5 rounded-xl border-2 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                                isSelected
                                  ? choice.includes('صواب')
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300 shadow-xs'
                                    : 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-300 shadow-xs'
                                  : 'border-gray-200 hover:border-indigo-300 bg-gray-50/70 hover:bg-white text-gray-800'
                              }`}
                            >
                              <span>{choice}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : ex.question_type === 'mcq' && Array.isArray(ex.options) && ex.options.length > 0 ? (
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
                                  <div className="leading-snug">
                                    <MathRenderer text={opt} inline={true} />
                                  </div>
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
                          <span className="font-black text-xs">
                            {evaluation.isPassed ? 'إجابة مجتازة ومعتمدة 🎯' : 'تحتاج إجابتك إلى تدقيق ⚠️'}
                          </span>
                          <span className="text-xs font-black">
                            الدرجة: {evaluation.score} من {evaluation.maxScore} ({evaluation.percentage}%)
                          </span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed">{evaluation.feedback}</p>

                        {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
                          <div className="pt-2 border-t border-current/10 text-[11px] space-y-1">
                            <span className="font-bold block">ما ينقصك للدرجة النهائية:</span>
                            <ul className="list-disc list-inside space-y-0.5 opacity-90">
                              {evaluation.missingPoints.map((pt, i) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Model Answer Preview with Math Support */}
                    {isModelRevealed && (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5 animate-in fade-in-50">
                        <span className="font-black flex items-center gap-1.5 text-amber-900">
                          <Award className="w-3.5 h-3.5" />
                          <span>الإجابة النموذجية المعتمدة وفق المنهج:</span>
                        </span>
                        <div className="font-medium leading-relaxed">
                          <MathRenderer text={ex.model_answer} />
                        </div>
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
