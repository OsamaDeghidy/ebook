import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeConfig, loadProject, ProjectError } from '../src/project.js';

test('brand settings for the UI kit are checked', () => {
  const cfg = normalizeConfig({ brand: { accent: '#245cff', background: '#f8f6f1', font: 'Figtree', headline: 'Instrument Serif', logo: 'assets/logo.svg' } });
  assert.equal(cfg.brand.accent, '#245cff');
  assert.equal(normalizeConfig({}).brand, null);
  assert.throws(() => normalizeConfig({ brand: { color: '#245cff' } }), /unknown setting\(s\): color/);
  assert.throws(() => normalizeConfig({ brand: { accent: 'blue' } }), /brand.accent must be a color/);
  assert.throws(() => normalizeConfig({ brand: { logo: '../logo.svg' } }), /assets\/ folder/);
  assert.throws(() => normalizeConfig({ brand: [] }), ProjectError);
  assert.deepEqual(normalizeConfig({ brand: { colors: { text: '#141413', line: '#e8e6dc' } } }).brand.colors, { text: '#141413', line: '#e8e6dc' });
  assert.throws(() => normalizeConfig({ brand: { colors: { ink2: '#000000' } } }), /unknown color "ink2"/);
  assert.throws(() => normalizeConfig({ brand: { colors: { text: 'black' } } }), /brand.colors.text must be a color/);
});

test('a video can bring its own fonts', () => {
  const ok = normalizeConfig({ fonts: [{ family: 'Figtree', src: 'assets/fonts/Figtree-600.woff2', weight: 600 }, { family: 'Inter', src: 'assets/fonts/Inter.woff2', weight: '100 900', style: 'italic' }] });
  assert.equal(ok.fonts.length, 2);
  assert.throws(() => normalizeConfig({ fonts: {} }), /fonts must be a list/);
  assert.throws(() => normalizeConfig({ fonts: [{ family: 'X', src: 'fonts/x.woff2' }] }), /assets\/ folder/);
  assert.throws(() => normalizeConfig({ fonts: [{ family: 'X', src: 'assets/x.png' }] }), /assets\/ folder/);
  assert.throws(() => normalizeConfig({ fonts: [{ family: 'X', src: 'assets/../x.woff2' }] }), ProjectError);
  assert.throws(() => normalizeConfig({ fonts: [{ family: 'X', src: 'assets/x.woff2', weight: 'bold' }] }), /weight/);
  assert.throws(() => normalizeConfig({ fonts: [{ family: 'X', src: 'assets/x.woff2', style: 'oblique' }] }), /style/);
});

test('listed font and logo files must exist', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'explainroo-brand-'));
  fs.writeFileSync(path.join(dir, 'script.md'), '# T\n\n## a\nHello.\n');
  fs.writeFileSync(path.join(dir, 'scenes.js'), 'export default { a() {} };');
  fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify({ brand: { logo: 'assets/logo.svg' } }));
  assert.throws(() => loadProject(dir), /assets\/logo.svg is listed in video.json but the file is missing/);
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'assets', 'logo.svg'), '<svg/>');
  assert.equal(loadProject(dir).config.brand.logo, 'assets/logo.svg');
});
