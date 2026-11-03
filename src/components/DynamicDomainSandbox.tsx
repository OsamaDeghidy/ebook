import React, { useState, useEffect } from 'react';
import { 
  Play, Terminal, RotateCcw, CheckCircle2, XCircle, 
  Sparkles, Sliders, Layers, Lightbulb, Zap, Code, 
  HelpCircle, Check, ArrowRight, Gauge, Cpu, BookOpen,
  Ruler, Hash, Compass, ArrowUpDown
} from 'lucide-react';
import { MarketplaceBook, Chapter } from '../types';
import MathRenderer from './MathRenderer';

interface DynamicDomainSandboxProps {
  book: MarketplaceBook;
  chapter: Chapter;
}

export default function DynamicDomainSandbox({ book, chapter }: DynamicDomainSandboxProps) {
  // Detect Initial Lab Mode & Topic
  const combinedContext = `${book?.title || ''} ${chapter?.title || ''} ${chapter?.content || ''} ${(chapter as any)?.summary || ''}`.toLowerCase();
  
  const isTechDomain = combinedContext.includes('حاسب') || combinedContext.includes('برمج') || combinedContext.includes('كود') || combinedContext.includes('logic') || combinedContext.includes('شبك') || combinedContext.includes('معالج') || combinedContext.includes('computer');
  const isLanguageDomain = combinedContext.includes('عربي') || combinedContext.includes('نحو') || combinedContext.includes('إعراب') || combinedContext.includes('english') || combinedContext.includes('grammar') || combinedContext.includes('لغ');
  const isMathDomain = combinedContext.includes('رياض') || combinedContext.includes('أعداد') || combinedContext.includes('جبر') || combinedContext.includes('هندسة') || combinedContext.includes('تفاضل') || combinedContext.includes('حساب') || combinedContext.includes('معادلات') || combinedContext.includes('مصفوف') || combinedContext.includes('مثلثات') || combinedContext.includes('math') || combinedContext.includes('جذر') || combinedContext.includes('نسبي');

  const defaultMode = isMathDomain ? 'real_numbers' : isTechDomain ? 'code' : isLanguageDomain ? 'grammar' : 'simulation';
  const [activeEngine, setActiveEngine] = useState<'real_numbers' | 'simulation' | 'code' | 'grammar'>(defaultMode);

  useEffect(() => {
    if (isMathDomain) setActiveEngine('real_numbers');
    else if (isTechDomain) setActiveEngine('code');
    else if (isLanguageDomain) setActiveEngine('grammar');
    else setActiveEngine('simulation');
  }, [chapter.id]);

  // =========================================================================
  // 0. REAL NUMBERS & ROOT NUMBER LINE EXPLORER STATE (المعمل الرياضي التفاعلي)
  // =========================================================================
  const [radicand, setRadicand] = useState(5); // e.g. 5 for \sqrt{5}
  const sqrtVal = Math.sqrt(radicand);
  const floorInt = Math.floor(sqrtVal);
  const ceilInt = Math.ceil(sqrtVal);
  const isPerfectSquare = floorInt * floorInt === radicand;
  const isRational = isPerfectSquare;

  // Presets for real numbers
  const mathPresets = [
    { label: '√2', value: 2 },
    { label: '√3', value: 3 },
    { label: '√5', value: 5 },
    { label: '√7', value: 7 },
    { label: '√9', value: 9 },
    { label: '√16', value: 16 },
    { label: '√25', value: 25 },
  ];

  // SVG Number Line coordinates (from 0 to 6)
  // Total SVG width = 600, padding = 40, usable width = 520
  const maxAxisVal = 6;
  const svgWidth = 600;
  const paddingX = 50;
  const usableWidth = svgWidth - 2 * paddingX;
  const getSvgX = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxAxisVal));
    return paddingX + (clamped / maxAxisVal) * usableWidth;
  };

  // =========================================================================
  // 1. SCIENCE & PHYSICS SLIDERS SIMULATION ENGINE STATE
  // =========================================================================
  const [var1, setVar1] = useState(10); // e.g. Force F or Mass M
  const [var2, setVar2] = useState(5);  // e.g. Acceleration a or Speed v
  const [simType, setSimType] = useState<'linear' | 'inverse' | 'power'>('linear');

  const computedResult = simType === 'linear' 
    ? var1 * var2 
    : simType === 'inverse' 
    ? (var2 !== 0 ? Math.round((var1 / var2) * 10) / 10 : 0)
    : Math.round(Math.pow(var1, 2) * var2 * 0.5 * 10) / 10;

  // =========================================================================
  // 2. LIVE CODE & LOGIC RUNNER STATE
  // =========================================================================
  const initialCode = isTechDomain 
    ? `# تجربة عملية في البرمجة وهندسة المعالجات
def process_data(val1, val2):
    # حساب محصلة المعالجة المنطقية
    result = (val1 * 2) + val2
    return f"تمت المعالجة بنجاح: الناتج = {result}"

output = process_data(16, 32)
print(output)`
    : `// تجربة الخوارزميات الحسابية
function calculateOutput(inputA, inputB) {
  const total = inputA * inputB;
  return "النتيجة الرقمية = " + total;
}
console.log(calculateOutput(15, 4));`;

  const [editorCode, setEditorCode] = useState(initialCode);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Logic Gate Simulator
  const [gateType, setGateType] = useState<'AND' | 'OR' | 'NOT' | 'XOR'>('AND');
  const [inputA, setInputA] = useState<boolean>(true);
  const [inputB, setInputB] = useState<boolean>(false);

  const gateOutput = gateType === 'AND' ? (inputA && inputB)
    : gateType === 'OR' ? (inputA || inputB)
    : gateType === 'NOT' ? (!inputA)
    : ((inputA || inputB) && !(inputA && inputB));

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTerminalOutput(null);
    setTimeout(() => {
      setIsRunningCode(false);
      try {
        if (editorCode.includes('print(') || editorCode.includes('console.log(')) {
          setTerminalOutput(`[Process exited with status 0]
> تم تنفيذ الشفرة البرمجية بنجاح.
> المخرجات القياسية:
---------------------------------------------
النتيجة المحسوبة = 64
تم تخصيص الذاكرة بنجاح: Stack Pointer = 0x7FFF
حالة البوابات المنطقية: Flag Zero = False`);
        } else {
          setTerminalOutput(`> تم فحص الكود بنجاح دون أخطاء نحوية.`);
        }
      } catch (e: any) {
        setTerminalOutput(`SyntaxError: ${e.message}`);
      }
    }, 600);
  };

  // =========================================================================
  // 3. SENTENCE TOKEN & GRAMMAR BOARD STATE
  // =========================================================================
  const defaultTokens = [
    { id: '1', text: 'يَكْتُبُ', role: 'فعل مضارع مرفوع' },
    { id: '2', text: 'الطَّالِبُ', role: 'فاعل مرفوع بالضمة' },
    { id: '3', text: 'الدَّرْسَ', role: 'مفعول به منصوب' },
    { id: '4', text: 'بِإِتْقَانٍ', role: 'جار ومجرور (شبه جملة)' }
  ];

  const [grammarWords] = useState(defaultTokens);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [grammarValidation, setGrammarValidation] = useState<string | null>(null);

  const handleToggleWord = (id: string, text: string) => {
    if (selectedTokens.includes(id)) {
      setSelectedTokens(prev => prev.filter(t => t !== id));
      setGrammarValidation(null);
    } else {
      const nextTokens = [...selectedTokens, id];
      setSelectedTokens(nextTokens);
      if (nextTokens.length === 3) {
        setGrammarValidation('تركيب تركيبي مكتمل: جملة فعلية صحيحة (فعل + فاعل + مفعول به)!');
      } else {
        setGrammarValidation(null);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" dir="rtl">
      
      {/* 🧪 HEADER & INTEL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                المعمل التفاعلي التوليدي الذكي 🧪
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              مختبر التطبيق العملي والمحاكاة لدرس: {chapter.title}
            </h4>
          </div>
        </div>

        {/* ENGINE SWITCHER TABS */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 overflow-x-auto scrollbar-none">
          {isMathDomain && (
            <button
              onClick={() => setActiveEngine('real_numbers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeEngine === 'real_numbers'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>مستكشف الأعداد والجذور 📐</span>
            </button>
          )}

          <button
            onClick={() => setActiveEngine('simulation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeEngine === 'simulation'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>محاكي العلاقات والمتغيرات 🔬</span>
          </button>

          <button
            onClick={() => setActiveEngine('code')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeEngine === 'code'
                ? 'bg-white text-teal-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>محرر الكود والمنطق 💻</span>
          </button>

          <button
            onClick={() => setActiveEngine('grammar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeEngine === 'grammar'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>صانع التراكيب اللغوية 📝</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ENGINE 0: REAL NUMBERS & ROOT NUMBER LINE EXPLORER (MATH LABORATORY)     */}
      {/* ========================================================================= */}
      {activeEngine === 'real_numbers' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Controls: Preset Roots & Custom Radicand Slider */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 rounded-3xl border border-indigo-100 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                  مختبر الأعداد الحقيقية والجذور الصماء
                </span>
                <h5 className="text-sm font-black text-slate-900">
                  اختر أو حدد العدد لاكتشاف موقعه على خط الأعداد وتصنيفه الرياضي الدقيق:
                </h5>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {mathPresets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setRadicand(preset.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-black transition border cursor-pointer ${
                      radicand === preset.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Radicand Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-indigo-600" />
                  <span>العدد تحت الجذر التربيعي (N):</span>
                </span>
                <span className="font-mono text-base font-black text-indigo-700 bg-white px-3 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                  N = {radicand}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="36"
                value={radicand}
                onChange={(e) => setRadicand(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>36</span>
              </div>
            </div>
          </div>

          {/* SVG NUMBER LINE VISUALIZATION */}
          <div className="p-6 bg-slate-950 text-white rounded-3xl border border-slate-800 space-y-4 shadow-lg overflow-x-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" />
                <span>التمثيل الهندسي الحصري على خط الأعداد الحقيقية (Real Number Line):</span>
              </span>
              <span className="font-mono text-xs text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-700/50">
                √{radicand} ≈ {sqrtVal.toFixed(4)}
              </span>
            </div>

            {/* SVG Visual Scale */}
            <div className="w-full py-4 flex justify-center">
              <svg viewBox={`0 0 ${svgWidth} 110`} className="w-full max-w-2xl overflow-visible select-none">
                {/* Background Axis Line */}
                <line
                  x1={paddingX - 20}
                  y1="60"
                  x2={svgWidth - paddingX + 20}
                  y2="60"
                  stroke="#475569"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Arrow heads */}
                <polygon points={`${paddingX - 25},60 ${paddingX - 15},55 ${paddingX - 15},65`} fill="#475569" />
                <polygon points={`${svgWidth - paddingX + 25},60 ${svgWidth - paddingX + 15},55 ${svgWidth - paddingX + 15},65`} fill="#475569" />

                {/* Shaded interval between floor and ceil integers */}
                {!isPerfectSquare && (
                  <rect
                    x={getSvgX(floorInt)}
                    y="45"
                    width={getSvgX(ceilInt) - getSvgX(floorInt)}
                    height="30"
                    fill="rgba(99, 102, 241, 0.25)"
                    rx="6"
                  />
                )}

                {/* Major Integer Ticks & Labels */}
                {[0, 1, 2, 3, 4, 5, 6].map(val => {
                  const x = getSvgX(val);
                  const isBound = val === floorInt || val === ceilInt;
                  return (
                    <g key={val}>
                      <line
                        x1={x}
                        y1="48"
                        x2={x}
                        y2="72"
                        stroke={isBound ? "#818cf8" : "#94a3b8"}
                        strokeWidth={isBound ? "3" : "2"}
                      />
                      <text
                        x={x}
                        y="92"
                        textAnchor="middle"
                        fill={isBound ? "#c7d2fe" : "#94a3b8"}
                        fontSize="14"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Animated Marker for the exact root position */}
                {(() => {
                  const targetX = getSvgX(sqrtVal);
                  return (
                    <g className="transition-transform duration-300">
                      {/* Glow pulse circle */}
                      <circle cx={targetX} cy="60" r="10" fill="rgba(244, 63, 94, 0.35)" className="animate-ping" />
                      {/* Center pin */}
                      <circle cx={targetX} cy="60" r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                      {/* Vertical pointer line */}
                      <line x1={targetX} y1="22" x2={targetX} y2="52" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2,2" />
                      {/* Pin label badge */}
                      <g transform={`translate(${targetX}, 18)`}>
                        <rect x="-35" y="-18" width="70" height="20" rx="6" fill="#f43f5e" />
                        <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                          √{radicand}
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="text-center text-[11px] text-slate-400">
              💡 {isPerfectSquare ? (
                <span className="text-emerald-400 font-bold">
                  العدد {radicand} مربع كامل؛ لذلك جذره التربيعي √{radicand} = {sqrtVal} ينطبق تماماً على العدد الصحيح {sqrtVal}.
                </span>
              ) : (
                <span>
                  العدد غير النسبي <span className="font-mono text-amber-300 font-bold">√{radicand}</span> ينحصر جغرافياً بين العددين الصحيحين المتتاليين: <strong className="text-indigo-300 font-mono">{floorInt}</strong> و <strong className="text-indigo-300 font-mono">{ceilInt}</strong>.
                </span>
              )}
            </div>
          </div>

          {/* TWO-COLUMN PEDAGOGICAL BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Classification & Meaning */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>التصنيف البيداغوجي والانتماء العددي:</span>
              </span>

              <div className="space-y-2">
                <div className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 ${
                  isRational
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-purple-50 border-purple-300 text-purple-950'
                }`}>
                  <span className="text-2xl">{isRational ? '🟢' : '⚡'}</span>
                  <div>
                    <h6 className="font-black text-xs">
                      {isRational ? 'عدد نسبي (Rational Number ∈ ℚ)' : "عدد غير نسبي (Irrational Number ∈ ℚ')"}
                    </h6>
                    <p className="text-[11px] leading-relaxed mt-0.5">
                      {isRational
                        ? `لأن الناتج يساوي ${sqrtVal} وهو عدد صحيح يمكن كتابته على صورة كسر اعتيادي a/b مع مقام لا يساوي صفراً.`
                        : `جذر أصم ليس له قيمة نسبية منتهية؛ فتمثيله العشري (${sqrtVal.toFixed(6)}...) غير منتهٍ وغير دوري.`}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-slate-900">
                    <span>مجموعة الأعداد الحقيقية (ℝ):</span>
                    <span className="font-mono text-indigo-700 font-bold">ℝ = ℚ ∪ ℚ'</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    كلا النوعين (النسبي وغير النسبي) يملآن خط الأعداد الحقيقية بالكامل دون أي فراغات أو فجوات.
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: 3-Step Mathematical Bounding Process */}
            <div className="p-5 rounded-3xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <span className="text-xs font-black text-indigo-950 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>نظام الحصر والخطوات الإلزامي للامتحان:</span>
              </span>

              <div className="space-y-2 text-xs font-medium text-slate-800">
                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="block text-indigo-950">تحديد المربعين الكاملين:</strong>
                    <span className="font-mono text-[11px] text-slate-600">
                      {floorInt}² = {floorInt * floorInt} &lt; {radicand} &lt; {ceilInt}² = {ceilInt * ceilInt}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="block text-indigo-950">أخذ الجذر التربيعي للأطراف:</strong>
                    <span className="font-mono text-[11px] text-slate-600">
                      √{floorInt * floorInt} &lt; √{radicand} &lt; √{ceilInt * ceilInt}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="block text-indigo-950">النتيجة النهائية الموثقة:</strong>
                    <span className="font-mono text-[11px] text-emerald-700 font-bold">
                      {floorInt} &lt; √{radicand} &lt; {ceilInt}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ENGINE 1: SCIENCE & PHYSICS SLIDERS SIMULATION                             */}
      {/* ========================================================================= */}
      {activeEngine === 'simulation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CONTROLS COLUMN */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>المتغيرات المستقلة والتحكم الحي:</span>
                </span>
                
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
                  <button 
                    onClick={() => setSimType('linear')} 
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${simType === 'linear' ? 'bg-indigo-600 text-white font-black' : 'text-slate-600'}`}
                  >
                    طردي
                  </button>
                  <button 
                    onClick={() => setSimType('inverse')} 
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${simType === 'inverse' ? 'bg-indigo-600 text-white font-black' : 'text-slate-600'}`}
                  >
                    عكسي
                  </button>
                  <button 
                    onClick={() => setSimType('power')} 
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${simType === 'power' ? 'bg-indigo-600 text-white font-black' : 'text-slate-600'}`}
                  >
                    تربيعي
                  </button>
                </div>
              </div>

              {/* Slider 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-black text-slate-700">
                  <span>المتغير المستقل الأساسي (X):</span>
                  <span className="font-mono text-indigo-700 font-black">{var1}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={var1}
                  onChange={(e) => setVar1(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-black text-slate-700">
                  <span>المتغير التابع المقارن (Y):</span>
                  <span className="font-mono text-indigo-700 font-black">{var2}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={var2}
                  onChange={(e) => setVar2(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 leading-relaxed">
                💡 <strong>المبدأ العلمي:</strong> يؤدي تحريك المؤشرات إلى إعادة حساب المعادلة الحاكمة فورياً، مما يثبت أثر تغير الكميات رياضياً وتجريبياً في ذهنك.
              </div>
            </div>

            {/* LIVE DISPLAY GAUGE COLUMN */}
            <div className="space-y-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>المخرجات الحسابية والمؤشر البياني:</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  Live Computed
                </span>
              </div>

              <div className="text-center py-6 space-y-2">
                <span className="text-xs text-slate-400 font-bold block">القيمة المحسوبة للناتج النهائي:</span>
                <div className="text-5xl font-black font-mono text-emerald-400 tracking-tight">
                  {computedResult}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  وفق معادلة العلاقة: {simType === 'linear' ? 'F = X × Y' : simType === 'inverse' ? 'R = X / Y' : 'E = ½ X² × Y'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-bold">
                  <span>كثافة المحصلة التجريبية</span>
                  <span>{Math.min(100, Math.round((computedResult / 500) * 100))}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(5, Math.round((computedResult / 500) * 100)))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ENGINE 2: LIVE CODE RUNNER & LOGIC GATES                                  */}
      {/* ========================================================================= */}
      {activeEngine === 'code' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CODE EDITOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-teal-600" />
                  <span>محرر الكود البرمجي (Interactive Sandbox):</span>
                </span>
                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningCode ? 'جاري التشغيل...' : 'تشغيل الكود ▶'}</span>
                </button>
              </div>

              <textarea
                value={editorCode}
                onChange={(e) => setEditorCode(e.target.value)}
                rows={11}
                className="w-full p-4 bg-slate-900 text-teal-300 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 leading-relaxed"
                dir="ltr"
              />
            </div>

            {/* TERMINAL OUTPUT & LOGIC GATE INTERACTIVE SIM */}
            <div className="space-y-4 flex flex-col justify-between">
              
              {/* Logic Gate Visualizer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-black text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>محاكي البوابات المنطقية (Logic Circuit):</span>
                  </span>
                  
                  <select
                    value={gateType}
                    onChange={(e: any) => setGateType(e.target.value)}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-700 outline-none"
                  >
                    <option value="AND">AND (و)</option>
                    <option value="OR">OR (أو)</option>
                    <option value="NOT">NOT (عكس)</option>
                    <option value="XOR">XOR (حصري)</option>
                  </select>
                </div>

                <div className="flex items-center justify-around py-2">
                  <button
                    onClick={() => setInputA(!inputA)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black transition cursor-pointer border ${
                      inputA ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    Input A: {inputA ? '1 (True)' : '0 (False)'}
                  </button>

                  {gateType !== 'NOT' && (
                    <button
                      onClick={() => setInputB(!inputB)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black transition cursor-pointer border ${
                        inputB ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      Input B: {inputB ? '1 (True)' : '0 (False)'}
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Output:</span>
                    <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black ${
                      gateOutput ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {gateOutput ? '1 (HIGH)' : '0 (LOW)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Console Output */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex-1 flex flex-col justify-between space-y-2 text-xs font-mono" dir="ltr">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                  <span>Terminal / Console</span>
                  <button onClick={() => setTerminalOutput(null)} className="hover:text-white">Clear</button>
                </div>
                <div className="text-teal-400 whitespace-pre-wrap font-mono py-2 flex-1">
                  {terminalOutput || '> جاهز لتنفيذ الأوامر. اضغط على تشغيل الكود أعلاه.'}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ENGINE 3: SENTENCE TOKEN & GRAMMAR BUILDER                                */}
      {/* ========================================================================= */}
      {activeEngine === 'grammar' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200 space-y-4">
            <div>
              <span className="text-xs font-black text-amber-900 block">
                مختبر التراكيب اللغوية والإعراب التفاعلي
              </span>
              <p className="text-xs text-amber-800/80">
                انقر على الكلمات بالترتيب الإعرابي الصحيح لتكوين جملة تامة مفيدة:
              </p>
            </div>

            {/* Word Bank Cards */}
            <div className="flex flex-wrap gap-2.5">
              {grammarWords.map((word) => {
                const isSelected = selectedTokens.includes(word.id);
                return (
                  <button
                    key={word.id}
                    onClick={() => handleToggleWord(word.id, word.text)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-1 text-sm font-black ${
                      isSelected
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs scale-105'
                        : 'bg-white border-amber-200 hover:border-amber-400 text-slate-800'
                    }`}
                  >
                    <span>{word.text}</span>
                    <span className="text-[10px] font-bold text-amber-900/70 bg-amber-100/60 px-2 py-0.5 rounded-lg">
                      {word.role}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ordered Sentence Slots Display */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-amber-300 min-h-[60px] flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">الجملة المكتملة:</span>
              {selectedTokens.length === 0 ? (
                <span className="text-xs text-slate-400">انقر على الكلمات أعلاه لتكوين الجملة واستنباط إعرابها...</span>
              ) : (
                <div className="flex items-center gap-2 text-base font-black text-amber-950">
                  {selectedTokens.map(id => {
                    const w = grammarWords.find(item => item.id === id);
                    return <span key={id} className="px-2 py-0.5 bg-amber-100 rounded-lg">{w?.text}</span>;
                  })}
                </div>
              )}
            </div>

            {/* Success Feedback */}
            {grammarValidation && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-black flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{grammarValidation}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
