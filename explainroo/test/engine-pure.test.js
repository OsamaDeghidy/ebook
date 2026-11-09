import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePath, absolutize, serialize, scalePath, splitSubpaths } from '../engine/pathdata.js';
import { parseRich } from '../engine/text.js';
import { highlightLine } from '../engine/code.js';

test('relative paths become absolute and scale', () => {
  assert.equal(serialize(absolutize(parsePath('m2 3 l4 0 v2 h-4 z'))), 'M2 3L6 3L6 5L2 5Z');
  assert.equal(scalePath('M1 1L2 2', 10, 5, 5), 'M15 15L25 25');
});

test('glued arc flags are read correctly', () => {
  const cmds = absolutize(parsePath('M0 0a1 1 0 011 1'));
  assert.deepEqual(cmds[1], { c: 'A', v: [1, 1, 0, 0, 1, 1, 1] });
});

test('subpaths split at every move', () => {
  assert.deepEqual(splitSubpaths('M0 0L1 1m2 2l1 0'), ['M0 0L1 1', 'M3 3L4 3']);
});

test('rich text marks *accent* words', () => {
  const w = parseRich('Every site has an *address*. And *two words* here');
  assert.deepEqual(w.filter((x) => x.accent).map((x) => x.text), ['address.', 'two', 'words']);
});

test('code highlighting finds keywords, strings and comments', () => {
  const t = highlightLine('const x = "hi"; // note', 'js');
  assert.deepEqual(t.map((x) => x.type), ['keyword', 'plain', 'punct', 'plain', 'string', 'punct', 'plain', 'comment']);
});
