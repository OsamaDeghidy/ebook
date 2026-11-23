const fs = require('fs');

async function testShakhbataVideo() {
  console.log('--- Starting Shakhbata Whiteboard Video Generation Test ---');
  const runId = `shakhbata_run_${Date.now()}`;
  const payload = {
    bookId: "26063f08-d19e-493b-bf11-b2cce33447a1",
    chapterId: "ch-26063f08-d19e-493b-bf11-b2cce33447a1-2",
    chapterTitle: "المعيار الأول: الرياضيات - أنظمة العد والعمليات عليها",
    aspectRatio: "16:9",
    videoTopic: "أسلوب شخبطة: قصة أنظمة العد والتحويل بين الثنائي والعشري واستعارات بصرية واقعية",
    videoType: "shakhbata",
    theme: "paper",
    musicStyle: "warm",
    teacherName: "أسامة",
    subjectName: "تخصص الحاسب الآلي",
    isDraft: false,
    force: true,
    runId
  };

  const startTime = Date.now();
  
  // Start polling in parallel to monitor live progress
  const cleanChapterId = "ch_26063f08_d19e_493b_bf11_b2cce33447a1_2";
  let done = false;
  const poller = (async () => {
    while (!done) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const statusRes = await fetch(`http://localhost:3000/api/explainroo/chapter-status/${cleanChapterId}?runId=${runId}`);
        if (statusRes.ok) {
          const s = await statusRes.json();
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(`[${elapsed}s] Progress: ${s.progress || 0}% | Status: ${s.status || ''} | Step: ${s.step || ''}`);
          if (s.status === 'ready' || (s.progress === 100 && s.videoUrl)) {
            break;
          }
        }
      } catch (err) {}
    }
  })();

  try {
    console.log('Sending request to /api/explainroo/generate-lesson-video with videoType: shakhbata...');
    const res = await fetch('http://localhost:3000/api/explainroo/generate-lesson-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', res.status);
    const result = await res.json();
    done = true;
    await poller;

    console.log('\n========================================');
    console.log('SHAKHBATA VIDEO GENERATION RESULT:');
    console.log('Success:', result.success);
    console.log('Video URL:', result.videoUrl);
    console.log('Video Meta:', JSON.stringify(result.video, null, 2));
    console.log('Elapsed Time:', Math.round((Date.now() - startTime) / 1000), 'seconds');
    console.log('========================================\n');
  } catch (err) {
    done = true;
    await poller;
    console.error('Test execution failed:', err);
  }
}

testShakhbataVideo().catch(console.error);
