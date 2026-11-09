import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, AppLanguage } from '../../i18n/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition active:scale-95 text-xs font-black shadow-2xs cursor-pointer"
        title="تغيير لغة المنصة / Change Language"
      >
        <span className="text-sm leading-none">{currentLanguageInfo.flag}</span>
        <span className="hidden sm:inline text-xs">{currentLanguageInfo.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-1.5 end-0 z-50 w-48 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          dir="ltr"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
            Language / اللغة
          </div>
          <div className="space-y-0.5 pt-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition text-left cursor-pointer active:scale-98 ${
                    isSelected
                      ? 'bg-teal-50 text-teal-800 font-black'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{lang.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
