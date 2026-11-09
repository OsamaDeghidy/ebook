import test from 'node:test';
import assert from 'node:assert/strict';
import { Stage } from '../engine/stage.js';
import { UI } from '../engine/ui.js';
import { getTheme } from '../engine/themes.js';

Stage.UI = UI;

// Just enough of the browser's DOMMatrix and DOMPoint for the stage's text log.
globalThis.DOMPoint ??= class {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
};
globalThis.DOMMatrix ??= class {
  constructor([a, b, c, d, e, f]) {
    Object.assign(this, { a, b, c, d, e, f });
  }
  transformPoint(p) {
    return new DOMPoint(this.a * p.x + this.c * p.y + this.e, this.b * p.x + this.d * p.y + this.f);
  }
};

// A canvas that records what gets drawn.
function fakeCanvas() {
  const drawn = [];
  const ctx = new Proxy(
    { font: '', fillStyle: '#000', globalAlpha: 1 },
    {
      get(target, key) {
        if (key in target) return target[key];
        if (key === 'drawn') return drawn;
        if (key === 'measureText') return (t) => ({ width: String(t).length * 10 });
        if (key === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, transformPoint: (p) => p });
        if (['fill', 'stroke', 'fillText', 'drawImage', 'fillRect'].includes(key)) return (...args) => drawn.push([key, ...args]);
        return () => {};
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    },
  );
  return ctx;
}

function stageAt(t, texts) {
  const theme = getTheme('clean');
  const engine = {
    theme,
    pen: { draw() {} },
    W: 1920,
    H: 1080,
    safeArea: { x: 0, y: 0, w: 1920, h: 1080, bottom: 1080 },
    config: { brand: null },
    timeline: { pace: 1, duration: 10, frames: 300, fps: 30, width: 1920, height: 1080, scenes: [] },
    fps: 30,
    scale: 1,
    recorder: null,
    textLog: texts,
  };
  const scene = { start: 0, dur: 10, id: 'demo', index: 0, words: [], marks: {}, voice: null, lead: 0 };
  return new Stage(engine, fakeCanvas(), scene, t);
}

test('s.ui draws nothing while its s.group is hidden, before and after', () => {
  const drawnAt = (t) => {
    const texts = [];
    const s = stageAt(t, texts);
    s.group({ at: 2, out: 4, x: 500, y: 300 }, () => {
      s.ui.card(0, 0, 400, 200);
      s.ui.text('Inside the group', 20, 40);
      s.ui.button('Save', 20, 120, 160, 50);
    });
    return { drawn: s.ctx.drawn.length, texts: texts.length };
  };
  assert.deepEqual(drawnAt(0), { drawn: 0, texts: 0 });
  assert.deepEqual(drawnAt(1), { drawn: 0, texts: 0 });
  const visible = drawnAt(3);
  assert.ok(visible.drawn > 0, 'the group draws while it is visible');
  assert.ok(visible.texts >= 2, 'check sees the text while it is visible');
  assert.deepEqual(drawnAt(5), { drawn: 0, texts: 0 });
});

test('a hidden s.ui group still records its sounds', () => {
  const texts = [];
  const s = stageAt(0, texts);
  const events = [];
  s.engine.recorder = { push: (e) => events.push(e) };
  s.group({ at: 2, x: 0, y: 0 }, () => {
    s.ui.panel(0, 0, 100, 100, { at: 2.5, sfx: 'pop' });
  });
  assert.ok(events.some((e) => e.sfx === 'pop' && Math.abs(e.at - 2.5) < 1e-9));
  assert.equal(s.ctx.drawn.length, 0);
});
