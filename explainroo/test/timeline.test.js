import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScript } from '../src/script.js';
import { normalizeConfig } from '../src/project.js';
import { buildTimeline } from '../src/timeline.js';

function project(src, cfg = {}) {
  return { config: normalizeConfig(cfg), script: parseScript(src) };
}

test('scene length is lead + voice + hold, snapped to frames', () => {
  const p = project('## a\nHi.\n\n## b {min=4}\n', { fps: 30, lead: 0.3, hold: 0.5, end: 1 });
  const tl = buildTimeline(p, { a: { duration: 1.234, words: [{ text: 'Hi.', start: 0, end: 1.2 }], marks: {}, chunks: [{ start: 0, end: 1.234 }] } });
  assert.equal(tl.scenes[0].start, 0);
  assert.equal(tl.scenes[0].dur, Math.round((0.3 + 1.234 + 0.5) * 30) / 30);
  assert.equal(tl.scenes[1].start, tl.scenes[0].dur);
  assert.equal(tl.scenes[1].dur, 5);
  assert.equal(tl.scenes[0].words[0].start, 0.3);
  assert.equal(tl.frames, Math.round(tl.duration * 30));
  assert.equal(tl.voiceSpans.length, 1);
});

test('config validation gives useful errors', () => {
  assert.throws(() => normalizeConfig({ theme: 'neon' }), /theme must be one of/);
  assert.throws(() => normalizeConfig({ voice: 'nobody' }), /explainroo voices/);
  assert.throws(() => normalizeConfig({ colour: 'red' }), /unknown setting/);
  assert.equal(normalizeConfig({ size: '9:16' }).captions, true);
  assert.equal(normalizeConfig({}).captions, false);
  assert.equal(normalizeConfig({ theme: 'chalk' }).music.style, 'calm');
  assert.equal(normalizeConfig({ music: false }).music, null);
});
