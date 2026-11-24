import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getPdfTotalPages } from "../../server/services/documentParser";
import {
  rollbackBlueprintState,
  separateStudyAndExerciseText,
  DocumentSyllabusBlueprint
} from "../../server/services/documentBlueprint";

describe("Sequential Segmentation & Resumption Unit Tests", () => {
  describe("PDF Page Count Detection (getPdfTotalPages)", () => {
    it("accurately detects total pages from a valid PDF fixture", async () => {
      const fixturePath = path.resolve(process.cwd(), "test/fixtures/memos/minimal_valid.pdf");
      assert.ok(fs.existsSync(fixturePath), "Fixture minimal_valid.pdf must exist");
      const buffer = fs.readFileSync(fixturePath);
      const totalPages = await getPdfTotalPages(buffer);
      assert.strictEqual(totalPages, 1, "Fixture should have exactly 1 page");
    });

    it("returns 0 for empty or corrupted buffer without throwing an uncaught exception", async () => {
      const corruptBuffer = Buffer.from("NOT_A_VALID_PDF_STREAM_12345");
      const totalPages = await getPdfTotalPages(corruptBuffer);
      assert.strictEqual(totalPages, 0, "Corrupted buffer should return 0 pages");
    });
  });

  describe("Strict N+1 Page Resumption Boundary Logic", () => {
    function computeResumptionPage(chapters: Array<{ end_page?: number; start_page?: number }>): number {
      const validEndPages = chapters.map((c: any) => Number(c.end_page) || 0).filter(p => p > 0);
      const terminalPage = validEndPages.length > 0 ? Math.max(...validEndPages) : 0;
      return terminalPage > 0 ? terminalPage + 1 : 1;
    }

    it("resumes strictly at page 1 when no chapters exist", () => {
      const startPage = computeResumptionPage([]);
      assert.strictEqual(startPage, 1, "Empty chapters array must start at page 1");
    });

    it("resumes strictly at page N+1 following the terminal chapter end_page", () => {
      const chapters = [
        { start_page: 1, end_page: 5 },
        { start_page: 6, end_page: 12 },
        { start_page: 13, end_page: 20 },
      ];
      const startPage = computeResumptionPage(chapters);
      assert.strictEqual(startPage, 21, "Resumption page must strictly equal 20 + 1 = 21");
    });

    it("handles chapters with non-continuous or missing end_page safely without regressing to page 1", () => {
      const chapters = [
        { start_page: 1, end_page: 8 },
        { start_page: 9 }, // end_page undefined
      ];
      const startPage = computeResumptionPage(chapters);
      // Resilient calculation uses max valid end_page (8) + 1 = 9, NOT dropping back to 1
      assert.strictEqual(startPage, 9);
    });

    it("prevents inverted page ranges on 1-page booklets by breaking early", () => {
      const totalDocPages = 1;
      let currentResumeCursor = 1;
      const proposedChapters = [{ title: "فصل 1" }, { title: "فصل 2" }, { title: "فصل 3" }];
      const generatedChapters: Array<{ start_page: number; end_page: number }> = [];

      for (let idx = 0; idx < proposedChapters.length; idx++) {
        if (totalDocPages > 0 && currentResumeCursor > totalDocPages) {
          break;
        }
        const lessonSpan = 6;
        const startPg = currentResumeCursor;
        const endPg = Math.min(totalDocPages > 0 ? totalDocPages : 9999, startPg + lessonSpan - 1);
        currentResumeCursor = endPg + 1;
        generatedChapters.push({ start_page: startPg, end_page: endPg });
      }

      assert.strictEqual(generatedChapters.length, 1, "Only 1 chapter should be generated for 1-page doc");
      assert.strictEqual(generatedChapters[0].start_page, 1);
      assert.strictEqual(generatedChapters[0].end_page, 1);
      assert.ok(generatedChapters[0].start_page <= generatedChapters[0].end_page);
    });

    it("harmonizes totalDocPages property check preventing false completion on 400-page booklets", () => {
      const book = {
        id: "book-400",
        total_pages: 400,
        // total_pdf_pages is undefined
        blueprint: {
          lessons: [
            { lesson_order: 1, status: "completed" },
            { lesson_order: 2, status: "completed" },
          ]
        }
      };

      const totalDocPages = Number((book.blueprint as any)?.total_pdf_pages || (book as any).total_pdf_pages || (book as any).total_pages || 0);
      assert.strictEqual(totalDocPages, 400, "totalDocPages must resolve 400 from book.total_pages");

      const maxEndPage = 12; // only 2 chapters generated
      const pendingInBlueprint = book.blueprint.lessons.filter((l: any) => l.status === "pending").length;

      const isBookFullyCompleted = totalDocPages > 0
        ? maxEndPage >= totalDocPages
        : (book.blueprint && book.blueprint.lessons && book.blueprint.lessons.length > 0 && pendingInBlueprint === 0);

      assert.strictEqual(isBookFullyCompleted, false, "Book with 400 total_pages and maxEndPage 12 must NOT be marked complete");
    });

    it("prevents premature completion when lastProcessedPage is less than totalPdfPages", () => {
      const totalPdfPages = 45;
      const lastProcessedPage = 20;
      const isComplete = totalPdfPages > 0 && lastProcessedPage >= totalPdfPages;
      assert.strictEqual(isComplete, false, "Should not be marked complete when 20 < 45");

      const completedPage = 45;
      const isTrulyComplete = totalPdfPages > 0 && completedPage >= totalPdfPages;
      assert.strictEqual(isTrulyComplete, true, "Should be marked complete when 45 >= 45");
    });
  });

  describe("Blueprint Rollback State (rollbackBlueprintState)", () => {
    const mockBlueprint: DocumentSyllabusBlueprint = {
      book_title: "كتاب العلوم المتكاملة",
      total_lessons: 5,
      detected_units: ["الوحدة الأولى", "الوحدة الثانية"],
      last_processed_page: 25,
      last_scanned_page: 25,
      createdAt: new Date().toISOString(),
      lessons: [
        {
          lesson_order: 1,
          lesson_title: "الدرس الأول: المادة وخواصها",
          start_page: 1,
          end_page: 5,
          sub_topics: ["الكتلة", "الكثافة"],
          raw_text_snippet: "نص الدرس الأول الكامل...",
          status: "completed",
        },
        {
          lesson_order: 2,
          lesson_title: "الدرس الثاني: تركيب المادة",
          start_page: 6,
          end_page: 10,
          sub_topics: ["الجزيئات", "الذرات"],
          raw_text_snippet: "نص الدرس الثاني الكامل...",
          status: "completed",
        },
        {
          lesson_order: 3,
          lesson_title: "الدرس الثالث: التركيب الذري",
          start_page: 11,
          end_page: 15,
          sub_topics: ["البروتونات", "الإلكترونات"],
          raw_text_snippet: "نص الدرس الثالث الكامل...",
          status: "completed",
        },
        {
          lesson_order: 4,
          lesson_title: "الدرس الرابع: الطاقة ومصادرها",
          start_page: 16,
          end_page: 20,
          sub_topics: ["طاقة الوضع", "طاقة الحركة"],
          raw_text_snippet: "نص الدرس الرابع الكامل...",
          status: "completed",
        },
        {
          lesson_order: 5,
          lesson_title: "الدرس الخامس: تحولات الطاقة",
          start_page: 21,
          end_page: 25,
          sub_topics: ["قانون بقاء الطاقة"],
          raw_text_snippet: "نص الدرس الخامس الكامل...",
          status: "completed",
        },
      ],
    };

    it("rolls back blueprint to chapter 3 boundary when chapters 4 and 5 are deleted", () => {
      const rolledBackEndPage = 15;
      const remainingChaptersCount = 3;

      const updatedBlueprint = rollbackBlueprintState(
        mockBlueprint,
        rolledBackEndPage,
        remainingChaptersCount
      );

      // Verify page cursors updated
      assert.strictEqual(updatedBlueprint.last_processed_page, 15);
      assert.strictEqual(updatedBlueprint.last_scanned_page, 15);

      // Verify retained lessons (1, 2, 3) remain completed with intact text snippets
      assert.strictEqual(updatedBlueprint.lessons[0].status, "completed");
      assert.strictEqual(updatedBlueprint.lessons[0].raw_text_snippet, "نص الدرس الأول الكامل...");
      assert.strictEqual(updatedBlueprint.lessons[1].status, "completed");
      assert.strictEqual(updatedBlueprint.lessons[2].status, "completed");
      assert.strictEqual(updatedBlueprint.lessons[2].raw_text_snippet, "نص الدرس الثالث الكامل...");

      // Verify rolled back lessons (4, 5) are reset to pending with cleared text snippets
      assert.strictEqual(updatedBlueprint.lessons[3].status, "pending");
      assert.strictEqual(updatedBlueprint.lessons[3].raw_text_snippet, "");
      assert.strictEqual(updatedBlueprint.lessons[4].status, "pending");
      assert.strictEqual(updatedBlueprint.lessons[4].raw_text_snippet, "");
    });

    it("resets all lessons to pending and last_scanned_page to 0 if all chapters are deleted (count = 0, page = 0)", () => {
      const updatedBlueprint = rollbackBlueprintState(mockBlueprint, 0, 0);

      assert.strictEqual(updatedBlueprint.last_processed_page, 0);
      assert.strictEqual(updatedBlueprint.last_scanned_page, 0, "last_scanned_page must reset to 0 on total chapter deletion");
      assert.strictEqual(updatedBlueprint.lessons.every((l) => l.status === "pending"), true);
      assert.strictEqual(updatedBlueprint.lessons.every((l) => l.raw_text_snippet === ""), true);
    });
  });

  describe("Practice Separation Service (separateStudyAndExerciseText)", () => {
    it("splits explanation text and exercises when heading matches Arabic exercise markers", () => {
      const combinedText = `
# درس التفاعلات الكيميائية
تعتبر التفاعلات الكيميائية كسر الروابط الموجودة بين ذرات جزيئات المواد المتفاعلة وتكوين روابط جديدة.
تنقسم التفاعلات إلى تفاعلات انحلال حراري وتفاعلات إحلال وتفاعلات أكسدة واختزال.

## تدريبات الدرس الأول
السؤال الأول: اختر الإجابة الصحيحة مما بين القوسين:
1. عند تسخين أكسيد الزئبق الأحمر يتكون الزئبق الفضي ويتصاعد غاز: (الأكسجين - الهيدروجين - النيتروجين).
2. تفاعل حمض مع قلوي لتكوين ملح وماء يسمى تفاعل: (التعادل - التفكك - الاحتراق).
      `.trim();

      const { studyText, exerciseText } = separateStudyAndExerciseText(combinedText);

      assert.ok(studyText.includes("تعتبر التفاعلات الكيميائية كسر الروابط"));
      assert.ok(!studyText.includes("السؤال الأول: اختر"));
      assert.ok(exerciseText.includes("تدريبات الدرس الأول"));
      assert.ok(exerciseText.includes("السؤال الأول: اختر"));
    });

    it("cleanly slices exercise worksheets starting directly on line 1 without leading newline", () => {
      const worksheetLine1 = `تمارين الدرس الأول\nالسؤال الأول: اختر الإجابة الصحيحة مما بين القوسين.\n1. ما عاصمة جمهورية مصر العربية؟ (القاهرة - الإسكندرية)\nالسؤال الثاني: اذكر أهم الموانئ المصرية.`;
      const { studyText, exerciseText } = separateStudyAndExerciseText(worksheetLine1);

      assert.strictEqual(studyText, "", "No study text should precede line 1 exercise header");
      assert.ok(exerciseText.includes("تمارين الدرس الأول"));
      assert.ok(exerciseText.includes("السؤال الأول: اختر"));
      assert.ok(exerciseText.includes("السؤال الثاني: اذكر"));
    });

    it("splits question block preceded only by brief introductory header", () => {
      const shortIntroWorksheet = `تمهيد سريع للمقرر.\n\nالسؤال الأول: اختر الإجابة الصحيحة.\n1. وحدة قياس السرعة هي: (م/ث - نيوتن).\nالسؤال الثاني: علل لما يأتي.`;
      const { studyText, exerciseText } = separateStudyAndExerciseText(shortIntroWorksheet);

      assert.strictEqual(studyText, "تمهيد سريع للمقرر.");
      assert.ok(exerciseText.includes("السؤال الأول: اختر الإجابة الصحيحة"));
      assert.ok(exerciseText.includes("السؤال الثاني: علل لما يأتي"));
    });

    it("returns empty exerciseText when lesson contains only educational explanation", () => {
      const pureStudy = `
مفهوم الحركة في اتجاه واحد:
الحركة هي تغير موضع الجسم بمرور الزمن بالنسبة لموضع جسم آخر ثابت.
السرعة = المسافة / الزمن، ووحدة قياس السرعة هي متر لكل ثانية (م/ث) أو كيلومتر لكل ساعة (كم/س).
      `.trim();

      const { studyText, exerciseText } = separateStudyAndExerciseText(pureStudy);

      assert.strictEqual(studyText, pureStudy);
      assert.strictEqual(exerciseText, "");
    });

    it("handles fallback question stem splitting if explicit heading is absent", () => {
      const textWithUnheadedQuestions = `
مقدمة عن الجدول الدوري:
رتب مندليف العناصر تصاعدياً حسب أوزانها الذرية، ثم جاء موزلي ورتبها حسب أعدادها الذرية.
ويتكون الجدول الدوري الحديث من 7 دورات أفقية و 18 مجموعة رأسية.

السؤال الأول:
علل: رتب موزلي العناصر حسب أعدادها الذرية وليس أوزانها الذرية؟
      `.trim();

      const { studyText, exerciseText } = separateStudyAndExerciseText(textWithUnheadedQuestions);

      assert.ok(studyText.includes("مقدمة عن الجدول الدوري"));
      assert.ok(!studyText.includes("علل: رتب موزلي"));
      assert.ok(exerciseText.includes("السؤال الأول:"));
      assert.ok(exerciseText.includes("علل: رتب موزلي"));
    });
  });
});
