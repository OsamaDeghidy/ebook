import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyPageType } from "../../server/services/documentParser";

describe("Exercise Page Classifier Unit Test Suite (classifyPageType)", () => {
  describe("Heading-Based Classification", () => {
    it("classifies explicit exercise headings as 'exercise'", () => {
      const exerciseHeadings = [
        "تمارين الدرس الأول: تركيب المادة",
        "تدريبات الأنشطة والتقويم لمادة العلوم",
        "اختبر نفسك في 10 دقائق",
        "أسئلة عامة على الوحدة الثانية",
        "ورقة عمل: التفاعلات الكيميائية",
        "الواجب المنزلي للأسبوع الرابع",
        "بنك الأسئلة والمسائل الشامل",
        "مسائل وتدريبات حسابية",
        "نماذج امتحانات نهاية الفصل الدراسي",
        "تقويم الدرس ومتابعة الفهم"
      ];

      for (const heading of exerciseHeadings) {
        const result = classifyPageType("", heading);
        assert.equal(
          result,
          "exercise",
          `Expected heading "${heading}" to be classified as 'exercise'`
        );
      }
    });

    it("classifies explicit study headings as 'study'", () => {
      const studyHeadings = [
        "شرح درس الجدول الدوري الحديث",
        "نص القراءة: قضايا معاصرة ودور التكنولوجيا",
        "قواعد نحوية: الفاعل والمفعول به وعلامات الإعراب",
        "المفاهيم العلمية والقوانين الفيزيائية المنظمة",
        "كلماتي الجديدة ومعاني المفردات اللغوية",
        "أهداف الدرس والتمهيد العلمي"
      ];

      for (const heading of studyHeadings) {
        const result = classifyPageType("متن الشرح والتوضيح للمفاهيم الأساسية المقررة.", heading);
        assert.equal(
          result,
          "study",
          `Expected heading "${heading}" to be classified as 'study'`
        );
      }
    });
  });

  describe("Content-Based Classification (No Heading or Neutral Heading)", () => {
    it("detects exercise pages based on Arabic question stems and fill-in-the-blank dots", () => {
      const exercisePageContent = `
السؤال الأول: اختر الإجابة الصحيحة مما بين القوسين:
1. يتشبع مستوى الطاقة الثاني بـ ......... إلكترونات ( 2 - 8 - 18 - 32 ).
2. وحدة قياس الكثافة هي: ( جم/سم3 - نيوتن - متر - جول ).

السؤال الثاني: علل لما يأتي:
1. الذرة متعادلة كهربياً في حالتها العادية.
2. لا تنطبق العلاقة 2n^2 على المستويات الأعلى من المستوى الرابع.

أكمل العبارات الآتية:
تتركب الذرة من نواة تدور حولها ......... بشحنة سالبة.
`;
      const result = classifyPageType(exercisePageContent);
      assert.equal(result, "exercise");
    });

    it("detects exercise pages with true/false and short answer questions", () => {
      const trueFalseContent = `
ضع علامة (✓) أو علامة (✗) أمام العبارات الآتية:
1. الفلزات موصلة جيدة للحرارة والكهرباء. (   )
2. البروتونات جسيمات سالبة الشحنة تدور حول النواة. (   )
3. صوب ما تحته خط: يعتبر الحديد من اللافلزات النشطة.

بم تفسر:
اختلاف كتل ذرات العناصر المختلفة عن بعضها البعض؟
اكتب المصطلح العلمي الدال على كل عبارة:
أصغر وحدة بنائية للمادة يمكن أن تشترك في التفاعلات الكيميائية.
`;
      const result = classifyPageType(trueFalseContent);
      assert.equal(result, "exercise");
    });

    it("classifies pure narrative educational explanation as 'study'", () => {
      const explanationContent = `
تعتبر الذرة هي وحدة البناء الأساسية للمادة، وتتكون من نواة مركزية ثقيلة تتركز فيها معظم كتلة الذرة.
وتحتوي النواة على نوعين من الجسيمات: بروتونات موجبة الشحنة الكهربائية، ونيوترونات متعادلة الشحنة.
بينما تدور الإلكترونات سالبة الشحنة حول النواة في مستويات طاقة محددة بسرعة فائقة تقارب سرعة الضوء.
نستنتج من ذلك أن كتلة الإلكترون ضئيلة جداً إذا ما قورنت بكتلة كل من البروتون والنيوترون، ولذلك يمكن إهمال كتلتها عند حساب الكتلة الذرية للعنصر.
وهذه الخاصية هي التي تمنح العناصر استقرارها وتفاعلاتها الكيميائية المتنوعة في الطبيعة.
`;
      const result = classifyPageType(explanationContent);
      assert.equal(result, "study");
    });
  });

  describe("Edge Cases and Robustness", () => {
    it("defaults to 'study' for empty or whitespace-only inputs", () => {
      assert.equal(classifyPageType(""), "study");
      assert.equal(classifyPageType("   \n\t  "), "study");
      assert.equal(classifyPageType("", ""), "study");
    });

    it("overrides a neutral study heading if content is overwhelmingly exercise questions", () => {
      const mixedContent = `
السؤال الأول: اختر الإجابة الصحيحة: 1. ما هو ناتج التفاعل؟
السؤال الثاني: ضع علامة (✓) أو (✗) أمام العبارات الآتية.
السؤال الثالث: علل لما يأتي مع ذكر السبب العلمي بالتفصيل.
أكمل ما يأتي: تتكون المادة من وحدات صغيرة تسمى ..........
`;
      // Even if heading is general reading
      const result = classifyPageType(mixedContent, "قراءة وتطبيق");
      assert.equal(result, "exercise");
    });
  });

  describe("Compound Headings & Context Precedence (Remediation Iteration 2)", () => {
    it("classifies compound objectives heading as 'study' when text contains explanation without 3+ questions", () => {
      const introContent = `
في هذا الدرس نتعرف على المفاهيم الأساسية للطاقة وتحولاتها في الطبيعة، وتطبيقات قانون بقاء الطاقة في حياتنا اليومية.
يسعى الطالب إلى استيعاب دور الطاقة الحركية وطاقة الوضع في تفسير حركة الأجسام في مساراتها المختلفة.
`;
      const result = classifyPageType(introContent, "أهداف الدرس والتمارين التمهيدية");
      assert.equal(result, "study", "Compound heading with lesson goals must be classified as 'study'");
    });

    it("classifies health and physical fitness headings as 'study' rather than academic exercises", () => {
      const fitnessContent = `
تسهم الرياضة اليومية وممارسة التمارين البدنية بانتظام في تعزيز صحة القلب والأوعية الدموية وتنشيط الدورة الدموية.
إن الحفاظ على اللياقة البدنية يعزز المناعة ويمنح الجسم الطاقة والحيوية اللازمة لممارسة الأنشطة الذهنية والبدنية بكفاءة.
`;
      const result = classifyPageType(fitnessContent, "فوائد الرياضة والتمارين البدنية");
      assert.equal(result, "study", "Physical fitness content must be classified as 'study' not scholastic 'exercise'");
    });

    it("classifies reading passage with light comprehension questions as 'study' when explanatory content dominates", () => {
      const readingPassage = `
كانت الزراعة في مصر القديمة عماد الحضارة الإنسانية على ضفاف وادي النيل الخصيب.
اعتمد الفلاح المصري على دورة فيضان النيل السنوية لتجديد خصوبة التربة وتغذية المحاصيل الاستراتيجية كالقمح والشعير والكتان.
وقد ابتكر المصريون القدماء أقدم شبكات الري والصرف واستخدموا الشادوف والسواقي لتنظيم توزيع المياه بعدالة.

س1: ما هو الأساس الذي قامت عليه الزراعة في مصر القديمة؟
`;
      const result = classifyPageType(readingPassage, "نص قراءة مع أسئلة استيعاب");
      assert.equal(result, "study", "Reading passage with 1 comprehension question must be classified as 'study'");
    });

    it("classifies compound heading as 'exercise' if body text contains 3 or more explicit question patterns", () => {
      const worksheetContent = `
السؤال الأول: اختر الإجابة الصحيحة مما بين القوسين:
1. وحدة قياس السرعة هي: (م/ث - كجم - نيوتن).
السؤال الثاني: ضع علامة (✓) أو (✗) أمام العبارات الآتية.
السؤال الثالث: علل لما يأتي: تعتبر حركة القطار من أمثلة الحركة في اتجاه واحد.
أكمل العبارات الآتية: المسافة المقطوعة خلال وحدة الزمن تسمى ..........
`;
      const result = classifyPageType(worksheetContent, "أهداف الدرس والتمارين التمهيدية");
      assert.equal(result, "exercise", "Compound heading with 3+ question patterns must be classified as 'exercise'");
    });
  });
});
