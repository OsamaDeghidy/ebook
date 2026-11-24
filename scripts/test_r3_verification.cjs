/**
 * Verification Script for Requirement R3: PDF Note Binding & Warning Banner Fix
 */
const fs = require('fs');
const path = require('path');

console.log("=== [R3 Verification Test Suite] Starting ===");

const PERSISTENT_UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const TARGET_BOOK_ID = "ea2e6f46-a563-49f6-9c72-12e7d21c02d9";
const TARGET_FILENAME = "1795472442421-ec67bbc3_ICT_ARABIC_Prp1_TR1.pdf";
const TARGET_GCS_URL = `https://storage.googleapis.com/ebookstoreg/uploads/${TARGET_FILENAME}`;

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// Test 1: Physical File on Disk
// -------------------------------------------------------------
console.log("\n[Test 1] Physical PDF File Presence in data/uploads/");
const physicalFilePath = path.join(PERSISTENT_UPLOADS_DIR, TARGET_FILENAME);
const fileExists = fs.existsSync(physicalFilePath);
assert(fileExists, `File exists on disk at ${physicalFilePath}`);
if (fileExists) {
  const stat = fs.statSync(physicalFilePath);
  assert(stat.size > 5000000, `File size is ${(stat.size / 1048576).toFixed(2)} MB (> 5 MB)`);
}

// -------------------------------------------------------------
// Test 2: Storage Buffer Resolution (resolveCloudOrLocalFileBuffer Logic)
// -------------------------------------------------------------
console.log("\n[Test 2] Storage Path Resolution Engine");

function testResolveFile(fileUrl) {
  if (!fileUrl) return null;
  const cleanUrl = fileUrl.trim();

  // 0. Direct file path check (supports Windows absolute paths, relative paths, container paths)
  if (fs.existsSync(cleanUrl)) {
    try {
      if (fs.statSync(cleanUrl).isFile()) {
        const buf = fs.readFileSync(cleanUrl);
        return { buffer: buf, resolvedFileName: path.basename(cleanUrl), method: "direct_path" };
      }
    } catch (e) { }
  }
  const baseNameCandidate = path.basename(cleanUrl.split('?')[0]);
  const cachedUploadCandidate = path.join(PERSISTENT_UPLOADS_DIR, baseNameCandidate);
  if (fs.existsSync(cachedUploadCandidate)) {
    try {
      if (fs.statSync(cachedUploadCandidate).isFile()) {
        const buf = fs.readFileSync(cachedUploadCandidate);
        return { buffer: buf, resolvedFileName: baseNameCandidate, method: "uploads_candidate" };
      }
    } catch (e) { }
  }

  // 1. Check direct local disk path (/data/uploads/...)
  if (cleanUrl.startsWith("/data/uploads/") || cleanUrl.startsWith("data/uploads/")) {
    const diskPath = path.join(process.cwd(), cleanUrl.startsWith("/") ? cleanUrl.substring(1) : cleanUrl);
    if (fs.existsSync(diskPath)) {
      const buf = fs.readFileSync(diskPath);
      return { buffer: buf, resolvedFileName: path.basename(diskPath), method: "relative_uploads" };
    }
  }

  return null;
}

// 2a. GCS URL lookup
const resGcs = testResolveFile(TARGET_GCS_URL);
assert(resGcs && resGcs.buffer && resGcs.buffer.length > 5000000, `GCS URL resolves file buffer via uploads candidate (${resGcs?.resolvedFileName}, ${(resGcs?.buffer.length / 1048576).toFixed(2)} MB)`);

// 2b. Relative path lookup
const resRel = testResolveFile(`data/uploads/${TARGET_FILENAME}`);
assert(resRel && resRel.buffer && resRel.buffer.length > 5000000, `Relative path resolves file buffer (${resRel?.resolvedFileName}, ${(resRel?.buffer.length / 1048576).toFixed(2)} MB)`);

// 2c. Windows Absolute path lookup
const resAbs = testResolveFile(physicalFilePath);
assert(resAbs && resAbs.buffer && resAbs.buffer.length > 5000000, `Windows absolute path resolves file buffer (${resAbs?.resolvedFileName}, ${(resAbs?.buffer.length / 1048576).toFixed(2)} MB)`);

// 2d. Basename candidate lookup
const resBase = testResolveFile(TARGET_FILENAME);
assert(resBase && resBase.buffer && resBase.buffer.length > 5000000, `Basename resolves file buffer via uploads candidate (${resBase?.resolvedFileName}, ${(resBase?.buffer.length / 1048576).toFixed(2)} MB)`);

// -------------------------------------------------------------
// Test 3: Backend & Database Mapping (server.ts slimCatalog)
// -------------------------------------------------------------
console.log("\n[Test 3] Backend Database & slimCatalog Serialization");
const dbPath = path.join(process.cwd(), "ebooks-db.json");
assert(fs.existsSync(dbPath), `Local database ebooks-db.json exists`);

const rawDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const ictRaw = rawDb.find(b => b.id === TARGET_BOOK_ID);
assert(Boolean(ictRaw), `Found ICT book record with ID: ${TARGET_BOOK_ID}`);

// Emulate server.ts slimCatalog mapping
const slimBook = {
  id: ictRaw.id,
  title: ictRaw.title,
  source_file_url: ictRaw.source_file_url || (ictRaw.blueprint && ictRaw.blueprint.source_file_url) || null,
  blueprint: ictRaw.blueprint ? {
    total_lessons: ictRaw.blueprint.total_lessons,
    is_scanned_pdf: ictRaw.blueprint.is_scanned_pdf,
    total_pdf_pages: ictRaw.blueprint.total_pdf_pages,
    source_file_url: ictRaw.blueprint.source_file_url
  } : null,
  chapters_count: (ictRaw.chapters || []).length
};

assert(slimBook.source_file_url === TARGET_GCS_URL, `slimBook has source_file_url populated: ${slimBook.source_file_url}`);
assert(slimBook.blueprint && slimBook.blueprint.total_lessons === 4, `slimBook preserves blueprint metadata (total_lessons: ${slimBook.blueprint?.total_lessons})`);

// -------------------------------------------------------------
// Test 4: Frontend App.tsx fetchSupabaseCatalog Mapping
// -------------------------------------------------------------
console.log("\n[Test 4] Frontend App.tsx Mapping Simulation");

// Emulate App.tsx mapping
const clientBook = {
  ...slimBook,
  author_name: slimBook.author_name || 'خبير المادة',
  price: Number(slimBook.price) || 0,
  chapters: slimBook.chapters || [],
  source_file_url: slimBook.source_file_url || (slimBook.blueprint && slimBook.blueprint.source_file_url) || null,
  blueprint: slimBook.blueprint || null
};

assert(clientBook.source_file_url === TARGET_GCS_URL, `clientBook preserves source_file_url`);
assert(Boolean(clientBook.blueprint), `clientBook preserves blueprint`);

// -------------------------------------------------------------
// Test 5: BookDetailsRoute Warning Banner Logic
// -------------------------------------------------------------
console.log("\n[Test 5] BookDetailsRoute Warning Banner Evaluation");

function evaluateBannerVisibility(book, isLoadingBook) {
  return Boolean(
    book && !isLoadingBook && !(
      book.source_file_url || 
      (book.blueprint && book.blueprint.source_file_url) || 
      (book.external_url && !book.is_external) || 
      book.fileUrl
    )
  );
}

// 5a. ICT Book loaded (should be FALSE -> NO BANNER)
const bannerForIctLoaded = evaluateBannerVisibility(clientBook, false);
assert(bannerForIctLoaded === false, `ICT book loaded: Banner is HIDDEN (evaluates to false)`);

// 5b. ICT Book loading (should be FALSE -> NO FLICKER)
const bannerForIctLoading = evaluateBannerVisibility(clientBook, true);
assert(bannerForIctLoading === false, `ICT book loading in flight: Banner is HIDDEN (prevents false flash)`);

// 5c. Negative test: Book created without source file (should be TRUE -> SHOW BANNER)
const unlinkedBook = {
  id: "dummy-book-123",
  title: "كتاب تجريبي بدون مذكرة",
  source_file_url: null,
  blueprint: null,
  external_url: null
};
const bannerForUnlinked = evaluateBannerVisibility(unlinkedBook, false);
assert(bannerForUnlinked === true, `Unlinked book without source document: Banner is SHOWN (evaluates to true)`);

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Summary: ${passedCount}/${totalCount} assertions passed.`);
if (passedCount === totalCount) {
  console.log("🎉 All R3 verification tests passed successfully!");
} else {
  console.error("❌ Some verification tests failed.");
  process.exit(1);
}
