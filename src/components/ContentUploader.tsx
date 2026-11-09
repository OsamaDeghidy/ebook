import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Sparkles, X, GraduationCap, BookMarked, Wand2, 
  School, Building2, BookOpen, RefreshCw, AlertCircle, Shield, ChevronDown, 
  ChevronUp, Check, Edit2, Globe, DollarSign, HelpCircle, ArrowRight
} from 'lucide-react';
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
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';

interface ContentUploaderProps {
  currentUser?: any;
  userRole?: string;
  onConvert: (payload: {
    promptText: string;
    fileUrl?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
    category?: BookCategory;
    track?: BookTrack;
    education_level?: string;
    academic_system?: string;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    price?: number;
    preview_video_url?: string;
    language?: string;
  }) => void;
  isConverting: boolean;
  progressPercent?: number;
  progressStep?: string;
}

interface AiQuotaInfo {
  usedCount: number;
  freeLimit: number;
  remainingFree: number;
  isFree: boolean;
  costPerBook: number;
  walletBalance: number;
  canGenerate: boolean;
}

interface AiSuggestedMetadata {
  title: string;
  education_level?: string;
  academic_system?: string;
  grade_level?: string;
  subcategory?: string;
  semester?: string;
  academic_year?: string;
  language?: string;
  summaryNotes?: string;
}

export default function ContentUploader({
  currentUser,
  userRole = 'instructor',
  onConvert,
  isConverting,
  progressPercent,
  progressStep,
}: ContentUploaderProps) {
  const { t, dir } = useLanguage();
  const [promptText, setPromptText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>('');
  const [cloudPdfUrl, setCloudPdfUrl] = useState<string>('');
  const [showCloudInput, setShowCloudInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ 
    name: string; 
    size: string; 
    type: string; 
    base64?: string;
    rawFile?: File;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);
  const debounceTimerRef = useRef<any>(null);

  // AI Automatic Suggestion states
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestedMetadata | null>(null);
  const [showManualClassification, setShowManualClassification] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // AI Quota & Pricing State
  const [quotaInfo, setQuotaInfo] = useState<AiQuotaInfo | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuota = async () => {
      if (!currentUser?.id) return;
      setIsLoadingQuota(true);
      try {
        const res = await fetch(`/api/user/ai-quota/${currentUser.id}?role=${userRole}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.quota) setQuotaInfo(data.quota);
        }
      } catch (err) {
        console.warn('Could not fetch AI quota:', err);
      } finally {
        setIsLoadingQuota(false);
      }
    };
    fetchQuota();
  }, [currentUser?.id, userRole]);

  // Main Mode: Academic Curriculum vs General Digital Library Book
  const [isAcademicMode, setIsAcademicMode] = useState<boolean>(true);

  // Cascading Academic metadata states
  const [educationLevel, setEducationLevel] = useState<string>('pre_university');
  const [academicSystem, setAcademicSystem] = useState<string>('general_arabic');
  const [bookLanguage, setBookLanguage] = useState<string>('ar');
  const [gradeLevel, setGradeLevel] = useState<string>('الصف الأول الثانوي');
  const [subcategory, setSubcategory] = useState<string>(ACADEMIC_SUBJECTS[0]);
  const [universityFaculty, setUniversityFaculty] = useState<string>(UNIVERSITY_FACULTIES[0]);
  const [semester, setSemester] = useState<string>(SEMESTERS[0]);
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[0]);

  // General Library metadata states
  const [generalCategory, setGeneralCategory] = useState<BookCategory>('programming_ai');
  const [generalSubcategory, setGeneralSubcategory] = useState<string>(GENERAL_SUBJECTS[0]);
  const [generalAudience, setGeneralAudience] = useState<string>('عام / للقراء والمهتمين ورواد الأعمال');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 🤖 Trigger AI Metadata & Category Inference
  const fetchAiSuggestions = async (fileName: string, snippet = '') => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/ai/suggest-book-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, snippet, promptText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.suggestion) {
          const sug = data.suggestion as AiSuggestedMetadata;
          setAiSuggestion(sug);
          if (sug.title) setCustomTitle(sug.title);
          if (sug.education_level) setEducationLevel(sug.education_level);
          if (sug.academic_system) setAcademicSystem(sug.academic_system);
          if (sug.grade_level) setGradeLevel(sug.grade_level);
          if (sug.subcategory) setSubcategory(sug.subcategory);
          if (sug.semester) setSemester(sug.semester);
          if (sug.language) setBookLanguage(sug.language);
        }
      }
    } catch (err) {
      console.warn('AI suggestions error:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = 
      fileNameLower.endsWith('.pdf') ||
      fileNameLower.endsWith('.docx') ||
      fileNameLower.endsWith('.doc') ||
      fileNameLower.endsWith('.txt') ||
      fileNameLower.endsWith('.png') ||
      fileNameLower.endsWith('.jpg') ||
      fileNameLower.endsWith('.jpeg') ||
      fileNameLower.endsWith('.webp');
    
    if (!validMimes.includes(file.type) && !isValidExt) {
      setErrorMsg("صيغة الملف غير مدعومة. يرجى رفع ملف PDF، Word (DOCX)، نصي (TXT)، أو صورة.");
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      setErrorMsg("حجم الملف كبير جداً. الحد الأقصى المسموح به هو 250 ميجابايت.");
      return;
    }

    if (file.size <= 15 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedFile({
          name: file.name,
          size: formatBytes(file.size),
          type: file.type,
          base64: base64String,
          rawFile: file
        });
      };
      reader.onerror = () => {
        setErrorMsg("حدث خطأ أثناء قراءة الملف. يرجى المحاولة مرة أخرى.");
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile({
        name: file.name,
        size: formatBytes(file.size),
        type: file.type,
        base64: '',
        rawFile: file
      });
    }

    // Instantly trigger AI analysis on the selected file name!
    fetchAiSuggestions(file.name);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setAiSuggestion(null);
    setCustomTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleEducationLevelChange = (level: string) => {
    setEducationLevel(level);
    const validGrades = getGradesForSystem(level, academicSystem);
    if (validGrades.length > 0) setGradeLevel(validGrades[0]);
  };

  const handleAcademicSystemChange = (system: string) => {
    setAcademicSystem(system);
    const validGrades = getGradesForSystem(educationLevel, system);
    if (validGrades.length > 0) setGradeLevel(validGrades[0]);
    if (system === 'general_arabic' || system === 'technical') {
      setBookLanguage('ar');
    } else if (system === 'international_french') {
      setBookLanguage('fr');
    } else if (system === 'international_american' || system === 'international_british' || system === 'general_languages') {
      setBookLanguage('en');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCloudUrl = cloudPdfUrl.trim();
    if (!selectedFile && !trimmedCloudUrl && !promptText.trim()) {
      setErrorMsg("يرجى رفع ملف PDF أو Word، أو كتابة عنوان أو فكرة المذكرة للبدء.");
      return;
    }

    let fileUrl: string | undefined = trimmedCloudUrl || undefined;
    let resolvedFileName: string | undefined = selectedFile?.name;
    let resolvedFileType: string | undefined = selectedFile?.type;

    if (!resolvedFileName && trimmedCloudUrl) {
      const rawTail = decodeURIComponent(trimmedCloudUrl.split('?')[0].split('/').pop() || 'cloud_curriculum.pdf');
      resolvedFileName = rawTail.replace(/^\d+-/, '') || 'cloud_curriculum.pdf';
      resolvedFileType = 'application/pdf';
    }

    // 1. Direct Cloud Upload to Google Cloud Storage / Supabase
    if (selectedFile?.rawFile) {
      try {
        setIsUploadingCloud(true);
        const formData = new FormData();
        formData.append("file", selectedFile.rawFile);

        const uploadRes = await fetch("/api/upload-to-gcp", {
          method: "POST",
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileUrl = uploadData.fileUrl;
        } else {
          // Fallback to Supabase Storage if file is small (< 50MB)
          if (selectedFile.rawFile.size < 48 * 1024 * 1024) {
            const fileExt = selectedFile.rawFile.name.split('.').pop();
            const safeId = crypto.randomUUID();
            const fileName = `${Date.now()}-${safeId}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('ebook-files')
              .upload(filePath, selectedFile.rawFile, {
                cacheControl: '3600',
                upsert: false
              });

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('ebook-files')
                .getPublicUrl(filePath);
              fileUrl = publicUrl;
            }
          }
        }
      } catch (uploadErr: any) {
        console.warn("Direct storage upload warning:", uploadErr);
      } finally {
        setIsUploadingCloud(false);
      }
    }

    const activeSubcategory = isAcademicMode 
      ? (educationLevel === 'university' ? universityFaculty : subcategory)
      : generalSubcategory;

    const activeGrade = isAcademicMode ? gradeLevel : generalAudience;

    // Use customTitle or aiSuggestion or promptText
    const finalPromptText = customTitle.trim() || promptText.trim() || resolvedFileName || 'مقرر دراسي تفاعلي';

    onConvert({
      promptText: finalPromptText,
      fileUrl,
      fileBase64: fileUrl ? undefined : selectedFile?.base64,
      fileName: customTitle.trim() || resolvedFileName,
      fileType: resolvedFileType,
      category: isAcademicMode ? 'academic_curriculum' : generalCategory,
      track: isAcademicMode ? 'academic' : 'general_literature',
      education_level: isAcademicMode ? educationLevel : undefined,
      academic_system: isAcademicMode ? (educationLevel === 'university' ? 'تعليم جامعي' : academicSystem) : undefined,
      subcategory: activeSubcategory,
      grade_level: activeGrade,
      semester: isAcademicMode ? semester : 'كتاب عام مستمر',
      academic_year: academicYear,
      price: Number(price) || 0,
      preview_video_url: previewVideoUrl.trim() || undefined,
      language: bookLanguage
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 text-start font-sans" dir={dir}>
      
      {/* 🌟 STREAMLINED HEADER */}
      <div className="text-center space-y-1.5 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
          <span>الرفع والتوليد الذكي للمقررات</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ارفع مذكرتك، وسيتولى الذكاء الاصطناعي الباقي ⚡
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          اسحب ملف الـ PDF أو Word، وسيقوم الذكاء الاصطناعي تلقائياً بالتعرف على المادة والصف وبناء مقرر تفاعلي كامل بالصوت والأسئلة.
        </p>
      </div>

      {/* 🛡️ MINIMAL ACCOUNT BADGE */}
      {quotaInfo && (
        userRole === 'admin' ? (
          <div className="px-3.5 py-2 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold border border-slate-800">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Shield className="w-3.5 h-3.5" />
              <span>وضع المشرف (Admin): توليد غير محدود 100% 🛡️</span>
            </span>
            <span className="text-emerald-400 font-black text-[11px]">متاح دائماً</span>
          </div>
        ) : quotaInfo.remainingFree > 0 ? (
          <div className="px-3.5 py-2 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-bold border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <span>🎁</span>
              <span>رصيدك المجاني: <strong>{quotaInfo.remainingFree}</strong> من أصل {quotaInfo.freeLimit} مذكرات</span>
            </span>
            <span className="text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-black">مجاني (Free)</span>
          </div>
        ) : null
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 📂 DRAG AND DROP ZONE (PRIMARY INTERACTION) */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
              : selectedFile
              ? 'border-emerald-500 bg-emerald-50/40'
              : 'border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf"
            onChange={handleFileInputChange}
            disabled={isConverting}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2.5">
            {selectedFile ? (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <div className="font-black text-sm text-slate-800 flex items-center justify-center gap-2">
                    <span className="truncate">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-600 transition"
                      title="إزالة الملف واختيار غيره"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">{selectedFile.size} • تم تجهيز الملف بنجاح</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition shadow-xs">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800">
                    اسحب وأفلت المذكرة أو الكتاب هنا، أو <span className="text-indigo-600 underline">تصفح جهازك</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    يدعم ملفات PDF و Word حتى 250 ميجابايت (شامل الملازم المصورة والممسوحة ضوئياً)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ☁️ TOGGLE CLOUD STORAGE URL */}
        <div className="text-center">
          {!showCloudInput ? (
            <button
              type="button"
              onClick={() => setShowCloudInput(true)}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>☁️ هل الملف مرفوع بالفعل على Google Cloud Storage؟ الصق رابطه هنا</span>
            </button>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-right animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">رابط ملف الـ PDF على السحابة (GCS):</label>
                <button
                  type="button"
                  onClick={() => setShowCloudInput(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  إخفاء
                </button>
              </div>
              <input
                type="text"
                dir="ltr"
                value={cloudPdfUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setCloudPdfUrl(val);
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  if (val.trim().length > 10) {
                    debounceTimerRef.current = setTimeout(() => {
                      fetchAiSuggestions(val.trim());
                    }, 300);
                  }
                }}
                disabled={isConverting}
                placeholder="https://storage.googleapis.com/ebookstoreg/uploads/... أو https://storage.cloud.google.com/..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* ⏳ AI ANALYZING PULSE */}
        {isAnalyzingAi && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-teal-50 to-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center gap-3 text-xs text-indigo-900 font-bold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>جاري تحليل اسم المذكرة وتحديد المادة والصف والمرحلة بالذكاء الاصطناعي...</span>
          </div>
        )}

        {/* ✨ AI SMART DETECTION & CLASSIFICATION CARD */}
        {(selectedFile || cloudPdfUrl.trim() || aiSuggestion) && !isAnalyzingAi && (
          <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-white to-teal-50/50 border-2 border-indigo-200/80 rounded-3xl shadow-sm space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-700 flex items-center justify-center font-black text-xs">
                  ✨
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">المعلومات المكتشفة بالذكاء الاصطناعي</h4>
                  <p className="text-[10px] text-teal-700 font-bold">تم التعرف على المقرر والتصنيف الأنسب تلقائياً</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowManualClassification(!showManualClassification)}
                className="text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-indigo-600" />
                <span>{showManualClassification ? 'إخفاء التعديل' : 'تعديل التصنيف يدوياً'}</span>
              </button>
            </div>

            {/* EDITABLE TITLE FIELD */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>عنوان المقرر المقترح (يمكنك تعديله):</span>
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="مثال: مذكرة الأحياء للثانوية العامة - الفصل الأول"
                className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-2xs"
              />
            </div>

            {/* SMART TAXONOMY BADGES */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="px-3 py-1 rounded-xl bg-indigo-100/90 text-indigo-900 text-xs font-black flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-indigo-700" />
                <span>{educationLevel === 'university' ? 'تعليم جامعي' : 'تعليم ما قبل الجامعي'}</span>
              </span>

              <span className="px-3 py-1 rounded-xl bg-teal-100/90 text-teal-900 text-xs font-black flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                <span>{gradeLevel}</span>
              </span>

              <span className="px-3 py-1 rounded-xl bg-amber-100/90 text-amber-900 text-xs font-black flex items-center gap-1.5">
                <span>📚</span>
                <span>{subcategory}</span>
              </span>

              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold">
                {semester}
              </span>

              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold">
                {bookLanguage === 'ar' ? 'العربية 🇪🇬' : bookLanguage === 'en' ? 'الإنجليزية 🇬🇧' : bookLanguage}
              </span>
            </div>

            {aiSuggestion?.summaryNotes && (
              <p className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-indigo-100/80 leading-relaxed font-medium">
                💡 <strong>ملخص الذكاء الاصطناعي:</strong> {aiSuggestion.summaryNotes}
              </p>
            )}
          </div>
        )}

        {/* 🛠️ MANUAL CLASSIFICATION OVERRIDE (EXPANDABLE) */}
        {showManualClassification && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-black text-slate-800">تخصيص التصنيفات والمرحلة الدراسية يدوياً</span>
              <span className="text-[10px] text-slate-500 font-bold">خيارات متطابقة مع المعايير الوزارية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">المرحلة التعليمية</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EDUCATION_LEVELS.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => handleEducationLevelChange(lvl.id)}
                      className={`p-2 rounded-xl text-xs font-black transition border ${
                        educationLevel === lvl.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">الصف الدراسي</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  {getGradesForSystem(educationLevel, academicSystem).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">المادة الدراسية</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  {ACADEMIC_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">الفصل الدراسي</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 PRIMARY CALL TO ACTION BUTTON (1-CLICK GENERATION) */}
        <button
          type="submit"
          disabled={isConverting || isUploadingCloud || (quotaInfo !== null && !quotaInfo.canGenerate)}
          className={`w-full py-4 rounded-2xl font-black text-sm text-white transition flex items-center justify-center gap-2.5 shadow-lg active:scale-98 cursor-pointer ${
            isConverting || isUploadingCloud
              ? 'bg-slate-800 cursor-not-allowed'
              : (quotaInfo !== null && !quotaInfo.canGenerate)
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-teal-600 via-indigo-600 to-indigo-700 hover:from-teal-500 hover:to-indigo-600 shadow-indigo-500/25'
          }`}
        >
          {isConverting || isUploadingCloud ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{isUploadingCloud ? 'جاري تجهيز ورفع المستند للسحابة...' : 'جاري التحليل والبناء بالذكاء الاصطناعي...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>
                {quotaInfo?.isFree 
                  ? '🚀 ابدأ توليد وبناء المقرر الذكي الآن (مجاناً)' 
                  : `🚀 ابدأ توليد وبناء المقرر الذكي (${quotaInfo?.costPerBook || 50} ج.م)`}
              </span>
            </>
          )}
        </button>

        {/* ⚙️ COLLAPSIBLE ADVANCED SETTINGS (PRICE, PROMPT, LANGUAGE) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>⚙️</span>
              <span>خيارات إضافية وتخصيص متقدم (السعر، لغة الشرح، توجيهات الـ AI)</span>
            </span>
            {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvancedSettings && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-4 animate-fade-in bg-slate-50/50">
              
              {/* PRICE SETTINGS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تسعير المقرر للطلاب:</label>
                <div className="flex items-center gap-2">
                  {[0, 50, 100, 150].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setPrice(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        price === preset
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset === 0 ? 'مجاني' : `${preset} ج.م`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                    placeholder="سعر مخصص"
                    className="w-24 p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center"
                  />
                </div>
              </div>

              {/* LANGUAGE SELECTION */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">لغة الشرح والمحتوى الأساسية:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ar', label: 'العربية 🇪🇬 🇸🇦' },
                    { id: 'en', label: 'English 🇬🇧 🇺🇸' },
                    { id: 'fr', label: 'Français 🇫🇷' }
                  ].map((lang) => (
                    <button
                      type="button"
                      key={lang.id}
                      onClick={() => setBookLanguage(lang.id)}
                      className={`p-2 rounded-xl text-xs font-black transition border ${
                        bookLanguage === lang.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM AI PROMPT / INSTRUCTIONS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  توجيهات إضافية لمساعد الذكاء الاصطناعي (اختياري):
                </label>
                <textarea
                  placeholder="مثال: ركز على أسئلة الامتحانات والقوانين، أو اجعل الأسلوب ميسراً مع أمثلة عملية..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={isConverting}
                  rows={2}
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition resize-none leading-relaxed"
                />
              </div>

              {/* PROMOTIONAL VIDEO URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  رابط فيديو توضيحي / يوتيوب للمقرر (اختياري):
                </label>
                <input
                  type="url"
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  disabled={isConverting}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

            </div>
          )}
        </div>

        {/* ACTIVE CONVERSION PROGRESS DISPLAY */}
        {isConverting && <ConversionProgressTracker percent={progressPercent} step={progressStep} />}

        {/* ERROR MESSAGES */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-bold animate-shake">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
            <p>{errorMsg}</p>
          </div>
        )}

      </form>

    </div>
  );
}

// Sub-component to show live AI conversion progress steps
interface ProgressTrackerProps {
  percent?: number;
  step?: string;
}

function ConversionProgressTracker({ percent, step }: ProgressTrackerProps) {
  const [localStep, setLocalStep] = React.useState(0);
  
  const steps = [
    { label: "قراءة وتحليل مستند الـ PDF واستخراج الفصول والمفاهيم", desc: "فحص عميق للمادة وبناء الهيكل الرقمي" },
    { label: "تقسيم الكتاب إلى فصول تفصيلية دون اختصار", desc: "استخراج النصوص الأصلية وشرح المفاهيم الرئيسية" },
    { label: "صياغة التلخيص والأمثلة والخرائط المفاهيمية باللغة العربية الفصحى", desc: "إعداد الدروس المعمقة والملاحظات التعليمية" },
    { label: "إنشاء بنوك الأسئلة والاختبارات التفاعلية مع الإيضاحات", desc: "توليد أسئلة اختيار من متعدد مع التغذية الراجعة" },
    { label: "حفظ وتثبيت الكتاب في قاعدة البيانات السحابية Supabase", desc: "ربط المصادر وحفظ بيانات الفصول" }
  ];

  React.useEffect(() => {
    if (percent === undefined) {
      const timer = setInterval(() => {
        setLocalStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [percent, steps.length]);

  const displayPercent = percent !== undefined ? percent : Math.round(((localStep + 1) / steps.length) * 100);
  const displayStepText = step || steps[Math.min(localStep, steps.length - 1)].label;

  return (
    <div className="p-5 border border-indigo-100 bg-indigo-50/40 rounded-3xl space-y-3.5 animate-fade-in text-right">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-indigo-700 flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>{displayStepText}</span>
        </span>
        <span className="text-xs font-black text-indigo-900 bg-white px-2.5 py-0.5 rounded-full border border-indigo-150 shadow-2xs">
          {displayPercent}%
        </span>
      </div>

      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-500 to-indigo-600 h-full transition-all duration-500 rounded-full"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-100/60 text-[10px] text-slate-500 font-bold">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>دقة الهيكلة الأكاديمية: 100%</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>محرك الذكاء الاصطناعي: نشط</span>
        </div>
      </div>
    </div>
  );
}
