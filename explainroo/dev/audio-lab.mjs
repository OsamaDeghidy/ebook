#!/usr/bin/env node
// Audio lab: renders test soundtracks with engine/audio in headless Chrome,
// writes WAVs to .scratch/audio/ and measures them with ffmpeg.
//
//   node dev/audio-lab.mjs [--styles warm,upbeat] [--no-spectro] [--skip-long]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.scratch/audio');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const VOICE = path.join(OUT, 'voice.wav');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const shells = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-'))
        .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    : [];
  for (const dir of shells) {
    for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell']) {
      const p = path.join(cache, dir, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) if (fs.existsSync(p)) return p;
  throw new Error('No Chrome found; set CHROME_PATH');
}

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wav': 'audio/wav', '.json': 'application/json', '.html': 'text/html' };

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/__lab') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><meta charset="utf-8"><title>audio lab</title>');
      return;
    }
    const file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function wavSeconds(file) {
  const buf = fs.readFileSync(file);
  const sr = buf.readUInt32LE(24);
  const channels = buf.readUInt16LE(22);
  const bits = buf.readUInt16LE(34);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') return size / (channels * (bits / 8)) / sr;
    off += 8 + size;
  }
  throw new Error('no data chunk');
}

// Renders in the page and returns WAV bytes plus quick stats.
async function render(page, opts) {
  const result = await page.evaluate(async (o) => {
    const m = await import('/engine/audio/soundtrack.js');
    const t0 = performance.now();
    const buf = await m.renderSoundtrack(o);
    const ms = performance.now() - t0;
    let peak = 0;
    let sum = 0;
    let bad = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) {
        const v = d[i];
        if (!Number.isFinite(v)) bad++;
        const a = Math.abs(v);
        if (a > peak) peak = a;
        sum += v * v;
      }
    }
    const wav = new Uint8Array(m.encodeWav(buf));
    let bin = '';
    for (let i = 0; i < wav.length; i += 0x8000) bin += String.fromCharCode.apply(null, wav.subarray(i, i + 0x8000));
    return { b64: btoa(bin), ms, peak, rms: Math.sqrt(sum / (buf.length * buf.numberOfChannels)), bad };
  }, opts);
  return { ...result, wav: Buffer.from(result.b64, 'base64') };
}

function ebur(file, range) {
  const af = [range ? `atrim=start=${range[0]}:end=${range[1]}` : null, 'ebur128=peak=true:framelog=quiet'].filter(Boolean).join(',');
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', af, '-f', 'null', '-'], { encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || '');
  const I = /I:\s+(-?[\d.]+|-inf) LUFS/.exec(text);
  const TP = /Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(text);
  return { lufs: I ? Number(I[1]) : null, truePeak: TP ? Number(TP[1]) : null };
}

function clipped(wav) {
  let n = 0;
  for (let o = 44; o + 1 < wav.length; o += 2) {
    const s = wav.readInt16LE(o);
    if (s >= 32767 || s <= -32768) n++;
  }
  return n;
}

function spectro(file) {
  const png = file.replace(/\.wav$/, '.spectrum.png');
  spawnSync(FFMPEG, ['-hide_banner', '-y', '-i', file, '-lavfi', 'showspectrumpic=s=1400x480:legend=1:scale=log:fscale=log:color=intensity', png]);
  const wave = file.replace(/\.wav$/, '.wave.png');
  spawnSync(FFMPEG, ['-hide_banner', '-y', '-i', file, '-lavfi', 'aformat=channel_layouts=mono,showwavespic=s=1400x240:scale=lin:colors=white', wave]);
  return png;
}

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);
const db = (x) => (x > 0 ? (20 * Math.log10(x)).toFixed(1) : '-inf');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(VOICE)) throw new Error(`Missing ${VOICE}`);
  const vdur = wavSeconds(VOICE);
  const styles = (opt('--styles') || 'warm,upbeat,calm,tech,playful').split(',');
  const DUR = 40;
  const starts = [2, 14, 27];
  const voice = starts.map((start) => ({ url: '/.scratch/audio/voice.wav', start }));
  const voiceSpans = starts.map((s) => ({ start: s, end: s + vdur }));
  const scenes = [{ start: 0, dur: 13 }, { start: 13, dur: 13 }, { start: 26, dur: 14 }];
  const cues = [
    { name: 'pop', t: 2.5 }, { name: 'whoosh', t: 5 }, { name: 'blip', t: 7, pitch: 0 }, { name: 'blip', t: 7.4, pitch: 1 },
    { name: 'blip', t: 7.8, pitch: 2 }, { name: 'swipe', t: 12.6 }, { name: 'scribble', t: 15, dur: 0.8 }, { name: 'ding', t: 20 },
    { name: 'swipe', t: 25.6 }, { name: 'chime', t: 37.2 },
  ];

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: findChrome(), headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const rows = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('pageerror', e.message));
    await page.goto(`${base}/__lab`);

    const save = (name, r) => {
      const file = path.join(OUT, `${name}.wav`);
      fs.writeFileSync(file, r.wav);
      return file;
    };

    // voice reference
    const v = await render(page, { duration: DUR, voice });
    const vFile = save('voice-only', v);
    const vL = ebur(vFile);
    rows.push({ name: 'voice-only', ...vL, ms: v.ms.toFixed(0), peak: db(v.peak), clip: clipped(v.wav) });

    for (const style of styles) {
      const music = { style, seed: 1, volume: 0.5 };
      const bed = await render(page, { duration: DUR, music, scenes });
      const bedFile = save(`${style}-bed`, bed);
      const bedL = ebur(bedFile, [2, 36]);
      const ducked = await render(page, { duration: DUR, music, scenes, voiceSpans });
      const duckedFile = save(`${style}-ducked`, ducked);
      const duckL = ebur(duckedFile, [3, 11]);
      const mix = await render(page, { duration: DUR, voice, voiceSpans, music, scenes, sfx: cues });
      const mixFile = save(style, mix);
      const mixL = ebur(mixFile);
      rows.push({
        name: style, ...mixL, ms: mix.ms.toFixed(0), peak: db(mix.peak), clip: clipped(mix.wav), bad: mix.bad,
        bedLufs: bedL.lufs, bedUnderVoice: (vL.lufs - bedL.lufs).toFixed(1), duckedLufs: duckL.lufs, duckedUnderVoice: (vL.lufs - duckL.lufs).toFixed(1),
      });
      if (!flag('--no-spectro')) {
        spectro(mixFile);
        spectro(bedFile);
      }
    }

    // determinism
    const d1 = await render(page, { duration: DUR, voice, voiceSpans, music: { style: 'warm', seed: 3 }, scenes, sfx: cues });
    const d2 = await render(page, { duration: DUR, voice, voiceSpans, music: { style: 'warm', seed: 3 }, scenes, sfx: cues });
    const d3 = await render(page, { duration: DUR, voice, voiceSpans, music: { style: 'warm', seed: 4 }, scenes, sfx: cues });
    console.log(`determinism: seed3 ${sha(d1.wav)} vs ${sha(d2.wav)} -> ${sha(d1.wav) === sha(d2.wav) ? 'IDENTICAL' : 'DIFFERENT'}; seed4 ${sha(d3.wav)} (${sha(d3.wav) !== sha(d1.wav) ? 'differs as expected' : 'UNEXPECTEDLY SAME'})`);

    // the same render in Node (no browser) should produce the same bytes
    const { renderSoundtrack, encodeWav } = await import('../engine/audio/soundtrack.js');
    const { parseWav, toMono } = await import('../engine/audio/pcm.js');
    const raw = fs.readFileSync(VOICE);
    const w = parseWav(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    const data = toMono(w.channels);
    const nodeBuf = await renderSoundtrack({
      duration: DUR, voice: starts.map((start) => ({ data, sampleRate: w.sampleRate, start })), voiceSpans, music: { style: 'warm', seed: 3 }, scenes, sfx: cues,
    });
    const nodeWav = Buffer.from(encodeWav(nodeBuf));
    console.log(`node vs chrome: ${sha(nodeWav)} vs ${sha(d1.wav)} -> ${sha(nodeWav) === sha(d1.wav) ? 'IDENTICAL' : 'DIFFERENT'}`);

    // each sound effect alone: sample peak
    const names = await page.evaluate(async () => Object.keys((await import('/engine/audio/soundtrack.js')).SFX));
    const sfxRows = [];
    for (const name of names) {
      const r = await render(page, { duration: 2.5, sfx: [{ name, t: 0.2 }] });
      sfxRows.push(`${name}:${db(r.peak)}`);
    }
    console.log('sfx sample peaks dBFS (voice peak is about', db(v.peak), '):', sfxRows.join('  '));
    const sheet = await render(page, { duration: names.length * 1.2 + 1, sfx: names.map((name, i) => ({ name, t: 0.3 + i * 1.2, pitch: i % 5 })) });
    const sheetFile = save('sfx-sheet', sheet);
    if (!flag('--no-spectro')) spectro(sheetFile);
    console.log('sfx sheet order:', names.join(', '));

    // unknown sfx must throw
    const err = await page.evaluate(async () => {
      const m = await import('/engine/audio/soundtrack.js');
      try {
        await m.renderSoundtrack({ duration: 1, sfx: [{ name: 'boing', t: 0 }] });
        return 'no error';
      } catch (e) {
        return e.message;
      }
    });
    console.log('unknown sfx ->', err);

    // long render timing
    if (!flag('--skip-long')) {
      for (const style of ['upbeat', 'warm']) {
        const LONG = 180;
        const longStarts = [];
        for (let s = 1; s < LONG - 10; s += 11) longStarts.push(s);
        const long = await render(page, {
          duration: LONG,
          voice: longStarts.map((start) => ({ url: '/.scratch/audio/voice.wav', start })),
          voiceSpans: longStarts.map((s) => ({ start: s, end: s + vdur })),
          music: { style, seed: 2 },
          scenes: longStarts.map((s, i) => ({ start: s - 0.5 < 0 ? 0 : s - 0.5, dur: 11 })),
          sfx: longStarts.flatMap((s) => [{ name: 'pop', t: s + 1 }, { name: 'whoosh', t: s + 4 }, { name: 'scribble', t: s + 6 }]),
        });
        const f = save(`long-${style}`, long);
        const L = ebur(f);
        console.log(`180 s ${style}: render ${long.ms.toFixed(0)} ms, ${L.lufs} LUFS, TP ${L.truePeak} dBFS, clipped ${clipped(long.wav)}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.table(rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
