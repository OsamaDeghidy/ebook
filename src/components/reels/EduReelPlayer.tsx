import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, Share2, Volume2, VolumeX, Play, Pause, BookOpen, 
  Sparkles, Award, CheckCircle2, XCircle, Zap, Flame, Brain,
  ChevronUp, ChevronDown, Check, Copy, MessageCircle, Radio,
  Tv, Compass, GraduationCap, Trophy, Shield, Music, Bookmark,
  Gauge, RefreshCw, Layers, Sliders, ExternalLink, X, Lightbulb,
  HelpCircle, Eye, Rocket, CheckCircle, ArrowRight, Download, Film
} from 'lucide-react';
import { EduReel, EduReelStyle, EduReelScene } from '../../types';
import { fireConfetti } from '../../utils/confetti';
import { EduAvatarHost } from './avatar/EduAvatarHost';
import { exportReelToVideo, downloadReelBlob } from '../../utils/reelVideoExporter';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../../i18n/LanguageContext';

interface EduReelPlayerProps {
  reel: EduReel;
  isActive: boolean;
  currentUser?: any;
  onOpenBook?: (bookId: string, chapterId: string) => void;
  onNextReel?: () => void;
  onPrevReel?: () => void;
  onUpdateReelStyle?: (newStyle: EduReelStyle) => void;
}

export const EduReelPlayer: React.FC<EduReelPlayerProps> = ({
  reel,
  isActive,
  currentUser,
  onOpenBook,
  onNextReel,
  onPrevReel,
  onUpdateReelStyle
}) => {
  const { t, dir } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isAmbientMusicOn, setIsAmbientMusicOn] = useState(false); // Default OFF for crystal clear voice
  const [ambientVolume, setAmbientVolume] = useState<number>(0.02); // 2% gentle volume
  const [selectedAmbientTrack, setSelectedAmbientTrack] = useState<'lofi' | 'rain' | 'piano' | 'space'>('piano');
  const [isAmbientSettingsOpen, setIsAmbientSettingsOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState<EduReelStyle>(reel.style_type || reel.style || 'chalkboard');
  
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number>(reel.duration_seconds || 45);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 42);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; status: string } | null>(null);
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Hovered word for interactive dictionary lookup
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  // Privileged check: only teachers, instructors, or admins can download video
  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'instructor' || currentUser?.role === 'teacher';

  // Audio element ref (Primary Narrator Voice)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Secondary Audio element ref (Calming Ambient Lo-Fi Background)
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Ambient track sources (Soothing, Ultra-Calm Focus Soundscapes)
  const ambientTrackUrls: Record<string, string> = {
    piano: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3', // Warm calming piano focus
    lofi: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', // Relaxing gentle Lofi study piano
    rain: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3', // Soft rain for deep focus
    space: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_33be4ec8fc.mp3' // Ambient cosmic drone
  };

  // Interactive Quiz state (End-of-Reel Challenge)
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);
  const [quizBonusAwarded, setQuizBonusAwarded] = useState(false);

  // Effective duration calculation
  const totalDuration = audioDuration > 0 ? audioDuration : (reel.duration_seconds || 45);
  const progressPercent = Math.min(100, (currentTimeSec / Math.max(1, totalDuration)) * 100);

  // Words array from narration_script
  const words = useMemo(() => {
    return (reel.narration_script || '').split(/\s+/).filter(Boolean);
  }, [reel.narration_script]);

  // Derive 3 Storyboard Scenes if not already present
  const scenes: EduReelScene[] = useMemo(() => {
    if (reel.scenes && reel.scenes.length > 0) return reel.scenes;

    const hookQuote = words.slice(0, Math.min(10, words.length)).join(' ') || reel.chapter_title;
    const bullets = reel.visual_cards?.map(c => c.content) || [
      'استيعاب المفهوم الجوهري للدرس',
      'التطبيق العملي على المسائل والنماذج'
    ];

    return [
      {
        id: 'scene-1',
        act: 'hook',
        title: reel.chapter_title || 'فكرة الدرس المحورية',
        badgeText: '🔥 مقدمة مشوقة',
        visualType: 'quote',
        visualData: { highlightQuote: hookQuote },
        startSec: 0,
        endSec: Math.floor(totalDuration * 0.25)
      },
      {
        id: 'scene-2',
        act: 'concept',
        title: 'الشرح والتفكيك الأكاديمي',
        badgeText: '🧠 جوهر الفصل',
        visualType: 'bullet_points',
        visualData: {
          bullets: bullets.slice(0, 2),
          formulaLatex: reel.visual_cards?.find(c => c.type === 'formula')?.content,
          codeSnippet: reel.visual_cards?.find(c => c.type === 'code')?.content
        },
        startSec: Math.floor(totalDuration * 0.25),
        endSec: Math.floor(totalDuration * 0.75)
      },
      {
        id: 'scene-3',
        act: 'takeaway',
        title: 'الخلاصة والتطبيق',
        badgeText: '🏆 النتيجة والتطبيق',
        visualType: 'bullet_points',
        visualData: { highlightQuote: 'تطبيق هذه المفاهيم يمنحك التميز الكامل في فهم الفصل.' },
        startSec: Math.floor(totalDuration * 0.75),
        endSec: totalDuration
      }
    ];
  }, [reel, words, totalDuration]);

  // Current Active Scene
  const currentScene = useMemo(() => {
    return scenes.find(s => currentTimeSec >= s.startSec && currentTimeSec <= s.endSec) || scenes[0];
  }, [scenes, currentTimeSec]);

  // 🎵 GENTLE AMBIENT AUDIO MANAGER (Extremely Quiet Background)
  useEffect(() => {
    const ambientAudio = ambientAudioRef.current;
    if (!ambientAudio) return;

    if (isActive && isPlaying && isAmbientMusicOn && !isMuted) {
      ambientAudio.volume = Math.max(0.005, Math.min(0.08, ambientVolume));
      ambientAudio.play().catch(() => {});
    } else {
      ambientAudio.pause();
    }
  }, [isActive, isPlaying, isAmbientMusicOn, isMuted, ambientVolume, selectedAmbientTrack]);

  // Synchronize Main Voice Audio & Playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackSpeed;

    if (isActive && isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isActive, isPlaying, playbackSpeed]);

  // Audio Mute control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // ⏱️ Ultra-Smooth 60FPS High-Precision Audio Clock & Synchronizer (Zero Lag)
  useEffect(() => {
    if (!isActive || !isPlaying) return;

    let animFrameId: number;

    const syncClock = () => {
      if (audioRef.current && !audioRef.current.paused) {
        const exactTime = audioRef.current.currentTime;
        setCurrentTimeSec(exactTime);

        if (exactTime >= totalDuration && totalDuration > 0) {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }

          fetch(`/api/reels/${reel.id}/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser?.id, type: 'complete' })
          }).catch(() => {});

          setCurrentTimeSec(0);
        }
      }
      animFrameId = requestAnimationFrame(syncClock);
    };

    animFrameId = requestAnimationFrame(syncClock);
    return () => cancelAnimationFrame(animFrameId);
  }, [isActive, isPlaying, totalDuration, reel.id, currentUser]);

  // Reset when becoming active or changing reel
  useEffect(() => {
    if (isActive) {
      setCurrentTimeSec(0);
      setIsPlaying(true);
      setIsQuizActive(false);
      setIsQuizAnswered(false);
      setSelectedOption(null);
      setHoveredWord(null);
      setActiveStyle(reel.style_type || reel.style || 'chalkboard');

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play().catch(() => {});
      }

      // Check if bookmarked
      try {
        const savedNotes = JSON.parse(localStorage.getItem('saved_reel_notes') || '[]');
        setIsBookmarked(savedNotes.some((n: any) => n.id === reel.id));
      } catch (e) {}

      fetch(`/api/reels/${reel.id}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, type: 'view' })
      }).catch(() => {});
    }
  }, [isActive, reel.id, currentUser, playbackSpeed]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    fetch(`/api/reels/${reel.id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser?.id, type: 'like', isLiked: nextState })
    }).catch(() => {});
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const savedNotes = JSON.parse(localStorage.getItem('saved_reel_notes') || '[]');
      let updated;
      if (isBookmarked) {
        updated = savedNotes.filter((n: any) => n.id !== reel.id);
        setIsBookmarked(false);
      } else {
        updated = [
          {
            id: reel.id,
            bookId: reel.book_id,
            chapterTitle: reel.chapter_title,
            script: reel.narration_script,
            savedAt: new Date().toISOString()
          },
          ...savedNotes
        ];
        setIsBookmarked(true);
      }
      localStorage.setItem('saved_reel_notes', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/reels?bookId=${reel.book_id}&chapterId=${reel.chapter_id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleQuizSelect = (e: React.MouseEvent, optionIdx: number) => {
    e.stopPropagation();
    if (isQuizAnswered || !reel.interactive_quiz) return;

    setSelectedOption(optionIdx);
    setIsQuizAnswered(true);

    const isCorrect = optionIdx === reel.interactive_quiz.correctIndex;
    setIsQuizCorrect(isCorrect);

    if (isCorrect) {
      fireConfetti();
      setQuizBonusAwarded(true);

      // Award +20 XP
      fetch(`/api/reels/${reel.id}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, type: 'quiz', isCorrectQuiz: true })
      }).catch(() => {});
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const cycleStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const styles: EduReelStyle[] = ['chalkboard', 'cyberpunk', 'cinematic', 'gamified'];
    const nextIdx = (styles.indexOf(activeStyle) + 1) % styles.length;
    const next = styles[nextIdx];
    setActiveStyle(next);
    if (onUpdateReelStyle) onUpdateReelStyle(next);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // 🚀 1. 1-CLICK DIRECT 60FPS VIDEO EXPORT (3D Robot Avatar, Synchronized Subtitles, Voice Audio)
  const handleDirectVideoExport = async () => {
    if (isExportingVideo) return;
    setIsDownloadModalOpen(false);
    setIsExportingVideo(true);
    setExportProgress({ percent: 5, status: 'جاري تهيئة استوديو التصدير والروبوت الذكي...' });

    try {
      const blob = await exportReelToVideo(reel, activeStyle, (percent, status) => {
        setExportProgress({ percent, status });
      });

      const cleanBook = (reel.book_title || 'مقرر').replace(/[\\/:*?"<>|]/g, '_');
      const cleanChapter = (reel.chapter_title || 'فصل').replace(/[\\/:*?"<>|]/g, '_');
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `${cleanBook}_${cleanChapter}_Reel.${ext}`;

      downloadReelBlob(blob, fileName);
      fireConfetti();
    } catch (err: any) {
      console.error('Reel video export error:', err);
      alert('حدث خطأ أثناء تصدير الفيديو: ' + (err.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsExportingVideo(false);
      setExportProgress(null);
    }
  };

  // 🚀 2. OPTIONAL SCREEN/TAB CAPTURE RECORDER
  const startLiveRecording = async () => {
    setIsDownloadModalOpen(false);
    try {
      // Prompt user to select current tab/window for 60fps recording
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          frameRate: { ideal: 60, max: 60 }
        },
        audio: true
      });

      recordedStreamRef.current = stream;
      recordedChunksRef.current = [];

      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      const selectedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8000000 // 8 Mbps high-bitrate studio quality
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime });
        
        const cleanBook = (reel.book_title || 'مقرر').replace(/[\\/:*?"<>|]/g, '_');
        const cleanChapter = (reel.chapter_title || 'فصل').replace(/[\\/:*?"<>|]/g, '_');
        const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `${cleanBook}_${cleanChapter}_Reel_Live60FPS.${ext}`;

        downloadReelBlob(blob, fileName);
        setIsLiveRecording(false);
        fireConfetti();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsLiveRecording(true);

      // Rewind to start and play cleanly
      setCurrentTimeSec(0);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Automatically finalize when playback finishes
      const interval = setInterval(() => {
        if (audioRef.current && (audioRef.current.currentTime >= totalDuration - 0.5 || audioRef.current.ended)) {
          clearInterval(interval);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 300);

      stream.getVideoTracks()[0].onended = () => {
        clearInterval(interval);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };

    } catch (err: any) {
      console.warn('Live recording cancelled or error:', err);
      setIsLiveRecording(false);
    }
  };

  const stopLiveRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordedStreamRef.current) {
      recordedStreamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsLiveRecording(false);
  };

  // 🎵 2. DIRECT NARRATION AUDIO DOWNLOAD (MP3)
  const downloadAudioDirectly = () => {
    setIsDownloadModalOpen(false);
    const audioUrl = reel.audio_url || `/api/tts/stream?text=${encodeURIComponent(reel.narration_script || '')}&voice=${encodeURIComponent(reel.voice || 'ar-XA-Chirp3-HD-Fenrir')}`;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.target = '_blank';
    const cleanBook = (reel.book_title || 'مقرر').replace(/[\\/:*?"<>|]/g, '_');
    const cleanChapter = (reel.chapter_title || 'فصل').replace(/[\\/:*?"<>|]/g, '_');
    a.download = `${cleanBook}_${cleanChapter}_Audio.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 🎯 SMART PHONETIC WORD ALIGNMENT (Precise Zero-Lag Word-by-Word Lip/Karaoke Sync)
  const wordTimeRanges = useMemo(() => {
    const rawWords = (reel.narration_script || '').split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return [];

    // Calculate weight for each word based on character count and punctuation pauses
    const weights = rawWords.map((w) => {
      let weight = Math.max(2, w.length); // Base duration by character count
      if (w.includes('...') || w.includes('…')) weight += 10; // Dramatic ellipsis pause
      else if (w.includes('،') || w.includes(',')) weight += 6; // Natural breath comma pause
      else if (w.includes('؟') || w.includes('?') || w.includes('!') || w.includes('.')) weight += 7;
      return weight;
    });

    const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);
    const effectiveTotalSec = totalDuration > 0 ? totalDuration : 45;

    let currentSec = 0;
    return rawWords.map((word, idx) => {
      const duration = (weights[idx] / totalWeight) * effectiveTotalSec;
      const start = currentSec;
      const end = currentSec + duration;
      currentSec = end;
      return { word, start, end };
    });
  }, [reel.narration_script, totalDuration]);

  // Current active word index derived in real-time from high-resolution audio clock
  const currentWordIndex = useMemo(() => {
    if (wordTimeRanges.length === 0) return 0;
    const foundIndex = wordTimeRanges.findIndex(
      (range) => currentTimeSec >= range.start && currentTimeSec < range.end
    );
    if (foundIndex !== -1) return foundIndex;
    if (currentTimeSec >= totalDuration - 0.5) return wordTimeRanges.length - 1;
    return 0;
  }, [wordTimeRanges, currentTimeSec, totalDuration]);

  const speechProgress = Math.min(1, Math.max(0, currentTimeSec / Math.max(1, totalDuration)));

  // Subtitle Chunking (TikTok 5-Word Phrase Window)
  const chunkSize = 5;
  const currentChunkIndex = Math.floor(currentWordIndex / chunkSize);
  const startIdx = currentChunkIndex * chunkSize;
  const visiblePhraseWords = words.slice(startIdx, startIdx + chunkSize);

  // Dynamic Editing Callouts & Popups at specific timestamps
  const editingPopups = useMemo(() => {
    const popups = [];
    if (progressPercent >= 18 && progressPercent <= 36) {
      popups.push({
        id: 'tip-1',
        icon: '💡',
        tag: 'معلومة ذهبية',
        text: 'ركز على هذه الفكرة في الامتحان!'
      });
    } else if (progressPercent >= 45 && progressPercent <= 65) {
      popups.push({
        id: 'tip-2',
        icon: '⚡',
        tag: 'قاعدة جوهرية',
        text: 'اربط هذه النقطة بالتطبيق العملي'
      });
    } else if (progressPercent >= 75 && progressPercent <= 92) {
      popups.push({
        id: 'tip-3',
        icon: '🎯',
        tag: 'مفتاح التفوق',
        text: 'أتقنت المفهوم! استعد لتحدي الفهم'
      });
    }
    return popups;
  }, [progressPercent]);

  return (
    <div 
      className={`relative w-full max-w-[420px] h-[86vh] sm:h-[88vh] max-h-[880px] mx-auto rounded-3xl overflow-hidden shadow-2xl select-none flex flex-col justify-between transition-all duration-500 text-right ${
        activeStyle === 'chalkboard'
          ? 'bg-[#0a1c14] border-4 border-[#3b2d1d] shadow-[0_0_60px_rgba(16,185,129,0.3)]'
          : activeStyle === 'cyberpunk'
          ? 'bg-[#030712] border-2 border-cyan-500/80 shadow-[0_0_70px_rgba(6,182,212,0.4)]'
          : activeStyle === 'cinematic'
          ? 'bg-[#0c0a09] border border-amber-500/50 shadow-[0_0_70px_rgba(245,158,11,0.35)]'
          : 'bg-[#0f0c29] border-3 border-fuchsia-500/70 shadow-[0_0_60px_rgba(217,70,239,0.35)]'
      }`}
      dir={dir}
    >
      {/* 🌟 AUDIO ELEMENT (PRIMARY NARRATOR VOICE) */}
      {(reel.audio_url || reel.narration_script) && (
        <audio
          ref={audioRef}
          src={reel.audio_url || `/api/tts/stream?text=${encodeURIComponent(reel.narration_script || `شرح ${reel.chapter_title || 'الدرس'}`)}&voice=${encodeURIComponent(reel.voice || 'ar-XA-Chirp3-HD-Fenrir')}`}
          preload="auto"
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (dur && !isNaN(dur) && dur > 0) {
              setAudioDuration(dur);
            }
          }}
          onEnded={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }}
        />
      )}

      {/* 🎵 SECONDARY AUDIO ELEMENT (CALM BACKGROUND STUDY MUSIC) */}
      <audio
        ref={ambientAudioRef}
        src={ambientTrackUrls[selectedAmbientTrack]}
        loop
        preload="auto"
      />

      {/* ======================================================== */}
      {/* 🎬 DYNAMIC THEMATIC MOTION BACKGROUNDS */}
      {/* ======================================================== */}
      {activeStyle === 'chalkboard' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
          <svg className="absolute -top-10 -right-10 w-48 h-48 text-emerald-300/15 animate-spin-slow" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
            <polygon points="50,15 80,75 20,75" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>
      )}

      {activeStyle === 'cyberpunk' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute inset-0 bg-radial from-cyan-950/40 via-transparent to-black" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        </div>
      )}

      {activeStyle === 'cinematic' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-radial from-amber-600/15 via-black/80 to-black" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
      )}

      {activeStyle === 'gamified' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-950/40 via-purple-900/30 to-indigo-950/40" />
          <div className="absolute top-12 right-6 text-fuchsia-400/20 text-6xl font-black animate-bounce">★</div>
          <div className="absolute bottom-28 left-6 text-purple-400/20 text-5xl font-black animate-pulse">◆</div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌟 1. TOP STORY SEGMENT PROGRESS BARS */}
      {/* ======================================================== */}
      <div className="relative z-30 p-3 pt-3.5 space-y-2.5">
        <div className="grid grid-cols-3 gap-1.5 px-1">
          {scenes.map((scene) => {
            const isCompleted = currentTimeSec > scene.endSec;
            const isCurrent = currentTimeSec >= scene.startSec && currentTimeSec <= scene.endSec;
            const segmentProgress = isCompleted
              ? 100
              : isCurrent
              ? Math.min(100, Math.max(0, ((currentTimeSec - scene.startSec) / Math.max(0.1, scene.endSec - scene.startSec)) * 100))
              : 0;

            return (
              <div key={scene.id} className="h-1.5 bg-white/20 rounded-full overflow-hidden relative backdrop-blur-xs">
                <div 
                  className={`h-full rounded-full transition-all duration-150 ${
                    activeStyle === 'cyberpunk' ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' :
                    activeStyle === 'chalkboard' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' :
                    activeStyle === 'cinematic' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' :
                    'bg-fuchsia-400 shadow-[0_0_8px_#d946ef]'
                  }`}
                  style={{ width: `${segmentProgress}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* TOP HEADER CONTROLS */}
        <div className="flex items-center justify-between px-1 text-white relative">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${
              activeStyle === 'chalkboard' ? 'bg-emerald-900/80 border border-emerald-500/50 text-emerald-200' :
              activeStyle === 'cyberpunk' ? 'bg-cyan-950/80 border border-cyan-400/60 text-cyan-300' :
              activeStyle === 'cinematic' ? 'bg-amber-950/80 border border-amber-500/50 text-amber-200' :
              'bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-200'
            }`}>
              <Sparkles className="w-3 h-3 animate-spin-slow" />
              <span>{currentScene.badgeText}</span>
            </span>

            {/* PLAY/PAUSE MINI BADGE */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="p-1 px-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
              <span>{isPlaying ? 'إيقاف' : 'تشغيل'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* AMBIENT MUSIC BUTTON & CONTROLLER */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmbientSettingsOpen(!isAmbientSettingsOpen);
                }}
                className={`p-1.5 rounded-full transition cursor-pointer flex items-center gap-1 ${
                  isAmbientMusicOn ? 'bg-teal-500/30 text-teal-300 border border-teal-400/50 shadow-sm' : 'bg-black/30 text-white/40'
                }`}
                title="موسيقى الخلفية الهادئة للتركيز"
              >
                <Music className="w-3.5 h-3.5" />
              </button>

              {/* AMBIENT SETTINGS POPOVER */}
              {isAmbientSettingsOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-8 left-0 z-50 w-56 p-3 bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl space-y-2.5 text-right text-white animate-scale-up" 
                  dir={dir}
                >
                  <div className="flex items-center justify-between text-[11px] font-black border-b border-white/10 pb-1.5">
                    <span className="flex items-center gap-1 text-teal-300">
                      <Music className="w-3.5 h-3.5" />
                      <span>موسيقى الخلفية الهادئة</span>
                    </span>
                    <button
                      onClick={() => setIsAmbientMusicOn(!isAmbientMusicOn)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer ${
                        isAmbientMusicOn ? 'bg-teal-600 text-white' : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {isAmbientMusicOn ? 'مفعلة' : 'معطلة'}
                    </button>
                  </div>

                  {/* VOLUME SLIDER */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-white/70">
                      <span>مستوى الصوت الخافت</span>
                      <span className="font-mono text-amber-300">{Math.round(ambientVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.08"
                      step="0.005"
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                  </div>

                  {/* TRACK SELECTION CHIPS */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-bold pt-1">
                    <button
                      onClick={() => setSelectedAmbientTrack('piano')}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        selectedAmbientTrack === 'piano' ? 'bg-teal-500/30 border-teal-400 text-teal-200 font-black' : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      🎹 بيانو هادئ
                    </button>
                    <button
                      onClick={() => setSelectedAmbientTrack('lofi')}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        selectedAmbientTrack === 'lofi' ? 'bg-teal-500/30 border-teal-400 text-teal-200 font-black' : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      ☕ بيانو Lo-Fi
                    </button>
                    <button
                      onClick={() => setSelectedAmbientTrack('rain')}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        selectedAmbientTrack === 'rain' ? 'bg-teal-500/30 border-teal-400 text-teal-200 font-black' : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      🌧️ مطر للتركيز
                    </button>
                    <button
                      onClick={() => setSelectedAmbientTrack('space')}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        selectedAmbientTrack === 'space' ? 'bg-teal-500/30 border-teal-400 text-teal-200 font-black' : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      🌌 فضاء عميق
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SPEED SELECTOR */}
            <button
              onClick={toggleSpeed}
              className="px-2 py-1 bg-black/40 hover:bg-black/60 rounded-full border border-white/20 text-[10px] font-black text-amber-300 transition cursor-pointer"
              title="تغيير سرعة الإلقاء"
            >
              {playbackSpeed}x
            </button>

            {/* MUTE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full border border-white/20 text-white transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🎬 2. MAIN SCENE CANVAS (Modern Egyptian Scholar Avatar Host) */}
      {/* ======================================================== */}
      <div 
        onClick={togglePlayPause}
        className="relative z-20 flex-1 px-4 flex flex-col justify-center items-center text-center space-y-2.5 max-h-[50vh] cursor-pointer"
      >
        {/* 🤖 THE PROCEDURAL ANIMATED AI ROBOT (روبي - رفيق الذكاء الاصطناعي) */}
        <div className="w-full flex items-center justify-center py-1">
          <EduAvatarHost
            isPlaying={isPlaying}
            audioCurrentTime={currentTimeSec}
            totalDuration={totalDuration}
            currentAct={currentScene.act}
            speechProgress={speechProgress}
            characterId="ai_robot"
            scale={0.95}
          />
        </div>

        {/* ACT 1: HOOK SCENE */}
        {currentScene.act === 'hook' && (
          <div className="w-full max-w-xs p-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 shadow-xl space-y-1 animate-fade-in pointer-events-none">
            <h2 className="text-xs sm:text-sm font-black text-white leading-tight">
              {reel.chapter_title}
            </h2>
            <div className="p-1.5 bg-white/5 rounded-xl border border-white/10 text-[11px] font-bold text-amber-200 leading-relaxed italic">
              "{currentScene.visualData?.highlightQuote}"
            </div>
          </div>
        )}

        {/* ACT 2: DEEP CONCEPT & FORMULA / CODE */}
        {currentScene.act === 'concept' && (
          <div className="w-full max-w-xs p-2.5 rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 shadow-2xl space-y-1.5 animate-fade-in text-right pointer-events-none" dir={dir}>
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="text-[11px] font-black text-teal-300 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                <span>{currentScene.title}</span>
              </span>
              <span className="text-[9px] text-white/50 font-mono">02 • المفهوم</span>
            </div>

            {/* Bullets List */}
            {currentScene.visualData?.bullets && currentScene.visualData.bullets.length > 0 && (
              <div className="space-y-1 text-[11px] font-bold text-slate-200">
                {currentScene.visualData.bullets.slice(0, 2).map((b, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 p-1 rounded-lg bg-white/5 border border-white/5">
                    <span className="w-3.5 h-3.5 rounded-full bg-teal-500/30 text-teal-300 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Formula / Code Highlight if present */}
            {currentScene.visualData?.formulaLatex && (
              <div className="p-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-emerald-200 font-mono text-[10px] font-bold truncate">
                {currentScene.visualData.formulaLatex}
              </div>
            )}
          </div>
        )}

        {/* ACT 3: TAKEAWAY */}
        {currentScene.act === 'takeaway' && (
          <div className="w-full max-w-xs p-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 shadow-2xl space-y-1 animate-fade-in pointer-events-none">
            <h3 className="text-xs sm:text-sm font-black text-white">الخلاصة والتطبيق العملي</h3>
            <p className="text-[11px] font-bold text-slate-200 leading-relaxed">
              {currentScene.visualData?.highlightQuote || 'أتقنت المفاهيم الأساسية لهذا الفصل بنجاح!'}
            </p>
          </div>
        )}

        {/* ⏸️ BIG PLAY/PAUSE INDICATOR WHEN PAUSED */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="w-16 h-16 rounded-full bg-black/80 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white shadow-2xl animate-pulse">
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 🧠 3. INTERACTIVE END-OF-REEL QUIZ MODAL (Isolated Clicks & Non-Intrusive) */}
      {/* ======================================================== */}
      {isQuizActive && reel.interactive_quiz && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-3 bottom-20 z-50 p-4 rounded-3xl bg-slate-950/98 backdrop-blur-2xl border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)] space-y-2.5 animate-scale-up text-right" 
          dir={dir}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              <span>تحدي نهاية الريل (+20 XP)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">سؤال وحيد</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuizActive(false);
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                title="إغلاق التحدي"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs font-black text-white leading-relaxed">
            {reel.interactive_quiz.question}
          </p>

          <div className="space-y-1.5">
            {reel.interactive_quiz.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === reel.interactive_quiz?.correctIndex;
              let btnStyle = 'bg-white/10 hover:bg-white/20 border-white/15 text-white';

              if (isQuizAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600/90 border-emerald-400 text-white shadow-md shadow-emerald-600/30';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-600/90 border-rose-400 text-white shadow-md shadow-rose-600/30';
                } else {
                  btnStyle = 'bg-white/5 border-white/5 text-white/40';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isQuizAnswered}
                  onClick={(e) => handleQuizSelect(e, idx)}
                  className={`w-full p-2.5 rounded-xl border text-[11px] font-bold text-right transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isQuizAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                  {isQuizAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-300 shrink-0" />}
                </button>
              );
            })}
          </div>

          {isQuizAnswered && (
            <div className="space-y-2 pt-1 animate-fade-in">
              <div className="p-2 rounded-xl bg-white/10 border border-white/10 text-[10px] font-bold text-slate-200 leading-snug">
                💡 <span className="text-amber-300 font-black">الشرح:</span> {reel.interactive_quiz.explanation}
              </div>

              {onNextReel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsQuizActive(false);
                    onNextReel();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>الانتقال إلى الريل التالي</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌟 4. SPEECH-SYNCHRONIZED TIKTOK SUBTITLES & WORD HOVER */}
      {/* ======================================================== */}
      <div className="relative z-30 p-3 pt-0 space-y-2">
        
        {/* SUBTITLE PHRASE BANNER (With Interactive Word Hover & Gloss) */}
        <div 
          onClick={togglePlayPause}
          className="p-3 rounded-2xl bg-black/85 backdrop-blur-lg border border-white/20 shadow-2xl text-center cursor-pointer min-h-[52px] flex flex-col items-center justify-center relative"
        >
          {/* Word Hover Tooltip Callout */}
          {hoveredWord && (
            <div className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] shadow-lg animate-fade-in pointer-events-none">
              🔍 استكشاف: "{hoveredWord}"
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm font-black leading-relaxed">
            {visiblePhraseWords.map((word, idx) => {
              const actualWordIndex = startIdx + idx;
              const isSpoken = actualWordIndex <= currentWordIndex;
              const isCurrent = actualWordIndex === currentWordIndex;

              return (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  className={`px-1.5 py-0.5 rounded-lg transition-all duration-150 cursor-help ${
                    isCurrent
                      ? activeStyle === 'cyberpunk'
                        ? 'bg-cyan-400 text-slate-950 scale-110 shadow-[0_0_12px_#06b6d4]'
                        : activeStyle === 'chalkboard'
                        ? 'bg-amber-300 text-slate-950 scale-110 shadow-[0_0_12px_#fde047]'
                        : activeStyle === 'cinematic'
                        ? 'bg-amber-400 text-slate-950 scale-110 shadow-[0_0_12px_#f59e0b]'
                        : 'bg-fuchsia-400 text-slate-950 scale-110 shadow-[0_0_12px_#d946ef]'
                      : isSpoken
                      ? 'text-white hover:text-amber-300 hover:scale-105'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {/* BOOK INFO & DIRECT READER DEEP-LINK */}
        <div className="flex items-center justify-between text-white px-1">
          <div className="flex items-center gap-2 max-w-[70%]">
            <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <div className="truncate">
              <h4 className="text-xs font-black truncate">{reel.book_title || 'مقرر دراسي'}</h4>
              <p className="text-[10px] text-white/60 truncate">{reel.author_name || 'خبير المادة'}</p>
            </div>
          </div>

          {onOpenBook && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenBook(reel.book_id, reel.chapter_id);
              }}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-xl border border-white/20 text-[10px] font-black text-white transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            >
              <span>اقرأ الفصل</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🚀 5. FLOATING TIKTOK ENGAGEMENT RAIL (Left Side) */}
      {/* ======================================================== */}
      <div className="absolute top-1/3 left-3 z-40 flex flex-col items-center gap-3 text-white select-none">
        {/* LIKE BUTTON */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group cursor-pointer"
        >
          <div className={`p-2 rounded-full backdrop-blur-md border transition active:scale-75 ${
            isLiked ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/40' : 'bg-black/40 border-white/20 hover:bg-black/60 text-white'
          }`}>
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-black">{likesCount}</span>
        </button>

        {/* INSTANT QUIZ BUTTON */}
        {reel.interactive_quiz && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsQuizActive(!isQuizActive);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="تحدي الفهم السريع"
          >
            <div className={`p-2 rounded-full border transition active:scale-75 ${
              isQuizActive 
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/40' 
                : 'bg-black/40 border-white/20 hover:bg-black/60 text-amber-300'
            }`}>
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-amber-300">اختبرني</span>
          </button>
        )}

        {/* BOOKMARK TAKEAWAY */}
        <button
          onClick={handleBookmark}
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title="حفظ الملاحظة"
        >
          <div className={`p-2 rounded-full backdrop-blur-md border transition active:scale-75 ${
            isBookmarked ? 'bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-500/40' : 'bg-black/40 border-white/20 hover:bg-black/60 text-white'
          }`}>
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-black">حفظ</span>
        </button>

        {/* LIVE STYLE SWITCHER */}
        <button
          onClick={cycleStyle}
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title="تغيير ستايل العرض"
        >
          <div className="p-2 rounded-full bg-black/40 border border-white/20 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-75">
            <Sliders className="w-4 h-4 text-cyan-300" />
          </div>
          <span className="text-[10px] font-black text-cyan-300">ستايل</span>
        </button>

        {/* DOWNLOAD VIDEO BUTTON (Only visible to Admin & Instructor/Teacher) */}
        {isPrivileged && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDownloadModalOpen(true);
            }}
            disabled={isLiveRecording}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="تحميل فيديو الريل كاملاً بجودة استوديو 60FPS"
          >
            <div className={`p-2 rounded-full border transition active:scale-75 ${
              isLiveRecording
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/50'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-300/40 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 backdrop-blur-md'
            }`}>
              {isLiveRecording ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Download className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] font-black ${isLiveRecording ? 'text-rose-400' : 'text-purple-300'}`}>
              {isLiveRecording ? 'يسجل...' : 'تحميل'}
            </span>
          </button>
        )}

        {/* SHARE BUTTON */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group cursor-pointer"
          title="مشاركة الريل"
        >
          <div className="p-2 rounded-full bg-black/40 border border-white/20 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-75">
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </div>
          <span className="text-[10px] font-black">{copiedLink ? 'تم!' : 'مشاركة'}</span>
        </button>
      </div>

      {/* 🔴 LIVE RECORDING STATUS BAR (ACTIVE RECORDING) */}
      {isLiveRecording && (
        <div className="absolute top-4 inset-x-4 z-50 p-3 bg-slate-950/95 border-2 border-rose-500 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between text-white animate-fade-in" dir={dir}>
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div className="truncate">
              <div className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                <span>جاري تسجيل الريل بجودة استوديو 60fps...</span>
              </div>
              <div className="text-[10px] text-slate-300 truncate">
                المتبقي: {Math.max(0, Math.round(totalDuration - currentTimeSec))} ثانية (سيتوقف تلقائياً)
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              stopLiveRecording();
            }}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 shadow-lg"
          >
            <span>⏹️ إنهاء وتنزيل</span>
          </button>
        </div>
      )}

      {/* 🎬 BACKGROUND VIDEO EXPORT PROGRESS OVERLAY */}
      {isExportingVideo && exportProgress && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in" dir={dir}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-cyan-500 to-indigo-600 flex items-center justify-center p-1 shadow-2xl shadow-cyan-500/30 mb-4 animate-pulse">
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
              <span className="text-sm font-black text-cyan-300">{exportProgress.percent}%</span>
            </div>
          </div>

          <h3 className="font-black text-base text-white mb-1">جاري تصدير وتجهيز فيديو الريل 🎬</h3>
          <p className="text-xs text-cyan-200 mb-4 max-w-xs">{exportProgress.status}</p>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${exportProgress.percent}%` }}
            />
          </div>

          <span className="text-[10px] text-slate-400">
            يتم رسم الروبوت بحركاته، الكاريوكي، والدمج الصوتي بدقة 1080p عالية النقاء...
          </span>
        </div>
      )}

      {/* 🎬 STUDIO DOWNLOAD MODAL (Privileged only) */}
      {isDownloadModalOpen && isPrivileged && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsDownloadModalOpen(false);
          }}
          className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white" 
          dir={dir}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-sm bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-right relative"
          >
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">تنزيل وتصدير الريل 🎬</h3>
                <p className="text-[11px] text-indigo-200">اختر طريقة تصدير محتوى الفصل</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* OPTION 1: 1-CLICK DIRECT 60FPS HD EXPORT (RECOMMENDED) */}
              <button
                onClick={handleDirectVideoExport}
                className="w-full p-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-between cursor-pointer shadow-lg shadow-indigo-500/25 border border-white/10 group text-right"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-300 font-bold">⚡ (الموصى به)</span>
                    <span className="text-white font-black text-xs">تنزيل فيديو الريل مباشرة بنقرة واحدة (60FPS HD)</span>
                  </div>
                  <p className="text-[10px] text-indigo-100 font-normal">
                    يشمل الروبوت ثلاثي الأبعاد بحركاته، الكاريوكي المتزامن، والصوت النقي بدون أي نافذة مشاركة
                  </p>
                </div>
                <Download className="w-4 h-4 shrink-0 text-yellow-300 group-hover:translate-x-[-2px] transition" />
              </button>

              {/* OPTION 2: AUDIO ONLY */}
              <button
                onClick={downloadAudioDirectly}
                className="w-full p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl font-bold text-xs transition active:scale-95 flex items-center justify-between cursor-pointer text-right"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-white font-black text-xs">
                    <span>🎙️</span>
                    <span>تنزيل الملف الصوتي فقط (MP3 استوديو)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal">
                    الصوت البشري الطبيعي الفخم عالي النقاء
                  </p>
                </div>
                <Download className="w-4 h-4 shrink-0 text-teal-400" />
              </button>
            </div>

            <div className="pt-1 text-center">
              <span className="text-[10px] text-slate-400">
                💡 يتم إنشاء الفيديو تلقائياً وحفظه في مجلد التنزيلات بجودة 1080p عمودية.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EduReelPlayer;
