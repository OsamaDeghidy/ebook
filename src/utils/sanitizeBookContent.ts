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

  // 2. Strip standalone page numbers and footer markers
  cleaned = cleaned.replace(/^[ \t]*(?:ص|صفحة|Page|P\.)\s*\d+[ \t]*$/gmi, '');
  cleaned = cleaned.replace(/^[ \t]*[-—~_]{2,}\s*\d+\s*[-—~_]{2,}[ \t]*$/gm, '');
  cleaned = cleaned.replace(/\[\s*\d+\s*\]/g, ''); // [12] page tags

  // 3. Strip exam year tags / parenthetical exam noise e.g. (دور أول 2023), (ثانوية عامة 2022)
  cleaned = cleaned.replace(/\s*\((?:دور\s*(?:أول|ثان|ثاني)|امتحان\s*\d{4}|ثانوية\s*عامة|نماذج\s*الوزارة)[^)]*\)/gi, '');

  // 4. Strip English bracketed tokens in predominantly Arabic paragraphs if redundant
  cleaned = cleaned.replace(/([\u0600-\u06FF]+[^\n()]*)\s*\([a-zA-Z\s\-_0-9\/\.\:]+\)/g, '$1');

  // 5. Clean math text and equations
  cleaned = sanitizeMathText(cleaned);

  // 6. Strip dangling header hashes like "### #" or "## #"
  cleaned = cleaned.replace(/^([#]{1,6})\s*[#\*\-_]+\s*$/gm, '');
  cleaned = cleaned.replace(/^([#]{1,6})\s*#+\s+/gm, '$1 ');

  // 7. Remove raw callout tags like [!IMPORTANT], [!NOTE]
  cleaned = cleaned.replace(/\[!(IMPORTANT|WARNING|TIP|NOTE)\]/gi, '');

  // 8. Clean broken markdown table separators
  cleaned = cleaned.replace(/^[ \t]*\|?[-:\s|]{3,}\|?[ \t]*$/gm, '');

  // 9. Normalize multiple consecutive blank lines to double newline
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
