import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Sparkles, GraduationCap, Compass, ArrowLeft, ArrowRight, Star,
  ShieldCheck, Zap, Radio, Clock, Award, Users, CheckCircle2, Play, Pause,
  Search, BookMarked, Phone, Mail, Globe, Layers, Laptop, Code2, Brain,
  Briefcase, HeartHandshake, ChevronLeft, Lock, ArrowUpRight, Flame,
  FileText, Film, HelpCircle, Check, RotateCw, ChevronRight, MessageSquare,
  Printer, Download, Eye, EyeOff, Upload, X, Volume2, VolumeX, ShieldAlert,
  BarChart3, XCircle
} from 'lucide-react';
import { MarketplaceBook } from '../types';
import { getPlatformConfig, PlatformConfig } from '../services/platformConfigService';
import { SeoStructuredData } from './seo/SeoStructuredData';
import { useLanguage } from '../i18n/LanguageContext';

interface LandingPageViewProps {
  books: MarketplaceBook[];
  onOpenAuth: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  books,
  onOpenAuth
}) => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfig());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      setPlatformConfig(e.detail || getPlatformConfig());
    };
    window.addEventListener('platform-config-changed', handleConfigChange);
    return () => window.removeEventListener('platform-config-changed', handleConfigChange);
  }, []);

  // 🌟 EL MAESTRO AXIS 4: DUAL HERO AUDIENCE SELECTOR
  const [heroAudience, setHeroAudience] = useState<'student' | 'teacher'>('student');

  // 🌟 45-SECOND INTERACTIVE PRODUCT DEMO PREVIEW
  const [demoStep, setDemoStep] = useState<1 | 2 | 3>(1);
  const [demoAudioPlaying, setDemoAudioPlaying] = useState(false);
  const [demoNumberVal, setDemoNumberVal] = useState<number>(5);
  const [demoQuizOption, setDemoQuizOption] = useState<number | null>(null);
  const [demoQuizAnswered, setDemoQuizAnswered] = useState(false);

  // 🔊 REAL SPEECH SYNTHESIS ENGINE (محرّك النطق الصوتي الحي والمسموع النقي)
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const vList = window.speechSynthesis.getVoices();
      if (vList && vList.length > 0) setVoices(vList);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // 🧹 إزالة كافة الرموز والبادئات والرموز التعبيرية وعلامات الترقيم حتى ينطق الصوت كلمات عربية سليمة نقية دون قراءة أي رمز
  const cleanTextForTts = (raw: string): string => {
    if (!raw) return '';
    return raw
      // Remove speaker prefixes like "أ. فرح (معلمة خبيرة):" or "كريم (طالب):" or "كريم:" or "أ. فرح:"
      .replace(/^[\s\S]*?[:：]/, '')
      // Remove any parentheticals like "(طالب)" or "(معلمة خبيرة)"
      .replace(/\([^\)]*\)/g, '')
      // Remove all emojis and pictographs
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      // Remove markdown, stars, bullets, quotes, and symbols
      .replace(/[*#_`~\[\]{}"«»•★⚡▶◀©®™🎯💡⚖️🧬🚀🎧🔊]/g, '')
      // Replace punctuation that speech synthesis might pronounce aloud
      .replace(/[!؟?.,:;\-–—/\\|]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const playSpeech = (rawText: string, speaker: 'karim' | 'farah', onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isMuted) return;

    const cleaned = cleanTextForTts(rawText);
    if (!cleaned) {
      if (onEnd) onEnd();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'ar-SA';
      
      // Karim: eager male student; Farah: calm, warm educational authority
      if (speaker === 'karim') {
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      } else {
        utterance.pitch = 0.95;
        utterance.rate = 0.92;
      }

      const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const arabicVoices = allVoices.filter(v => 
        v.lang.startsWith('ar') || 
        v.lang.includes('ar_') || 
        v.name.toLowerCase().includes('arabic') || 
        v.name.includes('عربي')
      );

      // Prioritize Google Arabic natural voices (صوت جوجل العربي النقي)
      const googleArabic = arabicVoices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('natural')
      );

      if (googleArabic) {
        utterance.voice = googleArabic;
      } else if (arabicVoices.length > 0) {
        if (speaker === 'karim') {
          utterance.voice = arabicVoices.find(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('tarik') || 
            v.name.toLowerCase().includes('maged') ||
            v.name.toLowerCase().includes('shakir') ||
            v.name.toLowerCase().includes('hamed')
          ) || arabicVoices[0];
        } else {
          utterance.voice = arabicVoices.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('laila') || 
            v.name.toLowerCase().includes('salma') ||
            v.name.toLowerCase().includes('zeina')
          ) || arabicVoices[arabicVoices.length - 1];
        }
      }

      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis notice:", e);
      if (onEnd) onEnd();
    }
  };

  const stopAllSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // 1. HERO INTERACTIVE LIVE SIMULATOR STATE (شرح حقيقي مشكّل وموجه لخدمات المنصة)
  const [isHeroPlaying, setIsHeroPlaying] = useState(false);
  const [heroSpeaker, setHeroSpeaker] = useState<'karim' | 'farah'>('karim');
  const [heroDialogueIndex, setHeroDialogueIndex] = useState(0);

  const heroDialogues = [
    {
      speaker: 'karim' as const,
      name: 'كَرِيم (طَالِب)',
      avatar: '👦',
      text: 'يَا أُسْتَاذَتِي فَرَح! كَيْفَ تُحَوِّلُ هَذِهِ المَنَصَّةُ مُذَكَّرَاتِي وَكُتُبِي إِلَى تَجْرِبَةِ مَذَاكَرَةٍ ذَكِيَّةٍ فِي ثَوَانٍ؟'
    },
    {
      speaker: 'farah' as const,
      name: 'أ. فَرَح (مُعَلِّمَة خَبِيرَة)',
      avatar: '👩‍🏫',
      text: 'سُؤَالٌ رَائِعٌ يَا كَرِيم! بِمُجَرَّدِ أَنْ تَرْفَعَ أَيَّ مُذَكَّرَةٍ، تَقُومُ المَنَصَّةُ بِتَوْلِيدِ بُودْكَاسْت صَوْتِيٍّ حِوَارِيٍّ بَيْنَنَا، مَعَ خَرَائِطَ ذِهْنِيَّةٍ تَفَاعُلِيَّةٍ، وَامْتِحَانَاتٍ مَطْبُوعَةٍ تُصَحِّحُ لَكَ فَوْراً!'
    },
    {
      speaker: 'karim' as const,
      name: 'كَرِيم (طَالِب)',
      avatar: '👦',
      text: 'يَعْنِي فَقَطْ أَرْفَعُ المَلَفَّ، وَأَسْتَمِعُ لِلشَّرْحِ مَعَكِ، وَأَطْبَعُ امْتِحَانَاتِي بِنَمَاذِجِ الإِجَابَةِ المَفْهُومَةِ؟'
    },
    {
      speaker: 'farah' as const,
      name: 'أ. فَرَح (مُعَلِّمَة خَبِيرَة)',
      avatar: '👩‍🏫',
      text: 'بِالضَّبْطِ يَا كَرِيم! وَتَسْتَطِيعُ تَجْرِبَةَ كُلِّ هَذَا مَجَّاناً الآنَ بِمُجَرَّدِ إِنْشَاءِ حِسَابِكَ فِي ثَانِيَةٍ وَاحِدَةٍ!'
    }
  ];

  const handleToggleHeroPlay = () => {
    if (isHeroPlaying) {
      setIsHeroPlaying(false);
      stopAllSpeech();
    } else {
      setIsHeroPlaying(true);
      playHeroDialogueStep(0);
    }
  };

  const playHeroDialogueStep = (stepIdx: number) => {
    const current = heroDialogues[stepIdx];
    if (!current) {
      setIsHeroPlaying(false);
      return;
    }
    setHeroDialogueIndex(stepIdx);
    setHeroSpeaker(current.speaker);

    playSpeech(current.text, current.speaker, () => {
      // Auto-advance to next speaker
      if (stepIdx + 1 < heroDialogues.length) {
        setTimeout(() => {
          playHeroDialogueStep(stepIdx + 1);
        }, 600);
      } else {
        setTimeout(() => {
          setIsHeroPlaying(false);
        }, 1000);
      }
    });
  };

  // 2. VIDEO WALKTHROUGH MODAL
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // 3. REEL PREVIEW MODAL
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [reelPlaying, setReelPlaying] = useState(false);

  // 4. PRINTABLE EXAM STUDIO STATE (استوديو الامتحانات المطبوعة ونماذج الإجابة)
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const sampleExams = [
    {
      title: 'امتحان اللغة العربية - الصف الثاني الثانوي (الفصل الدراسي الأول)',
      subject: 'اللغة العربية والفرقان الأكاديمي',
      grade: 'الصف الثاني الثانوي',
      duration: 'ساعتان (120 دقيقة)',
      totalMarks: 20,
      passingMarks: 10,
      instructions: [
        'أجب عن جميع الأسئلة الآتية في ورقة الإجابة المخصصة.',
        'اقرأ القطعة النحوية بدقة قبل اختيار البديل المناسب.',
        'ممنوع استخدام أي مذكرات خارجية أو أجهزة إلكترونية.'
      ],
      mcqQuestions: [
        {
          q: 'قال الشاعر: "ألا كلُّ شيءٍ ما خلا الله باطلُ ... وكلُّ نعيمٍ لا محالةَ زائلُ" • إعراب لفظ الجلالة (الله) في البيت السابق:',
          options: ['مفعول به منصوب وجوباً', 'اسم مجرور بحرف الجر', 'فاعل مرفوع بالضمة', 'بدل مطابق منصوب'],
          correct: 0,
          explanation: 'الأفعال (ما خلا، ما عدا) إذا سُبقت بـ "ما" المصدرية تعيَّن أن تكون أفعالاً ماضية، وما بعدها مفعول به منصوب وجوباً.'
        },
        {
          q: 'في جملة: "إنّ أباك ذو فضلٍ عظيم على أبنائه"، علامة إعراب الكلمتين (أباك، ذو) على الترتيب:',
          options: ['الفتحة، الضمة', 'الألف، الواو', 'الياء، الألف', 'الألف، الضمة الظاهرة'],
          correct: 1,
          explanation: '"أباك" اسم إن منصوب وعلامة نصبه الألف لأنه من الأسماء الخمسة، و"ذو" خبر إن مرفوع بالواو لأنه من الأسماء الخمسة.'
        },
        {
          q: 'لا تصاحب إلا ذا الخلق القويم. إعراب كلمة "ذا" في الجملة:',
          options: ['مفعول به منصوب بالألف', 'فاعل مرفوع بالواو', 'مستثنى منصوب بالفتحة', 'مضاف إليه مجرور'],
          correct: 0,
          explanation: 'الكلام ناقص منفي، لذا يُعرب ما بعد إلا حسب موقعه في الجملة: تصاحب أنت ذا (مفعول به منصوب بالألف).'
        }
      ],
      essayQuestion: {
        q: 'بيّن الحكم الإعرابي لاسم "لا النافية للجنس" في العبارتين: (1. لا طالبَ علمٍ مهملٌ) و (2. لا طالبَ مهملٌ). مع التعليل.',
        modelAnswer: '1. في الجملة الأولى: معرب منصوب بالفتحة لأنه مضاف. • 2. في الجملة الثانية: مبني على الفتح في محل نصب لأنه مفرد.'
      }
    },
    {
      title: 'امتحان الفيزياء والميكانيكا - قوانين الحركة والقصور الذاتي (نيوتن)',
      subject: 'الفيزياء والرياضيات التطبيقية',
      grade: 'الصف الأول الثانوي',
      duration: 'ساعة ونصف (90 دقيقة)',
      totalMarks: 20,
      passingMarks: 10,
      instructions: [
        'عجلة الجاذبية الأرضية g = 9.8 m/s² ما لم يذكر خلاف ذلك.',
        'وضح خطوات الحل والقوانين الرياضية بالتفصيل للحصول على الدرجة الكاملة.'
      ],
      mcqQuestions: [
        {
          q: 'عند انعدام القوة المحصلة المؤثرة على جسم متحرك في الفضاء، فإن سرعة الجسم:',
          options: ['تزداد بمعدل ثابت', 'تظل ثابتة المقدار والاتجاه في خط مستقيم', 'تتناقص تدريجياً حتى السكون', 'تنحرف في مسار دائري'],
          correct: 1,
          explanation: 'طبقاً لقانون نيوتن الأول، الجسم المتحرك يستمر بحركته بسرعة منتظمة في خط مستقيم ما لم تؤثر عليه قوة خارجية محصلة.'
        },
        {
          q: 'اندفاع ركاب الحافلة إلى الأمام عند توقفها فجأة يُفسَّر بظاهرة:',
          options: ['قانون الجذب العام', 'القصور الذاتي ومقاومة التغير الحركي', 'قانون نيوتن الثالث', 'التجاذب الكهرومغناطيسي'],
          correct: 1,
          explanation: 'القصور الذاتي يجعل أجسام الركاب تحاول الاستمرار في حالة الحركة التي كانت عليها قبل التوقف المفاجئ.'
        }
      ],
      essayQuestion: {
        q: 'علل: صعوبة إيقاف قطار بضائع محمل مقارنة بسيارة صغيرة تتحرك بنفس السرعة.',
        modelAnswer: 'لأن كتلة القطار أكبر بكثير من كتلة السيارة، والقصور الذاتي يتناسب طردياً مع الكتلة؛ فكلما زادت الكتلة زادت مقاومة الجسم لتغيير حالته الحركية.'
      }
    }
  ];

  const activeExam = sampleExams[selectedExamIndex] || sampleExams[0];

  const handlePrintExam = () => {
    window.print();
  };

  // 5. AUDIENCE PERSONALIZED TABS STATE
  const [activeAudienceTab, setActiveAudienceTab] = useState<'student' | 'teacher' | 'learner'>('student');

  // 6. BENTO FLASHCARD AUTO-FLIP STATE
  const [isBentoFlipped, setIsBentoFlipped] = useState(false);

  // 7. INTERACTIVE MINI-DEMO (SANDBOX) STATE
  const [demoQuery, setDemoQuery] = useState('');
  const [isDemoGenerating, setIsDemoGenerating] = useState(false);
  const [demoActiveResult, setDemoActiveResult] = useState<{
    concept: string;
    karimQuestion: string;
    farahAnswer: string;
    goldenRule: string;
    quickQuestion: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } | null>({
    concept: 'قَانُونُ نْيُوتِن الأَوَّل (القُصُورُ الذَّاتِيُّ)',
    karimQuestion: 'يَا أُسْتَاذَتِي فَرَح! كَيْفَ أَفْهَمُ فِكْرَةَ القُصُورِ الذَّاتِيِّ بِاخْتِصَارٍ دُونَ حِفْظٍ مُعَقَّدٍ؟',
    farahAnswer: 'تَخَيَّلْ أَنَّكَ رَاكِبٌ فِي حَافِلَةٍ تَوَقَّفَتْ فَجْأَةً! يَنْدَفِعُ جِسْمُكَ لِلأَمَامِ لِأَنَّ الأَجْسَامَ تُقَاوِمُ تَغْيِيرَ حَالَتِهَا الحَرَكِيَّةِ مَا لَمْ تُؤَثِّرْ عَلَيْهَا قُوَّةٌ خَارِجِيَّةٌ.',
    goldenRule: '⚖️ القَاعِدَةُ الذَّهَبِيَّةُ: الجِسْمُ السَّاكِنُ يَبْقَى سَاكِناً، وَالجِسْمُ المُتَحَرِّكُ يَسْتَمِرُّ بِحَرَكَتِهِ المُنْتَظِمَةِ فِي خَطٍّ مُسْتَقِيمٍ مَا لَمْ تُؤَثِّرْ عَلَيْهِ قُوَّةٌ مُحَصِّلَةٌ.',
    quickQuestion: 'إِذَا انْعَدَمَتْ مَحْصَلَةُ القُوَى المُؤَثِّرَةِ عَلَى جِسْمٍ مُتَحَرِّكٍ، فَإِنَّ سُرْعَتَهُ:',
    options: ['تَظَلُّ ثَابِتَةَ المِقْدَارِ وَالاتِّجَاهِ', 'تَتَزَايَدُ تَدْرِيجِيّاً', 'تَتَنَاقَصُ حَتَّى يَتَوَقَّفَ'],
    correctIndex: 0,
    explanation: 'طِبْقاً لِقَانُونِ نْيُوتِن الأَوَّل، فِي غِيَابِ أَيِّ قُوَّةٍ مُحَصِّلَةٍ، يَسْتَمِرُّ الجِسْمُ بِحَرَكَتِهِ بِنَفْسِ السُّرْعَةِ وَالاتِّجَاهِ.'
  });
  const [demoSelectedOption, setDemoSelectedOption] = useState<number | null>(null);

  const sampleDemoSuggestions = [
    { title: 'شعر عربي', subject: 'أدب وبلاغة' },
    { title: 'قانون نيوتن الأول', subject: 'فيزياء' },
    { title: 'إعراب الأسماء الخمسة', subject: 'لغة عربية' },
    { title: 'الانقسام الميتوزي', subject: 'أحياء' }
  ];

  const handleRunDemo = (topic: string) => {
    setDemoQuery(topic);
    setIsDemoGenerating(true);
    setDemoSelectedOption(null);
    stopAllSpeech();

    setTimeout(() => {
      let resultData: any;
      if (topic.includes('شعر') || topic.includes('أدب') || topic.includes('بلاغ')) {
        resultData = {
          concept: 'جَوْهَرُ الشِّعْرِ العَرَبِيِّ وَالأَدَبِ',
          karimQuestion: 'يَا أُسْتَاذَتِي فَرَح! كَيْفَ أَسْتَوْعِبُ جَوْهَرَ الشِّعْرِ العَرَبِيِّ وَأَفْهَمُ بَلَاغَتَهُ دُونَ صُعُوبَةٍ؟',
          farahAnswer: 'الشِّعْرُ العَرَبِيُّ يَقُومُ عَلَى فَهْمِ المَعْنَى المَقْصُودِ وَالتَّذَوُّقِ البَلَاغِيِّ؛ فَالإِعْرَابُ فَرْعُ المَعْنَى وَلَيْسَ حِفْظاً آلِيّاً دُونَ رُوحٍ!',
          goldenRule: '⭐ قَاعِدَةٌ ذَهَبِيَّةٌ: مَنْ أَدْرَكَ مَقْصُودَ الشَّاعِرِ انْفَتَحَتْ لَهُ أَبْوَابُ الإِعْرَابِ وَالتَّذَوُّقِ البَلَاغِيِّ تِلْقَائِيّاً.',
          quickQuestion: 'القَاعِدَةُ الأَسَاسِيَّةُ لِفَهْمِ وَإِعْرَابِ أَبْيَاتِ الشِّعْرِ العَرَبِيِّ هِيَ:',
          options: ['الإِعْرَابُ فَرْعُ المَعْنَى وَفَهْمِ السِّيَاقِ', 'الحِفْظُ العَشْوَائِيُّ دُونَ فَهْمٍ', 'إِهْمَالُ البَلَاغَةِ وَالخَيَالِ'],
          correctIndex: 0,
          explanation: 'فَهْمُ سِيَاقِ البَيْتِ وَمَقْصُودِ الشَّاعِرِ هُوَ المِفْتَاحُ الأَوَّلُ لِلإِعْرَابِ الصَّحِيحِ وَالتَّذَوُّقِ البَلَاغِيِّ.'
        };
      } else if (topic.includes('خمسة') || topic.includes('إعراب')) {
        resultData = {
          concept: 'إِعْرَابُ الأَسْمَاءِ الخَمْسَةِ (أَبُو، أَخُو، حَمُو، فُو، ذُو)',
          karimQuestion: 'يَا أُسْتَاذَتِي فَرَح! مَتَى تُعْرَبُ الأَسْمَاءُ الخَمْسَةُ بِالحُرُوفِ وَمَتَى تُعْرَبُ بِالحَرَكَاتِ؟',
          farahAnswer: 'الشَّرْطُ الجَوْهَرِيُّ يَا كَرِيم: أَنْ تَكُونَ مُفْرَدَةً، وَمُضَافَةً لِغَيْرِ يَاءِ المُتَكَلِّمِ؛ فَإِذَا أُضِيفَتْ لِيَاءِ المُتَكَلِّمِ أُعْرِبَتْ بِحَرَكَاتٍ مُقَدَّرَةٍ!',
          goldenRule: '⭐ فَخُّ الامْتِحَانِ: فِي جُمْلَةِ (هَذَا أَخِي)، كَلِمَةُ (أَخِي) تُعْرَبُ بِضَمَّةٍ مُقَدَّرَةٍ عَلَى مَا قَبْلِ اليَاءِ وَلَيْسَتْ بِالحُرُوفِ!',
          quickQuestion: 'فِي جُمْلَةِ "إِنَّ أَبَاكَ ذُو فَضْلٍ"، عَلَامَةُ نَصْبِ "أَبَاكَ" هِيَ:',
          options: ['الأَلِفُ لِأَنَّهُ مِنَ الأَسْمَاءِ الخَمْسَةِ', 'الفَتْحَةُ الظَّاهِرَةُ', 'اليَاءُ'],
          correctIndex: 0,
          explanation: 'الأَسْمَاءُ الخَمْسَةُ تُنْصَبُ بِالأَلِفِ، وَتُرْفَعُ بِالوَاوِ، وَتُجَرُّ بِاليَاءِ بِشَرْطِ الإِضَافَةِ لِغَيْرِ يَاءِ المُتَكَلِّمِ.'
        };
      } else if (topic.includes('ميتوزي') || topic.includes('أحياء')) {
        resultData = {
          concept: 'الانْقِسَامُ المَيْتُوزِيُّ (الخَلَوِيُّ غَيْرُ المُبَاشِرِ)',
          karimQuestion: 'يَا أُسْتَاذَتِي فَرَح! مَا الهَدَفُ الأَسَاسِيُّ مِنَ الانْقِسَامِ المَيْتُوزِيِّ فِي جِسْمِ الكَائِنِ الحَيِّ؟',
          farahAnswer: 'النُّمُوُّ وَتَعْوِيضُ الخَلَايَا التَّالِفَةِ وَنَقْلُ المَادَّةِ الوِرَاثِيَّةِ كَامِلَةً لِكُلِّ خَلِيَّةٍ بَنَوِيَّةٍ جَدِيدَةٍ!',
          goldenRule: '🧬 خُلَاصَةٌ سَرِيعَةٌ: يُنْتِجُ خَلِيَّتَيْنِ مُتَطَابِقَتَيْنِ تَمَاماً لِلخَلِيَّةِ الأُمِّ بِنَفْسِ عَدَدِ الكُرُومُوسُومَاتِ.',
          quickQuestion: 'الطَّوْرُ الَّذِي تَتَرَتَّبُ فِيهِ الكُرُومُوسُومَاتُ عِنْدَ خَطِّ اسْتِوَاءِ الخَلِيَّةِ هُوَ:',
          options: ['الطَّوْرُ الاسْتِوَائِيُّ', 'الطَّوْرُ البَيْنِيُّ', 'الطَّوْرُ الانْفِصَالِيُّ'],
          correctIndex: 0,
          explanation: 'فِي الطَّوْرِ الاسْتِوَائِيِّ تَتَرَتَّبُ الكُرُومُوسُومَاتُ عَلَى خَطِّ اسْتِوَاءِ الخَلِيَّةِ بِوَاسِطَةِ خُيُوطِ المِغْزَلِ.'
        };
      } else {
        resultData = {
          concept: `شَرْحُ وَتَبْسِيطُ: ${topic}`,
          karimQuestion: `يَا أُسْتَاذَتِي فَرَح! كَيْفَ تُفَسِّرِينَ لِي جَوْهَرَ ${topic} بِأَسْهَلِ طَرِيقَةٍ؟`,
          farahAnswer: `الفِكْرَةُ الأَسَاسِيَّةُ تَقُومُ عَلَى فَهْمِ المَفْهُومِ المِحْوَرِيِّ أَوَّلاً، ثُمَّ رَبْطِهِ بِمِثَالٍ حَيٍّ وَتَطْبِيقِهِ فِي نَمَاذِجِ الامْتِحَانَاتِ لِضَمَانِ أَعْلَى الدَّرَجَاتِ!`,
          goldenRule: `💡 نَصِيحَةُ التَّفَوُّقِ: المَذَاكَرَةُ البَصَرِيَّةُ عَبْرَ الخَرَائِطِ المَفَاهِيمِيَّةِ تُعِينُكَ عَلَى اسْتِرْجَاعِ المَعْلُومَاتِ لَيْلَةَ الامْتِحَانِ بِيُسْرٍ.`,
          quickQuestion: `الخُطْوَةُ الأُولَى لِفَهْمِ وَاسْتِيعَابِ ${topic} هِيَ:`,
          options: ['فَهْمُ الفِكْرَةِ وَرَبْطُهَا بِالخَرِيطَةِ الذِّهْنِيَّةِ', 'حِفْظُ النَّصِّ كَامِلاً دُونَ فَهْمٍ', 'تَأْجِيلُ المَذَاكَرَةِ لِلَيْلَةِ الامْتِحَانِ'],
          correctIndex: 0,
          explanation: 'الفَهْمُ الاسْتِيعَابِيُّ المَبْنِيُّ عَلَى الخَرَائِطِ الذِّهْنِيَّةِ يُرَسِّخُ المَعْلُومَةَ فِي الذَّاكِرَةِ طَوِيلَةِ المَدَى.'
        };
      }
      setDemoActiveResult(resultData);
      setIsDemoGenerating(false);

      // Play Farah's answer aloud for instant real audible feedback (pure vocalization without symbols)!
      playSpeech(`${resultData.farahAnswer} ${resultData.goldenRule}`, 'farah');
    }, 700);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full text-right font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden bg-slate-50/50" dir={dir}>
      <SeoStructuredData type="landing" platformName={platformConfig.brandName || 'Ebook Osera AI'} />

      {/* 🌟 1. INTERACTIVE LIVE HERO SECTION (محاكي حي بالصوت الحقيقي المسموع) */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-900 text-white border-b border-indigo-950">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* 🌟 AUDIENCE SWITCHER (EL MAESTRO AXIS 4) */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex p-1.5 bg-slate-900/90 border border-indigo-500/40 rounded-2xl shadow-xl backdrop-blur-md">
              <button
                onClick={() => setHeroAudience('student')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                  heroAudience === 'student'
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>أنا طالب أبحث عن التفوق 🎓</span>
              </button>

              <button
                onClick={() => setHeroAudience('teacher')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                  heroAudience === 'teacher'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>أنا معلم / صانع محتوى 💼</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* RIGHT COLUMN: PUNCHY HEADLINE & CTA */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-right">
              {heroAudience === 'student' ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/80 border border-indigo-500/40 text-teal-300 text-xs font-black shadow-lg shadow-indigo-950/50">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    <span>مساعدك الدراسي الذكي الشامل بالذكاء الاصطناعي ✨</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.3] tracking-tight">
                    حوّل أي مذكرة أو كتاب إلى{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-300">
                      تجربة تعليمية حيّة في ثوانٍ!
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                    مساعدك الذكي لإنجاز المذاكرة: بودكاست صوتي مسموع بين شخصيتين (كريم وفرح)، معامل تفاعلية حية، خرائط ذهنية لكل درس، وامتحانات موقوتة بنماذج إجابة معتمدة.
                  </p>

                  {/* Primary Dual CTA Buttons */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                    <button
                      onClick={onOpenAuth}
                      className="px-7 py-3.5 bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5 text-slate-950" />
                      <span>جرّب مجاناً الآن 🚀</span>
                      <ArrowLeft className="w-4 h-4 text-slate-950" />
                    </button>

                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 text-teal-300 fill-teal-300" />
                      <span>شاهد كيف يعمل في دقيقة ▶</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>منصة المعلم الرقمي المتكاملة لحماية ونشر المذكرات 🛡️</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.3] tracking-tight">
                    حوّل مذكراتك إلى{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-300 to-indigo-300">
                      أكاديمية تفاعلية واحمِ ملكيتك الفكرية!
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                    حماية تامة من التسريب، توليد بنوك أسئلة وامتحانات مطبوعة آلياً، رادار لحظي لكشف تعثر الطلاب ونقاط الاختناق، وسحب فوري لصافي أرباحك بنسبة 85% عبر فودافون كاش وإنستاباي.
                  </p>

                  {/* Primary Dual CTA Buttons */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                    <button
                      onClick={onOpenAuth}
                      className="px-7 py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-rose-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Briefcase className="w-5 h-5 text-white" />
                      <span>انضم كمعلم معتمد 💼</span>
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>

                    <button
                      onClick={() => navigate('/admin')}
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 text-amber-300" />
                      <span>استكشف رادار كشف التعثر 📊</span>
                    </button>
                  </div>
                </>
              )}

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-bold text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>50+ مقرر تفاعلي معتمد</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>+15,000 طالب نشط</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>100% حماية ملكية فكرية وعائد 85%</span>
                </div>
              </div>
            </div>

            {/* LEFT COLUMN: LIVE DUAL-SPEAKER PODCAST SIMULATOR (WITH ACTUAL AUDIBLE SPEECH) */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/80 space-y-4 relative overflow-hidden">
                  
                  {/* Decorative Header with Audio Play Button */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>استوديو البودكاست الحي</span>
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-500/30">صوت حقيقي 🔊</span>
                        </h4>
                        <p className="text-[10px] text-slate-400">انقر للاستماع للنطق البشري الحي لكريم وفرح</p>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleHeroPlay}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition shadow-md cursor-pointer ${
                        isHeroPlaying 
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400' 
                          : 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white'
                      }`}
                    >
                      {isHeroPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف الصوت ⏸️</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>اسمع الحوار الآن 🎧</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Dual Speakers Dialogue Box with Animated Waves */}
                  <div className="space-y-3">
                    {heroDialogues.map((item, idx) => {
                      const isActive = heroDialogueIndex === idx && isHeroPlaying;
                      const isKarim = item.speaker === 'karim';

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setIsHeroPlaying(true);
                            playHeroDialogueStep(idx);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                            isActive
                              ? isKarim
                                ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400/40'
                                : 'bg-purple-950/90 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/40'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{item.avatar}</span>
                              <span className={`text-xs font-black ${isKarim ? 'text-cyan-300' : 'text-purple-300'}`}>
                                {item.name}
                              </span>
                            </div>
                            {isActive && (
                              <div className="flex items-center gap-0.5 h-3">
                                <span className={`w-1 rounded-full animate-soundwave ${isKarim ? 'bg-cyan-400' : 'bg-purple-400'}`} style={{ animationDelay: '0.1s' }} />
                                <span className={`w-1 rounded-full animate-soundwave ${isKarim ? 'bg-cyan-400' : 'bg-purple-400'}`} style={{ animationDelay: '0.3s' }} />
                                <span className={`w-1 rounded-full animate-soundwave ${isKarim ? 'bg-cyan-400' : 'bg-purple-400'}`} style={{ animationDelay: '0.2s' }} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium leading-relaxed">
                            "{item.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Golden Platform Advantage Card */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950 border border-amber-500/40 rounded-2xl space-y-1.5 text-right">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-black flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>سِرُّ التَّفَوُّقِ وَالإِنْجَازِ فِي المَنَصَّةِ ✨</span>
                      </span>
                      <span className="text-[10px] text-teal-300 font-mono">مَذَاكَرَةٌ مُتَعَدِّدَةُ الحَوَاسِّ 🎧</span>
                    </div>
                    <p className="text-xs text-amber-100 font-bold leading-relaxed">
                      "تَحْوِيلُ المَذَاكَرَةِ إِلَى حِوَارٍ صَوْتِيٍّ مَسْمُوعٍ مَعَ خَرَائِطَ ذِهْنِيَّةٍ بَصَرِيَّةٍ وَامْتِحَانَاتٍ وَرَقِيَّةٍ مَطْبُوعَةٍ؛ يَرْفَعُ نِسْبَةَ تَثْبِيتِ المَعْلُومَاتِ لَدَيْكَ إِلَى 95% دُونَ إِرْهَاقٍ ذِهْنِيٍّ."
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ⚡ EL MAESTRO AXIS 4: 45-SECOND INTERACTIVE PRODUCT DEMO PREVIEW (ZERO LOGIN REQUIRED) */}
      <section className="py-12 sm:py-16 bg-slate-900 text-white border-b border-indigo-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/30">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>معاينة حية بدون تسجيل دخول أو دفع مسبق</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              جرّب التقنيات الثلاث السيادية في 45 ثانية!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              تنقل بين الشرح الصوتي البشري، المعمل الرياضي الحي، والكويز التفاعلي لتختبر الفارق الجوهري بنفسك.
            </p>

            {/* Step Selector Pills */}
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                onClick={() => setDemoStep(1)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  demoStep === 1
                    ? 'bg-teal-500 text-slate-950 shadow-md ring-2 ring-teal-400'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>1. الراوي الصوتي البشري 🎙️</span>
              </button>

              <button
                onClick={() => setDemoStep(2)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  demoStep === 2
                    ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. المعمل الرياضي التفاعلي 🧪</span>
              </button>

              <button
                onClick={() => setDemoStep(3)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  demoStep === 3
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3. التقييم الذاتي والتصحيح ⚡</span>
              </button>
            </div>
          </div>

          {/* Interactive Demo Container */}
          <div className="bg-slate-950/80 border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* STEP 1: AUDIBLE NARRATOR DEMO */}
            {demoStep === 1 && (
              <div className="space-y-6 animate-fade-in text-center sm:text-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center justify-center sm:justify-start gap-2">
                      <Radio className="w-5 h-5 text-teal-400 animate-pulse" />
                      <span>محرك الترجمة الصوتية للمعادلات والرموز الرياضية</span>
                    </h3>
                    <p className="text-xs text-slate-400">تحويل لغة KaTeX الصامتة إلى لغة عربية فصحى مقروءة بنبرة معلم حقيقي</p>
                  </div>

                  <button
                    onClick={() => {
                      if (demoAudioPlaying) {
                        setDemoAudioPlaying(false);
                        stopAllSpeech();
                      } else {
                        setDemoAudioPlaying(true);
                        playSpeech(
                          "أهلاً بك! في منصتنا لن تسمع قراءة رموز عمياء، بل ننطق: مصفوفة مربعة، صفها الأول ألف وباء، ونميز بين الجذر الأصم والنسبي بدقة فصحى نقية.",
                          'farah',
                          () => setDemoAudioPlaying(false)
                        );
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer mx-auto sm:mx-0 ${
                      demoAudioPlaying
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md'
                    }`}
                  >
                    {demoAudioPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>إيقاف الصوت ⏸️</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>تشغيل العينة الصوتية الآن ▶</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Script Display */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-teal-400 block">النص المقروء صوتياً بلغة فصحى مشكولة:</span>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    "أَهْلاً بِكَ! فِي مَنَصَّتِنَا لَنْ تَسْمَعَ قِرَاءَةَ رُمُوزٍ عَمْيَاء، بَلْ نَنْطِقُ: مَصْفُوفَةٌ مُرَبَّعَةٌ، صَفُّهَا الأَوَّلُ أَلِف وَبَاء، وَنُمَيِّزُ بَيْنَ الْجَذْرِ الأَصَمِّ وَالنِّسْبِيِّ بِدِقَّةِ فُصْحَى نَقِيَّة."
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: INTERACTIVE LAB (NUMBER LINE & IRRATIONALS) */}
            {demoStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      <span>المعمل التفاعلي الحي: خط الأعداد والعمليات على الأعداد الحقيقية</span>
                    </h3>
                    <p className="text-xs text-slate-400">حرّك المؤشر لمشاهدة الحسابات والتصنيف البيداغوجي المباشر</p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs text-slate-400">قيمة المتغير X:</span>
                    <span className="text-2xl font-black text-indigo-400 mr-2">{demoNumberVal}</span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>1</span>
                    <span className="text-indigo-300 font-bold">اسحب للتحكم بالقيمة الحية (1 - 25)</span>
                    <span>25</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={demoNumberVal}
                    onChange={(e) => setDemoNumberVal(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Live Computed Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">الجذر التربيعي (√X)</span>
                    <span className="text-lg font-black text-teal-400 font-mono">
                      {Math.sqrt(demoNumberVal).toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {Number.isInteger(Math.sqrt(demoNumberVal)) ? '🟢 مربع كامل (عدد نسبي Q)' : '⚡ جذر أصم (عدد غير نسبي Q\')'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">مربع العدد (X²)</span>
                    <span className="text-lg font-black text-indigo-400 font-mono">
                      {demoNumberVal * demoNumberVal}
                    </span>
                    <span className="text-[10px] text-slate-400 block">مساحة المربع الهندسي المنشأ</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">المعكوس الضربي (1 / X)</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {(1 / demoNumberVal).toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">كسر اعتيادي منتهي أو دوري</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: INSTANT SELF-SCORING QUIZ */}
            {demoStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      <span>كويز التقييم الذاتي والتصحيح اللحظي مع المعلم الذكي</span>
                    </h3>
                    <p className="text-xs text-slate-400">انقر على الخيار الصحيح لاختبار مصفوفة التغذية الراجعة الفورية</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <h4 className="text-sm sm:text-base font-black text-white">
                    أي من الأعداد الآتية يعتبر عدداً غير نسبي (ينتمي إلى المجموعة Q')؟
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { text: 'الجذر التربيعي للعدد 25 (الناتج = 5)', isCorrect: false },
                      { text: 'الكسر الاعتيادي 22 / 7', isCorrect: false },
                      { text: 'الجذر التربيعي للعدد 5 (جذر أصم)', isCorrect: true },
                      { text: 'الكسر العشري المنتهي 3.5', isCorrect: false }
                    ].map((opt, oIdx) => {
                      const isChosen = demoQuizOption === oIdx;
                      let btnClass = "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200";
                      if (demoQuizAnswered) {
                        if (opt.isCorrect) btnClass = "bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50";
                        else if (isChosen) btnClass = "bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50";
                        else btnClass = "bg-slate-900 border-slate-800 text-slate-500 opacity-50";
                      }
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setDemoQuizOption(oIdx);
                            setDemoQuizAnswered(true);
                          }}
                          className={`p-3 rounded-xl border text-right text-xs font-bold transition flex items-center justify-between cursor-pointer ${btnClass}`}
                        >
                          <span>{opt.text}</span>
                          {demoQuizAnswered && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {demoQuizAnswered && isChosen && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {demoQuizAnswered && (
                    <div className="p-3 bg-indigo-950/50 border border-indigo-500/40 rounded-xl text-xs space-y-1 animate-fade-in">
                      <span className="font-bold text-teal-300 block">💡 التفسير البيداغوجي للمعلم الذكي:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        الجذر التربيعي للعدد 5 لا يمكن وضعه على صورة كسر اعتيادي بسطه ومقامه أعداد صحيحة ومقامه لا يساوي صفراً، وعشريته غير منتهية وغير دورية، لذلك فهو عدد غير نسبي أصيل.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🚀 2. THE 3-STEP VISUAL JOURNEY */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full">
              بساطة الاستخدام
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              رحلة المذاكرة السحرية في 3 خطوات بسيطة
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              لا داعي لتضييع الساعات في التلخيص وكتابة المذكرات؛ دع الذكاء الاصطناعي يبني لك مسار الفهم الفوري.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-6 bg-slate-50 hover:bg-slate-50/80 border-2 border-slate-200 hover:border-teal-500 rounded-3xl space-y-4 transition-all duration-300 group shadow-xs hover:shadow-md relative">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-lg group-hover:scale-110 transition shadow-xs">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition">
                  ارفع مذكرتك أو اختر مقررك 📄
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  اسحب ملف الـ PDF أو Word لأي مذكرة أو كتاب، أو تصفح مكتبة المقررات المعتمدة الجاهزة فوراً.
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>تحليل ذكي تلقائي للفصول والدروس</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-slate-50/80 border-2 border-slate-200 hover:border-indigo-500 rounded-3xl space-y-4 transition-all duration-300 group shadow-xs hover:shadow-md relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg group-hover:scale-110 transition shadow-xs">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition">
                  الذكاء الاصطناعي يحلل ويولّد 🧠⚡
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  في لحظات، يتحول المستند إلى بودكاست حواري ناطق، خرائط ذهنية مفاهيمية، وريلز ملخصة وامتحانات مطبوعة.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-indigo-900">🎙️ بودكاست صوتي</span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-indigo-900">🖨️ امتحان مطبوع</span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-indigo-900">📱 ريلز 60 ثانية</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 hover:bg-slate-50/80 border-2 border-slate-200 hover:border-emerald-500 rounded-3xl space-y-4 transition-all duration-300 group shadow-xs hover:shadow-md relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg group-hover:scale-110 transition shadow-xs">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition">
                  ذاكر، استمع، واختبر نفسك 🎯
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  راجع ببطاقات لايتنر السريعة، اطبع الامتحانات الورقية بنماذج الإجابة، واحصل على تحليل مباشر لنقاط ضعفك.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-black text-emerald-900 flex items-center justify-between">
                <span>نتيجة إتقان 100% 🏆</span>
                <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-md">شهادة إنجاز</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🖨️ 3. PRINT-READY EXAM & MODEL ANSWER STUDIO (استوديو الامتحانات الورقية ونماذج الإجابة للطباعة) */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white border-b border-indigo-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-amber-400 bg-amber-950/80 border border-amber-500/40 px-3.5 py-1 rounded-full">
              ميزة حصرية للمعلم والطالب 🖨️
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              حوّل أي مذكرة إلى ورقة امتحان رسمية جاهزة للطباعة مع نموذج الإجابة
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl mx-auto">
              توليد فوري لورقة أسئلة بتنسيق وزاري معتمد A4، مع باركود وسلّم درجات ونموذج إجابة كامل للمعلم وولي الأمر.
            </p>
          </div>

          {/* Exam Subject Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sampleExams.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedExamIndex(idx);
                  setShowAnswerKey(false);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  selectedExamIndex === idx
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{ex.subject}</span>
              </button>
            ))}

            <button
              onClick={() => navigate('/marketplace')}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-teal-300 border border-teal-500/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ارفع مذكرتك لتوليد امتحان عليها ⚡</span>
            </button>
          </div>

          {/* THE LIVE A4 EXAM SHEET PREVIEW (Can be printed directly!) */}
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-slate-300 space-y-6 max-w-4xl mx-auto text-right select-none relative overflow-hidden" id="printable-exam-paper">
            
            {/* Top Action Bar (Hidden when printing) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>معاينة ورقة الأسئلة الرسمية (جاهزة للتنزيل والطباعة فوراً)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                    showAnswerKey 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswerKey ? 'إخفاء نموذج الإجابة' : 'عرض نموذج الإجابة وسلم الدرجات 📝'}</span>
                </button>

                <button
                  onClick={handlePrintExam}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة ورقة الامتحان (PDF) 🖨️</span>
                </button>
              </div>
            </div>

            {/* FORMAL MINISTERIAL EXAM HEADER */}
            <div className="border-b-2 border-slate-900 pb-4 space-y-3">
              <div className="flex items-start justify-between text-xs font-bold text-slate-800">
                <div className="space-y-0.5">
                  <div className="font-black text-slate-900">جمهورية مصر العربية • وزارة التربية والتعليم</div>
                  <div>إدارة التقويم التربوي والامتحانات الذكية</div>
                  <div className="text-teal-700 font-bold">منصة Osera AI الأكاديمية المعتمدة</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-sm font-black underline text-slate-950">ورقة الأسئلة الرسمية</div>
                  <div className="text-xs font-bold text-indigo-900">{activeExam.title}</div>
                </div>

                <div className="text-left space-y-0.5">
                  <div>زمن الإجابة: <span className="font-black">{activeExam.duration}</span></div>
                  <div>الدرجة الكلية: <span className="font-black">{activeExam.totalMarks} درجة</span></div>
                  <div>درجة النجاح: <span className="font-black">{activeExam.passingMarks} درجة</span></div>
                </div>
              </div>

              {/* Student Record Box */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-slate-400 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                <div>اسم الطالب: .......................................</div>
                <div>رقم الجلوس: ....................</div>
                <div>الفصل / اللجنة: ....................</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950 font-bold">
              <span className="block">تعليمات هامة للطلاب:</span>
              <ul className="list-disc pr-4 space-y-0.5 text-[11px] font-medium text-amber-900">
                {activeExam.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>

            {/* SECTION 1: MCQ QUESTIONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-xs font-black text-slate-900">
                <span>أولاً: أسئلة الاختيار من متعدد (ظلل دائرة الإجابة الصحيحة):</span>
                <span className="text-indigo-700 font-bold">12 درجة</span>
              </div>

              {activeExam.mcqQuestions.map((qItem, qIdx) => (
                <div key={qIdx} className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-start justify-between gap-2 text-xs font-bold text-slate-900">
                    <span>({qIdx + 1}) {qItem.q}</span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">[4 درجات]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-medium">
                    {qItem.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === qItem.correct;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border flex items-center justify-between ${
                            showAnswerKey && isCorrect
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span>({['أ', 'ب', 'ج', 'د'][oIdx]}) {opt}</span>
                          {showAnswerKey && isCorrect && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Model Answer Key Box */}
                  {showAnswerKey && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 animate-fade-in font-medium">
                      💡 <strong>نموذج الإجابة والتعليل:</strong> {qItem.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* SECTION 2: ESSAY QUESTION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-xs font-black text-slate-900">
                <span>ثانياً: السؤال المقالي / التطبيقي:</span>
                <span className="text-indigo-700 font-bold">8 درجات</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <p className="font-bold text-slate-900">{activeExam.essayQuestion.q}</p>
                <div className="h-14 border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center text-slate-400 text-[11px]">
                  (مساحة مخصصة لإجابة الطالب)
                </div>

                {showAnswerKey && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 animate-fade-in font-medium">
                    🎯 <strong>سلم التصحيح والحل النموذجي:</strong> {activeExam.essayQuestion.modelAnswer}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 🍱 4. BENTO GRID OF SUPER FEATURES (شبكة الميزات الخارقة العصرية) */}
      <section className="py-16 sm:py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-teal-400 bg-teal-950/80 border border-teal-500/30 px-3.5 py-1 rounded-full">
              قدرات استثنائية (Super Powers)
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              أدوات تفاعلية صُممت لتنقلك من الحفظ إلى الإتقان
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              استبدلنا الطرق التقليدية بنظام تعليمي متكامل يعتمد على الحوار الصوتي، البصريات الذكية، والمحاكاة.
            </p>
          </div>

          {/* THE BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* 1. HERO BENTO CARD: DUAL SPEAKER PODCAST (8 Cols) */}
            <div className="md:col-span-8 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/30">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>الميزة الأقوى: بودكاست كريم وفرح</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  البودكاست التعليمي الحواري المزدوج (Dual-Speaker AI)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-xl">
                  توقف عن قراءة المذكرات الصامتة! استمع لشرح ممتع بين المعلمة الذكية وطالب يطرح نفس الأسئلة التي تدور في ذهنك، بنطق لغوي سليم بنسبة 100% وأصوات نقية وفائقة الطبيعية.
                </p>
              </div>

              {/* Mini Audio Preview Controls */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
                    🎧
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">عَيِّنَةٌ صَوْتِيَّةٌ حَيَّةٌ مَسْمُوعَةٌ</span>
                    <span className="text-[10px] text-teal-300 font-bold">حِوَارُ كَرِيمٍ وَفَرَح: شَرْحُ مُمَيِّزَاتِ المَنَصَّةِ وَالامْتِحَانَاتِ المَطْبُوعَةِ</span>
                  </div>
                </div>

                <button
                  onClick={handleToggleHeroPlay}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isHeroPlaying ? 'إيقاف الصوت ⏸️' : 'استمع للحوار الآن ▶'}</span>
                </button>
              </div>
            </div>

            {/* 2. TALL BENTO CARD: 60s TIKTOK REELS (4 Cols - SILENT & DIRECT NAVIGATION) */}
            <div 
              onClick={() => navigate('/reels')}
              className="md:col-span-4 bg-gradient-to-b from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl text-center group cursor-pointer hover:border-purple-400 transition"
              title="انقر للانتقال مباشرة لصفحة الريلز التعليمية"
            >
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/30 inline-block">
                  📱 ريلز المذاكرة (60s)
                </span>
                <h4 className="text-lg font-black text-white">ملخصات سريعة بنظام تيك توك</h4>
                <p className="text-xs text-slate-400 font-medium">
                  كبسولات فيديو رأسية مدعومة بالأفاتار والبطاقات المتحركة لتثبيت أصعب المفاهيم في دقيقة.
                </p>
              </div>

              {/* Phone Mockup Frame - Silent Animated Visual Reel */}
              <div className="w-40 h-56 mx-auto bg-slate-950 border-4 border-slate-800 rounded-3xl p-3 shadow-2xl flex flex-col justify-between relative overflow-hidden group-hover:border-purple-500/50 transition">
                <div className="flex items-center justify-between text-[9px] text-purple-300 font-bold">
                  <span>9:16 HD</span>
                  <span className="flex items-center gap-1 bg-purple-950/80 px-1.5 py-0.5 rounded-md border border-purple-800">🔇 صامت</span>
                </div>
                <div className="space-y-1.5 text-center my-auto">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center mx-auto text-base shadow-lg animate-pulse">
                    🦉
                  </div>
                  <span className="text-[11px] font-black text-white block">مُلَخَّصُ المَفَاهِيمِ السَّرِيعَةِ</span>
                  <span className="text-[9px] text-teal-300 font-black bg-white/10 px-2.5 py-1 rounded-full inline-flex items-center gap-1 hover:bg-white/20 transition">
                    <span>انتقل لصفحة الريلز</span>
                    <span>◀</span>
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-teal-400 rounded-full animate-pulse" />
                  <span className="text-[8px] text-slate-400 block font-medium">انقر للمشاهدة في صفحة الريلز</span>
                </div>
              </div>
            </div>

            {/* 3. MEDIUM BENTO CARD: INTERACTIVE MIND MAP (4 Cols) */}
            <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 rounded-3xl p-6 space-y-3 shadow-xl transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                🗺️
              </div>
              <h4 className="text-base font-black text-white">الخرائط الذهنية التفاعلية</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                تصفح شجرة المنهج وروابط الدروس بصرياً مع عقد تفاعلية تتوهج وتتفرع لتسهيل استرجاع المعلومات ليلة الامتحان.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-teal-400 font-bold">
                <span>تفريعات بصرية لكل وحدة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 4. SMALL BENTO CARD: LEITNER FLASHCARDS 3D (4 Cols) */}
            <div 
              onClick={() => setIsBentoFlipped(!isBentoFlipped)}
              className="md:col-span-4 bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 space-y-3 shadow-xl transition cursor-pointer select-none"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  🗂️
                </div>
                <span className="text-[10px] font-bold text-slate-400">انقر للقلب 🔄</span>
              </div>
              <h4 className="text-base font-black text-white">صناديق لايتنر (Flashcards)</h4>
              
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all duration-300 ${
                isBentoFlipped 
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200' 
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                {isBentoFlipped ? (
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 block mb-0.5">💡 ظهر البطاقة (الإجابة):</span>
                    <span>هو مقاومة الجسم لتغيير حالته الحركية من السكون أو الحركة.</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-teal-400 block mb-0.5">❓ وجه البطاقة (السؤال):</span>
                    <span>ما هو تعريف "القصور الذاتي" في الفيزياء؟</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. SMALL BENTO CARD: SMART EXAM GRADER (4 Cols) */}
            <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 space-y-3 shadow-xl transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                🎯
              </div>
              <h4 className="text-base font-black text-white">المصحح الذكي للامتحانات</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                تحليل فوري لإجاباتك وفق مستويات بلوم المعرفية مع توضيح أسباب الخطأ ونقاط الضعف لتفاديها فوراً.
              </p>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">نسبة الإتقان الأكاديمي:</span>
                <span className="text-emerald-400 font-black">94% ممتاز (A+)</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 👥 5. WHO IS THIS PLATFORM FOR? */}
      <section className="py-16 sm:py-20 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200 px-3.5 py-1 rounded-full">
              تجربة مخصصة لكل فئة
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              صُممت المنصة لتلائم احتياجاتك بدقة
            </h2>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
              <button
                onClick={() => setActiveAudienceTab('student')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                  activeAudienceTab === 'student'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👨‍🎓 للطلاب</span>
              </button>

              <button
                onClick={() => setActiveAudienceTab('teacher')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                  activeAudienceTab === 'teacher'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👨‍🏫 للمعلمين والمشرفين</span>
              </button>

              <button
                onClick={() => setActiveAudienceTab('learner')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                  activeAudienceTab === 'learner'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>💼 لتطوير المهارات الحرة</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display Card */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 animate-fade-in text-right">
            {activeAudienceTab === 'student' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xl">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">ودّع ملل المذاكرة وتشتت المذكرات الورقية</h3>
                    <p className="text-xs sm:text-sm text-slate-500">منهجك الدراسي بأسلوب يناسب عصر السرعة والتركيز</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-bold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>اسمع مذكرتك كحلقة بودكاست أثناء المواصلات أو الاسترخاء.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>اطبع امتحانات ورقية رسمية وتدرب عليها قبل الامتحان الفعلي.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>راجع الفصول في 60 ثانية عبر كبسولات الريلز السريعة.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>احصل على شهادات إتقان ونقاط تقدم تشجعك على الاستمرار.</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>استكشف مقررات مرحلتك الدراسية 📚</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeAudienceTab === 'teacher' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xl">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">حوّل مذكراتك إلى منصة تعليمية ذكية تحمل اسمك</h3>
                    <p className="text-xs sm:text-sm text-slate-500">أدوات متطورة للمعلم العصري بدون أي تعقيد برمجي</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-bold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>ارفع ملف مذكرتك، وسيقوم الـ AI بتوليد البودكاست وبنك الأسئلة تلقائياً.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>أنشئ امتحانات مخصصة موقوتة واطبع أوراق الأسئلة الرسمية A4 فوراً.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>احمِ محتواك بعلامات مائية أمنية ذكية تمنع تسريب الملازم.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>بيع مذكراتك للطلاب أو وفّرها مجاناً مع لوحة متابعة للدرجات.</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/instructor')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>لوحة المعلم وإدارة المقررات 🚀</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeAudienceTab === 'learner' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xl">
                    💼
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">اكتسب مهارات سوق العمل في نصف الوقت المعتاد</h3>
                    <p className="text-xs sm:text-sm text-slate-500">كورسات عملية مركزة في البرمجة، اللغات، والذكاء الاصطناعي</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-bold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>محتوى مركز ومباشر بدون حشو أو إطالة غير مفيدة.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>مختبر تطبيقي وأمثلة واقعية لاختبار البرمجة والمهارات الحية.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ملخصات صوتية قابلة للاستماع في أي وقت وأي مكان.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>مسارات معتمدة تؤهلك لبناء مشاريعك الحقيقية.</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/marketplace?category=skills')}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>استكشف كورسات المهارات الحرة 💡</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 🧪 6. TRY IT YOURSELF (ركن التجربة الفورية مع الصوت والتفاعل الحي) */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full">
              تجربة حية فورية
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              جرّب بنفسك الآن: اكتب أي درس أو مفهوم صعب
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              شاهد كيف يفكك الذكاء الاصطناعي أصعب القواعد إلى حوار مسموع، قاعدة ذهبية، وسؤال تفاعلي في ثوانٍ!
            </p>
          </div>

          {/* Interactive Search Box */}
          <div className="bg-slate-50 border-2 border-indigo-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={demoQuery}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunDemo(demoQuery);
                  }}
                  placeholder="مثال: قانون نيوتن الأول، إعراب كان وأخواتها، الانقسام الميتوزي..."
                  className="w-full pr-10 pl-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <Brain className="w-4 h-4 text-indigo-600 absolute top-3.5 right-3.5 pointer-events-none" />
              </div>

              <button
                onClick={() => handleRunDemo(demoQuery || 'قانون نيوتن الأول')}
                disabled={isDemoGenerating}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-2"
              >
                {isDemoGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>جاري التوليد...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>اشرحه واسمعه في 10 ثوانٍ ⚡</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-slate-500">
              <span className="text-[11px]">أمثلة شائعة:</span>
              {sampleDemoSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunDemo(item.title)}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 transition cursor-pointer text-[11px]"
                >
                  {item.title} ({item.subject})
                </button>
              ))}
            </div>
          </div>

          {/* DEMO LIVE RESULT DISPLAY CARD */}
          {demoActiveResult && (
            <div className="bg-slate-900 text-white border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-fade-in text-right">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white">{demoActiveResult.concept}</h4>
                    <span className="text-[10px] text-teal-400">توليد لحظي بالذكاء الاصطناعي التفاعلي</span>
                  </div>
                </div>

                <button
                  onClick={() => playSpeech(`${demoActiveResult.karimQuestion} ${demoActiveResult.farahAnswer} ${demoActiveResult.goldenRule}`, 'farah')}
                  className="px-3.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl text-xs font-bold border border-teal-500/40 flex items-center gap-1.5 transition cursor-pointer"
                  title="استمع للشرح صوتياً"
                >
                  <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>استمع للشرح صوتياً 🔊</span>
                </button>
              </div>

              {/* Karim & Farah Dialogue */}
              <div className="space-y-3">
                <div 
                  onClick={() => playSpeech(demoActiveResult.karimQuestion, 'karim')}
                  className="p-3 bg-cyan-950/70 hover:bg-cyan-950 border border-cyan-500/40 rounded-2xl text-xs space-y-1 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-cyan-300 font-black">
                    <span>👦 كريم:</span>
                    <span className="text-[10px] text-cyan-400/80">انقر للاستماع 🔊</span>
                  </div>
                  <p className="text-slate-200">{demoActiveResult.karimQuestion}</p>
                </div>

                <div 
                  onClick={() => playSpeech(demoActiveResult.farahAnswer, 'farah')}
                  className="p-3 bg-purple-950/70 hover:bg-purple-950 border border-purple-500/40 rounded-2xl text-xs space-y-1 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-purple-300 font-black">
                    <span>👩‍🏫 أ. فرح:</span>
                    <span className="text-[10px] text-purple-400/80">انقر للاستماع 🔊</span>
                  </div>
                  <p className="text-slate-200">{demoActiveResult.farahAnswer}</p>
                </div>
              </div>

              {/* Golden Rule Card */}
              <div className="p-3.5 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 rounded-2xl text-xs text-amber-200 font-bold leading-relaxed">
                {demoActiveResult.goldenRule}
              </div>

              {/* Interactive Mini-Quiz */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>اختبر فهمك الفوري: {demoActiveResult.quickQuestion}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoActiveResult.options.map((opt, optIdx) => {
                    const isSelected = demoSelectedOption === optIdx;
                    const isCorrect = optIdx === demoActiveResult.correctIndex;

                    let btnClass = "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850";
                    if (demoSelectedOption !== null) {
                      if (isCorrect) {
                        btnClass = "bg-emerald-950 border-emerald-500 text-emerald-200 font-black";
                      } else if (isSelected) {
                        btnClass = "bg-rose-950 border-rose-500 text-rose-200 font-black";
                      } else {
                        btnClass = "bg-slate-900 border-slate-800 text-slate-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          setDemoSelectedOption(optIdx);
                          if (isCorrect) {
                            playSpeech("أحسنت! إجابة صحيحة وممتازة.", 'farah');
                          } else {
                            playSpeech("إجابة غير دقيقة، راجع التفسير المعرفي.", 'farah');
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs text-right transition cursor-pointer ${btnClass}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {demoSelectedOption !== null && (
                  <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-200 animate-fade-in font-medium">
                    💡 <strong>التفسير:</strong> {demoActiveResult.explanation}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </section>

      {/* 🌟 7. SOCIAL PROOF & FINAL CALL TO ACTION */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-teal-400">50+</span>
              <span className="text-xs text-slate-400 font-bold block">مقرراً ومذكرة ذكية</span>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-indigo-400">10,000+</span>
              <span className="text-xs text-slate-400 font-bold block">سؤال بنماذج الإجابة</span>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-purple-400">98%</span>
              <span className="text-xs text-slate-400 font-bold block">نسبة رضا الطلاب والتحصيل</span>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400">100%</span>
              <span className="text-xs text-slate-400 font-bold block">توافق مع المعايير الوزارية</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3 text-right backdrop-blur-md">
              <div className="flex items-center gap-1 text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                "حوار كريم وفرح غير طريقتي في المذاكرة تماماً! بقيت أسمع الدرس وأنا في الطريق وأدخل الامتحان حاسس إني راجعت المنهج 3 مرات."
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">س</span>
                <div>
                  <span className="text-xs font-black text-white block">سارة محمود</span>
                  <span className="text-[10px] text-teal-400">طالبة ثانوية عامة</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3 text-right backdrop-blur-md">
              <div className="flex items-center gap-1 text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                "طباعة الامتحانات الورقية بنماذج الإجابة وسلّم الدرجات وفّرت عليا ساعات من كتابة وتنسيق الاختبارات في Word."
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">أ</span>
                <div>
                  <span className="text-xs font-black text-white block">أ. أحمد الشناوي</span>
                  <span className="text-[10px] text-indigo-400">معلم لغة عربية وخبير تربوي</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3 text-right backdrop-blur-md">
              <div className="flex items-center gap-1 text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                "نظام عرض الأسئلة تحت بعضها والتفسير الفوري للذكاء الاصطناعي وفّر عليا وقت الدروس الخصوصية والبحث الطويل في الكتب."
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">ع</span>
                <div>
                  <span className="text-xs font-black text-white block">عمر طارق</span>
                  <span className="text-[10px] text-purple-400">طالب كلية حاسبات ومعلومات</span>
                </div>
              </div>
            </div>
          </div>

          {/* FINAL HIGH-IMPACT CTA BANNER */}
          <div className="p-8 sm:p-12 bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                جاهز لتغيير طريقة مذاكرتك إلى الأبد؟
              </h2>
              <p className="text-xs sm:text-base text-teal-100 font-medium">
                انضم لآلاف الطلاب والمعلمين الآن، وابدأ تجربتك المجانية الأولى في ثوانٍ معدودة.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate('/marketplace')}
                className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>ابدأ المذاكرة الذكية مجاناً 🚀</span>
                <ArrowLeft className="w-4 h-4 text-teal-300" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 📱 MOBILE STICKY BOTTOM QUICK CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-2.5 flex items-center justify-between shadow-2xl print:hidden" dir={dir}>
        <div className="pr-1">
          <span className="text-xs font-black text-white block leading-tight">جاهز تبدأ المذاكرة؟</span>
          <span className="text-[10px] text-teal-400 font-bold">جرّب المقررات والامتحانات مجاناً</span>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
        >
          ابدأ الآن 🚀
        </button>
      </div>

      {/* 🎬 1-MINUTE VIDEO WALKTHROUGH MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir={dir}>
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Play className="w-5 h-5 fill-current" />
                <h4 className="font-black text-sm text-white">كيف تعمل المنصة في دقيقة واحدة (Video Walkthrough)</h4>
              </div>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h5 className="font-black text-base text-white">شاهد المنظومة الذكية كاملة</h5>
                <p className="text-xs text-slate-400 max-w-md">
                  من رفع ملف الـ PDF إلى استوديو البودكاست الحي، توليد بنوك الأسئلة، وطباعة الامتحانات الرسمية بنماذج الإجابة.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsVideoModalOpen(false);
                  navigate('/marketplace');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg transition hover:scale-105"
              >
                جرّب بنفسك في المتجر الآن 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 60s REELS INTERACTIVE VIEWER MODAL */}
      {isReelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" dir={dir}>
          <div className="bg-slate-950 border-2 border-purple-500/50 rounded-3xl max-w-sm w-full p-4 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-400" />
                <span>ريلز المذاكرة السريعة (60s Reel)</span>
              </span>
              <button onClick={() => { setIsReelModalOpen(false); stopAllSpeech(); }} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-96 bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 rounded-2xl p-4 flex flex-col justify-between border border-purple-500/30 text-center relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-purple-300">
                <span className="bg-purple-900/60 px-2 py-0.5 rounded-full">الفيزياء • نيوتن</span>
                <span className="font-mono">00:45</span>
              </div>

              <div className="space-y-3 my-auto">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 text-white flex items-center justify-center mx-auto text-2xl shadow-lg">
                  🦉
                </div>
                <h4 className="text-sm font-black text-white">القصور الذاتي وقوانين الحركة</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "كل جسم يقاوم تغيير حالته! تذكر دائماً أن الكتلة الأكبر تعني قصوراً ذاتياً أكبر وصعوبة في تغيير الحركة."
                </p>
                <button
                  onClick={() => playSpeech("كل جسم يقاوم تغيير حالته! تذكر دائماً أن الكتلة الأكبر تعني قصوراً ذاتياً أكبر وصعوبة في إيقافه.", 'farah')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>اسمع شرح الكبسولة 🔊</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-bold">
                اسحب للأعلى لتصفح المزيد من الريلز ⬆️
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default LandingPageView;
