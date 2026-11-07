/**
 * 🔬 ARABIC STEM LEXICON & PHONETIC TRANSPILER
 * High-Precision Phonetic Transpilation of Mathematics, Chemistry, Physics, and CS terms into Fluent Spoken Arabic
 * For TTS engines (EdgeTTS, Web Speech API, Google Cloud Chirp/Neural2).
 */

export interface STEMLexiconRule {
  pattern: RegExp;
  replacement: string | ((substring: string, ...args: any[]) => string);
}

/**
 * 🧪 Chemistry & Molecular Formulas Lexicon
 * Transpiles common chemical symbols, compounds, reactions and ions into authentic spoken Arabic
 */
const CHEMISTRY_RULES: STEMLexiconRule[] = [
  // Common Compounds
  { pattern: /\\text\{H\}_?2\\text\{O\}|H_?2O\b/g, replacement: " جُزَيْءُ الْمَاءِ " },
  { pattern: /\\text\{CO\}_?2|CO_?2\b/g, replacement: " ثَانِي أُكْسِيدِ الْكَرْبُونِ " },
  { pattern: /\\text\{CO\}|(?<![a-zA-Z])CO(?![a-zA-Z0-9])/g, replacement: " أَوَّلُ أُكْسِيدِ الْكَرْبُونِ " },
  { pattern: /\\text\{NaCl\}|NaCl\b/g, replacement: " كُلُورِيدُ الصُّودْيُومِ مِلْحُ الطَّعَامِ " },
  { pattern: /\\text\{CaCO\}_?3|CaCO_?3\b/g, replacement: " كَرْبُونَاتُ الْكَالْسِيُومِ " },
  { pattern: /\\text\{HCl\}|HCl\b/g, replacement: " حَمْضُ الْهِيدْرُوكْلُورِيكِ " },
  { pattern: /\\text\{H\}_?2\\text\{SO\}_?4|H_?2SO_?4\b/g, replacement: " حَمْضُ الْكَبْرِيتِيكِ " },
  { pattern: /\\text\{HNO\}_?3|HNO_?3\b/g, replacement: " حَمْضُ النِّيتْرِيكِ " },
  { pattern: /\\text\{NaOH\}|NaOH\b/g, replacement: " هِيدْرُوكْسِيدُ الصُّودْيُومِ الصُّودَا الْكَاوِيَةُ " },
  { pattern: /\\text\{KOH\}|KOH\b/g, replacement: " هِيدْرُوكْسِيدُ الْبُوتَاسْيُومِ " },
  { pattern: /\\text\{NH\}_?3|NH_?3\b/g, replacement: " غَازُ النَّشَادِرِ الأَمُونْيَا " },
  { pattern: /\\text\{CH\}_?4|CH_?4\b/g, replacement: " غَازُ الْمِيثَانِ " },
  { pattern: /\\text\{O\}_?2|O_?2\b/g, replacement: " جُزَيْءُ الأُكْسِجِينِ " },
  { pattern: /\\text\{N\}_?2|N_?2\b/g, replacement: " جُزَيْءُ النِّيتْرُوجِينِ " },
  { pattern: /\\text\{H\}_?2|H_?2\b/g, replacement: " جُزَيْءُ الْهِيدْرُوجِينِ " },
  { pattern: /\\text\{Cl\}_?2|Cl_?2\b/g, replacement: " جُزَيْءُ الْكُلُورِ " },
  { pattern: /\\text\{Fe\}|(?<![a-zA-Z])Fe(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الْحَدِيدِ " },
  { pattern: /\\text\{Cu\}|(?<![a-zA-Z])Cu(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ النُّحَاسِ " },
  { pattern: /\\text\{Al\}|(?<![a-zA-Z])Al(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الأَلُومِنْيُومِ " },
  { pattern: /\\text\{Au\}|(?<![a-zA-Z])Au(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الذَّهَبِ " },
  { pattern: /\\text\{Ag\}|(?<![a-zA-Z])Ag(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الْفِضَّةِ " },
  { pattern: /\\text\{Mg\}|(?<![a-zA-Z])Mg(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الْمَاغْنِسْيُومِ " },
  { pattern: /\\text\{Ca\}|(?<![a-zA-Z])Ca(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الْكَالْسِيُومِ " },
  { pattern: /\\text\{Na\}|(?<![a-zA-Z])Na(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الصُّودْيُومِ " },
  { pattern: /\\text\{K\}|(?<![a-zA-Z])K(?![a-zA-Z0-9])/g, replacement: " عُنْصُرُ الْبُوتَاسْيُومِ " },

  // Ions & Radicals
  { pattern: /\\text\{Na\}\^?\+|Na\^\+/g, replacement: " أَيُونُ الصُّودْيُومِ الْمُوجَبِ " },
  { pattern: /\\text\{Cl\}\^?-|Cl\^-/g, replacement: " أَيُونُ الْكُلُورِيدِ السَّالِبِ " },
  { pattern: /\\text\{H\}\^?\+|H\^\+/g, replacement: " أَيُونُ الْهِيدْرُوجِينِ الْمُوجَبِ " },
  { pattern: /\\text\{OH\}\^?-|OH\^-/g, replacement: " مَجْمُوعَةُ الْهِيدْرُوكْسِيدِ السَّالِبَةُ " },
  { pattern: /\\text\{SO\}_?4\^?\{?2-?\}?|SO_?4\^\{?2-?\}?/g, replacement: " مَجْمُوعَةُ الْكَبْرِيتَاتِ الثُّنَائِيَّةِ السَّالِبَةُ " },

  // Reaction arrows & States
  { pattern: /\\rightarrow|->|→/g, replacement: " يَنْتُجُ عَنْهُ " },
  { pattern: /\\rightleftharpoons|⇄/g, replacement: " تَفَاعُلٌ مُنْعَكِسٌ مُتَّزِنٌ " },
  { pattern: /\(s\)/g, replacement: " فِي الْحَالَةِ الصَّلْبَةِ " },
  { pattern: /\(l\)/g, replacement: " فِي الْحَالَةِ السَّائِلَةِ " },
  { pattern: /\(g\)/g, replacement: " فِي الْحَالَةِ الْغَازِيَّةِ " },
  { pattern: /\(aq\)/g, replacement: " مَحْلُولٌ مَائِيٌّ " },
  { pattern: /\\Delta\s*(?:H)?|(?<=[+\-=→\s])Δ(?=[\s\w]|$)/g, replacement: " حَرَارَةُ التَّفَاعُلِ دِلْتَا " }
];

/**
 * 📐 Advanced Mathematics & LaTeX Phonetic Rules
 */
const MATHEMATICS_RULES: STEMLexiconRule[] = [
  // Matrices
  {
    pattern: /\\begin\{(?:b|p|v|V)?matrix\}([\s\S]*?)\\end\{(?:b|p|v|V)?matrix\}/gi,
    replacement: (_, body) => {
      const rows = body.split(/\\\\/).map((r: string) => r.trim()).filter(Boolean);
      const spokenRows = rows.map((row: string, rIdx: number) => {
        const cols = row.split(/&/).map((c: string) => c.trim()).filter(Boolean);
        const rowName = rIdx === 0 ? "صَفُّهَا الأَوَّلُ" : rIdx === 1 ? "وَصَفُّهَا الثَّانِي" : rIdx === 2 ? "وَصَفُّهَا الثَّالِثُ" : "وَصَفُّهَا رَقَم " + (rIdx + 1);
        return rowName + " " + cols.join(" وَ ");
      });
      return " مَصْفُوفَةٌ ، " + spokenRows.join(" ، ") + " ";
    }
  },

  // Determinants & Matrix Inverses
  { pattern: /\\det\s*\(\s*([A-Za-z\u0600-\u06FF])\s*\)/gi, replacement: " مُحَدَّدُ الْمَصْفُوفَةِ $1 " },
  { pattern: /\\det\s+([A-Za-z\u0600-\u06FF])/gi, replacement: " مُحَدَّدُ الْمَصْفُوفَةِ $1 " },
  { pattern: /\|([A-Za-z\u0600-\u06FF])\|/g, replacement: " مُحَدَّدُ الْمَصْفُوفَةِ $1 " },
  { pattern: /([A-Za-z\u0600-\u06FF])\s*\^\{\s*-1\s*\}/g, replacement: " مَعْكُوسُ الْمَصْفُوفَةِ $1 " },
  { pattern: /([A-Za-z\u0600-\u06FF])\s*\^-1\b/g, replacement: " مَعْكُوسُ الْمَصْفُوفَةِ $1 " },

  // Fractions & Powers
  { pattern: /\\frac\{([^{}]+)\}\{([^{}]+)\}/g, replacement: " الْكَسْرُ: $1 عَلَى $2 " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\^2\b|([A-Za-z0-9\u0600-\u06FF]+)\^\{2\}/g, replacement: " $1$2 تَرْبِيع " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\^3\b|([A-Za-z0-9\u0600-\u06FF]+)\^\{3\}/g, replacement: " $1$2 تَكْعِيب " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\^\{([^{}]+)\}/g, replacement: " $1 أُسّ $2 " },

  // Roots
  { pattern: /\\sqrt\[3\]\{([^{}]+)\}|∛([0-9a-zA-Z\u0600-\u06FF]+)/g, replacement: " الْجَذْرُ التَّكْعِيبِيُّ لِـ $1$2 " },
  { pattern: /\\sqrt\{([^{}]+)\}|√([0-9a-zA-Z\u0600-\u06FF]+)/g, replacement: " الْجَذْرُ التَّرْبِيعِيُّ لِـ $1$2 " },

  // Sets & Logic
  { pattern: /\\cup|\bcup\b|∪/g, replacement: " اتِّحَاد " },
  { pattern: /\\cap|\bcap\b|∩/g, replacement: " تَقَاطُع " },
  { pattern: /\\notin|∉/g, replacement: " لَا يَنْتَمِي إِلَى " },
  { pattern: /\\in|∈/g, replacement: " يَنْتَمِي إِلَى " },
  { pattern: /\\not\\subset|⊄/g, replacement: " لَيْسَتْ مَجْمُوعَةً جُزْئِيَّةً مِنْ " },
  { pattern: /\\subset|⊂/g, replacement: " مَجْمُوعَةٌ جُزْئِيَّةٌ مِنْ " },
  { pattern: /\\emptyset|∅/g, replacement: " الْمَجْمُوعَةُ الْخَالِيَةُ فَاي " },
  { pattern: /\\lor|∨/g, replacement: " أَوْ " },
  { pattern: /\\land|∧/g, replacement: " وَ " },
  { pattern: /\\mathbb\{R\}|ℝ|(?<=مجموعة\s+|المجموعة\s+|[∈∉⊂⊄]\s*)ح(?![^\s،.!\$\)])/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ الْحَقِيقِيَّةِ ح " },
  { pattern: /\\mathbb\{Q\}'|ℚ'|(?<=مجموعة\s+|المجموعة\s+|[∈∉⊂⊄]\s*)ن['’َ](?![^\s،.!\$\)])/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ غَيْرِ النِّسْبِيَّةِ ن شَرْطَة " },
  { pattern: /\\mathbb\{Q\}|ℚ|(?<=مجموعة\s+|المجموعة\s+|[∈∉⊂⊄]\s*)ن(?![^\s،.!\$\)])/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ النِّسْبِيَّةِ ن " },
  { pattern: /\\mathbb\{Z\}|ℤ|(?<=مجموعة\s+|المجموعة\s+|[∈∉⊂⊄]\s*)ص(?![^\s،.!\$\)])/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ الصَّحِيحَةِ ص " },
  { pattern: /\\mathbb\{N\}|ℕ|(?<=مجموعة\s+|المجموعة\s+|[∈∉⊂⊄]\s*)ط(?![^\s،.!\$\)])/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ الطَّبِيعِيَّةِ ط " },
  { pattern: /\\mid/g, replacement: " حَيْثُ " },
  { pattern: /-\\infty|-∞/g, replacement: " سَالِب مَا لَا نِهَايَة " },
  { pattern: /\\infty|∞/g, replacement: " مُوجَب مَا لَا نِهَايَة " },

  // Intervals [a, b], ]a, b[, [a, b[, ]a, b]
  { pattern: /\[\s*(-?\d+|-\\infty|-∞)\s*,\s*(-?\d+|\\infty|∞)\s*\]/g, replacement: " الْفَتْرَةُ الْمُغْلَقَةُ مِنْ $1 إِلَى $2 " },
  { pattern: /\]\s*(-?\d+|-\\infty|-∞)\s*,\s*(-?\d+|\\infty|∞)\s*\[/g, replacement: " الْفَتْرَةُ الْمَفْتُوحَةُ مِنْ $1 إِلَى $2 " },
  { pattern: /\[\s*(-?\d+|-\\infty|-∞)\s*,\s*(-?\d+|\\infty|∞)\s*\[/g, replacement: " الْفَتْرَةُ نِصْفُ الْمُغْلَقَةِ مِنْ $1 إِلَى $2 " },
  { pattern: /\]\s*(-?\d+|-\\infty|-∞)\s*,\s*(-?\d+|\\infty|∞)\s*\]/g, replacement: " الْفَتْرَةُ نِصْفُ الْمَفْتُوحَةِ مِنْ $1 إِلَى $2 " },

  // Geometry & Trigonometry
  { pattern: /\\triangle|\b\u25B3\b/g, replacement: " الْمُثَلَّث " },
  { pattern: /\\angle|∠/g, replacement: " قِيَاسُ الزَّاوِيَةِ " },
  { pattern: /\\perp|⊥/g, replacement: " عَمُودِيٌّ عَلَى " },
  { pattern: /\\parallel|∥/g, replacement: " يُوَازِي " },
  { pattern: /\\cong|≅/g, replacement: " يُطَابِق " },
  { pattern: /\\sim|∼/g, replacement: " يُشَابِه " },
  { pattern: /\\pi|π/g, replacement: " بَاي أَوْ ط " },
  { pattern: /\\theta|θ/g, replacement: " ثِيتَا " },

  // Strict Arabic Boundaries for Trigonometric Functions (Prevents corrupting words like "نظام", "مجال", "مظاهر")
  { pattern: /\\sin\b|(?<![\u0600-\u06FFa-zA-Z0-9])جا(?=[\s\(]+[A-Za-z0-9\u0600-\u06FF]|[\$\)])/g, replacement: " جَيْبُ الزَّاوِيَةِ جَا " },
  { pattern: /\\cos\b|(?<![\u0600-\u06FFa-zA-Z0-9])جتا(?=[\s\(]+[A-Za-z0-9\u0600-\u06FF]|[\$\)])/g, replacement: " جَيْبُ تَمَامِ الزَّاوِيَةِ جَتَا " },
  { pattern: /\\tan\b|(?<![\u0600-\u06FFa-zA-Z0-9])ظا(?=[\s\(]+[A-Za-z0-9\u0600-\u06FF]|[\$\)])/g, replacement: " ظِلُّ الزَّاوِيَةِ ظَا " },

  // Inequalities & Comparison
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\s*(?:\\ge|≥)\s*([A-Za-z0-9\u0600-\u06FF]+)/g, replacement: " $1 أَكْبَرُ مِنْ أَوْ يُسَاوِي $2 " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\s*(?:\\le|≤)\s*([A-Za-z0-9\u0600-\u06FF]+)/g, replacement: " $1 أَصْغَرُ مِنْ أَوْ يُسَاوِي $2 " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\s*(?:\\neq|≠)\s*([A-Za-z0-9\u0600-\u06FF]+)/g, replacement: " $1 لَا يُسَاوِي $2 " },
  { pattern: /\\pm|±/g, replacement: " مُوجَب أَوْ سَالِب " },
  { pattern: /\\approx|≈/g, replacement: " يُسَاوِي تَقْرِيباً " }
];

/**
 * ⚡ Physics & Educational SI Measurement Units Lexicon (Egyptian & International Curricula)
 */
const PHYSICS_AND_UNITS_RULES: STEMLexiconRule[] = [
  // Speeds & Accelerations
  { pattern: /\b(?:m\/s\^2|m\/s²|م\/ث\^2|م\/ث²)\b/gi, replacement: " مِتْرٌ لِكُلِّ ثَانِيَةٍ مُرَبَّعَةٍ " },
  { pattern: /\b(?:m\/s|م\/ث)\b/gi, replacement: " مِتْرٌ لِكُلِّ ثَانِيَةٍ " },
  { pattern: /\b(?:km\/h|كم\/س)\b/gi, replacement: " كِيلُومِتْرٌ لِكُلِّ سَاعَةٍ " },
  { pattern: /\b(?:cm\/s|سم\/ث)\b/gi, replacement: " سَنْتِيمِتْرٌ لِكُلِّ ثَانِيَةٍ " },

  // Distance, Area, Volume
  { pattern: /\b(?:km\^3|كم³)\b/gi, replacement: " كِيلُومِتْرٌ مُكَعَّبٌ " },
  { pattern: /\b(?:m\^3|م³)\b/gi, replacement: " مِتْرٌ مُكَعَّبٌ " },
  { pattern: /\b(?:cm\^3|سم³)\b/gi, replacement: " سَنْتِيمِتْرٌ مُكَعَّبٌ " },
  { pattern: /\b(?:mm\^3|مم³)\b/gi, replacement: " مِلِّيمِتْرٌ مُكَعَّبٌ " },
  { pattern: /\b(?:km\^2|كم²)\b/gi, replacement: " كِيلُومِتْرٌ مُرَبَّعٌ " },
  { pattern: /\b(?:m\^2|م²)\b/gi, replacement: " مِتْرٌ مُرَبَّعٌ " },
  { pattern: /\b(?:cm\^2|سم²)\b/gi, replacement: " سَنْتِيمِتْرٌ مُرَبَّعٌ " },
  { pattern: /\b(?:mm\^2|مم²)\b/gi, replacement: " مِلِّيمِتْرٌ مُرَبَّعٌ " },
  { pattern: /(?<=\d|\s)(?:km|كم)(?=[\s\.,،؛]|$)/gi, replacement: " كِيلُومِتْر " },
  { pattern: /(?<=\d|\s)(?:cm|سم)(?=[\s\.,،؛]|$)/gi, replacement: " سَنْتِيمِتْر " },
  { pattern: /(?<=\d|\s)(?:mm|مم)(?=[\s\.,،؛]|$)/gi, replacement: " مِلِّيمِتْر " },
  { pattern: /(?<=\d\s*)(?:m|م)(?=[\s\.,،؛]|$)/gi, replacement: " مِتْر " },

  // Mass, Force, Work & Energy
  { pattern: /(?<=\d|\s)(?:kg|كجم|كغم)(?=[\s\.,،؛]|$)/gi, replacement: " كِيلُوجْرَام " },
  { pattern: /(?<=\d|\s)(?:g|جم|جرام)(?=[\s\.,،؛]|$)/gi, replacement: " جْرَام " },
  { pattern: /(?<=\d|\s)(?:N|نيوتن)(?=[\s\.,،؛]|$)/gi, replacement: " نِيُوتِن " },
  { pattern: /(?<=\d|\s)(?:J|جول)(?=[\s\.,،؛]|$)/gi, replacement: " جُول " },
  { pattern: /(?<=\d|\s)(?:W|واط|وات)(?=[\s\.,،؛]|$)/gi, replacement: " وَاط " },
  { pattern: /\b(?:kW|كيلو\s*واط|كيلو\s*وات)\b/gi, replacement: " كِيلُو وَاط " },
  { pattern: /\b(?:kWh|كيلو\s*واط\s*ساعة)\b/gi, replacement: " كِيلُو وَاط سَاعَة " },

  // Electricity & Magnetism
  { pattern: /(?<=\d|\s)(?:A|أمبير|امبير)(?=[\s\.,،؛]|$)/gi, replacement: " أَمْبِير " },
  { pattern: /(?<=\d|\s)(?:V|فولت)(?=[\s\.,،؛]|$)/gi, replacement: " فُولْت " },
  { pattern: /(?<=\d|\s)(?:Ω|أوم|اوم)(?=[\s\.,،؛]|$)/gi, replacement: " أُوم " },
  { pattern: /(?<=\d|\s)(?:C|كولوم)(?=[\s\.,،؛]|$)/gi, replacement: " كُولُوم " },
  { pattern: /(?<=\d|\s)(?:T|تسلا)(?=[\s\.,،؛]|$)/gi, replacement: " تِسْلَا " },
  { pattern: /(?<=\d|\s)(?:Hz|هرتز)(?=[\s\.,،؛]|$)/gi, replacement: " هِرْتِز " },
  { pattern: /\b(?:kHz|كيلو\s*هرتز)\b/gi, replacement: " كِيلُو هِرْتِز " },
  { pattern: /\b(?:MHz|ميجا\s*هرتز)\b/gi, replacement: " مِيجَا هِرْتِز " },
  { pattern: /\b(?:GHz|جيجا\s*هرتز)\b/gi, replacement: " جِيجَا هِرْتِز " },

  // Pressure & Temperature
  { pattern: /(?<=\d|\s)(?:Pa|باسكال)(?=[\s\.,،؛]|$)/gi, replacement: " بَاسْكَال " },
  { pattern: /(?<=\d|\s)(?:bar|بار)(?=[\s\.,،؛]|$)/gi, replacement: " بَار " },
  { pattern: /(?<=\d|\s)(?:atm|ض\.ج|ضغط\s*جوي)(?=[\s\.,،؛]|$)/gi, replacement: " ضَغْط جَوِّي " },
  { pattern: /(?:°C|°م|درجة\s*مئوية|درجة\s*سيليزية)/gi, replacement: " دَرَجَة سِيلِيزِيَّة مِئَوِيَّة " },
  { pattern: /(?<=\d|\s)(?:K|كلفن)(?=[\s\.,،؛]|$)/gi, replacement: " كِلْفِن " }
];

/**
 * 💻 Computer Science, Networking & Digital Architecture Lexicon
 */
const COMPUTER_SCIENCE_RULES: STEMLexiconRule[] = [
  // Hardware & Processing
  { pattern: /\bCPU\b/g, replacement: " وِحْدَةُ الْمُعَالَجَةِ الْمَرْكَزِيَّةِ سِي بِي يُو " },
  { pattern: /\bGPU\b/g, replacement: " مُعَالِجُ الرُّسُومِيَّاتِ جِي بِي يُو " },
  { pattern: /\bRAM\b/g, replacement: " ذَاكِرَةُ الْوُصُولِ الْعَشْوَائِيِّ رَام " },
  { pattern: /\bROM\b/g, replacement: " ذَاكِرَةُ الْقِرَاءَةِ فَقَطْ رُوم " },
  { pattern: /\bMotherboard\b/gi, replacement: " اللَّوْحَةُ الأُمُّ " },
  { pattern: /\bALU\b/g, replacement: " وِحْدَةُ الْحِسَابِ وَالْمَنْطِقِ " },
  { pattern: /\bControl\s*Unit\b/gi, replacement: " وِحْدَةُ التَّحَكُّمِ " },

  // Storage Units (Bits & Bytes)
  { pattern: /(?<=\d|\s)\bTB\b/g, replacement: " تِيرَا بَايْت " },
  { pattern: /(?<=\d|\s)\bGB\b/g, replacement: " جِيجَا بَايْت " },
  { pattern: /(?<=\d|\s)\bMB\b/g, replacement: " مِيجَا بَايْت " },
  { pattern: /(?<=\d|\s)\bKB\b/g, replacement: " كِيلُو بَايْت " },
  { pattern: /(?<=\d|\s)\bBytes?\b/gi, replacement: " بَايْت " },
  { pattern: /(?<=\d|\s)\bBits?\b/gi, replacement: " بَت " },

  // Networks & Web
  { pattern: /\bIP(?:\s*Address)?\b/gi, replacement: " عُنْوَانُ بُرُوتُوكُولِ الإِنْتَرْنِتْ آي بِي " },
  { pattern: /\bURL\b/g, replacement: " رَابِطُ الْمَوْقِعِ يُو آرْ إِلْ " },
  { pattern: /\bHTTP\b/g, replacement: " بُرُوتُوكُولُ إِتْش تِي تِي بِي " },
  { pattern: /\bHTTPS\b/g, replacement: " بُرُوتُوكُولُ إِتْش تِي تِي بِي إِسْ الآمِن " },
  { pattern: /\bHTML\b/g, replacement: " لُغَةُ إِتْش تِي إِمْ إِلْ لِتَصْمِيمِ الصَّفَحَاتِ " },
  { pattern: /\bCSS\b/g, replacement: " سِي إِسْ إِسْ لِتَنْسِيقِ الْمَوَاقِعِ " },
  { pattern: /\bLAN\b/g, replacement: " الشَّبَكَةُ الْمَحَلِّيَّةُ لَان " },
  { pattern: /\bWAN\b/g, replacement: " الشَّبَكَةُ الْوَاسِعَةُ وَان " },
  { pattern: /\bWLAN\b/g, replacement: " الشَّبَكَةُ اللَّاسِلْكِيَّةُ دَبْلِيُو لَان " },
  { pattern: /\bWi-?Fi\b/gi, replacement: " شَبَكَةُ الْوَايْ فَاي اللَّاسِلْكِيَّة " },
  { pattern: /\bDNS\b/g, replacement: " خَادِمُ أَسْمَاءِ النِّطَاقَاتِ دِي إِنْ إِسْ " },
  { pattern: /\bDHCP\b/g, replacement: " بُرُوتُوكُولُ تَوْزِيعِ الْعَنَاوِينِ دِي إِتْش سِي بِي " },
  { pattern: /\bOS\b/g, replacement: " نِظَامُ التَّشْغِيلِ " },
  { pattern: /\bGUI\b/g, replacement: " وَاجِهَةُ الْمُسْتَخْدِمِ الرُّسُومِيَّةُ جِي يُو آي " },
  { pattern: /\bCLI\b/g, replacement: " وَاجِهَةُ سَطْرِ الأَوَامِرِ " },

  // Logic Gates & Architectures
  { pattern: /\bHalf\s*Adder\b/gi, replacement: " نِصْفُ الْجَامِع " },
  { pattern: /\bFull\s*Adder\b/gi, replacement: " الْجَامِعُ الْكَامِل " },
  { pattern: /\bCombinational(?:\s*Circuits?)?\b/gi, replacement: " الدَّوَائِرُ التَّجْمِيعِيَّة " },
  { pattern: /\bSequential(?:\s*Circuits?)?\b/gi, replacement: " الدَّوَائِرُ التَّسَلْسُلِيَّة " },
  { pattern: /\bXNOR\b/gi, replacement: " بَوَّابَةُ إِكْس نُور " },
  { pattern: /\bXOR\b/gi, replacement: " بَوَّابَةُ إِكْس أُور " },
  { pattern: /\bNAND\b/gi, replacement: " بَوَّابَةُ نَانْد " },
  { pattern: /\bNOR\b/gi, replacement: " بَوَّابَةُ نُور " },
  { pattern: /\bAND\b/g, replacement: " بَوَّابَةُ آنْد " },
  { pattern: /\bOR\b/g, replacement: " بَوَّابَةُ أُور " },
  { pattern: /\bNOT\b/g, replacement: " بَوَّابَةُ نَات الْعَاكِسَة " },
  { pattern: /\bFlip-?Flops?\b/gi, replacement: " الْقَلَّابَاتُ الْمَنْطِقِيَّة " },
  { pattern: /\bRegisters?\b/gi, replacement: " الْمُسَجِّلَات " },
  { pattern: /\bCounters?\b/gi, replacement: " الْعَدَّادَات " },
  { pattern: /\bDeMultiplexers?\b/gi, replacement: " مُوَزِّعُ الْقَنَوَات " },
  { pattern: /\bMultiplexers?\b/gi, replacement: " مُعَدِّدُ الْقَنَوَات " },
  { pattern: /\bDecoders?\b/gi, replacement: " فَاكُّ الشِّفْرَة " },
  { pattern: /\bEncoders?\b/gi, replacement: " الْمُشَفِّر " }
];

/**
 * 🎯 Master STEM Transpiler Function
 * Converts any scientific Markdown / LaTeX into fluent spoken Arabic phonetics
 * without affecting visual presentation!
 */
export function transpileSTEMToSpokenArabic(input: string): string {
  if (!input) return "";

  let spoken = input;

  // 1. Apply Chemistry rules
  for (const rule of CHEMISTRY_RULES) {
    spoken = spoken.replace(rule.pattern, rule.replacement as any);
  }

  // 2. Apply Mathematics rules
  for (const rule of MATHEMATICS_RULES) {
    spoken = spoken.replace(rule.pattern, rule.replacement as any);
  }

  // 3. Apply Physics & Units rules
  for (const rule of PHYSICS_AND_UNITS_RULES) {
    spoken = spoken.replace(rule.pattern, rule.replacement as any);
  }

  // 4. Apply Computer Science rules
  for (const rule of COMPUTER_SCIENCE_RULES) {
    spoken = spoken.replace(rule.pattern, rule.replacement as any);
  }

  // 5. Clean stray LaTeX math delimiters: $, $$, \text{...}, \mathbf{...}
  spoken = spoken.replace(/\\text\{([^{}]+)\}/g, "$1");
  spoken = spoken.replace(/\\mathbf\{([^{}]+)\}/g, "$1");
  spoken = spoken.replace(/\\mathit\{([^{}]+)\}/g, "$1");
  spoken = spoken.replace(/\\mathrm\{([^{}]+)\}/g, "$1");
  spoken = spoken.replace(/\$+/g, " ");

  // 5. Clean standalone backslashes
  spoken = spoken.replace(/\\([a-zA-Z]+)/g, " $1 ");
  spoken = spoken.replace(/\\/g, " ");

  return spoken;
}
