import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Award, BookOpen, Star, Users, ArrowRight, Share2, 
  CheckCircle2, ExternalLink, Mail, Phone, Calendar, Edit3, Plus, Sparkles, X, Check
} from 'lucide-react';
import { MarketplaceBook, UserRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface InstructorProfileRouteProps {
  books: MarketplaceBook[];
  currentUser?: any;
  userRole?: UserRole;
  isAdminMode?: boolean;
  onOpenCreateModal?: () => void;
  onOpenAuthModal?: () => void;
}

export default function InstructorProfileRoute({ 
  books,
  currentUser,
  userRole,
  isAdminMode,
  onOpenCreateModal
}: InstructorProfileRouteProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dir, t } = useLanguage();

  const decodedId = decodeURIComponent(id || '');

  // Match instructor by author_name, author_id, or user_id
  const instructorBooks = books.filter(b => 
    b.author_name?.toLowerCase() === decodedId.toLowerCase() ||
    b.author_id === decodedId ||
    (b as any).user_id === decodedId
  );

  const initialName = instructorBooks.length > 0 ? (instructorBooks[0].author_name || decodedId) : (decodedId || 'المعلم المعتمد');
  const [instructorName, setInstructorName] = useState(initialName);
  const [instructorBio, setInstructorBio] = useState('معلم ومعد مناهج رقمية تفاعلية معتمد لدى المنصة. متخصص في تبسيط وشرح المقررات الدراسية، وإعداد بنوك الأسئلة وبطاقات الاستذكار السريع للطلاب.');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnerOrAdmin = Boolean(
    isAdminMode || 
    userRole === 'admin' || 
    (userRole === 'instructor' && (currentUser?.user_metadata?.full_name === instructorName || currentUser?.email?.includes(decodedId)))
  );

  const totalChapters = instructorBooks.reduce((acc, b) => acc + (b.chapters?.length || 0), 0);
  const averageRating = 4.9;
  const estimatedStudents = Math.max(120, instructorBooks.length * 280);

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمتجر الرئيسي</span>
          </button>

          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>تعديل بيانات البروفايل ✏️</span>
                </button>

                {onOpenCreateModal && (
                  <button
                    onClick={onOpenCreateModal}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>رفع مقرر لهذا المعلم 📤</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `بروفايل المعلم: ${instructorName}`,
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('تم نسخ رابط بروفايل المعلم إلى الحافظة ✓');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>مشاركة</span>
            </button>
          </div>
        </div>

        {/* 🎓 INSTRUCTOR HERO BANNER */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 z-10 relative text-center md:text-start">
            {/* Avatar Initial Circle */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-teal-500 to-indigo-600 p-1 shadow-2xl shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-3xl sm:text-4xl font-black text-teal-300">
                {instructorName.charAt(0)}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مُعلّم معتمد في المنصة</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{averageRating} تقييم عام</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white">{instructorName}</h1>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                {instructorBio}
              </p>

              {/* Quick Key Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 max-w-md mx-auto md:mx-0">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <span className="text-lg sm:text-xl font-black text-teal-300 block">{instructorBooks.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold">مقررات منشورة</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <span className="text-lg sm:text-xl font-black text-indigo-300 block">{totalChapters}</span>
                  <span className="text-[10px] text-slate-400 font-bold">فصول تفاعلية</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <span className="text-lg sm:text-xl font-black text-amber-300 block">+{estimatedStudents}</span>
                  <span className="text-[10px] text-slate-400 font-bold">طالب مسجل</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📚 INSTRUCTOR'S PUBLISHED COURSES & BOOKS */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                المقررات والمذكرات الدراسية للمعلم ({instructorBooks.length})
              </h2>
            </div>
          </div>

          {instructorBooks.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-700">لم يتم العثور على مقررات مخصصة لهذا المعلم حالياً</h3>
              <p className="text-xs text-slate-400">تصفح المقررات الأخرى في المتجر الرئيسي</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-teal-500 transition"
              >
                تصفح كل الكتب
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-teal-300 transition-all flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black">
                        {book.category || 'مقرر تعليمي'}
                      </span>
                      <span className="text-xs font-black text-emerald-600">
                        {book.price === 0 ? 'مجاني' : `${book.price} ج.م`}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 line-clamp-2">
                      {book.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {book.description || 'مقرر دراسي متكامل يشمل شروحات تفاعلية، بودكاست، بطاقات استذكار، وبنوك أسئلة شاملة.'}
                    </p>

                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                      <span>📖 {book.chapters?.length || 0} فصول</span>
                      <span>•</span>
                      <span>⭐ {book.rating || 5}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Link
                      to={`/book/${book.id}`}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition"
                    >
                      <span>فتح المقرر الدراسي</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✏️ EDIT INSTRUCTOR PROFILE MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" dir={dir}>
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900">تعديل بيانات بروفايل المعلم</h4>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">الاسم الظاهر للمعلم:</label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">النبذة التعريفية والتخصص:</label>
                  <textarea
                    value={instructorBio}
                    onChange={(e) => setInstructorBio(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                  >
                    حفظ التعديلات 💾
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
