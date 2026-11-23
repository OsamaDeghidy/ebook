const fs = require('fs');
const path = require('path');

function createMinimalPdf(text) {
  const contentStream = `BT\n/F1 12 Tf\n50 720 Td\n(${text.replace(/[\(\)\\]/g, '')}) Tj\nET`;
  const streamLength = Buffer.byteLength(contentStream, 'utf-8');
  
  let pdf = `%PDF-1.4\n`;
  const offsets = [];

  offsets.push(Buffer.byteLength(pdf, 'utf-8'));
  pdf += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

  offsets.push(Buffer.byteLength(pdf, 'utf-8'));
  pdf += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

  offsets.push(Buffer.byteLength(pdf, 'utf-8'));
  pdf += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;

  offsets.push(Buffer.byteLength(pdf, 'utf-8'));
  pdf += `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  offsets.push(Buffer.byteLength(pdf, 'utf-8'));
  pdf += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const xrefOffset = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 6\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}

const dir = path.join(__dirname, 'memos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 1. Minimal valid PDF
fs.writeFileSync(path.join(dir, 'minimal_valid.pdf'), createMinimalPdf('Minimal Synthetic Valid PDF Document for Ebook Tests'));

// 2. Arabic STEM lesson PDF
fs.writeFileSync(path.join(dir, 'arabic_stem_lesson.pdf'), createMinimalPdf('Lesson on Binary Digital Systems and Logic Gates'));

// 3. English CS lesson PDF
fs.writeFileSync(path.join(dir, 'english_cs_lesson.pdf'), createMinimalPdf('Computer Architecture and Logic Gates Half Adder Full Adder'));

// 4. Corrupt PDF fixture for boundary tests
fs.writeFileSync(path.join(dir, 'corrupt.pdf'), Buffer.from('%PDF-1.4\nBROKEN_CORRUPTED_STREAM_CONTENT_INVALID_SYNTAX_###\n'));

// 5. Huge memo fixture (120,000 chars) for boundary tests
const hugeText = 'Digital Logic and Computer Science System Lesson Chunk.\n'.repeat(2200);
fs.writeFileSync(path.join(dir, 'huge_memo.txt'), hugeText, 'utf-8');

console.log('Fixtures generated successfully.');
