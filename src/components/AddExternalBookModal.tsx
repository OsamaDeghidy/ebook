import React, { useState } from 'react';
import { X, Link2, BookOpen, DollarSign, Image as ImageIcon, Tag, User, GraduationCap, BookMarked, Sparkles, School, Building2 } from 'lucide-react';
import { BookCategory, BookTrack } from '../types';
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

interface AddExternalBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookData: {
    title: string;
    description: string;
    authorName: string;
    category: BookCategory;
    track?: BookTrack;
    education_level?: string;
    academic_system?: string;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    tags: string[];
    price: number;
    externalUrl: string;
    thumbnailUrl: string;
    previewVideoUrl?: string;
    language?: string;
    is_language_learning?: boolean;
    target_learning_language?: string;
  }) => void;
}

export const AddExternalBookModal: React.FC<AddExternalBookModalProps> = ({
  isOpen,
  onClose,
  onAddBook
}) => {
  const { dir, t } = useLanguage();
  const [isAcademicMode, setIsAcademicMode] = useState<boolean>(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('د. كريم كامل');
  const [language, setLanguage] = useState<string>('ar');
  const [isLanguageLearning, setIsLanguageLearning] = useState<boolean>(false);
  const [targetLearningLanguage, setTargetLearningLanguage] = useState<string>('it');
  
  // Cascading Academic metadata states
  const [educationLevel, setEducationLevel] = useState<string>('pre_university');
  const [academicSystem, setAcademicSystem] = useState<string>('general_arabic');
  const [gradeLevel, setGradeLevel] = useState<string>('الصف الأول الثانوي');
  const [subcategory, setSubcategory] = useState<string>(ACADEMIC_SUBJECTS[0]);
  const [universityFaculty, setUniversityFaculty] = useState<string>(UNIVERSITY_FACULTIES[0]);
  const [semester, setSemester] = useState<string>(SEMESTERS[0]);
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]);

  // General Library metadata states (9 Non-academic Categories)
  const [generalCategory, setGeneralCategory] = useState<BookCategory>('programming_ai');
  const [generalSubcategory, setGeneralSubcategory] = useState<string>(GENERAL_SUBJECTS[0]);
  const [generalAudience, setGeneralAudience] = useState<string>('عام / للقراء والمهتمين ورواد الأعمال');
  
  const [tagsInput, setTagsInput] = useState('كتاب_رقمي, مرجع_تعليمي');
  const [price, setPrice] = useState<number>(0);
  const [externalUrl, setExternalUrl] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    const activeSubcategory = isAcademicMode 
      ? (educationLevel === 'university' ? universityFaculty : subcategory)
      : generalSubcategory;

    const activeGrade = isAcademicMode ? gradeLevel : generalAudience;
    const activeSemester = isAcademicMode ? semester : 'كتاب عام مستمر';

    const structuredTags = [
      ...cleanTags,
      `track:${isAcademicMode ? 'academic' : 'general_literature'}`,
      `sub:${activeSubcategory}`,
      `grade:${activeGrade}`,
      `term:${activeSemester}`,
      `year:${academicYear}`,
      ...(previewVideoUrl.trim() ? [`video:${previewVideoUrl.trim()}`] : [])
    ];

    onAddBook({
      title,
      description,
      authorName,
      category: isAcademicMode ? 'academic_curriculum' : generalCategory,
      track: isAcademicMode ? 'academic' : 'general_literature',
      education_level: isAcademicMode ? educationLevel : undefined,
      academic_system: isAcademicMode ? (educationLevel === 'university' ? 'تعليم جامعي' : academicSystem) : undefined,
      subcategory: activeSubcategory,
      grade_level: activeGrade,
      semester: activeSemester,
      academic_year: academicYear,
      tags: structuredTags,
      price: Number(price) || 0,
      externalUrl,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
      previewVideoUrl: previewVideoUrl.trim() || undefined,
      language,
      is_language_learning: isLanguageLearning,
      target_learning_language: isLanguageLearning ? targetLearningLanguage : undefined
    });

    // Reset
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setPreviewVideoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir={dir}>
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">إضافة وتجهيز مقرر تفاعلي مدمج</h2>
          <p className="text-xs text-gray-500">
            أضف حزم ومحتويات تفاعلية سحابية لتشغيلها وعرضها بشكل مؤمّن ومباشر داخل المنصة
          </p>
        </div>

        {/* PROMINENT TOGGLE: ACADEMIC VS GENERAL LIBRARY */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-1.5 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsAcademicMode(true)}
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition font-black text-xs ${
                isAcademicMode
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>مقرر ومنهج دراسي (أكاديمي)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAcademicMode(false)}
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition font-black text-xs ${
                !isAcademicMode
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>كتاب عام ومكتبة رقمية (تطوير ذات / أعمال)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">عنوان الكتاب أو المقرر التفاعلي</label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: الرياضيات المتقدمة للصف الأول الثانوي"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
          </div>

          {/* 🌍 MULTILINGUAL & LANGUAGE LEARNING SETTINGS */}
          <div className="p-4 bg-sky-50/60 border border-sky-200/70 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>🌍 لغة محتوى المقرر الصوتي والتفاعلي</span>
                </label>
                <p className="text-[10px] text-slate-500 font-bold">تحديد لغة الشرح الذكي (AI) واستوديوهات الصوت الطبيعي</p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { code: 'ar', label: 'العربية 🇪🇬' },
                  { code: 'en', label: 'English 🇬🇧' },
                  { code: 'it', label: 'Italiano 🇮🇹' },
                  { code: 'fr', label: 'Français 🇫🇷' },
                  { code: 'de', label: 'Deutsch 🇩🇪' }
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      language === l.code
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Learning Mode Toggle */}
            <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLanguageLearning}
                  onChange={(e) => setIsLanguageLearning(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800">دورة لتعليم اللغات 🎓</span>
                  <span className="text-[10px] text-slate-500 font-bold">شرح ثنائي اللغة مع نطق سليم وتدريب صوتي</span>
                </div>
              </label>
            </div>

            {isLanguageLearning && (
              <div className="pt-2 border-t border-sky-200/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ما هي اللغة الأجنبية المستهدفة بالتعليم؟
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { code: 'it', label: '🇮🇹 الإيطالية' },
                    { code: 'en', label: '🇬🇧 الإنجليزية' },
                    { code: 'fr', label: '🇫🇷 الفرنسية' },
                    { code: 'de', label: '🇩🇪 الألمانية' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setTargetLearningLanguage(item.code)}
                      className={`p-2 rounded-xl text-xs font-extrabold transition border cursor-pointer ${
                        targetLearningLanguage === item.code
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              رابط حزمة المحتوى التفاعلي السحابي (يتم تضمينه وعرضه بأمان داخل المنصة)
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-teal-700 mt-1 font-bold">
              🔒 يتم تشغيل هذا المحتوى للمشتركين حصرياً داخل مشغل المنصة المدمج دون توجيه أو كشف للرابط.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">رابط فيديو تعريفي / توضيحي للمقرر (يظهر للطلاب قبل الشراء)</label>
            <div className="relative">
              <input
                type="url"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... أو رابط مباشر"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم المؤلف / المحاضر</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">السعر ($0 للمجاني)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* DYNAMIC CASCADING TAXONOMY */}
          {isAcademicMode ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>الهيكلية الأكاديمية للمقرر</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  مناهج ومقررات دراسية
                </span>
              </div>

              {/* 1. Education Level */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">1. المرحلة التعليمية</label>
                <div className="grid grid-cols-2 gap-2">
                  {EDUCATION_LEVELS.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => handleEducationLevelChange(lvl.id)}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition border ${
                        educationLevel === lvl.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {lvl.id === 'pre_university' ? <School className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                      <span>{lvl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Cascading Fields */}
              {educationLevel === 'pre_university' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">2. مسار التعليم</label>
                    <select
                      value={academicSystem}
                      onChange={(e) => handleAcademicSystemChange(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {ACADEMIC_SYSTEMS.map((sys) => (
                        <option key={sys.id} value={sys.id}>{sys.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">3. الصف الدراسي</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {getGradesForSystem('pre_university', academicSystem).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">2. الكلية / التخصص الجامعي</label>
                    <select
                      value={universityFaculty}
                      onChange={(e) => setUniversityFaculty(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {UNIVERSITY_FACULTIES.map((fac) => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">3. الفرقة الدراسية</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    >
                      {getGradesForSystem('university').map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">المادة الدراسية</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ACADEMIC_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">الترم</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">السنة / الطبعة</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
              <label className="block text-xs font-black text-gray-800">اختر قسم الكتاب من المكتبة الرقمية العامة</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MAIN_CATEGORIES.filter(c => !c.isAcademic).map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setGeneralCategory(c.id as BookCategory)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition text-start border ${
                      generalCategory === c.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">المجال / الموضوع</label>
                  <select
                    value={generalSubcategory}
                    onChange={(e) => setGeneralSubcategory(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {GENERAL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">المستوى والجمهور</label>
                  <select
                    value={generalAudience}
                    onChange={(e) => setGeneralAudience(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="عام / للقراء والمهتمين ورواد الأعمال">عام / للقراء والمهتمين ورواد الأعمال</option>
                    <option value="مستوى مبتدئ / تأسيسي">مستوى مبتدئ / تأسيسي</option>
                    <option value="مستوى متوسط وتطبيقي">مستوى متوسط وتطبيقي</option>
                    <option value="مستوى متقدم وتخصصي">مستوى متقدم وتخصصي</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الوسوم والكلمات الدلالية (مفصولة بفاصلة)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: رياضيات, تفاضل_وتكامل, ثانوية_عامة"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">وصف ملخص للكتاب</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة مختصرة عن محتوى الكتاب وما يقدمه للقارئ..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl shadow-md transition active:scale-98 mt-2"
          >
            نشر الكتاب في المكتبة الرقمية
          </button>
        </form>
      </div>
    </div>
  );
};
