import { sanitizeMathText } from './sanitizeMathText';

/**
 * Sanitizes educational book content:
 * - Strips OCR / scanning artifacts (▲, ▼, ◆, ◇, ■, □, ●, ○, ★, ☆, ►, ◄)
 * - Strips parenthetical side notes / exam tags like (دور أول 2022), (امتحان 2021)
 * - Converts math words to symbols and LaTeX via sanitizeMathText
 * - Strips dangling raw hash tags, broken table dashes, stray asterisks, and page number markers
 */
export function sanitizeBookContent(text: string | undefined): string {
  if (!text) return '';
  // 0. Protect LaTeX commands (like \neq) by only replacing \n when NOT followed by letters
  let cleaned = text.replace(/\\n(?![a-zA-Z])/g, '\n').trim();

  // Repair corrupted \neq that became "eq 0" or "b eq 0"
  cleaned = cleaned.replace(/\b([a-zA-Z0-9]+)\s+eq\s+([0-9]+)/g, '$1 \\neq $2');
  cleaned = cleaned.replace(/\beq\s+0\b/g, '\\neq 0');

  // 1. Strip OCR artifact glyphs and bullet decorators
  cleaned = cleaned.replace(/[▲▼◆◇■□●○★☆►◄]/g, '');

  // 1.1 Strip obsolete artificial pedagogical wrappers & fake CLI lab blocks
  cleaned = cleaned.replace(/^>\s*###?\s*📜\s*نص المذكرة الأصلي المعتمد[^\n]*\n?/gm, '');
  cleaned = cleaned.replace(/^>\s*نص المذكرة الأصلي المعتمد[^\n]*\n?/gm, '');
  cleaned = cleaned.replace(/^###?\s*🎯\s*الهدف الإجرائي والبيئة البرمجية[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');
  cleaned = cleaned.replace(/^###?\s*🛠️\s*المسار العملي التطبيقي[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');
  cleaned = cleaned.replace(/^###?\s*💻\s*شفرة الكود[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');
  cleaned = cleaned.replace(/^###?\s*⌨️?\s*معمل التحدي البرمجي[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');
  cleaned = cleaned.replace(/^###?\s*⚡\s*فخاخ تقنية وأخطاء تشغيلية[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');
  cleaned = cleaned.replace(/^###?\s*💡\s*كبسولة سر التفوق[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');
  cleaned = cleaned.replace(/^###?\s*🎯\s*بنك الأسئلة والمسائل[^\n]*\n[\s\S]*?(?=\n###?|\n##|$)/gmi, '');

  // 1.2 Strip artificial numbered pedagogical section headers
  cleaned = cleaned.replace(/^[#\s]*[🎯🎒]\s*أولاً[:\s]+نواتج[^\n]*\n[\s\S]*?(?=(?:^[#\s]*[💡🖥️📖🔍]\s*ثانياً)|$)/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*[💡🖥️📖🔍]\s*ثانياً[:\s]+[^\n]*\n/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*[📌⚙️🗺️⚖️]\s*ثالثاً[:\s]+[^\n]*\n/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*[📝🎮✏️🏛️]\s*رابعاً[:\s]+[^\n]*\n/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*[🚨🌟]\s*خامساً[:\s]+[^\n]*\n/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*[📊]\s*سادساً[:\s]+[^\n]*\n/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*(?:أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً)[:\s]+(?:نواتج التعلّم|المعمارية والمفاهيم|الشرح المفاهيمي|المبادئ والقواعد|تطبيقات عملية|أخطاء شائعة|مصفوفة المقارنة|ملخص الأوامر)[^\n]*\n/gmi, '');

  // 2. Strip standalone page numbers and footer markers
  cleaned = cleaned.replace(/^[ \t]*(?:ص|صفحة|Page|P\.)\s*\d+[ \t]*$/gmi, '');
  cleaned = cleaned.replace(/^[ \t]*[-—~_]{2,}\s*\d+\s*[-—~_]{2,}[ \t]*$/gm, '');
  cleaned = cleaned.replace(/\[\s*\d+\s*\]/g, ''); // [12] page tags

  // 3. Strip exam year tags / parenthetical exam noise e.g. (دور أول 2023), (ثانوية عامة 2022)
  cleaned = cleaned.replace(/\s*\((?:دور\s*(?:أول|ثان|ثاني)|امتحان\s*\d{4}|ثانوية\s*عامة|نماذج\s*الوزارة)[^)]*\)/gi, '');

  // 4. Strip ONLY pure English glossary transliteration noise e.g. (Deductive Method)
  // WITHOUT deleting math symbols, chemical states like (s), (l), (aq), or variables like (x), (y), (f)
  cleaned = cleaned.replace(/([\u0600-\u06FF]+)\s*\([a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,})*\)/g, '$1');

  // 4.1 🛡️ STRUCTURAL PREAMBLE & FLUFF PRUNING (استئصال الشوائب الدلالية والكتل التمهيدية)
  // Strips Learning Outcomes, Unit Intros, Objectives, Previous Skills, Discussion Prompts
  cleaned = cleaned.replace(/^[#\s]*(?:مخرجات التعلّم|أهداف الدرس|أهداف الوحدة|مقدمة الوحدة|التهيئة الحافزة|فكرة ونقاش|فكرة ومناقشة|مهارات سابقة|التقويم التشخيصي|توجيهات المعلم|إرشادات ولي الأمر)[:\s]*[^\n]*\n[\s\S]*?(?=\n#{1,3}\s+[^\n]+|\n\n[^\*\-\d]|$)/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*مُ?صطلحات الدرس[:\s]*\n(?:\s*[\*\-]\s*[^\n]+\n){2,}/gmi, '');
  cleaned = cleaned.replace(/^[#\s]*في نهاية الدرس يجب أن يكون التلميذ[\s\S]*?(?=\n#{1,3}\s+[^\n]+|\n\n[^\*\-\d]|$)/gmi, '');

  // 5. Clean math text and equations
  cleaned = sanitizeMathText(cleaned);

  // 6. Strip dangling header hashes like "### #" or "## #"
  cleaned = cleaned.replace(/^([#]{1,6})\s*[#\*\-_]+\s*$/gm, '');
  cleaned = cleaned.replace(/^([#]{1,6})\s*#+\s+/gm, '$1 ');

  // 7. Remove raw callout tags like [!IMPORTANT], [!NOTE]
  cleaned = cleaned.replace(/\[!(IMPORTANT|WARNING|TIP|NOTE)\]/gi, '');

  // 8. Clean broken markdown table separators
  cleaned = cleaned.replace(/^[ \t]*\|?[-:\s|]{3,}\|?[ \t]*$/gm, '');

  // 8.1 Strip solitary dot, bullet, or stray punctuation lines (e.g., "." or "•" or "·")
  cleaned = cleaned.replace(/^[ \t]*[\.·•\-–—*#\u2022\u2023\u25E6\u2043\u2219][ \t]*$/gm, '');

  // 8.2 Strip introductory lesson objectives checklist when redundant with lesson body
  cleaned = cleaned.replace(/^[#\s]*أهداف الدرس[:\s]+في نهاية الدرس يجب أن يكون[\s\S]*?(?=\n#{1,3}|\n\n[^\*\-\d]|$)/gmi, '');

  // 9. Normalize multiple consecutive blank lines to double newline
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
