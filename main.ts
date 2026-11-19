// Leonida Legend — GTA 6 trophy guide entry (Node 22, standard library only).
//
// The guide itself is app/: plain static files a browser opens at
// app/index.html (ES modules, CSS, no build step), fully offline, and its
// trophy list and guides are app/data/trophies.json (55 PlayStation 5
// trophies, each with its official name, description and grade, plus a guide
// in our own words that cites its sources). screenshots/ holds 4 JPEG
// captures of the running app, the first by name the cover.
//
// This program hands the entry in: it copies app/ and screenshots/ from
// beside this file to the output directory and writes
// /output/dossier.json, the summary the judge reads (the screenshots, the
// first load's files and bytes, and the source), with the vendored make.fun
// library. Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy writes.
//
// Output-directory rule (the one that matters): the grader's /output is a
// volume the program does not own, so removing the directory itself fails
// with EPERM. This program never removes the output directory itself — it
// creates it, then empties only its contents, child by child, and writes
// into it. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Empty a directory's contents without ever removing the directory itself. */
function emptyDirContents(dir: string): void {
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

// The output directory is a volume the grader owns: create it if missing,
// then clear only what is inside it. Never rmSync/rmdir the directory
// itself — on the grader's volume that fails with EPERM.
mkdirSync(out, { recursive: true });
emptyDirContents(out);

// Copy the guide and its screenshots in, and count the screenshots so the
// final log can say what was handed in (buildDossier refuses a missing or
// over-cap screenshots/ directory on its own).
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
let screenshotCount = 0;
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  screenshotCount = readdirSync(join(out, 'screenshots')).filter((f) =>
    statSync(join(out, 'screenshots', f)).isFile(),
  ).length;
}

// A light sanity check before the dossier is built: the trophy file must
// name all 55 official trophies, each with a guide. This only reads; it
// never writes the trophy file.
const trophiesPath = join(here, 'app', 'data', 'trophies.json');
const trophiesData = JSON.parse(readFileSync(trophiesPath, 'utf8')) as
  | { trophies: Array<{ name: string; guide: string }> }
  | Array<{ name: string; guide: string }>;
const trophies = Array.isArray(trophiesData) ? trophiesData : trophiesData.trophies;
if (trophies.length !== 55) {
  throw new Error(`app/data/trophies.json holds ${trophies.length} trophies, expected 55`);
}
const unguided = trophies.filter((t) => typeof t.guide !== 'string' || t.guide.trim() === '');
if (unguided.length > 0) {
  throw new Error(`app/data/trophies.json: ${unguided.length} trophies with no guide`);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files: app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Confirm the hand-in landed: the dossier must exist and be non-empty.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
if (dossierBytes === 0) throw new Error('dossier.json was written empty');
console.log(
  `Leonida Legend: handed in ${trophies.length} trophies, ${screenshotCount} screenshots, dossier ${dossierBytes} bytes to ${out}`,
);
