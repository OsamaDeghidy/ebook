import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * Normalizes and fixes common AI LaTeX generation errors:
 * - Fixes "b eq 0" -> "b \neq 0"
 * - Fixes "frac{" -> "\frac{"
 * - Fixes "sqrt{" -> "\sqrt{"
 * - Fixes "\sqrt[n]" single argument error -> "\sqrt{n}"
 * - Replaces word symbols with math notation
 */
export function repairLatexSyntax(raw: string): string {
  if (!raw) return '';
  let res = raw;

  // 1. Repair broken "eq 0" / "b eq 0"
  res = res.replace(/\b([a-zA-Z0-9]+)\s+eq\s+([0-9]+)/g, '$1 \\neq $2');
  res = res.replace(/\beq\s+0\b/g, '\\neq 0');

  // 2. Repair missing backslashes for common functions
  res = res.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  res = res.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
  res = res.replace(/\\sqrt\[(\d+)\](?!\s*\{)/g, '\\sqrt{$1}');
  res = res.replace(/(?<!\\)\bsqrt\[(\d+)\](?!\s*\{)/g, '\\sqrt{$1}');
  res = res.replace(/(?<!\\)\bin\b/g, '\\in');
  res = res.replace(/(?<!\\)\bcup\b/g, '\\cup');
  res = res.replace(/(?<!\\)\bcap\b/g, '\\cap');
  res = res.replace(/(?<!\\)\bsubset\b/g, '\\subset');
  res = res.replace(/(?<!\\)\bmid\b/g, '\\mid');
  res = res.replace(/(?<!\\)\bneq\b/g, '\\neq');
  res = res.replace(/(?<!\\)\bpm\b/g, '\\pm');
  res = res.replace(/(?<!\\)\btimes\b/g, '\\times');
  res = res.replace(/(?<!\\)\bdiv\b/g, '\\div');

  // 3. Clean escaped / broken dollar signs like "\$", "\S", "$$" in text
  res = res.replace(/\\S(?=\s|$|[<>=+\-*/])/g, '');
  res = res.replace(/\\sqrt\[(\d+)\]\\?\$/g, '$\\sqrt{$1}$');
  res = res.replace(/\\sqrt\{(\d+)\}\\?\$/g, '$\\sqrt{$1}$');

  // 4. Repair inverted or broken fraction patterns like:
  // "frac{a}\$ b eq 0$$ g $a, b \in Z$ حيث {b}" -> "$\frac{a}{b}$ حيث $a, b \in \mathbb{Z}$ و $b \neq 0$"
  res = res.replace(/(?:\\?frac\{([a-zA-Z0-9]+)\}\\?\$?)([\s\S]*?)(?:\\?\$?\{([a-zA-Z0-9]+)\})/g, (_m, num, mid, den) => {
    return `$\\frac{${num}}{${den}}$ ${mid}`;
  });
  res = res.replace(/\$frac\{([a-zA-Z0-9]+)\}\\?\$\s*\{?([a-zA-Z0-9]+)\}?\$?/g, '$\\frac{$1}{$2}$');

  // 5. Convert Eastern Arabic numerals inside math context to Western digits
  res = res.replace(/\$([^\$]+)\$/g, (_match, inner) => {
    const western = inner.replace(/[٠-٩]/g, (d: string) =>
      String.fromCharCode(d.charCodeAt(0) - 1632 + 48)
    );
    return `$${western}$`;
  });

  return res;
}

/**
 * Renders a single math expression with KaTeX safely wrapped inside an LTR block
 */
export function renderKaTeXSegment(mathStr: string, isBlock: boolean = false): string {
  try {
    return katex.renderToString(mathStr.trim(), {
      displayMode: isBlock,
      throwOnError: false,
      output: 'htmlAndMathml'
    });
  } catch (err) {
    console.warn('[KaTeX Render Warning]:', err);
    return `<span class="font-mono text-indigo-700">${mathStr}</span>`;
  }
}

/**
 * MathRenderer component:
 * Isolates all math formulas into `<span dir="ltr">` elements with KaTeX rendering,
 * preventing bidirectional text inversion in Arabic RTL containers.
 */
export default function MathRenderer({ text, className = '', inline = true }: MathRendererProps) {
  if (!text) return null;

  const repaired = repairLatexSyntax(text);

  // Regex to match $$block math$$ or $inline math$ or explicit LaTeX formulas
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\begin\{[a-z]+\}[\s\S]+?\\end\{[a-z]+\})/g;

  // Check if text contains math delimiters
  if (!mathRegex.test(repaired)) {
    // Check if the entire string is an isolated formula without dollar signs (e.g. "\frac{22}{7}" or "x \in Z")
    if (/\\[a-zA-Z]+|[=<>≠≤≥±]/.test(repaired) && /[\{\}\^_\\]/.test(repaired)) {
      const html = renderKaTeXSegment(repaired, !inline);
      return (
        <span
          dir="ltr"
          className={`inline-block select-text font-mono font-medium mx-1 text-center ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return <span className={className}>{repaired}</span>;
  }

  // Split text by math tokens
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const parserRegex = new RegExp(mathRegex);

  while ((match = parserRegex.exec(repaired)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      // Plain text before math token
      const plainText = repaired.substring(lastIndex, matchIndex);
      parts.push(<span key={`text-${lastIndex}`}>{plainText}</span>);
    }

    const token = match[0];
    const isBlock = token.startsWith('$$') || token.startsWith('\\begin');
    const cleanFormula = token.startsWith('$$') && token.endsWith('$$')
      ? token.slice(2, -2)
      : token.startsWith('$') && token.endsWith('$')
      ? token.slice(1, -1)
      : token;

    const html = renderKaTeXSegment(cleanFormula, isBlock);

    parts.push(
      <span
        key={`math-${matchIndex}`}
        dir="ltr"
        className={`inline-block select-text font-mono font-medium mx-1 align-middle ${isBlock ? 'block my-2 text-center' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

    lastIndex = parserRegex.lastIndex;
  }

  if (lastIndex < repaired.length) {
    parts.push(<span key={`text-${lastIndex}`}>{repaired.substring(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
}
