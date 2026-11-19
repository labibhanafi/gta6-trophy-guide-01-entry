// Leonida Legend — GTA 6 trophy guide entry program (Node 22, standard library only).
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-frontend.ts.
//
// The output directory itself is never removed: on the grader it is a
// mounted volume, and removing it fails with EPERM. Instead the directory
// is created (mkdir -p) and its contents are emptied child by child, so a
// dirty output directory is cleaned without touching the mount point.

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function emptyDirectoryChildren(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

function copyTree(sourceDir: string, targetDir: string): number {
  mkdirSync(targetDir, { recursive: true });
  let copied = 0;
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyTree(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, targetPath);
      copied++;
    }
  }
  return copied;
}

function main(): void {
  const appSource = join(REPO_ROOT, 'app');
  const shotsSource = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appSource) || !statSync(appSource).isDirectory()) {
    throw new Error('app/: no such directory in the repository');
  }
  if (!existsSync(shotsSource) || !statSync(shotsSource).isDirectory()) {
    throw new Error('screenshots/: no such directory in the repository');
  }

  emptyDirectoryChildren(OUTPUT_DIR);
  const copiedApp = copyTree(appSource, join(OUTPUT_DIR, 'app'));
  const copiedShots = copyTree(shotsSource, join(OUTPUT_DIR, 'screenshots'));
  if (copiedApp === 0 || copiedShots === 0) {
    throw new Error('nothing copied: app/ or screenshots/ came out empty');
  }

  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`copied ${copiedApp} app files and ${copiedShots} screenshots; wrote ${join(OUTPUT_DIR, 'dossier.json')}`);
}

main();
