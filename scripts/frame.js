#!/usr/bin/env node
/*
 * frame.js — config-driven Play Store screenshot framer (part of the `store-screenshots` skill).
 * Frames raw_*.png captures into branded, captioned, Play-sized PNGs (default 1242x2208, ratio 1.78,
 * within Play's 2:1 max). Requires `sharp` in the app (npm i -D sharp).
 *
 * Usage (run from the app root):
 *   node scripts/frame.js                 # frame using store/screenshots/screenshots.config.json (or auto-discover)
 *   node scripts/frame.js --stage         # ALSO copy framed PNGs into fastlane phoneScreenshots
 *   node scripts/frame.js --dir <path>    # screenshots base dir (default: store/screenshots)
 *
 * Config: store/screenshots/screenshots.config.json (all fields optional)
 * {
 *   "brand":        { "from": "#16A34A", "to": "#15803D" },  // header gradient (top -> bottom)
 *   "headlineColor":"#FFFFFF",
 *   "canvas":       { "w": 1242, "h": 2208 },
 *   "cropTopPx":    { "raw_log.png": 74 },                    // per-file status-bar crop before framing
 *   "shots": [
 *     { "file": "raw_today.png", "name": "today", "lines": ["Your whole day,", "in one place"] }
 *   ]
 * }
 * With no config (or no "shots"), every raw_*.png is framed with a Title-cased one-line caption.
 */
let sharp;
try { sharp = require('sharp'); }
catch { console.error('ERROR: missing "sharp". In the app root run:  npm i -D sharp'); process.exit(1); }
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const stage = args.includes('--stage');
const dirArg = (() => { const i = args.indexOf('--dir'); return i >= 0 ? args[i + 1] : null; })();

const DIR = path.resolve(dirArg || path.join('store', 'screenshots'));
const OUT = path.join(DIR, 'framed');
fs.mkdirSync(OUT, { recursive: true });

let cfg = {};
const cfgPath = path.join(DIR, 'screenshots.config.json');
if (fs.existsSync(cfgPath)) {
  try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); }
  catch (e) { console.error('Bad config ' + cfgPath + ': ' + e.message); process.exit(1); }
}

const CW = (cfg.canvas && cfg.canvas.w) || 1242;
const CH = (cfg.canvas && cfg.canvas.h) || 2208;
const FROM = (cfg.brand && cfg.brand.from) || '#16A34A';
const TO = (cfg.brand && cfg.brand.to) || '#15803D';
const HEAD = cfg.headlineColor || '#FFFFFF';
const cropTop = cfg.cropTopPx || {};

let shots = Array.isArray(cfg.shots) ? cfg.shots : null;
if (!shots || !shots.length) {
  shots = fs.readdirSync(DIR)
    .filter((f) => /^raw_.*\.png$/i.test(f))
    .sort()
    .map((f) => {
      const name = f.replace(/^raw_/i, '').replace(/\.png$/i, '');
      return { file: f, name, lines: [name.charAt(0).toUpperCase() + name.slice(1)] };
    });
}
if (!shots.length) { console.error('No shots. Add raw_*.png to ' + DIR + ' or define "shots" in a config.'); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function bgSvg() {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${FROM}"/><stop offset="1" stop-color="${TO}"/></linearGradient></defs>
      <rect width="${CW}" height="${CH}" fill="url(#g)"/></svg>`,
  );
}
function headlineSvg(lines) {
  // Scale the headline with the canvas so larger (tablet) canvases keep
  // the same visual weight as the 1242x2208 default.
  const fs1 = Math.round(CW * 0.0628), lh = Math.round(fs1 * 1.23), top = Math.round(CW * 0.1208);
  const t = (lines || [])
    .map((l, i) => `<text x="${CW / 2}" y="${top + i * lh}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fs1}" fill="${HEAD}" text-anchor="middle">${esc(l)}</text>`)
    .join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}">${t}</svg>`);
}
const roundMask = (w, h, r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
const shadowRect = (w, h, r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#000" fill-opacity="0.45"/></svg>`);

async function frameOne(shot, idx) {
  const raw = path.join(DIR, shot.file);
  if (!fs.existsSync(raw)) { console.log('skip (missing):', shot.file); return null; }

  let srcBuf = fs.readFileSync(raw);
  const ct = cropTop[shot.file];
  if (ct) {
    const m0 = await sharp(srcBuf).metadata();
    srcBuf = await sharp(srcBuf).extract({ left: 0, top: ct, width: m0.width, height: m0.height - ct }).png().toBuffer();
  }
  const meta = await sharp(srcBuf).metadata();

  const topReserve = 360, margin = 110;
  const availH = CH - topReserve - margin, maxW = CW - 2 * 150;
  const scale = Math.min(maxW / meta.width, availH / meta.height);
  const cw = Math.round(meta.width * scale), ch = Math.round(meta.height * scale);
  const cx = Math.round((CW - cw) / 2), cy = topReserve + Math.round((availH - ch) / 2), r = 40;

  const card = await sharp(srcBuf).resize(cw, ch)
    .composite([{ input: roundMask(cw, ch, r), blend: 'dest-in' }]).png().toBuffer();
  const pad = 60;
  const shadow = await sharp(shadowRect(cw, ch, r))
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .blur(28).png().toBuffer();

  const out = path.join(OUT, `${String(idx + 1).padStart(2, '0')}_${shot.name}.png`);
  await sharp(bgSvg()).composite([
    { input: shadow, top: cy - pad + 16, left: cx - pad },
    { input: card, top: cy, left: cx },
    { input: headlineSvg(shot.lines), top: 0, left: 0 },
  ]).png().toFile(out);
  console.log('wrote', path.relative(process.cwd(), out), `(${cw}x${ch} card)`);
  return out;
}

(async () => {
  const made = [];
  for (let i = 0; i < shots.length; i++) { const o = await frameOne(shots[i], i); if (o) made.push(o); }
  console.log(`done — ${made.length}/${shots.length} framed (${CW}x${CH})`);
  if (stage && made.length) {
    const dest = path.join('fastlane', 'metadata', 'android', 'en-US', 'images', 'phoneScreenshots');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of made) fs.copyFileSync(f, path.join(dest, path.basename(f)));
    console.log('staged', made.length, 'screenshot(s) ->', dest);
  } else if (made.length) {
    console.log('tip: re-run with --stage to copy into fastlane phoneScreenshots');
  }
})().catch((e) => { console.error(e); process.exit(1); });
