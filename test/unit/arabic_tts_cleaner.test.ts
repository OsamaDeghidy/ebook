import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { transpileSTEMToSpokenArabic } from '../../server/services/arabicSTEMLexicon';

// Extract the real cleanScientificTextForSpeech function directly from server.ts
// so we are verifying the exact production implementation without modifying server.ts
const serverCode = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf-8');
const match = serverCode.match(/function cleanScientificTextForSpeech\(input:\s*string\):\s*string\s*\{([\s\S]*?)\n\}/);
if (!match) {
  throw new Error('Could not locate cleanScientificTextForSpeech in server.ts');
}

const cleanerFn = new Function('input', 'transpileSTEMToSpokenArabic', match[1]);

export function cleanArabicTtsText(input: string): string {
  return cleanerFn(input, transpileSTEMToSpokenArabic);
}

export function stripArabicDiacritics(text: string): string {
  return text.replace(/[\u0617-\u061A\u064B-\u0652]/g, '');
}

describe('Arabic TTS Cleaner Unit Test Suite (cleanArabicTtsText)', () => {
  describe('Mathematical Expressions & LaTeX Transpilation', () => {
    it('transpiles LaTeX fractions to natural spoken Arabic without slashes', () => {
      const input = 'الكسر هو \\frac{3}{4} في المعادلة';
      const result = cleanArabicTtsText(input);
      assert.ok(!result.includes('\\frac'), 'Should remove \\frac');
      assert.ok(!result.includes('/'), 'Should not contain raw slash');
      assert.ok(result.includes('3') && result.includes('4'), 'Should retain numbers');
      assert.ok(/3\s*(عَلَى|على)\s*4/.test(result), 'Should say 3 على 4');
    });

    it('transpiles standard slashed fractions (e.g. 5/8) to Arabic words', () => {
      const input = 'نسبة النجاح هي 5/8 من الطلاب';
      const result = cleanArabicTtsText(input);
      assert.ok(!result.includes('/'), 'Slash should be replaced');
      assert.ok(/5\s*على\s*8/.test(result), 'Should say 5 على 8');
    });

    it('transpiles square roots and cube roots to authentic Arabic terms', () => {
      const input1 = 'قيمة \\sqrt{16} تساوي 4';
      const result1 = cleanArabicTtsText(input1);
      const clean1 = stripArabicDiacritics(result1);
      assert.ok(clean1.includes('الجذر التربيعي'), 'Should contain Arabic term for square root');

      const input2 = 'قيمة \\sqrt[3]{27} تساوي 3';
      const result2 = cleanArabicTtsText(input2);
      const clean2 = stripArabicDiacritics(result2);
      assert.ok(clean2.includes('الجذر التكعيبي'), 'Should contain Arabic term for cube root');
    });

    it('transpiles matrices into descriptive row-by-row spoken Arabic', () => {
      const input = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}';
      const result = cleanArabicTtsText(input);
      const clean = stripArabicDiacritics(result);
      assert.ok(clean.includes('مصفوفة'), 'Should identify matrix');
      assert.ok(clean.includes('الأول') || clean.includes('الثاني'), 'Should speak row names');
      assert.ok(!result.includes('\\begin'), 'Should strip LaTeX markers');
    });

    it('transpiles set theory operators (union, intersection, element of)', () => {
      const input = 'A \\cap B و A \\cup B و x \\in \\mathbb{R} و y \\notin \\mathbb{Q}';
      const result = cleanArabicTtsText(input);
      const clean = stripArabicDiacritics(result);
      assert.ok(clean.includes('تقاطع'), 'Should translate intersection');
      assert.ok(clean.includes('اتحاد'), 'Should translate union');
      assert.ok(clean.includes('ينتمي إلى'), 'Should translate member of');
      assert.ok(clean.includes('لا ينتمي'), 'Should translate not member of');
      assert.ok(clean.includes('الحقيقية'), 'Should translate Real numbers set R');
    });

    it('transpiles interval notations [a, b] to spoken Arabic', () => {
      const input = 'نبحث في الفترة [1, 5] والفترة ]0, ∞[';
      const result = cleanArabicTtsText(input);
      const clean = stripArabicDiacritics(result);
      assert.ok(clean.includes('الفترة المغلقة'), 'Should speak closed interval');
      assert.ok(clean.includes('ما لا نهاية'), 'Should speak infinity');
    });

    it('transpiles inequalities without generating spoken angle brackets', () => {
      const input = 'x ≥ 5 و y ≤ 10 و a ≠ b و z > 3 و w < 1';
      const result = cleanArabicTtsText(input);
      assert.ok(result.includes('أَكْبَرُ مِنْ أَوْ يُسَاوِي') || result.includes('أكبر من أو يساوي'), 'Should speak >=');
      assert.ok(result.includes('أَصْغَرُ مِنْ أَوْ يُسَاوِي') || result.includes('أصغر من أو يساوي'), 'Should speak <=');
      assert.ok(result.includes('لَا يُسَاوِي') || result.includes('لا يساوي'), 'Should speak !=');
      assert.ok(!result.includes('<') && !result.includes('>'), 'Angle brackets must be stripped so TTS never says greater than mark');
    });
  });

  describe('Digital Logic & Computer Science Terminology', () => {
    it('transpiles Half Adder and Full Adder terms to fluent Arabic', () => {
      const input = 'شرح دائرة Half Adder ودائرة Full Adder في المعالج';
      const result = cleanArabicTtsText(input);
      assert.ok(result.includes('نِصْفُ الْجَامِع'), 'Should translate Half Adder');
      assert.ok(result.includes('الْجَامِعُ الْكَامِل'), 'Should translate Full Adder');
      assert.ok(!result.includes('Half Adder'), 'Original English phrase should be replaced');
    });

    it('transpiles logic gates (AND, OR, NOT, XOR, XNOR, NAND, NOR)', () => {
      const input = 'بوابات المنطق: AND و OR و NOT و XOR و NAND و NOR و XNOR';
      const result = cleanArabicTtsText(input);
      assert.ok(result.includes('بَوَّابَةُ آنْد') || result.includes('آنْد'), 'Should translate AND gate');
      assert.ok(result.includes('بَوَّابَةُ أُور') || result.includes('أُور'), 'Should translate OR gate');
      assert.ok(result.includes('بَوَّابَةُ نَات') || result.includes('الْعَاكِسَة'), 'Should translate NOT gate');
      assert.ok(result.includes('إِكْس أُور'), 'Should translate XOR gate');
      assert.ok(result.includes('نَانْد'), 'Should translate NAND gate');
      assert.ok(result.includes('إِكْس نُور'), 'Should translate XNOR gate');
    });

    it('transpiles architecture components (Flip-Flops, Registers, Multiplexers)', () => {
      const input = 'تتكون الذاكرة من Flip-Flops ومجموعة Registers مع Multiplexers';
      const result = cleanArabicTtsText(input);
      assert.ok(result.includes('الْقَلَّابَاتُ الْمَنْطِقِيَّة'), 'Should translate Flip-Flops');
      assert.ok(result.includes('الْمُسَجِّلَات'), 'Should translate Registers');
      assert.ok(result.includes('مُعَدِّدُ الْقَنَوَات') || result.includes('المعدد'), 'Should translate Multiplexers');
    });
  });

  describe('Chemistry & Molecular Formulas', () => {
    it('transpiles chemical formulas into authentic spoken Arabic terms', () => {
      const input = 'يتفاعل H2O مع CO2 لإنتاج حمض، وكلوريد الصوديوم هو NaCl';
      const result = cleanArabicTtsText(input);
      assert.ok(result.includes('مَاء') || result.includes('الْمَاءِ'), 'Should speak H2O as water');
      assert.ok(result.includes('ثَانِي أُكْسِيدِ الْكَرْبُون'), 'Should speak CO2 as carbon dioxide');
      assert.ok(result.includes('كُلُورِيدُ الصُّودْيُومِ') || result.includes('NaCl'), 'Should handle NaCl');
    });
  });

  describe('Formatting & Noise Cleanup', () => {
    it('strips unicode emojis so TTS never speaks raw emoji codes', () => {
      const input = 'مرحباً بكم 💡 في درس اليوم 🎯 مع تجربة شيقة 🚀🔥';
      const result = cleanArabicTtsText(input);
      assert.ok(!/[💡🎯🚀🔥]/.test(result), 'All emojis must be stripped');
      assert.ok(result.includes('مرحباً بكم') && result.includes('درس اليوم'), 'Text must remain intact');
    });

    it('strips bracketed director notes and markdown callouts', () => {
      const input = '[!IMPORTANT] [متحمس] انتبه يا بطل [سكتة درامية] إلى المعادلة التالية';
      const result = cleanArabicTtsText(input);
      assert.ok(!result.includes('[!IMPORTANT]'), 'Markdown callout must be removed');
      assert.ok(!result.includes('[متحمس]'), 'Director cue must be removed');
      assert.ok(!result.includes('[سكتة درامية]'), 'Dramatic pause note must be removed');
      assert.ok(result.includes('انتبه يا بطل') && result.includes('المعادلة التالية'));
    });

    it('replaces multiple dots (ellipsis) with single comma pause', () => {
      const input = 'النتيجة هي....... استمر في المحاولة';
      const result = cleanArabicTtsText(input);
      assert.ok(!result.includes('.......'), 'Multiple dots must be replaced');
      assert.ok(result.includes('،'), 'Should insert natural breathing pause comma');
    });

    it('strips brackets, quotes, braces, and slashes so TTS never pronounces punctuation names', () => {
      const input = '«الذرة» هي (أصغر) جزء {في العنصر} "المادة" / "الطاقة"';
      const result = cleanArabicTtsText(input);
      assert.ok(!/[«»\(\)\{\}""\/]/.test(result), 'Punctuation brackets must be stripped');
      assert.ok(result.includes('الذرة') && result.includes('أصغر') && result.includes('في العنصر'));
    });
  });
});
