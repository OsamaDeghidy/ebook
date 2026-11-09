import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Scale, FileText, 
  X, CheckCircle2, Lock, ExternalLink, Mail, Ban
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false
}) => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<'copyright' | 'terms' | 'privacy' | 'takedown'>('copyright');
  const [hasAgreed, setHasAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir={dir}>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-start">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>شروط الاستخدام والسياسات القانونية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  SaaS Compliance
                </span>
              </h2>
              <p className="text-xs text-slate-400">اتفاقية الاستخدام وإخلاء المسؤولية وحماية الملكية الفكرية</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-950/40 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('copyright')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'copyright'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>إخلاء المسؤولية والملكية الفكرية</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>شروط الاستخدام العامة</span>
          </button>
          <button
            onClick={() => setActiveTab('takedown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'takedown'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>الإبلاغ وحذف المحتوى المخالف</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          
          {/* TAB 1: COPYRIGHT & SAFE HARBOR */}
          {activeTab === 'copyright' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-black text-amber-300 text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>بند الحماية القانونية وإخلاء مسؤولية المنصة (DMCA & Safe Harbor)</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-200/90">
                  منصة **EduReels** هي مزود خدمة تقني واستضافة وسيطة (Neutral Tech Platform & SaaS Provider)، تقدم أدوات الذكاء الاصطناعي للمساعدة في تلخيص وتسهيل استيعاب المواد التعليمية.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>1. مسؤولية المعلم والمستخدم الحصرية:</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    يتحمل المعلم أو المستخدم المسجل المسؤولية القانونية والجنائية والمدنية الكاملة والحصرية عن أي كتب، أو مستندات PDF، أو نصوص، أو محتوى تعليمي يقوم برفعه، أو معالجته، أو بيعه، أو مشاركته عبر المنصة.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>2. عدم ملكية المنصة للمحتوى المرفوع:</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    المنصة لا تدّعي ملكية أي محتوى يرفعه المستخدم، ولا تتحمل أي تبعات ناتجة عن انتهاك حقوق الطبع والنشر أو الملكية الفكرية لطرف ثالث قام به أي حساب.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>3. حق الحذف الفوري وتجميد الحسابات:</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    تحتفظ إدارة المنصة بالحق الكامل وغير المشروط في الحذف الفوري لأي كتاب أو محتوى يتم الإبلاغ عنه، أو يثبت انتهاكه لحقوق النشر، مع إمكانية إيقاف أو تجميد حساب المستخدم المخالف دون أدنى مسؤولية مالية أو قانونية على المنصة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL SAAS TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <h4 className="font-bold text-white text-xs">1. أمان الحساب والبيانات:</h4>
                  <p className="text-xs text-slate-300">
                    أنت مسؤول عن الحفاظ على سرية بيانات تسجيل دخولك وعن كافة الأنشطة التي تتم من خلال حسابك.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <h4 className="font-bold text-white text-xs">2. الاستخدام المقبول:</h4>
                  <p className="text-xs text-slate-300">
                    يحظر استخدام المنصة لأي أغراض تخريبية، مثل محاولات استنزاف واجهات برمجة التطبيقات (API Quota Draining)، أو الهندسة العكسية للخدمة، أو نشر محتوى مسيء أو غير لائق.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <h4 className="font-bold text-white text-xs">3. حدود المسؤولية (Limitation of Liability):</h4>
                  <p className="text-xs text-slate-300">
                    يتم تقديم الخدمات "كما هي" دون أي ضمانات صريحة أو ضمنية بخصوص استمرارية الخدمة بنسبة 100% أو دقة المخرجات التوليدية للذكاء الاصطناعي بنسبة مطلقة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAKEDOWN / REPORTING */}
          {activeTab === 'takedown' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 text-rose-200">
                <div className="flex items-center gap-2 font-black text-rose-300 text-xs sm:text-sm">
                  <Ban className="w-4 h-4" />
                  <span>سياسة الاستجابة السريعة لبلاغات حقوق الملكية (Takedown Notice)</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  إذا كنت مالكاً أصلياً لكتاب أو مادة علمية وتعتبر أن هناك مستخدماً قام برفعها دون ترخيص، نلتزم بحذف المحتوى خلال مدة أقصاها 24 ساعة من تاريخ استلام البلاغ.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs">خطوات تقديم البلاغ:</h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>إرسال رابط الكتاب أو عنوانه داخل المنصة.</li>
                  <li>إثبات ملكية الحقوق الفكرية أو التوكيل الرسمي.</li>
                  <li>إرسال البيانات إلى بريد الدعم القانوني المخصص:</li>
                </ul>
                <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-between text-sky-300 text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>legal@edureels.ai</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">فريق الامتثال القانوني</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {showAcceptButton ? (
            <div className="w-full flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>لقد قرأت ووافقت على الشروط وسياسة الملكية الفكرية</span>
              </label>

              <button
                disabled={!hasAgreed}
                onClick={() => {
                  if (hasAgreed && onAccept) onAccept();
                  onClose();
                }}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  hasAgreed
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>موافق ومتابعة</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TermsOfUseModal;
