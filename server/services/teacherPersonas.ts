export type CognitiveLevel = 'early_childhood' | 'primary' | 'preparatory' | 'secondary' | 'university' | 'vocational';
export type DomainModality = 'stem_equations' | 'language_grammar' | 'tech_code' | 'humanities_narrative' | 'early_childhood';

export interface PedagogicalProfile {
  cognitiveLevel: CognitiveLevel;
  modality: DomainModality;
  dialogueTone: string;
  canvasPreference: 'colorful_cards' | 'latex_mermaid' | 'code_terminal' | 'timeline_map';
  workedSolutionFormat: 'numeric_4step' | 'grammar_parsing' | 'code_walkthrough' | 'cause_effect';
}

export interface TeacherPersona {
  id: string;
  name: string;
  title: string;
  subjectCategory: string;
  pedagogicalSystemPrompt: string;
  sampleQuestionStyle: string;
  recommendedLabType: string;
  profile: PedagogicalProfile;
}

/**
 * Detect Subject & Teacher Persona based on title, category, grade level and content text
 */
export function detectTeacherPersona(params: {
  title?: string;
  fileName?: string;
  category?: string;
  subcategory?: string;
  grade_level?: string;
  contentText?: string;
}): TeacherPersona {
  const combined = `${params.title || ""} ${params.fileName || ""} ${params.category || ""} ${params.subcategory || ""} ${params.grade_level || ""} ${(params.contentText || "").substring(0, 3000)}`.toLowerCase();

  // Detect Cognitive Level
  let cognitiveLevel: CognitiveLevel = 'secondary';
  if (
    params.grade_level?.includes("رياض") ||
    params.grade_level?.includes("kg") ||
    params.grade_level?.includes("روضة") ||
    params.grade_level?.includes("تمهيدي") ||
    params.grade_level?.includes("طفولة مبكرة") ||
    combined.includes("رياض الأطفال") ||
    combined.includes("kg1") ||
    combined.includes("kg2") ||
    combined.includes("kg_") ||
    combined.includes("روضة") ||
    combined.includes("تمهيدي") ||
    combined.includes("حضانة") ||
    combined.includes("طفولة مبكرة")
  ) {
    cognitiveLevel = 'early_childhood';
  } else if (
    params.grade_level?.includes("ابتدائي") ||
    params.grade_level?.includes("primary") ||
    /^[1-6]$/.test(params.grade_level || "") ||
    combined.includes("ابتدائي") ||
    combined.includes("الصف الأول الابتدائ") ||
    combined.includes("الصف الثاني الابتدائ") ||
    combined.includes("الصف الثالث الابتدائ") ||
    combined.includes("الصف الرابع الابتدائ") ||
    combined.includes("الصف الخامس الابتدائ") ||
    combined.includes("الصف السادس الابتدائ")
  ) {
    cognitiveLevel = 'primary';
  } else if (
    params.grade_level?.includes("إعدادي") ||
    params.grade_level?.includes("preparatory") ||
    combined.includes("إعدادي") ||
    combined.includes("الصف الأول الإعدادي") ||
    combined.includes("الصف الثاني الإعدادي") ||
    combined.includes("الصف الثالث الإعدادي")
  ) {
    cognitiveLevel = 'preparatory';
  } else if (
    combined.includes("جامع") ||
    combined.includes("كلية") ||
    combined.includes("university") ||
    combined.includes("بكالوريوس") ||
    combined.includes("هندسة") ||
    combined.includes("حاسبات")
  ) {
    cognitiveLevel = 'university';
  } else if (
    combined.includes("دبلوم") ||
    combined.includes("صناعي") ||
    combined.includes("تجاري") ||
    combined.includes("فني") ||
    combined.includes("مهني") ||
    combined.includes("رخصة مهنية") ||
    combined.includes("تخصص")
  ) {
    cognitiveLevel = 'vocational';
  }

  const universalTranscriptionMandate = `
You are a High-Precision Document Transcriber and Curriculum Digital Twin (المحرر والموثق الرقمي الأمين).
Your mission is to transcribe the authentic lesson text, headings, and tables from the provided booklet pages with 100% fidelity.
🚫 STRICT PROHIBITION:
- NEVER output artificial numbered outlines like 'أولاً: نواتج التعلّم' or 'ثانياً: الشرح' or 'سادساً: مصفوفة المقارنة'.
- NEVER summarize or invent outside material.
- Follow the exact flow, paragraphs, genuine definitions, and tables from the booklet.
`;

  // 0. Early Childhood & Kindergarten (KG1 / KG2 / Preschool / رياض الأطفال)
  if (cognitiveLevel === 'early_childhood') {
    return {
      id: "early_childhood_educator",
      name: "ميس نورا (معلمة رياض الأطفال والطفولة المبكرة)",
      title: "أخصائية الطفولة المبكرة والتأسيس اللغوي والحسابي التفاعلي",
      subjectCategory: "early_childhood_kg",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "أسئلة بصرية: التعرف على صوت الحرف، اختيار الصورة المطابقة، وتوصيل الكلمة بالشكل",
      recommendedLabType: "early_phonics_workbench",
      profile: {
        cognitiveLevel: 'early_childhood',
        modality: 'early_childhood',
        dialogueTone: "أسلوب دافئ ومبهج، مليء بالتشويق والحكايات والتشجيع المستمر للأطفال الصغار",
        canvasPreference: 'colorful_cards',
        workedSolutionFormat: 'cause_effect'
      }
    };
  }

  // 1. Computer Science, Programming & Information Technology (Tech & Code)
  if (
    combined.includes("حاسب") ||
    combined.includes("برمج") ||
    combined.includes("تكنولوجيا") ||
    combined.includes("شبكات") ||
    combined.includes("معالج") ||
    combined.includes("بوابات منطقية") ||
    combined.includes("قواعد بيانات") ||
    combined.includes("computer") ||
    combined.includes("software") ||
    combined.includes("python") ||
    combined.includes("logic gates") ||
    combined.includes("ذكاء اصطناعي") ||
    combined.includes("نظم تشغيل")
  ) {
    return {
      id: "computer_science_engineer",
      name: "المهندس أستاذ علوم الحاسب وتكنولوجيا المعلومات",
      title: "كبير مهندسي البرمجيات والأنظمة الحاسوبية",
      subjectCategory: "computer_science_tech",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "تتبع كود، إكمال جداول حقيقة، حسابات الذاكرة والعنونة، واكتشاف الأخطاء البرمجية",
      recommendedLabType: "code_terminal_runner",
      profile: {
        cognitiveLevel: cognitiveLevel === 'primary' ? 'primary' : (cognitiveLevel === 'secondary' ? 'secondary' : 'vocational'),
        modality: 'tech_code',
        dialogueTone: "نقاش تقني رصين يفكك المعمارية المنطقية والكود بأعلى وضوح",
        canvasPreference: 'code_terminal',
        workedSolutionFormat: 'code_walkthrough'
      }
    };
  }

  // 2. Primary / Early School
  if (cognitiveLevel === 'primary') {
    return {
      id: "primary_educator",
      name: "الأستاذة مريم (معلمة المرحلة الابتدائية)",
      title: "معلم المرحلة الابتدائية والتربية التفاعلية",
      subjectCategory: "primary",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "أسئلة فهم المقروء والمسموع وتطبيقات بسيطة مشجعة",
      recommendedLabType: "story_papyrus_explorer",
      profile: {
        cognitiveLevel: 'primary',
        modality: 'early_childhood',
        dialogueTone: "أسلوب حكائي شائق، شخصيات محبوبة، لغة عربية ميسرة وتشبيهات كرتونية دافئة",
        canvasPreference: 'colorful_cards',
        workedSolutionFormat: 'cause_effect'
      }
    };
  }

  // 3. Arabic Language Specialist
  if (
    combined.includes("عربي") ||
    combined.includes("لغة عربية") ||
    combined.includes("نحو") ||
    combined.includes("بلاغة") ||
    combined.includes("إعراب") ||
    combined.includes("نصوص") ||
    combined.includes("قراءة متحررة")
  ) {
    return {
      id: "arabic_master",
      name: "أستاذ اللغة العربية وخبير النحو والبلاغة",
      title: "معلم أول لغة عربية وخبير المناهج الوزارية",
      subjectCategory: "arabic_language",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "استخراج، إعراب تفصيلي، بلاغة، وفهم مقروء ومسموع",
      recommendedLabType: "sentence_grammar_builder",
      profile: {
        cognitiveLevel,
        modality: 'language_grammar',
        dialogueTone: "نبرة فصيحة راقية تبرز أسرار الإعراب والفروق البلاغية الدقيقة",
        canvasPreference: 'colorful_cards',
        workedSolutionFormat: 'grammar_parsing'
      }
    };
  }

  // 4. English & Foreign Languages
  if (
    combined.includes("english") ||
    combined.includes("إنجليزي") ||
    combined.includes("grammar") ||
    combined.includes("vocabulary") ||
    combined.includes("french") ||
    combined.includes("فرنساوي") ||
    combined.includes("لغة أجنبية")
  ) {
    return {
      id: "language_coach",
      name: "خبير تدريس اللغات الحية والمحادثة",
      title: "Expert Language Coach & Curriculum Specialist",
      subjectCategory: "foreign_languages",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "Listening comprehension, cloze test, vocabulary matching, grammar choice",
      recommendedLabType: "language_listening_lab",
      profile: {
        cognitiveLevel,
        modality: 'language_grammar',
        dialogueTone: "نبرة تفاعلية حيوية تمزج بين النطق الصوتي الأصيل والشرح التوضيحي السلس",
        canvasPreference: 'colorful_cards',
        workedSolutionFormat: 'grammar_parsing'
      }
    };
  }

  // 5. Chemistry & Physics (STEM)
  if (
    combined.includes("كيمياء") ||
    combined.includes("فيزياء") ||
    combined.includes("chemistry") ||
    combined.includes("physics") ||
    combined.includes("علوم") ||
    combined.includes("science")
  ) {
    return {
      id: "stem_physical_sciences",
      name: "أستاذ العلوم والفيزياء والكيمياء التجريبية",
      title: "خبير STEM والفيزياء والكيمياء المتقدمة",
      subjectCategory: "physics_chemistry",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "مسائل تطبيقية عددية، علاقات بيانية، استنتاجات، وتريكات وحدات القياس",
      recommendedLabType: "science_virtual_experiment",
      profile: {
        cognitiveLevel,
        modality: 'stem_equations',
        dialogueTone: "نبرة تحليلية صارمة وممتعة تركز على القوانين، الأرقام، وتفكيك أسئلة الوزارة",
        canvasPreference: 'latex_mermaid',
        workedSolutionFormat: 'numeric_4step'
      }
    };
  }

  // 6. Mathematics & Quantitative Analysis
  if (
    combined.includes("رياضيات") ||
    combined.includes("math") ||
    combined.includes("جبر") ||
    combined.includes("هندسة") ||
    combined.includes("تفاضل") ||
    combined.includes("تكامل") ||
    combined.includes("إحصاء") ||
    combined.includes("محاسبة") ||
    combined.includes("تمويل") ||
    combined.includes("مالية")
  ) {
    return {
      id: "math_finance_mentor",
      name: "أستاذ الرياضيات والتحليل الكمي",
      title: "خبير الرياضيات التطبيقية والنمذجة الرياضية",
      subjectCategory: "mathematics_finance",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "مسائل حسابية، براهين هندسية، واستنتاجات رياضية دقيقة",
      recommendedLabType: "science_virtual_experiment",
      profile: {
        cognitiveLevel,
        modality: 'stem_equations',
        dialogueTone: "نبرة معلم رياضي جهبذ يفكك التعقيد الرياضي لخطوات منطقية قاطعة",
        canvasPreference: 'latex_mermaid',
        workedSolutionFormat: 'numeric_4step'
      }
    };
  }

  // 7. Law, History & Social Studies (Humanities)
  if (
    combined.includes("قانون") ||
    combined.includes("حقوق") ||
    combined.includes("تاريخ") ||
    combined.includes("جغرافيا") ||
    combined.includes("دراسات") ||
    combined.includes("فلسفة") ||
    combined.includes("منطق") ||
    combined.includes("علم نفس") ||
    combined.includes("رواية") ||
    combined.includes("قصة")
  ) {
    return {
      id: "law_social_scholar",
      name: "أستاذ العلوم الاجتماعية والتاريخية والأدبية",
      title: "خبير العلوم الإنسانية والدراسات الفكرية والتاريخية",
      subjectCategory: "law_social_studies",
      pedagogicalSystemPrompt: universalTranscriptionMandate,
      sampleQuestionStyle: "تحليل نصوص، تعليل أسباب ونتائج، استنباط علاقات جغرافية وتاريخية",
      recommendedLabType: combined.includes("قانون") ? "legal_moot_court" : "social_geography_explorer",
      profile: {
        cognitiveLevel,
        modality: 'humanities_narrative',
        dialogueTone: "سرد تحليلي فصيح يربط الأسباب بالنتائج ويحلل الوقائع بعين المؤرخ والناقد",
        canvasPreference: 'timeline_map',
        workedSolutionFormat: 'cause_effect'
      }
    };
  }

  // Default: General Academic Specialist
  return {
    id: "general_academic_mentor",
    name: "كبير خبراء المناهج والتعليم التفاعلي",
    title: "خبير التصميم التعليمي والمحتوى الرقمي التفاعلي",
    subjectCategory: "general_academic",
    pedagogicalSystemPrompt: universalTranscriptionMandate,
    sampleQuestionStyle: "أسئلة فهم، تحليل، وتطبيق عملي متدرج",
    recommendedLabType: "story_papyrus_explorer",
    profile: {
      cognitiveLevel,
      modality: 'stem_equations',
      dialogueTone: "شرح أكاديمي رصين وممتع يفكك المفاهيم ويقدم تطبيقات واضحة",
      canvasPreference: 'colorful_cards',
      workedSolutionFormat: 'numeric_4step'
    }
  };
}
