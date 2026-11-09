import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, Sparkles, Brain, 
  HelpCircle, FastForward, RotateCcw, CheckCircle2, User, 
  MessageSquare, Sliders, ChevronLeft, Award, Layers, ShieldCheck, Zap, 
  ArrowRight, Smartphone, Monitor, Mic, Headphones, RotateCw
} from 'lucide-react';
import { Chapter, MarketplaceBook } from '../../types';
import { InteractiveCanvas } from './InteractiveCanvas';
import { fireConfetti } from '../../utils/confetti';
import { useLanguage } from '../../i18n/LanguageContext';

interface InteractiveLessonExplanationProps {
  book: MarketplaceBook;
  chapter: Chapter;
  currentUser?: any;
}

export const InteractiveLessonExplanation: React.FC<InteractiveLessonExplanationProps> = ({
  book,
  chapter,
  currentUser
}) => {
  const { dir, t } = useLanguage();
  const [explanation, setExplanation] = useState<any>(chapter.interactive_explanation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.25);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'transcript'>('canvas');
  
  // Voice selection states (friendly names)
  const [voiceKarim, setVoiceKarim] = useState<string>('ar-XA-Chirp3-HD-Fenrir');
  const [voiceFarah, setVoiceFarah] = useState<string>('ar-XA-Chirp3-HD-Aoede');
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastLoadedSrcRef = useRef<string>('');

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  };

  // Local storage position key
  const storageKey = `interactive_pos_${book.id}_${chapter.id}`;

  // Check if explanation was previously saved in database & restore last position
  useEffect(() => {
    let isMounted = true;

    const checkExistingExplanation = async () => {
      setIsCheckingSaved(true);

      // Check saved position in local storage
      try {
        const savedPos = localStorage.getItem(storageKey);
        if (savedPos) {
          const parsed = parseInt(savedPos, 10);
          if (!isNaN(parsed) && parsed > 0) {
            setCurrentStepIndex(parsed);
          }
        }
      } catch (e) {}

      if (chapter.interactive_explanation) {
        setExplanation(chapter.interactive_explanation);
        setIsCheckingSaved(false);
        return;
      }

      try {
        const res = await fetch(`/api/v2/interactive-explanation/${book.id}/${chapter.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.explanation && isMounted) {
            setExplanation(data.explanation);
            chapter.interactive_explanation = data.explanation;
          }
        }
      } catch (e) {
        console.warn('[InteractiveLesson] Check saved notice:', e);
      } finally {
        if (isMounted) setIsCheckingSaved(false);
      }
    };

    checkExistingExplanation();

    return () => {
      isMounted = false;
    };
  }, [book.id, chapter.id]);

  // Persist current step index to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(currentStepIndex));
    } catch (e) {}
  }, [currentStepIndex, storageKey]);

  // Generate explanation upon explicit user action
  const handleGenerateExplanation = async (force: boolean = false) => {
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentStepIndex(0);

    try {
      const res = await fetch('/api/v2/generate-interactive-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: chapter.id,
          title: chapter.title,
          content: chapter.content || chapter.summary || '',
          mode: 'lesson_explanation',
          grade_level: book.grade_level,
          category: book.category,
          voiceKarim,
          voiceFarah
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.explanation) {
        setExplanation(data.explanation);
        chapter.interactive_explanation = data.explanation;
        fireConfetti();
      } else {
        alert(data.error || 'فشل توليد الشرح التفاعلي للدرس.');
      }
    } catch (e: any) {
      alert('حدث خطأ أثناء الاتصال بمحرك الشرح التفاعلي: ' + (e.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const timeline = useMemo(() => {
    return explanation?.timeline || [];
  }, [explanation]);

  const currentStep = useMemo(() => {
    return timeline[currentStepIndex] || timeline[0] || null;
  }, [timeline, currentStepIndex]);

  // Audio Playback & Step Handling with seamless RESUME support
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
  }, [currentStepIndex, currentStep, isPlaying, playbackSpeed, isMuted]);

  // Handle Audio Ended -> Advance to next step
  const handleAudioEnded = () => {
    if (currentStepIndex < timeline.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      fireConfetti();
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const restartFromBeginning = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    setIsPlaying(true);
  };

  const toggleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  // If checking database, show smooth loading spinner
  if (isCheckingSaved) {
    return (
      <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[320px] bg-slate-900/60 border border-slate-800 rounded-3xl">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold">جاري فحص الشروحات المحفوظة في قاعدة البيانات...</span>
      </div>
    );
  }

  // ========================================================
  // 🌟 INITIAL LAUNCHPAD HERO (SHOWN IF NOT YET GENERATED)
  // ========================================================
  if (!explanation) {
    return (
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-fade-in text-white max-w-xl mx-auto" dir={dir}>
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-teal-500/20">
            <Mic className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-white">
              الشرح التفاعلي الصوتي: "{chapter.title}"
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              حوار صوتي ممتع بين كريم وفرح، متزامن لحظة بلحظة مع لوحة توضيحية ذكية للدرس.
            </p>
          </div>
        </div>

        {/* VOICE SELECTOR BUTTONS (SIMPLE & HUMAN-FRIENDLY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
              <span>👦</span>
              <span>صوت كريم (المحاور):</span>
            </span>
            <select
              value={voiceKarim}
              onChange={(e) => setVoiceKarim(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="ar-XA-Chirp3-HD-Fenrir">صوت كريم (طبيعي / هادئ) 🎙️</option>
              <option value="ar-XA-Chirp3-HD-Puck">صوت كريم (حماسي وتفاعلي)</option>
              <option value="ar-EG-ShakirNeural">صوت كريم (لهجة مصرية)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
              <span>👩‍🏫</span>
              <span>صوت فرح (المعلمة):</span>
            </span>
            <select
              value={voiceFarah}
              onChange={(e) => setVoiceFarah(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="ar-XA-Chirp3-HD-Aoede">صوت فرح (واضح / تعليمي) 🎙️</option>
              <option value="ar-XA-Chirp3-HD-Kore">صوت فرح (معلمة هادئة)</option>
              <option value="ar-EG-SalmaNeural">صوت فرح (لهجة مصرية)</option>
            </select>
          </div>
        </div>

        {/* 🚀 PRIMARY START BUTTON */}
        <button
          onClick={() => handleGenerateExplanation(false)}
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 hover:from-teal-400 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-500/25 transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>جاري بناء الشرح المتزامن واللوحة التفاعلية...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>🚀 ابدأ الاستماع والشرح التفاعلي الآن</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // ========================================================
  // 🌟 ACTIVE INTERACTIVE EXPLANATION STUDIO
  // ========================================================
  return (
    <div className="space-y-4 sm:space-y-6 text-start animate-fade-in max-w-full overflow-hidden" dir={dir}>
      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          if (isPlaying && currentStepIndex < timeline.length - 1) {
            setTimeout(() => setCurrentStepIndex(prev => prev + 1), (currentStep?.estimated_duration_seconds || 4) * 1000);
          }
        }}
      />

      {/* 1. RESPONSIVE CONTROLLER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 text-white max-w-full overflow-hidden">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black border border-teal-500/30 shrink-0">
                ✨ متزامن ومحفوظ 🔒
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                الخطوة {currentStepIndex + 1} من {timeline.length}
              </span>
            </div>
            <h3 className="font-black text-xs sm:text-sm md:text-base text-white mt-0.5 truncate">
              {explanation?.metadata?.title || chapter.title}
            </h3>
          </div>
        </div>

        {/* CONTROLS (STICKY TOP PLAYER BAR WITH 10S SKIP, PLAY/PAUSE, SPEED) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* SKIP 10S BACKWARD */}
          <button
            onClick={() => skipSeconds(-10)}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            title="تراجع 10 ثوانٍ"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px]">10ث</span>
          </button>

          {/* PLAY / PAUSE BUTTON */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-teal-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'إيقاف' : currentStepIndex > 0 ? 'استئناف' : 'تشغيل'}</span>
          </button>

          {/* SKIP 10S FORWARD */}
          <button
            onClick={() => skipSeconds(10)}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            title="تقديم 10 ثوانٍ"
          >
            <RotateCw className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px]">10ث</span>
          </button>

          {/* SPEED SELECTOR */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            {[1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setPlaybackSpeed(s);
                  if (audioRef.current) audioRef.current.playbackRate = s;
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  playbackSpeed === s ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* RESTART FROM BEGINNING */}
          {currentStepIndex > 0 && (
            <button
              onClick={restartFromBeginning}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="إعادة التشغيل من البداية"
            >
              <RotateCcw className="w-4 h-4 text-slate-400 hover:text-teal-400" />
            </button>
          )}

          {/* REGENERATE */}
          <button
            onClick={() => handleGenerateExplanation(true)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="إعادة توليد الشرح التفاعلي"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* MOBILE SEGMENT TOGGLE (Canvas vs Transcript on Small Screens) */}
      <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'canvas' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>اللوحة التفاعلية</span>
        </button>
        <button
          onClick={() => setMobileTab('transcript')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'transcript' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>الحوار الصوتي</span>
        </button>
      </div>

      {/* 2. MAIN SPLIT INTERACTIVE STAGE (Fluid & Responsive Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start max-w-full overflow-hidden">
        
        {/* RIGHT / MAIN VIEW: INTERACTIVE CANVAS */}
        <div className={`lg:col-span-7 flex flex-col min-w-0 max-w-full ${mobileTab === 'canvas' ? 'block' : 'hidden lg:flex'}`}>
          <InteractiveCanvas
            actionType={currentStep?.canvas_action?.type || 'info_card'}
            payload={currentStep?.canvas_action?.payload}
            activeStepNumber={currentStepIndex + 1}
            speakerName={currentStep?.speaker === 'karim' ? 'كريم 👦' : 'فرح 👩‍🏫'}
          />
        </div>

        {/* LEFT VIEW: DUAL-SPEAKER LIVE DIALOGUE & TIMELINE */}
        <div className={`lg:col-span-5 flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 max-h-[580px] overflow-hidden min-w-0 max-w-full ${
          mobileTab === 'transcript' ? 'block' : 'hidden lg:flex'
        }`}>
          
          {/* TOP HOST STATUS CARDS */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800 shrink-0">
            <div className={`p-2.5 rounded-2xl border transition truncate ${
              currentStep?.speaker === 'karim' && isPlaying
                ? 'bg-cyan-950/80 border-cyan-400 shadow-md'
                : 'bg-slate-800/60 border-slate-700/60'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  👦
                </div>
                <div className="truncate">
                  <span className="text-xs font-black text-white block truncate">كريم</span>
                  <span className="text-[9px] text-cyan-300 block truncate">
                    {currentStep?.speaker === 'karim' && isPlaying ? 'يتحدث الآن 🎙️' : 'مستمع'}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-2xl border transition truncate ${
              currentStep?.speaker === 'farah' && isPlaying
                ? 'bg-purple-950/80 border-purple-400 shadow-md'
                : 'bg-slate-800/60 border-slate-700/60'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  👩‍🏫
                </div>
                <div className="truncate">
                  <span className="text-xs font-black text-white block truncate">فرح</span>
                  <span className="text-[9px] text-purple-300 block truncate">
                    {currentStep?.speaker === 'farah' && isPlaying ? 'تشرح الآن 🎙️' : 'مستمعة'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE DIALOGUE SCROLLER (Fluid & Break-words) */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pl-1 scrollbar-thin">
            {timeline.map((step: any, idx: number) => {
              const isCurrent = idx === currentStepIndex;
              const isKarim = step.speaker === 'karim';

              return (
                <div
                  key={idx}
                  onClick={() => jumpToStep(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-start break-words ${
                    isCurrent
                      ? isKarim 
                        ? 'bg-cyan-950/95 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-500/30' 
                        : 'bg-purple-950/95 border-purple-400 text-white shadow-lg ring-2 ring-purple-500/30'
                      : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/50 text-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{isKarim ? '👦' : '👩‍🏫'}</span>
                      <span className={`text-[11px] font-black ${isKarim ? 'text-cyan-300' : 'text-purple-300'}`}>
                        {isKarim ? 'كريم' : 'فرح'}
                      </span>
                      {isCurrent && isPlaying && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                          <span>🎙️ يتحدث الآن</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {step.canvas_action?.type === 'interactive_quiz' && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          سؤال ❓
                        </span>
                      )}
                      {step.canvas_action?.type === 'mermaid_diagram' && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold">
                          مخطط 📊
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(step.trigger_time_seconds || 0)}ث
                      </span>
                    </div>
                  </div>

                  {/* KARAOKE HIGHLIGHTED TEXT */}
                  <p className={`text-xs leading-relaxed break-words transition-all ${
                    isCurrent 
                      ? 'font-black text-amber-200 text-sm drop-shadow-xs bg-amber-400/10 p-1.5 rounded-xl border border-amber-400/20' 
                      : 'font-medium text-slate-300'
                  }`}>
                    {step.audio_text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLessonExplanation;
