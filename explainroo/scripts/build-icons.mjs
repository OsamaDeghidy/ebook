#!/usr/bin/env node
// Builds engine/icons/lucide.json from the lucide-static dev dependency.
// Every icon becomes a list of SVG path strings in a 24x24 box, so the engine
// can draw it with Path2D (clean looks) or rough.js (hand-drawn looks).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'node_modules', 'lucide-static');
const nodes = JSON.parse(fs.readFileSync(path.join(src, 'icon-nodes.json'), 'utf8'));
const tags = JSON.parse(fs.readFileSync(path.join(src, 'tags.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8')).version;

const n = (v) => Number(v ?? 0);
const r3 = (v) => Math.round(v * 1000) / 1000;

function ellipsePath(cx, cy, rx, ry) {
  return `M${r3(cx - rx)} ${r3(cy)}a${r3(rx)} ${r3(ry)} 0 1 0 ${r3(2 * rx)} 0a${r3(rx)} ${r3(ry)} 0 1 0 ${r3(-2 * rx)} 0`;
}

function rectPath(x, y, w, h, rx, ry) {
  if (!rx && !ry) return `M${x} ${y}h${w}v${h}h${-w}Z`;
  rx = Math.min(rx || ry, w / 2);
  ry = Math.min(ry || rx, h / 2);
  return `M${r3(x + rx)} ${y}h${r3(w - 2 * rx)}a${rx} ${ry} 0 0 1 ${rx} ${ry}v${r3(h - 2 * ry)}a${rx} ${ry} 0 0 1 ${-rx} ${ry}h${r3(-(w - 2 * rx))}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}v${r3(-(h - 2 * ry))}a${rx} ${ry} 0 0 1 ${rx} ${-ry}Z`;
}

function pointsPath(points, close) {
  const p = String(points).trim().split(/[\s,]+/).map(Number);
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length; i += 2) d += `L${p[i]} ${p[i + 1]}`;
  return close ? d + 'Z' : d;
}

function toPath([tag, a]) {
  switch (tag) {
    case 'path': return a.d;
    case 'circle': return ellipsePath(n(a.cx), n(a.cy), n(a.r), n(a.r));
    case 'ellipse': return ellipsePath(n(a.cx), n(a.cy), n(a.rx), n(a.ry));
    case 'rect': return rectPath(n(a.x), n(a.y), n(a.width), n(a.height), n(a.rx), n(a.ry));
    case 'line': return `M${n(a.x1)} ${n(a.y1)}L${n(a.x2)} ${n(a.y2)}`;
    case 'polyline': return pointsPath(a.points, false);
    case 'polygon': return pointsPath(a.points, true);
    default: throw new Error(`unsupported lucide element <${tag}>`);
  }
}

const out = {};
for (const [name, list] of Object.entries(nodes)) out[name] = list.map(toPath);

// Older and alternative names ship as extra SVG files with the same drawing.
const body = (svg) => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/\s+/g, ' ').trim();
const byBody = new Map();
for (const name of Object.keys(out)) {
  const file = path.join(src, 'icons', `${name}.svg`);
  if (fs.existsSync(file)) byBody.set(body(fs.readFileSync(file, 'utf8')), name);
}
const aliases = {};
for (const f of fs.readdirSync(path.join(src, 'icons'))) {
  const name = f.replace(/\.svg$/, '');
  if (out[name]) continue;
  const target = byBody.get(body(fs.readFileSync(path.join(src, 'icons', f), 'utf8')));
  if (target) aliases[name] = target;
}
const outTags = {};
for (const name of Object.keys(out)) outTags[name] = tags[name] || [];

const dir = path.join(root, 'engine', 'icons');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'lucide.json'), JSON.stringify({ version, icons: out, aliases }));
fs.writeFileSync(path.join(dir, 'lucide-tags.json'), JSON.stringify(outTags));
fs.copyFileSync(path.join(src, 'LICENSE'), path.join(dir, 'LICENSE-lucide.txt'));
console.log(`wrote ${Object.keys(out).length} icons and ${Object.keys(aliases).length} aliases (lucide ${version})`);
