import test from 'node:test';
import assert from 'node:assert/strict';
import { playbackTextIssue } from '../engine/readability.js';

const text = { text: 'SELECT item FROM orders;', size: 24, alpha: 1, x0: 100, y0: 200, x1: 800, y1: 230 };
test('full-HD terminal text needs enlarging for a 480p player', () => {
  assert.equal(playbackTextIssue(text, 1920, 1080, 1920), null);
  assert.match(playbackTextIssue(text, 1920, 1080, 854), /10.7px/);
  assert.equal(playbackTextIssue({ ...text, size: 40 }, 1920, 1080, 854), null);
  assert.equal(playbackTextIssue({ ...text, size: 24 * 2 }, 1920, 1080, 854), null);
});
test('fades and text outside the shot do not trigger playback warnings', () => {
  assert.equal(playbackTextIssue({ ...text, alpha: 0.5 }, 1920, 1080, 854), null);
  assert.equal(playbackTextIssue({ ...text, x0: 2000, x1: 2500 }, 1920, 1080, 854), null);
  assert.match(playbackTextIssue({ ...text, x0: -100 }, 1920, 1080, 854), /enlarge/);
});
test('upscaling a player does not make small source text readable', () => {
  assert.match(playbackTextIssue({ ...text, size: 12 }, 1920, 1080, 3840), /12.0px/);
  for (const w of [0, -1, Infinity, NaN]) assert.throws(() => playbackTextIssue(text, 1920, 1080, w), /positive/);
});
