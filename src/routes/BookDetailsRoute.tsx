import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Brain, HelpCircle, Youtube, Edit, Radio, Sparkles, RefreshCw, Layers, Terminal, Volume2, Eye, EyeOff, Check, Flame, Lock, ShoppingCart, CheckCircle2, ExternalLink, X, Maximize2, Minimize2, ShieldCheck, Shield, Play, Film, Smartphone, QrCode, Trash2, Plus } from 'lucide-react';
import { MarketplaceBook, MindMapNode, Flashcard, Chapter, UserRole, EduReel, EduReelStyle } from '../types';
import MindMap from '../components/MindMap';
import QuizSection from '../components/QuizSection';
import VideoSection from '../components/VideoSection';
import PodcastLounge from '../components/PodcastLounge';
import { ReadSection } from '../components/ReadSection';
import ChapterEditor from '../components/ChapterEditor';
import FlashcardsSection from '../components/FlashcardsSection';
import DynamicDomainSandbox from '../components/DynamicDomainSandbox';
import FloatingAudioBar from '../components/FloatingAudioBar';
import { useGlobalAudio } from '../hooks/useGlobalAudio';
import { PurchaseModal } from '../components/PurchaseModal';
import { OmniscientStemAiTutor } from '../components/ai/OmniscientStemAiTutor';
import { EduReelPlayer } from '../components/reels/EduReelPlayer';
import { supabase } from '../lib/supabase';
import { ForensicWatermark } from '../components/security/ForensicWatermark';
import { ScreenShieldGuard } from '../components/security/ScreenShieldGuard';
import { SeoStructuredData } from '../components/seo/SeoStructuredData';
import { InteractiveLessonExplanation } from '../components/interactive/InteractiveLessonExplanation';
import { FullCurriculumExplanation } from '../components/interactive/FullCurriculumExplanation';
import { CurriculumMindMap } from '../components/interactive/CurriculumMindMap';
import { BookQrCodeModal } from '../components/common/BookQrCodeModal';
import { showToast } from '../components/common/Toast';
import { useLanguage } from '../i18n/LanguageContext';

interface BookDetailsRouteProps {
  books: MarketplaceBook[];
  setEbooks: React.Dispatch<React.SetStateAction<MarketplaceBook[]>>;
  hasGeminiKey: boolean;
  purchasedBookIds?: string[];
  onPurchaseBook?: (book: MarketplaceBook) => Promise<void>;
  userRole?: UserRole;
  isAdminMode?: boolean;
  currentUser?: any;
}

interface ExternalBookViewerProps {
  book: MarketplaceBook;
  currentUser?: any;
  isBookUnlocked: boolean;
  navigate: (path: string) => void;
  isPurchaseModalOpen: boolean;
  setIsPurchaseModalOpen: (open: boolean) => void;
  onPurchaseBook?: (book: MarketplaceBook) => Promise<void>;
  books: MarketplaceBook[];
}

function ExternalBookViewer({
  book,
  currentUser,
  isBookUnlocked,
  navigate,
  isPurchaseModalOpen,
  setIsPurchaseModalOpen,
  onPurchaseBook,
  books
}: ExternalBookViewerProps) {
  const embedUrl = book.preview_video_url ? (
    book.preview_video_url.includes('youtube.com/watch?v=')
      ? book.preview_video_url.replace('watch?v=', 'embed/')
      : book.preview_video_url.includes('youtu.be/')
      ? book.preview_video_url.replace('youtu.be/', 'www.youtube.com/embed/')
      : book.preview_video_url
  ) : null;

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (viewerContainerRef.current?.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
      } else if ((viewerContainerRef.current as any)?.webkitRequestFullscreen) {
        (viewerContainerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const cleanViewerUrl = useMemo(() => {
    if (!book.external_url) return '';
    let url = book.external_url.trim();
    
    // Disable share, download, print, search parameters for Heyzine, FlipHTML5, AnyFlip
    if (url.includes('heyzine.com')) {
      const sep = url.includes('?') ? '&' : '?';
      if (!url.includes('noshare')) url += `${sep}noshare=1&nodownload=1&noprint=1&nosearch=1`;
    }
    if (url.includes('fliphtml5.com')) {
      const sep = url.includes('?') ? '&' : '?';
      if (!url.includes('showShare')) {
        url += `${sep}showShare=false&showDownload=false&showPrint=false&showSearch=false&showSearchButton=false&showSearchInput=false&search=0&showPrintButton=false&showShareButton=false&showDownloadButton=false`;
      }
    }
    if (url.includes('anyflip.com')) {
      const sep = url.includes('?') ? '&' : '?';
      if (!url.includes('showShare')) {
        url += `${sep}showShare=false&showDownload=false&showPrint=false&showSearch=false&showSearchButton=false&search=0`;
      }
    }
    return url;
  }, [book.external_url]);

  return (
    <div className="space-y-8 animate-fade-in pb-24 text-right max-w-6xl mx-auto" dir="rtl">
      <SeoStructuredData type="book" book={book} />
      {/* TOP NAV BAR */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          <span>العودة لمتجر ومكتبة المقررات</span>
        </button>
        <span className="px-3 py-1 text-xs font-black bg-teal-50 text-teal-800 rounded-full border border-teal-100">
          مقرر تفاعلي سحابي مدمج 🔒
        </span>
      </div>

      {/* IF UNLOCKED: SECURE IN-PLATFORM VIEWER */}
      {isBookUnlocked ? (
        <div className="space-y-6">
          {/* SECURE VIEWER FRAME */}
          <div
            ref={viewerContainerRef}
            className={`bg-slate-950 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl space-y-3 transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none p-2 flex flex-col justify-between' : ''
            }`}
          >
            {/* TOP VIEWER CONTROLLER BAR */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-white">
                  مشغل المحتوى التفاعلي المحمي داخل المنصة (Osera Interactive Player)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                  محتوى مؤمّن ومرخص 🔒
                </span>

                {/* PROMINENT FULLSCREEN TOGGLE BUTTON */}
                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                  title={isFullscreen ? 'تصغير الشاشة والخروج من ملء الشاشة' : 'تكبير الشاشة بالكامل لقراءة تفاعلية مريحة'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span>تصغير الشاشة (ESC)</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span>⛶ تكبير الشاشة بالكامل</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* EMBEDDED VIEWER WITH DRM MASKING SHIELDS AND FORENSIC WATERMARK */}
            <ScreenShieldGuard>
              <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner ${
                isFullscreen ? 'flex-1 h-full' : 'h-[80vh] min-h-[580px] max-h-[880px]'
              }`}>
                <iframe
                  src={cleanViewerUrl}
                  title={book.title}
                  className="w-full h-full border-0 select-none"
                  allow="fullscreen *; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                {/* 🛡️ FORENSIC DYNAMIC WATERMARK (ANTI-SCREEN-CAPTURE / LEAK DETECTION) */}
                <ForensicWatermark
                  userId={currentUser?.id}
                  userEmail={currentUser?.email}
                  userName={currentUser?.user_metadata?.full_name}
                  userPhone={currentUser?.phone || currentUser?.user_metadata?.phone}
                />

                {/* 🛡️ TOP-RIGHT SEARCH BAR MASK */}
                <div
                  className="absolute top-0 right-0 h-11 w-80 sm:w-96 md:w-[420px] bg-black pointer-events-auto select-none z-30 flex items-center justify-end px-4 gap-2 text-xs font-black text-teal-400 shadow-md border-b border-l border-slate-800/80 rounded-bl-2xl"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>كتاب تفاعلي معتمد - Osera AI LMS</span>
                </div>

                {/* 🛡️ RESPONSIVE BOTTOM-RIGHT DRM SHIELD */}
                <div
                  className="absolute bottom-0 right-0 h-11 w-[calc(50%-120px)] bg-black border-t border-slate-800/90 flex items-center justify-end pr-4 sm:pr-6 gap-2 text-[11px] sm:text-xs font-black text-slate-300 pointer-events-auto select-none z-30 shadow-lg"
                  title="محتوى مؤمن - النسخ والتحميل والمشاركة غير مصرح بها"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate hidden sm:inline">🔒 محتوى محمي ضد التحميل والمشاركة</span>
                  <span className="truncate sm:hidden">🔒 محمي</span>
                </div>

                {/* 🛡️ RESPONSIVE BOTTOM-LEFT DRM SHIELD */}
                <div
                  className="absolute bottom-0 left-0 h-11 w-[calc(50%-120px)] bg-black border-t border-slate-800/90 flex items-center justify-start pl-4 sm:pl-6 gap-2 text-[11px] sm:text-xs font-black text-teal-400 pointer-events-auto select-none z-30 shadow-lg"
                >
                  <span className="truncate font-black">Osera AI LMS ✦</span>
                </div>
              </div>
            </ScreenShieldGuard>
          </div>

          {/* COURSE INFO & DETAILS */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold">
                {book.subcategory || 'مقرر عام'}
              </span>
              {book.grade_level && (
                <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold">
                  {book.grade_level}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 leading-snug">
              {book.title}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              المحاضر / المؤلف: <span className="font-bold text-gray-800">{book.author_name || 'خبير المحتوى'}</span>
            </p>
            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {book.description || 'مقرر تفاعلي سحابي متكامل يتيح التعلم التفاعلي والأنشطة التطبيقية مباشرة داخل المنصة.'}
            </div>
          </div>
        </div>
      ) : (
        /* IF LOCKED: COURSE PREVIEW & IN-PLATFORM CHECKOUT PAYWALL */
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* COVER & PURCHASE ACTION */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[3/4] bg-slate-900">
              <img
                src={book.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80'}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black shadow-md bg-amber-400 text-amber-950">
                {book.price} ج.م
              </span>
            </div>

            {/* ACTION / PAYWALL */}
            <div className="space-y-3 p-5 bg-gradient-to-b from-amber-50/90 to-amber-100/60 border border-amber-200 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>مقرر تفاعلي مغلق</span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                اشترك الآن لفتح المحتوى التفاعلي والدراسة مباشرة داخل المنصة دون مغادرة الموقع.
              </p>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 shadow-teal-500/20"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>شراء المقرر وفتح المحتوى ({book.price} ج.م)</span>
              </button>
            </div>
          </div>

          {/* DETAILS & DEMO VIDEO */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold">
                  {book.subcategory || 'مقرر عام'}
                </span>
                {book.grade_level && (
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold">
                    {book.grade_level}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                {book.title}
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                المؤلف / المحاضر: <span className="font-bold text-gray-800">{book.author_name || 'خبير المحتوى'}</span>
              </p>
            </div>

            {/* VIDEO EXPLANATION EMBED */}
            {embedUrl ? (
              <div className="space-y-2">
                <h3 className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-rose-600" />
                  <span>فيديو تعريفي وتوضيحي عن المقرر (شاهد قبل الشراء)</span>
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black">
                  <iframe
                    src={embedUrl}
                    title="Explanatory Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {/* DESCRIPTION */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-700">نبذة وتفاصيل المقرر:</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {book.description || 'يقدم هذا المرجع محتوى تعليمياً وتطبيقياً متخصصاً يغطي المفاهيم الأساسية والأمثلة العملية عبر بيئة تفاعلية مؤمنة.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE MODAL */}
      {isPurchaseModalOpen && onPurchaseBook && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          book={book}
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirmPurchase={onPurchaseBook}
        />
      )}

      {/* 🌟 OMNISCIENT ACADEMIC AI TUTOR (FLOATING CHAT) */}
      <OmniscientStemAiTutor
        bookId={book.id}
        bookTitle={book.title}
        currentChapterTitle={book.chapters?.[0]?.title || 'المقدمة والتمهيد'}
        chapterContent={book.chapters?.[0]?.content || book.description || ''}
        bookCategory={book.category || ''}
      />
    </div>
  );
}

export default function BookDetailsRoute({
  books,
  setEbooks,
  hasGeminiKey,
  purchasedBookIds = [],
  onPurchaseBook,
  userRole = 'student',
  isAdminMode = false,
  currentUser
}: BookDetailsRouteProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as any) || 'read';

  const passedBook = books.find(b => b.id === id);
  const [localBook, setLocalBook] = useState<any>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const book = localBook || passedBook;

  // ⚡ Fast On-Demand Single Book Loader:
  // If book is not yet in global catalog or has slim chapters, fetch full content in 50ms!
  useEffect(() => {
    if (id && (!passedBook || !passedBook.chapters || passedBook.chapters.length === 0 || !passedBook.chapters[0]?.content)) {
      setIsLoadingBook(true);
      fetch(`/api/ebooks/${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Local book fetch failed");
          return res.json();
        })
        .then(fullBook => {
          if (fullBook && fullBook.id) {
            setLocalBook(fullBook);
          }
        })
        .catch(async () => {
          try {
            const { data } = await supabase.from('books').select('*').eq('id', id).single();
            if (data) setLocalBook(data);
          } catch (e) {}
        })
        .finally(() => setIsLoadingBook(false));
    }
  }, [id, passedBook]);

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'read' | 'mindmap' | 'practice' | 'videos' | 'teacher_sos' | 'editor'>(() => {
    if (initialTab === 'quiz' || initialTab === 'flashcards' || initialTab === 'sandbox' || initialTab === 'practice') return 'practice';
    if (initialTab === 'reels' || initialTab === 'videos') return 'videos';
    if (initialTab === 'interactive_curriculum' || initialTab === 'interactive_lesson') return 'mindmap';
    if (initialTab === 'editor') return 'editor';
    return 'read';
  });
  const [practiceSubTab, setPracticeSubTab] = useState<'quiz' | 'flashcards' | 'sandbox'>(() => {
    if (initialTab === 'flashcards') return 'flashcards';
    if (initialTab === 'sandbox') return 'sandbox';
    return 'quiz';
  });
  const [videoSubTab, setVideoSubTab] = useState<'reels' | 'videos'>(() => {
    if (initialTab === 'videos') return 'videos';
    return 'reels';
  });
  const [isTeacherEditMode, setIsTeacherEditMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isGeneratingAiQuestions, setIsGeneratingAiQuestions] = useState(false);
  const [isExpandingChapters, setIsExpandingChapters] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileChaptersOpen, setIsMobileChaptersOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const { play: playGlobalAudio } = useGlobalAudio();

  // Student Chapter Progress Tracker
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`completed_chapters_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleChapterCompleted = (chapterId: string) => {
    setCompletedChapterIds(prev => {
      const next = prev.includes(chapterId)
        ? prev.filter(c => c !== chapterId)
        : [...prev, chapterId];
      try {
        localStorage.setItem(`completed_chapters_${id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Reels Studio in-book states
  const [bookReels, setBookReels] = useState<EduReel[]>([]);
  const [isLoadingBookReels, setIsLoadingBookReels] = useState(false);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [selectedReelStyle, setSelectedReelStyle] = useState<EduReelStyle>('chalkboard');
  const [selectedVoice, setSelectedVoice] = useState<string>('ar-XA-Chirp3-HD-Fenrir');
  const [reelStatusMsg, setReelStatusMsg] = useState<string | null>(null);

  // Batch pre-generation states
  const [isPregenerating, setIsPregenerating] = useState(false);
  const [pregenPercent, setPregenPercent] = useState(0);
  const [pregenStep, setPregenStep] = useState('');

  useEffect(() => {
    if (book && book.chapters && book.chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(book.chapters[0].id);
    }
  }, [book, activeChapterId]);

  // Synchronize activeTab to URL search params
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get('tab') !== activeTab) {
      currentParams.set('tab', activeTab);
      window.history.replaceState(null, '', `${window.location.pathname}?${currentParams.toString()}`);
    }
  }, [activeTab]);

  // Check pregeneration status on load
  useEffect(() => {
    if (!book) return;
    const checkPregen = async () => {
      try {
        const res = await fetch(`/api/ebooks/${book.id}/pregenerate-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'processing') {
            setIsPregenerating(true);
            setPregenPercent(data.progressPercent || 10);
            setPregenStep(data.currentStep || 'جاري تجهيز الأصوات...');
            setTimeout(checkPregen, 4000);
          } else if (data.status === 'ready') {
            setIsPregenerating(false);
            setPregenPercent(100);
          }
        }
      } catch (e) {}
    };
    checkPregen();
  }, [book?.id]);

  const fetchBookReels = async () => {
    if (!book) return;
    setIsLoadingBookReels(true);
    try {
      const res = await fetch(`/api/reels/book/${book.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.reels) setBookReels(data.reels);
      }
    } catch (e) {
      console.warn("Failed to load book reels:", e);
    } finally {
      setIsLoadingBookReels(false);
    }
  };

  useEffect(() => {
    if (book?.id) fetchBookReels();
  }, [book?.id]);

  const handleGenerateCurrentChapterReel = async () => {
    if (!book || !activeChapter) return;
    setIsGeneratingReel(true);
    setReelStatusMsg("جاري كتابة السكريبت وتوليد الصوت الطبيعي النقي والكروت بالـ AI... 🎬");
    try {
      const res = await fetch('/api/reels/generate-single-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: activeChapter.id,
          chapterTitle: activeChapter.title,
          chapterContent: activeChapter.content,
          style: selectedReelStyle,
          voice: selectedVoice
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReelStatusMsg("تم توليد ريل الفصل بالصوت الطبيعي المختار والكروت بنجاح! 🎉");
        await fetchBookReels();
        setTimeout(() => setReelStatusMsg(null), 4000);
      } else {
        showToast(data.error || data.message || "فشل توليد الريل", "error");
      }
    } catch (e) {
      showToast("حدث خطأ أثناء توليد الريل", "error");
    } finally {
      setIsGeneratingReel(false);
    }
  };

  const handleGenerateAllBookReels = async (forceRegen = true) => {
    if (!book) return;
    setIsGeneratingReel(true);
    setReelStatusMsg(`جاري معالجة وتوليد ريلز لكافة فصول المذكرة (${book.chapters?.length || 0} فصل) وتوليد أصواتها بالـ AI... 🚀`);
    try {
      const res = await fetch('/api/reels/generate-for-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          customStyle: selectedReelStyle,
          voice: selectedVoice,
          forceRegenerate: forceRegen,
          chapters: book.chapters
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReelStatusMsg(`تم الانتهاء من توليد ريلز كافة الفصول بنجاح! ✨ (${data.generatedCount || 0} ريل جديد)`);
        await fetchBookReels();
        setTimeout(() => setReelStatusMsg(null), 5000);
      } else {
        showToast(data.error || data.message || "فشل توليد ريلز المذكرة", "error");
      }
    } catch (e) {
      showToast("حدث خطأ أثناء التوليد", "error");
    } finally {
      setIsGeneratingReel(false);
    }
  };

  if (!book) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="font-bold text-sm">جاري تحميل بيانات الكتاب الرقمي...</p>
      </div>
    );
  }

  const activeChapter = book.chapters?.find(c => c.id === activeChapterId) || book.chapters?.[0];
  const isInstructorOrAdmin = Boolean(
    isAdminMode || 
    userRole === 'admin' || 
    userRole === 'instructor' || 
    (currentUser?.id && (book.author_id === currentUser.id || (book as any).user_id === currentUser.id))
  );

  const handleAddChapter = async () => {
    if (!book) return;
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: `فصل جديد ${(book.chapters || []).length + 1}`,
      content: '# محتوى الفصل الجديد\n\nاكتب تفاصيل وشرح الفصل هنا أو استخدم محرر وورد السريع بالضغط على "تعديل الدرس المباشر"...',
      summary: 'ملخص الفصل الجديد ونواتج التعلم المستهدفة',
      videos: [],
      quiz: [],
      mindMap: []
    };
    const updated = [...(book.chapters || []), newChapter];
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updated } : b));
    setActiveChapterId(newChapter.id);
    try {
      await fetch(`/api/ebooks/${book.id}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: updated })
      });
      await supabase.from('books').update({ chapters: updated }).eq('id', book.id);
    } catch (e) {
      console.warn("Backend add chapter sync notice:", e);
    }
  };

  const handleTriggerPlayActiveChapter = () => {
    if (!activeChapter) return;
    const cleanText = `${activeChapter.title}. ${(activeChapter.summary || '')}. ${(activeChapter.content || '')}`
      .replace(/[*#_`~>|\\\[\]()]/g, ' ')
      .replace(/[:؛;]/g, ' ، ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    playGlobalAudio(`master-read-${activeChapter.id}`, async () => {
      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speaker: 'male' })
      });

      if (!res.ok) {
        throw new Error('فشل تحميل البث الصوتي');
      }

      return await res.blob();
    });
  };

  const handleTogglePublish = async () => {
    if (!book) return;
    const newStatus = !book.is_published;
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, is_published: newStatus } : b));
    try {
      await fetch(`/api/ebooks/${book.id}/toggle-publish`, { method: 'POST' });
      await supabase.from('books').update({ is_published: newStatus }).eq('id', book.id);
    } catch (e) {
      console.warn("Toggle publish error:", e);
    }
  };

  const handlePregenerateAllAssets = async () => {
    if (!book || isPregenerating) return;
    setIsPregenerating(true);
    setPregenPercent(10);
    setPregenStep('بدء تجهيز كافة الأصوات والبودكاست...');

    try {
      const res = await fetch(`/api/ebooks/${book.id}/pregenerate-all-assets`, { method: 'POST' });
      if (res.ok) {
        const pollPregen = async () => {
          try {
            const statusRes = await fetch(`/api/ebooks/${book.id}/pregenerate-status`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              setPregenPercent(statusData.progressPercent || 20);
              setPregenStep(statusData.currentStep || 'جاري المعالجة...');
              if (statusData.status === 'processing') {
                setTimeout(pollPregen, 3500);
              } else if (statusData.status === 'ready') {
                setIsPregenerating(false);
                setPregenPercent(100);
                setPregenStep('اكتمل تجهيز كافة الأصوات والبودكاست بنجاح!');
              } else {
                setIsPregenerating(false);
              }
            }
          } catch (e) {
            setIsPregenerating(false);
          }
        };
        setTimeout(pollPregen, 3000);
      }
    } catch (e) {
      console.warn(e);
      setIsPregenerating(false);
    }
  };

  const handleGenerateAiQuestions = async () => {
    if (!book || !activeChapter) return;
    setIsGeneratingAiQuestions(true);
    try {
      const res = await fetch(`/api/ebooks/${book.id}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: activeChapter.id, chapterContent: activeChapter.content })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions) {
          const updatedChapters = book.chapters.map(ch => {
            if (ch.id === activeChapter.id) {
              return { ...ch, quiz: [...(ch.quiz || []), ...data.questions] };
            }
            return ch;
          });

          setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
          try {
            await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiQuestions(false);
    }
  };

  const handleExpandChapters = async () => {
    if (!book) return;
    setIsExpandingChapters(true);
    const nextChapterNum = (book.chapters?.length || 0) + 1;
    try {
      const res = await fetch(`/api/ebooks/${book.id}/expand-chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalCount: 1 })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل استكمال وتوليد الفصول.');
      }
      const data = await res.json();
      if (data.newChapters && data.newChapters.length > 0) {
        const updatedChapters = [...(book.chapters || []), ...data.newChapters];
        setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters, blueprint: data.book?.blueprint || (b as any).blueprint } as any : b));
        try {
          await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
        } catch (e) {}

        const newCh = data.newChapters[0];
        if (newCh?.id) {
          setActiveChapterId(newCh.id);
          try {
            window.history.replaceState(null, '', `?chapter=${newCh.id}`);
          } catch (e) {}
        }
        showToast(`تم استكمال وتوليد (${newCh?.title || `الفصل ${nextChapterNum}`}) بنجاح!`, 'success');
      } else {
        showToast(data.message || 'تم استعراض وتغطية فصول المستند المتاحة بنجاح.', 'info');
      }
    } catch (err: any) {
      showToast('حدث خطأ أثناء استكمال الفصول: ' + err.message, 'error');
    } finally {
      setIsExpandingChapters(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!book || (book.chapters || []).length <= 1) {
      showToast("لا يمكن حذف الفصل الوحيد المتبقي في المقرر", "warning");
      return;
    }
    const targetChapter = (book.chapters || []).find(c => c.id === chapterId);
    if (!window.confirm(`هل أنت متأكد من حذف فصل "${targetChapter?.title || 'المحدد'}"؟`)) {
      return;
    }

    const updated = (book.chapters || []).filter(c => c.id !== chapterId);
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updated } : b));
    if (activeChapterId === chapterId) {
      setActiveChapterId(updated[0]?.id || null);
    }
    showToast("تم حذف الفصل بنجاح", "success");

    try {
      await fetch(`/api/ebooks/${book.id}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: updated })
      });
      await supabase.from('books').update({ chapters: updated }).eq('id', book.id);
    } catch (err) {
      console.warn("Delete chapter sync error:", err);
    }
  };

  const handleUpdateChapterMindMap = async (updatedNodes: MindMapNode[]) => {
    if (!book || !activeChapter) return;
    const updatedChapters = book.chapters.map(ch =>
      ch.id === activeChapter.id ? { ...ch, mindMap: updatedNodes } : ch
    );
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
    
    try {
      await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
    } catch (e) {
      console.warn("Supabase mindmap update error:", e);
    }
  };

  const handleSaveChapter = async (updatedChapter: Chapter) => {
    if (!book) return;
    const updatedChapters = (book.chapters || []).map(ch =>
      ch.id === updatedChapter.id ? updatedChapter : ch
    );
    // 0. Synchronously update book object so switching to 'read' tab immediately reflects changes
    book.chapters = updatedChapters;
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));


    // 1. Sync immediately with backend Express & local JSON database
    try {
      await fetch(`/api/ebooks/${book.id}/chapters/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: updatedChapter, chapters: updatedChapters })
      });
    } catch (apiErr) {
      console.warn("Backend chapter sync error:", apiErr);
    }

    // 2. Sync with Supabase
    try {
      await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
    } catch (e) {
      console.warn("Supabase chapter save error:", e);
    }
  };

  const handleUpdateFlashcards = async (updatedFlashcards: Flashcard[]) => {
    if (!book || !activeChapter) return;
    const updatedChapters = book.chapters.map(ch =>
      ch.id === activeChapter.id ? { ...ch, flashcards: updatedFlashcards } : ch
    );
    setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
    try {
      await supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
    } catch (e) {
      console.warn("Supabase flashcards update error:", e);
    }
  };

  const isPurchased = purchasedBookIds.includes(book.id);
  const isFree = !book.price || book.price === 0;
  const isBookUnlocked = isFree || isPurchased || isAdminMode;

  if (book.is_external) {
    return (
      <ExternalBookViewer
        book={book}
        currentUser={currentUser}
        isBookUnlocked={isBookUnlocked}
        navigate={navigate}
        isPurchaseModalOpen={isPurchaseModalOpen}
        setIsPurchaseModalOpen={setIsPurchaseModalOpen}
        onPurchaseBook={onPurchaseBook}
        books={books}
      />
    );
  }

  if (!activeChapter) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
        <BookOpen className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-bold mb-2">الكتاب قيد المعالجة</h3>
        <p>لا توجد فصول متوفرة بعد أو أن الكتاب لم يتم تحميله بالكامل.</p>
      </div>
    );
  }

  if (isFocusMode && activeChapter) {
    return (
      <div className="min-h-screen bg-white text-gray-900 animate-fade-in p-4 sm:p-8 max-w-4xl mx-auto text-right" dir="rtl">
        <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900 truncate">{book.title} - {activeChapter.title}</span>
          </div>
          <button
            onClick={() => setIsFocusMode(false)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>خروج من وضع التركيز ⛶</span>
          </button>
        </div>
        <ReadSection
          chapter={activeChapter}
          bookId={book.id}
          isInstructorOrAdmin={false}
          isEditMode={false}
          onSaveChapter={handleSaveChapter}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 text-right" dir="rtl">
      <SeoStructuredData type="chapter" book={book} chapter={activeChapter} />
      
      {/* 🌟 1. UNIFIED TOP BAR (Return + Book Title + Chapter Counter + QR + Focus Mode + Teacher Edit Mode Toggle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 shadow-sm rounded-3xl p-4 px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-teal-600 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2 max-w-[200px] sm:max-w-md">
            <h2 className="text-xs sm:text-sm font-black text-gray-900 truncate">{book.title}</h2>
            {book.author_name && (
              <Link
                to={`/instructor/${encodeURIComponent(book.author_name)}`}
                className="hidden md:inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 font-bold transition shrink-0"
                title="زيارة بروفايل المعلم"
              >
                <span>👨‍🏫 {book.author_name}</span>
              </Link>
            )}
            {book.language && book.language !== 'ar' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                {book.language === 'en' && '🇬🇧 EN'}
                {book.language === 'it' && '🇮🇹 IT'}
                {book.language === 'fr' && '🇫🇷 FR'}
                {book.language === 'de' && '🇩🇪 DE'}
              </span>
            )}
            {book.is_language_learning && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                🎓 دورة لغات
              </span>
            )}
          </div>
        </div>

        {/* TOP BAR ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* TOGGLE CHAPTERS SIDEBAR BUTTON (DESKTOP & MOBILE) */}
          <button
            onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            className={`hidden lg:flex px-3.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition border cursor-pointer ${
              isDesktopSidebarOpen
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="إظهار / إخفاء الفهرس"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {isDesktopSidebarOpen
                ? 'إخفاء الفهرس'
                : `الفصل ${(book.chapters || []).findIndex(c => c.id === activeChapterId) + 1} من ${book.chapters?.length || 0} 📑`}
            </span>
          </button>

          <button
            onClick={() => setIsMobileChaptersOpen(true)}
            className="lg:hidden px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>الفصل ({(book.chapters || []).findIndex(c => c.id === activeChapterId) + 1}/{book.chapters?.length || 0}) 📑</span>
          </button>

          {/* FOCUS MODE BUTTON */}
          <button
            onClick={() => setIsFocusMode(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="وضع التركيز والقراءة بدون مشتتات"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">وضع التركيز ⛶</span>
          </button>

          {/* QR CODE BUTTON */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
            title="كود QR لمشاركة الكتاب 📲"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">كود QR</span>
          </button>

          {/* TEACHER EDIT MODE TOGGLE (FOR INSTRUCTORS & ADMINS ONLY) */}
          {isInstructorOrAdmin && (
            <button
              onClick={() => setIsTeacherEditMode(!isTeacherEditMode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer border ${
                isTeacherEditMode
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="تفعيل / تعطيل أدوات تعديل المعلم"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{isTeacherEditMode ? 'وضع التعديل نشط ✏️' : 'وضع التعديل ✏️'}</span>
            </button>
          )}

          {/* PUBLISH / DRAFT TOGGLE (ONLY IN EDIT MODE FOR INSTRUCTORS) */}
          {isInstructorOrAdmin && isTeacherEditMode && (
            <button
              onClick={handleTogglePublish}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                book.is_published
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
              title="تغيير حالة النشر للطلاب"
            >
              {book.is_published ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>منشور للطلاب</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>مسودة خاصة</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 🛠️ INSTRUCTOR & ADMIN QUICK CONTROL BAR (Only visible when Edit Mode is active) */}
      {isInstructorOrAdmin && isTeacherEditMode && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-3 text-white shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in" dir="rtl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm border border-teal-500/30 shrink-0">
              ⚡
            </div>
            <div>
              <span className="text-xs font-black text-white block">أدوات تعديل وإدارة المقرر (وضع التعديل مفعل)</span>
              <span className="text-[10px] text-teal-300">أضف فصولاً جديدة، استكمل المحتوى بالذكاء الاصطناعي، أو عدل نصوص الدروس</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddChapter}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فصل جديد ➕</span>
            </button>

            <button
              onClick={handleExpandChapters}
              disabled={isExpandingChapters}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isExpandingChapters ? 'جاري الاستكمال...' : 'استكمال بالـ AI 📤'}</span>
            </button>

            <button
              onClick={() => handleGenerateAiQuestions()}
              disabled={isGeneratingAiQuestions}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>{isGeneratingAiQuestions ? 'جاري التوليد...' : 'توليد أسئلة للفصل ❓'}</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                activeTab === 'editor' ? 'bg-amber-400 text-slate-950' : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>محرر الفصول الشامل ✏️</span>
            </button>
          </div>
        </div>
      )}

      {/* 🧭 STREAMLINED SOVEREIGN 4-CORE TABS BAR */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {/* TAB 1: READ */}
          <button
            onClick={() => setActiveTab('read')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'read' ? 'bg-teal-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قراءة الدرس 📖</span>
          </button>

          {/* TAB 2: FULL CURRICULUM EXPLANATION & MINDMAP */}
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'mindmap' ? 'bg-teal-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>شرح وخريطة المنهج 🗺️</span>
          </button>

          {/* TAB 3: VIDEOS */}
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'videos' ? 'bg-purple-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>الفيديوهات 🎬</span>
          </button>

          {/* TAB 4: TEACHER DIRECT SOS HELPDESK */}
          <button
            onClick={() => setActiveTab('teacher_sos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'teacher_sos' ? 'bg-rose-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>استفسار المعلم (SOS) 🙋‍♂️</span>
          </button>

          {/* TAB 5: PRACTICE & ASSESSMENT */}
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
              activeTab === 'practice' ? 'bg-indigo-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>التقييم والمذاكرة 📝</span>
          </button>

          {/* TAB 6: TEACHER CONTENT EDITOR (Only visible in Teacher Edit Mode) */}
          {isInstructorOrAdmin && isTeacherEditMode && (
            <>
              <div className="h-5 w-px bg-slate-200 shrink-0 mx-1" />
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 cursor-pointer border ${
                  activeTab === 'editor'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>تعديل المحتوى ✏️</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT (TOGGLEABLE SIDEBAR + ACTIVE TAB AREA) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* DESKTOP TOGGLEABLE SIDEBAR (OPEN BY DEFAULT ON DESKTOP) */}
        {isDesktopSidebarOpen && (
          <div className="hidden lg:block w-80 shrink-0 space-y-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>فهرس فصول الكتاب</span>
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full">
                  {completedChapterIds.length}/{book.chapters?.length || 0} مكتمل
                </span>
              </div>

              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {/* INSTRUCTOR QUICK CHAPTER ACTIONS (Only visible in Teacher Edit Mode) */}
                {isInstructorOrAdmin && isTeacherEditMode && (
                  <div className="flex items-center gap-1.5 pb-2.5 mb-1.5 border-b border-slate-100">
                    <button
                      onClick={handleAddChapter}
                      className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 border border-teal-200 cursor-pointer"
                      title="إضافة فصل جديد للكتاب"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>إضافة فصل ➕</span>
                    </button>
                    <button
                      onClick={handleExpandChapters}
                      disabled={isExpandingChapters}
                      className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-800 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 border border-indigo-200 cursor-pointer"
                      title="استكمال فصول المنهج بالذكاء الاصطناعي"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isExpandingChapters ? 'جاري الاستكمال...' : 'استكمال بالـ AI 📤'}</span>
                    </button>
                  </div>
                )}

                {(book.chapters || []).map((chapter, idx) => {
                  const isPurchased = purchasedBookIds.includes(book.id);
                  const isFree = !book.price || book.price === 0;
                  const isBookUnlocked = isFree || isPurchased || isAdminMode;
                  const isChapterLocked = !isBookUnlocked && idx > 0;
                  const isSelected = activeChapterId === chapter.id;
                  const isCompleted = completedChapterIds.includes(chapter.id);

                  return (
                    <div
                      key={chapter.id}
                      onClick={() => {
                        if (isChapterLocked) {
                          setIsPurchaseModalOpen(true);
                        } else {
                          setActiveChapterId(chapter.id);
                        }
                      }}
                      className={`w-full text-right p-3 rounded-2xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : isChapterLocked
                          ? 'text-gray-400 bg-gray-50/70 hover:bg-gray-100 hover:text-gray-700 border border-gray-100'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {/* Progress Check Icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapterCompleted(chapter.id);
                          }}
                          className={`p-0.5 rounded-full transition ${
                            isCompleted ? (isSelected ? 'text-white' : 'text-emerald-600') : (isSelected ? 'text-teal-200' : 'text-slate-300 hover:text-slate-500')
                          }`}
                          title={isCompleted ? 'فصل مكتمل ✓' : 'تحديد كمكتمل'}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'fill-current' : ''}`} />
                        </button>

                        {isChapterLocked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : idx === 0 && !isBookUnlocked ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 rounded shrink-0">معاينة</span>
                        ) : null}
                        <span className="truncate">{chapter.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mr-2">
                        {isInstructorOrAdmin && isTeacherEditMode && (book.chapters || []).length > 1 && (
                          <button
                            onClick={(e) => handleDeleteChapter(chapter.id, e)}
                            className={`p-1 rounded-lg transition ${
                              isSelected ? 'text-teal-200 hover:text-white hover:bg-teal-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="حذف هذا الفصل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>
                          {idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADMIN ONLY: 1-CLICK BATCH ASSET PRE-GENERATION & EXPAND (Only in Edit Mode) */}
              {isInstructorOrAdmin && isTeacherEditMode && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <button
                    onClick={handlePregenerateAllAssets}
                    disabled={isPregenerating}
                    className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isPregenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                        <span>جاري تجهيز كافة الأصوات...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-teal-400" />
                        <span>تجهيز الأصوات والبودكاست</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExpandChapters}
                    disabled={isExpandingChapters}
                    className="w-full p-2.5 bg-teal-50 border border-teal-200 hover:border-teal-300 text-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isExpandingChapters ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                        <span>جاري استخراج وتحليل الفصل رقم {(book.chapters?.length || 0) + 1}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>استكمال الفصول بالـ AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOBILE SLIDE-OVER CHAPTERS DRAWER */}
        {isMobileChaptersOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-xs p-0 sm:p-4" dir="rtl">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>فهرس فصول الكتاب</span>
                </h3>
                <button
                  onClick={() => setIsMobileChaptersOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* INSTRUCTOR QUICK CHAPTER ACTIONS (MOBILE - Only in Edit Mode) */}
                {isInstructorOrAdmin && isTeacherEditMode && (
                  <div className="flex items-center gap-2 pb-3 mb-2 border-b border-slate-100">
                    <button
                      onClick={() => {
                        setIsMobileChaptersOpen(false);
                        handleAddChapter();
                      }}
                      className="flex-1 py-2 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-teal-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>إضافة فصل ➕</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileChaptersOpen(false);
                        handleExpandChapters();
                      }}
                      disabled={isExpandingChapters}
                      className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-800 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-indigo-200 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isExpandingChapters ? 'جاري الاستكمال...' : 'استكمال بالـ AI 📤'}</span>
                    </button>
                  </div>
                )}

                {(book.chapters || []).map((chapter, idx) => {
                  const isPurchased = purchasedBookIds.includes(book.id);
                  const isFree = !book.price || book.price === 0;
                  const isBookUnlocked = isFree || isPurchased || isAdminMode;
                  const isChapterLocked = !isBookUnlocked && idx > 0;
                  const isSelected = activeChapterId === chapter.id;

                  return (
                    <div
                      key={chapter.id}
                      onClick={() => {
                        if (isChapterLocked) {
                          setIsPurchaseModalOpen(true);
                        } else {
                          setActiveChapterId(chapter.id);
                          setIsMobileChaptersOpen(false);
                        }
                      }}
                      className={`w-full text-right p-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-md'
                          : isChapterLocked
                          ? 'text-gray-400 bg-gray-50/70 border border-gray-100'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isChapterLocked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : idx === 0 && !isBookUnlocked ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 rounded shrink-0">معاينة</span>
                        ) : null}
                        <span className="truncate">{chapter.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mr-2">
                        {isInstructorOrAdmin && isTeacherEditMode && (book.chapters || []).length > 1 && (
                          <button
                            onClick={(e) => handleDeleteChapter(chapter.id, e)}
                            className={`p-1 rounded-lg transition ${
                              isSelected ? 'text-teal-200 hover:text-white hover:bg-teal-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="حذف هذا الفصل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>
                          {idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADMIN ONLY ON MOBILE: BATCH GENERATION & EXPAND (Only in Edit Mode) */}
              {isInstructorOrAdmin && isTeacherEditMode && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <button
                    onClick={handlePregenerateAllAssets}
                    disabled={isPregenerating}
                    className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isPregenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                        <span>جاري تجهيز كافة الأصوات...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-teal-400" />
                        <span>تجهيز الأصوات والبودكاست</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExpandChapters}
                    disabled={isExpandingChapters}
                    className="w-full p-2.5 bg-teal-50 border border-teal-200 hover:border-teal-300 text-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isExpandingChapters ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                        <span>جاري استخراج وتحليل الفصل رقم {(book.chapters?.length || 0) + 1}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>استكمال الفصول بالـ AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsMobileChaptersOpen(false)}
                className="w-full py-3 bg-slate-900 text-white font-black text-xs rounded-2xl transition"
              >
                إغلاق والعودة للقراءة الكاملة
              </button>
            </div>
          </div>
        )}

        {/* 📖 ACTIVE CHAPTER CONTENT CONTAINER (100% WIDTH WHEN SIDEBAR IS HIDDEN) */}
        <div className="flex-1 w-full space-y-6">

        {activeTab === 'read' && activeChapter && (
          <ScreenShieldGuard>
            <div className="relative">
              <ForensicWatermark
                userId={currentUser?.id}
                userEmail={currentUser?.email}
                userName={currentUser?.user_metadata?.full_name}
                userPhone={currentUser?.phone || currentUser?.user_metadata?.phone}
              />
              <ReadSection 
                chapter={activeChapter} 
                bookId={book.id}
                isInstructorOrAdmin={isInstructorOrAdmin}
                isEditMode={isTeacherEditMode}
                onSaveChapter={handleSaveChapter}
                initialTab="interleaved"
              />
            </div>
          </ScreenShieldGuard>
        )}

        {/* 🙋‍♂️ TAB 3: TEACHER DIRECT SOS HELPDESK */}
        {activeTab === 'teacher_sos' && activeChapter && (
          <div className="relative w-full">
            <ReadSection
              chapter={activeChapter}
              bookId={book.id}
              isInstructorOrAdmin={isInstructorOrAdmin}
              isEditMode={isTeacherEditMode}
              onSaveChapter={handleSaveChapter}
              initialTab="teacher_sos"
            />
          </div>
        )}

        {/* 🚀 FULL CURRICULUM CONNECTED EXPLANATION & MIND MAP */}
        {activeTab === 'mindmap' && (
          <FullCurriculumExplanation
            book={book}
            currentUser={currentUser}
          />
        )}

        {/* 📝 UNIFIED PRACTICE & ASSESSMENT (Quiz + Flashcards + Sandbox) */}
        {activeTab === 'practice' && activeChapter && (
          <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
            {/* SUB-TABS PILLS */}
            <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setPracticeSubTab('quiz')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  practiceSubTab === 'quiz'
                    ? 'bg-indigo-600 text-white font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>اختبارات وتمارين 📝 ({Array.isArray(activeChapter.quiz) ? activeChapter.quiz.length : 0})</span>
              </button>

              <button
                onClick={() => setPracticeSubTab('flashcards')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  practiceSubTab === 'flashcards'
                    ? 'bg-indigo-600 text-white font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>بطاقات استذكار 📇 ({Array.isArray(activeChapter.flashcards) ? activeChapter.flashcards.length : (activeChapter.concepts?.length || 0)})</span>
              </button>

              <button
                onClick={() => setPracticeSubTab('sandbox')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  practiceSubTab === 'sandbox'
                    ? 'bg-indigo-600 text-white font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>أنشطة وتطبيقات 🧪</span>
              </button>
            </div>

            {practiceSubTab === 'quiz' && (
              <QuizSection
                bookId={book.id}
                bookTitle={book.title}
                allChapters={book.chapters}
                chapterTitle={activeChapter.title}
                questions={Array.isArray(activeChapter.quiz) ? activeChapter.quiz : []}
                bookExams={book.exams || []}
                onUpdateQuestions={(updatedQuestions) => {
                  const updatedChapters = book.chapters.map(ch =>
                    ch.id === activeChapter.id ? { ...ch, quiz: updatedQuestions } : ch
                  );
                  setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updatedChapters } : b));
                  try {
                    fetch(`/api/ebooks/${book.id}/chapters/save`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chapters: updatedChapters })
                    }).catch(() => {});
                    supabase.from('books').update({ chapters: updatedChapters }).eq('id', book.id);
                  } catch (e) {}
                }}
                onGenerateAiQuestions={handleGenerateAiQuestions}
                isGeneratingAiQuestions={isGeneratingAiQuestions}
              />
            )}

            {practiceSubTab === 'flashcards' && (
              <FlashcardsSection
                chapter={activeChapter}
                onUpdateFlashcards={handleUpdateFlashcards}
              />
            )}

            {practiceSubTab === 'sandbox' && (
              <DynamicDomainSandbox
                book={book}
                chapter={activeChapter}
              />
            )}
          </div>
        )}

        {/* 🎬 UNIFIED VIDEOS TAB (Reels + Curated Video Explanations) */}
        {activeTab === 'videos' && activeChapter && (
          <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
            {/* SUB-TABS PILLS */}
            <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setVideoSubTab('reels')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  videoSubTab === 'reels'
                    ? 'bg-purple-600 text-white font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>ريلز وفيديوهات قصيرة 🎬 ({bookReels.length})</span>
              </button>

              <button
                onClick={() => setVideoSubTab('videos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  videoSubTab === 'videos'
                    ? 'bg-purple-600 text-white font-black shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>فيديوهات الشرح 🎥 ({Array.isArray(activeChapter.videos) ? activeChapter.videos.length : 0})</span>
              </button>
            </div>

            {videoSubTab === 'reels' && (() => {
              const currentReel = bookReels.find(r => (r.chapter_id && r.chapter_id === activeChapter.id) || (r.chapter_title && r.chapter_title.trim() === activeChapter.title.trim()));
              const hasAnyReel = bookReels.length > 0;
              const totalChaptersCount = book.chapters?.length || 0;
              const generatedReelsCount = bookReels.length;

              return (
                <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
                  {/* STATUS NOTIFICATION BANNER */}
                  {reelStatusMsg && (
                    <div className="p-4 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
                        <span className="text-xs sm:text-sm font-black text-slate-800">{reelStatusMsg}</span>
                      </div>
                      {isGeneratingReel && <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />}
                    </div>
                  )}

                  {/* REEL PLAYER OR GENERATOR */}
                  {currentReel ? (
                    <div className="space-y-4">
                      {/* TOP CONTROL BAR */}
                      <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                            <Film className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-sm">{currentReel.title || activeChapter.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold text-gray-500">ستايل: {currentReel.style || 'cyberpunk'}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
                                جاهز بالصوت الطبيعي 🎙️
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {/* VOICE SELECTOR DROPDOWN */}
                          <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            disabled={isGeneratingReel}
                            className="px-3 py-2 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            title="اختيار صوت المعلق الصوتي بالذكاء الاصطناعي"
                          >
                            <option value="ar-XA-Chirp3-HD-Fenrir">🌟 صوت كريم (طبيعي وواضح) 🎙️</option>
                            <option value="ar-XA-Chirp3-HD-Aoede">🌟 صوت فرح (تعليمي وهادئ) 🎙️</option>
                            <option value="ar-XA-Chirp3-HD-Puck">🌟 صوت أحمد (حماسي وتفاعلي)</option>
                            <option value="ar-XA-Chirp3-HD-Kore">🌟 صوت سارة (شرح مبسط)</option>
                            <option value="ar-XA-Chirp3-HD-Charon">🌟 صوت أستاذ محمود (وقور ورزين)</option>
                            <option value="ar-SA-HamedNeural">🎙️ 🇸🇦 حامد (سعودي فخم)</option>
                            <option value="ar-EG-ShakirNeural">🎙️ 🇪🇬 شاكر (مصري دافئ)</option>
                            <option value="ar-JO-TaimNeural">🎙️ 🇯🇴 تيم (أردني شبابي)</option>
                            <option value="ar-EG-SalmaNeural">🎙️ 🇪🇬 سلمى (مصرية حيوية)</option>
                            <option value="ar-SA-ZariyahNeural">🎙️ 🇸🇦 زارية (سعودية هادئة)</option>
                            <option value="ar-AE-HamdanNeural">🎙️ 🇦🇪 حمدان (إماراتي متزن)</option>
                          </select>

                          {/* STYLE SELECTOR DROPDOWN */}
                          <select
                            value={selectedReelStyle}
                            onChange={(e) => setSelectedReelStyle(e.target.value as EduReelStyle)}
                            disabled={isGeneratingReel}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                            title="اختيار الستايل البصري للريل"
                          >
                            <option value="chalkboard">📐 سبورة وأكاديمي</option>
                            <option value="cyberpunk">🚀 سايبر بانك نيون</option>
                            <option value="cinematic">🎬 سينمائي وثائقي</option>
                            <option value="gamified">🎮 تفاعلي جيمينج</option>
                          </select>

                          <button
                            onClick={handleGenerateCurrentChapterReel}
                            disabled={isGeneratingReel}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow hover:shadow-md transition active:scale-95 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                            title="إعادة توليد ريل لهذا الفصل بالصوت والستايل المختار"
                          >
                            {isGeneratingReel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            <span>توليد مجدداً</span>
                          </button>

                          <button
                            onClick={() => handleGenerateAllBookReels(true)}
                            disabled={isGeneratingReel}
                            className="px-3 py-2 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                            title="توليد كافة فصول المذكرة بالصوت والستايل الجديد"
                          >
                            <span>🚀 توليد لكل الفصول ({generatedReelsCount}/{totalChaptersCount})</span>
                          </button>

                          <button
                            onClick={() => navigate(`/book/${book.id}/reels`)}
                            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            title="مشاهدة ريلز هذا المقرر في وضع ملء الشاشة الكامل"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>📱 تجربة TikTok كاملة للمقرر</span>
                          </button>

                        </div>
                      </div>

                      {/* 9:16 VERTICAL PLAYER CONTAINER */}
                      <div className="flex justify-center">
                        <div className="w-full max-w-[420px] aspect-[9/16] max-h-[680px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-black relative">
                          <EduReelPlayer
                            reel={currentReel}
                            isActive={activeTab === 'videos' && videoSubTab === 'reels'}
                            currentUser={currentUser}
                            onNextReel={() => {
                              const currentIndex = (book.chapters || []).findIndex(c => c.id === activeChapter.id);
                              if (currentIndex < (book.chapters?.length || 1) - 1) {
                                setActiveChapterId(book.chapters[currentIndex + 1].id);
                              }
                            }}
                            onPrevReel={() => {
                              const currentIndex = (book.chapters || []).findIndex(c => c.id === activeChapter.id);
                              if (currentIndex > 0) {
                                setActiveChapterId(book.chapters[currentIndex - 1].id);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* REEL GENERATION STUDIO CARD */
                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 text-center space-y-6">
                      <div className="max-w-xl mx-auto space-y-3">
                        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                          <Film className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          استوديو ريلز وتيك توك التعلم السريع 🎬
                        </h3>
                        <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed font-medium">
                          لم يتم توليد فيديو ريل تفاعلي لفصل <span className="text-yellow-400 font-bold">"{activeChapter.title}"</span> بعد.
                          يقوم الذكاء الاصطناعي بتحليل النص، صياغة سكريبت شيق، وتوليد تعليق صوتي طبيعي متزامن مع كلمات ملونة وكروت أسئلة منبثقة!
                        </p>
                      </div>

                      {/* VOICE & STYLE SELECTION CONTROLS */}
                      <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                        <div>
                          <label className="block text-xs font-black text-indigo-300 mb-2">
                            🎙️ اختر صوت المعلق الصوتي:
                          </label>
                          <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                          >
                            <option value="ar-XA-Chirp3-HD-Fenrir" className="bg-slate-900 text-white">🌟 صوت كريم (طبيعي وواضح) 🎙️</option>
                            <option value="ar-XA-Chirp3-HD-Aoede" className="bg-slate-900 text-white">🌟 صوت فرح (تعليمي وهادئ) 🎙️</option>
                            <option value="ar-XA-Chirp3-HD-Puck" className="bg-slate-900 text-white">🌟 صوت أحمد (حماسي وتفاعلي)</option>
                            <option value="ar-XA-Chirp3-HD-Kore" className="bg-slate-900 text-white">🌟 صوت سارة (شرح مبسط)</option>
                            <option value="ar-XA-Chirp3-HD-Charon" className="bg-slate-900 text-white">🌟 صوت أستاذ محمود (وقور ورزين)</option>
                            <option value="ar-SA-HamedNeural" className="bg-slate-900 text-white">🇸🇦 حامد (سعودي فخم ووقور)</option>
                            <option value="ar-EG-ShakirNeural" className="bg-slate-900 text-white">🇪🇬 شاكر (مصري دافئ ومفصل)</option>
                            <option value="ar-JO-TaimNeural" className="bg-slate-900 text-white">🇯🇴 تيم (أردني شبابي وحماسي)</option>
                            <option value="ar-EG-SalmaNeural" className="bg-slate-900 text-white">🇪🇬 سلمى (مصرية شابة وحيوية)</option>
                            <option value="ar-SA-ZariyahNeural" className="bg-slate-900 text-white">🇸🇦 زارية (سعودية وثائقية هادئة)</option>
                            <option value="ar-AE-HamdanNeural" className="bg-slate-900 text-white">🇦🇪 حمدان (إماراتي متزن ورسمي)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-indigo-300 mb-2">
                            🎨 اختر الستايل البصري للريل:
                          </label>
                          <select
                            value={selectedReelStyle}
                            onChange={(e) => setSelectedReelStyle(e.target.value as EduReelStyle)}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                          >
                            <option value="chalkboard" className="bg-slate-900 text-white">📐 سبورة وأكاديمي</option>
                            <option value="cyberpunk" className="bg-slate-900 text-white">🚀 سايبر بانك نيون</option>
                            <option value="cinematic" className="bg-slate-900 text-white">🎬 سينمائي وثائقي</option>
                            <option value="gamified" className="bg-slate-900 text-white">🎮 تفاعلي جيمينج</option>
                          </select>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={handleGenerateCurrentChapterReel}
                          disabled={isGeneratingReel}
                          className="flex-1 py-3.5 px-5 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                          {isGeneratingReel ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>جاري كتابة السكريبت وتوليد الصوت...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-yellow-300" />
                              <span>⚡ توليد ريل لهذا الفصل الآن</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleGenerateAllBookReels(true)}
                          disabled={isGeneratingReel}
                          className="py-3.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                          <span>🚀 توليد لكل الفصول</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CHAPTER REELS BROWSER / QUICK JUMP */}
                  {hasAnyReel && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                          <Film className="w-4 h-4 text-teal-600" />
                          <span>ريلز فصول المذكرة المتوفرة ({bookReels.length})</span>
                        </h4>
                        <span className="text-[11px] font-bold text-gray-500">اضغط للمشاهدة فوراً</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(book.chapters || []).map((ch, idx) => {
                          const chReel = bookReels.find(r => (r.chapter_id && r.chapter_id === ch.id) || (r.chapter_title && r.chapter_title.trim() === ch.title.trim()));
                          const isCurrent = ch.id === activeChapter.id;

                          return (
                            <button
                              key={ch.id}
                              onClick={() => setActiveChapterId(ch.id)}
                              className={`p-3 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
                                isCurrent
                                  ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-sm'
                                  : 'bg-gray-50/50 border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-black flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-bold truncate">{ch.title}</span>
                              </div>

                              {chReel ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0 flex items-center gap-1">
                                  <Play className="w-2.5 h-2.5 fill-emerald-800" /> جاهز
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold shrink-0">
                                  غير مولد
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {videoSubTab === 'videos' && (
              <VideoSection videos={Array.isArray(activeChapter.videos) ? activeChapter.videos : []} />
            )}
          </div>
        )}

        {activeTab === 'editor' && activeChapter && (
          <ChapterEditor
            chapter={activeChapter}
            onSaveChapter={handleSaveChapter}
            onAddChapter={async () => {
              const newChapter = {
                id: `ch-${Date.now()}`,
                title: `فصل جديد ${book.chapters.length + 1}`,
                content: '# محتوى الفصل الجديد\n\nاكتب تفاصيل وشرح الفصل هنا...',
                summary: 'ملخص الفصل الجديد',
                videos: [],
                quiz: [],
                mindMap: []
              };
              const updated = [...book.chapters, newChapter];
              setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updated } : b));
              setActiveChapterId(newChapter.id);
              try {
                await fetch(`/api/ebooks/${book.id}/chapters/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chapters: updated })
                });
              } catch (apiErr) {
                console.warn("Backend add chapter sync error:", apiErr);
              }
              try {
                await supabase.from('books').update({ chapters: updated }).eq('id', book.id);
              } catch (e) {
                console.warn(e);
              }
            }}
            onDeleteChapter={async () => {
              if (book.chapters.length <= 1) return;
              const updated = book.chapters.filter(c => c.id !== activeChapter.id);
              setEbooks(prev => prev.map(b => b.id === book.id ? { ...b, chapters: updated } : b));
              setActiveChapterId(updated[0]?.id || null);
              try {
                await fetch(`/api/ebooks/${book.id}/chapters/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chapters: updated })
                });
              } catch (apiErr) {
                console.warn("Backend delete chapter sync error:", apiErr);
              }
              try {
                await supabase.from('books').update({ chapters: updated }).eq('id', book.id);
              } catch (e) {
                console.warn(e);
              }
            }}
            canDelete={book.chapters.length > 1}
          />
        )}

        </div>
      </div>

      {/* PERSISTENT FLOATING AUDIO BAR */}
      <FloatingAudioBar 
        chapterTitle={activeChapter?.title} 
        onTriggerPlay={activeTab === 'read' ? handleTriggerPlayActiveChapter : undefined}
      />

      {/* PURCHASE MODAL */}
      {isPurchaseModalOpen && onPurchaseBook && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          book={book}
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirmPurchase={onPurchaseBook}
        />
      )}

      {/* 🌟 OMNISCIENT ACADEMIC AI TUTOR (FLOATING CHAT) */}
      <OmniscientStemAiTutor
        bookId={book.id}
        bookTitle={book.title}
        currentChapterTitle={activeChapter?.title || 'الفصل الحالي'}
        chapterContent={activeChapter?.content || ''}
        bookCategory={book.category || ''}
      />

      {/* 📲 BOOK SMART QR CODE MODAL */}
      <BookQrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        book={book}
        isOwned={isBookUnlocked}
      />

      {/* 📱 MOBILE STICKY BOTTOM QUICK BAR (Easy Thumb Navigation - 5 Core Study Modes) */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg print:hidden"
        dir="rtl"
      >
        <button
          onClick={() => setActiveTab('read')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            activeTab === 'read' ? 'text-teal-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>قراءة 📖</span>
        </button>

        <button
          onClick={() => setActiveTab('mindmap')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            activeTab === 'mindmap' ? 'text-teal-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>الشرح والخريطة 🗺️</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            activeTab === 'practice' ? 'text-indigo-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>التقييم 📝</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
            activeTab === 'videos' ? 'text-purple-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>الفيديوهات 🎬</span>
        </button>

        <button
          onClick={() => setIsMobileChaptersOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>الفهرس 📑</span>
        </button>
      </div>
    </div>
  );
}
