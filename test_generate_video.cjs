const fs = require('fs');

async function testVideoGeneration() {
  console.log('Sending request to /api/explainroo/generate-lesson-video (videoType: solutions)...');
  const runId = `test_run_${Date.now()}`;
  const payload = {
    bookId: "26063f08-d19e-493b-bf11-b2cce33447a1",
    chapterId: "ch-26063f08-d19e-493b-bf11-b2cce33447a1-2",
    chapterTitle: "المعيار الأول: الرياضيات - أنظمة العد والعمليات عليها",
    aspectRatio: "16:9",
    videoTopic: "حل بنك أسئلة وتدريبات أنظمة العد والتحويل بين الثنائي والعشري",
    videoType: "solutions",
    theme: "paper",
    musicStyle: "warm",
    teacherName: "أسامة",
    subjectName: "تخصص الحاسب الآلي",
    isDraft: false,
    force: true,
    runId
  };

  const startTime = Date.now();
  const res = await fetch('http://localhost:3000/api/explainroo/generate-lesson-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Initial response status:', res.status);
  const data = await res.json();
  console.log('Initial response data:', data);

  const cleanChapterId = "ch_26063f08_d19e_493b_bf11_b2cce33447a1_2";
  let pollCount = 0;
  while (pollCount < 60) {
    await new Promise(r => setTimeout(r, 4000));
    pollCount++;
    const statusRes = await fetch(`http://localhost:3000/api/explainroo/chapter-status/${cleanChapterId}?runId=${runId}`);
    if (statusRes.ok) {
      const s = await statusRes.json();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`[${elapsed}s] Status: ${s.status} | Progress: ${s.progress}% | Step: ${s.step || ''}`);
      if (s.status === 'ready' || (s.progress === 100 && s.videoUrl)) {
        console.log('\nSUCCESS! Video generated:');
        console.log('Video URL:', s.videoUrl);
        console.log('Size MB:', s.sizeMb);
        break;
      }
      if (s.status === 'error' || s.status === 'failed') {
        console.error('\nFAILED! Error:', s.error);
        break;
      }
    }
  }
}

testVideoGeneration().catch(console.error);
