// Leonida Legend — GTA 6 trophy guide entry (Node 22, standard library only).
//
// The guide itself is plain static files in app/ (index.html, style.css,
// app.js, data/trophies.json) and its screenshots in screenshots/. This
// program hands it in: it copies app/ and screenshots/ from beside this
// file to the output directory and writes dossier.json there, the summary
// the judge reads, with the vendored make.fun library.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output. Inside the
// grader /output is the platform's own writable directory, so this program
// never removes the output directory itself: it creates it, then empties
// its contents child by child. Removing the directory itself would fail
// there (the directory is a mount point the program does not own) and
// would also throw away the grader's own place to write.
//
// Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy of the library writes.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The official list this guide covers: 55 trophies, each with a guide.
const EXPECTED_TROPHIES = 55;

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the dossier's bytes; the others refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files and
// directories in app/ or 48 MiB of app files — app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
} as const;

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');
const trophiesFile = join(appDir, 'data', 'trophies.json');

function fail(message: string): never {
  throw new Error(`main.ts: ${message}`);
}

function assertTrophies(): number {
  // Read the guide's own data file and check it before handing anything
  // in: every one of the 55 official trophies must be named, and each must
  // carry a guide that is not blank. A missing or empty guide would fail
  // the scorer's trophies row, so fail loudly here instead.
  if (!existsSync(trophiesFile)) fail(`missing ${trophiesFile}`);
  const parsed: unknown = JSON.parse(readFileSync(trophiesFile, 'utf8'));
  const list: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as { trophies?: unknown }).trophies;
  if (!Array.isArray(list)) fail('trophies.json holds no "trophies" array');
  if (list.length !== EXPECTED_TROPHIES) {
    fail(`expected ${EXPECTED_TROPHIES} trophies, found ${list.length}`);
  }
  const withoutGuide = list.filter((item) => {
    const guide = (item as { guide?: unknown }).guide;
    return typeof guide !== 'string' || guide.trim() === '';
  });
  if (withoutGuide.length > 0) {
    fail(`${withoutGuide.length} trophies have no guide`);
  }
  const withoutName = list.filter((item) => {
    const name = (item as { name?: unknown }).name;
    return typeof name !== 'string' || name.trim() === '';
  });
  if (withoutName.length > 0) {
    fail(`${withoutName.length} trophies have no name`);
  }
  return list.length;
}

function emptyOutputDir(dir: string): number {
  // Create the directory if it is not there, then empty its contents one
  // child at a time. The directory itself is never removed: under the
  // grader it is the platform's mount point, and removing it fails with
  // EPERM. A stale file left from an earlier run must not survive into the
  // new output, so every child — file, directory or anything else the
  // directory holds — is removed recursively.
  mkdirSync(dir, { recursive: true });
  let removed = 0;
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
    removed++;
  }
  return removed;
}

function copyEntry(): void {
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
    fail(`missing app/ directory at ${appDir}`);
  }
  cpSync(appDir, join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
  }
}

function main(): void {
  const trophyCount = assertTrophies();
  const staleRemoved = emptyOutputDir(outDir);
  copyEntry();

  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  // Confirm what the run actually handed in: the dossier file must exist
  // with the bytes buildDossier returned, and screenshots/ must hold 3 or 4
  // images — fewer or more would fail the scorer's screenshots row.
  const dossierStat = statSync(join(outDir, 'dossier.json'));
  if (dossierStat.size !== dossier.length) {
    fail(`dossier.json is ${dossierStat.size} bytes, expected ${dossier.length}`);
  }
  const shotCount = readdirSync(join(outDir, 'screenshots'))
    .filter((name) => !name.startsWith('.')).length;
  if (shotCount < 3 || shotCount > 4) {
    fail(`expected 3 or 4 screenshots, found ${shotCount}`);
  }
  console.log(`Leonida Legend: ${trophyCount} trophies, ${shotCount} screenshots, ` +
    `${staleRemoved} stale entries cleared, dossier.json ${dossier.length} bytes -> ${outDir}`);
}

main();
