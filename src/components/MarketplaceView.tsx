import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, BookOpen, Star, Sparkles, ExternalLink, Play, HelpCircle,
  Plus, Shield, Eye, EyeOff, Trash2, Layers, GraduationCap, Calendar, Edit3, Tag,
  ShoppingCart, CheckCircle2, Bookmark, Flame, Radio, Zap, Clock, Award, Heart, TrendingUp, School, Building2, X, ChevronDown
} from 'lucide-react';
import { MarketplaceBook, BookCategory, UserRole } from '../types';
import { EditBookModal } from './EditBookModal';
import { 
  MAIN_CATEGORIES, 
  EDUCATION_LEVELS, 
  ACADEMIC_SYSTEMS, 
  ACADEMIC_SUBJECTS, 
  GENERAL_SUBJECTS, 
  SEMESTERS, 
  ACADEMIC_YEARS, 
  getGradesForSystem 
} from '../constants/taxonomy';
import { PurchaseModal } from './PurchaseModal';
import { useLanguage } from '../i18n/LanguageContext';

interface MarketplaceViewProps {
  books: MarketplaceBook[];
  userRole: UserRole;
  isAdminMode: boolean;
  purchasedBookIds?: string[];
  currentUser?: any;
  onOpenAuth?: () => void;
  onLaunchBook: (book: MarketplaceBook) => void;
  onLaunchQuiz: (book: MarketplaceBook) => void;
  onOpenCreateModal: () => void;
  onOpenExternalModal: () => void;
  onTogglePublish: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onUpdateBook?: (updatedBook: MarketplaceBook) => Promise<void>;
  onPurchaseBook?: (book: MarketplaceBook) => Promise<void>;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  books,
  userRole,
  isAdminMode,
  purchasedBookIds = [],
  currentUser,
  onOpenAuth,
  onLaunchBook,
  onLaunchQuiz,
  onOpenCreateModal,
  onOpenExternalModal,
  onTogglePublish,
  onDeleteBook,
  onUpdateBook,
  onPurchaseBook
}) => {
  const { t, language, dir } = useLanguage();
  const [mainViewTab, setMainViewTab] = useState<'marketplace' | 'my_library' | 'favorites'>('marketplace');
  const [quickFilter, setQuickFilter] = useState<'all' | 'free' | 'paid' | 'certified' | 'ai_interactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory>('all');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('all');
  const [selectedAcademicSystem, setSelectedAcademicSystem] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [hasQuizFilter, setHasQuizFilter] = useState(false);
  const [hasMediaFilter, setHasMediaFilter] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // DEFAULT SORTING: Newest to Oldest (من الأحدث للأقدم)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'rating' | 'price_low' | 'price_high'>('newest');

  // Sync tab with URL query parameter on mount or change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'my_library') setMainViewTab('my_library');
    else if (tabParam === 'favorites') setMainViewTab('favorites');
  }, []);

  // Favorites & Read Later States (saved to localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_book_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readLater, setReadLater] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('read_later_book_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(bookId)
      ? favorites.filter(id => id !== bookId)
      : [...favorites, bookId];
    setFavorites(updated);
    localStorage.setItem('favorite_book_ids', JSON.stringify(updated));
  };

  const toggleReadLater = (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = readLater.includes(bookId)
      ? readLater.filter(id => id !== bookId)
      : [...readLater, bookId];
    setReadLater(updated);
    localStorage.setItem('read_later_book_ids', JSON.stringify(updated));
  };

  // Edit & Purchase Modal States
  const [editingBook, setEditingBook] = useState<MarketplaceBook | null>(null);
  const [purchasingBook, setPurchasingBook] = useState<MarketplaceBook | null>(null);

  // Extract all clean tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      b.tags?.forEach(t => {
        if (!t.includes(':')) set.add(t);
      });
    });
    return Array.from(set);
  }, [books]);

  // My Library Books list
  const myLibraryBooks = useMemo(() => {
    return books.filter(b => {
      if (isAdminMode) return true;
      const isPurchased = purchasedBookIds.includes(b.id);
      const isFree = !b.price || b.price === 0;
      return isPurchased || isFree;
    });
  }, [books, purchasedBookIds, isAdminMode]);

  // Comprehensive multi-criteria filtering and sorting
  const filteredBooks = useMemo(() => {
    const sourceList = mainViewTab === 'my_library' 
      ? myLibraryBooks 
      : mainViewTab === 'favorites'
        ? books.filter(b => favorites.includes(b.id))
        : books;

    let result = sourceList.filter(book => {
      if (!isAdminMode && !book.is_published) return false;
      
      // Quick Filter Pills (الكل | المجانية | المدفوعة | معتمد | تفاعلي بالذكاء الاصطناعي)
      if (quickFilter === 'free' && book.price && book.price > 0) return false;
      if (quickFilter === 'paid' && (!book.price || book.price === 0)) return false;
      if (quickFilter === 'certified' && (!book.is_published && !book.is_external)) return false;
      if (quickFilter === 'ai_interactive' && (!book.chapters || book.chapters.length === 0)) return false;

      // Category filter (support 10 main categories and legacy aliases)
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'academic_curriculum') {
          const isAcad = book.category === 'academic_curriculum' || book.category === 'digital_book' || book.track === 'academic';
          if (!isAcad) return false;
        } else if (selectedCategory === 'programming_ai') {
          const isProg = book.category === 'programming_ai' || book.category === 'technology' || book.track === 'programming_tech';
          if (!isProg) return false;
        } else if (selectedCategory === 'self_help') {
          const isSelf = book.category === 'self_help' || book.track === 'self_help';
          if (!isSelf) return false;
        } else if (selectedCategory === 'business_marketing') {
          const isBiz = book.category === 'business_marketing' || book.category === 'business' || book.track === 'business_finance';
          if (!isBiz) return false;
        } else if (selectedCategory === 'languages_translation') {
          const isLang = book.category === 'languages_translation' || book.track === 'languages';
          if (!isLang) return false;
        } else if (selectedCategory === 'literature_novels') {
          const isLit = book.category === 'literature_novels' || book.category === 'classics' || book.track === 'general_literature';
          if (!isLit) return false;
        } else if (selectedCategory === 'training_packages') {
          const isKit = book.category === 'training_packages' || book.category === 'training_kit';
          if (!isKit) return false;
        } else {
          if (book.category !== selectedCategory) return false;
        }
      }

      // Education Level filter
      if (selectedEducationLevel !== 'all') {
        const matchesEdu = book.education_level === selectedEducationLevel || book.tags?.includes(`edu_level:${selectedEducationLevel}`);
        if (!matchesEdu) return false;
      }

      // Academic System filter
      if (selectedAcademicSystem !== 'all') {
        const matchesSys = book.academic_system === selectedAcademicSystem || book.tags?.includes(`system:${selectedAcademicSystem}`);
        if (!matchesSys) return false;
      }
      
      // Subcategory filter (checks direct prop or tag)
      if (selectedSubcategory !== 'all') {
        const hasSub = book.subcategory === selectedSubcategory || book.tags?.includes(`sub:${selectedSubcategory}`);
        if (!hasSub) return false;
      }

      // Grade Level filter
      if (selectedGradeLevel !== 'all') {
        const hasGrade = book.grade_level === selectedGradeLevel || book.tags?.includes(`grade:${selectedGradeLevel}`);
        if (!hasGrade) return false;
      }

      // Semester filter
      if (selectedSemester !== 'all') {
        const hasSem = book.semester === selectedSemester || book.tags?.includes(`term:${selectedSemester}`);
        if (!hasSem) return false;
      }

      // Academic Year filter
      if (selectedAcademicYear !== 'all') {
        const hasYear = book.academic_year === selectedAcademicYear || book.tags?.includes(`year:${selectedAcademicYear}`);
        if (!hasYear) return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && (!book.tags || !book.tags.includes(selectedTag))) {
        return false;
      }

      // Cost filter (free vs paid)
      if (costFilter === 'free' && book.price && book.price > 0) return false;
      if (costFilter === 'paid' && (!book.price || book.price === 0)) return false;

      // Quiz and Media filters
      if (hasQuizFilter && (!book.question_bank || book.question_bank.length === 0)) return false;
      if (hasMediaFilter && (!book.chapters || !book.chapters.some(c => c.videos && c.videos.length > 0))) return false;

      // Rating filter
      if (minRating > 0 && (book.rating || 0) < minRating) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = book.title?.toLowerCase().includes(q);
        const inDesc = book.description?.toLowerCase().includes(q);
        const inAuthor = book.author_name?.toLowerCase().includes(q);
        const inTags = book.tags?.some(t => t.toLowerCase().includes(q));
        const inSub = book.subcategory?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inAuthor && !inTags && !inSub) return false;
      }

      return true;
    });

    // Sort by criteria
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || a.createdAt || 0).getTime() - new Date(b.created_at || b.createdAt || 0).getTime());
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [
    books, myLibraryBooks, mainViewTab, quickFilter, favorites, readLater, isAdminMode,
    selectedCategory, selectedEducationLevel, selectedAcademicSystem, selectedSubcategory, selectedGradeLevel,
    selectedSemester, selectedAcademicYear, selectedTag, costFilter, minRating,
    hasQuizFilter, searchQuery, sortBy
  ]);

  // 🔍 Arabic-Friendly Fuzzy Search Algorithm for Title Typo Correction
  const fuzzySuggestion = useMemo(() => {
    if (!searchQuery.trim() || filteredBooks.length > 0 || books.length === 0) return null;

    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670]/g, '') // strip harakat
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[^a-z0-9\u0600-\u06FF]/g, ' ')
        .trim();
    };

    const target = normalize(searchQuery);
    if (target.length < 3) return null;

    const targetWords = target.split(/\s+/).filter(w => w.length >= 2);

    let bestMatch: MarketplaceBook | null = null;
    let highestScore = 0;

    for (const b of books) {
      const bTitle = normalize(b.title || '');
      const bAuthor = normalize(b.author_name || '');
      const full = `${bTitle} ${bAuthor}`;

      let score = 0;
      for (const w of targetWords) {
        if (full.includes(w)) {
          score += 2;
        } else {
          for (let len = Math.min(w.length, 4); len >= 3; len--) {
            if (full.includes(w.substring(0, len))) {
              score += 0.8;
              break;
            }
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = b;
      }
    }

    if (highestScore >= 0.8 && bestMatch) {
      return bestMatch;
    }
    return null;
  }, [searchQuery, filteredBooks.length, books]);

  const handleResetFilters = () => {
    setQuickFilter('all');
    setSelectedCategory('all');
    setSelectedEducationLevel('all');
    setSelectedAcademicSystem('all');
    setSelectedSubcategory('all');
    setSelectedGradeLevel('all');
    setSelectedSemester('all');
    setSelectedAcademicYear('all');
    setSelectedTag('all');
    setCostFilter('all');
    setHasQuizFilter(false);
    setHasMediaFilter(false);
    setMinRating(0);
    setSearchQuery('');
    setSortBy('newest');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedEducationLevel !== 'all') count++;
    if (selectedAcademicSystem !== 'all') count++;
    if (selectedSubcategory !== 'all') count++;
    if (selectedGradeLevel !== 'all') count++;
    if (selectedSemester !== 'all') count++;
    if (selectedAcademicYear !== 'all') count++;
    if (selectedTag !== 'all') count++;
    if (costFilter !== 'all') count++;
    if (hasQuizFilter) count++;
    if (hasMediaFilter) count++;
    if (minRating > 0) count++;
    return count;
  }, [
    selectedCategory, selectedEducationLevel, selectedAcademicSystem,
    selectedSubcategory, selectedGradeLevel, selectedSemester,
    selectedAcademicYear, selectedTag, costFilter, hasQuizFilter,
    hasMediaFilter, minRating
  ]);

  // 🎨 Generates Subject-Specific Dynamic Covers to prevent repetitive identical photos
  const renderBookCover = (book: MarketplaceBook) => {
    const isGenericUnsplash = !book.thumbnail_url || book.thumbnail_url.includes('photo-1532012197267-da84d127e765');
    if (!isGenericUnsplash && book.thumbnail_url) {
      return (
        <img
          src={book.thumbnail_url}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
      );
    }

    const titleLower = (book.title + ' ' + (book.subcategory || '')).toLowerCase();
    
    let theme = {
      gradient: 'from-slate-900 via-indigo-950 to-slate-900',
      badge: 'مقرر دراسي',
      icon: '📚'
    };

    if (titleLower.includes('قرآن') || titleLower.includes('ملك') || titleLower.includes('تبارك') || titleLower.includes('إسلامي') || titleLower.includes('دين') || titleLower.includes('تفسير')) {
      theme = {
        gradient: 'from-emerald-950 via-teal-900 to-slate-950',
        badge: 'دراسات إسلامية وقرآن',
        icon: '📖'
      };
    } else if (titleLower.includes('حاسب') || titleLower.includes('برمج') || titleLower.includes('ذكاء') || titleLower.includes('تقني') || titleLower.includes('كود')) {
      theme = {
        gradient: 'from-slate-950 via-cyan-950 to-indigo-950',
        badge: 'حاسب آلي وتكنولوجيا',
        icon: '💻'
      };
    } else if (titleLower.includes('أحياء') || titleLower.includes('جيولوج') || titleLower.includes('طبيع') || titleLower.includes('نبات')) {
      theme = {
        gradient: 'from-emerald-950 via-green-900 to-teal-950',
        badge: 'علوم وأحياء',
        icon: '🧬'
      };
    } else if (titleLower.includes('فيزياء') || titleLower.includes('كيمياء') || titleLower.includes('علوم')) {
      theme = {
        gradient: 'from-blue-950 via-indigo-900 to-purple-950',
        badge: 'فيزياء وكيمياء',
        icon: '⚡'
      };
    } else if (titleLower.includes('رياضيات') || titleLower.includes('جبر') || titleLower.includes('هندسة') || titleLower.includes('تفاضل')) {
      theme = {
        gradient: 'from-cyan-950 via-blue-900 to-slate-950',
        badge: 'رياضيات وإحصاء',
        icon: '📐'
      };
    } else if (titleLower.includes('إنجليز') || titleLower.includes('english') || titleLower.includes('لغات') || titleLower.includes('فرنسي')) {
      theme = {
        gradient: 'from-purple-950 via-fuchsia-900 to-slate-950',
        badge: 'لغات وترجمة',
        icon: '🌐'
      };
    } else if (titleLower.includes('رخصة') || titleLower.includes('مهني') || titleLower.includes('معلم')) {
      theme = {
        gradient: 'from-amber-950 via-orange-900 to-slate-950',
        badge: 'رخصة مهنية وتأهيل',
        icon: '🎓'
      };
    } else if (titleLower.includes('حرب') || titleLower.includes('تاريخ') || titleLower.includes('فلسف') || titleLower.includes('أدب')) {
      theme = {
        gradient: 'from-stone-950 via-amber-950 to-neutral-900',
        badge: 'علوم إنسانية وفكر',
        icon: '🏛️'
      };
    }

    return (
      <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} p-3.5 flex flex-col justify-between text-white relative select-none group-hover:scale-102 transition duration-300`}>
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Top spacer to ensure clear clearance for top-left icons & top-right price */}
        <div className="h-6" />

        <div className="relative z-10 my-auto text-center px-2 py-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black border border-white/15 text-white/90">
            <span>{theme.icon}</span>
            <span>{theme.badge}</span>
          </div>

          <h4 className="text-sm sm:text-base font-black text-white leading-snug drop-shadow-md line-clamp-2">
            {book.title}
          </h4>
          {book.grade_level && (
            <span className="text-[10px] text-white/75 font-bold block">
              {book.grade_level}
            </span>
          )}
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] text-white/60 border-t border-white/10 pt-1.5">
          <span className="font-bold truncate max-w-[140px]">{book.author_name || 'خبير المادة'}</span>
          <span className="text-amber-400 font-black">★ {book.rating || 5.0}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in text-right" dir={dir}>
      
      {/* 🌟 UNIFIED TOP ACTION & CONTROLS BAR (No bulky hero - compact & powerful) */}
      <div className="space-y-3">
        {/* ROW 1: TABS (STORE / MY COURSES) + FAVORITES + COMPACT GENERATION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          {/* Main 2 Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setMainViewTab('marketplace')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                mainViewTab === 'marketplace'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>المتجر والمقررات ({books.length})</span>
            </button>

            <button
              onClick={() => setMainViewTab('my_library')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                mainViewTab === 'my_library'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>مقرراتي المشترك بها ({myLibraryBooks.length})</span>
            </button>
          </div>

          {/* Action Group: Favorites + Generation Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Favorites Button */}
            <button
              onClick={() => setMainViewTab('favorites')}
              className={`py-1.5 px-3 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer ${
                mainViewTab === 'favorites'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
              title="المقررات المفضلة"
            >
              <Heart className={`w-3.5 h-3.5 ${mainViewTab === 'favorites' ? 'fill-current' : 'fill-rose-500 text-rose-500'}`} />
              <span>المفضلة ({favorites.length})</span>
            </button>

            {/* AI Generation Buttons (Compact, visible on all screens) */}
            {(isAdminMode || userRole === 'instructor' || userRole === 'admin') && (
              <>
                <button
                  onClick={onOpenCreateModal}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                  title="توليد مقرر جديد بالذكاء الاصطناعي"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>توليد بالـ AI ⚡</span>
                </button>

                <button
                  onClick={onOpenExternalModal}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer shrink-0"
                  title="إضافة مقرر خارجي مدمج"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline">مقرر مدمج</span>
                  <span className="sm:hidden">+</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ROW 2: INTEGRATED SEARCH + 10-DEPARTMENT SELECTOR + FILTER TRIGGER + SORT */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Central Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان، المادة، اسم المدرس، أو المرحلة..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:bg-white focus:border-teal-500 placeholder-slate-400 transition"
            />
            <Search className="w-4 h-4 text-teal-600 absolute top-2.5 right-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {/* 10 Departments Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BookCategory)}
                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-black rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">📚 جميع الأقسام ({books.length})</option>
                {MAIN_CATEGORIES.map(dept => {
                  const count = books.filter(b => {
                    if (dept.id === 'academic_curriculum') return b.category === 'academic_curriculum' || b.category === 'digital_book' || b.track === 'academic';
                    if (dept.id === 'programming_ai') return b.category === 'programming_ai' || b.category === 'technology' || b.track === 'programming_tech';
                    if (dept.id === 'self_help') return b.category === 'self_help' || b.track === 'self_help';
                    if (dept.id === 'business_marketing') return b.category === 'business_marketing' || b.category === 'business' || b.track === 'business_finance';
                    if (dept.id === 'languages_translation') return b.category === 'languages_translation' || b.track === 'languages';
                    if (dept.id === 'literature_novels') return b.category === 'literature_novels' || b.category === 'classics' || b.track === 'general_literature';
                    if (dept.id === 'training_packages') return b.category === 'training_packages' || b.category === 'training_kit';
                    return b.category === dept.id;
                  }).length;
                  return (
                    <option key={dept.id} value={dept.id}>
                      {dept.label} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 right-2 pointer-events-none" />
            </div>

            {/* Filter Sheet Trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="px-3 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              <span>تصفية وفلاتر ⚙️</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="newest">📅 الأحدث إضافة</option>
                <option value="popular">🔥 الأكثر طلباً</option>
                <option value="rating">⭐ الأعلى تقييماً</option>
                <option value="price_low">🏷️ الأقل سعراً</option>
                <option value="price_high">💎 الأعلى سعراً</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 right-2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ROW 3: QUICK ATTRIBUTE PILLS + RESULTS COUNT */}
        <div className="space-y-2 pb-1">
          {/* Quick Stage Taxonomy Selector (El Maestro Axis 5) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'كافة المراحل 📚' },
              { id: 'kg', label: 'رياض أطفال 🎨' },
              { id: 'primary', label: 'ابتدائي 🎒' },
              { id: 'prep', label: 'إعدادي 📐' },
              { id: 'sec', label: 'ثانوي 🎓' },
              { id: 'uni', label: 'جامعي 🏛️' },
            ].map((stg) => {
              const isSelected = 
                (stg.id === 'all' && selectedGradeLevel === 'all') ||
                (stg.id === 'kg' && selectedGradeLevel === 'رياض الأطفال') ||
                (stg.id === 'primary' && selectedGradeLevel === 'المرحلة الابتدائية') ||
                (stg.id === 'prep' && selectedGradeLevel === 'المرحلة الإعدادية') ||
                (stg.id === 'sec' && selectedGradeLevel === 'المرحلة الثانوية') ||
                (stg.id === 'uni' && selectedGradeLevel === 'المرحلة الجامعية');
              return (
                <button
                  key={stg.id}
                  onClick={() => {
                    if (stg.id === 'all') setSelectedGradeLevel('all');
                    else if (stg.id === 'kg') setSelectedGradeLevel('رياض الأطفال');
                    else if (stg.id === 'primary') setSelectedGradeLevel('المرحلة الابتدائية');
                    else if (stg.id === 'prep') setSelectedGradeLevel('المرحلة الإعدادية');
                    else if (stg.id === 'sec') setSelectedGradeLevel('المرحلة الثانوية');
                    else if (stg.id === 'uni') setSelectedGradeLevel('المرحلة الجامعية');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-indigo-900 text-white shadow-xs font-black ring-2 ring-indigo-500/30'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{stg.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'free', label: 'المجانية 🆓' },
                { id: 'paid', label: 'المدفوعة 💎' },
                { id: 'certified', label: 'معتمد 🛡️' },
                { id: 'ai_interactive', label: 'تفاعلي بالـ AI ⚡' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQuickFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    quickFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-xs font-black'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 font-bold whitespace-nowrap shrink-0">
              المعروض: <strong className="text-teal-700">{filteredBooks.length}</strong> من {books.length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* 💡 FUZZY SEARCH DID-YOU-MEAN SUGGESTION BANNER */}
        {fuzzySuggestion && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-slide-up">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-800">هل تقصد البحث عن مقرر:</span>
                <h4 className="text-sm font-black text-amber-950 font-sans">"{fuzzySuggestion.title}"؟</h4>
              </div>
            </div>
            <button
              onClick={() => setSearchQuery(fuzzySuggestion.title)}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              تطبيق هذا العنوان 🔍
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {filteredBooks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
            <BookOpen className="w-14 h-14 text-indigo-200 mx-auto" />
            <h3 className="text-lg font-black text-gray-900">لا توجد كتب أو مقررات مطابقة للبحث أو التصفية</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {books.length === 0 
                ? 'قاعدة البيانات فارغة حالياً. يمكنك توليد كتاب جديد بالذكاء الاصطناعي الآن عبر زر "توليد بالـ AI".'
                : 'جرب تغيير معايير التصفية أو اضغط على "إعادة ضبط" لعرض كافة المقررات.'}
            </p>
            {books.length === 0 && (isAdminMode || userRole === 'instructor' || userRole === 'admin') && (
              <button
                onClick={onOpenCreateModal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>توليد أول مقرر بالذكاء الاصطناعي</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  onClick={() => onLaunchBook(book)}
                  className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer group ${
                    !book.is_published ? 'opacity-60 border-dashed border-amber-300' : 'border-gray-200 hover:border-teal-400'
                  }`}
                >
                  <div>
                    {/* THUMBNAIL / DYNAMIC COVER */}
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {renderBookCover(book)}

                      {/* TOP LEFT: FAVORITES BUTTON ONLY (Bookmark icon removed) */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(book.id, e)}
                          title={favorites.includes(book.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                          className={`p-1.5 rounded-lg backdrop-blur-md transition shadow-xs cursor-pointer ${
                            favorites.includes(book.id)
                              ? 'bg-rose-500 text-white shadow-rose-200'
                              : 'bg-black/35 hover:bg-black/55 text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.includes(book.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* TOP RIGHT: CLEAN PRICE BADGE */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                        {!book.price || book.price === 0 ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded-lg shadow-sm">
                            مجاني 🆓
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 font-black text-[10px] rounded-lg shadow-sm">
                            {book.price} ج.م 💎
                          </span>
                        )}

                        {book.is_external && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[9px] rounded-lg shadow-xs flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" />
                            خارجي
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CONTENT (Title is already rendered clearly on the cover - showing instructor & tags) */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-100 font-black text-[10px]">
                          {book.category === 'digital_book' ? 'كتاب رقمي' : book.category === 'quiz_bank' ? 'بنك أسئلة' : 'مقرر تفاعلي'}
                        </span>
                        <Link
                          to={`/instructor/${encodeURIComponent(book.author_name || 'instructor')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-500 hover:text-teal-600 transition font-bold text-[11px] truncate max-w-[120px]"
                          title="عرض بروفايل المعلم والمقررات التابعة له"
                        >
                          {book.author_name || 'خبير المادة'}
                        </Link>
                      </div>

                      {/* Single Clean Academic Line (if available) */}
                      {(book.grade_level || book.subcategory) && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 pt-0.5 font-bold">
                          {book.grade_level && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[110px]">
                              {book.grade_level}
                            </span>
                          )}
                          {book.subcategory && (
                            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md truncate max-w-[110px]">
                              {book.subcategory}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pedagogical Curriculum Badges (El Maestro Axis 5) */}
                      <div className="flex flex-wrap items-center gap-1 text-[9px] font-bold pt-1 border-t border-slate-100">
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-0.5">
                          <Radio className="w-2.5 h-2.5" />
                          <span>شرح صوتي شامل</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center gap-0.5">
                          <Layers className="w-2.5 h-2.5" />
                          <span>معمل تفاعلي</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>بنك أسئلة</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS & MONETIZATION */}
                  <div className="p-4 pt-0 space-y-2">
                    <div className="pt-2 border-t border-gray-100">
                      {(() => {
                        const isPurchased = purchasedBookIds.includes(book.id);
                        const isFree = !book.price || book.price === 0;
                        const isUnlocked = isFree || isPurchased || isAdminMode;

                        if (!isUnlocked) {
                          return (
                            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onLaunchBook(book)}
                                className="w-full py-2 px-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>🚀 تجربة الدرس الأول مجاناً</span>
                              </button>

                              <button
                                onClick={() => setPurchasingBook(book)}
                                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>شراء وتفعيل كامل المقرر ({book.price} ج.م)</span>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLaunchBook(book);
                            }}
                            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isPurchased && !isFree ? 'متابعة القراءة والتعلم 📖' : 'ابدأ القراءة والتفاعل 📖'}</span>
                          </button>
                        );
                      })()}

                      {(isAdminMode || userRole === 'admin' || userRole === 'instructor') && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-wrap items-center justify-between gap-1.5 pt-2 mt-2 border-t border-slate-100 text-[11px] bg-slate-50/80 -mx-4 -mb-4 p-2.5 rounded-b-2xl"
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingBook(book)}
                              className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-black px-2 py-1 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
                              title="تعديل بيانات وسعر وغلاف المقرر"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل ✏️</span>
                            </button>

                            <Link
                              to={`/book/${book.id}?tab=editor`}
                              className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-black px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                              title="تعديل ورفع نصوص الفصول"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>رفع الفصول 📤</span>
                            </Link>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onTogglePublish(book.id)}
                              className={`flex items-center gap-1 font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                                book.is_published 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="تغيير حالة النشر"
                            >
                              {book.is_published ? (
                                <>
                                  <EyeOff className="w-3 h-3 text-amber-600" />
                                  <span>إخفاء</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-600" />
                                  <span>نشر</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => onDeleteBook(book.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="حذف المقرر نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* MOBILE FILTER DRAWER MODAL */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-xs p-0 sm:p-4" dir="rtl">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                <span>تصفية الكتب والمقررات</span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-teal-600 font-bold hover:underline"
                >
                  إعادة ضبط
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CATEGORIES */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">القسم الرئيسي</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BookCategory)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">جميع الأقسام ({books.length})</option>
                {MAIN_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* EDUCATION LEVEL */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">المرحلة التعليمية</label>
              <select
                value={selectedEducationLevel}
                onChange={(e) => {
                  setSelectedEducationLevel(e.target.value);
                  if (e.target.value === 'all') setSelectedAcademicSystem('all');
                }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">كل المراحل</option>
                {EDUCATION_LEVELS.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                ))}
              </select>
            </div>

            {/* SYSTEM */}
            {selectedEducationLevel === 'pre_university' && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700">مسار ونظام التعليم</label>
                <select
                  value={selectedAcademicSystem}
                  onChange={(e) => setSelectedAcademicSystem(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
                >
                  <option value="all">كل المسارات</option>
                  {ACADEMIC_SYSTEMS.map(sys => (
                    <option key={sys.id} value={sys.id}>{sys.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* GRADE */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">الصف الدراسي</label>
              <select
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">جميع الصفوف</option>
                {getGradesForSystem(
                  selectedEducationLevel === 'university' ? 'university' : 'pre_university',
                  selectedAcademicSystem !== 'all' ? selectedAcademicSystem : 'general_arabic'
                ).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORY / SUBJECT */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">المادة / التخصص</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="all">كل المواد والتخصصات</option>
                {Array.from(new Set([...ACADEMIC_SUBJECTS, ...GENERAL_SUBJECTS])).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* COST */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700">التكلفة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'free', label: 'مجاني' },
                  { id: 'paid', label: 'مدفوع' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCostFilter(c.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      costFilter === c.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* APPLY ACTION */}
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-md shadow-teal-600/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>عرض النتائج ({filteredBooks.length} مقرر)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOK MODAL */}
      {editingBook && onUpdateBook && (
        <EditBookModal
          isOpen={!!editingBook}
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={onUpdateBook}
        />
      )}

      {/* PURCHASE MODAL */}
      {purchasingBook && onPurchaseBook && (
        <PurchaseModal
          isOpen={!!purchasingBook}
          book={purchasingBook}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onClose={() => setPurchasingBook(null)}
          onConfirmPurchase={onPurchaseBook}
        />
      )}
    </div>
  );
};
