const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'ebooks-db.json');
if (!fs.existsSync(dbPath)) {
  console.log('No ebooks-db.json found');
  process.exit(0);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.forEach(b => {
  console.log('Book ID:', b.id, '| Title:', b.title, '| Offset:', b.page_offset);
  (b.chapters || []).forEach((c, idx) => {
    console.log(`  Ch[${idx}]: "${c.title}" | start_page: ${c.start_page} | end_page: ${c.end_page}`);
    console.log(`    Pages (${(c.pages || []).length}):`, (c.pages || []).map(p => `p${p.pageNumber}(${p.pageType || 'none'})`).join(', '));
    console.log(`    Exercises: ${(c.exercises || []).length}`);
    if (c.exercises && c.exercises.length > 0) {
      console.log(`      First Ex:`, c.exercises[0].question_text.substring(0, 60));
    }
  });
});
