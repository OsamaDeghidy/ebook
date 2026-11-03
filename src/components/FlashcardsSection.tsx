import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shuffle,
  Inbox,
  Award,
  Zap,
  Check,
  Flame,
  Plus,
  X,
  Trash2,
  Edit
} from 'lucide-react';
import { Flashcard, Chapter } from '../types';
import MathRenderer from './MathRenderer';

interface FlashcardsSectionProps {
  chapter: Chapter;
  onUpdateFlashcards?: (updated: Flashcard[]) => void;
}

type LeitnerBox = 'all' | 'box1' | 'box2' | 'box3';

export default function FlashcardsSection({ chapter, onUpdateFlashcards }: FlashcardsSectionProps) {
  // Generate initial flashcards from chapter concepts or text
  const initialCards: Flashcard[] = Array.isArray(chapter.flashcards) && chapter.flashcards.length > 0
    ? chapter.flashcards
    : (Array.isArray(chapter.concepts) && chapter.concepts.length > 0
        ? chapter.concepts.map((c, i) => ({
            id: `fc-${chapter.id}-${i + 1}`,
            front: typeof c === 'string' ? c : (c as any).concept || (c as any).title || `مفهوم ${i + 1}`,
            back: typeof c === 'string' ? 'شرح المفهوم وتطبيقاته التعليمية.' : (c as any).explanation || (c as any).description || '',
            difficulty: 'medium'
          }))
        : [
            {
              id: `fc-${chapter.id}-1`,
              front: `ما هي الفكرة الجوهرية لدرس "${chapter.title}"؟`,
              back: chapter.summary || 'استيعاب المفاهيم الأساسية وتطبيقها عملياً.',
              difficulty: 'medium'
            }
          ]);

  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [activeBoxFilter, setActiveBoxFilter] = useState<LeitnerBox>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Audio / Auto-Play Mode State
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioTimerSeconds, setAudioTimerSeconds] = useState(3);
  const audioTimeoutRef = useRef<any>(null);

  // 📇 Stacked Tinder Swipe Gesture State
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [insightsMap, setInsightsMap] = useState<Record<string, { analogy: string; mnemonic: string; exam_secret: string }>>({});
  const [isLoadingInsight, setIsLoadingInsight] = useState<Record<string, boolean>>({});
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [activeCardInsight, setActiveCardInsight] = useState<{ analogy: string; mnemonic: string; exam_secret: string } | null>(null);

  const handleFetchAiInsight = async (card: Flashcard) => {
    if (!card) return;
    if (insightsMap[card.id]) {
      setActiveCardInsight(insightsMap[card.id]);
      setShowInsightModal(true);
      return;
    }

    setIsLoadingInsight(prev => ({ ...prev, [card.id]: true }));
    try {
      const res = await fetch('/api/ai/flashcard-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: card.front,
          back: card.back,
          subject: chapter.title
        })
      });
      const data = await res.json();
      if (data && data.insight) {
        setInsightsMap(prev => ({ ...prev, [card.id]: data.insight }));
        setActiveCardInsight(data.insight);
        setShowInsightModal(true);
      }
    } catch (e) {
      console.error('Error fetching flashcard insight:', e);
    } finally {
      setIsLoadingInsight(prev => ({ ...prev, [card.id]: false }));
    }
  };
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragOffset(clientX - dragStartX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 70) {
      // Swiped Right -> Easy (أتقنته)
      handleRate('easy');
    } else if (dragOffset < -70) {
      // Swiped Left -> Hard (صعب)
      handleRate('hard');
    }
    setDragOffset(0);
    setDragStartX(null);
  };

  // ➕ Add Flashcard State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      difficulty: 'medium'
    };
    const nextCards = [...cards, newCard];
    setCards(nextCards);
    if (onUpdateFlashcards) {
      onUpdateFlashcards(nextCards);
    }
    setNewFront('');
    setNewBack('');
    setIsAddModalOpen(false);
  };

  // Filter cards according to Leitner Boxes
  const filteredCards = cards.filter(card => {
    if (activeBoxFilter === 'all') return true;
    if (activeBoxFilter === 'box1') return card.difficulty === 'hard' || !card.difficulty;
    if (activeBoxFilter === 'box2') return card.difficulty === 'medium';
    if (activeBoxFilter === 'box3') return card.difficulty === 'easy';
    return true;
  });

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  // Box statistics
  const box1Count = cards.filter(c => c.difficulty === 'hard' || !c.difficulty).length;
  const box2Count = cards.filter(c => c.difficulty === 'medium').length;
  const box3Count = cards.filter(c => c.difficulty === 'easy').length;
  const masteryPercentage = Math.round((box3Count / Math.max(1, cards.length)) * 100);

  // Play audio TTS
  const speakText = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isAr = /[\u0600-\u06FF]/.test(text);
    utterance.lang = isAr ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Auto-play audio loop for flashcards
  useEffect(() => {
    if (!isAudioMode || !currentCard || completed) return;

    // Speak front, wait, flip, speak back, then next
    setIsFlipped(false);
    speakText(currentCard.front, () => {
      audioTimeoutRef.current = setTimeout(() => {
        setIsFlipped(true);
        speakText(currentCard.back, () => {
          audioTimeoutRef.current = setTimeout(() => {
            if (currentIndex + 1 < filteredCards.length) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setIsAudioMode(false);
              setCompleted(true);
            }
          }, 2500);
        });
      }, 1500);
    });

    return () => {
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isAudioMode, currentIndex, activeBoxFilter]);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex + 1 < filteredCards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCompleted(false);
    }
  };

  const handleRate = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    const updated = cards.map(card =>
      card.id === currentCard.id ? { ...card, difficulty, lastReviewed: new Date().toISOString() } : card
    );
    setCards(updated);
    if (onUpdateFlashcards) onUpdateFlashcards(updated);

    handleNext();
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  const toggleAudioMode = () => {
    if (isAudioMode) {
      setIsAudioMode(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
    } else {
      setIsAudioMode(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* 🗂️ COMPACT LEITNER SYSTEM 3-BOX BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
            {masteryPercentage}%
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-gray-900 block">بطاقات الاستذكار (نظام لايتنر)</span>
            <span className="text-[10px] text-gray-500">{box3Count} من {cards.length} بطاقات متقنة</span>
          </div>
        </div>

        {/* 3-BOX PILLS */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={() => { setActiveBoxFilter('all'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              activeBoxFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>الكل ({cards.length})</span>
          </button>

          <button
            onClick={() => { setActiveBoxFilter('box1'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              activeBoxFilter === 'box1'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>يحتاج تركيز 🔴 ({box1Count})</span>
          </button>

          <button
            onClick={() => { setActiveBoxFilter('box2'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              activeBoxFilter === 'box2'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>قيد المراجعة 🟡 ({box2Count})</span>
          </button>

          <button
            onClick={() => { setActiveBoxFilter('box3'); setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              activeBoxFilter === 'box3'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>أتقنتها 🟢 ({box3Count})</span>
          </button>
        </div>
      </div>

      {/* CONTROLS BAR: AUDIO MODE & SHUFFLE */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFetchAiInsight(currentCard);
                    }}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 border border-amber-300 rounded-xl transition flex items-center gap-1.5 text-[11px] font-black shadow-xs cursor-pointer active:scale-95"
                    title="توليد تشبيه واقعي وكلمة سر ليلة الامتحان بالذكاء الاصطناعي"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400 animate-pulse" />
                    <span>{isLoadingInsight[currentCard.id] ? 'جاري التفكير...' : 'إضاءة ذكية 💡'}</span>
                  </button>
          <button
            onClick={toggleAudioMode}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 border ${
              isAudioMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm animate-pulse'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {isAudioMode ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <Play className="w-4 h-4 text-indigo-600" />}
            <span>{isAudioMode ? 'إيقاف الاستماع التلقائي' : 'تشغيل وضع الاستماع التلقائي (Audio Flashcards)'}</span>
          </button>

          {isAudioMode && (
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              🎙️ جاري النطق التفاعلي والتنقل التلقائي...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onUpdateFlashcards && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>إضافة بطاقة ➕</span>
            </button>
          )}

          <button
            onClick={handleShuffle}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="خلط ترتيب البطاقات"
          >
            <Shuffle className="w-3.5 h-3.5 text-gray-500" />
            <span>خلط البطاقات</span>
          </button>
        </div>
      </div>

      {!completed && currentCard ? (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
            <span>البطاقة {currentIndex + 1} من {filteredCards.length}</span>
            <span>{Math.round(((currentIndex + 1) / filteredCards.length) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
            />
          </div>

          {/* 📇 STACKED DECK CONTAINER (TINDER-STYLE SWIPE & PHYSICAL STACK) */}
          <div className="relative min-h-[380px] w-full max-w-xl mx-auto py-2">
            
            {/* Background Stack Layer 2 (Bottom card) */}
            {filteredCards[currentIndex + 2] && (
              <div 
                className="absolute inset-x-4 top-6 bottom-0 bg-white border border-gray-200 rounded-3xl shadow-xs pointer-events-none -z-20 transition-all"
                style={{ transform: 'scale(0.92) translateY(14px)', opacity: 0.35 }}
              />
            )}

            {/* Background Stack Layer 1 (Middle card preview) */}
            {filteredCards[currentIndex + 1] && (
              <div 
                className="absolute inset-x-2 top-3 bottom-0 bg-white border border-indigo-100 rounded-3xl shadow-sm pointer-events-none -z-10 p-6 flex flex-col justify-between transition-all"
                style={{ transform: 'scale(0.96) translateY(7px)', opacity: 0.65 }}
              >
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                  <span>البطاقة التالية 📇</span>
                  <span>{currentIndex + 2} / {filteredCards.length}</span>
                </div>
                <h5 className="text-base font-black text-gray-400 text-center line-clamp-2 px-4">
                  <MathRenderer text={filteredCards[currentIndex + 1].front} />
                </h5>
                <div className="text-center text-[10px] text-gray-300">في انتظار دورها في التكرار المتباعد...</div>
              </div>
            )}

            {/* Active Foreground Card (Draggable & Swipeable) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onClick={() => {
                if (Math.abs(dragOffset) < 10) {
                  setIsFlipped(!isFlipped);
                }
              }}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
                transition: isDragging ? 'none' : 'transform 0.25s ease-out'
              }}
              className="cursor-pointer group relative min-h-[350px] bg-gradient-to-br from-white via-indigo-50/10 to-gray-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-3xl p-7 shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between select-none z-10"
            >
              {/* Swipe Stamps */}
              {dragOffset > 35 && (
                <div className="absolute top-6 left-6 z-30 px-3.5 py-1.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-lg rotate-12 border-2 border-white animate-fade-in">
                  أتقنته تماماً ✅
                </div>
              )}
              {dragOffset < -35 && (
                <div className="absolute top-6 right-6 z-30 px-3.5 py-1.5 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-lg -rotate-12 border-2 border-white animate-fade-in">
                  يحتاج تركيز ❌
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
                <span className={`px-3.5 py-1 rounded-full text-xs font-black ${
                  isFlipped
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}>
                  {isFlipped ? '💡 الإجابة والشرح المعرفي' : '❓ المفهوم أو السؤال'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(isFlipped ? currentCard.back : currentCard.front);
                    }}
                    className="p-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 rounded-lg transition"
                    title="نطق بصوت المعلم"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="flex items-center gap-1 text-gray-400 group-hover:text-indigo-600 transition text-[11px]">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>انقر للقلب</span>
                  </span>
                </div>
              </div>

              <div className="my-auto text-center py-6 px-2">
                {isFlipped ? (
                  <div className="space-y-3 animate-fade-in">
                    <h4 className="text-xl md:text-2xl font-black text-indigo-950 leading-relaxed font-sans">
                      <MathRenderer text={currentCard.back} />
                    </h4>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <h4 className="text-2xl md:text-3xl font-black text-gray-900 leading-snug font-sans">
                      <MathRenderer text={currentCard.front} />
                    </h4>
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] text-gray-400 font-medium">
                {isFlipped ? 'قيّم استيعابك لنقل البطاقة إلى الصندوق المناسب' : '💡 انقر للقلب، أو اسحب يميناً (إتقان) ويساراً (صعب)'}
              </div>
            </div>
          </div>

          {/* Action buttons (Leitner Rating & Navigation - Single Unified Controls) */}
          {isFlipped ? (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleRate('hard')}
                  className="p-3 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-800 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>لم أتقنه (صعب) 🔴</span>
                  </div>
                  <span className="text-[10px] text-rose-600/80 font-normal">صندوق 1 (تركيز)</span>
                </button>

                <button
                  onClick={() => handleRate('medium')}
                  className="p-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-900 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>تذكرته بصعوبة 🟡</span>
                  </div>
                  <span className="text-[10px] text-amber-700/80 font-normal">صندوق 2 (مراجعة)</span>
                </button>

                <button
                  onClick={() => handleRate('easy')}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black transition flex flex-col items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>أتقنته تماماً 🟢</span>
                  </div>
                  <span className="text-[10px] text-emerald-700/80 font-normal">صندوق 3 (إتقان)</span>
                </button>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={() => setIsFlipped(false)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 p-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>قلب البطاقة للوجه الأول 🔄</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <button
                onClick={() => setIsFlipped(true)}
                className="flex-1 max-w-xs py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-indigo-600" />
                <span>اقلب البطاقة لرؤية الإجابة 🔄</span>
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completion Screen */
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-black text-gray-900">أحسنت! أتممت مراجعة البطاقات</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            تم توزيع جميع البطاقات على صناديق لايتنر الثلاثة. يمكنك مراجعة بطاقات صندوق التركيز (صندوق 1) لرفع نسبة إتقانك إلى 100%!
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveBoxFilter('box1'); handleRestart(); }}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition shadow-md"
            >
              مراجعة الصندوق الصعب ({box1Count})
            </button>
            <button
              onClick={() => { setActiveBoxFilter('all'); handleRestart(); }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition"
            >
              إعادة الكل ({cards.length})
            </button>
          </div>
        </div>
      )}

      {/* ➕ ADD FLASHCARD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-black text-sm text-slate-900">إضافة بطاقة استذكار جديدة</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFlashcard} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">وجه البطاقة الأول (السؤال أو المفهوم):</label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="اكتب السؤال أو المفهوم الرئيسي..."
                  rows={3}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">ظهر البطاقة (الإجابة والشرح المعرفي):</label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="اكتب الإجابة النموذجية وشرح المفهوم..."
                  rows={4}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                >
                  إضافة البطاقة وحفظ 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 💡 AI DEEP INSIGHT MODAL */}
      {showInsightModal && activeCardInsight && currentCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-amber-300 animate-scale-up text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm sm:text-base">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">💡</span>
                <div>
                  <h4 className="font-black text-slate-900">إضاءة ذكية وتثبيت معرفي بالـ AI</h4>
                  <span className="text-[10px] text-amber-700 font-bold">ربط واقعي وكلمة سر ليلة الامتحان</span>
                </div>
              </div>

              <button
                onClick={() => setShowInsightModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs font-bold text-indigo-950">
              📌 <strong>المفهوم المستهدف:</strong> {currentCard.front}
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Analogy */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                  <span>🌟</span>
                  <span>تشبيه حسي من واقع الحياة اليومية (Real-life Analogy):</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  "<MathRenderer text={activeCardInsight.analogy} />"
                </p>
              </div>

              {/* Mnemonic Trigger */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/40 border border-purple-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-purple-900 font-black text-xs">
                  <span>🔑</span>
                  <span>كلمة سر ليلة الامتحان والرابط الذهني (Mnemonic Trigger):</span>
                </div>
                <p className="text-purple-950 font-black leading-relaxed">
                  <MathRenderer text={activeCardInsight.mnemonic} />
                </p>
              </div>

              {/* Exam Secret */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs">
                  <span>🎯</span>
                  <span>سر التفوق وتجنب الفخ:</span>
                </div>
                <p className="text-emerald-950 font-medium text-xs leading-relaxed">
                  <MathRenderer text={activeCardInsight.exam_secret} />
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  speakText(`${activeCardInsight.analogy}. ${activeCardInsight.mnemonic}`);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>استمع للإضاءة الذكية بصوت المعلم 🔊</span>
              </button>

              <button
                onClick={() => setShowInsightModal(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                تم الفهم ✓
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

