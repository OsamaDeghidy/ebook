import React, { useState } from 'react';
import { X, Save, BookOpen, Layers, Calendar, GraduationCap, Tag, DollarSign, Image, Sparkles, School, Building2 } from 'lucide-react';
import { MarketplaceBook, BookCategory, BookTrack } from '../types';
import { 
  MAIN_CATEGORIES, 
  EDUCATION_LEVELS, 
  ACADEMIC_SYSTEMS, 
  ACADEMIC_SUBJECTS, 
  GENERAL_SUBJECTS, 
  UNIVERSITY_FACULTIES, 
  SEMESTERS, 
  ACADEMIC_YEARS, 
  getGradesForSystem 
} from '../constants/taxonomy';
import { useLanguage } from '../i18n/LanguageContext';

// Re-export for compatibility
export { ACADEMIC_SUBJECTS, GENERAL_SUBJECTS, SEMESTERS, ACADEMIC_YEARS };
export const SUBCATEGORIES = GENERAL_SUBJECTS;
export const GRADE_LEVELS = getGradesForSystem('pre_university', 'general_arabic');
export const BOOK_TRACKS: { id: BookTrack; label: string }[] = [
  { id: 'academic', label: 'مناهج دراسية ومقررات تعليمية' },
  { id: 'self_help', label: 'تطوير الذات والمهارات القيادية' },
  { id: 'business_finance', label: 'المالية والأعمال والاستثمار' },
  { id: 'programming_tech', label: 'البرمجة وهندسة البرمجيات والذكاء الاصطناعي' },
  { id: 'science_math', label: 'الرياضيات والعلوم والفيزياء' },
  { id: 'languages', label: 'اللغات والترجمة والأدب' },
  { id: 'general_literature', label: 'كتب عامة وروايات وفكر عالمي' }
];

interface EditBookModalProps {
  isOpen: boolean;
  book: MarketplaceBook | null;
  onClose: () => void;
  onSave: (updatedBook: MarketplaceBook) => Promise<void>;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  book,
  onClose,
  onSave
}) => {
  const { dir, t } = useLanguage();
  if (!isOpen || !book) return null;

  const [title, setTitle] = useState(book.title || '');
  const [description, setDescription] = useState(book.description || '');
  const [authorName, setAuthorName] = useState(book.author_name || 'د. كريم كامل');
  const [category, setCategory] = useState<BookCategory>(book.category || 'academic_curriculum');
  
  // Cascading Academic states
  const [educationLevel, setEducationLevel] = useState<string>(book.education_level || 'pre_university');
  const [academicSystem, setAcademicSystem] = useState<string>(book.academic_system || 'general_arabic');
  const [gradeLevel, setGradeLevel] = useState<string>(book.grade_level || 'الصف الأول الثانوي');
  const [subcategory, setSubcategory] = useState(book.subcategory || ACADEMIC_SUBJECTS[0]);
  const [universityFaculty, setUniversityFaculty] = useState(book.subcategory || UNIVERSITY_FACULTIES[0]);
  const [semester, setSemester] = useState(book.semester || SEMESTERS[0]);
  const [academicYear, setAcademicYear] = useState(book.academic_year || ACADEMIC_YEARS[0]);
  
  const [externalUrl, setExternalUrl] = useState(book.external_url || '');
  const [tagsInput, setTagsInput] = useState((book.tags || []).filter(t => !t.includes(':')).join(', '));
  const [price, setPrice] = useState<number>(book.price || 0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>(() => {
    if (book.preview_video_url) return book.preview_video_url;
    const vTag = book.tags?.find(t => t.startsWith('video:'));
    return vTag ? vTag.replace('video:', '') : '';
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(book.thumbnail_url || '');
  const [showPodcast, setShowPodcast] = useState(book.feature_toggles?.show_podcast !== false);
  const [showFlashcards, setShowFlashcards] = useState(book.feature_toggles?.show_flashcards !== false);
  const [showSandbox, setShowSandbox] = useState(book.feature_toggles?.show_sandbox !== false);
  const [showQuiz, setShowQuiz] = useState(book.feature_toggles?.show_quiz !== false);
  const [showMindmap, setShowMindmap] = useState(book.feature_toggles?.show_mindmap !== false);
  const [showVideos, setShowVideos] = useState(book.feature_toggles?.show_videos !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState<string>(book.language || 'ar');
  const [isLanguageLearning, setIsLanguageLearning] = useState<boolean>(Boolean(book.is_language_learning));
  const [targetLearningLanguage, setTargetLearningLanguage] = useState<string>(book.target_learning_language || 'it');

  const isAcademic = category === 'academic_curriculum' || book.track === 'academic';

  const handleEducationLevelChange = (level: string) => {
    setEducationLevel(level);
    const validGrades = getGradesForSystem(level, academicSystem);
    if (validGrades.length > 0) setGradeLevel(validGrades[0]);
  };

  const handleAcademicSystemChange = (system: string) => {
    setAcademicSystem(system);
    const validGrades = getGradesForSystem(educationLevel, system);
    if (validGrades.length > 0) setGradeLevel(validGrades[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanTags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const activeSubcategory = isAcademic 
        ? (educationLevel === 'university' ? universityFaculty : subcategory)
        : subcategory;

      const structuredTags = [
        ...cleanTags,
        `track:${isAcademic ? 'academic' : 'general_literature'}`,
        `sub:${activeSubcategory}`,
        `grade:${gradeLevel}`,
        `term:${semester}`,
        `year:${academicYear}`,
        ...(previewVideoUrl.trim() ? [`video:${previewVideoUrl.trim()}`] : [])
      ];

      const updated: MarketplaceBook = {
        ...book,
        title,
        description,
        author_name: authorName,
        category,
        track: isAcademic ? 'academic' : 'general_literature',
        education_level: isAcademic ? educationLevel : undefined,
        academic_system: isAcademic ? (educationLevel === 'university' ? 'تعليم جامعي' : academicSystem) : undefined,
        subcategory: activeSubcategory,
        grade_level: gradeLevel,
        semester,
        academic_year: academicYear,
        tags: structuredTags,
        price: Number(price) || 0,
        external_url: book.is_external ? externalUrl.trim() : book.external_url,
        preview_video_url: previewVideoUrl.trim() || undefined,
        thumbnail_url: thumbnailUrl || book.thumbnail_url,
        language,
        is_language_learning: isLanguageLearning,
        target_learning_language: isLanguageLearning ? targetLearningLanguage : undefined,
        feature_toggles: {
          show_podcast: showPodcast,
          show_flashcards: showFlashcards,
          show_sandbox: showSandbox,
          show_quiz: showQuiz,
          show_mindmap: showMindmap,
          show_videos: showVideos
        }
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التعديلات: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" dir={dir}>
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl my-auto animate-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">تعديل بيانات وتصنيف المقرر</h3>
              <p className="text-[11px] text-gray-500 font-medium">تخصيص التصنيف، الأسعار، والميزات التفاعلية</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* TITLE & AUTHOR & CATEGORY ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-gray-700 mb-1">عنوان المقرر</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-700 mb-1">اسم المؤلف أو المعلم</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* CATEGORY & DESCRIPTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black text-gray-700 mb-1">قسم المكتبة (10 أقسام)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 cursor-pointer"
              >
                {MAIN_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-gray-700 mb-1">وصف موجز للمقرر</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="نبذة سريعة عن المحتوى..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* 💰 COMPACT PRICE & VIDEO PREVIEW */}
          <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>تسعير المقرر (0 = مجاني)</span>
              </span>
              <div className="flex items-center gap-1">
                {[0, 50, 100, 150].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setPrice(preset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      price === preset
                        ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {preset === 0 ? 'مجاني' : `${preset} ج.م`}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                placeholder="السعر بالجنيه المصري"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-teal-500"
              />
              <input
                type="url"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="رابط فيديو يوتيوب تمهيدي (اختياري)..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* 🌐 COMPACT LANGUAGE & COURSE SETTINGS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">اللغة الأساسية للمقرر</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="ar">🇪🇬 العربية (Arabic)</option>
                <option value="en">🇬🇧 English (الإنجليزية)</option>
                <option value="it">🇮🇹 Italiano (الإيطالية)</option>
                <option value="fr">🇫🇷 Français (الفرنسية)</option>
                <option value="de">🇩🇪 Deutsch (الألمانية)</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition w-full select-none">
                <input
                  type="checkbox"
                  checked={isLanguageLearning}
                  onChange={(e) => setIsLanguageLearning(e.target.checked)}
                  className="w-3.5 h-3.5 text-teal-600 rounded-sm focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">دورة لتعليم اللغات (شرح ثنائي) 🎓</span>
              </label>
            </div>
          </div>

          {/* DYNAMIC ACADEMIC TAXONOMY */}
          {isAcademic ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                  <span>الهيكلية الأكاديمية والمرحلة</span>
                </span>
                <div className="flex items-center gap-1">
                  {EDUCATION_LEVELS.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => handleEducationLevelChange(lvl.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        educationLevel === lvl.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {educationLevel === 'pre_university' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">مسار التعليم</label>
                      <select
                        value={academicSystem}
                        onChange={(e) => handleAcademicSystemChange(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        {ACADEMIC_SYSTEMS.map((sys) => (
                          <option key={sys.id} value={sys.id}>{sys.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الصف الدراسي</label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        {getGradesForSystem('pre_university', academicSystem).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الكلية / التخصص</label>
                      <select
                        value={universityFaculty}
                        onChange={(e) => setUniversityFaculty(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        {UNIVERSITY_FACULTIES.map((fac) => (
                          <option key={fac} value={fac}>{fac}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الفرقة</label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      >
                        {getGradesForSystem('university').map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">المادة</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  >
                    {ACADEMIC_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الفصل / الطبعة</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">الموضوع الفرعي</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                  {GENERAL_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">المستوى والجمهور</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                >
                  <option value="عام / للقراء والمهتمين ورواد الأعمال">عام / للقراء والمهتمين ورواد الأعمال</option>
                  <option value="مستوى مبتدئ / تأسيسي">مستوى مبتدئ / تأسيسي</option>
                  <option value="مستوى متوسط وتطبيقي">مستوى متوسط وتطبيقي</option>
                  <option value="مستوى متقدم وتخصصي">مستوى متقدم وتخصصي</option>
                </select>
              </div>
            </div>
          )}

          {/* COMPACT FEATURE TOGGLES */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <span className="text-[11px] font-black text-slate-800 block">
              الأقسام المفعلة في المقرر (Feature Toggles):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
              {[
                { label: '🎙️ البودكاست الحواري', state: showPodcast, setter: setShowPodcast },
                { label: '📇 بطاقات المراجعة', state: showFlashcards, setter: setShowFlashcards },
                { label: '🧪 المختبر والتطبيقات', state: showSandbox, setter: setShowSandbox },
                { label: '📝 بنك الأسئلة والتمارين', state: showQuiz, setter: setShowQuiz },
                { label: '🗺️ خريطة المفاهيم', state: showMindmap, setter: setShowMindmap },
                { label: '🎬 الفيديوهات التعليمية', state: showVideos, setter: setShowVideos },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-[11px] font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات في المكتبة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
