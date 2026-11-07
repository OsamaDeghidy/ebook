/**
 * Sanitizes math expressions: converts written words to proper math symbols,
 * wraps mathematical equations in LaTeX notation ($...$ and $$...$$),
 * and converts Arabic/Eastern digits in math contexts to Western digits.
 */
export function sanitizeMathText(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Math words to symbols (in mathematical context)
  res = res.replace(/أكبر من أو يساوي/g, '≥');
  res = res.replace(/أصغر من أو يساوي/g, '≤');
  res = res.replace(/أكبر من/g, '>');
  res = res.replace(/أصغر من/g, '<');
  res = res.replace(/لا يساوي/g, '≠');
  res = res.replace(/موجب أو سالب/g, '±');
  res = res.replace(/يساوي أو يكافئ/g, '=');

  // English counterparts if written as words
  res = res.replace(/\bgreater than or equal to\b/gi, '≥');
  res = res.replace(/\bless than or equal to\b/gi, '≤');
  res = res.replace(/\bgreater than\b/gi, '>');
  res = res.replace(/\bless than\b/gi, '<');
  res = res.replace(/\bnot equal to\b/gi, '≠');
  res = res.replace(/\bplus or minus\b/gi, '±');

  // 2. Fix inline double dollars inside list items or sentences to single dollars
  // e.g. "1. الاتحاد: $$X \cup Y$$" -> "1. الاتحاد: $X \cup Y$"
  res = res.replace(/([^\n])\s*\$\$([^\$\n]+)\$\$/g, (_m, g1, g2) => `${g1} $${g2}$`);
  res = res.replace(/^(\s*[-*•0-9\.]+\s*[^:\n]+:\s*)\$\$([^\$\n]+)\$\$/gm, (_m, g1, g2) => `${g1}$${g2}$`);

  // 3. Fix unclosed inline double dollar on same line e.g. "$$X \cup Y = ...$"
  res = res.replace(/\$\$([^\$\n]+)\$/g, (_m, g1) => `$${g1}$`);

  // 4. Ensure standalone display math blocks ($$) have proper blank lines around them
  res = res.replace(/([^\n])\n\$\$([\s\S]*?)\$\$\n([^\n])/g, '$1\n\n$$\n$2\n$$\n\n$3');

  // 5. Convert eastern digits inside math blocks $...$ or $$...$$ to western digits
  res = res.replace(/\$([^\$]+)\$/g, (_match, formula) => {
    const westernFormula = formula.replace(/[٠-٩]/g, (d: string) => 
      String.fromCharCode(d.charCodeAt(0) - 1632 + 48)
    );
    return `$${westernFormula}$`;
  });

  return res;
}
