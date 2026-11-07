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
  { pattern: /\\mathbb\{R\}|ℝ|\bح\b/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ الْحَقِيقِيَّةِ ح " },
  { pattern: /\\mathbb\{Q\}'|ℚ'|\bن['’َ]\b/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ غَيْرِ النِّسْبِيَّةِ ن شَرْطَة " },
  { pattern: /\\mathbb\{Q\}|ℚ|\bن\b/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ النِّسْبِيَّةِ ن " },
  { pattern: /\\mathbb\{Z\}|ℤ|\bص\b/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ الصَّحِيحَةِ ص " },
  { pattern: /\\mathbb\{N\}|ℕ|\bط\b/g, replacement: " مَجْمُوعَةُ الأَعْدَادِ الطَّبِيعِيَّةِ ط " },
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
  { pattern: /\\sin\b|(?<![a-zA-Z])جا(?![a-zA-Z])/g, replacement: " جَيْبُ الزَّاوِيَةِ جَا " },
  { pattern: /\\cos\b|(?<![a-zA-Z])جتا(?![a-zA-Z])/g, replacement: " جَيْبُ تَمَامِ الزَّاوِيَةِ جَتَا " },
  { pattern: /\\tan\b|(?<![a-zA-Z])ظا(?![a-zA-Z])/g, replacement: " ظِلُّ الزَّاوِيَةِ ظَا " },

  // Inequalities & Comparison
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\s*(?:\\ge|≥)\s*([A-Za-z0-9\u0600-\u06FF]+)/g, replacement: " $1 أَكْبَرُ مِنْ أَوْ يُسَاوِي $2 " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\s*(?:\\le|≤)\s*([A-Za-z0-9\u0600-\u06FF]+)/g, replacement: " $1 أَصْغَرُ مِنْ أَوْ يُسَاوِي $2 " },
  { pattern: /([A-Za-z0-9\u0600-\u06FF]+)\s*(?:\\neq|≠)\s*([A-Za-z0-9\u0600-\u06FF]+)/g, replacement: " $1 لَا يُسَاوِي $2 " },
  { pattern: /\\pm|±/g, replacement: " مُوجَب أَوْ سَالِب " },
  { pattern: /\\approx|≈/g, replacement: " يُسَاوِي تَقْرِيباً " }
];

/**
 * 💻 Computer Science & Digital Architecture Lexicon
 */
const COMPUTER_SCIENCE_RULES: STEMLexiconRule[] = [
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

  // 3. Apply Computer Science rules
  for (const rule of COMPUTER_SCIENCE_RULES) {
    spoken = spoken.replace(rule.pattern, rule.replacement as any);
  }

  // 4. Clean stray LaTeX math delimiters: $, $$, \text{...}, \mathbf{...}
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
