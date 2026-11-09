import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link, useLocation, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen, ArrowLeft, Brain, HelpCircle, Youtube, Edit, Radio, Shield, LogOut, User, X, Sparkles, Compass, ShoppingCart, MessageSquare, Menu, ChevronLeft, ChevronDown, Phone, Building2, Sliders
} from 'lucide-react';
import { MarketplaceBook, UserRole } from './types';
import ContentUploader from './components/ContentUploader';
import MindMap from './components/MindMap';
import QuizSection from './components/QuizSection';
import VideoSection from './components/VideoSection';
import ChapterEditor from './components/ChapterEditor';
import PodcastLounge from './components/PodcastLounge';
import { ReadSection } from './components/ReadSection';
import { MarketplaceView } from './components/MarketplaceView';
import { LandingPageView } from './components/LandingPageView';
import { AuthModal } from './components/AuthModal';
import { AddExternalBookModal } from './components/AddExternalBookModal';
import { AdminInstructorHub } from './components/admin/AdminInstructorHub';
import { EduReelsFeedView } from './components/reels/EduReelsFeedView';
import { FaqPageView } from './components/FaqPageView';
import { AboutPageView } from './components/AboutPageView';
import BookDetailsRoute from './routes/BookDetailsRoute';
import InstructorProfileRoute from './routes/InstructorProfileRoute';
import { SupportModal } from './components/support/SupportModal';
import { ToastContainer, showToast } from './components/common/Toast';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getPlatformConfig, syncPlatformConfigWithServer, PlatformConfig } from './services/platformConfigService';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { LanguageSelector } from './components/common/LanguageSelector';

function AppContent() {
  const { t, language, dir } = useLanguage();
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfig());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    syncPlatformConfigWithServer().then(synced => {
      if (synced) setPlatformConfig(synced);
    });

    const handleConfigChange = (e: any) => {
      setPlatformConfig(e.detail || getPlatformConfig());
    };
    window.addEventListener('platform-config-changed', handleConfigChange);
    return () => window.removeEventListener('platform-config-changed', handleConfigChange);
  }, []);

  // 🌐 Dynamic Page Title Sync with Platform Brand Settings
  useEffect(() => {
    if (platformConfig.brandName) {
      document.title = `${platformConfig.brandName} | ${platformConfig.brandSubtitle || 'المنصة الذكية للكتب والمذكرات التعليمية'}`;
    }
  }, [platformConfig.brandName, platformConfig.brandSubtitle]);

  const [ebooks, setEbooks] = useState<MarketplaceBook[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [isAiCreateModalOpen, setIsAiCreateModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const [isConverting, setIsConverting] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('purchased_book_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const navigate = useNavigate();


  const handlePurchaseBook = async (book: MarketplaceBook) => {
    try {
      const updated = Array.from(new Set([...purchasedBookIds, book.id]));
      setPurchasedBookIds(updated);
      localStorage.setItem('purchased_book_ids', JSON.stringify(updated));

      if (currentUser?.id) {
        try {
          await supabase.from('user_purchases').upsert({
            user_id: currentUser.id,
            book_id: book.id,
            amount_paid: book.price || 0,
            purchase_date: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn("Purchase database sync notice:", dbErr);
        }
      }
    } catch (err) {
      console.error("Purchase error:", err);
    }
  };

  const fetchUserPurchasedBooks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('book_id')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const ids = data.map((item: any) => item.book_id).filter(Boolean);
        setPurchasedBookIds(prev => {
          const combined = Array.from(new Set([...prev, ...ids]));
          localStorage.setItem('purchased_book_ids', JSON.stringify(combined));
          return combined;
        });
      }
    } catch (e) {
      console.warn("User purchases fetch notice:", e);
    }
  };

  useEffect(() => {
    fetchSupabaseCatalog();
    checkAuthSession();

    // 🌐 Handle payment return redirects (PayPal / Paymob)
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const bookId = params.get('bookId');
    const amount = params.get('amount');
    const reason = params.get('reason');

    if (paymentStatus) {
      if (paymentStatus === 'success') {
        if (bookId) {
          setPurchasedBookIds(prev => {
            const updated = Array.from(new Set([...prev, bookId]));
            localStorage.setItem('purchased_book_ids', JSON.stringify(updated));
            return updated;
          });
          showToast('🎉 تم تأكيد الدفع بنجاح! تم تفعيل وتوفير الوصول الكامل للمقرر.', 'success');
          navigate(`/book/${bookId}?tab=read`);
        } else {
          showToast('🎉 تم تأكيد الدفع بنجاح!', 'success');
        }
      } else if (paymentStatus === 'recharge_success') {
        showToast(`💳 تم شحن محفظتك بنجاح ($${amount || ''} USD)!`, 'success');
      } else if (paymentStatus === 'cancelled') {
        showToast('ℹ️ تم إلغاء عملية الدفع.', 'info');
      } else if (paymentStatus === 'failed') {
        showToast(`❌ تعذر إتمام عملية الدفع: ${reason || 'يرجى المحاولة مرة أخرى.'}`, 'error');
      }

      // Clean query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchUserProfile(session.user.id, session.user);
        await fetchUserPurchasedBooks(session.user.id);
      } else {
        setCurrentUser(null);
        setUserRole('student');
        setIsAdminMode(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuthSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchUserProfile(session.user.id, session.user);
        await fetchUserPurchasedBooks(session.user.id);
      } else {
        // No active Supabase session
        setCurrentUser(null);
        setUserRole('student');
        setIsAdminMode(false);
        localStorage.removeItem('osera_auth_user');
        localStorage.removeItem('osera_auth_role');
        localStorage.removeItem('simplest_auth_user');
        localStorage.removeItem('simplest_auth_role');
      }
    } catch (e) {
      console.warn("Session check notice:", e);
    }
  };

  const fetchUserProfile = async (userId: string, authUser?: any) => {
    try {
      // 1. Check Supabase profiles table by ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile && profile.role) {
        const role = profile.role as UserRole;
        setUserRole(role);
        setIsAdminMode(role === 'admin');
        localStorage.setItem('osera_auth_role', role);
        localStorage.setItem('simplest_auth_role', role);
        return;
      }

      // 2. Check Supabase profiles table by Email
      if (authUser?.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (profileByEmail && profileByEmail.role) {
          const role = profileByEmail.role as UserRole;
          setUserRole(role);
          setIsAdminMode(role === 'admin');
          localStorage.setItem('osera_auth_role', role);
          localStorage.setItem('simplest_auth_role', role);
          return;
        }
      }

      // 3. Fallback to auth user metadata if profile not created yet
      const metaRole = (authUser?.user_metadata?.role as UserRole) || 'student';
      setUserRole(metaRole);
      setIsAdminMode(metaRole === 'admin');
      localStorage.setItem('osera_auth_role', metaRole);
      localStorage.setItem('simplest_auth_role', metaRole);

      // Auto-upsert profile to Supabase so it's permanently saved in DB
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: authUser?.email || '',
          full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || '',
          role: metaRole
        });
      } catch (e) {
        console.warn('Profile auto-create notice:', e);
      }
    } catch (e) {
      console.warn('Fetch profile error:', e);
      setUserRole('student');
      setIsAdminMode(false);
    }
  };

  const fetchSupabaseCatalog = async () => {
    try {
      // ⚡ High-Performance Catalog Select: Only fetch lightweight metadata (skip heavy full chapter markdown / original_text)
      const { data, error } = await supabase
        .from('books')
        .select('id, title, description, author_name, category, subcategory, education_level, academic_system, grade_level, semester, academic_year, price, is_external, external_url, preview_video_url, is_published, thumbnail_url, rating, reviews_count, created_at, tags')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const formatted: MarketplaceBook[] = data.map((b: any) => {
          let education_level = b.education_level;
          let academic_system = b.academic_system;
          let subcategory = b.subcategory;
          let grade_level = b.grade_level;
          let semester = b.semester;
          let academic_year = b.academic_year;
          let preview_video_url = b.preview_video_url;

          if (Array.isArray(b.tags)) {
            b.tags.forEach((t: string) => {
              if (t.startsWith('edu_level:') && !education_level) education_level = t.replace('edu_level:', '');
              if (t.startsWith('system:') && !academic_system) academic_system = t.replace('system:', '');
              if (t.startsWith('sub:') && !subcategory) subcategory = t.replace('sub:', '');
              if (t.startsWith('grade:') && !grade_level) grade_level = t.replace('grade:', '');
              if (t.startsWith('term:') && !semester) semester = t.replace('term:', '');
              if (t.startsWith('year:') && !academic_year) academic_year = t.replace('year:', '');
              if (t.startsWith('video:') && !preview_video_url) preview_video_url = t.replace('video:', '');
            });
          }

          return {
            ...b,
            author_name: b.author_name || 'خبير المادة',
            category: b.category || 'digital_book',
            education_level,
            academic_system,
            subcategory,
            grade_level,
            semester,
            academic_year,
            preview_video_url: preview_video_url || undefined,
            tags: b.tags || ['كتاب_تفاعلي'],
            price: Number(b.price) || 0,
            is_external: !!b.is_external,
            external_url: b.external_url,
            is_published: b.is_published !== false,
            thumbnail_url: b.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
            rating: b.rating || 5.0,
            reviews_count: b.reviews_count || 120,
            chapters: b.chapters || []
          };
        });

        setEbooks(formatted);
        return;
      }

      try {
        const res = await fetch('/api/ebooks');
        if (res.ok) {
          const localBooks = await res.json();
          setEbooks(localBooks);
        }
      } catch (err) {
        console.warn("Could not fetch fallback local books:", err);
      }
    } catch (err: any) {
      console.error("Catalog fetch error:", err);
    }
  };

  const handleLaunchBook = (book: MarketplaceBook) => {
    navigate(`/book/${book.id}`);
  };

  const handleLaunchQuiz = (book: MarketplaceBook) => {
    navigate(`/book/${book.id}?tab=quiz`);
  };

  const handleTogglePublish = async (bookId: string) => {
    const target = ebooks.find(b => b.id === bookId);
    if (!target) return;
    const newPublished = !target.is_published;
    setEbooks(prev => prev.map(b => b.id === bookId ? { ...b, is_published: newPublished } : b));
    try {
      await supabase.from('books').update({ is_published: newPublished }).eq('id', bookId);
    } catch (e) {
      console.warn("Publish toggle error:", e);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    setEbooks(prev => prev.filter(b => b.id !== bookId));
    
    // 1. Delete associated reels from Supabase
    try {
      await supabase.from('reels').delete().eq('book_id', bookId);
    } catch (e) {
      console.warn("Supabase reels delete error:", e);
    }

    // 2. Delete book from Supabase
    try {
      await supabase.from('books').delete().eq('id', bookId);
    } catch (e) {
      console.warn("Supabase delete error:", e);
    }

    // 3. Delete from backend server (also cascade cleans local reels.json)
    try {
      await fetch(`/api/ebooks/${bookId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Server delete error:", e);
    }
  };

  const handleUpdateBook = async (updatedBook: MarketplaceBook) => {
    setEbooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));

    try {
      const basePayload: any = {
        title: updatedBook.title,
        description: updatedBook.description,
        author_name: updatedBook.author_name,
        category: updatedBook.category,
        tags: updatedBook.tags,
        price: Number(updatedBook.price) || 0,
        thumbnail_url: updatedBook.thumbnail_url,
        is_published: updatedBook.is_published !== false
      };

      if (updatedBook.chapters) basePayload.chapters = updatedBook.chapters;
      if (updatedBook.mind_map) basePayload.mind_map = updatedBook.mind_map;
      if (updatedBook.question_bank) basePayload.question_bank = updatedBook.question_bank;

      const { error: err1 } = await supabase.from('books').update({
        ...basePayload,
        preview_video_url: updatedBook.preview_video_url || null
      }).eq('id', updatedBook.id);

      if (err1) {
        console.warn("Retrying Supabase update with standard schema:", err1);
        const { error: err2 } = await supabase.from('books').update(basePayload).eq('id', updatedBook.id);
        if (err2) {
          console.error("Supabase update error:", err2);
        } else {
          console.log("Book updated successfully in Supabase (standard schema)!");
        }
      } else {
        console.log("Book updated successfully in Supabase (full schema)!");
      }
    } catch (e) {
      console.error("Supabase update exception:", e);
    }

    try {
      await fetch(`/api/ebooks/${updatedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
      });
    } catch (e) {
      console.warn("Server update error:", e);
    }
  };

  const handleAddExternalBook = async (bookData: any) => {
    const authorName = bookData.authorName || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'د. كريم كامل';
    const newBook: MarketplaceBook = {
      id: crypto.randomUUID(),
      title: bookData.title,
      description: bookData.description,
      author_name: authorName,
      author_id: currentUser?.id,
      category: bookData.category,
      tags: bookData.tags,
      price: Number(bookData.price) || 0,
      is_external: true,
      external_url: bookData.externalUrl,
      preview_video_url: bookData.previewVideoUrl || undefined,
      is_published: true,
      thumbnail_url: bookData.thumbnailUrl,
      rating: 5.0,
      reviews_count: 1,
      chapters: []
    };
    setEbooks(prev => [newBook, ...prev]);
    try {
      const basePayload: any = {
        id: newBook.id,
        title: newBook.title,
        description: newBook.description,
        author_name: newBook.author_name,
        author_id: currentUser?.id || null,
        category: newBook.category,
        tags: newBook.tags,
        price: newBook.price,
        is_external: true,
        external_url: newBook.external_url,
        is_published: true,
        thumbnail_url: newBook.thumbnail_url,
        rating: 5.0,
        reviews_count: 1,
        chapters: []
      };

      const { error: err1 } = await supabase.from('books').upsert({
        ...basePayload,
        preview_video_url: newBook.preview_video_url || null
      });

      if (err1) {
        console.warn("Retrying external book upsert with standard schema:", err1);
        await supabase.from('books').upsert(basePayload);
      }
    } catch (e) {
      console.warn("Supabase external book insert error:", e);
    }
  };

  const handleConvert = async (payload: {
    promptText: string;
    fileUrl?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
    category?: any;
    track?: any;
    education_level?: string;
    academic_system?: string;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    price?: number;
    preview_video_url?: string;
    language?: string;
  }) => {
    setIsConverting(true);
    setProgressPercent(10);
    setProgressStep("بدء فحص وتحليل الملف...");
    try {
      const res = await fetch('/api/ebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userId: currentUser?.id,
          userRole: userRole,
          userEmail: currentUser?.email
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "فشل توليد الكتاب التفاعلي");
      }
      const data = await res.json();
      let generatedEbook: any = data.ebook || null;
      if (!generatedEbook && data.jobId) {
        while (!generatedEbook) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`/api/ebooks/tasks/${data.jobId}`);
          if (pollRes.ok) {
            const jobData = await pollRes.json();
            setProgressPercent(jobData.progressPercent);
            setProgressStep(jobData.progressStep);
            if (jobData.status === 'completed') {
              generatedEbook = jobData.result;
            } else if (jobData.status === 'failed') {
              throw new Error(jobData.error || "فشل التوليد");
            }
          }
        }
      }
      if (!generatedEbook) throw new Error("لم يتم إرجاع بيانات الكتاب.");

      // 🔍 Rich Search Engine Optimization (SEO) & Algorithmic Tag Discovery
      const seoKeywords: string[] = [
        'كتاب_تفاعلي',
        'مذكرة_شاملة',
        'ذكاء_اصطناعي',
        'بنك_أسئلة',
        'اختبارات_إلكترونية',
        'خرائط_مفاهيمية'
      ];

      if (payload.subcategory) {
        seoKeywords.push(payload.subcategory.replace(/\s+/g, '_'));
        seoKeywords.push(`مادة_${payload.subcategory.replace(/\s+/g, '_')}`);
      }
      if (payload.grade_level) {
        seoKeywords.push(payload.grade_level.replace(/\s+/g, '_'));
      }
      if (payload.academic_system) {
        seoKeywords.push(payload.academic_system.replace(/\s+/g, '_'));
      }
      if (payload.semester) {
        seoKeywords.push(payload.semester.replace(/\s+/g, '_'));
      }
      if (payload.education_level) {
        seoKeywords.push(payload.education_level === 'pre_university' ? 'تعليم_مدرسي' : 'تعليم_جامعي');
      }

      // Add taxonomy structured tags
      const structuredTaxonomyTags = [
        payload.education_level ? `edu_level:${payload.education_level}` : '',
        payload.academic_system ? `system:${payload.academic_system}` : '',
        payload.subcategory ? `sub:${payload.subcategory}` : '',
        payload.grade_level ? `grade:${payload.grade_level}` : '',
        payload.semester ? `term:${payload.semester}` : '',
        payload.academic_year ? `year:${payload.academic_year}` : '',
        payload.preview_video_url ? `video:${payload.preview_video_url}` : ''
      ].filter(Boolean);

      const combinedSeoTags = Array.from(new Set([...seoKeywords, ...structuredTaxonomyTags]));

      const isAutoPublished = isAdminMode || userRole === 'admin';
      const creatorAuthorName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'د. كريم كامل';
      
      const resolvedLanguage = payload.language || (
        payload.academic_system === 'general_arabic' || payload.academic_system === 'technical' ? 'ar' :
        payload.academic_system?.includes('international') || payload.academic_system === 'general_languages' ? 'en' : 'ar'
      );

      const isStemSubject = Boolean(
        payload.subcategory?.includes('رياض') ||
        payload.subcategory?.includes('علوم') ||
        payload.subcategory?.includes('كيمياء') ||
        payload.subcategory?.includes('فيزياء') ||
        payload.subcategory?.includes('أحياء') ||
        payload.subcategory?.includes('Math') ||
        payload.subcategory?.includes('Science') ||
        payload.subcategory?.includes('Physics') ||
        payload.subcategory?.includes('Chemistry')
      );

      const newBook: MarketplaceBook = {
        ...generatedEbook,
        author_name: creatorAuthorName,
        author_id: currentUser?.id,
        category: payload.category || 'academic_curriculum',
        track: payload.track || 'academic',
        education_level: payload.education_level || 'pre_university',
        academic_system: payload.academic_system || 'general_arabic',
        subcategory: payload.subcategory || '',
        grade_level: payload.grade_level || '',
        semester: payload.semester || '',
        academic_year: payload.academic_year || '',
        source_file_name: payload.fileName,
        tags: combinedSeoTags,
        price: Number(payload.price) || 0,
        preview_video_url: payload.preview_video_url,
        is_external: false,
        is_published: isAutoPublished,
        approval_status: isAutoPublished ? 'approved' : 'pending',
        thumbnail_url: generatedEbook.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviews_count: 1,
        created_at: new Date().toISOString()
      };

      setEbooks(prev => [newBook, ...prev]);

      try {
        // 🌟 Populate 100% of Supabase Books Table Columns
        const fullDbPayload: any = {
          id: newBook.id,
          title: newBook.title,
          description: newBook.description || '',
          author_name: newBook.author_name,
          author_id: currentUser?.id || null,
          category: newBook.category,
          tags: combinedSeoTags,
          price: newBook.price,
          is_external: false,
          external_url: newBook.external_url || null,
          is_published: isAutoPublished,
          approval_status: isAutoPublished ? 'approved' : 'pending',
          thumbnail_url: newBook.thumbnail_url,
          rating: 5.0,
          reviews_count: 1,
          chapters: newBook.chapters,
          mind_map: newBook.mind_map || [],
          question_bank: newBook.question_bank || [],
          education_level: newBook.education_level,
          academic_system: newBook.academic_system,
          subcategory: newBook.subcategory,
          grade_level: newBook.grade_level,
          semester: newBook.semester,
          academic_year: newBook.academic_year,
          language: resolvedLanguage,
          is_language_learning: Boolean(payload.subcategory?.includes('لغات') || payload.subcategory?.includes('English')),
          target_learning_language: resolvedLanguage !== 'ar' ? resolvedLanguage : null,
          is_stem_enhanced: isStemSubject,
          curriculum_explanation: newBook.curriculum_explanation || newBook.description || '',
          curriculum_mindmap: newBook.curriculum_mindmap || newBook.mind_map || [],
          exams: newBook.exams || [],
          pregeneration_status: 'completed',
          pregeneration_percent: 100,
          preview_video_url: newBook.preview_video_url || null
        };

        const { error: insertError } = await supabase.from('books').upsert(fullDbPayload);

        if (insertError) {
          console.warn("Supabase upsert notice:", insertError.message);
        } else {
          console.log("Book successfully confirmed in Supabase with all SEO and academic fields!");
        }
      } catch (dbErr) {
        console.error("Database save error:", dbErr);
      }

      setIsAiCreateModalOpen(false);
      navigate(`/book/${newBook.id}`);
    } catch (err: any) {
      console.error(err);
      alert(`عذراً، حدث خطأ أثناء التوليد: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('osera_auth_user');
    localStorage.removeItem('osera_auth_role');
    localStorage.removeItem('simplest_auth_user');
    localStorage.removeItem('simplest_auth_role');
    setCurrentUser(null);
    setUserRole('student');
    setIsAdminMode(false);
  };

  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Close mobile navigation drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white" dir={dir}>
      {/* 🌟 GLOBAL SAAS NAVBAR (Dynamic White-Label & Responsive Design) */}
      <header className="bg-white/95 border-b border-gray-200 sticky top-0 z-40 px-3 sm:px-6 py-3 backdrop-blur-md flex items-center justify-between print:hidden">
        
        {/* BRAND LOGO & TITLE */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group">
            {platformConfig.brandLogoUrl ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:scale-105 transition">
                <img 
                  src={platformConfig.brandLogoUrl} 
                  alt={platformConfig.brandName} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text logo if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-sky-500/25 text-white font-black text-lg sm:text-xl shrink-0 group-hover:scale-105 transition">
                {platformConfig.brandName ? platformConfig.brandName.charAt(0) : 'أ'}
              </div>
            )}

            <div className="text-start">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-lg text-slate-900 tracking-tight leading-none line-clamp-1 max-w-[140px] sm:max-w-[200px] md:max-w-none">
                  {platformConfig.brandName}
                </span>
                <span className="hidden sm:inline-flex text-[9px] sm:text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-md shrink-0">
                  AI LMS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold hidden xs:block line-clamp-1 max-w-[160px] sm:max-w-[240px] md:max-w-none mt-0.5">
                {platformConfig.brandSubtitle}
              </p>
            </div>
          </Link>
        </div>

        {/* 🌟 DESKTOP NAVIGATION LINKS (Exactly 3 clean core links: الرئيسية | المتجر | فيديوهات قصيرة) */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-xl transition ${
              isLandingPage
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            {t('nav.home', 'الرئيسية')}
          </Link>

          <Link
            to="/marketplace"
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              location.pathname === '/marketplace'
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('nav.marketplace', 'المتجر والمقررات')}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              location.pathname === '/marketplace' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {ebooks.length}
            </span>
          </Link>

          {/* REELS LINK */}
          {platformConfig.showReels && (
            <Link
              to="/reels"
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                location.pathname === '/reels'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>فيديوهات قصيرة 🎬</span>
            </Link>
          )}
        </nav>

        {/* 🌟 LEFT ACTION CONTROLS & AUTH (Cart + Profile + Menu) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* 🛒 MY BOOKS / CART ICON (Direct jump to enrolled & purchased materials) */}
          <Link
            to="/marketplace?tab=my_library"
            className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center justify-center cursor-pointer"
            title="مقرراتي المشترك بها والمشتريات"
          >
            <ShoppingCart className="w-5 h-5 text-slate-700" />
            {ebooks.filter(b => b.is_published).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
            )}
          </Link>

          {/* 🌐 INTERNATIONAL LANGUAGE SELECTOR */}
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {/* USER PROFILE OR LOGIN BUTTON (DESKTOP ONLY) */}
          {currentUser ? (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1.5 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                  {(currentUser.user_metadata?.full_name || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-800 block truncate max-w-[90px] leading-tight">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-teal-600 block leading-tight">
                    {userRole === 'admin' ? 'مسؤول 🛡️' : userRole === 'instructor' ? 'معلم 👨‍🏫' : 'طالب 🎓'}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* USER PROFILE DROPDOWN MENU */}
              {isUserMenuOpen && (
                <div
                  className="absolute top-full mt-2 left-0 w-64 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-right"
                  dir="rtl"
                >
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-1.5 space-y-1">
                    <div className="font-black text-xs text-slate-900 truncate">
                      {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                    <div className="pt-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200">
                        {userRole === 'admin' ? '🛡️ مسؤول النظام (Admin)' : userRole === 'instructor' ? '👨‍🏫 معلم معتمد (Instructor)' : '🎓 حساب طالب (Student)'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-bold text-slate-700">
                    {(userRole === 'instructor' || userRole === 'admin' || isAdminMode) && (
                      <>
                        <Link
                          to="/instructor"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition"
                        >
                          <Sparkles className="w-4 h-4 text-teal-600" />
                          <span>لوحة تحكم المعلم (Instructor Studio)</span>
                        </Link>

                        <Link
                          to={`/instructor/${encodeURIComponent(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'instructor')}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition"
                        >
                          <User className="w-4 h-4 text-indigo-600" />
                          <span>بروفايلي العام للطلاب (Public Profile)</span>
                        </Link>
                      </>
                    )}

                    {(userRole === 'admin' || isAdminMode) && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition"
                      >
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span>لوحة الإدارة والتحكم (Admin Hub)</span>
                      </Link>
                    )}

                    {(userRole === 'admin' || userRole === 'instructor' || isAdminMode) && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsAiCreateModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-teal-50 text-teal-700 rounded-xl transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>رفع وتوليد مقرر جديد بالـ AI 📤</span>
                      </button>
                    )}

                    {userRole === 'admin' && (
                      <button
                        onClick={() => {
                          setIsAdminMode(!isAdminMode);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 hover:bg-amber-50 text-amber-900 rounded-xl transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-amber-600" />
                          <span>التبديل إلى {isAdminMode ? 'وضع الطالب' : 'وضع المسؤول 🛡️'}</span>
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isAdminMode ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                          {isAdminMode ? 'نشط' : 'معطل'}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsSupportModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <span>مركز الشكاوى والدعم الفني</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden md:flex px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('nav.sign_in', 'تسجيل الدخول')}</span>
            </button>
          )}

          {/* 🍔 UNIFIED MOBILE MENU & PROFILE BUTTON (Single entry point on mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="القائمة الرئيسية"
            className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {currentUser && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                {(currentUser.user_metadata?.full_name || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-rose-600" />
            ) : (
              <Menu className="w-4 h-4 text-slate-800" />
            )}
          </button>
        </div>
      </header>

      {/* 📱 SLIDE-OVER MOBILE NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden" dir={dir}>
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className={`fixed inset-y-0 ${dir === 'rtl' ? 'right-0 border-l animate-slide-left' : 'left-0 border-r animate-slide-right'} max-w-xs w-full bg-white shadow-2xl border-slate-200 flex flex-col justify-between overflow-y-auto z-10`}>
            
            <div className="p-5 space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {platformConfig.brandLogoUrl ? (
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 overflow-hidden">
                      <img src={platformConfig.brandLogoUrl} alt={platformConfig.brandName} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
                      {platformConfig.brandName.charAt(0) || 'أ'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-sm text-slate-900 leading-tight">{platformConfig.brandName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold">{platformConfig.brandSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <LanguageSelector />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* USER STATUS CARD (Mobile) */}
              {currentUser ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center font-black text-xs">
                        {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 truncate max-w-[140px]">
                          {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {userRole === 'admin' ? '🛡️ مسؤول' : userRole === 'instructor' ? '👨‍🏫 معلم' : '🎓 طالب'}
                    </span>
                  </div>

                  {userRole === 'admin' && (
                    <button
                      onClick={() => setIsAdminMode(!isAdminMode)}
                      className={`w-full py-1.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isAdminMode
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{isAdminMode ? 'وضع المسؤول نشط 🛡️' : 'التحويل لوضع المسؤول'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-teal-400" />
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </button>
              )}

              {/* NAVIGATION LINKS LIST */}
              <div className="space-y-1 text-start">
                <p className="text-[10px] font-bold text-slate-400 px-3 pb-1">{t('nav.home', 'أقسام المنصة الرئيسية')}</p>
                
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition ${
                    isLandingPage ? 'bg-slate-900 text-white font-black' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-sky-500" />
                    <span>{t('nav.home', 'الصفحة الرئيسية')}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-60" />
                </Link>

                <Link
                  to="/marketplace"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition ${
                    location.pathname === '/marketplace' ? 'bg-sky-600 text-white font-black' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    <span>{t('nav.marketplace', 'متجر ومكتبة المقررات')}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    location.pathname === '/marketplace' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {ebooks.length}
                  </span>
                </Link>

                {platformConfig.showReels && (
                  <Link
                    to="/reels"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition ${
                      location.pathname === '/reels' ? 'bg-purple-600 text-white font-black' : 'text-slate-700 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>{t('nav.reels', '🎬 ريلز المعرفة والفيديوهات')}</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-60" />
                  </Link>
                )}

                {currentUser && (userRole === 'admin' || userRole === 'instructor' || isAdminMode) && (
                  <Link
                    to={userRole === 'admin' || isAdminMode ? '/admin' : '/instructor'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition ${
                      location.pathname === '/admin' || location.pathname === '/instructor' 
                        ? 'bg-indigo-600 text-white font-black' 
                        : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-amber-500" />
                      <span>{userRole === 'admin' || isAdminMode ? 'لوحة التحكم المركزية 🛡️' : 'لوحة المعلم والسنتر ⚡'}</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-60" />
                  </Link>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSupportModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-100 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-rose-600" />
                    <span>الشكاوى والدعم الفني 🎫</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-60" />
                </button>
              </div>
            </div>

            {/* Drawer Bottom Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
              {platformConfig.whatsappNumber && (
                <a
                  href={`https://wa.me/${platformConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>تواصل واتساب مع الدعم</span>
                </a>
              )}

              {currentUser && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400 font-medium">
                {platformConfig.copyrightText}
              </p>
            </div>

          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={
            <LandingPageView
              books={ebooks}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          } />
          <Route path="/marketplace" element={
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              <MarketplaceView
                books={ebooks}
                userRole={userRole}
                isAdminMode={isAdminMode}
                purchasedBookIds={purchasedBookIds}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLaunchBook={handleLaunchBook}
                onLaunchQuiz={handleLaunchQuiz}
                onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                onOpenExternalModal={() => setIsExternalModalOpen(true)}
                onTogglePublish={handleTogglePublish}
                onDeleteBook={handleDeleteBook}
                onUpdateBook={handleUpdateBook}
                onPurchaseBook={handlePurchaseBook}
              />
            </div>
          } />
          <Route path="/admin" element={
            !currentUser ? (
              <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
                <Shield className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">هذه المنطقة مخصصة لإدارة المنصة</h3>
                <p className="text-xs text-slate-500">يرجى تسجيل الدخول بحساب المسؤول العام للوصول إلى لوحة التحكم المركزية.</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  تسجيل الدخول الآن 🔑
                </button>
              </div>
            ) : (userRole === 'instructor' && !isAdminMode) ? (
              <Navigate to="/instructor" replace />
            ) : (userRole !== 'admin' && !isAdminMode) ? (
              <Navigate to="/marketplace" replace />
            ) : (
              <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
                <AdminInstructorHub
                  books={ebooks}
                  userRole={userRole}
                  isAdminMode={isAdminMode}
                  currentUser={currentUser}
                  onBackToMarketplace={() => navigate('/marketplace')}
                  onLaunchBook={(id) => navigate(`/book/${id}`)}
                  onTogglePublish={handleTogglePublish}
                  onDeleteBook={handleDeleteBook}
                  onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                  onOpenExternalModal={() => setIsExternalModalOpen(true)}
                />
              </div>
            )
          } />
          <Route path="/instructor" element={
            !currentUser ? (
              <div className="p-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
                <Shield className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">هذه المنطقة مخصصة للمعلمين</h3>
                <p className="text-xs text-slate-500">يرجى تسجيل الدخول بحساب المعلم للوصول إلى استوديو المعلم وإصدار الكروت.</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  تسجيل الدخول كمعلم 👨‍🏫
                </button>
              </div>
            ) : (userRole === 'student' && !isAdminMode) ? (
              <div className="p-12 text-center bg-white border border-rose-100 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
                <Shield className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-xl font-black text-slate-900">عفواً، هذه اللوحة مخصصة للمعلمين فقط</h3>
                <p className="text-xs text-slate-500">حسابك مسجل كطالب. لوحة المعلم مخصصة للمدرسين لنشر المقررات التعليمية وإدارة كروت السنتر.</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  تصفح ومتابعة المقررات 📚
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
                <AdminInstructorHub
                  books={ebooks}
                  userRole={userRole}
                  isAdminMode={isAdminMode}
                  currentUser={currentUser}
                  onBackToMarketplace={() => navigate('/marketplace')}
                  onLaunchBook={(id) => navigate(`/book/${id}`)}
                  onTogglePublish={handleTogglePublish}
                  onDeleteBook={handleDeleteBook}
                  onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                  onOpenExternalModal={() => setIsExternalModalOpen(true)}
                />
              </div>
            )
          } />
          <Route path="/instructor/:id" element={
            <InstructorProfileRoute 
              books={ebooks} 
              currentUser={currentUser}
              userRole={userRole}
              isAdminMode={isAdminMode}
              onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
            />
          } />
          <Route path="/book/:id" element={
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              <BookDetailsRoute
                books={ebooks}
                setEbooks={setEbooks}
                hasGeminiKey={hasGeminiKey}
                purchasedBookIds={purchasedBookIds}
                onPurchaseBook={handlePurchaseBook}
                userRole={userRole}
                isAdminMode={isAdminMode}
                currentUser={currentUser}
              />
            </div>
          } />
          <Route path="/faq" element={<FaqPageView />} />
          <Route path="/about" element={<AboutPageView />} />
          <Route path="/category/:categorySlug" element={
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
              <MarketplaceView
                books={ebooks}
                userRole={userRole}
                isAdminMode={isAdminMode}
                purchasedBookIds={purchasedBookIds}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLaunchBook={handleLaunchBook}
                onLaunchQuiz={handleLaunchQuiz}
                onOpenCreateModal={() => setIsAiCreateModalOpen(true)}
                onOpenExternalModal={() => setIsExternalModalOpen(true)}
                onTogglePublish={handleTogglePublish}
                onDeleteBook={handleDeleteBook}
                onUpdateBook={handleUpdateBook}
                onPurchaseBook={handlePurchaseBook}
              />
            </div>
          } />
          <Route path="/reels" element={
            <EduReelsFeedView
              currentUser={currentUser}
              onBack={() => navigate(-1)}
              onOpenBook={(bookId, chapterId) => navigate(`/book/${bookId}`)}
            />
          } />
          <Route path="/book/:bookId/reels" element={
            <EduReelsFeedView
              currentUser={currentUser}
              onBack={() => navigate(-1)}
              onOpenBook={(bookId, chapterId) => navigate(`/book/${bookId}`)}
            />
          } />
        </Routes>
      </main>

      {/* 🌟 DYNAMIC SAAS PLATFORM FOOTER */}
      {!location.pathname.startsWith('/reels') && !location.pathname.includes('/reels') && (
        <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 print:hidden" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-black text-sm">
                {platformConfig.brandName.charAt(0) || 'أ'}
              </div>
              <div>
                <p className="font-black text-white text-sm">{platformConfig.brandName}</p>
                <p className="text-[11px] text-slate-500">{platformConfig.brandSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-bold">
              <Link to="/marketplace" className="text-slate-400 hover:text-teal-400 transition">
                المتجر والمقررات
              </Link>
              <Link to="/reels" className="text-slate-400 hover:text-teal-400 transition">
                الريلز التعليمية
              </Link>
              <Link to="/faq" className="text-slate-400 hover:text-teal-400 transition">
                الأسئلة الشائعة
              </Link>
              <Link to="/about" className="text-slate-400 hover:text-teal-400 transition">
                عن المنصة
              </Link>
            </div>

            <div className="text-center md:text-right text-[11px] text-slate-500 space-y-1">
              <p>{platformConfig.copyrightText || `جميع الحقوق محفوظة © ${new Date().getFullYear()} لشركة ${platformConfig.companyName}`}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              {platformConfig.supportEmail && (
                <a href={`mailto:${platformConfig.supportEmail}`} className="text-slate-400 hover:text-teal-400 transition">
                  الدعم الفني
                </a>
              )}
              {platformConfig.whatsappNumber && (
                <a 
                  href={`https://wa.me/${platformConfig.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-emerald-400 transition"
                >
                  واتساب
                </a>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user, role) => {
          setCurrentUser(user);
          setUserRole(role);
          if (role === 'admin') setIsAdminMode(true);
        }}
      />

      <AddExternalBookModal
        isOpen={isExternalModalOpen}
        onClose={() => setIsExternalModalOpen(false)}
        onAddBook={handleAddExternalBook}
      />

      {isAiCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto" dir="rtl">
          <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative my-auto custom-scrollbar">
            <button
              onClick={() => setIsAiCreateModalOpen(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition z-10"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
            <ContentUploader
              currentUser={currentUser}
              userRole={userRole}
              onConvert={handleConvert}
              isConverting={isConverting}
              progressPercent={progressPercent}
              progressStep={progressStep}
            />
          </div>
        </div>
      )}

      {/* 🎫 SUPPORT & COMPLAINTS MODAL */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        currentUser={currentUser}
        userRole={userRole}
      />

      {/* 🔔 GLOBAL MODERN TOAST NOTIFICATIONS */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
