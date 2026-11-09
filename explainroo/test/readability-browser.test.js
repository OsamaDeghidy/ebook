import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findChrome } from '../src/browser.js';
import { loadProject } from '../src/project.js';
import { withEngine } from '../src/pipeline.js';

let chrome;
try { chrome = findChrome(); } catch {}
test('playback check uses camera zoom and ignores the half-size QA canvas', { skip: !chrome }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'explainroo-readability-'));
  try {
    fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ theme: 'clean', captions: false, music: false, sfx: false }));
    fs.writeFileSync(path.join(dir, 'script.md'), '## demo\nA query.');
    fs.writeFileSync(path.join(dir, 'scenes.js'), `export default { demo(s) {
      s.camera([{ at: 1, x: 960, y: 540, zoom: 2, dur: 0.1 }]);
      s.ui.text('SELECT item FROM orders;', 800, 500, {size:24});
    } };`);
    const project = loadProject(dir);
    const timeline = { pace: 1, duration: 2, frames: 60, fps: 30, width: 1920, height: 1080, transitionSeconds: 0,
      scenes: [{ id: 'demo', index: 0, start: 0, dur: 2, words: [], marks: {}, voice: null, lead: 0, transition: 'none' }] };
    for (const scale of [0.5, 1]) {
      await withEngine(project, timeline, { scale }, async page => {
        const issues = await page.evaluate(() => window.explainroo.check(0.25, 854));
        const warnings = issues.filter(i => i.message.includes('player width'));
        assert.equal(warnings.length, 1);
        assert.equal(warnings[0].t, 0);
        assert.match(warnings[0].message, /10.7px/);
        const normal = await page.evaluate(() => window.explainroo.check(0.25));
        assert.equal(normal.some(i => i.message.includes('player width')), false);
      });
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
