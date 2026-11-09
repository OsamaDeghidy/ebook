import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Check,
  X,
  Sparkles,
  Award,
  Clock,
  FileCheck,
  Brain,
  Layers,
  ChevronRight,
  ChevronLeft,
  Printer,
  ShieldAlert,
  AlertCircle,
  Flame,
  FileText,
  BookOpen,
  Eye,
  BookMarked,
  CheckSquare
} from 'lucide-react';
import { QuizQuestion, QuestionType } from '../types';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import { sanitizeMathText } from '../utils/sanitizeMathText';
import MathRenderer from './MathRenderer';

export interface StoredExam {
  id: string;
  book_id: string;
  title: string;
  scope: 'lesson' | 'unit' | 'full_curriculum';
  target_title: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  questions: QuizQuestion[];
  instructions: string[];
  created_at: string;
}

interface QuizSectionProps {
  bookId?: string;
  bookTitle?: string;
  allChapters?: { id: string; title: string; summary?: string }[];
  chapterTitle?: string;
  questions: QuizQuestion[];
  bookExams?: StoredExam[];
  onUpdateQuestions?: (updatedQuestions: QuizQuestion[]) => void;
  onGenerateAiQuestions?: () => void;
  isGeneratingAiQuestions?: boolean;
}

function getSanitizedOptions(q: QuizQuestion | undefined): string[] {
  if (!q) return [];
  if (q.questionType === 'true_false') {
    return ['العبارة صحيحة تماماً', 'العبارة غير صحيحة وتحتاج لتصويب'];
  }
  if (!q.options || q.options.length === 0) {
    return [
      'الاستنتاج العلمي الأول المرتبط بمحور السؤال',
      'الاستنتاج العلمي الثاني (فخ معرفي محتمل)',
      'الاستنتاج العلمي الثالث',
      'الاستنتاج العلمي الرابع'
    ];
  }
  // Check if options are generic placeholders like "Option A", "Option 1"
  const isGeneric = q.options.every(opt => /^(option\s*[a-d1-4]|الخيار\s*(الأول|الثاني|الثالث|الرابع|[أ-د]))$/i.test(opt.trim()));
  if (isGeneric) {
    if (/صح|خطأ|صواب/i.test(q.question)) {
      return ['العبارة صحيحة تماماً', 'العبارة غير صحيحة وتحتاج لتصويب'];
    }
  }

  return q.options.map((opt, i) => {
    let clean = (opt || '').trim();
    // Strip leading prefix like "Option A:", "أ.", "ب)", "A."
    clean = clean.replace(/^(option\s*[a-d1-4]|الخيار\s*(الأول|الثاني|الثالث|الرابع|[أ-د]))[\:\-\.\)]\s*/i, '');
    const withoutPrefix = clean.replace(/^([A-D]|[\u0623\u0628\u062C\u062F])[\.\:\-\)]\s*/, '').trim();
    if (withoutPrefix.length > 0) {
      clean = withoutPrefix;
    }
    // If stripped down to empty or single letter
    if (!clean || /^(أ|ب|ج|د|a|b|c|d)$/i.test(clean)) {
      if (q.explanation && i === q.correctOptionIndex) {
        const core = q.explanation.replace(/^(التحليل البيداغوجي|نموذج الإجابة|التفسير العلمي)[\:\-]\s*/i, '').trim();
        return core.split('.')[0] || core.substring(0, 80);
      }
      const contextualDistractors = [
        'قيمة عددية مغايرة لا تحقق شروط المعادلة',
        'استنتاج بديل يتناقض مع خواص المسألة الرياضية',
        'حل تقريبي لا ينتمي لمجموعة التعويض المحددة',
        'علاقة عكسية لا تطابق القانون الحاكم للمسألة'
      ];
      return contextualDistractors[i % contextualDistractors.length];
    }
    return sanitizeMathText(clean);
  });
}

export default function QuizSection({
  bookId,
  bookTitle,
  allChapters = [],
  chapterTitle,
  questions,
  bookExams = [],
  onUpdateQuestions,
  onGenerateAiQuestions,
  isGeneratingAiQuestions = false
}: QuizSectionProps) {
  const { t, language, dir } = useLanguage();
  // Mode: 'practice' (instant feedback) vs 'exam' (timed mock test) vs 'archive' (exams repository)
  const [examMode, setExamMode] = useState<'practice' | 'exam' | 'archive'>('practice');

  // Stored Exams Archive state
  const [storedExams, setStoredExams] = useState<StoredExam[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [activeStoredExam, setActiveStoredExam] = useState<StoredExam | null>(null);

  // Practice Mode Continuous Flow Answers Map
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});

  // Exam Generation Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [examScope, setExamScope] = useState<'lesson' | 'unit' | 'full_curriculum'>('full_curriculum');
  const [selectedTargetTitle, setSelectedTargetTitle] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [examQuestionCount, setExamQuestionCount] = useState(10);
  const [isGeneratingCustomExam, setIsGeneratingCustomExam] = useState(false);

  // Print Exam Modal State
  const [examToPrint, setExamToPrint] = useState<StoredExam | null>(null);
  const [includeAnswerKeyInPrint, setIncludeAnswerKeyInPrint] = useState(false);
  const [expandedExamPreviewId, setExpandedExamPreviewId] = useState<string | null>(null);

  // Active question set: uses the selected stored exam if active, otherwise chapter's questions
  const effectiveQuestions = activeStoredExam ? activeStoredExam.questions : questions;

  // Merged Teacher Exams from props and server
  const combinedTeacherExams = useMemo(() => {
    const map = new Map<string, StoredExam>();
    (storedExams || []).forEach(e => map.set(e.id, e));
    (bookExams || []).forEach(e => map.set(e.id, e));
    return Array.from(map.values());
  }, [storedExams, bookExams]);

  // Identify matching teacher exam for current chapter or full curriculum
  const matchingTeacherExam = useMemo(() => {
    if (!combinedTeacherExams.length) return null;
    return combinedTeacherExams.find(e => 
      (e.target_title && chapterTitle && (e.target_title === chapterTitle || e.target_title.includes(chapterTitle))) ||
      e.scope === 'lesson'
    ) || combinedTeacherExams[0];
  }, [combinedTeacherExams, chapterTitle]);

  // Exam timer states
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);

  // Question editing/adding state
  const [showEditor, setShowEditor] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editType, setEditType] = useState<QuestionType>('mcq');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [editExplanation, setEditExplanation] = useState('');
  const [editCognitiveLevel, setEditCognitiveLevel] = useState<string>('فهم واستيعاب');
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const currentQuestion = effectiveQuestions[currentQuestionIndex];
  const isFinished = examMode === 'practice' ? currentQuestionIndex >= effectiveQuestions.length : isExamSubmitted;

  // Fetch stored exams on mount or bookId change
  const fetchExams = async () => {
    if (!bookId) return;
    setIsLoadingExams(true);
    try {
      const res = await fetch(`/api/ebooks/${bookId}/exams`);
      if (res.ok) {
        const data = await res.json();
        if (data.exams && Array.isArray(data.exams)) {
          setStoredExams(data.exams);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch exams:", err);
    } finally {
      setIsLoadingExams(false);
    }
  };

  useEffect(() => {
    if (bookId) {
      fetchExams();
    }
  }, [bookId]);

  // Timer countdown in Exam Mode
  useEffect(() => {
    let interval: any = null;
    if (examMode === 'exam' && isTimerRunning && timeLeft > 0 && !isExamSubmitted) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examMode, isTimerRunning, timeLeft, isExamSubmitted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFlagQuestion = (idx: number) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const startExamMode = () => {
    setActiveStoredExam(null);
    setExamMode('exam');
    setTimeLeft(Math.max(5, effectiveQuestions.length * 2) * 60); // 2 mins per question
    setIsTimerRunning(true);
    setCurrentQuestionIndex(0);
    setAnswersMap({});
    setFlaggedQuestions({});
    setIsExamSubmitted(false);
  };

  const handleStartStoredExam = (exam: StoredExam) => {
    setActiveStoredExam(exam);
    setExamMode('exam');
    setTimeLeft((exam.duration_minutes || 15) * 60);
    setIsTimerRunning(true);
    setCurrentQuestionIndex(0);
    setAnswersMap({});
    setFlaggedQuestions({});
    setIsExamSubmitted(false);
  };

  const handleGenerateCustomExam = async () => {
    if (!bookId) return;
    setIsGeneratingCustomExam(true);
    try {
      const res = await fetch(`/api/ebooks/${bookId}/exams/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: examScope,
          targetTitle: selectedTargetTitle || (examScope === 'lesson' ? chapterTitle : bookTitle),
          chapterId: selectedChapterId || (allChapters[0]?.id || ''),
          questionCount: examQuestionCount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.exams) {
          setStoredExams(data.exams);
        } else if (data.exam) {
          setStoredExams(prev => [data.exam, ...prev]);
        }
        setShowGenerateModal(false);
      }
    } catch (err) {
      console.error("Exam generation failed:", err);
    } finally {
      setIsGeneratingCustomExam(false);
    }
  };

  const handleOptionSelect = (optIndex: number) => {
    if (examMode === 'practice') {
      if (isAnswered) return;
      setSelectedOption(optIndex);
      setIsAnswered(true);
      if (optIndex === currentQuestion?.correctOptionIndex) {
        setScore(prev => prev + 1);
      }
    } else {
      // Exam Mode: record chosen option
      setAnswersMap(prev => ({ ...prev, [currentQuestionIndex]: optIndex }));
    }
  };

  const handleNextPractice = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleExamSubmit = async () => {
    setIsTimerRunning(false);
    setIsExamSubmitted(true);

    // Calculate final score
    let totalCorrect = 0;
    effectiveQuestions.forEach((q, idx) => {
      if (answersMap[idx] === q.correctOptionIndex) {
        totalCorrect++;
      }
    });
    setScore(totalCorrect);

    if (bookId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('quiz_attempts').insert({
            user_id: user.id,
            book_id: bookId,
            score: (totalCorrect / Math.max(1, effectiveQuestions.length)) * 100,
            total_questions: effectiveQuestions.length,
            answers_log: Object.entries(answersMap).map(([idx, opt]) => ({
              questionIndex: Number(idx),
              selectedOption: opt,
              isCorrect: opt === effectiveQuestions[Number(idx)]?.correctOptionIndex
            }))
          });
        }
      } catch (err) {
        console.warn("Quiz attempt log warning:", err);
      }
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setAnswersMap({});
    setFlaggedQuestions({});
    setIsExamSubmitted(false);
    setTimeLeft(15 * 60);
    setIsTimerRunning(false);
  };

  // Add / Edit actions
  const startAddQuestion = () => {
    setEditingIndex(-1);
    setEditQuestionText('');
    setEditType('mcq');
    setEditOptions(['', '', '', '']);
    setEditCorrectIndex(0);
    setEditExplanation('');
    setEditCognitiveLevel('فهم واستيعاب');
    setEditDifficulty('medium');
    setShowEditor(true);
  };

  const startEditQuestion = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setEditQuestionText(q.question);
    setEditType(q.questionType || 'mcq');
    setEditOptions([...(q.options || ['', '', '', ''])]);
    setEditCorrectIndex(q.correctOptionIndex);
    setEditExplanation(q.explanation || '');
    setEditCognitiveLevel(q.cognitiveLevel || 'فهم واستيعاب');
    setEditDifficulty(q.difficulty || 'medium');
    setShowEditor(true);
  };

  const handleSaveQuestion = () => {
    if (!editQuestionText.trim()) return;

    const newQuestion: QuizQuestion = {
      id: editingIndex !== null && editingIndex >= 0 ? questions[editingIndex].id : `q-${Date.now()}`,
      question: editQuestionText,
      questionType: editType,
      options: editType === 'true_false' ? ['صح (صواب)', 'خطأ (غير صحيح)'] : editOptions.filter(o => o.trim().length > 0),
      correctOptionIndex: editCorrectIndex,
      explanation: editExplanation,
      cognitiveLevel: editCognitiveLevel,
      difficulty: editDifficulty
    };

    let updated: QuizQuestion[] = [];
    if (editingIndex === -1) {
      updated = [...questions, newQuestion];
    } else if (editingIndex !== null && editingIndex >= 0) {
      updated = questions.map((q, i) => i === editingIndex ? newQuestion : q);
    }

    if (onUpdateQuestions) {
      onUpdateQuestions(updated);
    }
    setShowEditor(false);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    if (onUpdateQuestions) {
      onUpdateQuestions(updated);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      
      {/* HEADER BAR */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Brain className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">بنك الأسئلة والاختبارات التفاعلية المتقدم</span>
          </div>
          <h3 className="text-xl font-black text-gray-900">
            {chapterTitle ? `اختبار: ${chapterTitle}` : 'الاختبار التفاعلي الذكي'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">اختبر مدى استيعابك للمفاهيم عبر أسئلة الاختيار، الصواب والخطأ، وتحليلات الـ AI.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* MODE SWITCHER */}
          <button
            onClick={() => {
              setActiveStoredExam(null);
              setExamMode('practice');
              handleReset();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition ${
              examMode === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 تدريب ومراجعة الدرس
          </button>

          <button
            onClick={() => {
              setActiveStoredExam(null);
              startExamMode();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              examMode === 'exam' && !activeStoredExam
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏱️ اختبار سريع للدرس</span>
          </button>

          <button
            onClick={() => {
              setExamMode('archive');
              fetchExams();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              examMode === 'archive'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-purple-600" />
            <span>📋 سجل وبنك الامتحانات ({storedExams.length})</span>
          </button>

          {examMode !== 'archive' && onGenerateAiQuestions && (
            <button
              onClick={onGenerateAiQuestions}
              disabled={isGeneratingAiQuestions}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-sm disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAiQuestions ? 'جاري التوليد...' : 'توليد أسئلة الدرس بالـ AI'}</span>
            </button>
          )}

          {examMode !== 'archive' && (
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="px-3.5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>إدارة الأسئلة</span>
            </button>
          )}
        </div>
      </div>

      {/* QUESTION MANAGEMENT DRAWER / EDITOR */}
      {showEditor && (
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h4 className="font-black text-sm text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>إدارة بنك الأسئلة ({questions.length} سؤال)</span>
            </h4>
            <button
              onClick={startAddQuestion}
              className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سؤال يدوي</span>
            </button>
          </div>

          {editingIndex !== null && (
            <div className="bg-white border border-indigo-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900">
                  {editingIndex === -1 ? 'إضافة سؤال جديد' : `تعديل السؤال رقم ${editingIndex + 1}`}
                </span>
                <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نص السؤال</label>
                <input
                  type="text"
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  placeholder="اكتب نص السؤال هنا..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نوع السؤال</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as QuestionType)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="mcq">اختيار من متعدد (4 خيارات)</option>
                    <option value="true_false">صح أم خطأ</option>
                    <option value="case_study">دراسة حالة / تحليلي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الإجابة الصحيحة</label>
                  <select
                    value={editCorrectIndex}
                    onChange={(e) => setEditCorrectIndex(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    {editType === 'true_false' ? (
                      <>
                        <option value={0}>الخيار الأول: صح (صواب)</option>
                        <option value={1}>الخيار الثاني: خطأ (غير صحيح)</option>
                      </>
                    ) : (
                      editOptions.map((_, i) => (
                        <option key={i} value={i}>الخيار رقم {i + 1}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستوى المعرفي (هرم بلوم)</label>
                  <select
                    value={editCognitiveLevel}
                    onChange={(e) => setEditCognitiveLevel(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="تذكر وحفظ المفاهيم">🧠 تذكر وحفظ المفاهيم</option>
                    <option value="فهم واستيعاب">💡 فهم واستيعاب</option>
                    <option value="تطبيق ومسائل حسابية">📐 تطبيق ومسائل حسابية</option>
                    <option value="تحليل واستنتاج">🔍 تحليل واستنتاج</option>
                    <option value="تقييم وتركيب">🎯 تقييم وتركيب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">مستوى الصعوبة</label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as any)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="easy">🟢 سهل ومباشر</option>
                    <option value="medium">🟡 متوسط وتطبيقي</option>
                    <option value="hard">🔴 متقدم / للطلبة المتميزين</option>
                  </select>
                </div>
              </div>

              {editType !== 'true_false' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">خيارات الإجابة</label>
                  {editOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editOptions];
                        newOpts[i] = e.target.value;
                        setEditOptions(newOpts);
                      }}
                      placeholder={`الخيار ${i + 1}`}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-sans"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">التوضيح والتعليل التعليمي (AI Explanation)</label>
                <textarea
                  rows={2}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="اكتب التوضيح التعليمي لسبب صحة الإجابة..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm"
                >
                  حفظ السؤال
                </button>
              </div>
            </div>
          )}

          {/* QUESTIONS LIST */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {questions.map((q, idx) => (
              <div key={idx} className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-gray-800 line-clamp-1">{q.question}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditQuestion(idx)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 0. EXAMS ARCHIVE & REPOSITORY VIEW */}
      {examMode === 'archive' && (
        <div className="space-y-6 animate-fade-in">
          {/* BANNER & GENERATE ACTION */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-800">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
                <BookMarked className="w-3.5 h-3.5" />
                <span>أرشيف الامتحانات الرسمية والتقييم المعرفي</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black">
                سجل وبنك امتحانات المقرر: {bookTitle || chapterTitle || 'المقرر التعليمي'}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                امتحانات شاملة موثقة ومطابقة لمستويات هرم بلوم المعرفي. يمكنك خوض الامتحان إلكترونياً بمؤقت زمني، استخراج نماذج الإجابات التفصيلية، أو طباعة ورقة الامتحان كاختبار ورقي A4.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedTargetTitle(bookTitle || '');
                setSelectedChapterId(allChapters[0]?.id || '');
                setShowGenerateModal(true);
              }}
              className="px-6 py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>+ إنشاء وتوليد امتحان جديد 🪄</span>
            </button>
          </div>

          {/* EXAMS LIST */}
          {isLoadingExams ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs font-bold text-gray-500">جاري تحميل سجل الامتحانات المعتمدة...</p>
            </div>
          ) : storedExams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-4">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900">لا توجد امتحانات محفوظة في السجل حتى الآن</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  يمكنك توليد امتحان شامل لكامل المنهج، أو امتحان خاص بوحدة أو درس محدد بنقرة واحدة باستخدام محرك الذكاء الاصطناعي.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTargetTitle(bookTitle || '');
                  setSelectedChapterId(allChapters[0]?.id || '');
                  setShowGenerateModal(true);
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>توليد أول امتحان شامل للمنهج الآن 🚀</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storedExams.map((exam) => {
                const isPreviewOpen = expandedExamPreviewId === exam.id;
                const isCurriculum = exam.scope === 'full_curriculum';
                const isUnit = exam.scope === 'unit';

                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                          isCurriculum
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : isUnit
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isCurriculum ? '🌟 امتحان شامل للمنهج' : isUnit ? `📚 وحدة: ${exam.target_title}` : `📖 درس: ${exam.target_title}`}
                        </span>

                        <span className="text-[11px] font-bold text-gray-400">
                          {new Date(exam.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-gray-900 leading-snug">
                        {exam.title}
                      </h4>

                      {/* STATS BADGES */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold block">عدد الأسئلة</span>
                          <span className="text-xs font-black text-gray-900">{exam.questions?.length || 10} سؤال</span>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold block">الدرجة الكلية</span>
                          <span className="text-xs font-black text-indigo-600">{exam.total_marks || 20} درجة</span>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold block">زمن الامتحان</span>
                          <span className="text-xs font-black text-rose-600">{exam.duration_minutes || 30} دقيقة</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartStoredExam(exam)}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>بدء حل الامتحان 🚀</span>
                        </button>

                        <button
                          onClick={() => {
                            setExamToPrint(exam);
                            setIncludeAnswerKeyInPrint(false);
                          }}
                          className="px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
                          title="طباعة ورقة الامتحان"
                        >
                          <Printer className="w-3.5 h-3.5 text-gray-600" />
                          <span>طباعة</span>
                        </button>

                        <button
                          onClick={() => setExpandedExamPreviewId(isPreviewOpen ? null : exam.id)}
                          className="p-3 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-2xl transition"
                          title="استعراض الأسئلة ونموذج الإجابة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* PREVIEW ACCORDION */}
                      {isPreviewOpen && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs animate-fade-in max-h-72 overflow-y-auto custom-scrollbar">
                          <span className="font-black text-gray-800 block border-b border-gray-200 pb-2">
                            معاينة أسئلة الامتحان ونموذج الإجابة:
                          </span>
                          {exam.questions?.map((q, qIdx) => (
                            <div key={qIdx} className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                              <div className="flex items-start justify-between gap-2 font-bold text-gray-900">
                                <span>{qIdx + 1}. {q.question}</span>
                                <span className="text-[10px] text-indigo-600 font-black shrink-0">
                                  {q.points || 2} درجات
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg font-bold">
                                الإجابة النموذجية: {getSanitizedOptions(q)[q.correctOptionIndex] || q.options?.[q.correctOptionIndex]}
                              </div>
                              {q.explanation && (
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                  💡 {q.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1. PRACTICE MODE (Vertical Continuous Flow & Instant Evaluation) */}
      {examMode === 'practice' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-24">
          
          {/* 🌟 TEACHER EXAM BANNER CARD (Prominently displayed at top if available) */}
          {matchingTeacherExam && (
            <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 text-right">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    📋 امتحان مخصص من المعلم
                  </span>
                  <span className="text-xs text-indigo-300 font-bold">
                    {matchingTeacherExam.scope === 'lesson' ? 'خاص بهذا الفصل' : 'امتحان شامل ومجمع'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">{matchingTeacherExam.title}</h3>
                <p className="text-xs text-slate-300 font-medium">
                  عدد الأسئلة: {matchingTeacherExam.questions?.length || 0} سؤال • الوقت المقدر: {matchingTeacherExam.duration_minutes || 15} دقيقة
                </p>
              </div>
              <button
                onClick={() => handleStartStoredExam(matchingTeacherExam)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
              >
                ابدأ امتحان المعلم الآن ⏱️
              </button>
            </div>
          )}

          {/* EMPTY QUESTIONS FALLBACK */}
          {(!effectiveQuestions || effectiveQuestions.length === 0) ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">لا توجد أسئلة مخصصة لهذا الفصل حالياً</h4>
              <p className="text-xs text-slate-500">يمكنك الضغط على زر التوليد بالذكاء الاصطناعي لإنشاء بنك أسئلة متكامل فوراً.</p>
              {onGenerateAiQuestions && (
                <button
                  onClick={onGenerateAiQuestions}
                  disabled={isGeneratingAiQuestions}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGeneratingAiQuestions ? 'جاري التوليد...' : 'توليد بنك أسئلة لهذا الفصل ⚡'}</span>
                </button>
              )}
            </div>
          ) : (
            /* VERTICAL CONTINUOUS LIST OF QUESTIONS */
            <div className="space-y-5">
              {effectiveQuestions.map((q, qIdx) => {
                const userAnswer = practiceAnswers[qIdx];
                const isAnsweredThis = userAnswer !== undefined;
                const isCorrect = userAnswer === q.correctOptionIndex;
                const options = getSanitizedOptions(q);

                return (
                  <div
                    key={qIdx}
                    className={`p-6 sm:p-7 bg-white border-2 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-5 text-right relative overflow-hidden ${
                      isAnsweredThis
                        ? isCorrect
                          ? 'border-emerald-400 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                          : 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Header: Question Number & Modern Difficulty Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {qIdx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">
                            {q.questionType === 'true_false' ? 'ميزان الصواب والخطأ ⚖️' : 'سؤال اختيار من متعدد 🔘'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {q.points || 2} درجات معتمدة
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Cognitive Level */}
                        {q.cognitiveLevel && (
                          <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                            {q.cognitiveLevel}
                          </span>
                        )}
                        {/* Difficulty Level with Dynamic Theme */}
                        {(() => {
                          const isTrap = (q.difficulty as string) === 'hard' || (q.difficulty as string) === 'exam_trap' || /فخ|صعب|متقدم/i.test(q.difficulty || '');
                          const isAnalytical = q.difficulty === 'medium' || /متوسط|تحليل/i.test(q.difficulty || '');
                          if (isTrap) {
                            return (
                              <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-xs">
                                <span>🔥 فخ امتحانات</span>
                              </span>
                            );
                          }
                          if (isAnalytical) {
                            return (
                              <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-xs">
                                <span>⚡ استنتاجي تحليلي</span>
                              </span>
                            );
                          }
                          return (
                            <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                              <span>🟢 مستوى تأسيسي</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Question Text */}
                    <h4 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed font-sans">
                      <MathRenderer text={q.question} />
                    </h4>

                    {/* Modern Assessment Options with Letter Badges */}
                    <div className="space-y-2.5 pt-1">
                      {options.map((opt, optIdx) => {
                        const isSelected = userAnswer === optIdx;
                        const isThisCorrect = optIdx === q.correctOptionIndex;
                        const optionLetters = ['أ', 'ب', 'ج', 'د', 'هـ'];

                        let optClass = "bg-slate-50/80 hover:bg-indigo-50/50 border-slate-200 text-slate-800 hover:border-indigo-300 hover:translate-x-[-2px]";
                        let badgeClass = "bg-white border-slate-300 text-slate-600";

                        if (isAnsweredThis) {
                          if (isThisCorrect) {
                            optClass = "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-2 ring-emerald-500/30 shadow-xs";
                            badgeClass = "bg-emerald-600 text-white border-emerald-600";
                          } else if (isSelected) {
                            optClass = "bg-rose-50 border-rose-500 text-rose-950 font-black ring-2 ring-rose-500/30 shadow-xs";
                            badgeClass = "bg-rose-600 text-white border-rose-600";
                          } else {
                            optClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                            badgeClass = "bg-slate-200 text-slate-400 border-slate-200";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnsweredThis}
                            onClick={() => {
                              setPracticeAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                              if (optIdx === q.correctOptionIndex) {
                                setScore(s => s + 1);
                              }
                            }}
                            className={`w-full p-4 rounded-2xl border-2 text-right text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${optClass}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 transition-colors ${badgeClass}`}>
                                {optionLetters[optIdx] || optIdx + 1}
                              </span>
                              <span className="leading-relaxed">
                                <MathRenderer text={opt} />
                              </span>
                            </div>

                            {isAnsweredThis && isThisCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {isAnsweredThis && isSelected && !isThisCorrect && (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* AI Feedback & High-Order Explanation */}
                    {isAnsweredThis && (
                      <div className="pt-2 space-y-3 animate-fade-in">
                        <div className={`p-5 rounded-2xl text-xs space-y-3 border-2 shadow-xs ${
                          isCorrect 
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                            : 'bg-rose-50/90 border-rose-400 text-rose-950 ring-2 ring-rose-500/20'
                        }`}>
                          <div className="flex items-center gap-2 font-black text-sm">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                            <span className="text-sm font-black">
                              {isCorrect ? 'إجابة نموذجية دقيقة! 🎯 درجة كاملة' : 'إجابة غير صحيحة - وقعت في فخ هذا السؤال! ⚠️'}
                            </span>
                          </div>

                          {!isCorrect && (
                            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-300/80 text-rose-950 font-bold space-y-1 shadow-xs">
                              <div className="flex items-center gap-1.5 text-xs text-rose-700 font-black">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>فخ الامتحان المرصود 🚨:</span>
                              </div>
                              <p className="text-xs leading-relaxed">
                                <MathRenderer text={q.trapWarning || 'تنبيه امتحاني: احذر من التعميم المتسرع أو استبدال المتغيرات دون التأكد من تحقق الشروط الرياضية والقانونية الحاكمة أولاً!'} />
                              </p>
                            </div>
                          )}

                          <div className="pt-1 space-y-1 text-slate-800">
                            <span className="block font-black text-slate-900 text-xs">💡 التحليل البيداغوجي والتعليل النموذجي:</span>
                            <p className="font-medium leading-relaxed text-xs sm:text-sm">
                              <MathRenderer text={q.explanation || 'تم تأكيد الإجابة الصحيحة وتفكيك المشتتات الامتحانية وفقاً لنواتج تعلم هذا الفصل.'} />
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FLOATING BOTTOM SCORE BAR */}
          {Object.keys(practiceAnswers).length > 0 && (
            <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 text-xs font-bold animate-slide-up" dir={dir}>
              <span className="text-slate-300">
                أجبت <strong className="text-white">{Object.keys(practiceAnswers).length}</strong> من <strong className="text-white">{effectiveQuestions.length}</strong>
              </span>
              <span className="h-4 w-px bg-slate-700" />
              <span className="text-teal-400 font-black">
                النتيجة: {Math.round((Object.entries(practiceAnswers).filter(([idxStr, optIdx]) => effectiveQuestions[Number(idxStr)]?.correctOptionIndex === optIdx).length / Object.keys(practiceAnswers).length) * 100)}%
              </span>
              <button
                onClick={() => setPracticeAnswers({})}
                className="text-slate-300 hover:text-white px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-[11px] font-bold"
              >
                إعادة المحاولة 🔄
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. TIMED MOCK EXAM MODE */}
      {examMode === 'exam' && !isExamSubmitted && currentQuestion && (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
          {/* TIMER BANNER */}
          <div className="bg-slate-900 text-white p-4 px-6 rounded-2xl shadow-md flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
              <div>
                <span className="text-[11px] text-slate-400 block font-bold">الوقت المتبقي للامتحان</span>
                <span className="text-xl font-black font-mono text-white">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold">
                تمت الإجابة: {Object.keys(answersMap).length} من {questions.length}
              </span>
              <button
                onClick={handleExamSubmit}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition shadow-md active:scale-95"
              >
                تسليم الامتحان الآن
              </button>
            </div>
          </div>

          {/* QUESTION GRID NAVIGATION WITH STATUS LEGEND */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>خريطة أسئلة الامتحان:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> مجاب</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> معلّم للمراجعة 🚩</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> لم يجب</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => {
                const isAnsweredThis = answersMap[idx] !== undefined;
                const isFlaggedThis = flaggedQuestions[idx];
                const isCurrent = currentQuestionIndex === idx;

                let btnBg = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                if (isFlaggedThis) {
                  btnBg = 'bg-amber-100 text-amber-900 border-2 border-amber-400 font-black';
                } else if (isAnsweredThis) {
                  btnBg = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition relative ${btnBg} ${
                      isCurrent ? 'ring-2 ring-indigo-600 shadow-md scale-105' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlaggedThis && <span className="absolute -top-1 -right-1 text-[9px]">🚩</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE EXAM QUESTION */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                السؤال رقم {currentQuestionIndex + 1} من {questions.length}
              </span>

              <button
                onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  flaggedQuestions[currentQuestionIndex]
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>🚩</span>
                <span>{flaggedQuestions[currentQuestionIndex] ? 'معلّم للمراجعة لاحقاً' : 'تعليم السؤال للمراجعة'}</span>
              </button>
            </div>

            <h4 className="text-lg font-black text-gray-900 leading-snug font-sans">
              <MathRenderer text={currentQuestion.question} />
            </h4>

            <div className="space-y-3">
              {getSanitizedOptions(currentQuestion).map((option, idx) => {
                const isSelected = answersMap[currentQuestionIndex] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 rounded-2xl border-2 text-right text-xs sm:text-sm transition flex items-center justify-between font-sans ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-black shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>
                      <MathRenderer text={option} />
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              {currentQuestionIndex + 1 < questions.length ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleExamSubmit}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-md"
                >
                  <span>إنهاء وتسليم الاختبار</span>
                  <FileCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. FINAL RESULT & CERTIFICATE SCREEN */}
      {isFinished && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">
                {score / effectiveQuestions.length >= 0.8 ? 'تهانينا! أداء استثنائي ومتميز 🏆' : 'أحسنت المحاولة! مراجعة جيدة'}
              </h3>
              <p className="text-xs text-gray-500">
                لقد حققت <span className="font-black text-indigo-600 text-sm">{score}</span> من إجمالي <span className="font-black text-gray-800 text-sm">{effectiveQuestions.length}</span> درجات بنسبة إتقان <span className="font-black text-emerald-600 text-sm">{Math.round((score / Math.max(1, effectiveQuestions.length)) * 100)}%</span>
              </p>
            </div>

            {/* PERFORMANCE BADGES */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] text-emerald-700 font-bold block">الإجابات الصحيحة</span>
                <span className="text-lg font-black text-emerald-950">{score}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-[10px] text-rose-700 font-bold block">الإجابات الخاطئة</span>
                <span className="text-lg font-black text-rose-950">{effectiveQuestions.length - score}</span>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <span className="text-[10px] text-indigo-700 font-bold block">التقدير العام</span>
                <span className="text-lg font-black text-indigo-950">
                  {score / effectiveQuestions.length >= 0.9 ? 'ممتاز (A+)' : score / effectiveQuestions.length >= 0.75 ? 'جيد جداً (B)' : 'يحتاج مراجعة (C)'}
                </span>
              </div>
            </div>

            {/* BLOOM TAXONOMY COGNITIVE BREAKDOWN */}
            <div className="text-right p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
              <span className="text-xs font-black text-gray-800 block">📊 التحليل المعرفي وفق مستويات بلوم (Bloom's Taxonomy):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {['تذكر وحفظ المفاهيم', 'فهم واستيعاب', 'تطبيق ومسائل حسابية', 'تحليل واستنتاج'].map(level => {
                  const matchingQuestions = effectiveQuestions.filter(q => (q.cognitiveLevel || 'فهم واستيعاب').includes(level) || level.includes(q.cognitiveLevel || ''));
                  if (matchingQuestions.length === 0) return null;
                  const correctCount = matchingQuestions.filter((q) => {
                    const idx = effectiveQuestions.indexOf(q);
                    const chosen = examMode === 'exam' ? answersMap[idx] : undefined;
                    return chosen !== undefined && chosen === q.correctOptionIndex;
                  }).length;
                  return (
                    <div key={level} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 text-xs">
                      <span className="font-bold text-gray-700">{level}</span>
                      <span className="font-black text-indigo-600">
                        {examMode === 'exam' ? `${correctCount} / ${matchingQuestions.length}` : `${matchingQuestions.length} أسئلة`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة الاختبار من البداية</span>
              </button>

              {activeStoredExam && (
                <button
                  onClick={() => {
                    setActiveStoredExam(null);
                    setExamMode('archive');
                  }}
                  className="px-5 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center gap-2"
                >
                  <BookMarked className="w-4 h-4" />
                  <span>العودة لسجل الامتحانات</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة النتيجة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE CUSTOM EXAM MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-6 animate-scale-up" dir={dir}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-purple-600">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-black text-base text-gray-900">توليد امتحان جديد بالذكاء الاصطناعي</h3>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2">نطاق الامتحان الشامل:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExamScope('full_curriculum');
                      setSelectedTargetTitle(bookTitle || '');
                    }}
                    className={`p-3 rounded-2xl border-2 text-xs font-black transition flex flex-col items-center gap-1 ${
                      examScope === 'full_curriculum'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>🌟 كامل المنهج</span>
                    <span className="text-[10px] font-medium text-gray-500">امتحان تراكمي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExamScope('unit')}
                    className={`p-3 rounded-2xl border-2 text-xs font-black transition flex flex-col items-center gap-1 ${
                      examScope === 'unit'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>📚 وحدة دراسية</span>
                    <span className="text-[10px] font-medium text-gray-500">فصول مترابطة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExamScope('lesson');
                      setSelectedTargetTitle(chapterTitle || '');
                    }}
                    className={`p-3 rounded-2xl border-2 text-xs font-black transition flex flex-col items-center gap-1 ${
                      examScope === 'lesson'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>📖 درس محدد</span>
                    <span className="text-[10px] font-medium text-gray-500">تشخيص مركز</span>
                  </button>
                </div>
              </div>

              {examScope !== 'full_curriculum' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {examScope === 'unit' ? 'عنوان الوحدة أو الموضوع:' : 'اختر الدرس المستهدف:'}
                  </label>
                  {examScope === 'lesson' && allChapters.length > 0 ? (
                    <select
                      value={selectedChapterId}
                      onChange={(e) => {
                        setSelectedChapterId(e.target.value);
                        const ch = allChapters.find(c => c.id === e.target.value);
                        if (ch) setSelectedTargetTitle(ch.title);
                      }}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                    >
                      {allChapters.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.title}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedTargetTitle}
                      onChange={(e) => setSelectedTargetTitle(e.target.value)}
                      placeholder={examScope === 'unit' ? 'مثال: الوحدة الأولى: المادة وخواصها' : 'اسم الدرس'}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-purple-600"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عدد الأسئلة والزمن:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setExamQuestionCount(cnt)}
                      className={`p-2.5 rounded-xl border text-xs font-black transition ${
                        examQuestionCount === cnt
                          ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {cnt} أسئلة
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  الزمن المتوقع: {examQuestionCount <= 5 ? 15 : examQuestionCount <= 10 ? 30 : 45} دقيقة • الدرجة الكلية: {examQuestionCount * 2} درجات
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isGeneratingCustomExam}
                onClick={handleGenerateCustomExam}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-2xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isGeneratingCustomExam ? (
                  <>
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>جاري التوليد والتوثيق...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد وتوثيق الامتحان 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL EXAM PAPER MODAL */}
      {examToPrint && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200" dir={dir}>
            {/* MODAL CONTROL HEADER (Hidden on print) */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between gap-3 bg-gray-50 rounded-t-3xl print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-sm text-gray-900">معاينة ورقة الامتحان الرسمية (A4 Printable)</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswerKeyInPrint}
                    onChange={(e) => setIncludeAnswerKeyInPrint(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>تضمين نموذج الإجابة وسلم التصحيح</span>
                </label>

                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية 🖨️</span>
                </button>

                <button
                  onClick={() => setExamToPrint(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE PAPER CONTENT (Printed cleanly) */}
            <div id="printable-exam-paper" className="p-8 sm:p-12 overflow-y-auto space-y-6 text-black bg-white custom-scrollbar">
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #printable-exam-paper, #printable-exam-paper * { visibility: visible; }
                  #printable-exam-paper {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 20mm;
                    background: white !important;
                    color: black !important;
                  }
                }
              `}</style>

              {/* FORMAL EXAMINATION HEADER */}
              <div className="border-b-2 border-black pb-4 space-y-3">
                <div className="flex items-start justify-between text-xs font-bold">
                  <div className="text-right space-y-1">
                    <div>منصة إيبوك للتعليم الذكي • Osera AI LMS</div>
                    <div>اختبار تقييمي معتمد لمادة: {bookTitle || 'المقرر التعليمي'}</div>
                  </div>
                  <div className="text-center space-y-0.5">
                    <div className="text-sm font-black underline">ورقة الأسئلة الرسمية</div>
                    <div className="text-[11px] font-bold text-gray-700">{examToPrint.title}</div>
                  </div>
                  <div className="text-left space-y-1">
                    <div>الزمن المحدد: {examToPrint.duration_minutes} دقيقة</div>
                    <div>الدرجة الكلية: {examToPrint.total_marks} درجة</div>
                  </div>
                </div>

                {/* STUDENT RECORD BOX */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-gray-400 text-xs font-bold">
                  <div>اسم الطالب: .......................................</div>
                  <div>رقم الجلوس: ....................</div>
                  <div>الفصل / الشعبة: ....................</div>
                </div>
              </div>

              {/* INSTRUCTIONS */}
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-[11px] space-y-1">
                <span className="font-black block">تعليمات الاختبار:</span>
                <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                  <li>اقرأ كل سؤال بعناية ودقة قبل اختيار أو كتابة الإجابة.</li>
                  <li>الإجابة الصحيحة لكل سؤال تمنح درجتين كاملتين.</li>
                </ul>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-6 pt-2">
                {examToPrint.questions?.map((q, idx) => {
                  const opts = getSanitizedOptions(q);
                  return (
                    <div key={idx} className="space-y-2.5 pb-4 border-b border-gray-200">
                      <div className="flex items-start justify-between gap-2 text-xs font-black">
                        <span className="text-sm">
                          ( {idx + 1} ) {q.question}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded">
                          [ {q.points || 2} درجات ]
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pr-4">
                        {opts.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] font-bold shrink-0">
                              {['أ', 'ب', 'ج', 'د'][oIdx] || oIdx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OPTIONAL MODEL ANSWER SHEET */}
              {includeAnswerKeyInPrint && (
                <div className="pt-8 border-t-4 border-double border-black space-y-4 page-break-before">
                  <div className="text-center font-black text-sm underline">
                    --- نموذج الإجابة الرسمي وسلم التصحيح المعتمد ---
                  </div>
                  <div className="space-y-2 text-xs">
                    {examToPrint.questions?.map((q, idx) => {
                      const opts = getSanitizedOptions(q);
                      return (
                        <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold">س{idx + 1}: </span>
                            <span className="font-black text-emerald-800">
                              ({['أ', 'ب', 'ج', 'د'][q.correctOptionIndex]}) {opts[q.correctOptionIndex]}
                            </span>
                            {q.explanation && (
                              <div className="text-[10px] text-gray-600 mt-0.5">
                                التعليل: {q.explanation}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 shrink-0">
                            {q.cognitiveLevel || 'تطبيق'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
