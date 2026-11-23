import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  evaluatePedagogicalChunking,
  buildMasterPedagogicalPrompt,
  deduplicateChapterTitles,
} from '../../server/services/pedagogicalChunker';

describe('Bilingual Curriculum Pipeline E2E Suite', () => {
  const arabicMemoPath = path.resolve(process.cwd(), 'test/fixtures/memos/arabic_stem_lesson.txt');
  const englishMemoPath = path.resolve(process.cwd(), 'test/fixtures/memos/english_cs_lesson.txt');

  const arabicText = fs.readFileSync(arabicMemoPath, 'utf-8');
  const englishText = fs.readFileSync(englishMemoPath, 'utf-8');

  describe('Arabic STEM Curriculum Processing Flow', () => {
    it('ingests Arabic STEM memo and detects Arabic language taxonomy', () => {
      assert.ok(arabicText.length > 500, 'Arabic memo fixture must be populated');
      const hasArabic = /[\u0600-\u06FF]/.test(arabicText);
      assert.strictEqual(hasArabic, true, 'Must detect Arabic Unicode characters');

      // Assert key STEM terms are present in source memo
      assert.ok(arabicText.includes('النظام الثنائي'));
      assert.ok(arabicText.includes('البوابات المنطقية'));
      assert.ok(arabicText.includes('نصف الجامع'));
    });

    it('evaluates pedagogical chunking for Arabic lesson', () => {
      const decision = evaluatePedagogicalChunking({
        title: 'درس أنظمة العد وبوابات المنطق',
        textLength: arabicText.length,
        category: 'علوم الحاسب',
        grade_level: 'الصف الثاني الإعدادي',
      });

      assert.ok(decision.recommendedChapterCount >= 1);
      assert.ok(decision.persona, 'Must assign a teacher persona');
      assert.ok(decision.persona.pedagogicalSystemPrompt);
    });

    it('builds master pedagogical prompt with strict Arabic language mandate', () => {
      const { prompt } = buildMasterPedagogicalPrompt({
        title: 'أنظمة العد الرقمية وبوابات المنطق',
        fileName: 'arabic_stem_lesson.txt',
        category: 'علوم الحاسب',
        grade_level: 'الصف الثاني الإعدادي',
        textLength: arabicText.length,
        extractedText: arabicText,
        language: 'ar',
      });

      assert.ok(prompt.includes('Modern Standard Arabic'), 'Must enforce Modern Standard Arabic');
      assert.ok(prompt.includes('ZERO language mixing'), 'Must forbid language mixing');
      assert.ok(prompt.includes('MATHEMATICAL & SCIENTIFIC FORMULA MANDATE'), 'Must enforce LaTeX formula rules');
    });
  });

  describe('English CS Curriculum Processing Flow', () => {
    it('ingests English CS memo and confirms pure English technical terms', () => {
      assert.ok(englishText.length > 500, 'English memo fixture must be populated');
      const hasArabic = /[\u0600-\u06FF]/.test(englishText);
      assert.strictEqual(hasArabic, false, 'English memo fixture must contain zero Arabic text');

      // Assert key technical terms are present
      assert.ok(englishText.includes('Binary'));
      assert.ok(englishText.includes('Half Adder'));
      assert.ok(englishText.includes('Full Adder'));
      assert.ok(englishText.includes('Truth Table'));
    });

    it('evaluates pedagogical chunking for English CS curriculum', () => {
      const decision = evaluatePedagogicalChunking({
        title: 'Computer Architecture and Digital Logic Circuits',
        textLength: englishText.length,
        category: 'Computer Science',
        grade_level: 'Grade 8',
      });

      assert.ok(decision.recommendedChapterCount >= 1);
      assert.ok(decision.persona);
    });

    it('builds master pedagogical prompt with strict translation suppression', () => {
      const { prompt } = buildMasterPedagogicalPrompt({
        title: 'Computer Architecture and Digital Logic Circuits',
        fileName: 'english_cs_lesson.txt',
        category: 'Computer Science',
        grade_level: 'Grade 8',
        textLength: englishText.length,
        extractedText: englishText,
        language: 'en',
      });

      assert.ok(prompt.includes('TARGET OUTPUT LANGUAGE: English'), 'Must mandate English target language');
      assert.ok(prompt.includes('NEVER generate Arabic text'), 'Must enforce translation suppression against Arabic leakage');
    });
  });

  describe('Chapter Title Deduplication & Pipeline Purity', () => {
    it('deduplicates identical chapter titles across chunks', () => {
      const duplicatedChapters = [
        { id: '1', title: 'البوابات المنطقية والدوائر', content: 'الجزء الأول' },
        { id: '2', title: 'البوابات المنطقية والدوائر', content: 'الجزء الثاني' },
        { id: '3', title: 'نصف الجامع والجامع الكامل', content: 'شرح نصف الجامع' },
        { id: '4', title: 'البوابات المنطقية والدوائر', content: 'الجزء الثالث' },
      ];

      const cleaned = deduplicateChapterTitles(duplicatedChapters);
      assert.strictEqual(cleaned.length, 4);

      // Verify each title is now unique
      const titles = cleaned.map((c) => c.title);
      const uniqueTitles = new Set(titles);
      assert.strictEqual(uniqueTitles.size, 4, 'All chapter titles must be strictly unique after deduplication');
      assert.ok(titles[1].includes('(2)') || titles[1].includes('2') || titles[1] !== titles[0]);
    });
  });
});
