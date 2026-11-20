// Leonida Platinum — the hand-in program for the GTA 6 trophy guide (Node 22, standard library only).
//
// The guide itself is plain static files under app/ (index.html, app.js, style.css and
// data/trophies.json with the 55 official trophies and a cited guide for each), plus four
// screenshots of it running in a browser under screenshots/. This program copies both
// folders into the output directory and writes /output/dossier.json with the vendored
// make.fun library, exactly as the scorer rebuilds it. It changes nothing else.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// vendor/makefun-frontend.ts is the kit's copy, unchanged: the gate rebuilds the dossier
// with its own copy and compares the two byte for byte.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

function fail(message) {
  throw new Error('leonida-platinum: ' + message);
}

// The trophy file is the heart of the entry: refuse to hand in a list that is not
// the official 55, so a broken data file can never be submitted by accident.
const trophyDoc = JSON.parse(readFileSync(join(appDir, 'data', 'trophies.json'), 'utf8'));
const trophies = trophyDoc.trophies ?? trophyDoc;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  fail('app/data/trophies.json must hold 55 trophies, found ' + (Array.isArray(trophies) ? trophies.length : 'no array'));
}
for (const t of trophies) {
  if (typeof t.name !== 'string' || !t.name.trim()) fail('a trophy is missing its name');
  if (typeof t.guide !== 'string' || !t.guide.trim()) fail('trophy ' + t.name + ' has no guide');
}
const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
for (const t of trophies) grades[t.grade] = (grades[t.grade] ?? 0) + 1;
if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
  fail('unexpected grade split: ' + JSON.stringify(grades));
}

// Four screenshots at most, each a real JPEG or PNG under the gate's 256 KiB cap.
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => !f.startsWith('.')) : [];
if (shots.length < 3 || shots.length > 4) fail('screenshots/ must hold 3 or 4 images, found ' + shots.length);
for (const f of shots) {
  const size = statSync(join(shotsDir, f)).size;
  if (size > 262144) fail('screenshot ' + f + ' is over 256 KiB (' + size + ' bytes)');
}

// Start from an empty output directory so a stale file from an earlier run can
// never ride along into the hand-in.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) rmSync(join(out, entry), { recursive: true, force: true });

cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of app files).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// The gate refuses a dossier over 1.5 MiB: catch that here, while the fix is cheap.
const dossierStat = statSync(join(out, 'dossier.json'));
if (dossierStat.size > 1572864) fail('dossier.json is over 1.5 MiB (' + dossierStat.size + ' bytes)');
// And confirm the hand-in actually carries the screenshots main.ts checked above.
const outShots = readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.'));
if (outShots.length !== shots.length) fail('output screenshots mismatch: ' + outShots.length + ' vs ' + shots.length);

console.log(
  'leonida-platinum: wrote ' + join(out, 'dossier.json') + ' (' + dossier.length + ' bytes), ' +
  trophies.length + ' trophies (' + grades.platinum + ' platinum, ' + grades.gold + ' gold, ' +
  grades.silver + ' silver, ' + grades.bronze + ' bronze), ' + shots.length + ' screenshots',
);
