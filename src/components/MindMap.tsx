import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Info,
  Check,
  X,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Languages,
  Brain,
  GitBranch,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { MindMapNode } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface MindMapProps {
  nodes: MindMapNode[];
  onUpdateNodes: (updatedNodes: MindMapNode[]) => void;
  ebookId?: string;
  chapterId?: string;
  chapterContent?: string;
}

export default function MindMap({ nodes = [], onUpdateNodes, ebookId, chapterId, chapterContent }: MindMapProps) {
  const { t, dir } = useLanguage();
  // Local synchronized nodes state
  const [internalNodes, setInternalNodes] = useState<MindMapNode[]>(nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync internalNodes with incoming props
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      setInternalNodes(nodes);
    }
  }, [nodes]);

  // AI & Voice Pilot states
  const [isRecording, setIsRecording] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [aiError, setAiError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Edit form state
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);

  // Add form state
  const [addLabel, setAddLabel] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addParentId, setAddParentId] = useState<string | null>(null);

  // Safe normalized nodes (guarantees roots and valid parent references)
  const normalizedNodes = useMemo(() => {
    const list = internalNodes.length > 0 ? internalNodes : [
      { id: 'node-root', label: 'المفهوم الرئيسي للفصل', parentId: null, description: 'الفكرة المركزية والأساسية في هذا الموضوع.' },
      { id: 'node-sub-1', label: 'المبادئ الأساسية', parentId: 'node-root', description: 'الأسس النظرية والقواعد الأولية.' },
      { id: 'node-sub-2', label: 'التطبيقات العملية', parentId: 'node-root', description: 'أمثلة ومهارات واقعية.' }
    ];

    const validIds = new Set(list.map(n => n.id));
    return list.map((node, index) => {
      const isParentValid = node.parentId && validIds.has(node.parentId) && node.parentId !== node.id;
      return {
        ...node,
        parentId: isParentValid ? node.parentId : (index === 0 ? null : list[0].id)
      };
    });
  }, [internalNodes]);

  // Compute Layout coordinates safely using breadth-first levels
  const { layout, svgWidth, svgHeight } = useMemo(() => {
    const coords: { [id: string]: { x: number; y: number; level: number } } = {};
    if (normalizedNodes.length === 0) {
      return { layout: coords, svgWidth: 800, svgHeight: 400 };
    }

    // Identify roots
    const rootNodes = normalizedNodes.filter(n => !n.parentId);
    const effectiveRoots = rootNodes.length > 0 ? rootNodes : [normalizedNodes[0]];

    const levelMap = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();

    normalizedNodes.forEach(n => childrenMap.set(n.id, []));
    normalizedNodes.forEach(n => {
      if (n.parentId && childrenMap.has(n.parentId)) {
        childrenMap.get(n.parentId)!.push(n.id);
      }
    });

    // Assign level using BFS
    const queue: { id: string; level: number }[] = effectiveRoots.map(r => ({ id: r.id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levelMap.set(id, level);

      const children = childrenMap.get(id) || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Place any remaining unvisited nodes at level 1
    normalizedNodes.forEach(n => {
      if (!levelMap.has(n.id)) levelMap.set(n.id, 1);
    });

    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    levelMap.forEach((level, id) => {
      if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
      nodesByLevel.get(level)!.push(id);
    });

    const maxLevel = Math.max(...Array.from(levelMap.values()), 0);
    const maxNodesInAnyLevel = Math.max(...Array.from(nodesByLevel.values()).map(arr => arr.length), 1);

    const calculatedWidth = Math.max(750, (maxLevel + 1) * 250 + 100);
    const calculatedHeight = Math.max(450, maxNodesInAnyLevel * 110 + 60);

    // Compute coordinates
    nodesByLevel.forEach((nodeIds, level) => {
      const x = 80 + level * 230;
      const verticalSpacing = calculatedHeight / (nodeIds.length + 1);
      nodeIds.forEach((nodeId, idx) => {
        coords[nodeId] = {
          x,
          y: verticalSpacing * (idx + 1),
          level
        };
      });
    });

    return { layout: coords, svgWidth: calculatedWidth, svgHeight: calculatedHeight };
  }, [normalizedNodes]);

  const selectedNode = useMemo(() => normalizedNodes.find(n => n.id === selectedNodeId) || null, [normalizedNodes, selectedNodeId]);

  const startSpeechRecognition = () => {
    setAiError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiError("التعرف على الصوت غير مدعوم في متصفحك حالياً. يمكنك كتابة الأمر يدوياً أدناه!");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = speechLanguage;

      rec.onstart = () => setIsRecording(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoicePrompt(prev => prev ? prev + " " + transcript : transcript);
      };
      rec.onerror = (event: any) => {
        setAiError(`خطأ أثناء الاستماع: ${event.error || "يرجى المحاولة مجدداً"}`);
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);

      rec.start();
      setRecognitionInstance(rec);
    } catch (err: any) {
      setAiError("تعذر تشغيل الميكروفون: " + err.message);
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch (e) {}
    }
    setIsRecording(false);
  };

  const handleApplyAI = async () => {
    if (!voicePrompt.trim()) {
      setAiError("يرجى كتابة أو نطق تعليمات تعديل الخريطة أولاً!");
      return;
    }
    setIsProcessingAI(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/ebooks/${ebookId}/chapters/${chapterId}/mindmap/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: voicePrompt,
          nodes: normalizedNodes,
          chapterContent
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "تعذر تعديل الخريطة بواسطة الذكاء الاصطناعي.");
      }

      const data = await res.json();
      if (data.success && data.nodes) {
        setInternalNodes(data.nodes);
        onUpdateNodes(data.nodes);
        setVoicePrompt('');
        setSelectedNodeId(null);
        setIsEditing(false);
        setIsAdding(false);
      } else {
        throw new Error(data.error || "فشل تحديث الخريطة.");
      }
    } catch (err: any) {
      setAiError(err.message || "حدث خطأ أثناء تعديل الخريطة بالذكاء الاصطناعي.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const startEdit = (node: MindMapNode) => {
    setEditLabel(node.label);
    setEditDescription(node.description || '');
    setEditParentId(node.parentId);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!selectedNodeId || !editLabel.trim()) return;
    const updated = normalizedNodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, label: editLabel, description: editDescription, parentId: editParentId };
      }
      return n;
    });
    setInternalNodes(updated);
    onUpdateNodes(updated);
    setIsEditing(false);
  };

  const handleAddNode = () => {
    if (!addLabel.trim()) return;
    const newNodeId = `m-node-${Date.now()}`;
    const newNode: MindMapNode = {
      id: newNodeId,
      label: addLabel,
      parentId: addParentId || (selectedNodeId || null),
      description: addDescription || 'مفهوم جديد مضاف للخريطة'
    };
    const updated = [...normalizedNodes, newNode];
    setInternalNodes(updated);
    onUpdateNodes(updated);
    setAddLabel('');
    setAddDescription('');
    setIsAdding(false);
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    const nodeToDelete = normalizedNodes.find(n => n.id === nodeId);
    const parentId = nodeToDelete ? nodeToDelete.parentId : null;

    const updated = normalizedNodes
      .filter(n => n.id !== nodeId)
      .map(n => {
        if (n.parentId === nodeId) {
          return { ...n, parentId };
        }
        return n;
      });

    setInternalNodes(updated);
    onUpdateNodes(updated);
    setSelectedNodeId(null);
    setIsEditing(false);
  };

  const handleExportMindMap = () => {
    if (!svgRef.current) return;
    try {
      const svgElement = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = (svgWidth + 100) * 2;
        canvas.height = (svgHeight + 100) * 2;
        const context = canvas.getContext('2d');
        if (context) {
          context.scale(2, 2);
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 50, 50);
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `mindmap-${chapterId || 'concept'}.png`;
          downloadLink.href = png;
          downloadLink.click();
        }
      };
      image.src = blobURL;
    } catch (e) {
      console.warn("Export MindMap error:", e);
    }
  };

  return (
    <div id="mindmap-container" className={`grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-white' : ''}`} dir={dir}>
      
      {/* Interactive Canvas */}
      <div className="lg:col-span-2 relative overflow-auto border border-gray-200 rounded-2xl bg-gradient-to-b from-gray-50/80 to-white p-4 min-h-[500px] max-h-[620px] flex flex-col items-center justify-between">
        
        {/* CANVAS TOOLBAR (ZOOM & EXPORT) */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-gray-100 z-10">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition text-[11px] font-bold px-2"
              title="إعادة ضبط الحجم"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              <span>{Math.round(zoomLevel * 100)}%</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMindMap}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="تصدير كصورة عالية الدقة"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>تصدير الصورة (HD PNG)</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition shadow-xs"
              title={isFullscreen ? "تصغير الشاشة" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* SVG MINDMAP GRAPH */}
        <div className="w-full flex-1 flex items-center justify-center overflow-auto py-4">
          <svg
            ref={svgRef}
            width={svgWidth * zoomLevel}
            height={svgHeight * zoomLevel}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="mx-auto overflow-visible select-none transition-all duration-200"
          >
            {/* Connecting curves */}
            {normalizedNodes.map((node) => {
              if (!node.parentId) return null;
              const parentCoord = layout[node.parentId];
              const nodeCoord = layout[node.id];
              if (!parentCoord || !nodeCoord) return null;

              const midX = (parentCoord.x + nodeCoord.x) / 2;
              const pathData = `M ${parentCoord.x} ${parentCoord.y} C ${midX} ${parentCoord.y}, ${midX} ${nodeCoord.y}, ${nodeCoord.x} ${nodeCoord.y}`;

              const isHighlighted = selectedNodeId === node.id || selectedNodeId === node.parentId;

              return (
                <path
                  key={`link-${node.id}`}
                  d={pathData}
                  fill="none"
                  stroke={isHighlighted ? '#4f46e5' : '#cbd5e1'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={isHighlighted ? 'none' : '4 2'}
                  className="transition-all duration-300 ease-in-out"
                />
              );
            })}

            {/* Nodes with Semantic Depth Colors */}
            {normalizedNodes.map((node) => {
              const coord = layout[node.id];
              if (!coord) return null;

              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNode?.id === node.id;
              const level = coord.level || 0;

              // Semantic depth color scheme
              let nodeFill = '#ffffff';
              let nodeStroke = '#e2e8f0';
              let nodeText = '#334155';

              if (isSelected) {
                nodeFill = '#4f46e5';
                nodeStroke = '#3730a3';
                nodeText = '#ffffff';
              } else if (level === 0) {
                // Root: Royal Indigo
                nodeFill = '#312e81';
                nodeStroke = '#4338ca';
                nodeText = '#ffffff';
              } else if (level === 1) {
                // Level 1: Emerald Insight
                nodeFill = '#ecfdf5';
                nodeStroke = '#10b981';
                nodeText = '#065f46';
              } else if (level === 2) {
                // Level 2: Warm Amber
                nodeFill = '#fffbeb';
                nodeStroke = '#f59e0b';
                nodeText = '#92400e';
              } else {
                // Level 3+: Clean Slate
                nodeFill = '#f8fafc';
                nodeStroke = '#cbd5e1';
                nodeText = '#475569';
              }

              return (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${coord.x}, ${coord.y})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Node Pill Background */}
                  <rect
                    x={-85}
                    y={-20}
                    width={170}
                    height={40}
                    rx={20}
                    fill={nodeFill}
                    stroke={nodeStroke}
                    strokeWidth={isSelected || level === 0 ? 2.5 : 1.5}
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                  />

                  {/* Node Label Text */}
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fontSize="12"
                    fontWeight={isSelected || level === 0 ? '800' : '600'}
                    fill={nodeText}
                    className="pointer-events-none select-none font-sans"
                  >
                    {node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hovered Concept Tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm text-white text-xs p-3 rounded-xl shadow-xl max-w-xs z-50 animate-fade-in border border-gray-700">
            <h4 className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span>{hoveredNode.label}</span>
            </h4>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              {hoveredNode.description || "لا يوجد وصف مفصل لهذا المفهوم حالياً."}
            </p>
          </div>
        )}
      </div>

      {/* Control & Editing Sidebar */}
      <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>تفاصيل وتحرير المفهوم</span>
            </h3>
            <button
              onClick={() => {
                setIsAdding(true);
                setIsEditing(false);
                setAddParentId(selectedNodeId);
              }}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مفهوم</span>
            </button>
          </div>

          {/* ADD CONCEPT FORM */}
          {isAdding && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-700">إضافة مفهوم جديد للخريطة</span>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم المفهوم</label>
                <input
                  type="text"
                  placeholder="مثال: الإيرادات غير المباشرة"
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">الشرح والتوضيح</label>
                <textarea
                  placeholder="اكتب شرحاً تعليمياً مبسطاً لهذا المفهوم..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white resize-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">المفهوم الأب (التفرع منه)</label>
                <select
                  value={addParentId || ''}
                  onChange={(e) => setAddParentId(e.target.value || null)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500"
                >
                  <option value="">[المستوى الرئيسي - جذر]</option>
                  {normalizedNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddNode}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ المفهوم في الخريطة</span>
              </button>
            </div>
          )}

          {/* EDIT CONCEPT FORM */}
          {isEditing && selectedNode && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-700">تعديل المفهوم الحالي</span>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم المفهوم</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">الشرح والتوضيح</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white resize-none transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">المفهوم الأب</label>
                <select
                  value={editParentId || ''}
                  onChange={(e) => setEditParentId(e.target.value || null)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500"
                >
                  <option value="">[المستوى الرئيسي - جذر]</option>
                  {normalizedNodes.filter(n => n.id !== selectedNodeId).map(n => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          )}

          {/* VIEW SELECTED NODE */}
          {!isEditing && !isAdding && (
            selectedNode ? (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div>
                  <h4 className="font-black text-gray-900 text-sm">{selectedNode.label}</h4>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md mt-1 inline-block">
                    {selectedNode.parentId ? `متفرع من: ${normalizedNodes.find(n => n.id === selectedNode.parentId)?.label || 'المستوى الرئيسي'}` : "مفهوم رئيسي في الفصل (الجذر)"}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedNode.description || "لا يوجد وصف تفصيلي. انقر على تعديل لإضافة شرح متعمق."}
                </p>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => startEdit(selectedNode)}
                    className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-5 text-center text-xs text-gray-500 border border-dashed border-gray-200 space-y-2">
                <Brain className="w-6 h-6 mx-auto text-indigo-400" />
                <p>انقر على أي عنصر داخل الخريطة الذهنية لعرض تفاصيله أو تعديله وحذفه.</p>
              </div>
            )
          )}

          {/* AI VOICE PILOT CARD */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>الطيار الذكي لتعديل الخريطة</span>
              </span>
              <button
                type="button"
                onClick={() => setSpeechLanguage(prev => prev === 'ar-SA' ? 'en-US' : 'ar-SA')}
                className="px-2.5 py-0.5 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-full transition"
              >
                {speechLanguage === 'ar-SA' ? '🇸🇦 العربية' : '🇺🇸 English'}
              </button>
            </div>
            
            <p className="text-[11px] text-indigo-800 leading-snug">
              تحدث بصوتك أو اكتب تعليمات لإضافة أو تعديل فروع الخريطة الذهنية بالذكاء الاصطناعي.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 animate-bounce" />
                    <span>إيقاف التسجيل</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-indigo-600" />
                    <span>التسجيل الصوتي</span>
                  </>
                )}
              </button>
              {voicePrompt.trim() && (
                <button
                  type="button"
                  onClick={() => setVoicePrompt('')}
                  className="px-3 border border-gray-200 bg-white hover:bg-gray-100 text-gray-500 rounded-xl text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              placeholder={speechLanguage === 'ar-SA' ? 'مثال: أضف الأصول والخصوم كفروع للمفاهيم الأساسية' : 'e.g. Add assets and liabilities under basics...'}
              value={voicePrompt}
              onChange={(e) => setVoicePrompt(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[55px] text-gray-800"
            />

            {aiError && (
              <p className="text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                {aiError}
              </p>
            )}

            <button
              type="button"
              onClick={handleApplyAI}
              disabled={isProcessingAI || !voicePrompt.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md"
            >
              {isProcessingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تعديل الخريطة بالـ AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
                  <span>تطبيق التعديل بالذكاء الاصطناعي</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 text-[11px] text-gray-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>تتصل العناصر تلقائياً بمسارات Bezier التفاعلية وتتوزع هرمياً.</span>
        </div>
      </div>
    </div>
  );
}
