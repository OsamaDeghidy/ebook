import React, { useState } from 'react';
import { 
  HelpCircle, MessageSquare, Send, X, AlertCircle, CheckCircle2, 
  Phone, Mail, User, ShieldAlert, Sparkles, Clock, FileText, 
  Paperclip, ExternalLink, Lightbulb, CreditCard, Bug, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  userRole?: string;
}

export type TicketCategory = 'technical' | 'payment_wallet' | 'feature_request' | 'content_report' | 'general';
export type TicketPriority = 'normal' | 'medium' | 'urgent';

const CATEGORIES: Array<{ id: TicketCategory; label: string; icon: any; desc: string; color: string }> = [
  {
    id: 'technical',
    label: 'مشكلة فنية أو تقنية',
    icon: Bug,
    desc: 'مشكلة في تشغيل الكتب، الصوت، البودكاست، أو الاختبارات',
    color: 'text-rose-500 bg-rose-50 border-rose-200'
  },
  {
    id: 'payment_wallet',
    label: 'مشكلة دفع أو رصيد محفظة',
    icon: CreditCard,
    desc: 'استفسار عن الشحن، كروت السنتر، أو سحب الأرباح',
    color: 'text-emerald-500 bg-emerald-50 border-emerald-200'
  },
  {
    id: 'feature_request',
    label: 'اقتراح ميزة أو تطوير',
    icon: Lightbulb,
    desc: 'أفكار جديدة لتحسين تجربة المعلم أو الطالب بالمنصة',
    color: 'text-amber-500 bg-amber-50 border-amber-200'
  },
  {
    id: 'content_report',
    label: 'بلاغ عن محتوى أو مخالفة',
    icon: AlertTriangle,
    desc: 'تقرير عن حقوق ملكية أو محتوى غير ملائم',
    color: 'text-purple-500 bg-purple-50 border-purple-200'
  },
  {
    id: 'general',
    label: 'استفسار أو مساعدة عامة',
    icon: HelpCircle,
    desc: 'أسئلة حول كيفية استخدام المنصة والميزات',
    color: 'text-sky-500 bg-sky-50 border-sky-200'
  }
];

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userRole = 'student'
}) => {
  const { t, dir } = useLanguage();
  const [fullName, setFullName] = useState(
    currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || ''
  );
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(
    currentUser?.user_metadata?.phone || ''
  );
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !phoneWhatsapp.trim() || !message.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول الإلزامية (الاسم، البريد، رقم الواتساب، وتفاصيل الشكوى).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_whatsapp: phoneWhatsapp.trim(),
          category,
          priority,
          subject: subject.trim() || undefined,
          message: message.trim(),
          attachment_url: attachmentUrl.trim() || undefined,
          user_id: currentUser?.id,
          role: userRole
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إرسال التذكرة، يرجى المحاولة مرة أخرى.');
      }

      setSubmittedTicket(data.ticket);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء إرسال الشكوى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setSubject('');
    setMessage('');
    setAttachmentUrl('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto animate-fade-in" dir={dir}>
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-teal-700 via-indigo-900 to-teal-800 p-6 text-white relative">
          <button
            onClick={handleResetAndClose}
            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
              🎫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">مركز الشكاوى والمقترحات والدعم الفني</h2>
                <span className="px-2 py-0.5 bg-teal-400/20 text-teal-200 border border-teal-400/30 rounded-full text-[10px] font-black">
                  دعم مباشر 24/7
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-1 font-medium">
                نحن هنا لمساعدتك! ترحل تذكرتك فوراً إلى غرفة عمليات الإدارة للمتابعة السريعة.
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6">
          {submittedTicket ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="text-center py-8 space-y-5 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 text-3xl">
                ✓
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">تم استلام طلبك / شكواك بنجاح!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  شكراً لتواصلك معنا. تم ترحيل الشكوى إلى فريق الإدارة تحت الرقم المرجعي التالي:
                </p>
                <div className="inline-block px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-sm font-black text-slate-800 mt-2">
                  #{submittedTicket.id}
                </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 max-w-lg mx-auto text-right space-y-2">
                <div className="flex items-center gap-2 font-black">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>خطوات المتابعة القادمة:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-teal-800 text-[11px] font-medium pr-2">
                  <li>سيقوم مشرف الدعم الفني بمراجعة الشكوى وتفاصيلها.</li>
                  <li>سيتم التواصل معك مباشرة عبر الواتساب على الرقم: <strong>{submittedTicket.phone_whatsapp}</strong> أو عبر البريد.</li>
                  <li>يمكنك الاستفسار عن حالة التذكرة في أي وقت بذكر الرقم المرجعي أعلاه.</li>
                </ul>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. CATEGORY SELECTION */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 block">
                  1. اختر نوع الشكوى أو الطلب:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-right transition flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border shrink-0 ${cat.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-xs font-black ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {cat.label}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium leading-snug mt-0.5">
                            {cat.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CONTACT INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>الاسم الكامل: <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>البريد الإلكتروني: <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رقم الهاتف / الواتساب: <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* 3. PRIORITY & SUBJECT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    عنوان الشكوى / الموضوع المختصر:
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: مشكلة في توليد أسئلة الفصل الثالث لمادة الكيمياء"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    درجة الأهمية:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="normal">🟢 عادية (استفسار/اقتراح)</option>
                    <option value="medium">🟡 متوسطة (مشكلة متكررة)</option>
                    <option value="urgent">🔴 عاجلة (توقف خدمة أو دفع)</option>
                  </select>
                </div>
              </div>

              {/* 4. DETAILS / MESSAGE */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>تفاصيل الشكوى أو الاقتراح: <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400">اشرح المشكلة بالتفصيل لمساعدتك أسرع</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اشرح المشكلة أو الفكرة بوضوح، مع ذكر أي تفاصيل مثل اسم المذكرة، رقم الحركة، أو نص رسالة الخطأ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              {/* 5. ATTACHMENT / LINK (OPTIONAL) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>رابط صورة أو لقطة شاشة للخطأ (اختياري):</span>
                </label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://imgur.com/... أو رابط الصورة المرفقة"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none text-left"
                  dir="ltr"
                />
              </div>

              {/* FOOTER ACTIONS & SUBMISSION */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 font-medium">
                  🔒 جميع بياناتك محمية وتصل حصرياً لمشرفي الدعم الفني والإدارة.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-full sm:w-auto cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال الشكوى للإدارة الآن 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
