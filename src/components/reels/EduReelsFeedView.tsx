import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, Flame, Filter, BookOpen, 
  Layers, RefreshCw, Smartphone, ChevronUp, ChevronDown, Award,
  Bookmark, Zap, Trophy, Sliders, X, CheckCircle2, BookMarked
} from 'lucide-react';
import { EduReel, EduReelStyle } from '../../types';
import { EduReelPlayer } from './EduReelPlayer';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  getGamificationState, 
  getSavedNotes, 
  deleteSavedNote, 
  GamificationState, 
  SavedReelNote 
} from '../../services/gamificationService';

interface EduReelsFeedViewProps {
  initialBookId?: string;
  currentUser?: any;
  onBack: () => void;
  onOpenBook: (bookId: string, chapterId: string) => void;
}

export const EduReelsFeedView: React.FC<EduReelsFeedViewProps> = ({
  initialBookId,
  currentUser,
  onBack,
  onOpenBook
}) => {
  const { t, dir } = useLanguage();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const activeBookId = initialBookId || params.bookId || searchParams.get('bookId') || undefined;

  const [reels, setReels] = useState<EduReel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedNotesOpen, setIsSavedNotesOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedReelNote[]>([]);
  const [gamification, setGamification] = useState<GamificationState>(getGamificationState());

  // Load saved notes from service
  const refreshNotes = () => {
    setSavedNotes(getSavedNotes());
  };

  useEffect(() => {
    refreshNotes();
    setGamification(getGamificationState());
  }, [isSavedNotesOpen]);

  // Fetch reels from backend
  useEffect(() => {
    const fetchReels = async () => {
      setIsLoading(true);
      try {
        const url = activeBookId
          ? `/api/reels/book/${activeBookId}`
          : `/api/reels/feed?category=${selectedCategory}&style=${selectedStyle}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.reels) {
            setReels(data.reels);
            setCurrentIndex(0);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch reels:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReels();
  }, [activeBookId, selectedCategory, selectedStyle]);

  // Keyboard navigation (Arrow Up / Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reels.length, currentIndex]);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch Swipe gestures
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (deltaY > 50) {
      handleNext();
    } else if (deltaY < -50) {
      handlePrev();
    }
  };

  const handleDeleteSavedNote = (noteId: string) => {
    const updated = deleteSavedNote(noteId);
    setSavedNotes(updated);
  };

  const activeReel = reels[currentIndex];
  const currentLevelProgress = Math.min(
    100, 
    Math.round(((gamification.xp - gamification.currentLevelBaseXp) / Math.max(1, (gamification.nextLevelXp - gamification.currentLevelBaseXp))) * 100)
  );

  return (
    <div 
      className="min-h-[92vh] flex flex-col justify-between py-2 text-start relative select-none"
      dir={dir}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 🌟 TOP NAVIGATION & DISCOVERY BAR */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>{activeBookId ? 'العودة لنص الكتاب' : 'العودة للمتجر والمقررات'}</span>
          </button>

          {/* STREAK & XP / LEVEL BADGE */}
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-black text-amber-700">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>سلسلة: {gamification.streakDays} {gamification.streakDays === 1 ? 'يوم' : 'أيام'} 🔥</span>
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span className="text-sky-700 font-mono">{gamification.xp} XP</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-800 font-bold">
              Lv.{gamification.level} {gamification.levelTitle} ({currentLevelProgress}%)
            </span>
          </div>
        </div>

        {/* CONTEXTUAL BOOK HEADER OR CATEGORY CHIPS */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {activeBookId ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>ريلز الكتاب المخصص ({currentIndex + 1} من {reels.length})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'}`}
              >
                🔥 لك For You
              </button>
              <button
                onClick={() => setSelectedCategory('academic_curriculum')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${selectedCategory === 'academic_curriculum' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-slate-600'}`}
              >
                📐 مناهج وعلوم
              </button>
              <button
                onClick={() => setSelectedCategory('digital_book')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${selectedCategory === 'digital_book' ? 'bg-white text-cyan-700 shadow-2xs font-black' : 'text-slate-600'}`}
              >
                💻 كتب تقنية
              </button>
              <button
                onClick={() => setSelectedCategory('novel')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${selectedCategory === 'novel' ? 'bg-white text-purple-700 shadow-2xs font-black' : 'text-slate-600'}`}
              >
                📜 روايات وأدب
              </button>
            </div>
          )}

          {/* SAVED NOTES DRAWER TRIGGER */}
          <button
            onClick={() => setIsSavedNotesOpen(true)}
            className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 transition cursor-pointer relative shrink-0"
            title="ملاحظاتي المحفوظة من الريلز"
          >
            <Bookmark className="w-4 h-4 fill-sky-700" />
            {savedNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {savedNotes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 🌟 MAIN FEED CONTENT */}
      <div className="flex-1 flex items-center justify-center relative">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">جاري تجهيز ريلز المعرفة الذكية...</p>
          </div>
        ) : reels.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4 max-w-md mx-auto">
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="font-black text-slate-900 text-lg">
              {activeBookId ? 'لا توجد ريلز منشورة لهذا الكتاب بعد' : 'لا توجد ريلز منشورة لهذا التصنيف بعد'}
            </h3>
            <p className="text-xs text-slate-500">
              يمكن للمعلم أو الأدمن توليد ريلز تفاعلية لكافة فصول المذكرات والروايات من استوديو المعلم بنقرة واحدة.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:bg-slate-800 transition"
            >
              {activeBookId ? 'الرجوع للكتاب' : 'استعراض المذكرات في المتجر'}
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            {activeReel && (
              <EduReelPlayer
                key={activeReel.id}
                reel={activeReel}
                isActive={true}
                currentUser={currentUser}
                onOpenBook={onOpenBook}
                onNextReel={handleNext}
                onPrevReel={handlePrev}
              />
            )}
          </div>
        )}
      </div>

      {/* 🌟 DESKTOP BOTTOM NAV HELPER */}
      {reels.length > 0 && (
        <div className="hidden sm:flex items-center justify-center gap-4 text-xs font-bold text-slate-400 pt-2">
          <span>استخدم الأسهم <strong>(↑ / ↓)</strong> أو السوايب للتنقل بين الريلز</span>
          <span>•</span>
          <span>
            {activeBookId 
              ? `فصل ${currentIndex + 1} من إجمالي ${reels.length} فصول`
              : `الريل ${currentIndex + 1} من ${reels.length}`}
          </span>
        </div>
      )}

      {/* 🌟 SAVED NOTES DRAWER MODAL */}
      {isSavedNotesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" dir={dir}>
          <div className="bg-white border border-gray-200 rounded-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-sky-600 fill-sky-600" />
                <h3 className="font-black text-slate-900 text-base">ملاحظاتي وخلاصات الريلز المحفوظة</h3>
              </div>
              <button
                onClick={() => setIsSavedNotesOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedNotes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Bookmark className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-bold">لم تقم بحفظ أي خلاصات ريلز بعد.</p>
                <p className="text-[11px] text-slate-400">اضغط على أيقونة الحفظ 🔖 أثناء مشاهدة أي ريل لإضافته لمحفظتك للمراجعة قبل الامتحانات.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedNotes.map((note) => (
                  <div key={note.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-800">
                        {note.chapterTitle}
                      </span>
                      <button
                        onClick={() => handleDeleteSavedNote(note.id)}
                        className="text-rose-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                        title="حذف من المحفوظات"
                      >
                        حذف
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      "{note.quote}"
                    </p>
                    <div className="text-[10px] text-slate-400">
                      حُفظت في: {new Date(note.timestamp).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EduReelsFeedView;

