import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, Sparkles, Brain, 
  HelpCircle, FastForward, RotateCcw, CheckCircle2, User, 
  MessageSquare, Sliders, ChevronLeft, ChevronRight, Award, Layers, BookOpen, 
  GitBranch, Smartphone, Monitor, CheckCircle, ListOrdered
} from 'lucide-react';
import { MarketplaceBook, Chapter } from '../../types';
import { InteractiveCanvas } from './InteractiveCanvas';
import { CurriculumMindMap } from './CurriculumMindMap';
import { fireConfetti } from '../../utils/confetti';
import { useLanguage } from '../../i18n/LanguageContext';

interface FullCurriculumExplanationProps {
  book: MarketplaceBook;
  currentUser?: any;
}

export const FullCurriculumExplanation: React.FC<FullCurriculumExplanationProps> = ({
  book,
  currentUser
}) => {
  const { dir, t } = useLanguage();
  const chapters = useMemo(() => book.chapters || [], [book.chapters]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'chapters' | 'transcript'>('canvas');
  
  // Batch generation state for all chapters
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: chapters.length, currentChapterTitle: '' });
  
  // Voice preferences
  const [voiceKarim, setVoiceKarim] = useState<string>('ar-XA-Chirp3-HD-Fenrir');
  const [voiceFarah, setVoiceFarah] = useState<string>('ar-XA-Chirp3-HD-Aoede');
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastLoadedSrcRef = useRef<string>('');

  const currentChapter = chapters[activeChapterIndex] || chapters[0];
  const explanation = currentChapter?.interactive_explanation || (currentChapter as any)?.interactiveExplanation || null;
  const timeline = useMemo(() => explanation?.timeline || [], [explanation]);
  const currentStep = useMemo(() => timeline[currentStepIndex] || timeline[0] || null, [timeline, currentStepIndex]);

  // Position Storage Key for Full Course
  const courseStorageKey = `interactive_v2_course_${book.id}`;

  // Count how many chapters have generated interactive explanations
  const readyChaptersCount = useMemo(() => {
    return chapters.filter(c => Boolean(c.interactive_explanation || (c as any)?.interactiveExplanation)).length;
  }, [chapters]);

  // Restore last saved course position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(courseStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.chIdx === 'number' && parsed.chIdx < chapters.length) {
          setActiveChapterIndex(parsed.chIdx);
          if (typeof parsed.stepIdx === 'number') {
            setCurrentStepIndex(parsed.stepIdx);
          }
        }
      }
    } catch (e) {}
  }, [book.id, chapters.length, courseStorageKey]);

  // Persist course position
  useEffect(() => {
    try {
      localStorage.setItem(courseStorageKey, JSON.stringify({
        chIdx: activeChapterIndex,
        stepIdx: currentStepIndex
      }));
    } catch (e) {}
  }, [activeChapterIndex, currentStepIndex, courseStorageKey]);

  // Audio Synchronization & Continuous Next Step/Chapter playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStep) return;

    const targetSrc = currentStep.audio_url || '';
    if (lastLoadedSrcRef.current !== targetSrc) {
      audio.src = targetSrc;
      lastLoadedSrcRef.current = targetSrc;
    }

    audio.playbackRate = playbackSpeed;
    audio.muted = isMuted;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [activeChapterIndex, currentStepIndex, currentStep, isPlaying, playbackSpeed, isMuted]);

  // Handle Audio Ended -> Auto advance to next step or next chapter (Continuous Experience)
  const handleAudioEnded = () => {
    if (currentStepIndex < timeline.length - 1) {
      // Advance to next step in current chapter
      setCurrentStepIndex(prev => prev + 1);
    } else if (activeChapterIndex < chapters.length - 1) {
      // Smoothly advance to NEXT CHAPTER in the course!
      const nextChIdx = activeChapterIndex + 1;
      setActiveChapterIndex(nextChIdx);
      setCurrentStepIndex(0);
      fireConfetti();
    } else {
      // Entire course finished!
      setIsPlaying(false);
      fireConfetti();
    }
  };

  // 1-Click Batch Generate All Pending Chapters
  const handleBatchGenerateAllChapters = async () => {
    if (isBatchGenerating) return;
    setIsBatchGenerating(true);

    try {
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        if (!ch.interactive_explanation && !(ch as any)?.interactiveExplanation) {
          setBatchProgress({
            current: i + 1,
            total: chapters.length,
            currentChapterTitle: ch.title
          });

          const res = await fetch('/api/v2/generate-interactive-explanation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId: book.id,
              chapterId: ch.id,
              title: ch.title,
              content: ch.content || ch.summary || '',
              mode: 'lesson_explanation',
              grade_level: book.grade_level,
              category: book.category,
              voiceKarim,
              voiceFarah
            })
          });

          const data = await res.json();
          if (res.ok && data.success && data.explanation) {
            ch.interactive_explanation = data.explanation;
            setBatchProgress(prev => ({ ...prev }));
          }
        }
      }
      fireConfetti();
    } catch (e: any) {
      console.warn('Batch generation notice:', e);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const jumpToChapter = (chIdx: number) => {
    setActiveChapterIndex(chIdx);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const toggleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  // Estimate total course duration (sum of all chapter durations)
  const totalCourseDurationMinutes = useMemo(() => {
    let totalSeconds = 0;
    chapters.forEach(ch => {
      const exp = ch.interactive_explanation;
      if (exp && exp.timeline) {
        exp.timeline.forEach((step: any) => {
          totalSeconds += (step.estimated_duration_seconds || 4);
        });
      } else {
        totalSeconds += 180; // Estimated 3 mins per ungenerated chapter
      }
    });
    return Math.round(totalSeconds / 60);
  }, [chapters]);

  return (
    <div className="space-y-4 sm:space-y-6 text-start animate-fade-in max-w-full overflow-hidden" dir={dir}>
      {/* Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          if (isPlaying && currentStepIndex < timeline.length - 1) {
            setTimeout(() => setCurrentStepIndex(prev => prev + 1), (currentStep?.estimated_duration_seconds || 4) * 1000);
          }
        }}
      />

      {/* 1. MASTER FULL CURRICULUM BANNER & CONTROLS */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-white max-w-full overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
                  🚀 مشغل شرح كامل المنهج المتصل ({readyChaptersCount}/{chapters.length} فصول جاهزة)
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  المدة الإجمالية المقدرة: ~{totalCourseDurationMinutes} دقيقة
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-white mt-1 truncate">
                {book.title} • الفصل {activeChapterIndex + 1}: {currentChapter?.title}
              </h3>
            </div>
          </div>

          {/* MAIN PLAYER CONTROLS */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* VOICE SETTINGS */}
            <button
              onClick={() => setIsVoiceSettingsOpen(!isVoiceSettingsOpen)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">الأصوات</span>
            </button>

            {/* PLAY / PAUSE BUTTON */}
            <button
              onClick={togglePlayPause}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل المنهج بالكامل'}</span>
            </button>

            {/* SPEED */}
            <button
              onClick={toggleSpeed}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 transition"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* CHAPTERS MILESTONE PROGRESS BAR */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>تقدم المنهج: الفصل {activeChapterIndex + 1} من {chapters.length}</span>
            <span>{Math.round(((activeChapterIndex + 1) / Math.max(1, chapters.length)) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
            {chapters.map((ch, idx) => {
              const isDone = idx < activeChapterIndex;
              const isCurrent = idx === activeChapterIndex;
              const isReady = Boolean(ch.interactive_explanation);

              return (
                <div
                  key={ch.id}
                  onClick={() => jumpToChapter(idx)}
                  className={`h-full flex-1 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                      : isDone
                      ? 'bg-emerald-500'
                      : isReady
                      ? 'bg-purple-600/70'
                      : 'bg-slate-700/60'
                  }`}
                  title={`${ch.title} (${isReady ? 'جاهز' : 'قيد الانتظار'})`}
                />
              );
            })}
          </div>
        </div>

        {/* BATCH GENERATE PENDING CHAPTERS PROMPT */}
        {readyChaptersCount < chapters.length && (
          <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                {isBatchGenerating 
                  ? `جاري تجهيز (${batchProgress.current}/${batchProgress.total}): ${batchProgress.currentChapterTitle}...` 
                  : `يوجد ${chapters.length - readyChaptersCount} فصول لم يتم تجهيز شرحها التفاعلي بعد.`}
              </span>
            </div>

            <button
              onClick={handleBatchGenerateAllChapters}
              disabled={isBatchGenerating}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs transition active:scale-95 disabled:opacity-60 shrink-0 cursor-pointer"
            >
              {isBatchGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin inline ml-1" /> : null}
              <span>{isBatchGenerating ? 'جاري التجهيز...' : '⚡ تجهيز وتوليد كافة الفصول المتبقية'}</span>
            </button>
          </div>
        )}
      </div>

      {/* MOBILE TABS (Canvas vs Chapters Playlist vs Transcript) */}
      <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'canvas' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>اللوحة التفاعلية</span>
        </button>
        <button
          onClick={() => setMobileTab('chapters')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'chapters' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>فهرس المنهج</span>
        </button>
        <button
          onClick={() => setMobileTab('transcript')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'transcript' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>الحوار</span>
        </button>
      </div>

      {/* 2. MAIN STAGE (7 COLS CANVAS / 5 COLS CHAPTERS & DIALOGUE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start max-w-full overflow-hidden">
        
        {/* RIGHT VIEW: INTERACTIVE CANVAS */}
        <div className={`lg:col-span-7 flex flex-col min-w-0 max-w-full ${mobileTab === 'canvas' ? 'block' : 'hidden lg:flex'}`}>
          <InteractiveCanvas
            actionType={currentStep?.canvas_action?.type || 'info_card'}
            payload={currentStep?.canvas_action?.payload}
            activeStepNumber={currentStepIndex + 1}
            speakerName={currentStep?.speaker === 'karim' ? 'كريم 👦' : 'فرح 👩‍🏫'}
          />
        </div>

        {/* LEFT VIEW: CHAPTERS PLAYLIST & DIALOGUE */}
        <div className={`lg:col-span-5 flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 max-h-[620px] overflow-hidden min-w-0 max-w-full ${
          mobileTab !== 'canvas' ? 'block' : 'hidden lg:flex'
        }`}>
          
          {/* CHAPTER SELECTOR TABS */}
          <div className="border-b border-slate-800 pb-3 shrink-0">
            <h4 className="text-xs font-black text-slate-300 mb-2 flex items-center justify-between">
              <span>📚 فصول المقرر (اختر فصلاً أو تابع بالترتيب):</span>
              <span className="text-[10px] text-purple-400 font-bold">{activeChapterIndex + 1}/{chapters.length}</span>
            </h4>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {chapters.map((ch, idx) => {
                const isSelected = idx === activeChapterIndex;
                const isReady = Boolean(ch.interactive_explanation || (ch as any)?.interactiveExplanation);

                return (
                  <button
                    key={ch.id}
                    onClick={() => jumpToChapter(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md'
                        : isReady
                        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-800/40 text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <span>فصل {idx + 1}</span>
                    {isReady && <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE CHAPTER TIMELINE DIALOGUE */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pl-1 scrollbar-thin">
            {timeline.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Brain className="w-8 h-8 text-purple-400 mx-auto animate-pulse" />
                <p className="text-xs font-bold">هذا الفصل لم يتم توليد شرحه بعد، اضغط على زر التجهيز أعلاه لتوليده فوراً.</p>
              </div>
            ) : (
              timeline.map((step: any, idx: number) => {
                const isCurrent = idx === currentStepIndex;
                const isKarim = step.speaker === 'karim';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer select-none text-start break-words ${
                      isCurrent
                        ? isKarim 
                          ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md' 
                          : 'bg-purple-950/90 border-purple-400 text-white shadow-md'
                        : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/50 text-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{isKarim ? '👦' : '👩‍🏫'}</span>
                        <span className={`text-[11px] font-black ${isKarim ? 'text-cyan-300' : 'text-purple-300'}`}>
                          {isKarim ? 'كريم' : 'فرح'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(step.trigger_time_seconds || 0)}ث
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed break-words font-medium">
                      {step.audio_text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. MASTER FULL-CURRICULUM MIND MAP (الخريطة الذهنية الشاملة لكامل المنهج) */}
      <div className="pt-4 max-w-full overflow-hidden">
        <CurriculumMindMap book={book} />
      </div>
    </div>
  );
};

export default FullCurriculumExplanation;
