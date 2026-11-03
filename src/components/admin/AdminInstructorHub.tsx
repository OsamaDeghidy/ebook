import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, TrendingUp, Award, Printer, Ticket, Sparkles, 
  BarChart3, CheckCircle2, Download, Copy, RefreshCw, FileText, ArrowLeft, Shield, Clock, Flame, 
  Eye, EyeOff, Edit, Trash2, Plus, Lock, Check, Layers, AlertCircle, HelpCircle, Search, Filter,
  Calendar, CreditCard, ChevronDown, CheckSquare, Zap, Smartphone, QrCode, CheckCheck, Wallet,
  RotateCcw, Send, CheckCircle, XCircle, Info, DollarSign, ArrowUpRight, ArrowDownLeft, ShieldCheck,
  Building2, MessageSquare, Play, Film, Video, Sliders, Globe, AlertTriangle, Radio, Mic, MessageCircle
} from 'lucide-react';
import { MarketplaceBook, UserRole, EduReel, EduReelStyle, InstructorCockpitAnalytics, TeacherTicket, InstructorWallet } from '../../types';
import MathRenderer from '../MathRenderer';
import { supabase } from '../../lib/supabase';
import { EduReelPlayer } from '../reels/EduReelPlayer';
import { PlatformSettingsTab } from './PlatformSettingsTab';
import { UsersManagementTab } from './UsersManagementTab';
import { SupportTicketsTab } from './SupportTicketsTab';
import { exportReelToVideo, downloadReelBlob } from '../../utils/reelVideoExporter';

interface AdminInstructorHubProps {
  books: MarketplaceBook[];
  userRole?: UserRole;
  isAdminMode?: boolean;
  currentUser?: any;
  onBackToMarketplace: () => void;
  onLaunchBook?: (id: string) => void;
  onTogglePublish?: (id: string) => void;
  onDeleteBook?: (id: string) => void;
  onOpenCreateModal?: () => void;
  onOpenExternalModal?: () => void;
}

export const AdminInstructorHub: React.FC<AdminInstructorHubProps> = ({
  books: initialBooks,
  userRole = 'admin',
  isAdminMode = true,
  currentUser,
  onBackToMarketplace,
  onLaunchBook,
  onTogglePublish,
  onDeleteBook,
  onOpenCreateModal,
  onOpenExternalModal
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'learning_radar' | 'teacher_sos' | 'users' | 'support' | 'exams' | 'vouchers' | 'approvals' | 'wallet' | 'reels' | 'settings'>('analytics');
  const [booksList, setBooksList] = useState<MarketplaceBook[]>(initialBooks);

  // ==========================================
  // 🎯 COCKPIT ANALYTICS & LEARNING RADAR STATE
  // ==========================================
  const [cockpitData, setCockpitData] = useState<InstructorCockpitAnalytics | null>(null);
  const [isLoadingCockpit, setIsLoadingCockpit] = useState(false);

  // ==========================================
  // 🙋‍♂️ TEACHER SOS HELPDESK TICKETS STATE
  // ==========================================
  const [sosTickets, setSosTickets] = useState<TeacherTicket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'answered'>('pending');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyAudioMap, setReplyAudioMap] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});

  // ==========================================
  // 💰 HARDENED INSTRUCTOR WALLET & PAYOUTS STATE
  // ==========================================
  const [instructorWallet, setInstructorWallet] = useState<InstructorWallet | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(500);
  const [payoutMethod, setPayoutMethod] = useState<'vodafone_cash' | 'instapay' | 'bank_transfer'>('vodafone_cash');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);


  useEffect(() => {
    setBooksList(initialBooks);
  }, [initialBooks]);

  // Determine effective access level
  const isAdmin = userRole === 'admin' || isAdminMode;
  const currentAuthorName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || '';

  // Filter books: Admin sees all books; Instructor sees only their books
  const visibleBooks = useMemo(() => {
    if (isAdmin) return booksList;
    return booksList.filter(b => {
      if (currentUser?.id && b.author_id === currentUser.id) return true;
      if (currentUser?.email && (b as any).author_email === currentUser.email) return true;
      if (currentAuthorName && b.author_name && b.author_name.toLowerCase().includes(currentAuthorName.toLowerCase())) return true;
      return false;
    });
  }, [booksList, isAdmin, currentAuthorName, currentUser]);

  // ==========================================
  // 📊 LIVE REAL DATABASE ANALYTICS (0% FAKE DATA)
  // ==========================================
  const [dbPurchases, setDbPurchases] = useState<any[]>([]);
  const [dbQuizAttempts, setDbQuizAttempts] = useState<any[]>([]);
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Load real data from Supabase & Backend
  const reloadWalletAndData = async () => {
    setIsLoadingDb(true);
    try {
      const { data: purchases } = await supabase.from('purchases').select('*');
      if (purchases) setDbPurchases(purchases);

      const { data: quizzes } = await supabase.from('quiz_attempts').select('*');
      if (quizzes) setDbQuizAttempts(quizzes);

      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) setDbProfiles(profiles);

      // Load Wallet
      if (currentUser?.id) {
        const res = await fetch(`/api/wallet/balance/${currentUser.id}`);
        if (res.ok) {
          const wData = await res.json();
          setWalletBalance(wData.balance || 0);
          setWalletTransactions(wData.transactions || []);
        }
      }
    } catch (err) {
      console.warn('Real database load notice:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    reloadWalletAndData();
    loadCockpitAndTickets();
  }, [currentUser]);

  const loadCockpitAndTickets = async () => {
    try {
      setIsLoadingCockpit(true);
      const instructorId = currentUser?.id || 'inst-1';
      const [resCockpit, resTickets, resWallet] = await Promise.all([
        fetch(`/api/instructor/analytics?instructorId=${encodeURIComponent(instructorId)}`),
        fetch(`/api/helpdesk/tickets?instructorId=${encodeURIComponent(instructorId)}`),
        fetch(`/api/instructor/wallet?instructorId=${encodeURIComponent(instructorId)}`)
      ]);

      if (resCockpit.ok) {
        const cData = await resCockpit.json();
        setCockpitData(cData);
      }
      if (resTickets.ok) {
        const tData = await resTickets.json();
        setSosTickets(tData.tickets || []);
      }
      if (resWallet.ok) {
        const wData = await resWallet.json();
        setInstructorWallet(wData);
      }
    } catch (e) {
      console.warn('Error loading cockpit/tickets:', e);
    } finally {
      setIsLoadingCockpit(false);
    }
  };

  const handleSendTicketReply = async (ticketId: string) => {
    const text = (replyTextMap[ticketId] || '').trim();
    const audio = (replyAudioMap[ticketId] || '').trim();
    if (!text && !audio) {
      alert('يرجى كتابة نص الإجابة أو رابط الملاحظة الصوتية');
      return;
    }
    setIsSubmittingReply(prev => ({ ...prev, [ticketId]: true }));
    try {
      const res = await fetch('/api/helpdesk/reply-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          teacherAnswer: text,
          teacherAudioUrl: audio || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSosTickets(prev => prev.map(t => t.id === ticketId ? data.ticket : t));
        setStatusMsg('تم إرسال الرد النموذجي للطالب بنجاح! 🎉');
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert('حدث خطأ أثناء إرسال الرد');
      }
    } catch (e) {
      alert('تعذر الاتصال بالخادم لإرسال الرد');
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAccount.trim()) {
      alert('يرجى إدخال رقم المحفظة أو الحساب');
      return;
    }
    const available = instructorWallet?.availableBalance || walletBalance || 0;
    if (payoutAmount > available) {
      alert(`الرصيد المتاح للسحب هو ${available} ج.م فقط`);
      return;
    }
    setIsRequestingPayout(true);
    try {
      const res = await fetch('/api/instructor/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser?.id || 'inst-1',
          amount: payoutAmount,
          method: payoutMethod,
          accountDetails: payoutAccount
        })
      });
      if (res.ok) {
        setStatusMsg('تم تقديم طلب السحب بنجاح بنسبة استحقاق 85% وسيتم التحويل خلال دقائق! 🚀');
        setTimeout(() => setStatusMsg(null), 5000);
        loadCockpitAndTickets();
      } else {
        const err = await res.json();
        alert(err.error || 'فشل تقديم طلب السحب');
      }
    } catch (e) {
      alert('تعذر تقديم طلب السحب');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  // ==========================================
  // 🖨️ SCALABLE CUSTOM EXAM BUILDER STATE
  // ==========================================
  const [selectedBookId, setSelectedBookId] = useState<string>(visibleBooks[0]?.id || '');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [examTitle, setExamTitle] = useState('امتحان التقييم والمراجعة الشاملة');
  const [centerName, setCenterName] = useState('سنتر التميز الأكاديمي');
  const [teacherName, setTeacherName] = useState(currentAuthorName || 'د. كريم كامل');
  const [examDuration, setExamDuration] = useState('60 دقيقة');
  const [mcqCount, setMcqCount] = useState<number>(20);
  const [essayCount, setEssayCount] = useState<number>(4);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<{ mcq: any[]; essay: any[] } | null>(null);

  const currentTargetBook = useMemo(() => {
    return visibleBooks.find(b => b.id === selectedBookId) || visibleBooks[0];
  }, [visibleBooks, selectedBookId]);

  useEffect(() => {
    if (visibleBooks.length > 0 && (!selectedBookId || !visibleBooks.some(b => b.id === selectedBookId))) {
      setSelectedBookId(visibleBooks[0].id);
    }
  }, [visibleBooks, selectedBookId]);

  useEffect(() => {
    if (currentTargetBook && currentTargetBook.chapters) {
      setSelectedChapterIds(currentTargetBook.chapters.map((c: any) => c.id));
    }
  }, [selectedBookId, currentTargetBook]);

  // ==========================================
  // 🎟️ VOUCHER FACTORY & COMMISSION CALCULATION
  // ==========================================
  const [voucherType, setVoucherType] = useState<'book_access' | 'wallet_credit'>('book_access');
  const [voucherCount, setVoucherCount] = useState(8);
  const [voucherBookId, setVoucherBookId] = useState<string>('');
  const [voucherPrice, setVoucherPrice] = useState(150);
  const [generatedVouchers, setGeneratedVouchers] = useState<any[]>([]);
  const [isGeneratingVouchers, setIsGeneratingVouchers] = useState(false);
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'active' | 'used' | 'cancelled'>('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isPrintSheetMode, setIsPrintSheetMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Commission dynamic calculation
  const commissionRate = voucherCount >= 100 ? 5 : (voucherCount >= 50 ? 7 : 10);
  const totalCommissionAmount = Math.round((voucherPrice * (commissionRate / 100) * voucherCount) * 10) / 10;

  // Load vouchers from backend / Supabase
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const queryParam = isAdmin ? '' : `?createdBy=${encodeURIComponent(currentAuthorName)}`;
        const res = await fetch(`/api/vouchers${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.vouchers) setGeneratedVouchers(data.vouchers);
        } else {
          const { data } = await supabase.from('vouchers').select('*');
          if (data) setGeneratedVouchers(data);
        }
      } catch (e) {
        try {
          const { data } = await supabase.from('vouchers').select('*');
          if (data) setGeneratedVouchers(data);
        } catch (dbE) {}
      }
    };
    fetchVouchers();
  }, [isAdmin, currentAuthorName]);

  // ==========================================
  // 🛡️ COURSE APPROVAL & MODERATION STATE
  // ==========================================
  const [rejectionModalBookId, setRejectionModalBookId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editRequestModalBookId, setEditRequestModalBookId] = useState<string | null>(null);
  const [editRequestNotes, setEditRequestNotes] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'edit_requested'>('all');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const pendingApprovalsCount = useMemo(() => {
    return booksList.filter(b => b.approval_status === 'pending_approval' || b.approval_status === 'edit_requested').length;
  }, [booksList]);

  const filteredApprovalBooks = useMemo(() => {
    return visibleBooks.filter(b => {
      if (approvalFilter === 'all') return true;
      if (approvalFilter === 'pending') return b.approval_status === 'pending_approval';
      if (approvalFilter === 'approved') return b.approval_status === 'approved' || (!b.approval_status && b.is_published);
      if (approvalFilter === 'rejected') return b.approval_status === 'rejected';
      if (approvalFilter === 'edit_requested') return b.approval_status === 'edit_requested';
      return true;
    });
  }, [visibleBooks, approvalFilter]);

  const handleApproveBook = async (bookId: string) => {
    setIsProcessingApproval(true);
    try {
      const res = await fetch(`/api/books/${bookId}/approve`, { method: 'POST' });
      if (res.ok) {
        setBooksList(prev => prev.map(b => b.id === bookId ? { ...b, approval_status: 'approved', is_published: true } : b));
        setStatusMsg('تم اعتماد ونشر المقرر بنجاح للطلاب! 🎉');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      alert('حدث خطأ أثناء اعتماد المقرر');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalBookId) return;

    setIsProcessingApproval(true);
    try {
      const res = await fetch(`/api/books/${rejectionModalBookId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.ok) {
        setBooksList(prev => prev.map(b => b.id === rejectionModalBookId ? { ...b, approval_status: 'rejected', admin_rejection_reason: rejectionReason } : b));
        setStatusMsg('تم رفض المقرر مع إرسال الملاحظات للمعلم.');
        setRejectionModalBookId(null);
        setRejectionReason('');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      alert('حدث خطأ أثناء معالجة الرفض');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleSubmitForApproval = async (bookId: string) => {
    setIsProcessingApproval(true);
    try {
      const res = await fetch(`/api/books/${bookId}/submit-approval`, { method: 'POST' });
      if (res.ok) {
        setBooksList(prev => prev.map(b => b.id === bookId ? { ...b, approval_status: 'pending_approval' } : b));
        setStatusMsg('تم إرسال المقرر لإدارة المنصة للمراجعة والاعتماد ✓');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      alert('حدث خطأ أثناء إرسال طلب الاعتماد');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRequestEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRequestModalBookId) return;

    setIsProcessingApproval(true);
    try {
      const res = await fetch(`/api/books/${editRequestModalBookId}/request-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editRequestNotes })
      });
      if (res.ok) {
        setBooksList(prev => prev.map(b => b.id === editRequestModalBookId ? { ...b, approval_status: 'edit_requested', edit_request_notes: editRequestNotes } : b));
        setStatusMsg('تم إرسال طلب التعديل للأدمن بنجاح 📝');
        setEditRequestModalBookId(null);
        setEditRequestNotes('');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      alert('حدث خطأ أثناء إرسال طلب التعديل');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // ==========================================
  // 💳 WALLET RECHARGE, WITHDRAWAL & ADMIN CREDIT STATES
  // ==========================================
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [rechargeGateway, setRechargeGateway] = useState<'vodafone_cash'>('vodafone_cash');
  const [isProcessingRecharge, setIsProcessingRecharge] = useState(false);

  // 💸 WITHDRAWAL REQUEST STATES
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(100);
  const [withdrawMethod, setWithdrawMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Withdrawals list & Admin credit states
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [adminTargetEmail, setAdminTargetEmail] = useState('');
  const [adminCreditAmount, setAdminCreditAmount] = useState(100);
  const [adminCreditType, setAdminCreditType] = useState<'credit' | 'debit'>('credit');
  const [adminCreditReason, setAdminCreditReason] = useState('مكافأة تميز / تسوية رصيد');
  const [isAdjustingCredit, setIsAdjustingCredit] = useState(false);

  const loadWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const queryParam = isAdmin ? '?role=admin' : `?userId=${currentUser?.id}&role=instructor`;
      const res = await fetch(`/api/withdrawals/list${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.withdrawals) setWithdrawalsList(data.withdrawals);
      }
    } catch (e) {
      console.warn('Withdrawals load notice:', e);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      loadWithdrawals();
    }
  }, [activeTab, currentUser, isAdmin]);

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    const walletNumber = prompt('أدخل رقم محفظة الكاش للدفع (فودافون / أورنج / اتصالات / وي كاش):', '01000000000');
    if (!walletNumber || !walletNumber.trim()) return;

    setIsProcessingRecharge(true);
    try {
      const paymobRes = await fetch('/api/payment/paymob/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rechargeAmount,
          method: 'wallet',
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.user_metadata?.full_name || 'معلم المنصة',
          walletMobileNumber: walletNumber.trim()
        })
      });

      const paymobData = await paymobRes.json();
      if (paymobRes.ok && paymobData.redirectUrl) {
        window.location.href = paymobData.redirectUrl;
        return;
      }

      if (paymobRes.ok && paymobData.message) {
        alert(paymobData.message);
        setIsRechargeModalOpen(false);
      } else {
        alert(paymobData.error || paymobData.message || 'تعذر بدء جلسة الدفع عبر المحفظة. يرجى المحاولة لاحقاً.');
      }
    } catch (err) {
      alert('حدث خطأ أثناء معالجة الشحن');
    } finally {
      setIsProcessingRecharge(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!payoutDetails.trim()) {
      alert('يرجى كتابة تفاصيل الحساب أو رقم المحفظة');
      return;
    }

    setIsProcessingWithdraw(true);
    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: withdrawAmount,
          payoutMethod: withdrawMethod,
          payoutDetails: payoutDetails.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        setIsWithdrawModalOpen(false);
        setPayoutDetails('');
        await reloadWalletAndData();
        await loadWithdrawals();
        setTimeout(() => setStatusMsg(null), 5000);
      } else {
        alert(data.message || 'فشل معالجة طلب السحب');
      }
    } catch (err) {
      alert('حدث خطأ أثناء إرسال طلب السحب');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    const ref = prompt('أدخل رقم مرجع أو إيصال التحويل (اختياري):', `TX-${Date.now().toString().slice(-6)}`);
    if (ref === null) return;

    // Optimistically update local state immediately so buttons disappear right away
    setWithdrawalsList(prev => prev.map(w => w.id === withdrawalId ? { 
      ...w, 
      status: 'completed', 
      reference_number: ref, 
      processed_at: new Date().toISOString() 
    } : w));

    try {
      const res = await fetch('/api/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          referenceNumber: ref,
          note: 'تم التحويل واعتماد السحب بواسطة إدارة المنصة'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message || 'تم اعتماد وتحويل المبلغ بنجاح! ✓');
        await loadWithdrawals();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشل اعتماد السحب');
        await loadWithdrawals();
      }
    } catch (e) {
      alert('حدث خطأ أثناء الاعتماد');
      await loadWithdrawals();
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    const reason = prompt('أدخل سبب رفض طلب السحب (سيتم إرجاع الرصيد للمعلم):', 'بيانات المحفظة أو الحساب غير صحيحة');
    if (!reason) return;

    // Optimistically update local state immediately so buttons disappear right away
    setWithdrawalsList(prev => prev.map(w => w.id === withdrawalId ? { 
      ...w, 
      status: 'rejected', 
      admin_notes: reason, 
      processed_at: new Date().toISOString() 
    } : w));

    try {
      const res = await fetch('/api/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          rejectReason: reason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message || 'تم رفض الطلب وإرجاع الرصيد للمعلم.');
        await loadWithdrawals();
        await reloadWalletAndData();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشل رفض الطلب');
        await loadWithdrawals();
      }
    } catch (e) {
      alert('حدث خطأ أثناء معالجة الرفض');
      await loadWithdrawals();
    }
  };

  const handleAdjustCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTargetEmail.trim()) {
      alert('يرجى إدخال البريد الإلكتروني للمستخدم');
      return;
    }

    setIsAdjustingCredit(true);
    try {
      const res = await fetch('/api/admin/wallet/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: adminTargetEmail.trim(),
          amount: adminCreditAmount,
          type: adminCreditType,
          reason: adminCreditReason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        setAdminTargetEmail('');
        await reloadWalletAndData();
        setTimeout(() => setStatusMsg(null), 5000);
      } else {
        alert(data.message || 'فشل تعديل الرصيد');
      }
    } catch (e) {
      alert('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setIsAdjustingCredit(false);
    }
  };

  // ==========================================
  // 🎬 REELS STUDIO & INTERACTIVE TIKTOK ENGINE
  // ==========================================
  const [reelsBookId, setReelsBookId] = useState<string>(visibleBooks[0]?.id || '');
  const [allReels, setAllReels] = useState<EduReel[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState<boolean>(false);
  const [isGeneratingAllReels, setIsGeneratingAllReels] = useState<boolean>(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [chapterStyles, setChapterStyles] = useState<Record<string, EduReelStyle>>({});
  const [chapterVoices, setChapterVoices] = useState<Record<string, string>>({});
  const [reelsVoice, setReelsVoice] = useState<string>('ar-XA-Chirp3-HD-Fenrir');
  const [reelsGlobalStyle, setReelsGlobalStyle] = useState<EduReelStyle>('chalkboard');
  const [previewReel, setPreviewReel] = useState<EduReel | null>(null);
  const [exportingReelId, setExportingReelId] = useState<string | null>(null);

  useEffect(() => {
    if (visibleBooks.length > 0 && (!reelsBookId || !visibleBooks.some(b => b.id === reelsBookId))) {
      setReelsBookId(visibleBooks[0].id);
    }
  }, [visibleBooks, reelsBookId]);

  const loadAllReels = async () => {
    setIsLoadingReels(true);
    try {
      const res = await fetch('/api/reels/feed');
      if (res.ok) {
        const data = await res.json();
        if (data.reels) setAllReels(data.reels);
      }
    } catch (e) {
      console.warn('Failed to load reels list:', e);
    } finally {
      setIsLoadingReels(false);
    }
  };

  useEffect(() => {
    loadAllReels();
  }, []);

  const selectedReelsBook = useMemo(() => {
    return visibleBooks.find(b => b.id === reelsBookId) || visibleBooks[0];
  }, [visibleBooks, reelsBookId]);

  const bookReels = useMemo(() => {
    return allReels.filter(r => r.book_id === reelsBookId);
  }, [allReels, reelsBookId]);

  const handleGenerateAllReelsForBook = async () => {
    if (!reelsBookId || !selectedReelsBook) return;
    setIsGeneratingAllReels(true);
    try {
      const res = await fetch('/api/reels/generate-for-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: reelsBookId,
          customStyle: reelsGlobalStyle,
          voice: reelsVoice,
          forceRegenerate: true,
          chapters: selectedReelsBook.chapters
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message || `تم توليد وتحديث ريلز كافة فصول المقرر (${data.generatedCount || 0} ريل) بنجاح! 🎬✨`);
        await loadAllReels();
        setTimeout(() => setStatusMsg(null), 5000);
      } else {
        alert(data.message || 'فشل توليد الريلز للمقرر');
      }
    } catch (e) {
      alert('حدث خطأ أثناء الاتصال بمحرك توليد الريلز');
    } finally {
      setIsGeneratingAllReels(false);
    }
  };

  const handleGenerateSingleChapterReel = async (chapter: any) => {
    if (!reelsBookId) return;
    setGeneratingChapterId(chapter.id);
    const style = chapterStyles[chapter.id] || reelsGlobalStyle;
    const voice = chapterVoices[chapter.id] || reelsVoice;
    try {
      const res = await fetch('/api/reels/generate-single-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: reelsBookId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          style: style,
          voice: voice
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`تم توليد ريل فصل "${chapter.title}" بنجاح! 🚀`);
        await loadAllReels();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشل توليد الريل');
      }
    } catch (e) {
      alert('حدث خطأ أثناء التوليد');
    } finally {
      setGeneratingChapterId(null);
    }
  };

  const handleDeleteReel = async (reelId: string, chapterTitle?: string) => {
    if (!confirm(`هل أنت متأكد من حذف ريل (${chapterTitle || 'الفصل'})؟ يمكنك إعادة توليده لاحقاً.`)) return;
    try {
      const res = await fetch(`/api/reels/${reelId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg('تم حذف الريل بنجاح 🗑️');
        setAllReels(prev => prev.filter(r => r.id !== reelId));
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشل حذف الريل');
      }
    } catch (e) {
      alert('حدث خطأ أثناء حذف الريل');
    }
  };

  const handleDownloadReelVideo = async (reel: EduReel, chapterTitle?: string) => {
    if (exportingReelId) return;
    setExportingReelId(reel.id);
    setStatusMsg(`جاري تصيير وتوليد فيديو ريل "${chapterTitle || 'الفصل'}" بدقة 1080p عمودية... 🎬`);

    try {
      const style = chapterStyles[reel.chapter_id] || reel.style_type || reel.style || 'chalkboard';
      const blob = await exportReelToVideo(reel, style, (percent, status) => {
        setStatusMsg(`${status} (${percent}%)`);
      });

      const cleanBook = (reel.book_title || 'مقرر').replace(/[\\/:*?"<>|]/g, '_');
      const cleanChapter = (chapterTitle || reel.chapter_title || 'فصل').replace(/[\\/:*?"<>|]/g, '_');
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `${cleanBook}_${cleanChapter}_Reel.${ext}`;

      downloadReelBlob(blob, fileName);
      setStatusMsg(`تم تنزيل فيديو ريل "${cleanChapter}" بنجاح! 🎉`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Reel video export error:', err);
      alert('حدث خطأ أثناء تصيير الفيديو: ' + (err.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setExportingReelId(null);
    }
  };

  // ==========================================
  // ⚡ GENERATE SCALABLE EXAM (10 to 100 questions)
  // ==========================================
  const handleGenerateCustomExam = async () => {
    setIsGeneratingExam(true);
    try {
      const res = await fetch('/api/exams/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBookId,
          chapterIds: selectedChapterIds,
          mcqCount,
          essayCount,
          examTitle,
          teacherName,
          centerName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedExam({
          mcq: data.mcq || [],
          essay: data.essay || []
        });
        return;
      }

      // Local synthesis fallback
      const targetBook = currentTargetBook;
      const qBank = targetBook?.question_bank || [];
      const mcqs: any[] = [];
      const essays: any[] = [];

      for (let i = 0; i < mcqCount; i++) {
        const base = qBank[i % Math.max(1, qBank.length)] || {
          question: `سؤال تطبيقي هام على درس (${targetBook?.chapters?.[i % (targetBook.chapters.length || 1)]?.title || 'المقرر'})`,
          options: ['الاختيار الصحيح والمعتمد (أ)', 'الاحتمال الثاني (ب)', 'التطبيق النظري (ج)', 'كافة ما سبق صحيح (د)'],
          correctOptionIndex: 0
        };
        mcqs.push({
          ...base,
          id: `mcq-${i + 1}`,
          question: i < qBank.length ? base.question : `${base.question} [نموذج ${i + 1}]`
        });
      }

      for (let i = 0; i < essayCount; i++) {
        essays.push({
          id: `essay-${i + 1}`,
          question: `سؤال مقالي تحليلي: اشرح أثر التطبيقات العملية ومسار الاستنتاج العلمي لدرس (${targetBook?.chapters?.[i % (targetBook.chapters.length || 1)]?.title || 'المقرر'}).`,
          modelAnswer: `نموذج الإجابة: يوضح الطالب المفهوم الأساسي والقانون مع خطوات الحل الرياضي بدقة.`
        });
      }

      setGeneratedExam({ mcq: mcqs, essay: essays });
    } catch (e) {
      console.warn('Exam generation fallback:', e);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // ⚡ GENERATE BATCH VOUCHERS WITH COMMISSION & PRE-PAYMENT
  // ==========================================
  const handleGenerateVouchers = async () => {
    const totalCardsValue = voucherCount * voucherPrice;
    const standardCommissionRate = 15;
    const totalCommission = Math.round(totalCardsValue * (standardCommissionRate / 100));

    // Check wallet balance for instructors before requesting
    if (!isAdmin && walletBalance < totalCommission) {
      alert(`عفواً، رصيد محفظتك الحالي (${walletBalance} ج.م) لا يكفي لسداد عمولة إصدار الكروت (${totalCommission} ج.م بنسبة ${standardCommissionRate}%). يرجى شحن محفظتك أولاً لإتمام الإصدار.`);
      setIsRechargeModalOpen(true);
      return;
    }

    setIsGeneratingVouchers(true);
    try {
      const res = await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: voucherCount,
          bookId: voucherType === 'book_access' ? (voucherBookId || null) : null,
          voucherType,
          creditAmount: voucherPrice,
          pricePrinted: voucherPrice,
          createdBy: isAdmin ? 'admin' : (currentUser?.id || currentAuthorName),
          createdByUserId: currentUser?.id || null,
          authorName: teacherName || currentAuthorName || 'إدارة المنصة',
          userRole: isAdmin ? 'admin' : 'instructor'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedVouchers(prev => [...(data.vouchers || []), ...prev]);
        setStatusMsg(data.message || `تم إصدار ${voucherCount} كارت بنجاح وخصم عمولة المنصة (${totalCommission} ج.م)! 🎟️`);
        await reloadWalletAndData();
        setTimeout(() => setStatusMsg(null), 5000);
      } else {
        alert(data.message || data.error || 'فشل إصدار الكروت.');
        if (data.deficit || (data.message && data.message.includes('رصيد'))) {
          setIsRechargeModalOpen(true);
        }
      }
    } catch (e) {
      console.error('Failed to generate vouchers:', e);
      alert('حدث خطأ أثناء إصدار الكروت.');
    } finally {
      setIsGeneratingVouchers(false);
    }
  };

  // ==========================================
  // ↩️ CANCEL VOUCHER & REFUND COMMISSION (24 HOURS)
  // ==========================================
  const handleCancelVoucher = async (code: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء الكارت (${code}) واسترداد عمولة المنصة لمحفظتك؟`)) return;

    try {
      const res = await fetch('/api/vouchers/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          instructorId: currentUser?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        setGeneratedVouchers(prev => prev.map(v => v.code === code ? { ...v, is_cancelled: true } : v));
        await reloadWalletAndData();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشل إلغاء الكارت');
      }
    } catch (e: any) {
      alert('حدث خطأ أثناء الاتصال بالسيرفر');
    }
  };

  const handleCopyVouchers = () => {
    const codesText = filteredVouchers.map(v => typeof v === 'string' ? v : v.code).join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["الكود,النوع,المقرر,القيمة,العمولة,الحالة,تاريخ الإنشاء,المستخدم"]
      .concat(generatedVouchers.map(v => 
        `"${v.code}","${v.voucher_type === 'wallet_credit' ? 'رصيد محفظة' : 'فتح مقرر'}","${v.book_id || 'عام'}","${v.credit_amount || voucherPrice}","${v.commission_amount || 15}","${v.is_cancelled ? 'ملغي ومسترد' : (v.is_used ? 'مستخدم' : 'نشط')}","${v.created_at || ''}","${v.used_by || ''}"`
      )).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `osera_vouchers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVouchers = useMemo(() => {
    if (voucherFilter === 'active') return generatedVouchers.filter(v => !v.is_used && !v.is_cancelled);
    if (voucherFilter === 'used') return generatedVouchers.filter(v => v.is_used);
    if (voucherFilter === 'cancelled') return generatedVouchers.filter(v => v.is_cancelled);
    return generatedVouchers;
  }, [generatedVouchers, voucherFilter]);

  // Real database metrics calculation
  const totalRevenue = dbPurchases.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const activeVouchersCount = generatedVouchers.filter(v => !v.is_used && !v.is_cancelled).length;
  const usedVouchersCount = generatedVouchers.filter(v => v.is_used).length;

  if (userRole === 'student' && !isAdminMode) {
    return (
      <div className="p-12 text-center bg-white border border-rose-100 rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto my-12" dir="rtl">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-black text-slate-900">غير مصرح بالدخول (مخصص للمعلمين والإدارة فقط)</h3>
        <p className="text-xs text-slate-500">حسابك مسجل كطالب. هذه اللوحة مخصصة للمعلمين لإصدار الكتب وإدارة السناتر والكروت المالية.</p>
        <button
          onClick={onBackToMarketplace}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          العودة إلى متجر المقررات 📚
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 text-right max-w-7xl mx-auto" dir="rtl">
      
      {/* 🌟 TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 print:hidden">
        <div>
          <button
            onClick={onBackToMarketplace}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-teal-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>العودة لمتجر ومكتبة المقررات</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md ${
              isAdmin 
                ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-amber-500/20' 
                : 'bg-teal-600 text-white shadow-teal-500/20'
            }`}>
              {isAdmin ? '🛡️' : '👨‍🏫'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {isAdmin ? 'غرفة العمليات ولوحة القيادة المركزية' : 'لوحة تحكم واستوديو المعلم'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  isAdmin 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                }`}>
                  {isAdmin ? 'المسؤول العام (Admin)' : `المعلم: ${currentAuthorName || 'خبير المادة'}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isAdmin 
                  ? 'إشراف كامل على اعتمادات الكتب، منظومة العمولات والمحافظ، وتحليلات الداتابيز الحية 100%.' 
                  : `إدارة مذكراتك واعتماداتها، إصدار كروت الشحن، وسحب الأرباح وشحن المحفظة.`}
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 ACTION BUTTONS (AI GENERATION & ADD BOOK) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-teal-500/20 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>توليد مقرر بالذكاء الاصطناعي ✨</span>
            </button>
          )}

          {onOpenExternalModal && (
            <button
              onClick={onOpenExternalModal}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>إضافة مقرر تفاعلي ➕</span>
            </button>
          )}
        </div>
      </div>

      {/* 🌟 TABS SELECTOR */}
      <div className="flex items-center gap-1.5 p-2 bg-slate-100/90 rounded-2xl text-xs font-bold w-full overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap shadow-2xs print:hidden">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-teal-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>📊 الإحصائيات الحية</span>
          </button>

          <button
            onClick={() => setActiveTab('learning_radar')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'learning_radar'
                ? 'bg-white text-indigo-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>🎯 رادار التعلم وكشف التعثر</span>
            {cockpitData?.studentsAtRisk && cockpitData.studentsAtRisk.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
                {cockpitData.studentsAtRisk.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('teacher_sos')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'teacher_sos'
                ? 'bg-white text-rose-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-rose-600" />
            <span>🙋‍♂️ استفسارات الطلاب (SOS)</span>
            {sosTickets.filter(t => t.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black animate-bounce">
                {sosTickets.filter(t => t.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-white text-amber-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>🛡️ صندوق الاعتمادات</span>
            {pendingApprovalsCount > 0 && isAdmin && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-white text-indigo-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>🖨️ الامتحانات المخصصة</span>
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'vouchers'
                ? 'bg-white text-rose-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4 text-rose-600" />
            <span>🎟️ كروت السناتر ({generatedVouchers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'wallet'
                ? 'bg-white text-emerald-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>💰 المحفظة ({walletBalance} ج.م)</span>
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'reels'
                ? 'bg-white text-purple-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>🎬 استوديو الريلز ({allReels.length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-indigo-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>👥 إدارة الطلاب والمعلمين</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('support')}
              className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-white text-rose-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-rose-600" />
              <span>🎫 الشكاوى والدعم الفني</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-indigo-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>⚙️ هوية المنصة واللوجو (Branding)</span>
            </button>
          )}
        </div>

      {/* STATUS ALERT NOTIFICATION */}
      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 1: 100% REAL LIVE DATABASE ANALYTICS (ZERO FAKE DATA) */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-bold">
                <span>الطلاب المسجلين</span>
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{dbProfiles.length}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">
                حسابات حقيقية في الداتابيز
              </div>
            </div>

            <div className="p-3.5 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-bold">
                <span>إجمالي الإيرادات</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">{totalRevenue} <span className="text-[10px] sm:text-xs font-bold text-slate-400">ج.م</span></div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">
                {dbPurchases.length} عمليات شراء مؤكدة
              </div>
            </div>

            <div className="p-3.5 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-bold">
                <span>محاولات الامتحانات</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{dbQuizAttempts.length}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">
                {dbQuizAttempts.length === 0 ? 'لا توجد محاولات بعد' : 'محاولة تقييم مسجلة'}
              </div>
            </div>

            <div className="p-3.5 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-bold">
                <span>كروت الشحن</span>
                <Ticket className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600">
                {usedVouchersCount} <span className="text-xs sm:text-sm font-normal text-slate-400">/ {generatedVouchers.length}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate">
                {activeVouchersCount} كارت في انتظار الشحن
              </div>
            </div>
          </div>

          {/* REAL DATABASE ACTIVITY STREAM */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base">سجل النشاط المباشر من قاعدة البيانات</h3>
            
            {dbPurchases.length === 0 && dbQuizAttempts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">لا توجد عمليات شراء أو محاولات امتحانات مسجلة حتى الآن.</p>
                <p className="text-[11px] text-slate-400">سيتم تسجيل وتحديث أي نشاط حقيقي يجريه الطالب مباشرة في قاعدة البيانات.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {dbPurchases.map((p, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-mono text-xs">
                        ✓
                      </div>
                      <span>طالب (#{(p.user_id || 'طالب').substring(0, 6)})</span>
                    </div>
                    <span className="text-slate-600">قام بتفعيل المقرر ({p.payment_method || 'كارت سنتر'})</span>
                    <span className="text-slate-400 text-[10px]">{p.created_at ? new Date(p.created_at).toLocaleDateString('ar-EG') : 'مؤخراً'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎯 TAB: LEARNING RADAR & STUDENTS AT RISK (EL MAESTRO AXIS 2) */}
      {/* ========================================================================= */}
      {activeTab === 'learning_radar' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 text-white rounded-3xl border border-indigo-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-2xl border border-indigo-500/40">
                  <Radio className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">رادار التعلم البيداغوجي وكشف تعثر الطلاب</h3>
                  <p className="text-xs text-indigo-200/80">مراقبة فورية للوقت الفعلي الصافي للقراءة، استماع الشرح الصوتي، ونقاط الاختناق المعرفية</p>
                </div>
              </div>

              <button
                onClick={loadCockpitAndTickets}
                disabled={isLoadingCockpit}
                className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl border border-indigo-400/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCockpit ? 'animate-spin' : ''}`} />
                <span>تحديث الرادار</span>
              </button>
            </div>

            {/* Live KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] font-bold text-indigo-300">إجمالي المتعلمين</div>
                <div className="text-2xl font-black text-white">{cockpitData?.totalLearners || 0}</div>
                <div className="text-[10px] text-slate-400">طالب مسجل في مذكراتك</div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] font-bold text-teal-300">الطلاب النشطين (آخر 48 س)</div>
                <div className="text-2xl font-black text-teal-400">{cockpitData?.activeLearnersCount || 0}</div>
                <div className="text-[10px] text-slate-400">تفاعل وقراءة حية مستمرة</div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] font-bold text-amber-300">متوسط دقائق القراءة الفعالة</div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {cockpitData?.avgReadingMinutes || 0} <span className="text-xs font-sans text-slate-300">دقيقة</span>
                </div>
                <div className="text-[10px] text-slate-400">بعد استبعاد فترات الخمول</div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] font-bold text-purple-300">نسبة الاستماع الصوتي الحي</div>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {cockpitData?.avgAudioListenPercent || 0}%
                </div>
                <div className="text-[10px] text-slate-400">إتمام شروح الدروس والمصائد</div>
              </div>
            </div>
          </div>

          {/* TWO MAIN COLUMNS: AT RISK QUEUE + CURRICULUM BOTTLENECKS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. STUDENTS AT RISK QUEUE (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">🚨 الطلاب المعرضين للتعثر (Students at Risk)</h4>
                    <p className="text-[11px] text-slate-500">تم رصدهم استباقياً لتدني درجات الاختبار أو انقطاع النشاط التعليمي</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black">
                  {cockpitData?.studentsAtRisk?.length || 0} حالات
                </span>
              </div>

              {!cockpitData?.studentsAtRisk || cockpitData.studentsAtRisk.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="text-sm font-black text-slate-700">لا يوجد طلاب معرضين للتعثر حالياً! 🎉</p>
                  <p className="text-xs text-slate-400">جميع الطلاب المسجلين يحققون متوسط درجات أعلى من 60% مع استمرارية قراءة ممتازة.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cockpitData.studentsAtRisk.map((student) => {
                    const isCritical = student.avgScore < 50;
                    return (
                      <div
                        key={student.studentId}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCritical
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{student.studentName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                isCritical
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {isCritical ? '⚠️ خطر حرج' : '⚡ تنبيه متابعة'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              (المذكرة: {student.bookTitle})
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-medium">
                            {student.riskFactor}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono">
                            آخر نشاط مسجل: {new Date(student.lastActive).toLocaleDateString('ar-EG')} • متوسط الاختبارات: {student.avgScore}%
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setActiveTab('teacher_sos');
                            setStatusMsg(`تم توجيهك إلى شاشة المساعدة للتواصل مع الطالب: ${student.studentName}`);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
                          <span>إرسال توجيه ودعم 💬</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. CURRICULUM BOTTLENECKS HEATMAP (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">⚠️ نقاط الاختناق في المنهج</h4>
                    <p className="text-[11px] text-slate-500">أسئلة ومفاهيم تعثر بها أكثر من 35% من الطلاب</p>
                  </div>
                </div>
              </div>

              {!cockpitData?.curriculumBottlenecks || cockpitData.curriculumBottlenecks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-slate-600">لا توجد أسئلة ذات نسبة خطأ مرتفعة حالياً.</p>
                  <p className="text-[11px] text-slate-400">يتم رصد الأسئلة التي يفشل فيها الطلاب آلياً لتنبيهك لتعديل الشرح.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {cockpitData.curriculumBottlenecks.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-slate-800 leading-relaxed">
                          {item.chapterTitle} (سؤال {item.questionIndex + 1})
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-black text-[11px] shrink-0 font-mono">
                          {item.failRate}% نسبة الخطأ
                        </span>
                      </div>
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 font-medium">
                        <span className="font-bold text-amber-800 block mb-0.5">💡 المفهوم الخاطئ الشائع لدى الطلاب:</span>
                        {item.trapDescription}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. ACTIVE TELEMETRY LEDGER (ALL LEARNERS PROGRESS) */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>سجل النشاط الفعلي والتتبع البيداغوجي لجميع الطلاب</span>
            </h4>

            {!cockpitData?.studentLogs || cockpitData.studentLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                لا توجد سجلات تتبع حديثة بعد. ستظهر بيانات الطلاب فور قيامهم بالقراءة والاستماع.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">اسم الطالب</th>
                      <th className="p-3">المقرر / المذكرة</th>
                      <th className="p-3">صافي وقت القراءة</th>
                      <th className="p-3">الفصول المنجزة</th>
                      <th className="p-3">دقة الاختبارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {cockpitData.studentLogs.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{row.studentName}</td>
                        <td className="p-3 text-slate-600">{row.bookTitle}</td>
                        <td className="p-3 font-mono text-indigo-600 font-bold">{row.totalMinutes} دقيقة</td>
                        <td className="p-3 font-mono text-purple-600 font-bold">{row.chaptersCompleted} فصول</td>
                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            row.quizAccuracy >= 80 ? 'bg-emerald-100 text-emerald-800' :
                            row.quizAccuracy >= 60 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {row.quizAccuracy}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🙋‍♂️ TAB: TEACHER SOS HELPDESK TICKETS (EL MAESTRO AXIS 1) */}
      {/* ========================================================================= */}
      {activeTab === 'teacher_sos' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-black text-2xl border border-rose-200 shadow-xs">
                  🙋‍♂️
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">منظومة استفسارات الطلاب المباشرة (Teacher SOS Bridge)</h3>
                  <p className="text-xs text-slate-500">إجابة تساؤلات الطلاب مع إرساء تلقائي لنص الفقرة وسياق الكتاب الدراسي</p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setTicketFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${ticketFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'}`}
                >
                  الكل ({sosTickets.length})
                </button>
                <button
                  onClick={() => setTicketFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition ${ticketFilter === 'pending' ? 'bg-white text-rose-700 shadow-xs font-black' : 'text-slate-600'}`}
                >
                  في انتظار الرد ({sosTickets.filter(t => t.status === 'pending').length})
                </button>
                <button
                  onClick={() => setTicketFilter('answered')}
                  className={`px-3 py-1.5 rounded-lg transition ${ticketFilter === 'answered' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-600'}`}
                >
                  تم الحل ({sosTickets.filter(t => t.status === 'answered').length})
                </button>
              </div>
            </div>

            {/* Tickets Stream */}
            {(() => {
              const filtered = sosTickets.filter(t => {
                if (ticketFilter === 'all') return true;
                return t.status === ticketFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                    <p className="text-sm font-black text-slate-700">لا توجد استفسارات في هذه القائمة حالياً! 🌟</p>
                    <p className="text-xs text-slate-400">ستصلك استفسارات الطلاب وتنبيهات SOS فور إرسالها من صفحة قراءة المذكرة.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-5 pt-2">
                  {filtered.map((ticket) => {
                    const isOpen = ticket.status === 'pending';
                    return (
                      <div
                        key={ticket.id}
                        className={`p-6 rounded-3xl border-2 transition-all space-y-4 ${
                          isOpen
                            ? 'bg-white border-rose-200 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        {/* Ticket Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                              {ticket.studentName.charAt(0) || 'ط'}
                            </span>
                            <div>
                              <div className="text-xs font-black text-slate-900">{ticket.studentName}</div>
                              <div className="text-[10px] text-slate-500 font-bold">
                                {ticket.bookTitle} • {ticket.chapterTitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                isOpen
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOpen ? '🔴 في انتظار إجابتك' : '🟢 تم الرد والمساعدة'}
                            </span>
                          </div>
                        </div>

                        {/* Anchored Textbook Snippet Block */}
                        {ticket.selectedSnippet && (
                          <div className="p-3.5 bg-amber-50/60 border-r-4 border-amber-500 rounded-xl text-xs space-y-1">
                            <span className="text-[10px] font-black text-amber-800 block">
                              📖 سياق الفقرة الأصلية التي سأل عنها الطالب من المذكرة:
                            </span>
                            <div className="text-slate-800 italic leading-relaxed">
                              <MathRenderer text={ticket.selectedSnippet} />
                            </div>
                          </div>
                        )}

                        {/* Student Question */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 block">سؤال الطالب:</span>
                          <p className="text-sm font-black text-slate-900 leading-relaxed">
                            <MathRenderer text={ticket.questionText} />
                          </p>
                        </div>

                        {/* Answered View vs Reply Form */}
                        {ticket.status === 'answered' ? (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-emerald-900 font-black">
                              <span>✅ إجابة المعلم المعتمد ({ticket.answeredAt ? 'تم الرد' : 'المعلم'}):</span>
                              {ticket.teacherAudioUrl && (
                                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] flex items-center gap-1 font-bold">
                                  <Mic className="w-3 h-3" />
                                  <span>ملاحظة صوتية مرفقة</span>
                                </span>
                              )}
                            </div>
                            <div className="text-slate-800 leading-relaxed font-medium">
                              <MathRenderer text={ticket.teacherAnswer || ''} />
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-gray-100 space-y-3">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700">
                                صياغة الإجابة النموذجية (تدعم الرموز والمعادلات الرياضية KaTeX):
                              </label>
                              <textarea
                                value={replyTextMap[ticket.id] || ''}
                                onChange={(e) => setReplyTextMap(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                placeholder="اكتب الشرح التوضيحي للطالب هنا بالتفصيل وبأسلوب مشجع..."
                                rows={3}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              <input
                                type="text"
                                value={replyAudioMap[ticket.id] || ''}
                                onChange={(e) => setReplyAudioMap(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                placeholder="رابط تسجيل صوتي اختياري (mp3 / audio url)..."
                                className="w-full sm:w-80 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] focus:bg-white outline-none"
                              />

                              <button
                                onClick={() => handleSendTicketReply(ticket.id)}
                                disabled={isSubmittingReply[ticket.id]}
                                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                              >
                                {isSubmittingReply[ticket.id] ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>جاري الإرسال...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>إرسال الرد المعتمد للطالب 🚀</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ TAB 2: COURSE APPROVALS & MODERATION QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isAdmin ? 'مركز مراجعة واعتماد المذكرات والمقررات (Admin Queue)' : 'متابعة حالة اعتماد ونشر مقرراتك'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAdmin 
                    ? 'راجع المذكرات المرفوعة حديثاً من المعلمين، وافق عليها بنقرة واحدة، أو ارفضها مع تقديم ملاحظات.' 
                    : 'لا تظهر المذكرة للطلاب في المتجر إلا بعد اعتمادها ومراجعتها من إدارة المنصة لضمان الجودة.'}
                </p>
              </div>

              {/* FILTER BUTTONS */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setApprovalFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${approvalFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-black' : 'text-slate-500'}`}
                >
                  الكل ({visibleBooks.length})
                </button>
                <button
                  onClick={() => setApprovalFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition ${approvalFilter === 'pending' ? 'bg-white shadow-2xs text-amber-700 font-black' : 'text-slate-500'}`}
                >
                  قيد المراجعة ({visibleBooks.filter(b => b.approval_status === 'pending_approval').length})
                </button>
                <button
                  onClick={() => setApprovalFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg transition ${approvalFilter === 'approved' ? 'bg-white shadow-2xs text-emerald-700 font-black' : 'text-slate-500'}`}
                >
                  المعتمدة والمنشورة
                </button>
                <button
                  onClick={() => setApprovalFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg transition ${approvalFilter === 'rejected' ? 'bg-white shadow-2xs text-rose-700 font-black' : 'text-slate-500'}`}
                >
                  المرفوضة
                </button>
                <button
                  onClick={() => setApprovalFilter('edit_requested')}
                  className={`px-3 py-1.5 rounded-lg transition ${approvalFilter === 'edit_requested' ? 'bg-white shadow-2xs text-indigo-700 font-black' : 'text-slate-500'}`}
                >
                  طلبات التعديل
                </button>
              </div>
            </div>

            {/* BOOKS APPROVAL GRID */}
            {filteredApprovalBooks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl space-y-2">
                <CheckCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-sm text-slate-600">لا توجد مذكرات أو طلبات مطابقة لهذا الفلتر حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApprovalBooks.map((book) => {
                  const status = book.approval_status || (book.is_published ? 'approved' : 'draft');
                  return (
                    <div key={book.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs space-y-4 flex flex-col justify-between">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={book.thumbnail_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150'}
                          alt={book.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                              {book.subcategory || 'مقرر دراسي'}
                            </span>
                            
                            {/* STATUS BADGE */}
                            {status === 'approved' && (
                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> معتمد ومنشور
                              </span>
                            )}
                            {status === 'pending_approval' && (
                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" /> قيد مراجعة الأدمن
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> مرفوض
                              </span>
                            )}
                            {status === 'edit_requested' && (
                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1">
                                <Edit className="w-3 h-3" /> طلب تعديل محتوى
                              </span>
                            )}
                            {status === 'draft' && (
                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                                مسودة (Draft)
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-sm text-slate-900 line-clamp-1">{book.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            المعلم: {book.author_name || 'خبير المادة'} • {book.chapters?.length || 0} فصول • {book.price || 150} ج.م
                          </p>
                        </div>
                      </div>

                      {/* REJECTION REASON DISPLAY */}
                      {status === 'rejected' && book.admin_rejection_reason && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                          <strong className="block font-black">سبب الرفض وملاحظات الإدارة:</strong>
                          <p>{book.admin_rejection_reason}</p>
                        </div>
                      )}

                      {/* EDIT REQUEST NOTES DISPLAY */}
                      {status === 'edit_requested' && book.edit_request_notes && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                          <strong className="block font-black">ملاحظات التعديل المطلوبة من المعلم:</strong>
                          <p>{book.edit_request_notes}</p>
                        </div>
                      )}

                      {/* ACTIONS ROW */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        {onLaunchBook && (
                          <button
                            type="button"
                            onClick={() => onLaunchBook(book.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة المحتوى</span>
                          </button>
                        )}

                        {/* ADMIN APPROVAL ACTIONS */}
                        {isAdmin && (
                          <div className="flex items-center gap-2 mr-auto">
                            {status !== 'approved' && (
                              <button
                                onClick={() => handleApproveBook(book.id)}
                                disabled={isProcessingApproval}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>اعتماد ونشر للطلاب</span>
                              </button>
                            )}

                            {status !== 'rejected' && (
                              <button
                                onClick={() => {
                                  setRejectionModalBookId(book.id);
                                  setRejectionReason('');
                                }}
                                disabled={isProcessingApproval}
                                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* INSTRUCTOR ACTIONS */}
                        {!isAdmin && (
                          <div className="flex items-center gap-2 mr-auto">
                            {(status === 'draft' || status === 'rejected') && (
                              <button
                                onClick={() => handleSubmitForApproval(book.id)}
                                disabled={isProcessingApproval}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>إرسال للأدمن للاعتماد</span>
                              </button>
                            )}

                            {status === 'approved' && (
                              <button
                                onClick={() => {
                                  setEditRequestModalBookId(book.id);
                                  setEditRequestNotes('');
                                }}
                                disabled={isProcessingApproval}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>طلب تعديل المحتوى</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalBookId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">رفض المقرر وإرسال ملاحظات للمعلم</h3>
            <p className="text-xs text-slate-500">اكتب سبب الرفض بوضوح ليقوم المعلم بتصحيحه وإعادة الإرسال:</p>
            <form onSubmit={handleRejectBook} className="space-y-4">
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: يرجى إضافة نموذج الإجابة للكويز، وتنسيق صور الفصل الثاني..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalBookId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingApproval}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  تأكيد الرفض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST EDIT MODAL */}
      {editRequestModalBookId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">طلب تعديل على مقرر منشور</h3>
            <p className="text-xs text-slate-500">وضح للأدمن ما التعديلات التي تود إجراؤها على النسخة المنشورة:</p>
            <form onSubmit={handleRequestEdit} className="space-y-4">
              <textarea
                required
                rows={4}
                value={editRequestNotes}
                onChange={(e) => setEditRequestNotes(e.target.value)}
                placeholder="مثال: إضافة فصل جديد لشرح بنك أسئلة الوزارة وتحديث أسعار المذكرة..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditRequestModalBookId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingApproval}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖨️ TAB 3: SCALABLE CUSTOM EXAM STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">استوديو توليد الامتحانات الورقية المخصص</h3>
                <p className="text-xs text-slate-500">حدد الفصول المطلوبة، عدد الأسئلة بدقة (حتى 100 سؤال)، ونسبة المقالي مع توليد فوري بالـ AI</p>
              </div>
              {generatedExam && (
                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ طباعة ورقة الامتحان فوراً (A4 Print / PDF)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المقرر المستهدف:</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  {visibleBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المعلم / المحاضر:</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم السنتر / المؤسسة:</label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* CHAPTER CHECKBOXES */}
            {currentTargetBook?.chapters && currentTargetBook.chapters.length > 0 && (
              <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1">
                  <span>اختر الفصول المستهدفة في الامتحان:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChapterIds.length === currentTargetBook.chapters.length) {
                        setSelectedChapterIds([]);
                      } else {
                        setSelectedChapterIds(currentTargetBook.chapters.map((c: any) => c.id));
                      }
                    }}
                    className="text-indigo-600 hover:underline text-[11px]"
                  >
                    {selectedChapterIds.length === currentTargetBook.chapters.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الفصول'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {currentTargetBook.chapters.map((ch: any) => {
                    const isChecked = selectedChapterIds.includes(ch.id);
                    return (
                      <label 
                        key={ch.id} 
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                          isChecked ? 'bg-white border-indigo-400 text-indigo-950 shadow-2xs' : 'bg-slate-100/60 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedChapterIds(selectedChapterIds.filter(id => id !== ch.id));
                            } else {
                              setSelectedChapterIds([...selectedChapterIds, ch.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="truncate">{ch.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUESTION COUNT CONTROLS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عدد أسئلة الاختيار من متعدد (MCQ):
                </label>
                <select
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value={10}>10 أسئلة MCQ</option>
                  <option value={20}>20 سؤال MCQ</option>
                  <option value={30}>30 سؤال MCQ</option>
                  <option value={40}>40 سؤال MCQ</option>
                  <option value={50}>50 سؤال MCQ</option>
                  <option value={60}>60 سؤال MCQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عدد الأسئلة المقالية:
                </label>
                <select
                  value={essayCount}
                  onChange={(e) => setEssayCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value={0}>بدون أسئلة مقالية</option>
                  <option value={2}>2 أسئلة مقالية</option>
                  <option value={4}>4 أسئلة مقالية</option>
                  <option value={6}>6 أسئلة مقالية</option>
                  <option value={8}>8 أسئلة مقالية</option>
                  <option value={10}>10 أسئلة مقالية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">زمن الامتحان:</label>
                <input
                  type="text"
                  value={examDuration}
                  onChange={(e) => setExamDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateCustomExam}
                  disabled={isGeneratingExam}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingExam ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التوليد بالـ AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>توليد {mcqCount + essayCount} سؤال الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* EXAM PAPER PREVIEW */}
          {generatedExam && (
            <div className="space-y-8" id="printable-exam-container">
              <div className="bg-white border-2 border-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none">
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black">{examTitle}</h2>
                    <p className="text-xs font-bold text-slate-700">
                      إعداد المعلم: <strong>{teacherName}</strong> • {centerName} • مادة ({currentTargetBook?.title})
                    </p>
                    <p className="text-[11px] text-slate-500">منظومة Osera AI LMS الأكاديمية</p>
                  </div>

                  <div className="text-left font-mono text-xs font-bold border border-slate-900 p-3 rounded-xl space-y-1">
                    <div>الزمن: <strong>{examDuration}</strong></div>
                    <div>إجمالي الأسئلة: <strong>{generatedExam.mcq.length + generatedExam.essay.length} سؤال</strong></div>
                    <div className="pt-1 text-[11px] font-sans">اسم الطالب: .......................................</div>
                  </div>
                </div>

                {generatedExam.mcq.length > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between bg-slate-100 px-4 py-1.5 rounded-lg font-black text-xs">
                      <span>القسم الأول: أسئلة الاختيار من متعدد ({generatedExam.mcq.length} سؤال)</span>
                      <span>[ كل سؤال درجة واحدة ]</span>
                    </div>

                    <div className="space-y-4">
                      {generatedExam.mcq.map((q, idx) => (
                        <div key={idx} className="space-y-2 border-b border-gray-200 pb-3 break-inside-avoid">
                          <div className="flex items-start gap-2 font-bold text-sm leading-relaxed">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{q.question}</span>
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pr-8 text-xs font-medium text-slate-800">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full border-2 border-slate-600 inline-block shrink-0" />
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedExam.essay.length > 0 && (
                  <div className="space-y-5 pt-4">
                    <div className="flex items-center justify-between bg-slate-100 px-4 py-1.5 rounded-lg font-black text-xs">
                      <span>القسم الثاني: الأسئلة المقالية والتطبيقية ({generatedExam.essay.length} أسئلة)</span>
                      <span>[ 20 درجة ]</span>
                    </div>

                    <div className="space-y-6">
                      {generatedExam.essay.map((q, idx) => (
                        <div key={idx} className="space-y-2 break-inside-avoid">
                          <div className="flex items-start gap-2 font-bold text-sm leading-relaxed">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center shrink-0">
                              {generatedExam.mcq.length + idx + 1}
                            </span>
                            <span>{q.question}</span>
                          </div>
                          <div className="space-y-2.5 pt-2 pr-8">
                            <div className="border-b border-dashed border-slate-400 h-4" />
                            <div className="border-b border-dashed border-slate-400 h-4" />
                            <div className="border-b border-dashed border-slate-400 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>تمنياتنا لجميع الطلاب بدوام التفوق والنجاح ✦</span>
                  <span>(انتهت الأسئلة)</span>
                </div>
              </div>

              {includeAnswerKey && (
                <div className="bg-white border-2 border-indigo-900 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 text-slate-900 print:break-before-page print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
                  <div className="border-b-2 border-indigo-900 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-indigo-900">نموذج الإجابة الرسمي وتوزيع الدرجات (خاص بالمعلم والكنترول)</h3>
                      <p className="text-xs font-bold text-slate-600">مقرر: {currentTargetBook?.title}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-lg text-xs font-mono font-black">
                      CONFIDENTIAL / سري
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                    {generatedExam.mcq.map((q, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <span>سؤال ({idx + 1}):</span>
                        <span className="text-emerald-700 font-black">
                          {q.options ? q.options[q.correctOptionIndex || 0] : 'أ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎟️ TAB 4: VOUCHER FACTORY, COMMISSIONS & 24H VOIDING */}
      {/* ========================================================================= */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">منظومة كروت الشحن وعمولات المنصة</h3>
                <p className="text-xs text-slate-500">
                  عمولة المنصة: <strong>{commissionRate}%</strong> (إجمالي العمولة: <strong>{totalCommissionAmount} ج.م</strong>) • مهلة استرجاع وإلغاء الكروت: <strong>24 ساعة</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير Excel</span>
                </button>

                <button
                  onClick={() => setIsPrintSheetMode(!isPrintSheetMode)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    isPrintSheetMode 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>{isPrintSheetMode ? 'إغلاق وضع الطباعة' : '📄 طباعة كروت السنتر (8 كروت A4)'}</span>
                </button>
              </div>
            </div>

            {/* FINANCIAL SUMMARY & COMMISSION PRE-PAYMENT BANNER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                <span className="text-slate-500 font-bold">إجمالي قيمة الكروت:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{voucherCount * voucherPrice} ج.م</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-amber-900">
                <span className="font-bold">عمولة المنصة ({commissionRate}%):</span>
                <span className="font-mono font-black text-amber-700 text-sm">{totalCommissionAmount} ج.م</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900">
                <span className="font-bold">رصيدك المتاح بالمحفظة:</span>
                <span className="font-mono font-black text-indigo-700 text-sm">{walletBalance} ج.م</span>
              </div>
            </div>

            {/* LOW BALANCE ALERT */}
            {!isAdmin && walletBalance < totalCommissionAmount && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs text-rose-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    عفواً، رصيدك المتاح (<strong>{walletBalance} ج.م</strong>) لا يكفي لسداد عمولة المنصة (<strong>{totalCommissionAmount} ج.م</strong>). يلزم شحن المحفظة لإصدار الكروت.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRechargeModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-xs"
                >
                  ⚡ شحن المحفظة الآن
                </button>
              </div>
            )}

            {/* VOUCHER TYPE */}
            <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setVoucherType('book_access')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  voucherType === 'book_access' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>🎟️ كارت فتح مقرر محدد</span>
              </button>

              <button
                type="button"
                onClick={() => setVoucherType('wallet_credit')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  voucherType === 'wallet_credit' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                <Wallet className="w-4 h-4 text-indigo-600" />
                <span>💳 كارت شحن رصيد محفظة</span>
              </button>
            </div>

            {/* GENERATE CONTROLS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {voucherType === 'book_access' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المقرر المخصص للكارت:</label>
                  <select
                    value={voucherBookId}
                    onChange={(e) => setVoucherBookId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="">كارت عام (لكل المقررات)</option>
                    {visibleBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">قيمة رصيد الشحن:</label>
                  <select
                    value={voucherPrice}
                    onChange={(e) => setVoucherPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  >
                    <option value={50}>50 ج.م رصيد</option>
                    <option value={100}>100 ج.م رصيد</option>
                    <option value={150}>150 ج.م رصيد</option>
                    <option value={200}>200 ج.م رصيد</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الكروت المطلوبة:</label>
                <select
                  value={voucherCount}
                  onChange={(e) => setVoucherCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value={8}>8 كروت (صفحة A4)</option>
                  <option value={16}>16 كارت (صفحتين A4)</option>
                  <option value={24}>24 كارت (3 صفحات A4)</option>
                  <option value={50}>50 كارت (عمولة 15%)</option>
                  <option value={100}>100 كارت (عمولة 15%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السعر المطبوع على الكارت:</label>
                <input
                  type="number"
                  value={voucherPrice}
                  onChange={(e) => setVoucherPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateVouchers}
                  disabled={isGeneratingVouchers || (!isAdmin && walletBalance < totalCommissionAmount)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingVouchers ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الخصم والإصدار...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>إصدار الكروت وسداد العمولة ({totalCommissionAmount} ج.م)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* VOUCHERS LIST WITH 24H VOID BUTTON */}
          {!isPrintSheetMode && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">
                    سجل الكروت الصادرة ({filteredVouchers.length} كارت):
                  </span>
                  
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setVoucherFilter('all')}
                      className={`px-2.5 py-1 rounded-lg ${voucherFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    >
                      الكل ({generatedVouchers.length})
                    </button>
                    <button
                      onClick={() => setVoucherFilter('active')}
                      className={`px-2.5 py-1 rounded-lg ${voucherFilter === 'active' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500'}`}
                    >
                      النشطة ({activeVouchersCount})
                    </button>
                    <button
                      onClick={() => setVoucherFilter('used')}
                      className={`px-2.5 py-1 rounded-lg ${voucherFilter === 'used' ? 'bg-white shadow-2xs text-rose-700' : 'text-slate-500'}`}
                    >
                      المستخدمة ({usedVouchersCount})
                    </button>
                    <button
                      onClick={() => setVoucherFilter('cancelled')}
                      className={`px-2.5 py-1 rounded-lg ${voucherFilter === 'cancelled' ? 'bg-white shadow-2xs text-gray-700' : 'text-slate-500'}`}
                    >
                      الملغية والمستردة
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCopyVouchers}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAll ? 'تم نسخ جميع الأكواد ✓' : 'نسخ الأكواد المعروضة'}</span>
                </button>
              </div>

              {filteredVouchers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد كروت شحن مطابقة لهذا الفلتر.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredVouchers.map((v, idx) => {
                    const code = typeof v === 'string' ? v : v.code;
                    const isUsed = typeof v === 'object' && v.is_used;
                    const isCancelled = typeof v === 'object' && v.is_cancelled;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                          isCancelled 
                            ? 'bg-gray-100 border-gray-200 opacity-60' 
                            : (isUsed 
                              ? 'bg-rose-50/50 border-rose-200 text-rose-900' 
                              : 'bg-white border-slate-200 text-slate-900 hover:border-teal-400 shadow-2xs')
                        }`}
                      >
                        <div>
                          <span className={`font-mono font-black text-sm block ${isCancelled ? 'line-through text-gray-500' : ''}`}>{code}</span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {isCancelled ? 'ملغي ومسترد للمحفظة' : (isUsed ? `مستخدم بواسطة: ${v.used_by || 'طالب'}` : `نشط • عمولة: ${v.commission_amount || 15} ج.م`)}
                          </span>
                        </div>

                        {!isUsed && !isCancelled && (
                          <button
                            onClick={() => handleCancelVoucher(code)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black transition flex items-center gap-1 cursor-pointer shrink-0"
                            title="إلغاء الكارت واسترداد العمولة لمحفظتك خلال 24 ساعة"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>إلغاء واسترجاع</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💰 TAB 5: WALLET, RECHARGE & WITHDRAWAL PAYOUTS */}
      {/* ========================================================================= */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-2xl border border-emerald-200 shadow-xs">
                  💰
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">المحفظة المالية والحساب الجاري</h3>
                  <p className="text-xs text-slate-500">شحن فوري بالبوابات الإلكترونية، سحب الأرباح، ومتابعة العمولات</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right sm:text-left">
                  <div className="text-xs text-slate-400 font-bold">الرصيد المتاح حالياً</div>
                  <div className="text-3xl font-black text-emerald-600 font-mono">{walletBalance} <span className="text-sm font-sans">ج.م</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRechargeModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>شحن رصيد 💳</span>
                  </button>

                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>سحب الأرباح 🚀</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 🛡️ EL MAESTRO AXIS 3: 85% INSTRUCTOR REVENUE LEDGER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-800 font-bold block">إجمالي مبيعات مقرراتك</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {instructorWallet?.totalEarnings || Math.round(walletBalance * 1.18)} <span className="text-[10px] font-sans">ج.م</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-800 font-bold block">عمولة المنصة الثابتة (15%)</span>
                <span className="text-xl font-black text-slate-500 font-mono">
                  {instructorWallet?.totalEarnings ? Math.round(instructorWallet.totalEarnings * (instructorWallet.platformFeePercent / 100)) : Math.round(walletBalance * 0.15)} <span className="text-[10px] font-sans">ج.م</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-800 font-bold block">صافي أرباحك الصافية (85%)</span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {instructorWallet?.availableBalance || walletBalance} <span className="text-[10px] font-sans">ج.م مؤكدة</span>
                </span>
              </div>
            </div>

            {/* 🛡️ ADMIN ONLY: WITHDRAWAL REQUESTS APPROVAL TABLE */}
            {isAdmin && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-black text-sm text-slate-900">مركز مراجعة واعتماد طلبات السحب للمدرسين</h4>
                  </div>
                  <button
                    onClick={loadWithdrawals}
                    disabled={isLoadingWithdrawals}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWithdrawals ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>تحديث الطلبات</span>
                  </button>
                </div>

                {withdrawalsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                    لا توجد طلبات سحب معلقة أو مسجلة حالياً.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {/* 📱 MOBILE STACKED CARDS VIEW */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {withdrawalsList.map((w: any) => {
                        const isPending = w.status === 'pending' || w.status === 'processing';
                        const isApproved = w.status === 'completed' || w.status === 'approved';
                        const isRejected = w.status === 'rejected';

                        return (
                          <div key={w.id} className="p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">
                                {w.profiles?.full_name || w.user_name || w.user_email || 'معلم'}
                              </span>
                              <span className="font-mono font-black text-emerald-600 text-sm">
                                {w.amount} ج.م
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 flex items-center justify-between">
                              <span>{w.payout_method === 'vodafone_cash' ? '📱 فودافون كاش' : (w.payout_method === 'instapay' ? '⚡ إنستاباي' : '🏛️ تحويل بنكي')}</span>
                              <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{w.payout_details}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isApproved ? 'bg-emerald-100 text-emerald-800' : (isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                              }`}>
                                {isApproved ? '✓ تم التحويل' : (isRejected ? '✕ مرفوض' : '⏳ قيد المراجعة')}
                              </span>

                              {isPending && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveWithdrawal(w.id)}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    اعتماد ✓
                                  </button>
                                  <button
                                    onClick={() => handleRejectWithdrawal(w.id)}
                                    className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold"
                                  >
                                    رفض
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 💻 DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">المعلم / الحساب</th>
                            <th className="py-3 px-4">المبلغ</th>
                            <th className="py-3 px-4">طريقة الاستلام</th>
                            <th className="py-3 px-4">بيانات التحويل</th>
                            <th className="py-3 px-4">التاريخ</th>
                            <th className="py-3 px-4">الحالة</th>
                            <th className="py-3 px-4 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {withdrawalsList.map((w: any) => {
                            const isPending = w.status === 'pending' || w.status === 'processing';
                            const isApproved = w.status === 'completed' || w.status === 'approved';
                            const isRejected = w.status === 'rejected';

                            return (
                              <tr key={w.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {w.profiles?.full_name || w.user_name || w.user_email || w.profiles?.email || w.user_id?.substring(0, 8)}
                                </td>
                                <td className="py-3 px-4 font-black font-mono text-emerald-600 text-sm">
                                  {w.amount} ج.م
                                </td>
                                <td className="py-3 px-4 text-slate-700 font-bold">
                                  {w.payout_method === 'vodafone_cash' ? '📱 فودافون كاش / محفظة' : (w.payout_method === 'instapay' ? '⚡ إنستاباي' : '🏛️ تحويل بنكي')}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-800 font-bold select-all bg-slate-50 rounded-lg px-2">
                                  {w.payout_details}
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                  {w.created_at ? new Date(w.created_at).toLocaleDateString('ar-EG') : 'الآن'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                                    isApproved 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : (isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse')
                                  }`}>
                                    {isApproved ? '✓ تم الاعتماد والتحويل' : (isRejected ? '✕ تم الرفض' : '⏳ قيد المراجعة')}
                                  </span>
                                  {w.reference_number && (
                                    <div className="text-[10px] text-emerald-700 font-mono mt-1 font-bold">مرجع: {w.reference_number}</div>
                                  )}
                                  {w.admin_notes && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">{w.admin_notes}</div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {isPending ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleApproveWithdrawal(w.id)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1"
                                        title="اعتماد وتأكيد التحويل"
                                      >
                                        <span>اعتماد ✓</span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectWithdrawal(w.id)}
                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer"
                                        title="رفض وإرجاع الرصيد للمحفظة"
                                      >
                                        <span>رفض ✕</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                                      {isApproved ? 'معتمد ومحوّل ✓' : 'مرفوض ✕'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 🌟 ADMIN MANUAL CREDIT / DEBIT ADJUSTMENT FORM */}
                <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <DollarSign className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="font-black text-sm text-white">تسوية وتعديل رصيد محفظة مستخدم يدوياً</h4>
                      <p className="text-[11px] text-slate-300">يمكنك كمسؤول المنصة إضافة مكافأة أو خصم رصيد لأي بريد إلكتروني مسجل مع تسجيل السبب فورياً.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAdjustCreditSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">البريد الإلكتروني للمستخدم:</label>
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        value={adminTargetEmail}
                        onChange={(e) => setAdminTargetEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder:text-slate-400 focus:bg-white/20 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع العملية:</label>
                      <select
                        value={adminCreditType}
                        onChange={(e) => setAdminCreditType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                      >
                        <option value="credit">➕ شحن / إيداع</option>
                        <option value="debit">➖ خصم / تسوية</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">المبلغ (ج.م):</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={adminCreditAmount}
                        onChange={(e) => setAdminCreditAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-black text-white focus:bg-white/20 outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">سبب المعاملة:</label>
                      <input
                        type="text"
                        required
                        value={adminCreditReason}
                        onChange={(e) => setAdminCreditReason(e.target.value)}
                        placeholder="مكافأة تميز / تسوية رصيد"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder:text-slate-400 focus:bg-white/20 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <button
                        type="submit"
                        disabled={isAdjustingCredit}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        title="تنفيذ التسوية وتحديث الرصيد"
                      >
                        {isAdjustingCredit ? '...' : 'تنفيذ ✓'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 🎓 INSTRUCTOR ONLY: MY WITHDRAWALS STATUS */}
            {!isAdmin && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-black text-sm text-slate-900">متابعة طلبات سحب الأرباح الخاصة بي</h4>
                  </div>
                  <button
                    onClick={loadWithdrawals}
                    disabled={isLoadingWithdrawals}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWithdrawals ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>تحديث</span>
                  </button>
                </div>

                {withdrawalsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                    لم تقم بتقديم أي طلبات سحب أرباح حتى الآن.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {withdrawalsList.map((w: any) => {
                      const isApproved = w.status === 'completed' || w.status === 'approved';
                      const isRejected = w.status === 'rejected';
                      const isPending = w.status === 'pending' || w.status === 'processing';

                      return (
                        <div key={w.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black font-mono text-slate-900 text-sm">{w.amount} ج.م</span>
                              <span className="text-xs text-slate-500 font-bold">عبر {w.payout_method === 'vodafone_cash' ? 'فودافون كاش' : (w.payout_method === 'instapay' ? 'إنستاباي' : 'تحويل بنكي')}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">الحساب المستلم: {w.payout_details}</p>
                            {w.reference_number && (
                              <p className="text-[11px] text-emerald-600 font-bold">رقم مرجع التحويل: {w.reference_number}</p>
                            )}
                            {w.admin_notes && (
                              <p className="text-[11px] text-slate-600 font-bold">ملاحظة الإدارة: {w.admin_notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400">
                              {w.created_at ? new Date(w.created_at).toLocaleDateString('ar-EG') : 'مؤخراً'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              isApproved 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : (isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200')
                            }`}>
                              {isApproved ? '✓ تم التحويل والاعتماد' : (isRejected ? '✕ تم الرفض واسترداد الرصيد' : '⏳ قيد المراجعة')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WALLET TRANSACTIONS TABLE */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <h4 className="font-black text-sm text-slate-900">سجل المعاملات والتحويلات المالية</h4>
              {walletTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
                  لا توجد حركات سحب أو إيداع مسجلة في المحفظة حتى الآن.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {walletTransactions.map((tx, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                          tx.transaction_type === 'refund' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (tx.transaction_type === 'deposit' 
                              ? 'bg-teal-100 text-teal-800' 
                              : 'bg-rose-100 text-rose-800')
                        }`}>
                          {tx.transaction_type === 'refund' ? 'استرداد عمولة' : (tx.transaction_type === 'deposit' ? 'إيداع وشحن' : 'سحب أرباح')}
                        </span>
                        <span className="text-slate-900">{tx.description || 'معاملة مالية'}</span>
                      </div>
                      <div className={`font-mono font-black ${tx.transaction_type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {tx.transaction_type === 'withdrawal' ? `-${tx.amount}` : `+${tx.amount}`} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 RECHARGE WALLET MODAL */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">شحن رصيد المحفظة الفوري</h3>
              </div>
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر أو اكتب مبلغ الشحن (ج.م):</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-black transition border ${
                        rechargeAmount === amt 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {amt} ج.م
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="10"
                  required
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة الدفع والشحن المعتمدة:</label>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-rose-950">المحافظ الإلكترونية (فودافون / أورنج / اتصالات / وي كاش)</h5>
                    <p className="text-[11px] text-rose-800">الدفع المباشر الفوري وإضافة الرصيد لمحفظتك في ثوانٍ 📱</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRechargeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRecharge}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingRecharge ? 'جاري التوجيه للدفع...' : `تأكيد شحن (${rechargeAmount} ج.م) بـ فودافون كاش ✓`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 🌟 WITHDRAWAL PAYOUT MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">طلب سحب الأرباح من المحفظة</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المطلوب سحبه (الرصيد المتاح: <strong>{walletBalance} ج.م</strong>):
                </label>
                <input
                  type="number"
                  min="50"
                  max={walletBalance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة استلام الأرباح:</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                >
                  <option value="vodafone_cash">📱 فودافون كاش / محافظ المحمول الإلكترونية</option>
                  <option value="instapay">⚡ إنستاباي InstaPay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {withdrawMethod === 'vodafone_cash' ? 'رقم محفظة الكاش (010 / 011 / 012 / 015):' : 'عنوان الدفع اللحظي (IPA / Mobile):'}
                </label>
                <input
                  type="text"
                  required
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={withdrawMethod === 'vodafone_cash' ? '010XXXXXXXX' : 'username@instapay'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWithdraw || walletBalance < withdrawAmount || withdrawAmount <= 0}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingWithdraw ? 'جاري الإرسال...' : `تأكيد طلب سحب ${withdrawAmount} ج.م`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎬 TAB 6: REELS STUDIO & GENERATION ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          {/* HEADER CONTROL BAR */}
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-5 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                    🎬
                  </div>
                  <h3 className="text-lg font-black text-slate-900">استوديو صناعة وتوليد الريلز التفاعلية (EduReels Engine)</h3>
                </div>
                <p className="text-xs text-slate-500">
                  توليد فيديوهات ريلز تعليمية بنمط تيك توك 9:16 مع ترجمة كاريوكي حية، كروت منبثقة، واختبار فلاش تفاعلي لكل فصل.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAllReels}
                  disabled={isLoadingReels}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingReels ? 'animate-spin text-purple-600' : ''}`} />
                  <span>تحديث</span>
                </button>
              </div>
            </div>

            {/* SELECTION & BATCH GENERATION CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المذكرة / المقرر:
                </label>
                <select
                  value={reelsBookId}
                  onChange={(e) => setReelsBookId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-500 outline-none cursor-pointer"
                >
                  {visibleBooks.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.chapters?.length || 0} فصول)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  🎙️ صوت المعلق الصوتي:
                </label>
                <select
                  value={reelsVoice}
                  onChange={(e) => setReelsVoice(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="ar-XA-Chirp3-HD-Fenrir">🌟 صوت كريم (طبيعي وواضح)</option>
                  <option value="ar-XA-Chirp3-HD-Aoede">🌟 صوت فرح (تعليمي وهادئ)</option>
                  <option value="ar-XA-Chirp3-HD-Puck">🌟 صوت أحمد (حماسي وتفاعلي)</option>
                  <option value="ar-XA-Chirp3-HD-Kore">🌟 صوت سارة (شرح مبسط)</option>
                  <option value="ar-XA-Chirp3-HD-Charon">🌟 صوت أستاذ محمود (وقور ورزين)</option>
                  <option value="ar-SA-HamedNeural">🇸🇦 حامد (فخم ووقور)</option>
                  <option value="ar-EG-ShakirNeural">🇪🇬 شاكر (مصري دافئ ومفصل)</option>
                  <option value="ar-JO-TaimNeural">🇯🇴 تيم (أردني شبابي)</option>
                  <option value="ar-EG-SalmaNeural">🇪🇬 سلمى (مصرية حيوية)</option>
                  <option value="ar-SA-ZariyahNeural">🇸🇦 زارية (سعودية وثائقية)</option>
                  <option value="ar-AE-HamdanNeural">🇦🇪 حمدان (إماراتي متزن)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  🎨 الستايل البصري الافتراضي:
                </label>
                <select
                  value={reelsGlobalStyle}
                  onChange={(e) => setReelsGlobalStyle(e.target.value as EduReelStyle)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="chalkboard">📐 سبورة وأكاديمي</option>
                  <option value="cyberpunk">🚀 سايبر بانك نيون</option>
                  <option value="cinematic">🎬 سينمائي وثائقي</option>
                  <option value="gamified">🎮 تفاعلي جيمينج</option>
                </select>
              </div>

              <div>
                <button
                  onClick={handleGenerateAllReelsForBook}
                  disabled={isGeneratingAllReels || !selectedReelsBook?.chapters?.length}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingAllReels ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التوليد الذكي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>توليد لكل الفصول بالصوت المختار ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SUMMARY STATS BAR */}
            {selectedReelsBook && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-900 rounded-lg font-bold">
                  إجمالي فصول المذكرة: {selectedReelsBook.chapters?.length || 0}
                </span>
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-bold">
                  الريلز المنشورة: {bookReels.length}
                </span>
                <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-bold">
                  فصول بحاجة لتوليد: {Math.max(0, (selectedReelsBook.chapters?.length || 0) - bookReels.length)}
                </span>
              </div>
            )}
          </div>

          {/* CHAPTERS TABLE / LIST */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-600" />
              <span>فصول المذكرة والتحكم في إخراج وتوليد الريل ({selectedReelsBook?.chapters?.length || 0} فصول)</span>
            </h4>

            {(!selectedReelsBook?.chapters || selectedReelsBook.chapters.length === 0) ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                لا توجد فصول مسجلة في هذه المذكرة حالياً.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {selectedReelsBook.chapters.map((ch: any, idx: number) => {
                  const reel = bookReels.find(r => r.chapter_id === ch.id || r.chapter_id === `ch-${ch.id}` || r.chapter_id === String(ch.id));
                  const isGeneratingThis = generatingChapterId === ch.id;
                  const currentStyle = chapterStyles[ch.id] || reel?.style || 'cyberpunk';
                  const currentVoice = chapterVoices[ch.id] || reel?.voice || reelsVoice;

                  return (
                    <div key={ch.id || idx} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition">
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            {ch.title}
                          </span>
                          {reel ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ريل جاهز ({reel.duration_seconds || 45} ث)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                              لم يتم التوليد بعد
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {ch.content ? ch.content.substring(0, 100) + '...' : 'محتوى الفصل جاهز للمعالجة والتوليد التلقائي.'}
                        </p>
                      </div>

                      {/* CONTROLS */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                        {/* VOICE PICKER */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500">🎙️ الصوت:</span>
                          <select
                            value={currentVoice}
                            onChange={(e) => setChapterVoices(prev => ({ ...prev, [ch.id]: e.target.value }))}
                            className="px-2.5 py-1.5 bg-indigo-50/80 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-950 focus:bg-white outline-none cursor-pointer max-w-[160px] sm:max-w-none"
                            title="اختيار المعلق الصوتي لهذا الفصل"
                          >
                            <optgroup label="🌟 أصوات فائقة النقاء (Chirp 3 HD)">
                              <option value="ar-XA-Chirp3-HD-Fenrir">🌟 صوت كريم (طبيعي وواضح)</option>
                              <option value="ar-XA-Chirp3-HD-Aoede">🌟 صوت فرح (تعليمي وهادئ)</option>
                              <option value="ar-XA-Chirp3-HD-Puck">🌟 صوت أحمد (حماسي وتفاعلي)</option>
                              <option value="ar-XA-Chirp3-HD-Kore">🌟 صوت سارة (شرح مبسط)</option>
                              <option value="ar-XA-Chirp3-HD-Charon">🌟 صوت أستاذ محمود (وقور ورزين)</option>
                            </optgroup>
                            <optgroup label="🎙️ أصوات طبيعية (Edge Neural)">
                              <option value="ar-SA-HamedNeural">🇸🇦 حامد (سعودي فخم)</option>
                              <option value="ar-EG-ShakirNeural">🇪🇬 شاكر (مصري دافئ)</option>
                              <option value="ar-JO-TaimNeural">🇯🇴 تيم (أردني شبابي)</option>
                              <option value="ar-EG-SalmaNeural">🇪🇬 سلمى (مصرية حيوية)</option>
                              <option value="ar-SA-ZariyahNeural">🇸🇦 زارية (سعودية هادئة)</option>
                              <option value="ar-AE-HamdanNeural">🇦🇪 حمدان (إماراتي متزن)</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* STYLE PICKER */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500">الستايل:</span>
                          <select
                            value={currentStyle}
                            onChange={(e) => setChapterStyles(prev => ({ ...prev, [ch.id]: e.target.value as EduReelStyle }))}
                            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                          >
                            <option value="cyberpunk">⚡ سايبربانك (تكنولوجيا)</option>
                            <option value="chalkboard">📐 سبورة (أكاديمي)</option>
                            <option value="cinematic">🎬 سينمائي (وثائقي)</option>
                            <option value="gamified">🎮 تفاعلي (جيمينج)</option>
                          </select>
                        </div>

                        {/* PREVIEW BUTTON */}
                        {reel && (
                          <button
                            onClick={() => setPreviewReel(reel)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                            <span>معاينة</span>
                          </button>
                        )}

                        {/* DOWNLOAD VIDEO BUTTON */}
                        {reel && (
                          <button
                            onClick={() => handleDownloadReelVideo(reel, ch.title)}
                            disabled={exportingReelId === reel.id}
                            className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
                            title="تنزيل فيديو الريل كاملاً بجودة عالية 1080p MP4"
                          >
                            {exportingReelId === reel.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                                <span>جاري التصيير...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-teal-600" />
                                <span>تنزيل MP4</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* GENERATE / REGENERATE BUTTON */}
                        <button
                          onClick={() => handleGenerateSingleChapterReel(ch)}
                          disabled={isGeneratingThis || isGeneratingAllReels}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                            reel
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                          }`}
                        >
                          {isGeneratingThis ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري التوليد...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{reel ? 'إعادة توليد AI' : 'توليد ريل AI ⚡'}</span>
                            </>
                          )}
                        </button>

                        {/* DELETE BUTTON */}
                        {reel && (
                          <button
                            onClick={() => handleDeleteReel(reel.id, ch.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف الريل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB: USERS & STUDENTS/TEACHERS MONITORING & MODERATION */}
      {/* ========================================================================= */}
      {activeTab === 'users' && isAdmin && (
        <UsersManagementTab 
          books={booksList} 
          onLaunchBook={onLaunchBook} 
          onRefreshData={reloadWalletAndData} 
        />
      )}

      {/* ========================================================================= */}
      {/* 🎫 TAB: SUPPORT & COMPLAINTS TICKETS */}
      {/* ========================================================================= */}
      {activeTab === 'support' && isAdmin && (
        <SupportTicketsTab />
      )}

      {/* ========================================================================= */}
      {/* ⚙️ TAB 7: WHITE-LABEL PLATFORM SETTINGS & BRANDING */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && isAdmin && (
        <PlatformSettingsTab />
      )}


      {/* 🌟 PREVIEW MODAL */}
      {previewReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in" dir="rtl">
          <div className="relative flex flex-col items-center">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setPreviewReel(null)}
              className="absolute -top-12 left-0 sm:-left-12 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-black text-lg transition z-50 cursor-pointer"
            >
              ✕
            </button>

            <div className="w-[360px] sm:w-[380px] h-[640px] sm:h-[680px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <EduReelPlayer
                reel={previewReel}
                isActive={true}
                currentUser={currentUser}
                onOpenBook={(bookId, chapterId) => {
                  setPreviewReel(null);
                  if (onLaunchBook) onLaunchBook(bookId);
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminInstructorHub;
