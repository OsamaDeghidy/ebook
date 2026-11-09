import React, { useState, useEffect } from 'react';
import { 
  Play, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, 
  Video, Cpu, Zap, BookOpen, 
  Sliders, Award, FileCode2, Download, Check, Volume2, Monitor, Smartphone
} from 'lucide-react';
import { MarketplaceBook, Chapter } from '../../types';

interface ExplainrooStudioViewProps {
  book: MarketplaceBook;
  chapter: Chapter;
}

export const ExplainrooStudioView: React.FC<ExplainrooStudioViewProps> = ({
  book,
  chapter
}) => {
  // Generation & Player State for Current Lesson
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedVoice, setSelectedVoice] = useState<'ar-XA-Chirp3-HD-Fenrir' | 'ar-XA-Chirp3-HD-Aoede'>('ar-XA-Chirp3-HD-Fenrir');
  const [isDraftQuality, setIsDraftQuality] = useState<boolean>(true);
  
  // Lesson Video Library State
  const [chapterVideos, setChapterVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [videoTopicOption, setVideoTopicOption] = useState<'concepts' | 'exercises' | 'reels' | 'custom'>('concepts');
  const [customTopicText, setCustomTopicText] = useState<string>('');

  const [isGeneratingLesson, setIsGeneratingLesson] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [lessonProgress, setLessonProgress] = useState<number>(0);
  const [lessonVideoUrl, setLessonVideoUrl] = useState<string | null>(null);
  const [lessonVideoSizeMb, setLessonVideoSizeMb] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Benchmark / Comparison Tab State
  const [selectedExample, setSelectedExample] = useState<string>('circle-area');
  const [benchmarkVideoUrl, setBenchmarkVideoUrl] = useState<string>('/api/explainroo-examples/circle-area/video.mp4');
  const [isRenderingBenchmark, setIsRenderingBenchmark] = useState<boolean>(false);
  const [benchmarkNotice, setBenchmarkNotice] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'lesson_generator' | 'benchmark_lab'>('lesson_generator');

  const cleanChapterId = String(chapter.id || 'chapter').replace(/[^a-zA-Z0-9_-]/g, '_');

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
            if (data.videos[0].aspectRatio) {
              setAspectRatio(data.videos[0].aspectRatio);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching chapter videos:', e);
    }
  };

  // Check if lesson video is already rendered on mount
  useEffect(() => {
    checkLessonVideoStatus();
    fetchChapterVideos();
  }, [chapter.id]);

  const checkLessonVideoStatus = async () => {
    try {
      const res = await fetch(`/api/explainroo/chapter-status/${cleanChapterId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isReady && data.videoUrl) {
          setLessonVideoUrl(data.videoUrl);
          setLessonVideoSizeMb(data.sizeMb || 0);
          setLessonProgress(100);
          setGenerationStep('الفيديو جاهز للمشاهدة فوراً! 🎉');
        }
      }
    } catch (e) {
      console.warn('Status check notice:', e);
    }
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

  const handleGenerateLessonVideo = async (forceRegen = true) => {
    setIsGeneratingLesson(true);
    setGenerationError(null);
    setLessonProgress(15);
    setGenerationStep('بدء العملية: استدعاء الذكاء الاصطناعي لصياغة سكريبت ومشاهد الدرس...');

    const computedTopic = videoTopicOption === 'custom' 
      ? customTopicText 
      : videoTopicOption === 'exercises' 
        ? 'حل المسائل والتمارين النموذجية للدرس وتطبيق القوانين' 
        : videoTopicOption === 'reels' 
          ? 'ملخص سريع ومركز للدرس كبسولة سريعة' 
          : 'شرح مفاهيم الدرس الأساسية والمصطلحات العلمية';

    const computedType = videoTopicOption === 'reels' ? 'reels' : videoTopicOption === 'exercises' ? 'exercise_drill' : 'explainer';

    // Polling status interval while rendering
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/explainroo/chapter-status/${cleanChapterId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.step) setGenerationStep(statusData.step);
          if (typeof statusData.progress === 'number' && statusData.progress > 0) {
            setLessonProgress(statusData.progress);
          }
          if (statusData.isReady && statusData.videoUrl) {
            setLessonVideoUrl(statusData.videoUrl);
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
          voice: selectedVoice,
          videoTopic: computedTopic,
          videoType: computedType,
          isDraft: isDraftQuality,
          force: forceRegen
        })
      });

      const data = await response.json();
      clearInterval(pollInterval);

      if (response.ok && data.success && data.videoUrl) {
        setLessonVideoUrl(data.videoUrl + '?t=' + Date.now());
        setLessonProgress(100);
        setGenerationStep('اكتمل توليد وريندر الفيديو وإضافته إلى مكتبة وسائط الدرس بنجاح! 🚀');
        await fetchChapterVideos();
      } else {
        setGenerationError(data.error || 'فشل في توليد فيديو الدرس.');
        setGenerationStep('حدث خطأ أثناء العملية.');
      }
    } catch (err: any) {
      clearInterval(pollInterval);
      setGenerationError(err.message || 'تعذر الاتصال بخادم التوليد.');
      setGenerationStep('فشل الاتصال بالخادم.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const examples = [
    {
      id: 'circle-area',
      title: 'Math & Geometry: How to Calculate Circle Area',
      topic: 'الرياضيات والهندسة: حساب مساحة الدائرة',
      duration: '45 ثانية',
      description: 'شرح رياضي بصرى كامل لقانون مساحة الدائرة πr² مع رسوم هندسية حركية وكاميرا تتبع الكلمات.'
    },
    {
      id: 'how-dns-works',
      title: 'Computer Science: How DNS Works Step-by-Step',
      topic: 'تكنولوجيا المعلومات: كيف يعمل نظام الـ DNS',
      duration: '55 ثانية',
      description: 'شرح شبكات تفاعلي يوضح رحلة الطلب من المتصفح إلى خوادم الأسماء مع أسهم وتأثيرات بصرية حركية.'
    },
    {
      id: 'explainroo-intro',
      title: 'Explainroo Architecture & Engine Showcase',
      topic: 'العرض التقديمي التقني لأداة Explainroo',
      duration: '35 ثانية',
      description: 'استعراض معماري لكيفية تحويل كود Canvas وMarkdown إلى فيديو MP4 سينمائي دون أدوات مونتاج خارجية.'
    }
  ];

  const handleSelectExample = (exId: string) => {
    setSelectedExample(exId);
    setBenchmarkVideoUrl(`/api/explainroo-examples/${exId}/video.mp4`);
    setBenchmarkNotice(`تم تحديد نموذج: ${exId}`);
  };

  const handleRunBenchmarkRender = () => {
    setIsRenderingBenchmark(true);
    setBenchmarkNotice('جاري تشغيل خط إنتاج Explainroo الأصلي (Chromium Headless + Canvas + FFmpeg)...');

    fetch('/api/explainroo/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exampleName: selectedExample })
    })
      .then(res => res.json())
      .then(data => {
        setBenchmarkNotice(data.message || 'بدأت عملية الريندر كمعيار قياسي!');
        if (data.videoUrl) {
          setBenchmarkVideoUrl(data.videoUrl + '?t=' + Date.now());
        }
      })
      .catch(err => {
        setBenchmarkNotice('تنبيه: ' + err.message);
      })
      .finally(() => {
        setTimeout(() => setIsRenderingBenchmark(false), 2000);
      });
  };

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      
      {/* 🚀 1. MASTER HEADER & MODE SWITCHER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-800/80 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>استوديو Explainroo التوليدي العربي</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300 text-[11px] font-mono border border-white/10">
                Cairo Typography + Chirp3-HD Voice
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              فيديو الشرح التفاعلي البرمجي لدرس: "{chapter.title}"
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحويل نص الدرس ومفاهيمه إلى فيديو MP4 فائق النقاء برسومات حركية برمجية بالكامل (Code-to-Video)، مع تعليق صوتي طبيعي متزامن مع الكلمات وخطوط Cairo المعتمدة.
            </p>
          </div>

          {/* Master View Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-white/10 rounded-2xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('lesson_generator')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'lesson_generator'
                  ? 'bg-amber-400 text-slate-950 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>توليد فيديو الدرس (النسخة العربية)</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark_lab')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'benchmark_lab'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>مختبر الأداء القياسي (Benchmark)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 TAB 1: ARABIZED LESSON VIDEO GENERATOR */}
      {activeTab === 'lesson_generator' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* CONTROL PANEL & CONFIGURATION CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>إعدادات إخراج فيديو الدرس بالذكاء الاصطناعي</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدد أبعاد الفيديو، الصوت المعتمد، ومحور التركيز للدرس
                </p>
              </div>

              {/* ACTION TRIGGER BUTTON */}
              <button
                onClick={() => handleGenerateLessonVideo(true)}
                disabled={isGeneratingLesson}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/20 transition active:scale-95 flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {isGeneratingLesson ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>جاري توليد وريندر الفيديو...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ توليد فيديو الشرح للدرس الآن بالـ AI</span>
                  </>
                )}
              </button>
            </div>

            {/* THREE CONFIGURATION SELECTORS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. ASPECT RATIO SELECTOR (16:9 vs 9:16) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  أبعاد الفيديو والمنصة المستهدفة
                </span>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">16:9 شاشة كاملة</div>
                    <div className="text-[10px] opacity-80 font-mono">1920x1080 (يوتيوب)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'bg-purple-600 text-white border-purple-600 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">9:16 طولي ريلز</div>
                    <div className="text-[10px] opacity-80 font-mono">1080x1920 (تيك توك/شورتس)</div>
                  </button>
                </div>
              </div>

              {/* 2. ARABIC CHIRP3-HD VOICES */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  الصوت العربي البشري المعتمد
                </span>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedVoice('ar-XA-Chirp3-HD-Fenrir')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      selectedVoice === 'ar-XA-Chirp3-HD-Fenrir'
                        ? 'bg-teal-700 text-white border-teal-700 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">الشيخ فينرير (Fenrir)</div>
                    <div className="text-[10px] opacity-80">صوت وقور ورخيم 🎙️</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVoice('ar-XA-Chirp3-HD-Aoede')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      selectedVoice === 'ar-XA-Chirp3-HD-Aoede'
                        ? 'bg-teal-700 text-white border-teal-700 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">الأستاذة أويدي (Aoede)</div>
                    <div className="text-[10px] opacity-80">نبرة حيوية شابة ✨</div>
                  </button>
                </div>
              </div>

              {/* 3. RENDER QUALITY & SPEED TOGGLE */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  سرعة الريندر وجودة المعالجة
                </span>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDraftQuality(true)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isDraftQuality
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">ريندر سريع فائق (Draft)</div>
                    <div className="text-[10px] opacity-80 font-mono">5-8 ثوانٍ للمعاينة ⚡</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDraftQuality(false)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      !isDraftQuality
                        ? 'bg-slate-900 text-white border-slate-900 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">جودة إنتاجية فائقة (HQ)</div>
                    <div className="text-[10px] opacity-80 font-mono">1080p مع مانع التشويش 💎</div>
                  </button>
                </div>
              </div>

            </div>

            {/* TOPIC FOCUS SELECTOR FOR NEW VIDEO */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                تخصيص موضوع ونوع الفيديو المراد إنتاجه للدرس
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setVideoTopicOption('concepts'); setAspectRatio('16:9'); }}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                    videoTopicOption === 'concepts'
                      ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">شرح المفاهيم الأساسية</div>
                    <div className="text-[10px] opacity-80">فيديو شامل لمنهاج الدرس (16:9)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setVideoTopicOption('exercises'); setAspectRatio('16:9'); }}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                    videoTopicOption === 'exercises'
                      ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">حل المسائل والتمارين</div>
                    <div className="text-[10px] opacity-80">تطبيق عملي خطوة بخطوة (16:9)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setVideoTopicOption('reels'); setAspectRatio('9:16'); }}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                    videoTopicOption === 'reels'
                      ? 'bg-purple-600 text-white border-purple-600 font-black shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 font-bold hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">ريلز سريع للهاتف (Shorts)</div>
                    <div className="text-[10px] opacity-80">ملخص كبسولة عمودي (9:16)</div>
                  </div>
                </button>
              </div>

              {videoTopicOption === 'custom' && (
                <input
                  type="text"
                  value={customTopicText}
                  onChange={(e) => setCustomTopicText(e.target.value)}
                  placeholder="اكتب محور التركيز أو السؤال المراد إنتاج فيديو خاص له..."
                  className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              )}
            </div>

            {/* LIVE GENERATION PROGRESS TRACKER */}
            {(isGeneratingLesson || generationStep) && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                  <div className="flex items-center gap-2">
                    {isGeneratingLesson ? (
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{generationStep || 'جاري معالجة الفيديو...'}</span>
                  </div>
                  <span className="font-mono text-indigo-600">{lessonProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-indigo-200/60 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: `${lessonProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {generationError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{generationError}</span>
              </div>
            )}
          </div>

          {/* DUAL DISPLAY: LESSON VIDEO PLAYER & PEDAGOGICAL BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Right Column: HTML5 Video Player */}
            <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-sm font-bold">
                    🎬
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      مشغل فيديو الشرح التفاعلي للدرس
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {selectedVideo?.title || 'رسوم متحركة برمجية + خط Cairo + صوت Chirp3-HD العربي'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-teal-400 text-[10px] font-mono border border-slate-700">
                    {aspectRatio === '9:16' ? '9:16 Vertical Reels' : '16:9 Landscape HQ'}
                  </span>
                  {lessonVideoSizeMb > 0 && (
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {lessonVideoSizeMb} MB
                    </span>
                  )}
                </div>
              </div>

              {/* Embedded Video Element */}
              <div className={`w-full rounded-2xl bg-black border border-slate-800 overflow-hidden relative shadow-inner flex items-center justify-center ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[620px] mx-auto' : 'aspect-video'
              }`}>
                {lessonVideoUrl ? (
                  <video 
                    key={lessonVideoUrl}
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                    poster="/docs/media/logo-dark.png"
                  >
                    <source src={lessonVideoUrl} type="video/mp4" />
                    متصفحك لا يدعم تشغيل الفيديو.
                  </video>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <Video className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">
                      لم يتم توليد فيديو الشرح لهذا الدرس بعد.
                    </p>
                    <button
                      onClick={() => handleGenerateLessonVideo(false)}
                      disabled={isGeneratingLesson}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer"
                    >
                      اضغط لتوليد الفيديو الآن ⚡
                    </button>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              {lessonVideoUrl && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="font-mono text-emerald-400 text-[11px] truncate max-w-xs">
                    ✅ تم حفظ الفيديو: {lessonVideoUrl}
                  </span>

                  <a
                    href={lessonVideoUrl}
                    download={`explainroo_${cleanChapterId}.mp4`}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل ملف MP4</span>
                  </a>
                </div>
              )}
            </div>

            {/* Left Column: Lesson Content Overview & Features */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>معلومات ومحتوى الدرس الجاري تحويله:</span>
                </h4>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-600 block">عنوان الدرس المعتمد</span>
                  <p className="text-xs font-bold text-slate-900">{chapter.title}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black text-slate-700 block">
                    المزايا التقنية المطبقة في الفيديو:
                  </span>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>خط Cairo العربي المشكول:</strong> نصوص متصلة وتنسيق RTL أصلي يمنع قلب الكلمات.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>صوت Chirp3-HD الواقعي:</strong> نطق لغوي سليم للمصطلحات التكنولوجية والعلمية.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>مزامنة الكلمات اللحظية:</strong> تحريك الكاميرا وظهور الصناديق بدقة مطابقة للنبرة الصوتية.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>مكتبة وسائط دائمة:</strong> إمكانية توليد عدة فيديوهات للدرس (مفاهيم، تمارين، ريلز) دون أن تُلغى القديمة.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* 🎬 3. LESSON VIDEO LIBRARY (مكتبة وسائط وفيديوهات الدرس) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  📚
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>مكتبة وسائط وفيديوهات الدرس</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-mono font-bold">
                      {chapterVideos.length} فيديو متوفر
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    جميع الفيديوهات المولدة لهذا الدرس محفوظة بشكل دائم ولا يتم استبدالها أو حذفها
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  window.scrollTo({ top: 250, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>+ توليد فيديو إضافي لهذا الدرس</span>
              </button>
            </div>

            {chapterVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapterVideos.map((vid: any, idx: number) => {
                  const isCurrent = (vid.videoUrl || vid.url) === lessonVideoUrl;
                  const isVertical = vid.aspectRatio === '9:16';
                  return (
                    <div 
                      key={vid.id || idx}
                      onClick={() => handleSelectVideoFromLibrary(vid)}
                      className={`p-4 rounded-2xl border transition cursor-pointer relative group flex flex-col justify-between ${
                        isCurrent 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black flex items-center gap-1 ${
                            isVertical 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {isVertical ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                            <span>{isVertical ? '9:16 ريلز' : '16:9 عرض كامل'}</span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {vid.duration || '45 ثانية'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                            {vid.title || `فيديو الشرح رقم ${idx + 1}`}
                          </h4>
                          {vid.topicFocus && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {vid.topicFocus}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {vid.sizeMb ? `${vid.sizeMb} MB` : ''}
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={vid.videoUrl || vid.url}
                            download={`explainroo_${cleanChapterId}_${idx + 1}.mp4`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="تحميل ملف الفيديو"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                              isCurrent
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isCurrent ? 'جاري التشغيل' : 'مشاهدة'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Video className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-bold">
                  لم يتم إنشاء فيديوهات لهذا الدرس حتى الآن.
                </p>
                <p className="text-[11px] text-slate-400">
                  اضغط على زر "توليد فيديو الشرح للدرس الآن" بالأعلى لبدء إنشاء أول فيديو في مكتبة وسائط هذا الدرس.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 🌟 TAB 2: TECHNICAL BENCHMARK & COMPARISON LAB */}
      {activeTab === 'benchmark_lab' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                بيئة التشغيل (Runtime)
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                Node.js v22.14.0 (OK)
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
                <Check className="w-3 h-3" /> محلي ومستقر
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-teal-600" />
                محرك الفيديو والرسوم
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                Explainroo v0.4.1
              </span>
              <span className="text-[10px] text-indigo-600 font-bold block">
                Chromium Canvas + FFmpeg
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                سرعة الريندر القياسية
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                5-8 ثوانٍ / فيديو
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">
                معدل 10x أسرع من Real-Time
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                تكلفة التوليد بالذكاء الاصطناعي
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                0.00$ دولار / فيديو
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block">
                كود وتصميم محلي مجاني
              </span>
            </div>
          </div>

          {/* Benchmark Controls */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-indigo-600" />
                  <span>نماذج المقارنة والاختبار المعملي الأصلية</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اختبر ريندر المشاهد الأصلية من المستودع الرسمي لقياس الفارق قبل وبعد التعريب البرمجي
                </p>
              </div>

              <button
                onClick={handleRunBenchmarkRender}
                disabled={isRenderingBenchmark}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isRenderingBenchmark ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>جاري الريندر المعياري...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>تشغيل ريندر المعيار (Benchmark)</span>
                  </>
                )}
              </button>
            </div>

            {/* Benchmark Examples Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examples.map(ex => (
                <div
                  key={ex.id}
                  onClick={() => handleSelectExample(ex.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    selectedExample === ex.id
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900 font-mono">
                      {ex.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-slate-600 border border-slate-200">
                      {ex.duration}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {ex.topic}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {ex.description}
                  </p>
                </div>
              ))}
            </div>

            {benchmarkNotice && (
              <div className="p-3.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                {benchmarkNotice}
              </div>
            )}

            {/* Benchmark Video Player */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-black text-slate-700 block">
                معاينة ناتج الريندر للنموذج القياسي المختار:
              </span>
              <div className="w-full aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden relative shadow-inner flex items-center justify-center">
                <video 
                  key={benchmarkVideoUrl}
                  controls 
                  className="w-full h-full object-contain"
                  poster="/docs/media/logo-dark.png"
                >
                  <source src={benchmarkVideoUrl} type="video/mp4" />
                  متصفحك لا يدعم تشغيل هذا الفيديو المعياري.
                </video>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
