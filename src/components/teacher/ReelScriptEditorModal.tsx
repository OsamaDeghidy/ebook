import React, { useState } from 'react';
import { 
  Edit3, Save, X, Sparkles, CheckCircle2, 
  HelpCircle, Lightbulb, Flame, Trash2 
} from 'lucide-react';
import { EduReel } from '../../types';

interface ReelScriptEditorModalProps {
  isOpen: boolean;
  reel: EduReel | null;
  onClose: () => void;
  onSave: (updatedReel: EduReel) => Promise<void>;
}

export const ReelScriptEditorModal: React.FC<ReelScriptEditorModalProps> = ({
  isOpen,
  reel,
  onClose,
  onSave
}) => {
  if (!isOpen || !reel) return null;

  return (
    <ReelScriptEditorModalContent
      reel={reel}
      onClose={onClose}
      onSave={onSave}
    />
  );
};

interface ReelScriptEditorModalContentProps {
  reel: EduReel;
  onClose: () => void;
  onSave: (updatedReel: EduReel) => Promise<void>;
}

const ReelScriptEditorModalContent: React.FC<ReelScriptEditorModalContentProps> = ({
  reel,
  onClose,
  onSave
}) => {
  const [chapterTitle, setChapterTitle] = useState(reel.chapter_title);
  const [scenes, setScenes] = useState(reel.scenes || []);
  const [quickQuiz, setQuickQuiz] = useState(reel.quickQuiz || {
    question: '',
    options: ['', '', ''],
    correctIndex: 0,
    explanation: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSceneTextChange = (act: string, newText: string) => {
    setScenes(prev => prev.map(s => s.act === act ? { ...s, script: newText } : s));
  };

  const handleQuizOptionChange = (index: number, val: string) => {
    setQuickQuiz(prev => {
      const opts = [...prev.options];
      opts[index] = val;
      return { ...prev, options: opts };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: EduReel = {
        ...reel,
        chapter_title: chapterTitle,
        scenes,
        quickQuiz
      };
      await onSave(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>محرر سيناريو وأسئلة الريل</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                  Teacher Studio
                </span>
              </h2>
              <p className="text-xs text-slate-400">تعديل السيناريو والسؤال قبل نشره للطلاب</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* CHAPTER TITLE */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">عنوان الفصل / الريل:</label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white font-bold outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* SCENES SCRIPT */}
          <div className="space-y-3">
            <h3 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>نصوص مشاهد الريل الثلاثة (Hook ➔ Concept ➔ Takeaway):</span>
            </h3>

            {scenes.map((scene, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-sky-300 flex items-center gap-1.5">
                    {scene.act === 'hook' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                    {scene.act === 'concept' && <Lightbulb className="w-3.5 h-3.5 text-amber-400" />}
                    {scene.act === 'takeaway' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                    <span>{scene.act === 'hook' ? 'المشهد 1: الهوك الجذاب' : scene.act === 'concept' ? 'المشهد 2: شرح المفهوم والقانون' : 'المشهد 3: الخلاصة الذهبية'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{scene.duration} ثوانٍ</span>
                </div>
                <textarea
                  rows={2}
                  value={scene.script}
                  onChange={(e) => handleSceneTextChange(scene.act, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-sky-500 transition leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* QUIZ SECTION */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <h3 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>سؤال التحدي التفاعلي ("🧠 اختبرني"):</span>
            </h3>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400 font-bold">نص السؤال:</label>
              <input
                type="text"
                value={quickQuiz.question}
                onChange={(e) => setQuickQuiz(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400 font-bold">الخيارات (اختر الإجابة الصحيحة):</label>
              {(quickQuiz.options || []).map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={quickQuiz.correctIndex === oIdx}
                    onChange={() => setQuickQuiz(prev => ({ ...prev, correctIndex: oIdx }))}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleQuizOptionChange(oIdx, e.target.value)}
                    placeholder={`خيار ${oIdx + 1}`}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500 transition"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1">
              <label className="block text-[11px] text-slate-400 font-bold">تفسير الإجابة الصحيحة:</label>
              <input
                type="text"
                value={quickQuiz.explanation || ''}
                onChange={(e) => setQuickQuiz(prev => ({ ...prev, explanation: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            disabled={isSaving}
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              saveSuccess 
                ? 'bg-teal-500 text-white' 
                : 'bg-gradient-to-r from-amber-500 to-sky-500 hover:from-amber-600 hover:to-sky-600 text-slate-950 shadow-lg'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ التعديلات بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات واعتمادها'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReelScriptEditorModal;
