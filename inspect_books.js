const fs = require('fs');
const data = JSON.parse(fs.readFileSync('ebooks-db.json', 'utf8'));
console.log('Books count:', data.length);
data.forEach((b, i) => {
  const pagesCount = b.chapters ? b.chapters.reduce((acc, c) => acc + (c.pages ? c.pages.length : 0), 0) : 0;
  const videosCount = b.chapters ? b.chapters.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0) : 0;
  console.log(`${i+1}: "${b.title}" (ID: ${b.id}) | Chapters: ${b.chapters ? b.chapters.length : 0} | Pages: ${pagesCount} | Videos: ${videosCount} | source_file_url: ${b.source_file_url || 'NONE'}`);
});
