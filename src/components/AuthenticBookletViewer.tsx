import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize2, 
  Minimize2, RefreshCw, BookOpen, FileText, CheckCircle2,
  Volume2, Download, AlertCircle, Layers
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BookletPage {
  pageNumber: number;
  dataUrl: string;
  pageType?: 'study' | 'exercise';
}

interface AuthenticBookletViewerProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  startPage?: number;
  endPage?: number;
  onSwitchToSmartReader?: () => void;
  onPlayAudio?: () => void;
  isAudioPlaying?: boolean;
}

export default function AuthenticBookletViewer({
  bookId,
  chapterId,
  chapterTitle,
  startPage,
  endPage,
  onSwitchToSmartReader,
  onPlayAudio,
  isAudioPlaying
}: AuthenticBookletViewerProps) {
  const { dir, t } = useLanguage();
  const [pages, setPages] = useState<BookletPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageOffset, setPageOffset] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    fetch(`/api/ebooks/${bookId}/chapters/${chapterId}/pages`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.pageOffset !== undefined) {
          setPageOffset(Number(data.pageOffset) || 0);
        }
        if (data.success && Array.isArray(data.pages) && data.pages.length > 0) {
          setPages(data.pages);
          setActivePageIndex(0);
        } else {
          setPages([]);
          setLoadError(data.message || 'لم تتوفر صفحات مصورة مباشرة لهذا الفصل بعد.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setLoadError('تعذر الاتصال بخدمة استدعاء صفحات المذكرة.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookId, chapterId]);

  const handleAdjustOffset = async (delta: number) => {
    setIsCalibrating(true);
    try {
      const newOffset = pageOffset + delta;
      const res = await fetch(`/api/ebooks/${bookId}/page-offset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: newOffset })
      });
      const data = await res.json();
      if (data.success) {
        setPageOffset(newOffset);
        // Reload pages with the calibrated offset
        setIsLoading(true);
        const pagesRes = await fetch(`/api/ebooks/${bookId}/chapters/${chapterId}/pages`);
        const pagesData = await pagesRes.json();
        if (pagesData.success && Array.isArray(pagesData.pages)) {
          setPages(pagesData.pages);
          setActivePageIndex(0);
        }
      }
    } catch (e) {
      console.warn("Offset adjustment error:", e);
    } finally {
      setIsCalibrating(false);
      setIsLoading(false);
    }
  };

  const activePage = pages[activePageIndex];
  const totalPages = pages.length;

  const handlePrevPage = () => {
    setActivePageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setActivePageIndex(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(180, prev + 15));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(70, prev - 15));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div className={`space-y-4 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between' : ''}`} dir={dir}>
      
      {/* 🧭 TOP CONTROLS & BREADCRUMB BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Page status indicator */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">
                {totalPages > 0 
                  ? `صفحة ${activePageIndex + 1} من ${totalPages}` 
                  : 'صفحات المذكرة الأصلية المعتمدة'}
              </span>
              {activePage?.pageNumber && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200">
                  صفحة المذكرة: {activePage.pageNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-md">
              {chapterTitle} {startPage && endPage ? `(من صفحة ${startPage} إلى ${endPage})` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* 🎚️ Optical Page Offset Calibrator */}
          <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl p-1 text-xs gap-1" title="محاذاة بصرية تلقائية للنواة مع إمكانية الضبط الدقيق">
            <button
              onClick={() => handleAdjustOffset(-1)}
              disabled={isCalibrating}
              className="px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg font-black transition cursor-pointer disabled:opacity-40"
              title="تأخير صفحة واحدة (-1)"
            >
              -1
            </button>
            <span className="text-[10px] font-bold text-indigo-900 px-1.5 font-mono flex items-center gap-1">
              <span>🎯 محاذاة:</span>
              <span>{pageOffset >= 0 ? `+${pageOffset}` : pageOffset}</span>
            </span>
            <button
              onClick={() => handleAdjustOffset(+1)}
              disabled={isCalibrating}
              className="px-2 py-0.5 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg font-black transition cursor-pointer disabled:opacity-40"
              title="تقديم صفحة واحدة (+1)"
            >
              +1
            </button>
          </div>

          {/* Zoom Controls */}
          {totalPages > 0 && (
            <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 70}
                className="p-1.5 hover:bg-white text-gray-700 rounded-lg transition disabled:opacity-30 cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 text-[11px] font-mono font-bold hover:bg-white text-gray-800 rounded-lg transition cursor-pointer"
                title="إعادة ضبط الحجم"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 180}
                className="p-1.5 hover:bg-white text-gray-700 rounded-lg transition disabled:opacity-30 cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Audio Accompaniment */}
          {onPlayAudio && (
            <button
              onClick={onPlayAudio}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                isAudioPlaying 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
              title="استمع للشرح الصوتي أثناء مطالعة الصفحة الأصلية"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAudioPlaying ? 'إيقاف الصوت' : 'استماع للشرح'}</span>
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
            title={isFullscreen ? 'الخروج من ملء الشاشة' : 'عرض بملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Switch to Smart Reader */}
          {onSwitchToSmartReader && (
            <button
              onClick={onSwitchToSmartReader}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">التفكيك الذكي للفقرات 📝</span>
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ EXERCISE PAGE NOTICE IN STUDY VIEWER */}
      {activePage?.pageType === 'exercise' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-orange-500/10 border-2 border-amber-400 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-amber-950 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📝</span>
            <div>
              <span className="text-xs font-black block">صفحة أنشطة وتدريبات الدرس المعتمدة</span>
              <span className="text-[11px] text-amber-800">
                هذه الصفحة تحتوي على أسئلة وتطبيقات المذكرة، ويمكنك حلها تفاعلياً وتصحيحها بالذكاء الاصطناعي في تبويب التمارين
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const sandboxBtn = document.querySelector('button[title*="أنشطة"], button:has(svg.lucide-terminal)') as HTMLElement;
              if (sandboxBtn) sandboxBtn.click();
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl transition shadow-xs cursor-pointer"
          >
            الانتقال للحل التفاعلي في بنك التمارين 🎯
          </button>
        </div>
      )}

      {/* 🖼️ MAIN SLIDE CANVAS */}
      <div className="relative bg-slate-900/95 rounded-3xl p-3 sm:p-6 shadow-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[550px] overflow-hidden">
        
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h5 className="text-base font-black text-white">جاري استدعاء صفحات المذكرة بدقة فائقة...</h5>
              <p className="text-xs text-slate-400">نظام Precision Page Extractor يقوم بعرض الصفحات الأصلية للدرس</p>
            </div>
          </div>
        ) : totalPages > 0 ? (
          <div className="relative w-full flex flex-col items-center">
            
            {/* Previous / Next Nav Overlays */}
            <button
              onClick={handlePrevPage}
              disabled={activePageIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white shadow-xl border border-slate-700 disabled:opacity-20 transition cursor-pointer backdrop-blur-xs"
              title="الصفحة السابقة"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNextPage}
              disabled={activePageIndex === totalPages - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white shadow-xl border border-slate-700 disabled:opacity-20 transition cursor-pointer backdrop-blur-xs"
              title="الصفحة التالية"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Rendered Page Image */}
            <div 
              className="transition-transform duration-200 ease-out max-w-full overflow-auto rounded-2xl shadow-2xl bg-white border-4 border-slate-800"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              <img
                src={activePage.dataUrl}
                alt={`صفحة رقم ${activePage.pageNumber}`}
                className="max-h-[750px] w-auto object-contain select-none pointer-events-auto"
                loading="eager"
              />
            </div>
          </div>
        ) : (
          <div className="py-20 px-6 text-center max-w-md mx-auto space-y-4 bg-slate-800/80 rounded-2xl border border-slate-700">
            <Layers className="w-12 h-12 text-amber-400 mx-auto" />
            <div className="space-y-1.5">
              <h5 className="text-base font-black text-white">صفحات المذكرة المعتمدة</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {loadError || 'هذا الدرس متاح حالياً عبر وضع "التفكيك الذكي والمفاهيم" بالفقرات المشروحة وبنك التمارين.'}
              </p>
            </div>
            {onSwitchToSmartReader && (
              <button
                onClick={onSwitchToSmartReader}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                فتح التفكيك الذكي للفقرات والتمارين 📝
              </button>
            )}
          </div>
        )}
      </div>

      {/* 📑 BOTTOM THUMBNAILS CAROUSEL */}
      {totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex items-center justify-center gap-3 overflow-x-auto">
          {pages.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePageIndex(idx)}
              className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all p-1 cursor-pointer flex flex-col items-center gap-1 ${
                activePageIndex === idx 
                  ? 'border-indigo-600 ring-2 ring-indigo-300 scale-105 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-400 bg-gray-50 opacity-70 hover:opacity-100'
              }`}
            >
              <img 
                src={p.dataUrl} 
                alt={`مصغرة ${p.pageNumber}`} 
                className="w-16 h-20 object-cover rounded-lg shadow-2xs" 
              />
              <span className="text-[10px] font-bold text-slate-800">ص {p.pageNumber}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
