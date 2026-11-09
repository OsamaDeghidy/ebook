import React, { useState } from 'react';
import { 
  ShoppingCart, CheckCircle2, ShieldCheck, Sparkles, X, BookOpen, Radio, 
  HelpCircle, Zap, CreditCard, Lock, Ticket, Smartphone, ArrowRight, 
  AlertCircle, Copy, Check, User, Wallet, Globe
} from 'lucide-react';
import { MarketplaceBook } from '../types';
import { validateVoucherCode } from '../utils/voucherSystem';
import { useLanguage } from '../i18n/LanguageContext';

interface PurchaseModalProps {
  book: MarketplaceBook;
  isOpen: boolean;
  currentUser?: any;
  onClose: () => void;
  onOpenAuth?: () => void;
  onConfirmPurchase: (book: MarketplaceBook) => Promise<void>;
}

type PaymentTab = 'paymob_wallet' | 'wallet' | 'voucher';

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  book,
  isOpen,
  currentUser,
  onClose,
  onOpenAuth,
  onConfirmPurchase
}) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<PaymentTab>('paymob_wallet');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [walletPhone, setWalletPhone] = useState('');
  const [studentBalance, setStudentBalance] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Load user live wallet balance
  React.useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetch(`/api/wallet/balance/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.balance !== undefined) setStudentBalance(data.balance);
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Paymob Mobile Wallet Payment Handler
  const handlePaymobPayment = async (method: 'wallet' = 'wallet') => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    if (!walletPhone.trim() || !/^01[0125][0-9]{8}$/.test(walletPhone.trim())) {
      setStatusNotice('يرجى إدخال رقم محفظة إلكترونية مصري صحيح مكون من 11 رقماً (فودافون/أورنج/اتصالات/وي كاش).');
      return;
    }

    setIsProcessing(true);
    setStatusNotice('جاري إنشاء طلب الدفع وتوجيهك لتأكيد العملية على هاتفك المحمول... 📱');

    try {
      const res = await fetch('/api/payment/paymob/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(book.price) || 150,
          bookId: book.id,
          method: 'wallet',
          walletMobileNumber: walletPhone.trim(),
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userName: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'طالب المنصة'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }

        setStatusNotice(data.message || 'تم إرسال طلب الدفع للمحفظة بنجاح، يرجى تأكيد الدفع عبر هاتفك.');
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
        setStatusNotice(data.error || data.message || 'تعذر بدء عملية الدفع عبر المحفظة. يرجى التحقق من الرقم والمحاولة مرة أخرى.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      setStatusNotice('حدث خطأ في الاتصال بخادم الدفع: ' + (err.message || 'يرجى المحاولة لاحقاً'));
    }
  };

  // Direct Wallet Payment Handler (Using Student Prepaid Wallet Balance)
  const handleWalletPayment = async () => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    const price = Number(book.price) || 150;
    if (studentBalance !== null && studentBalance < price) {
      setStatusNotice(`رصيد محفظتك (${studentBalance} ج.م) غير كافٍ لشراء هذا المقرر (${price} ج.م). يرجى الدفع عبر فودافون كاش أو كروت الشحن.`);
      return;
    }

    setIsProcessing(true);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          bookId: book.id,
          amount: price
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await onConfirmPurchase(book);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsProcessing(false);
          onClose();
        }, 1500);
      } else {
        setIsProcessing(false);
        setStatusNotice(data.error || data.message || 'فشلت عملية الخصم من المحفظة. يرجى التحقق من الرصيد.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusNotice('حدث خطأ أثناء الاتصال بالخادم: ' + (err.message || 'يرجى المحاولة لاحقاً'));
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);

    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      onClose();
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          bookId: book.id,
          userId: currentUser?.id,
          userEmail: currentUser?.email
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsProcessing(false);
        setVoucherError(data.message || 'كود الكارت غير صحيح أو تم استخدامه مسبقاً');
        return;
      }

      await onConfirmPurchase(book);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsProcessing(false);
      setVoucherError('حدث خطأ أثناء التحقق من الكارت: ' + (err.message || 'يرجى المحاولة لاحقاً'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" dir={dir}>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* MODAL HEADER */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              الدفع الإلكتروني الآمن
            </span>
            <h3 className="font-black text-slate-900 text-base line-clamp-1 mt-0.5">
              تفعيل وشراء: {book.title}
            </h3>
          </div>
        </div>

        {/* BOOK SUMMARY CARD */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={book.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=150&q=80'}
              alt={book.title}
              className="w-12 h-14 object-cover rounded-xl border border-slate-200"
            />
            <div>
              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{book.title}</h4>
              <p className="text-[11px] text-slate-500">{book.author_name || 'د. كريم كامل'}</p>
            </div>
          </div>
          <div className="text-left">
            <span className="text-xs text-slate-400 block font-medium">السعر المطلوب</span>
            <span className="text-lg font-black text-rose-600">{book.price || 150} ج.م</span>
          </div>
        </div>

        {/* AUTH NOTICE IF NOT LOGGED IN */}
        {!currentUser && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>يجب تسجيل الدخول لربط المقرر بحسابك الدائم</span>
            </div>
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black cursor-pointer"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        )}

        {/* 🌟 PAYMENT METHODS TABS (3 Methods: Electronic Wallet, Wallet Balance, Voucher Card) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('paymob_wallet')}
            className={`py-2 px-2 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'paymob_wallet' ? 'bg-white text-rose-900 shadow-xs font-black border border-rose-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-rose-600" />
            <span className="text-[11px]">📱 فودافون كاش</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-2 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'wallet' ? 'bg-white text-emerald-800 shadow-xs font-black border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px]">💰 المحفظة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voucher')}
            className={`py-2 px-2 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'voucher' ? 'bg-white text-amber-900 shadow-xs font-black border border-amber-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-600" />
            <span className="text-[11px]">🎟️ كارت سنتر</span>
          </button>
        </div>

        {/* SUCCESS NOTIFICATION */}
        {isSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center space-y-1 my-4 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-black text-sm">تم الدفع وتفعيل وفتح المقرر بنجاح! 🎉</h4>
            <p className="text-xs">جاري تحويلك لقارئ المقرر التفاعلي...</p>
          </div>
        )}

        {/* TAB 1: PAYMOB MOBILE WALLETS */}
        {activeTab === 'paymob_wallet' && !isSuccess && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl space-y-1 text-xs text-rose-950">
              <div className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <span>الدفع عبر المحافظ الإلكترونية (فودافون / أورنج / اتصالات / وي كاش):</span>
              </div>
              <p className="text-[11px] text-rose-800">
                أدخل رقم الموبايل المسجل به المحفظة، وسيصلك طلب سحب المبلغ لتأكيده بالرقم السري فوراً.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم محفظة الكاش (01xxxxxxxxx):
              </label>
              <input
                type="tel"
                required
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white"
              />
            </div>

            {statusNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                {statusNotice}
              </div>
            )}

            <button
              onClick={() => handlePaymobPayment('wallet')}
              disabled={isProcessing}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري معالجة الدفع عبر المحفظة...' : `دفع (${book.price || 150} ج.م) وتفعيل المقرر 📱`}
            </button>
          </div>
        )}

        {/* TAB 2: DIRECT WALLET BALANCE CHECKOUT */}
        {activeTab === 'wallet' && !isSuccess && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
              <div className="font-black flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>الشراء الفوري من رصيد المحفظة</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black">
                  رصيدك: {studentBalance !== null ? `${studentBalance} ج.م` : 'جاري التحميل...'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                سيتم خصم سعر المقرر ({book.price || 150} ج.م) مباشرة من محفظتك وتفعيل الوصول الدائم فوراً.
              </p>
            </div>

            {statusNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                {statusNotice}
              </div>
            )}

            <button
              onClick={handleWalletPayment}
              disabled={isProcessing || (studentBalance !== null && studentBalance < (book.price || 150))}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري الخصم والتفعيل...' : `دفع (${book.price || 150} ج.م) من رصيد المحفظة فوراً ⚡`}
            </button>
          </div>
        )}

        {/* TAB 3: VOUCHER CODE */}
        {activeTab === 'voucher' && !isSuccess && (
          <form onSubmit={handleRedeemVoucher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أدخل كود كارت الشحن (المطبوع بالسنتر أو المكتبة):
              </label>
              <input
                type="text"
                required
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="مثال: OSR-8K21-9421"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-slate-900 uppercase focus:bg-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">كود تجريبي VIP: <strong className="text-sky-600 font-mono">OSERA-2026-VIP</strong></p>
            </div>

            {voucherError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{voucherError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'جاري التحقق من الكارت...' : 'تفعيل الكارت وفتح المقرر الآن ✓'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default PurchaseModal;
