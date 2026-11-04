import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Play, Square, FileText, Lightbulb, BookOpen, Volume2, 
  RefreshCw, Sigma, ShieldAlert, 
  Target, GraduationCap, LayoutGrid, Table2, 
  ChevronDown, ChevronUp, Sparkles, CheckCircle2,
  ZoomIn, ZoomOut, Check, Clock, Maximize2, Minimize2,
  Headphones, X, Compass, FlaskConical, Scale,
  Edit3, Save, Undo, Redo, Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code, Eye,
  MessageSquare, HelpCircle, Send, Bot, AlertTriangle
} from 'lucide-react';
import { Chapter } from '../types';
import { useGlobalAudio } from '../hooks/useGlobalAudio';
import { sanitizeBookContent } from '../utils/sanitizeBookContent';
import { useLanguage } from '../i18n/LanguageContext';
import MathRenderer from './MathRenderer';

/**
 * Deep text sanitizer to remove escaped characters, format LaTeX smoothly into clear math typography,
 * strip OCR artifacts, normalize math words to symbols, and clean raw callout tags.
 */
function sanitizeEducationalMarkdown(text: string | undefined): string {
  if (!text) return '';
  return sanitizeBookContent(text);
}


/**
 * Visual Comparison & Concept Cards Component
 * Converts plain markdown tables into modern, engaging, colorful concept cards
 */
function VisualComparisonCards({ headerCells, dataRows }: { headerCells: string[]; dataRows: string[][] }) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const cardIcons = ['🗺️', '🧭', '🔍', '📏', '💡', '📌', '⭐', '⚡', '📐', '🎯'];

  return (
    <div className="my-6 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-black text-indigo-900">
            {headerCells.join(' المقابلة لـ ') || 'عناصر ومفاهيم الدرس البصرية'}
          </span>
        </div>

        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-[11px] font-bold">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>بطاقات بصرية 📇</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>جدول مقارنة 📊</span>
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {dataRows.map((row, rIdx) => {
            const title = row[0] || `عنصر ${rIdx + 1}`;
            const desc = row.slice(1).join(' - ') || '';
            const icon = cardIcons[rIdx % cardIcons.length];

            return (
              <div
                key={rIdx}
                className="group relative bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 p-5 rounded-2xl border-2 border-indigo-100/90 hover:border-indigo-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl shrink-0 p-2 bg-white rounded-xl shadow-xs border border-indigo-100 group-hover:scale-110 transition-transform">
                      {icon}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 block">
                        {headerCells[0] || 'العنصر الرئيسي'}
                      </span>
                      <h5 className="font-black text-sm sm:text-base text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {title}
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-indigo-50 shadow-inner">
                  {headerCells[1] && (
                    <span className="text-[10px] font-bold text-amber-700 block mb-1">
                      ✨ {headerCells[1]}:
                    </span>
                  )}
                  <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-indigo-200/80 shadow-xs bg-white">
          <table className="w-full text-right text-xs sm:text-sm border-collapse min-w-[340px]">
            <thead className="bg-gradient-to-r from-indigo-50 to-teal-50/50 text-indigo-950 font-black border-b border-indigo-200">
              <tr>
                {headerCells.map((h, i) => (
                  <th key={i} className="p-3.5 text-xs sm:text-sm font-black text-indigo-900 border-l border-indigo-100/60 last:border-l-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-indigo-50/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3.5 text-xs sm:text-sm text-gray-800 border-l border-gray-100 last:border-l-0 font-medium leading-relaxed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Recursive raw text extractor from React nodes for safe condition checking
function extractRawText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractRawText).join(' ');
  if (node.props && node.props.children) return extractRawText(node.props.children);
  return '';
}

// Custom Markdown components for clean pedagogical rendering
const markdownComponents = {
  span: ({ className, children, ...props }: any) => {
    if (className?.includes('katex')) {
      return (
        <span dir="ltr" className={`${className} inline-block select-text mx-1 align-middle`} tabIndex={-1} {...props}>
          {children}
        </span>
      );
    }
    return <span className={className} {...props}>{children}</span>;
  },
  blockquote: ({ children }: any) => {
    const rawText = extractRawText(children);

    if (rawText.includes('قانون') || rawText.includes('قاعدة') || rawText.includes('هام') || rawText.includes('المحوري') || rawText.includes('IMPORTANT')) {
      return (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-r-4 border-amber-500 shadow-xs text-amber-950">
          <div className="flex items-center gap-2 text-xs font-black text-amber-800 mb-1.5">
            <Sigma className="w-4 h-4 text-amber-600 shrink-0" />
            <span>قاعدة ومفهوم محوري</span>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed">
            {children}
          </div>
        </div>
      );
    }

    if (rawText.includes('تريكة') || rawText.includes('فخ') || rawText.includes('خطأ شائع') || rawText.includes('تنبيه') || rawText.includes('WARNING')) {
      return (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border-r-4 border-rose-500 shadow-xs text-rose-950">
          <div className="flex items-center gap-2 text-xs font-black text-rose-800 mb-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>تنبيه امتحاني وتريكة هامة</span>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed">
            {children}
          </div>
        </div>
      );
    }

    if (rawText.includes('نص المذكرة') || rawText.includes('المصدر الأصلي') || rawText.includes('النص الأصلي')) {
      return (
        <div className="my-5 p-5 sm:p-6 rounded-2xl bg-[#FFFDF9] border-2 border-amber-300/80 border-r-6 border-r-amber-500 shadow-sm text-slate-900 relative">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900 mb-2.5 pb-2 border-b border-amber-200/60">
            <span className="text-lg">📜</span>
            <span>نص المذكرة الأصلي المعتمد (المصدر النصي الموثق)</span>
          </div>
          <div className="text-xs sm:text-sm font-serif leading-relaxed text-slate-800 [&_strong:first-child]:hidden [&_p:first-child>strong:first-child]:hidden [&_p:first-child]:inline-block">
            {children}
          </div>
        </div>
      );
    }

    if (rawText.includes('نشاط') || rawText.includes('فكرة') || rawText.includes('نصيحة') || rawText.includes('تطبيق') || rawText.includes('استكشاف') || rawText.includes('TIP')) {
      return (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-r-4 border-emerald-500 shadow-xs text-emerald-950">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 mb-1.5">
            <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>إضاءة تربوية ونشاط تطبيقي</span>
          </div>
          <div className="text-xs sm:text-sm font-bold leading-relaxed">
            {children}
          </div>
        </div>
      );
    }

    return (
      <blockquote className="my-4 p-4 rounded-2xl bg-indigo-50/70 border-r-4 border-indigo-500 text-indigo-950 font-medium text-xs sm:text-sm leading-relaxed">
        {children}
      </blockquote>
    );
  },
  h1: ({ children }: any) => (
    <h3 className="text-base sm:text-lg font-black text-indigo-950 mt-6 mb-3 pb-2 border-b border-indigo-100 flex items-center gap-2">
      <span className="w-2.5 h-5 rounded-full bg-indigo-600 inline-block"></span>
      {children}
    </h3>
  ),
  h2: ({ children }: any) => (
    <h4 className="text-sm sm:text-base font-black text-indigo-900 mt-5 mb-2.5 flex items-center gap-2">
      <span className="w-2 h-4 rounded-full bg-amber-500 inline-block"></span>
      {children}
    </h4>
  ),
  h3: ({ children }: any) => {
    const raw = extractRawText(children);
    if (raw.includes('نص المذكرة') || raw.includes('المصدر الأصلي') || raw.includes('النص الأصلي')) {
      return null;
    }
    return (
      <h5 className="text-xs sm:text-sm font-bold text-gray-800 mt-4 mb-2">
        {children}
      </h5>
    );
  },
  p: ({ children }: any) => {
    const rawText = extractRawText(children);

    if (rawText.includes('|')) {
      const lines = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const sepIndex = lines.findIndex(l => l.includes('---') || l.includes(':--'));
      
      if (sepIndex > 0) {
        const headerLine = lines[sepIndex - 1];
        const headerCells = headerLine.split('|').map(c => c.trim()).filter(Boolean);
        const dataLines = lines.slice(sepIndex + 1).filter(l => l.includes('|') && !l.includes('---'));
        const dataRows = dataLines.map(row => row.split('|').map(c => c.trim()).filter(Boolean)).filter(r => r.length > 0);
        const leadLines = lines.slice(0, sepIndex - 1);

        if (headerCells.length > 0 && dataRows.length > 0) {
          return (
            <div className="space-y-2 my-3">
              {leadLines.length > 0 && (
                <p className="my-2 text-xs sm:text-sm text-gray-700 leading-relaxed font-bold">
                  {leadLines.join('\n')}
                </p>
              )}
              <VisualComparisonCards headerCells={headerCells} dataRows={dataRows} />
            </div>
          );
        }
      }

      // Handle direct pipe lists without dashed lines
      const cleanedLines = rawText
        .replace(/\|\s*[-:\s|]{2,}\s*\|/g, '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.match(/^[-:\s|]+$/));

      const tableRows = cleanedLines
        .filter(l => l.includes('|'))
        .map(l => l.split('|').map(c => c.trim()).filter(Boolean))
        .filter(r => r.length >= 2);

      if (tableRows.length >= 2) {
        const headerCells = tableRows[0];
        const dataRows = tableRows.slice(1);
        return (
          <div className="space-y-2 my-3">
            <VisualComparisonCards headerCells={headerCells} dataRows={dataRows} />
          </div>
        );
      }
    }

    if (rawText.match(/^[-:\s|]{3,}$/)) {
      return null;
    }

    return (
      <p className="my-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
        {children}
      </p>
    );
  },
  ul: ({ children }: any) => (
    <ul className="my-3 space-y-2 list-disc list-inside text-xs sm:text-sm text-gray-700 pr-2">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-3 space-y-2 list-decimal list-inside text-xs sm:text-sm text-gray-700 pr-2">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),
  table: ({ children }: any) => (
    <div className="my-5 overflow-x-auto rounded-2xl border border-indigo-200/80 shadow-xs bg-white">
      <table className="w-full text-right text-xs sm:text-sm border-collapse min-w-[340px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-indigo-50 to-teal-50/50 text-indigo-950 font-black border-b border-indigo-200">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-gray-100">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-indigo-50/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="p-3.5 text-xs sm:text-sm font-black text-indigo-900 border-l border-indigo-100/60 last:border-l-0">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="p-3.5 text-xs sm:text-sm text-gray-800 border-l border-gray-100 last:border-l-0 font-medium leading-relaxed">
      {children}
    </td>
  ),
  code: ({ inline, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="my-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto" dir="ltr">
        <code>{children}</code>
      </pre>
    );
  }
};

interface WorkedStep {
  stepNum: number;
  title: string;
  detail: string;
}

interface ChapterHubData {
  problemTitle: string;
  problemText: string;
  steps: WorkedStep[];
  goldenRule: string;
  comparisonItems: { title: string; desc: string; icon: string; badgeColor: string }[];
}

/**
 * Intelligent Dynamic Extractor for Worked Examples, Visual Comparisons, and Exam Tips.
 * Adapts dynamically to every individual chapter based on its title, content, concepts, quiz, and domain.
 */
function extractDynamicChapterHubData(chapter: Chapter): ChapterHubData {
  const title = chapter.title || 'الدرس الحالي';
  const summary = chapter.summary || '';
  const content = chapter.content || '';
  const combinedText = `${title} ${summary} ${content}`;
  
  // 1. DYNAMIC COMPARISON ITEMS (From chapter.concepts or content or flashcards)
  const colors = [
    { icon: '🔵', badgeColor: 'text-sky-300 border-sky-500/30 bg-sky-950/40' },
    { icon: '🟢', badgeColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40' },
    { icon: '🟣', badgeColor: 'text-purple-300 border-purple-500/30 bg-purple-950/40' },
    { icon: '🟠', badgeColor: 'text-amber-300 border-amber-500/30 bg-amber-950/40' },
    { icon: '🔴', badgeColor: 'text-rose-300 border-rose-500/30 bg-rose-950/40' },
    { icon: '🟡', badgeColor: 'text-yellow-300 border-yellow-500/30 bg-yellow-950/40' },
  ];

  let rawConcepts: { title: string; desc: string }[] = [];

  // A. From chapter.concepts
  if (Array.isArray(chapter.concepts) && chapter.concepts.length > 0) {
    chapter.concepts.forEach((c: any) => {
      if (typeof c === 'string' && c.trim()) {
        const parts = c.split(/[:：\-–]/);
        if (parts.length > 1) {
          rawConcepts.push({ title: parts[0].trim(), desc: parts.slice(1).join(':').trim() });
        } else {
          rawConcepts.push({ title: c.trim(), desc: `مفهوم وتطبيق جوهري في درس ${title}.` });
        }
      } else if (c && typeof c === 'object') {
        const cTitle = c.concept || c.title || c.term || '';
        const cDesc = c.explanation || c.definition || c.description || '';
        if (cTitle) rawConcepts.push({ title: cTitle.trim(), desc: cDesc.trim() || `الخصائص والاستخدام العملي لـ (${cTitle}).` });
      }
    });
  }

  // B. From flashcards fallback
  if (rawConcepts.length < 2 && Array.isArray(chapter.flashcards) && chapter.flashcards.length > 0) {
    chapter.flashcards.forEach((f: any) => {
      if (f.front && f.back && rawConcepts.length < 4) {
        rawConcepts.push({ title: f.front.trim(), desc: f.back.trim() });
      }
    });
  }

  // C. Fallback: Parse bold terms from content
  if (rawConcepts.length < 2 && content) {
    const boldMatches = content.match(/\*\*([^\*]{2,30})\*\*[:：\s]*([^\n\.!\?]{15,120})/g);
    if (boldMatches) {
      boldMatches.slice(0, 4).forEach(m => {
        const sub = m.match(/\*\*([^\*]+)\*\*[:：\s]*(.*)/);
        if (sub && sub[1]) {
          rawConcepts.push({ title: sub[1].trim(), desc: sub[2].trim() || 'شرح وتطبيق المفهوم.' });
        }
      });
    }
  }

  // Final fallback if no concepts at all
  if (rawConcepts.length < 2) {
    rawConcepts = [
      { title: `المفهوم الأساسي لـ (${title})`, desc: summary ? (summary.substring(0, 140) + '...') : `القاعدة والهدف التعليمي المحوري لدرس ${title}.` },
      { title: `التطبيق والممارسة العملية`, desc: `كيفية توظيف واستخدام مفاهيم (${title}) في حل المسائل والمواقف الحياتية بدقة.` }
    ];
  }

  // Sanitize any bracketed English tokens from concepts
  rawConcepts = rawConcepts.map(item => ({
    title: item.title.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim(),
    desc: item.desc.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim()
  }));

  const comparisonItems = rawConcepts.slice(0, 4).map((item, idx) => {
    const colorStyle = colors[idx % colors.length];
    return {
      title: item.title,
      desc: item.desc,
      icon: colorStyle.icon,
      badgeColor: colorStyle.badgeColor
    };
  });

  // 2. DYNAMIC WORKED PROBLEM & STEPS & GOLDEN RULE
  let problemTitle = `تطبيق ومسألة عملية لدرس: ${title}`;
  let problemText = '';
  let steps: WorkedStep[] = [];
  let goldenRule = '';

  // Priority 1: Check if content has a structured worked example block (مثال محلول / مسألة)
  const exampleBlockMatch = content.match(/(?:###?\s*(?:مثال|مسألة|تطبيق|تدريب|مثال محلول|تطبيق عملي)[\s\S]*?)(?=\n###?|\n##|$)/i);
  if (exampleBlockMatch && exampleBlockMatch[0].length > 40) {
    const exText = exampleBlockMatch[0].replace(/^###?.*?\n/, '').trim();
    const lines = exText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length >= 2) {
      problemText = lines[0].replace(/^[ \t]*[\*\-\>\#\d\.\)]+/, '').trim();
      const stepLines = lines.slice(1).filter(l => /^(?:\d+[\.\-\)]|\-|\*|\(\d+\))/.test(l.trim()));
      if (stepLines.length >= 2) {
        steps = stepLines.slice(0, 3).map((sl, idx) => ({
          stepNum: idx + 1,
          title: `الخطوة ${idx + 1}: ${sl.split(/[:：]/)[0].replace(/^[\d\.\-\*\(\)\s]+/, '').trim() || 'التنفيذ والحل'}`,
          detail: sl.split(/[:：]/).slice(1).join(':').trim() || sl.replace(/^[\d\.\-\*\(\)\s]+/, '').trim()
        }));
      }
    }
  }

  // Priority 2: Use Chapter Quiz Question (grounded in the exact lesson)
  if ((!problemText || steps.length < 2) && Array.isArray(chapter.quiz) && chapter.quiz.length > 0) {
    const q = chapter.quiz[0];
    if (q && q.question) {
      problemTitle = `تحدي وتطبيق عملي نموذجي لدرس: ${title}`;
      problemText = q.question;
      
      const correctOption = (q.options && q.options[q.correctOptionIndex]) ? q.options[q.correctOptionIndex] : (q.options ? q.options[0] : '');
      const wrongOptions = (q.options || []).filter((_, i) => i !== q.correctOptionIndex).slice(0, 2);

      steps = [
        {
          stepNum: 1,
          title: 'تحليل المعطيات والمفهوم الأساسي',
          detail: `تحديد المطلوب بدقة من مسألة "${title}" ومراجعة المتغيرات والقواعد الحاكمة.`
        },
        {
          stepNum: 2,
          title: 'استبعاد البدائل الخاطئة وتطبيق القاعدة',
          detail: wrongOptions.length > 0
            ? `استبعاد الخيارات غير المتوافقة مع القاعدة (${wrongOptions.join(' ، ')}) والتحقق من صحة المعطيات.`
            : 'تطبيق القاعدة المباشرة والتحقق خطوة بخطوة من صحة خطوات الحل.'
        },
        {
          stepNum: 3,
          title: 'الحل والبرهان والنتيجة النهائية',
          detail: q.explanation || `الإجابة الصحيحة هي: (${correctOption}) بناءً على قواعد الدرس المعيارية.`
        }
      ];

      goldenRule = q.explanation || `في درس (${title})، تذكر دائماً ربط القاعدة بالمعطيات لتجنب الوقوع في فخ التسرع.`;
    }
  }

  // Priority 3: Nuanced Domain Fallbacks with Topic-Specific Formulas and Problem Statements
  if (!problemText || steps.length < 2) {
    const isAdditionSubtraction = /جمع|طرح|استراتيجيات|تقدير|تقريب/i.test(combinedText);
    const isMultiplicationDivision = /ضرب|قسمة|خوارزمية|مساحة المستطيل|توزيع/i.test(combinedText);
    const isFractionsDecimals = /كسر|كسور|عشري|أعشار|أجزاء من مائة/i.test(combinedText);
    const isGeometry = /هندسة|محيط|مساحة|أشكال|زوايا|أضلاع|مستطيل|مربع|مثلث/i.test(combinedText);
    const isFactorsMultiples = /عوامل|مضاعفات|أولية|ع\.م\.أ|م\.م\.أ|أنماط/i.test(combinedText);
    const isPlaceValue = /مكانية|صيغة ممتدة|أعداد كبيرة|ملايين|مليارات/i.test(combinedText);
    const isScienceAdaptation = /تكيف|بيئة|كائنات|حيوان|نبات|حواس|ضوء/i.test(combinedText);
    const isScienceEnergyMatter = /طاقة|حركة|سرعة|تصادم|مادة|حرارة|شغل/i.test(combinedText);
    const isSocialMaps = /خريط|موقع|بوصلة|إحداثيات|مقياس|رموز/i.test(combinedText);

    if (isAdditionSubtraction) {
      problemTitle = `تطبيق عملي ومسألة ذكية على: ${title}`;
      problemText = `احسب ناتج الجمع (٦٨ + ٢٧) وناتج الطرح (٩٤ - ٤٨) باستخدام استراتيجية الحساب العقلي (التعويض أو التحليل والتجميع).`;
      steps = [
        {
          stepNum: 1,
          title: 'استراتيجية التعويض في الجمع (تكوين العشرات)',
          detail: 'نضيف ٢ إلى العدد ٦٨ ليصبح ٧٠، ثم نجمع (٧٠ + ٢٧ = ٩٧)، وأخيراً نطرح ٢ المضافة ليصبح الناتج الدقيق (٩٥).'
        },
        {
          stepNum: 2,
          title: 'استراتيجية التحليل والتجميع في الطرح',
          detail: 'نفكك ٤٨ إلى (٤٠ + ٨). نطرح العشرات أولاً: (٩٤ - ٤٠ = ٥٤)، ثم نطرح الآحاد: (٥٤ - ٨ = ٤٦).'
        },
        {
          stepNum: 3,
          title: 'التحقق والمقارنة النهائية',
          detail: 'ناتج الجمع = ٩٥، وناتج الطرح = ٤٦. الاستراتيجيات الذهنية توفر سرعة ودقة دون الحاجة للورقة والقلم.'
        }
      ];
      goldenRule = 'في استراتيجية التعويض للجمع: ما تضيفه لطرف المسألة يجب أن تطرحه من الناتج النهائي للحفاظ على القيمة الحقيقية.';
    } else if (isMultiplicationDivision) {
      problemTitle = `مسألة نموذجية وخطوات حل لـ: ${title}`;
      problemText = `احسب ناتج ضرب (٣٥ × ١٤) باستخدام نموذج مساحة المستطيل أو خاصية التوزيع.`;
      steps = [
        {
          stepNum: 1,
          title: 'تفكيك الأعداد حسب القيمة المكانية',
          detail: 'نفكك العدد ٣٥ إلى (٣٠ + ٥)، والعدد ١٤ إلى (١٠ + ٤).'
        },
        {
          stepNum: 2,
          title: 'حساب حواصل الضرب الجزئية الأربعة',
          detail: '(٣٠ × ١٠ = ٣٠٠)، (٣٠ × ٤ = ١٢٠)، (٥ × ١٠ = ٥٠)، (٥ × ٤ = ٢٠).'
        },
        {
          stepNum: 3,
          title: 'جمع النواتج الجزئية للوصول للحل النهائي',
          detail: '٣٠٠ + ١٢٠ + ٥٠ + ٢٠ = ٤٩٠. إذن ناتج (٣٥ × ١٤ = ٤٩٠).'
        }
      ];
      goldenRule = 'نموذج مساحة المستطيل يضمن ضرب كل خانة من العدد الأول في كل خانة من العدد الثاني دون نسيان.';
    } else if (isFractionsDecimals) {
      problemTitle = `مسألة مقارنة وتطبيق مباشر على: ${title}`;
      problemText = `قارن بين الكسرين (٣/٤) و (٥/٨)، ثم رتبها تصاعدياً مع توضيح خطوات توحيد المقامات.`;
      steps = [
        {
          stepNum: 1,
          title: 'إيجاد المقام المشترك الأصغر',
          detail: 'المقامان هما ٤ و ٨. بما أن ٨ تقبل القسمة على ٤، فإن المقام المشترك هو ٨.'
        },
        {
          stepNum: 2,
          title: 'تحويل الكسر إلى كسر مكافئ متجانس',
          detail: 'نضرب كلاً من بسط ومقام (٣/٤) في العدد ٢ ليصبح (٦/٨).'
        },
        {
          stepNum: 3,
          title: 'المقارنة المباشرة واستخلاص النتيجة',
          detail: 'بما أن ٦/٨ أكبر من ٥/٨، فإن (٣/٤ > ٥/٨)، والترتيب التصاعدي هو: ٥/٨ ثم ٣/٤.'
        }
      ];
      goldenRule = 'لا يمكن جمع أو طرح أو مقارنة الكسور مباشرة إلا بعد توحيد المقامات للحصول على أجزاء متساوية الحجم.';
    } else if (isGeometry) {
      problemTitle = `مسألة وتطبيق هندسي على: ${title}`;
      problemText = `غرفة مستطيلة الشكل طولها ٦ أمتار وعرضها ٤ أمتار. احسب كلاً من محيط الغرفة ومساحتها الإجمالية.`;
      steps = [
        {
          stepNum: 1,
          title: 'حساب محيط الغرفة (الإطار الخارجي)',
          detail: 'المحيط = (الطول + العرض) × ٢ = (٦ + ٤) × ٢ = ١٠ × ٢ = ٢٠ متراً.'
        },
        {
          stepNum: 2,
          title: 'حساب مساحة الغرفة (الحيز الداخلي)',
          detail: 'المساحة = الطول × العرض = ٦ × ٤ = ٢٤ متراً مربعاً.'
        },
        {
          stepNum: 3,
          title: 'التمييز بين الوحدات الطولية والمربعة',
          detail: 'المحيط يُقاس بوحدات الطول (م = ٢٠)، والمساحة بوحدات المربع (م² = ٢٤).'
        }
      ];
      goldenRule = 'المحيط هو السياج أو الإطار المحيط بالشكل، بينما المساحة هي عدد الوحدات المربعة التي تغطي السطح من الداخل.';
    } else if (isFactorsMultiples) {
      problemTitle = `تطبيق عملي على العوامل والمضاعفات لـ: ${title}`;
      problemText = `أوجد العامل المشترك الأكبر والمضاعف المشترك الأصغر للعددين (١٢ و ١٨).`;
      steps = [
        {
          stepNum: 1,
          title: 'التحليل إلى العوامل الأولية باستخدام شجرة العوامل',
          detail: '١٢ = ٢ × ٢ × ٣ ، بينما ١٨ = ٢ × ٣ × ٣.'
        },
        {
          stepNum: 2,
          title: 'حساب العامل المشترك الأكبر',
          detail: 'نضرب العوامل الأولية المشتركة فقط: (٢ × ٣ = ٦).'
        },
        {
          stepNum: 3,
          title: 'حساب المضاعف المشترك الأصغر',
          detail: 'نضرب جميع العوامل دون تكرار المشترك: (٢ × ٢ × ٣ × ٣ = ٣٦).'
        }
      ];
      goldenRule = 'العدد ١ هو العامل المشترك لجميع الأعداد، بينما الصفر هو المضاعف المشترك لجميع الأعداد.';
    } else if (isPlaceValue) {
      problemTitle = `تطبيق مباشر على القيمة المكانية لـ: ${title}`;
      problemText = `اكتب العدد (٧,٥٤٢) بالصيغة الممتدة، ثم حدد القيمة المكانية وقيمة الرقم ٥ في هذا العدد.`;
      steps = [
        {
          stepNum: 1,
          title: 'تحليل الخانات وتحديد المنازل',
          detail: 'الآحاد = ٢، العشرات = ٤، المئات = ٥، الألوف = ٧.'
        },
        {
          stepNum: 2,
          title: 'كتابة الصيغة الممتدة (مجموع قيم الأرقام)',
          detail: '٧٠٠٠ + ٥٠٠ + ٤٠ + ٢ = ٧,٥٤٢'
        },
        {
          stepNum: 3,
          title: 'تحديد قيمة الرقم المطلوب',
          detail: 'الرقم ٥ يقع في خانة "المئات"، وقيمته العددية هي (٥٠٠).'
        }
      ];
      goldenRule = 'القيمة المكانية هي اسم الخانة (مئات)، بينما قيمة الرقم هي ما يساويه الرقم بأصفاره (٥٠٠).';
    } else if (isScienceAdaptation) {
      problemTitle = `موقف استكشافي وتطبيق علمي على: ${title}`;
      problemText = `إذا تم نقل ثعلب الفنك من بيئته الصحراوية الحارة إلى بيئة قطبية باردة، فما التحديات التي ستواجهه بناءً على تكيفاته؟`;
      steps = [
        {
          stepNum: 1,
          title: 'تحليل التكيفات التركيبية لثعلب الفنك',
          detail: 'يمتلك أذنين كبيرتين لفقد الحرارة وتبريد جسمه وفراءً رملياً، وهي صفات مصممة للحرارة الشديدة.'
        },
        {
          stepNum: 2,
          title: 'تأثير البيئة القطبية المتجمدة',
          detail: 'الأذن الكبيرة ستؤدي لفقدان حرارة جسده بسرعة، وفراؤه الخفيف لن يمنحه العزل الكافي أمام الجليد.'
        },
        {
          stepNum: 3,
          title: 'الاستنتاج العلمي المحوري',
          detail: 'التكيفات التركيبية متخصصة جداً لكل بيئة، ولا يستطيع الكائن النجاة في بيئة متناقضة دون تكيفات مسبقة.'
        }
      ];
      goldenRule = 'التكيف التركيبي جزء من جسد الكائن الحي يولد به، بينما التكيف السلوكي هو تصرف ونشاط يقوم به استجابة للظروف.';
    } else if (isScienceEnergyMatter) {
      problemTitle = `تطبيق وتحليل فيزيائي على: ${title}`;
      problemText = `تتبع تحولات الطاقة وسرعة الأجسام عند تصادم سيارة لعبة بمكعب خشبي موضوع على طاولة.`;
      steps = [
        {
          stepNum: 1,
          title: 'امتلاك طاقة الحركة قبل التصادم',
          detail: 'تمتلك السيارة طاقة حركة ناتجة عن سرعتها وكتلتها أثناء اندفاعها.'
        },
        {
          stepNum: 2,
          title: 'انتقال الطاقة لحظة التصادم',
          detail: 'تنتقل طاقة الحركة من السيارة إلى المكعب، فيتحرك المكعب لمسافة تتناسب مع طاقة السيارة.'
        },
        {
          stepNum: 3,
          title: 'تحول جزء من الطاقة لصوت وحرارة',
          detail: 'يتحول جزء من الطاقة الحركية إلى طاقة صوتية (صوت الاصطدام) وطاقة حرارية ناتجة عن الاحتكاك.'
        }
      ];
      goldenRule = 'قانون بقاء الطاقة: الطاقة لا تفنى ولا تُستحدث من العدم، بل تتحول وتنتقل من جسم لآخر.';
    } else if (isSocialMaps) {
      problemTitle = `موقف تطبيقي وتحديد مسار على: ${title}`;
      problemText = `باستخدام خريطة بمقياس رسم (١ سم = ٥٠ كم)، إذا كانت المسافة بين مدينتك والعاصمة على الخريطة ٤ سم، فما المسافة الحقيقية؟`;
      steps = [
        {
          stepNum: 1,
          title: 'استخراج معطيات مقياس الرسم',
          detail: 'كل ١ سم على الخريطة يقابله ٥٠ كم على الطبيعة.'
        },
        {
          stepNum: 2,
          title: 'تطبيق علاقة الضرب التناسبي',
          detail: 'المسافة الحقيقية = المسافة على الخريطة (٤ سم) × مقياس الرسم (٥٠ كم).'
        },
        {
          stepNum: 3,
          title: 'حساب الناتج النهائي وتحديد الاتجاه',
          detail: '٤ × ٥٠ = ٢٠٠ كم. إذن المسافة الحقيقية بين المدينتين هي ٢٠٠ كيلومتر.'
        }
      ];
      goldenRule = 'مقياس الرسم هو النسبة بين المسافة على الخريطة وما يقابلها على أرض الواقع.';
    } else {
      // General Contextual Fallback
      problemTitle = `تطبيق عملي وسؤال تحليلي لدرس: ${title}`;
      problemText = summary ? `بناءً على درس "${title}": كيف توظف المفهوم الأساسي (${summary.substring(0, 100)}...) لحل التطبيقات الواقعية بدقة؟` : `كيف تستنتج القواعد الأساسية لـ "${title}" وتطبقها خطوة بخطوة؟`;
      steps = [
        {
          stepNum: 1,
          title: `تحليل المفهوم الأساسي لـ (${title})`,
          detail: summary ? (summary.substring(0, 130) + '...') : `تحديد العناصر الجوهرية والتعريفات المحورية لدرس ${title}.`
        },
        {
          stepNum: 2,
          title: 'التطبيق المباشر والربط بالأمثلة',
          detail: comparisonItems.length > 0 ? `الربط بين ${comparisonItems.map(c => c.title).slice(0, 2).join(' و ')} وتطبيق قواعدهما بالترتيب.` : 'ممارسة الخطوات العملية واستنتاج الفروق الدقيقة بين المفاهيم.'
        },
        {
          stepNum: 3,
          title: 'الاستخلاص والنتيجة المستهدفة',
          detail: `الوصول للفهم الكامل وإتقان الإجابة النموذجية في أي اختبار أو تطبيق واقعي لـ ${title}.`
        }
      ];
      goldenRule = `في درس (${title})، التركيز على فهم العلاقات التطبيقية بين المفاهيم يضمن الاستيعاب التام والدرجة الكاملة.`;
    }
  }

  if (!goldenRule) {
    goldenRule = summary ? `الخلاصة الذهبية: ${summary.substring(0, 160)}...` : `احرص دائماً على تطبيق خطوات ${title} بالترتيب لضمان الدقة وتثبيت المعلومة.`;
  }

  // Clean English brackets from text outputs
  problemText = problemText.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();
  goldenRule = goldenRule.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();

  return {
    problemTitle,
    problemText,
    steps,
    goldenRule,
    comparisonItems
  };
}

/**
 * Interactive Worked Example & Quick Comparison Hub
 * Dynamically tailored per chapter with step-by-step solved examples, direct concept comparisons, and exam tips.
 */
function ChapterWorkedExampleAndComparison({ chapter }: { chapter: Chapter }) {
  const [activeTab, setActiveTab] = useState<'example' | 'tip'>('example');
  const [showSolutionSteps, setShowSolutionSteps] = useState(true);

  // Dynamically extract and build per-chapter data
  const hubData = extractDynamicChapterHubData(chapter);

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-800/50 space-y-5">
      
      {/* HEADER WITH PRACTICAL TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-800/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Sigma className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                تطبيق مباشر ومسائل محلولة 📐
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
              التطبيق العملي وتريكات الامتحان لدرس: {chapter.title}
            </h4>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 gap-1">
          <button
            onClick={() => setActiveTab('example')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'example' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span>📐 مسألة وتطبيق محلول</span>
          </button>
          <button
            onClick={() => setActiveTab('tip')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tip' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span>💡 تريكة الامتحان</span>
          </button>
        </div>
      </div>

      {/* 1. TAB: WORKED EXAMPLE WITH STEP-BY-STEP SOLUTION */}
      {activeTab === 'example' && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-black text-amber-300">
              📌 {hubData.problemTitle}
            </span>
            <button
              onClick={() => setShowSolutionSteps(!showSolutionSteps)}
              className="text-xs text-indigo-200 hover:text-white font-bold underline cursor-pointer"
            >
              {showSolutionSteps ? 'إخفاء خطوات الحل' : 'إظهار خطوات الحل النموذجية 💡'}
            </button>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-2xl border border-indigo-700/60 text-sm font-black text-amber-200 leading-relaxed font-sans">
            ❓ {hubData.problemText}
          </div>

          {showSolutionSteps && (
            <div className="space-y-3 pt-1 animate-fade-in">
              <span className="text-[11px] font-bold text-gray-300 block">خطوات الحل النموذجية:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {hubData.steps.map((st) => (
                  <div key={st.stepNum} className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-1.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center">
                        {st.stepNum}
                      </span>
                      <h6 className="font-black text-xs text-white">{st.title}</h6>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-medium">
                      {st.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: GOLDEN EXAM RULE & PRO TIP */}
      {activeTab === 'tip' && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-950 rounded-2xl p-6 border border-emerald-500/40 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>القاعدة الذهبية والتريكة الامتحانية:</span>
          </div>

          <p className="text-xs sm:text-sm text-gray-100 font-bold leading-relaxed">
            {hubData.goldenRule}
          </p>
        </div>
      )}

    </div>
  );
}

/**
 * 🌟 Interactive Master Reader (Option 1)
 * High-value, zero-clutter, unified learning dashboard with pure Arabic localization
 */
interface ReadSectionProps {
  chapter: Chapter;
  isInstructorOrAdmin?: boolean;
  isEditMode?: boolean;
  onSaveChapter?: (updatedChapter: Chapter) => Promise<void>;
  initialTab?: 'interleaved' | 'teacher_sos';
}

export function ReadSection({ chapter, isInstructorOrAdmin, isEditMode, onSaveChapter, initialTab }: ReadSectionProps) {
  const { t, language, dir } = useLanguage();
  const { isItemPlaying, isItemLoading, play, stop } = useGlobalAudio();
  const [showOriginalSource, setShowOriginalSource] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState<{ title: string; desc: string } | null>(null);
  const [readerTab, setReaderTab] = useState<'interleaved' | 'teacher_sos'>(initialTab || 'interleaved');

  useEffect(() => {
    if (initialTab) {
      setReaderTab(initialTab);
    }
  }, [initialTab]);

  // 🛰️ AXIS 2: LIGHTWEIGHT TELEMETRY ACTIVE READING TRACKER
  const [activeReadingSeconds, setActiveReadingSeconds] = useState(0);
  const lastActivityTimeRef = useRef(Date.now());
  const activeReadingSecondsRef = useRef(0);

  useEffect(() => {
    const markActive = () => { lastActivityTimeRef.current = Date.now(); };
    window.addEventListener('mousemove', markActive);
    window.addEventListener('keydown', markActive);
    window.addEventListener('scroll', markActive);
    window.addEventListener('touchstart', markActive);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastActivityTimeRef.current < 35000) {
        activeReadingSecondsRef.current += 1;
        setActiveReadingSeconds(activeReadingSecondsRef.current);
      }
    }, 1000);

    const syncInterval = setInterval(() => {
      if (activeReadingSecondsRef.current > 5) {
        fetch('/api/telemetry/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: localStorage.getItem('osera_user_id') || 'std_curr',
            studentName: localStorage.getItem('osera_user_name') || 'طالب المنصة',
            bookId: (chapter as any).bookId || 'active_book',
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            activeReadingSeconds: activeReadingSecondsRef.current,
            audioListenPercentage: Math.min(100, Math.round((activeReadingSecondsRef.current / 180) * 100)),
            isCompleted: activeReadingSecondsRef.current > 90
          })
        }).catch(() => {});
      }
    }, 25000);

    return () => {
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('scroll', markActive);
      window.removeEventListener('touchstart', markActive);
      clearInterval(timer);
      clearInterval(syncInterval);
    };
  }, [chapter.id]);



  // 🙋‍♂️ AXIS 1: TEACHER DIRECT SOS HELPDESK STATE
  const [sosQuestionText, setSosQuestionText] = useState('');
  const [sosSnippet, setSosSnippet] = useState('');
  const [sosTicketsList, setSosTicketsList] = useState<any[]>([]);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosSuccessNotice, setSosSuccessNotice] = useState(false);

  const loadSosTickets = async () => {
    try {
      const res = await fetch(`/api/helpdesk/tickets?chapterId=${chapter.id}`);
      const data = await res.json();
      if (data.tickets) setSosTicketsList(data.tickets);
    } catch (e) {}
  };

  useEffect(() => {
    loadSosTickets();
  }, [chapter.id]);

  const handleSendSosTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosQuestionText.trim() || isSendingSos) return;
    setIsSendingSos(true);
    try {
      const res = await fetch('/api/helpdesk/ask-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: (chapter as any).bookId || 'active_book',
          bookTitle: chapter.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          studentId: localStorage.getItem('osera_user_id') || 'std_curr',
          studentName: localStorage.getItem('osera_user_name') || 'طالب المنصة',
          selectedSnippet: sosSnippet || chapter.summary?.substring(0, 100),
          questionText: sosQuestionText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setSosSuccessNotice(true);
        setSosQuestionText('');
        setSosSnippet('');
        loadSosTickets();
        setTimeout(() => setSosSuccessNotice(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingSos(false);
    }
  };

  // 📝 INLINE WORD-LIKE EDITOR STATE FOR INSTRUCTORS
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chapter.title);
  const [editedSummary, setEditedSummary] = useState(chapter.summary || '');
  const [editedContent, setEditedContent] = useState(chapter.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editTab, setEditTab] = useState<'editor' | 'preview'>('editor');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<Array<{ title: string; summary: string; content: string }>>([
    { title: chapter.title, summary: chapter.summary || '', content: chapter.content || '' }
  ]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedTitle(chapter.title);
    setEditedSummary(chapter.summary || '');
    setEditedContent(chapter.content || '');
    setIsInlineEditing(false);
    setHistory([{ title: chapter.title, summary: chapter.summary || '', content: chapter.content || '' }]);
    setHistoryIdx(0);
  }, [chapter.id]);

  const recordHistory = (title: string, summary: string, content: string) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push({ title, summary, content });
    if (nextHistory.length > 30) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = contentTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = editedContent.substring(start, end) || 'نص هنا';
    const newContent = editedContent.substring(0, start) + prefix + selectedText + suffix + editedContent.substring(end);
    
    setEditedContent(newContent);
    recordHistory(editedTitle, editedSummary, newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setEditedTitle(prev.title);
      setEditedSummary(prev.summary);
      setEditedContent(prev.content);
      setHistoryIdx(historyIdx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setEditedTitle(next.title);
      setEditedSummary(next.summary);
      setEditedContent(next.content);
      setHistoryIdx(historyIdx + 1);
    }
  };

  const handleSaveInline = async () => {
    if (!onSaveChapter) return;
    setIsSaving(true);
    try {
      await onSaveChapter({
        ...chapter,
        title: editedTitle.trim() || chapter.title,
        summary: editedSummary.trim(),
        content: editedContent.trim()
      });
      setSaveSuccessMsg(true);
      setTimeout(() => {
        setSaveSuccessMsg(false);
        setIsInlineEditing(false);
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const normalizedSummary = sanitizeEducationalMarkdown(chapter.summary);
  const normalizedContent = sanitizeEducationalMarkdown(chapter.content);

  // Derive original text with fallback to passage blocks or chapter content if blank
  let rawOriginal = chapter.originalContent || '';
  if (!rawOriginal && chapter.content) {
    const originalBlockMatch = chapter.content.match(/(?:###?\s*(?:📜\s*)?(?:النص القرائي|المصدر الأصلي|النص الأصلي|الفقرة القرائية|نص الدرس)[\s\S]*?)(?=\n###?|\n##|$)/i);
    if (originalBlockMatch && originalBlockMatch[0].length > 40) {
      rawOriginal = originalBlockMatch[0].replace(/^###?.*?\n/, '').trim();
    } else {
      rawOriginal = chapter.content;
    }
  }
  const normalizedOriginal = sanitizeEducationalMarkdown(rawOriginal);

  const conceptsArr = Array.isArray(chapter.concepts) ? chapter.concepts : [];

  // Master narration text: summary + content combined
  const fullNarrationText = `${chapter.title}. ${normalizedSummary}. ${normalizedContent}`;
  const masterAudioId = `master-read-${chapter.id}`;
  const isMasterPlaying = isItemPlaying(masterAudioId);
  const isMasterLoading = isItemLoading(masterAudioId);

  // Track Reading Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((window.scrollY / totalHeight) * 100)));
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Estimated reading time
  const wordCount = fullNarrationText.split(/\s+/).filter(Boolean).length;
  const estimatedReadingMinutes = Math.max(3, Math.round(wordCount / 140));

  // Domain Subject Theme
  const combinedMeta = `${chapter.title} ${normalizedSummary} ${normalizedContent}`.toLowerCase();
  const isArabicHistory = combinedMeta.includes('عربي') || combinedMeta.includes('نحو') || combinedMeta.includes('تاريخ') || combinedMeta.includes('دراسات') || combinedMeta.includes('قصة') || combinedMeta.includes('بلاغة');
  const isStem = combinedMeta.includes('كيمياء') || combinedMeta.includes('فيزياء') || combinedMeta.includes('علوم') || combinedMeta.includes('chemistry') || combinedMeta.includes('physics');
  const isBio = combinedMeta.includes('أحياء') || combinedMeta.includes('biology') || combinedMeta.includes('جيولوجيا') || combinedMeta.includes('خلية');
  const isMath = combinedMeta.includes('رياضيات') || combinedMeta.includes('math') || combinedMeta.includes('جبر') || combinedMeta.includes('هندسة') || combinedMeta.includes('مالية') || combinedMeta.includes('حساب');
  const isLanguage = combinedMeta.includes('english') || combinedMeta.includes('إنجليزي') || combinedMeta.includes('grammar') || combinedMeta.includes('french');

  const theme = isArabicHistory
    ? {
        gradient: 'from-amber-950 via-amber-900 to-stone-950',
        border: 'border-amber-800/60',
        badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
        badgeText: '📜 لغة عربية وتأصيل لغوي',
        accentBtn: 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20',
        progressColor: 'from-amber-500 to-amber-300'
      }
    : isStem
    ? {
        gradient: 'from-slate-950 via-indigo-950 to-cyan-950',
        border: 'border-cyan-800/60',
        badgeBg: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
        badgeText: '🧪 فيزياء وكيمياء تجريبية',
        accentBtn: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-cyan-400/20',
        progressColor: 'from-cyan-500 to-blue-400'
      }
    : isBio
    ? {
        gradient: 'from-emerald-950 via-teal-950 to-slate-950',
        border: 'border-emerald-800/60',
        badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
        badgeText: '🔬 علوم بيولوجية وحيوية',
        accentBtn: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-emerald-400/20',
        progressColor: 'from-emerald-500 to-teal-300'
      }
    : isMath
    ? {
        gradient: 'from-indigo-950 via-blue-950 to-slate-950',
        border: 'border-indigo-800/60',
        badgeBg: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
        badgeText: '🔢 رياضيات ونمذجة كمية',
        accentBtn: 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20',
        progressColor: 'from-indigo-500 to-blue-400'
      }
    : isLanguage
    ? {
        gradient: 'from-purple-950 via-indigo-950 to-slate-950',
        border: 'border-purple-800/60',
        badgeBg: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
        badgeText: '🎧 لغات واستماع تفاعلي',
        accentBtn: 'bg-purple-400 text-slate-950 hover:bg-purple-300 shadow-purple-400/20',
        progressColor: 'from-purple-500 to-indigo-400'
      }
    : {
        gradient: 'from-indigo-950 via-indigo-900 to-slate-950',
        border: 'border-indigo-800/60',
        badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
        badgeText: '🎓 القارئ الأكاديمي الذكي',
        accentBtn: 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20',
        progressColor: 'from-indigo-500 to-purple-400'
      };

  const handleToggleMasterAudio = () => {
    if (isMasterPlaying || isMasterLoading) {
      stop();
      return;
    }

    const cleanText = fullNarrationText
      .replace(/^[ \t]*>[ \t]*/gm, ' ')
      .replace(/(?:^|\n)\s*>\s*/g, ' ')
      .replace(/(?:نص المذكرة الأصلي المعتمد|المصدر النصي الموثق|ماذا ستتعلم وتتقن في هذا الدرس|التشريح العلمي وتفكيك المعنى|معجم القواعد والمصطلحات الحاكمة|المسائل التدريبية والحلول النموذجية|منظومة المسائل الثلاثية الإلزامية المتدرجة|مصيدة الامتحان والقاعدة الذهبية)/gi, ' ')
      .replace(/\[\!(IMPORTANT|WARNING|TIP|NOTE)\]/gi, ' ')
      .replace(/\[.*?\]/g, ' ')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, ' ')
      .replace(/[\u2600-\u27BF\u2300-\u23FF\u2B50\u200D\uFE0F\u20E3\u2190-\u21FF]/g, ' ')
      .replace(/[🔴🔵🟢🟣🟠🟡⚪⚫🔺🔻⭐✨💡📌🧭📏🗺️⚠️🚨🎉🎙️🎒🔍🎮📖📐🎯🧠💡🎬🚀📐⚡🏆🔥]/gu, ' ')
      .replace(/(\d+)\s*[\/÷]\s*(\d+)/g, '$1 على $2')
      .replace(/([^\d\s\/\\]+)\s*[\/\\]\s*([^\d\s\/\\]+)/g, '$1 أو $2')
      .replace(/[\(\)\[\]\{\}«»‹›（）【】〔〕《》“”"'\`\/\\]/g, ' ')
      .replace(/[><*_#`~\|\$]/g, ' ')
      .replace(/\.{2,}/g, ' ، ')
      .replace(/…/g, ' ، ')
      .replace(/[:؛;]/g, ' ، ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    play(masterAudioId, async () => {
      const res = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, speaker: 'male' })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch audio stream');
      }

      return await res.blob();
    });
  };

  const getFontSizeClass = () => {
    return 'text-sm sm:text-base leading-relaxed text-slate-800';
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto pb-12 transition-all ${isZenMode ? 'fixed inset-0 z-50 bg-slate-950/95 overflow-y-auto p-4 sm:p-10 max-w-none' : ''}`}>
      
      {/* 📊 SCROLL PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gray-200/50 z-50 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${theme.progressColor} transition-all duration-150 shadow-sm`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 🧭 1. UNIFIED DOMAIN THEMED CHAPTER HERO BANNER */}
      <div className={`bg-gradient-to-r ${theme.gradient} text-white p-6 sm:p-8 rounded-3xl shadow-xl border ${theme.border} flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden`}>
        
        {/* Glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-xs ${theme.badgeBg}`}>
              <span>{theme.badgeText}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 text-[11px] font-mono font-bold border border-white/10">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>~{estimatedReadingMinutes} دقيقة قراءة</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">{chapter.title}</h3>
        </div>

        {/* MASTER AUDIO & TOOLBAR BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10">
          
          {/* ZEN FOCUS MODE TOGGLE */}
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold ${
              isZenMode 
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' 
                : 'bg-white/10 text-gray-200 border-white/10 hover:bg-white/20 hover:text-white'
            }`}
            title={isZenMode ? "الخروج من وضع التركيز" : "تفعيل وضع التركيز الهادئ (Zen Mode)"}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isZenMode ? 'إنهاء التركيز' : 'وضع التركيز 🧘'}</span>
          </button>

          {/* MASTER AUDIO TRIGGER BUTTON */}
          <button
            onClick={handleToggleMasterAudio}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer ${
              isMasterPlaying
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30 animate-pulse'
                : isMasterLoading
                ? 'bg-amber-400 text-slate-950 opacity-90'
                : theme.accentBtn
            }`}
          >
            {isMasterLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري المعالجة...</span>
              </>
            ) : isMasterPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>إيقاف الصوت</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>🎙️ استمع للشرح الصوتي</span>
              </>
            )}
          </button>
        </div>
      </div>





      {/* INLINE WORD-LIKE EDITOR BUTTON (VISIBLE ONLY WHEN TEACHER EDIT MODE IS ACTIVE) */}
      {isInstructorOrAdmin && isEditMode && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setIsInlineEditing(!isInlineEditing);
              if (!isInlineEditing) {
                setEditedTitle(chapter.title);
                setEditedSummary(chapter.summary || '');
                setEditedContent(chapter.content || '');
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-xs cursor-pointer ${
              isInlineEditing
                ? 'bg-amber-400 text-slate-950 border-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isInlineEditing ? 'إغلاق التحرير' : 'تحرير نص الدرس فوراً (Word Editor) ✏️'}</span>
          </button>
        </div>
      )}

      {/* ✏️ INLINE WORD-LIKE EDITOR (INSTRUCTORS ONLY) */}
      {isInlineEditing && (
        <div className="bg-white border-2 border-indigo-400 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 animate-slide-up">
          {/* Editor Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-950">وضع التحرير المباشر السريع (Word Editor)</h4>
                <p className="text-[10px] text-gray-500">عدّل نص الدرس، العنوان، أو النواتج واحفظ فوراً في المنصة</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Undo / Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIdx <= 0}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition cursor-pointer"
                title="تراجع (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIdx >= history.length - 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition cursor-pointer"
                title="إعادة (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>

              {/* Edit / Preview Tabs */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditTab('editor')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${editTab === 'editor' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600'}`}
                >
                  تحرير ✍️
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('preview')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${editTab === 'preview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600'}`}
                >
                  معاينة 👁️
                </button>
              </div>
            </div>
          </div>

          {/* Chapter Title & Summary fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1 space-y-1">
              <label className="text-[11px] font-black text-gray-700 block">عنوان الدرس / الفصل:</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  recordHistory(e.target.value, editedSummary, editedContent);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-black text-gray-700 block">ملخص نواتج التعلم المستهدفة:</label>
              <input
                type="text"
                value={editedSummary}
                onChange={(e) => {
                  setEditedSummary(e.target.value);
                  recordHistory(editedTitle, e.target.value, editedContent);
                }}
                placeholder="أدخل ملخصاً سريعاً أو نواتج التعلم..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Word Formatting Toolbar */}
          {editTab === 'editor' && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-100 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="نص عريض (Bold)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="نص مائل (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-4 bg-gray-300 mx-0.5" />
              <button
                type="button"
                onClick={() => insertFormatting('\n## ', '\n')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="عنوان رئيسي (H2)"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n### ', '\n')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="عنوان فرعي (H3)"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-4 bg-gray-300 mx-0.5" />
              <button
                type="button"
                onClick={() => insertFormatting('\n- ', '\n')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="قائمة نقطية"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n1. ', '\n')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="قائمة رقمية"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n> ', '\n')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="اقتباس أو ملحوظة مهمة"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition cursor-pointer"
                title="معادلة / رمز"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n| العنصر | الشرح والتطبيق |\n| :--- | :--- |\n| مفهوم 1 | شرح وتفصيل |\n| مفهوم 2 | شرح وتفصيل |\n')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition text-[11px] cursor-pointer"
                title="إدراج جدول مقارنة"
              >
                جدول 📊
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n> [!NOTE]\n> ملحوظة هامة للامتحان: ')}
                className="p-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-lg transition text-[11px] cursor-pointer"
                title="إدراج تنبيه للامتحان"
              >
                تنبيه 💡
              </button>
            </div>
          )}

          {/* Editor Body or Preview Body */}
          {editTab === 'editor' ? (
            <textarea
              ref={contentTextareaRef}
              value={editedContent}
              onChange={(e) => {
                setEditedContent(e.target.value);
                recordHistory(editedTitle, editedSummary, e.target.value);
              }}
              rows={14}
              placeholder="اكتب أو عدّل محتوى الدرس والشرح هنا باستخدام ماركداون وتنسيقات وورد..."
              className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          ) : (
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-gray-200 min-h-[300px] prose prose-slate max-w-none text-xs sm:text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                {editedContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Action Save Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsInlineEditing(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء التعديل ✕
            </button>

            <div className="flex items-center gap-2">
              {saveSuccessMsg && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ التعديلات بنجاح!</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveInline}
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات فوراً 💾'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 💡 3. CORE CONCEPTS INTERACTIVE GRID WITH AUDIO PRONUNCIATION */}
      {conceptsArr.length > 0 && (
        <div id="core-concepts" className="space-y-3.5 scroll-mt-16">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs sm:text-sm font-black text-gray-900">المفاهيم المحورية والمصطلحات الأساسية للدرس ({conceptsArr.length})</span>
            </div>
            <span className="text-[11px] text-gray-400 font-bold hidden sm:inline">
              انقر للاستماع للنطق أو عرض الشرح المعرفي 💡
            </span>
          </div>

          <div className={`grid gap-3.5 ${conceptsArr.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
            {conceptsArr.map((concept: any, idx: number) => {
              const rawName = typeof concept === 'string' ? concept : (concept.concept || concept.title || `مفهوم ${idx+1}`);
              const rawDesc = typeof concept === 'string' ? '' : (concept.explanation || concept.description || '');
              
              const cName = rawName.replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();
              const cDesc = sanitizeEducationalMarkdown(rawDesc).replace(/\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '').trim();

              const handleSpeakConcept = (e: React.MouseEvent) => {
                e.stopPropagation();
                const fullSpeech = `${cName}. ${cDesc}`;
                const audioUrl = `/api/tts/stream?text=${encodeURIComponent(fullSpeech)}&speaker=female&voice=ar-XA-Chirp3-HD-Aoede&lang=ar`;
                const audio = new Audio(audioUrl);
                audio.play().catch(() => {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const cleanFallback = fullSpeech.replace(/["'«»<>{}\[\]]/g, ' ');
                    const utter = new SpeechSynthesisUtterance(cleanFallback);
                    utter.lang = 'ar-SA';
                    utter.rate = 0.95;
                    window.speechSynthesis.speak(utter);
                  }
                });
              };

              return (
                <div 
                  key={idx} 
                  className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-50 hover:border-indigo-200 shadow-xs hover:shadow-sm transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <h5 className="font-black text-gray-900 text-sm sm:text-base text-indigo-950">{cName}</h5>
                    </div>

                    <button
                      type="button"
                      onClick={handleSpeakConcept}
                      className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      title="استمع لنطق المفهوم وشرحه"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">نطق</span>
                    </button>
                  </div>

                  {cDesc && (
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium bg-gray-50/90 p-3 rounded-xl border border-gray-100">
                      {cDesc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📇 CONCEPT POPUP MODAL */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-indigo-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h4 className="font-black text-base text-gray-900">{selectedConcept.title}</h4>
              </div>
              <button
                onClick={() => setSelectedConcept(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-sm text-gray-800 leading-relaxed font-medium">
              {selectedConcept.desc}
            </div>

            <button
              onClick={() => setSelectedConcept(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition"
            >
              إغلاق البطاقة
            </button>
          </div>
        </div>
      )}

            {/* TAB 1: INTERLEAVED READER (DEFAULT) */}
      {readerTab === 'interleaved' && (
        <div>
          {/* 📖 5. UNIFIED DEEP LESSON CONTENT (THE CORE READER) */}
      {normalizedContent && (
        <div id="detailed-content" className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-5 scroll-mt-16">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-600 block">الشرح التطبيقي والأمثلة الميسرة</span>
                <h4 className="text-base sm:text-lg font-black text-gray-900">المحتوى التعليمي الكامل للدرس</h4>
              </div>
            </div>
          </div>

          <div className={`prose prose-slate max-w-none text-gray-800 leading-relaxed ${getFontSizeClass()}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
              {normalizedContent}
            </ReactMarkdown>
          </div>

        </div>
      )}

      
        </div>
      )}



      {/* TAB 4: TEACHER DIRECT SOS HELPDESK */}
      {readerTab === 'teacher_sos' && (
        <div className="bg-white border-2 border-rose-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-rose-950">استفسارات المعلم المباشرة (Teacher Direct SOS)</h4>
                <p className="text-xs text-rose-700">أرسل استفسارك مباشرة لمعلم المذكرة وسيرد عليك بشرح تفصيلي أو تسجيل صوتي موجه</p>
              </div>
            </div>
          </div>

          {/* Form to submit question */}
          <form onSubmit={handleSendSosTicket} className="space-y-4 bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 block">نص الاستفسار أو المسألة التي استوقفتك:</label>
              <textarea
                value={sosQuestionText}
                onChange={(e) => setSosQuestionText(e.target.value)}
                placeholder="اكتب استفسارك المحدد للمعلم هنا (مثال: لم أفهم كيفية حصر الجذر بين مربعين كاملين في خطوة 2)..."
                rows={3}
                required
                className="w-full p-3.5 bg-white border border-rose-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                📌 يتم إرفاق سياق الدرس الحالي ({chapter.title}) تلقائياً مع تذكرتك.
              </span>

              <button
                type="submit"
                disabled={isSendingSos}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingSos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>إرسال الاستفسار للمعلم 🚀</span>
              </button>
            </div>

            {sosSuccessNotice && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم إرسال استفسارك بنجاح إلى المعلم وسيظهر رده هنا وفي إشعارات حسابك!</span>
              </div>
            )}
          </form>

          {/* Previous Tickets & Teacher Answers */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>الاستفسارات السابقة وردود المعلم المعتمدة:</span>
            </h5>

            {sosTicketsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                لا توجد استفسارات مرسلة في هذا الدرس بعد. اكتب سؤالك أعلاه لتلقي توضيح مباشر من المعلم.
              </div>
            ) : (
              <div className="space-y-3">
                {sosTicketsList.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-700">سؤالك حول: {ticket.chapterTitle}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        ticket.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.status === 'answered' ? 'تم الرد من المعلم ✅' : 'قيد انتظار رد المعلم ⏳'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-900">{ticket.questionText}</p>

                    {ticket.teacherAnswer && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-black text-emerald-800 flex items-center gap-1">
                          <span>👨‍🏫 رد وتوجيه المعلم:</span>
                        </span>
                        <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                          <MathRenderer text={ticket.teacherAnswer} />
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


{/* 📑 6. COLLAPSIBLE ORIGINAL SOURCE MATERIAL */}
      {normalizedOriginal && (
        <div id="original-source" className="bg-gray-50/80 border border-gray-200/80 rounded-3xl overflow-hidden transition-all scroll-mt-16">
          <button
            onClick={() => setShowOriginalSource(!showOriginalSource)}
            className="w-full p-5 flex items-center justify-between text-right font-black text-xs sm:text-sm text-gray-700 hover:bg-gray-100/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>النص الأصلي المستخرج من المذكرة المرفوعة (للمطابقة والمراجعة)</span>
            </div>
            {showOriginalSource ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showOriginalSource && (
            <div className="p-6 pt-0 border-t border-gray-200/60 animate-fade-in">
              <div className="whitespace-pre-wrap bg-white p-5 rounded-2xl border border-gray-200 font-serif leading-relaxed text-xs text-gray-700 max-h-96 overflow-y-auto mt-4">
                {normalizedOriginal}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
