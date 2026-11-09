import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GitBranch, Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  Layers, CheckCircle, BookOpen, ChevronRight, ChevronDown, 
  HelpCircle, Lightbulb, Search, Download, Copy, Check, Eye,
  Compass, ArrowRight, BookMarked, Zap, Info, Filter, Share2
} from 'lucide-react';
import { MarketplaceBook, CurriculumMindMapPayload, CurriculumMindMapNode } from '../../types';
import { fireConfetti } from '../../utils/confetti';
import { useLanguage } from '../../i18n/LanguageContext';

interface CurriculumMindMapProps {
  book: MarketplaceBook;
  onNavigateToChapter?: (chapterId: string) => void;
  onMindMapUpdated?: (updatedMindMap: CurriculumMindMapPayload) => void;
}

export const CurriculumMindMap: React.FC<CurriculumMindMapProps> = ({
  book,
  onNavigateToChapter,
  onMindMapUpdated
}) => {
  const { t, dir } = useLanguage();
  const [mindmapData, setMindmapData] = useState<CurriculumMindMapPayload | null>(
    book.curriculum_mindmap || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // View states
  const [viewMode, setViewMode] = useState<'interactive_tree' | 'visual_diagram' | 'concepts_grid' | 'learning_path'>('interactive_tree');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<CurriculumMindMapNode | null>(null);
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Mermaid SVG state
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chaptersCount = book.chapters?.length || 0;

  // Check if saved mind map has fewer chapters than current book chapters
  const isOutdated = useMemo(() => {
    if (!mindmapData) return false;
    return (mindmapData.totalChapters || 0) < chaptersCount;
  }, [mindmapData, chaptersCount]);

  // Expand all chapters by default when data loads
  useEffect(() => {
    if (mindmapData?.nodes) {
      const initialExpanded: Record<string, boolean> = {};
      mindmapData.nodes.forEach(n => {
        if (n.level === 'chapter' || n.id.startsWith('ch-')) {
          initialExpanded[n.id] = true;
        }
      });
      setExpandedChapterIds(initialExpanded);
    }
  }, [mindmapData]);

  // Fetch initial saved mind map if not present in book prop
  useEffect(() => {
    if (!mindmapData && book.id) {
      fetch(`/api/v2/curriculum-mindmap/${book.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.mindmap) {
            setMindmapData(data.mindmap);
          }
        })
        .catch(() => {});
    }
  }, [book.id, mindmapData]);

  // Render Mermaid diagram whenever mermaidSyntax changes
  useEffect(() => {
    if (!mindmapData?.mermaidSyntax || viewMode !== 'visual_diagram') {
      return;
    }

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        let code = mindmapData.mermaidSyntax.trim();
        code = code.replace(/^```mermaid\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();

        if (!code.startsWith('graph') && !code.startsWith('flowchart') && !code.startsWith('mindmap')) {
          code = `flowchart TD\n${code}`;
        }

        let mermaidLib: any;
        try {
          const mod = await import('mermaid');
          mermaidLib = mod.default || mod;
        } catch (e) {
          if ((window as any).mermaid) {
            mermaidLib = (window as any).mermaid;
          }
        }

        if (mermaidLib) {
          mermaidLib.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Cairo, Tajawal, sans-serif',
            flowchart: {
              htmlLabels: true,
              curve: 'basis',
              padding: 24,
              nodeSpacing: 50,
              rankSpacing: 60
            },
            themeVariables: {
              darkMode: true,
              background: '#090d16',
              primaryColor: '#6366f1',
              primaryTextColor: '#f8fafc',
              primaryBorderColor: '#818cf8',
              lineColor: '#38bdf8',
              secondaryColor: '#1e1b4b',
              tertiaryColor: '#0f172a'
            }
          });

          const uniqueId = `curriculum-mindmap-svg-${Date.now()}`;
          const { svg } = await mermaidLib.render(uniqueId, code);
          if (isMounted) {
            setMermaidSvg(svg);
            setMermaidError(null);
          }
        }
      } catch (err: any) {
        console.warn("[Curriculum MindMap] Mermaid render error:", err);
        if (isMounted) {
          setMermaidError("تعذر عرض الرسم التخطيطي الكامل، يمكنك تصفح الخريطة التفاعلية الشجرية.");
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [mindmapData?.mermaidSyntax, viewMode]);

  // Fast Generate / Regenerate Handler
  const handleGenerateMindMap = async (force: boolean = false) => {
    try {
      setIsGenerating(true);
      setGenerationError(null);

      const res = await fetch('/api/v2/generate-curriculum-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          forceRegenerate: force
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل توليد الخريطة الذهنية للمنهج.');
      }

      setMindmapData(data.mindmap);
      if (onMindMapUpdated) {
        onMindMapUpdated(data.mindmap);
      }
      fireConfetti();
    } catch (err: any) {
      console.error("Mindmap error:", err);
      setGenerationError(err.message || 'حدث خطأ أثناء توليد الخريطة الذهنية.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleChapterExpand = (chId: string) => {
    setExpandedChapterIds(prev => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  // Group nodes by chapters for the interactive tree
  const chapterGroups = useMemo(() => {
    const rawNodes = mindmapData?.nodes || [];
    const chapterNodes = rawNodes.filter(n => n.level === 'chapter' || (n.parentId === 'root' && n.id !== 'root'));

    // Resilient fallback: If no chapter nodes were parsed but book has chapters, build graceful branches
    if (chapterNodes.length === 0 && Array.isArray(book.chapters) && book.chapters.length > 0) {
      return book.chapters.map((ch, idx) => ({
        chapterNode: {
          id: ch.id || `ch-${idx + 1}`,
          label: ch.title || `الفصل ${idx + 1}`,
          level: 'chapter' as const,
          description: ch.summary || 'المفاهيم والدروس التعليمية المقررة لهذا الفصل.',
          parentId: 'root',
          order: idx + 1
        },
        index: idx + 1,
        concepts: [
          {
            id: `c-${ch.id || idx}-1`,
            label: `مفاهيم ومحاور ${ch.title}`,
            parentId: ch.id || `ch-${idx + 1}`,
            level: 'concept' as const,
            description: ch.summary || 'المفاهيم والعناصر الجوهرية المقررة لهذا الفصل الدراسي.'
          }
        ]
      }));
    }

    if (chapterNodes.length === 0) return [];
    
    return chapterNodes.map((chNode, idx) => {
      const concepts = rawNodes.filter(n => n.parentId === chNode.id || n.chapterTitle === chNode.label);
      return {
        chapterNode: chNode,
        index: idx + 1,
        concepts: concepts.length > 0 ? concepts : [
          {
            id: `c-${chNode.id}-1`,
            label: `أساسيات ${chNode.label}`,
            parentId: chNode.id,
            level: 'concept' as const,
            description: chNode.description || 'المفاهيم المحورية لهذا الفصل.',
            keyTakeaway: chNode.keyTakeaway
          }
        ]
      };
    });
  }, [mindmapData, book.title, book.chapters]);

  // Filtered concepts for search
  const filteredNodes = useMemo(() => {
    if (!mindmapData?.nodes) return [];
    let list = mindmapData.nodes;
    
    if (selectedChapterFilter !== 'all') {
      list = list.filter(n => n.chapterTitle === selectedChapterFilter || n.id === selectedChapterFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => 
        n.label.toLowerCase().includes(q) || 
        n.description?.toLowerCase().includes(q) ||
        n.chapterTitle?.toLowerCase().includes(q) ||
        n.keyTakeaway?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [mindmapData?.nodes, searchQuery, selectedChapterFilter]);

  return (
    <div 
      ref={containerRef}
      className={`w-full min-w-0 max-w-full bg-slate-900/95 border border-purple-500/20 rounded-3xl p-4 sm:p-7 shadow-2xl transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto bg-slate-950 p-6' : ''
      }`}
      dir={dir}
    >
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 rounded-xl text-white shadow-md shadow-purple-500/20">
              <GitBranch className="w-5 h-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              🗺️ الخريطة الذهنية الشاملة لكامل المنهج (Master Curriculum Mind Map)
            </h3>
            {mindmapData && (
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{mindmapData.totalChapters} فصول مغطاة بالكامل</span>
              </span>
            )}
            {isOutdated && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                ⚠️ هناك فصول جديدة مضافة
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            خريطة تفاعلية ذكية ترتب مفاهيم وقوانين وفصول المنهج في شجرة بصرية واحدة لربط المعلومات وحفظها.
          </p>
        </div>

        {/* TOP VIEW BUTTONS & ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          {mindmapData && (
            <>
              {/* VIEW SWITCHER TABS */}
              <div className="bg-slate-800/90 p-1 rounded-2xl flex items-center border border-slate-700/50 flex-wrap gap-1">
                <button
                  onClick={() => setViewMode('interactive_tree')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'interactive_tree' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>الخريطة التفاعلية الحديثة</span>
                </button>
                <button
                  onClick={() => setViewMode('visual_diagram')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'visual_diagram' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>مخطط العلاقات</span>
                </button>
                <button
                  onClick={() => setViewMode('concepts_grid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'concepts_grid' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>دليل المفاهيم</span>
                </button>
                <button
                  onClick={() => setViewMode('learning_path')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'learning_path' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>مسار الإتقان</span>
                </button>
              </div>

              {/* FULLSCREEN TOGGLE */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* FAST REGENERATE / GENERATE BUTTON */}
          <button
            onClick={() => handleGenerateMindMap(Boolean(mindmapData))}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg ${
              isOutdated
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {isGenerating 
                ? 'جارٍ بناء الخريطة الذهنية...' 
                : mindmapData 
                ? (isOutdated ? '⚡ تحديث الخريطة بالفصول الجديدة' : '🔄 إعادة توليد وتحديث الخريطة') 
                : '⚡ توليد الخريطة الذهنية للمنهج'}
            </span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {generationError && (
        <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
          <span>⚠️ {generationError}</span>
        </div>
      )}

      {/* 2. BODY CONTENT */}
      {!mindmapData && !isGenerating ? (
        // HERO EMPTY STATE
        <div className="py-14 px-4 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-inner">
            <GitBranch className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-black text-white">لم يتم توليد خريطة المنهج الذهنية بعد</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              انقر على زر التوليد السريع ليقوم الذكاء الاصطناعي بربط كافة الفصول ({chaptersCount} فصول) وبناء شجرة معرفية تفاعلية جذابة في ثوانٍ.
            </p>
          </div>
          <button
            onClick={() => handleGenerateMindMap(false)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-lg shadow-purple-600/30 active:scale-95"
          >
            ⚡ بدء توليد الخريطة الذهنية الآن
          </button>
        </div>
      ) : isGenerating ? (
        // FAST LOADING ANIMATION
        <div className="py-16 text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="w-14 h-14 border-4 border-purple-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">جارٍ استخراج الروابط وهندسة الخريطة الذهنية ({chaptersCount} فصول)...</h4>
            <p className="text-xs text-slate-400 font-medium">نربط المفاهيم والقوانين في هيكل بصري تفاعلي</p>
          </div>
        </div>
      ) : (
        // 3. MAIN MIND MAP VIEWS
        <div className="mt-5 space-y-5">
          
          {/* COURSE SUMMARY OVERVIEW BANNER */}
          {mindmapData.summary && (
            <div className="p-4 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/20 rounded-2xl flex items-start gap-3 shadow-inner">
              <div className="p-2 bg-purple-500/20 rounded-xl text-amber-400 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-black text-purple-200">الرؤية المعرفية وترابط فصول المنهج:</h5>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {mindmapData.summary}
                </p>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: INTERACTIVE MODERN NODE TREE (NEW & STUNNING) */}
          {viewMode === 'interactive_tree' && (
            <div className="space-y-4">
              
              {/* ROOT COURSE HUB */}
              <div className="p-5 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border-2 border-indigo-500/40 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">
                    📚
                  </div>
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      محور المنهج الرئيسي (Root Hub)
                    </span>
                    <h3 className="text-base font-black text-white mt-1">
                      {mindmapData.courseTitle || book.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-300">
                    {chapterGroups.length} فصول تعليمية
                  </span>
                  <button
                    onClick={() => {
                      const allExp = Object.values(expandedChapterIds).every(Boolean);
                      const nextState: Record<string, boolean> = {};
                      chapterGroups.forEach(g => { nextState[g.chapterNode.id] = !allExp; });
                      setExpandedChapterIds(nextState);
                    }}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    {Object.values(expandedChapterIds).every(Boolean) ? 'طي كافة الفروع' : 'فتح وتوسيع كافة الفروع'}
                  </button>
                </div>
              </div>

              {/* CHAPTER BRANCHES & CONCEPT NODES GRID */}
              <div className="grid grid-cols-1 gap-4">
                {chapterGroups.map((group) => {
                  const isExpanded = expandedChapterIds[group.chapterNode.id] !== false;

                  return (
                    <div 
                      key={group.chapterNode.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-4 sm:p-5 transition-all shadow-md space-y-4"
                    >
                      {/* CHAPTER HEADER BAR */}
                      <div className="flex items-center justify-between gap-3">
                        <div 
                          onClick={() => toggleChapterExpand(group.chapterNode.id)}
                          className="flex items-center gap-3 cursor-pointer select-none group flex-1 min-w-0"
                        >
                          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-xs group-hover:scale-105 transition">
                            {group.index}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-purple-400">الفصل {group.index}</span>
                              <span className="text-[10px] text-slate-500">• {group.concepts.length} مفاهيم</span>
                            </div>
                            <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition truncate">
                              {group.chapterNode.label}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onNavigateToChapter && (
                            <button
                              onClick={() => {
                                const matchedChapter = (book.chapters || []).find((c, i) => i + 1 === group.index || c.title.trim() === group.chapterNode.label.trim());
                                if (matchedChapter) onNavigateToChapter(matchedChapter.id);
                              }}
                              className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 rounded-xl text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                              title="الانتقال لقراءة هذا الفصل"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                              <span className="hidden sm:inline">قراءة الفصل 📖</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedNode(group.chapterNode)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="عرض تفاصيل الفصل"
                          >
                            <Info className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden sm:inline">تفاصيل</span>
                          </button>

                          <button
                            onClick={() => toggleChapterExpand(group.chapterNode.id)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* CONCEPTS SUB-NODES (EXPANDABLE) */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in duration-200">
                          {group.concepts.map((concept) => (
                            <div
                              key={concept.id}
                              onClick={() => setSelectedNode(concept)}
                              className="p-3.5 bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-2xl transition cursor-pointer group space-y-2 select-none shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  مفهوم وقانون
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition rotate-180" />
                              </div>

                              <h5 className="text-xs font-black text-white group-hover:text-cyan-300 transition line-clamp-1">
                                {concept.label}
                              </h5>

                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium">
                                {concept.description}
                              </p>

                              {concept.keyTakeaway && (
                                <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-amber-300 font-bold">
                                  <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">{concept.keyTakeaway}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: VISUAL MERMAID DIAGRAM */}
          {viewMode === 'visual_diagram' && (
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 overflow-hidden">
              
              {/* ZOOM & CONTROLS TOOLBAR */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl backdrop-blur shadow-md">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 2.2))}
                  title="تكبير"
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.5))}
                  title="تصغير"
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  title="إعادة ضبط"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg transition cursor-pointer"
                >
                  100%
                </button>
              </div>

              {/* MERMAID SVG RENDERER */}
              {mermaidSvg ? (
                <div 
                  className="w-full overflow-auto max-h-[580px] p-4 flex justify-center items-center scrollbar-thin"
                  style={{ minHeight: '380px' }}
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                    style={{ 
                      transform: `scale(${zoomLevel})`, 
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease-out' 
                    }}
                    className="mermaid-wrapper min-w-full flex justify-center [&>svg]:max-w-none [&>svg]:h-auto"
                  />
                </div>
              ) : mermaidError ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <p className="text-xs text-amber-400">{mermaidError}</p>
                  <button 
                    onClick={() => setViewMode('interactive_tree')}
                    className="text-xs text-purple-400 hover:underline font-bold"
                  >
                    الانتقال للخريطة التفاعلية الشجرية ←
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-bold">
                  جارٍ معالجة وتصيير المخطط البياني...
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 3: CONCEPTS SEARCH & FILTER GRID */}
          {viewMode === 'concepts_grid' && (
            <div className="space-y-4">
              {/* SEARCH & CHAPTER FILTER */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث عن أي مفهوم، قانون، أو عنوان في كامل المقرر..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <select
                  value={selectedChapterFilter}
                  onChange={(e) => setSelectedChapterFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">📚 كافة الفصول ({chaptersCount})</option>
                  {chapterGroups.map((g) => (
                    <option key={g.chapterNode.id} value={g.chapterNode.label}>
                      فصل {g.index}: {g.chapterNode.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* CONCEPTS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredNodes.map((node) => {
                  const isRoot = node.level === 'root' || node.id === 'root';
                  const isChapter = node.level === 'chapter';

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-2.5 ${
                        isRoot
                          ? 'bg-indigo-950/50 border-indigo-500/40 hover:border-indigo-400'
                          : isChapter
                          ? 'bg-purple-950/40 border-purple-500/30 hover:border-purple-400'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          isRoot ? 'bg-indigo-500/20 text-indigo-300' : isChapter ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/10 text-cyan-300'
                        }`}>
                          {isRoot ? 'المقرر بالكامل' : isChapter ? `فصل ${node.chapterIndex || ''}` : 'مفهوم وقانون'}
                        </span>
                        {node.chapterTitle && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {node.chapterTitle}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-white leading-snug">
                        {node.label}
                      </h4>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {node.description}
                      </p>

                      {node.keyTakeaway && (
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-amber-300 font-bold">
                          <Lightbulb className="w-3 h-3 shrink-0 text-amber-400" />
                          <span className="truncate">{node.keyTakeaway}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 4: LEARNING PATH ROADMAP */}
          {viewMode === 'learning_path' && (
            <div className="space-y-3">
              {mindmapData.learningPath?.map((milestone, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/80 border border-slate-800 hover:border-purple-500/30 rounded-2xl flex items-start gap-3.5 transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    {milestone.step || idx + 1}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-white">{milestone.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{milestone.focus}</p>
                    {milestone.keyConcepts && milestone.keyConcepts.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {milestone.keyConcepts.map((kc, kIdx) => (
                          <span
                            key={kIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/50"
                          >
                            {kc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* 4. DETAIL MODAL FOR SELECTED NODE */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 text-right" dir={dir}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black text-purple-300">تفاصيل المفهوم المعرفي</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-black text-white">{selectedNode.label}</h3>
              {selectedNode.chapterTitle && (
                <p className="text-xs text-purple-400 font-bold">
                  📚 الفصل: {selectedNode.chapterTitle}
                </p>
              )}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedNode.description}
                </p>
              </div>
            </div>

            {selectedNode.keyTakeaway && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-amber-300 mb-0.5">القاعدة الذهبية / فخ الامتحان:</strong>
                  <span>{selectedNode.keyTakeaway}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumMindMap;
