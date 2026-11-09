import React, { useState, useEffect } from 'react';
import { 
  Play, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, 
  Video, BookOpen, Download, Monitor, Smartphone,
  User, Palette, ChevronDown, ChevronUp, Layers, Music
} from 'lucide-react';
import { MarketplaceBook, Chapter } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface ExplainrooStudioViewProps {
  book: MarketplaceBook;
  chapter: Chapter;
}

export const ExplainrooStudioView: React.FC<ExplainrooStudioViewProps> = ({
  book,
  chapter
}) => {
  const { t, dir } = useLanguage();
  // Generation & Player State for Current Lesson
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // Theme selection: Defaults to 'paper' (كراسة مسطرة) as the user's top preferred choice!
  const [selectedTheme, setSelectedTheme] = useState<'paper' | 'chalk' | 'midnight' | 'clean'>(() => {
    return (localStorage.getItem('osera_video_theme') as any) || 'paper';
  });

  // Background Music Style
  const [musicStyle, setMusicStyle] = useState<string>(() => {
    return localStorage.getItem('osera_music_style') || 'warm';
  });

  // Video topic focus & pedagogical depth
  const [videoTopicOption, setVideoTopicOption] = useState<'masterclass' | 'exercises' | 'concepts' | 'reels'>('masterclass');

  // Teacher Personalization State (Collapsible & Persistent)
  const [showBranding, setShowBranding] = useState<boolean>(false);
  const [teacherName, setTeacherName] = useState<string>(() => {
    return localStorage.getItem('osera_teacher_name') || '';
  });
  const [teacherPhone, setTeacherPhone] = useState<string>(() => {
    return localStorage.getItem('osera_teacher_phone') || '';
  });
  const [subjectName, setSubjectName] = useState<string>(() => {
    return localStorage.getItem('osera_subject_name') || (book.title || '');
  });

  // Save teacher branding to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('osera_video_theme', selectedTheme);
      localStorage.setItem('osera_music_style', musicStyle);
      localStorage.setItem('osera_teacher_name', teacherName);
      localStorage.setItem('osera_teacher_phone', teacherPhone);
      localStorage.setItem('osera_subject_name', subjectName);
    } catch (e) {}
  }, [selectedTheme, musicStyle, teacherName, teacherPhone, subjectName]);

  // Video Library & Playback State
  const [chapterVideos, setChapterVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [lessonVideoUrl, setLessonVideoUrl] = useState<string | null>(null);
  const [lessonVideoSizeMb, setLessonVideoSizeMb] = useState<number>(0);

  // Batch Video Generation State
  const [batchJob, setBatchJob] = useState<any | null>(null);
  const [isStartingBatch, setIsStartingBatch] = useState<boolean>(false);
  const [totalChaptersCount, setTotalChaptersCount] = useState<number>(0);
  const [chaptersWithVideoCount, setChaptersWithVideoCount] = useState<number>(0);

  // Live generation state
  const [isGeneratingLesson, setIsGeneratingLesson] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [lessonProgress, setLessonProgress] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const cleanChapterId = String(chapter.id || 'chapter').replace(/[^a-zA-Z0-9_-]/g, '_');

  const fetchBatchStatus = async () => {
    try {
      const res = await fetch(`/api/explainroo/batch-status/${book.id}`);
      if (res.ok) {
        const data = await res.json();
        setTotalChaptersCount(data.totalChaptersInBook || (book.chapters?.length || 0));
        setChaptersWithVideoCount(data.chaptersWithVideo || 0);
        if (data.job) {
          setBatchJob(data.job);
        }
      }
    } catch (e) {
      console.warn('Error fetching batch status:', e);
    }
  };

  const fetchChapterVideos = async () => {
    try {
      const res = await fetch(`/api/ebooks/${book.id}/chapters/${chapter.id}/videos`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos)) {
          setChapterVideos(data.videos);
          if (data.videos.length > 0 && !selectedVideo) {
            setSelectedVideo(data.videos[0]);
            setLessonVideoUrl(data.videos[0].videoUrl || data.videos[0].url);
            if (data.videos[0].aspectRatio) setAspectRatio(data.videos[0].aspectRatio);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching chapter videos:', e);
    }
  };

  // Check if lesson video already exists on mount & poll batch status
  useEffect(() => {
    checkLessonVideoStatus();
    fetchChapterVideos();
    fetchBatchStatus();
  }, [chapter.id, book.id]);

  useEffect(() => {
    if (batchJob?.status === 'running') {
      const interval = setInterval(() => {
        fetchBatchStatus();
        fetchChapterVideos();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [batchJob?.status, book.id]);

  const handleStartBatchVideoGeneration = async (forceAll = false) => {
    setIsStartingBatch(true);
    try {
      const computedTopic = videoTopicOption === 'masterclass'
        ? 'حصة تدريسية شاملة وكاملة من 10 إلى 15 مشهداً تغطي كافة المفاهيم والقوانين والتمارين بالتفصيل الأكاديمي'
        : videoTopicOption === 'exercises' 
          ? 'حل المسائل والتمارين النموذجية للدرس وتطبيق القوانين بالتفصيل خطوة بخطوة' 
          : videoTopicOption === 'reels' 
            ? 'ملخص سريع ومركز للدرس كبسولة سريعة' 
            : 'شرح مفاهيم الدرس الأساسية والمصطلحات العلمية';

      const computedType = videoTopicOption === 'reels' ? 'reels' : videoTopicOption === 'exercises' ? 'exercise_drill' : 'explainer';

      const res = await fetch('/api/explainroo/batch-generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          aspectRatio,
          videoTopic: computedTopic,
          videoType: computedType,
          theme: selectedTheme,
          musicStyle,
          teacherName,
          teacherPhone,
          subjectName,
          isDraft: true,
          onlyMissing: !forceAll
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.job) {
          setBatchJob(data.job);
        }
      }
    } catch (e) {
      console.error('Failed to trigger batch video generation:', e);
    } finally {
      setIsStartingBatch(false);
      fetchBatchStatus();
    }
  };

  const handleCancelBatchVideo = async () => {
    try {
      const res = await fetch(`/api/explainroo/batch-cancel/${book.id}`, { method: 'POST' });
      if (res.ok) {
        fetchBatchStatus();
      }
    } catch (e) {}
  };

  const checkLessonVideoStatus = async () => {
    try {
      const res = await fetch(`/api/explainroo/chapter-status/${cleanChapterId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isReady && data.videoUrl) {
          setLessonVideoUrl(data.videoUrl);
          setLessonVideoSizeMb(data.sizeMb || 0);
          setLessonProgress(100);
        }
      }
    } catch (e) {}
  };

  const handleSelectVideoFromLibrary = (vid: any) => {
    setSelectedVideo(vid);
    const url = vid.videoUrl || vid.url;
    if (url) {
      setLessonVideoUrl(url);
      setLessonVideoSizeMb(vid.sizeMb || 0);
      if (vid.aspectRatio) setAspectRatio(vid.aspectRatio);
    }
  };

  // Trigger One-Click Generation
  const handleGenerateLessonVideo = async () => {
    setIsGeneratingLesson(true);
    setGenerationError(null);
    setLessonProgress(15);
    setGenerationStep('جاري تحليل الدرس وتأليف الشرح البصري والصوتي...');

    const clientRunId = `run_${Date.now()}`;

    const computedTopic = videoTopicOption === 'masterclass'
      ? 'حصة تدريسية شاملة وكاملة من 15 إلى 25 مشهداً تغطي كافة المفاهيم والقوانين والتمارين بالتفصيل الأكاديمي'
      : videoTopicOption === 'exercises' 
        ? 'حل المسائل والتمارين النموذجية للدرس وتطبيق القوانين بالتفصيل خطوة بخطوة' 
        : videoTopicOption === 'reels' 
          ? 'ملخص سريع ومركز للدرس كبسولة سريعة' 
          : 'شرح مفاهيم الدرس الأساسية والمصطلحات العلمية';

    const computedType = videoTopicOption === 'reels' ? 'reels' : videoTopicOption === 'exercises' ? 'exercise_drill' : 'explainer';

    // Poll isolated strictly to this clientRunId
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/explainroo/chapter-status/${cleanChapterId}?runId=${clientRunId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.step) setGenerationStep(statusData.step);
          if (typeof statusData.progress === 'number' && statusData.progress > 0) {
            setLessonProgress(statusData.progress);
          }
          if (statusData.status === 'ready' && statusData.progress === 100 && statusData.videoUrl) {
            setLessonVideoUrl(statusData.videoUrl + '?t=' + Date.now());
            setLessonVideoSizeMb(statusData.sizeMb || 0);
            setIsGeneratingLesson(false);
            clearInterval(pollInterval);
            await fetchChapterVideos();
          }
        }
      } catch (err) {}
    }, 2500);

    try {
      const response = await fetch('/api/explainroo/generate-lesson-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          aspectRatio,
          videoTopic: computedTopic,
          videoType: computedType,
          theme: selectedTheme,
          musicStyle,
          teacherName,
          teacherPhone,
          subjectName,
          isDraft: true,
          force: true,
          runId: clientRunId
        })
      });

      const data = await response.json();
      clearInterval(pollInterval);

      if (response.ok && data.success && data.videoUrl) {
        setLessonVideoUrl(data.videoUrl + '?t=' + Date.now());
        setLessonProgress(100);
        setGenerationStep('اكتمل توليد الفيديو بنجاح! 🎉');
        await fetchChapterVideos();
      } else {
        setGenerationError(data.error || 'تعذر توليد الفيديو، يرجى المحاولة مرة أخرى.');
        setGenerationStep('حدث خطأ أثناء العملية.');
      }
    } catch (err: any) {
      clearInterval(pollInterval);
      setGenerationError(err.message || 'تعذر الاتصال بالخادم.');
      setGenerationStep('فشل الاتصال.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16 pt-2 text-start" dir={dir}>
      
      {/* 1. HEADER (Simple, Clean, Zero-Jargon) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{book.title || 'المقرر الدراسي'}</span>
            <span>•</span>
            <span className="text-slate-500">{t('video_studio.title', 'فيديو الشرح التفاعلي')}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {chapter.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {lessonVideoUrl && (
            <a
              href={lessonVideoUrl}
              download={`شرح_${chapter.title}.mp4`}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{t('video_studio.download_mp4', 'تحميل الفيديو (MP4)')}</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. THE HERO VIDEO STAGE (مركز العرض الرئيسي) */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <div className={`w-full ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm mx-auto' : 'aspect-video'} bg-slate-950 flex items-center justify-center relative`}>
          {lessonVideoUrl ? (
            <video 
              key={lessonVideoUrl}
              controls 
              autoPlay
              className="w-full h-full object-contain"
            >
              <source src={lessonVideoUrl} type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          ) : (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">لم يتم توليد فيديو لهذا الدرس بعد</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اختر مظهر السبورة واضغط على زر التوليد في الأسفل لصنع فيديو شرح تفاعلي متكامل للدرس.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 BATCH VIDEO MANAGER (توليد فيديوهات المنهج كاملاً في الخلفية) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 border border-indigo-500/30 shadow-xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black">
                  توليد فيديوهات جميع فصول المقرر في الخلفية (Batch Video Engine)
                </h3>
                {batchJob?.status === 'running' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>قيد المعالجة الآن</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300/80 mt-0.5">
                ينتج السيرفر فيديوهات لجميع الفصول تباعاً دون تجميد المتصفح، مع أولوية مطلقة لأي فيديو فردي تطلبه.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-slate-200">
              جاهز: <span className="font-mono text-emerald-300 font-black">{chaptersWithVideoCount}</span> / <span className="font-mono">{totalChaptersCount || (book.chapters?.length || 0)}</span> فصول
            </span>
          </div>
        </div>

        {/* Live Progress Bar if Batch is Running */}
        {batchJob?.status === 'running' ? (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-indigo-200">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span className="line-clamp-1">{batchJob.currentStep || 'جاري معالجة الفصول في الخلفية...'}</span>
              </div>
              <span className="font-mono text-amber-300 font-black">{batchJob.progressPercent || 0}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, batchJob.progressPercent || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>الفصل الحالي: <strong className="text-white">{batchJob.currentChapterTitle || 'قيد البدء'}</strong></span>
              <button
                type="button"
                onClick={handleCancelBatchVideo}
                className="text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
              >
                إيقاف مؤقت
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {chaptersWithVideoCount >= totalChaptersCount && totalChaptersCount > 0
                  ? 'رائع! جميع فصول هذا المقرر لديها فيديوهات شرح جاهزة.'
                  : `يتبقى ${Math.max(0, totalChaptersCount - chaptersWithVideoCount)} فصول تحتاج إلى توليد فيديوهات.`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStartBatchVideoGeneration(false)}
              disabled={isStartingBatch || isGeneratingLesson}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isStartingBatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري جدولة الفصول...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {chaptersWithVideoCount >= totalChaptersCount && totalChaptersCount > 0
                      ? 'إعادة توليد جميع الفصول من جديد'
                      : `توليد فيديوهات الفصول المتبقية (${Math.max(0, totalChaptersCount - chaptersWithVideoCount)}) 🚀`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 3. ONE-TOUCH CUSTOMIZATION STRIP (شريط التحكم والتشغيل الموحد) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* A. مظهر الشرح (THEME) */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>مظهر السبورة وطريقة العرض:</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTheme('paper')}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  selectedTheme === 'paper'
                    ? 'bg-amber-50 text-amber-950 border-amber-400 ring-2 ring-amber-300 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-sm shrink-0">📜</span>
                <div>
                  <div className="text-xs font-bold">كراسة مسطرة</div>
                  <div className="text-[10px] text-amber-700/80 font-normal">دفتر مدرسي مريح (الأفضل) ⭐</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('chalk')}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  selectedTheme === 'chalk'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-500 ring-2 ring-emerald-300 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center text-xs shrink-0 font-bold">✎</span>
                <div>
                  <div className="text-xs font-bold">سبورة خضراء</div>
                  <div className="text-[10px] text-emerald-700 font-normal">طباشير كلاسيك</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('midnight')}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  selectedTheme === 'midnight'
                    ? 'bg-slate-900 text-cyan-200 border-cyan-500 ring-2 ring-cyan-400 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-slate-800 text-cyan-300 flex items-center justify-center text-xs shrink-0 font-bold">⚡</span>
                <div>
                  <div className="text-xs font-bold">شاشة آيباد داكنة</div>
                  <div className="text-[10px] opacity-80 font-normal">عصري ومضيء</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('clean')}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  selectedTheme === 'clean'
                    ? 'bg-blue-50 text-blue-950 border-blue-400 ring-2 ring-blue-300 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs shrink-0 font-bold">💎</span>
                <div>
                  <div className="text-xs font-bold">رقمي ناصع</div>
                  <div className="text-[10px] text-blue-600 font-normal">خلفية بيضاء نقية</div>
                </div>
              </button>
            </div>
          </div>

          {/* B. أبعاد الفيديو والعمق البيداغوجي (FORMAT & PEDAGOGICAL DEPTH) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>العمق التدريسي وعدد المشاهد:</span>
              </label>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {videoTopicOption === 'masterclass' ? '🔥 10 - 15 مشهداً (5 دقائق كاملة)' : videoTopicOption === 'exercises' ? '✍️ 8 - 12 مشهداً' : videoTopicOption === 'concepts' ? '📺 6 - 8 مشاهد' : '⚡ 3 - 5 مشاهد'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setAspectRatio('16:9'); setVideoTopicOption('masterclass'); }}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  aspectRatio === '16:9' && videoTopicOption === 'masterclass'
                    ? 'bg-purple-700 text-white border-purple-700 ring-2 ring-purple-400 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-lg shrink-0">🏆</span>
                <div>
                  <div className="text-xs font-black">حصة كاملة مركزة (10 - 15 مشهداً)</div>
                  <div className="text-[10px] opacity-85 font-normal">شرح مفصل 5 دقائق بدون أي تكرار مع رسوم وأمثلة</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setAspectRatio('16:9'); setVideoTopicOption('exercises'); }}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  aspectRatio === '16:9' && videoTopicOption === 'exercises'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-lg shrink-0">✍️</span>
                <div>
                  <div className="text-xs font-bold">حل المسائل والتمارين (12 - 20 مشهداً)</div>
                  <div className="text-[10px] opacity-85 font-normal">تطبيق القوانين وحل المسائل بالأرقام خطوة بخطوة</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setAspectRatio('16:9'); setVideoTopicOption('concepts'); }}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  aspectRatio === '16:9' && videoTopicOption === 'concepts'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">شرح مفاهيم مركز (8 - 12 مشهداً)</div>
                  <div className="text-[10px] opacity-85 font-normal">تأسيس القواعد والمصطلحات الأساسية (4 - 6 دقائق)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setAspectRatio('9:16'); setVideoTopicOption('reels'); }}
                className={`p-3 rounded-2xl border text-start transition cursor-pointer flex items-center gap-2.5 ${
                  aspectRatio === '9:16' && videoTopicOption === 'reels'
                    ? 'bg-rose-600 text-white border-rose-600 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">ريلز للهاتف (3 - 5 مشاهد)</div>
                  <div className="text-[10px] opacity-85 font-normal">كبسولة سريعة ومكثفة (دقيقة ونصف)</div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* C. خلفية الموسيقى التصويرية (SOUNDTRACK SELECTION) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-amber-600" />
              <span>الموسيقى التصويرية المصاحبة:</span>
            </label>
            <span className="text-[10px] text-slate-500 font-normal">نغمات ذكية تعزز تفاعل الطالب دون التشويش على الشرح</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'warm', label: 'كلاسيكي دافئ', desc: 'كمان وبيانو', icon: '🎻' },
              { id: 'calm', label: 'هادئ تأملي', desc: 'نغمات استرخاء', icon: '🎹' },
              { id: 'upbeat', label: 'حماسي نشط', desc: 'إيقاع تحفيزي', icon: '⚡' },
              { id: 'tech', label: 'تقني عصري', desc: 'إلكتروني خفيف', icon: '💻' },
              { id: 'none', label: 'بدون موسيقى', desc: 'صوت الإلقاء فقط', icon: '🔇' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMusicStyle(m.id)}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  musicStyle === m.id
                    ? 'bg-amber-500/10 text-amber-900 border-amber-500 ring-2 ring-amber-400 font-black shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">{m.icon}</span>
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[10px] opacity-75 font-normal">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* D. COLLAPSIBLE TEACHER BRANDING (اسم المعلم اختياري وخلف زر بسيط) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowBranding(!showBranding)}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>إضافة اسمك ورقم هاتفك كشريط أسفل الفيديو (اختياري)</span>
            {showBranding ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showBranding && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسمك (أو اللقب):</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="مثال: أ/ أسامة مصطفى"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">المادة أو المقرر:</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder={book.title || 'رياضيات'}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم التواصل / الحجز:</label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 text-left ltr font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* D. LIVE PROGRESS INDICATOR (يظهر فقط أثناء المعالجة) */}
        {isGeneratingLesson && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-black text-indigo-950">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{generationStep || 'جاري إنتاج فيديو الحصة...'}</span>
              </div>
              <span className="font-mono text-indigo-600">{lessonProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-indigo-200/60 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${lessonProgress}%` }}
              />
            </div>
          </div>
        )}

        {generationError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{generationError}</span>
          </div>
        )}

        {/* E. THE SINGLE PRIMARY HERO ACTION BUTTON (الزر الرئيسي الأوحد) */}
        <div>
          <button
            type="button"
            onClick={handleGenerateLessonVideo}
            disabled={isGeneratingLesson}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-indigo-600/20 transition active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingLesson ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                <span>{t('video_studio.generating_progress', 'جاري معالجة فيديو الحصة والريندر... يرجى الانتظار')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>{t('video_studio.generate_video_btn', 'توليد فيديو الدرس الآن بنقرة واحدة 🚀')}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 4. LESSON VIDEO ARCHIVE (أرشيف فيديوهات الدرس المتوفرة) */}
      {chapterVideos.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
              <span>📚 فيديوهات سابقة مولدة لهذا الدرس</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {chapterVideos.length} فيديو
              </span>
            </h4>
            <span className="text-[11px] text-slate-400">انقر على أي فيديو لمشاهدته فوراً في المشغل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {chapterVideos.map((vid: any, idx: number) => {
              const isCurrent = (vid.videoUrl || vid.url) === lessonVideoUrl;
              const isVertical = vid.aspectRatio === '9:16';
              return (
                <div
                  key={vid.id || idx}
                  onClick={() => handleSelectVideoFromLibrary(vid)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      isVertical ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {isVertical ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                      <span>{isVertical ? '9:16 ريلز' : '16:9 كامل'}</span>
                    </span>

                    {vid.theme && (
                      <span className="text-[10px] font-bold text-slate-500">
                        {vid.theme === 'paper' ? '📜 كراسة' : vid.theme === 'midnight' ? '🌌 آيباد' : vid.theme === 'clean' ? '💎 رقمي' : '🟢 سبورة'}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-mono">
                      {vid.duration || '4 دقائق'}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {vid.title || `فيديو الشرح ${idx + 1}`}
                  </h5>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      {vid.sizeMb ? `${vid.sizeMb} MB` : ''}
                    </span>

                    <button
                      type="button"
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      {isCurrent ? 'معروض الآن' : 'تشغيل'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
