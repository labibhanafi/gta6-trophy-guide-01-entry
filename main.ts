// Leonida Legend — entrypoint.
// Copies the static guide (app/) and its screenshots into the output
// directory, then writes the make.fun dossier for that directory.
// Runs on Node 22 with the standard library only; no network, no build.
//
// The grader mounts the output directory itself, so this program never
// removes that directory — it only clears what is inside it.

import { buildDossier } from "./vendor/makefun-frontend.ts";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Where the repository lives: the folder holding this file.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// Where the finished entry goes: the grader's /output, or the env var
// outside it. Fall back to ./out for a local trial run.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The dossier caps from the competition's gate.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
};

/** Remove every entry inside `dir`, leaving `dir` itself in place. */
function emptyDirectory(dir: string): void {
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

/** Copy a file tree, `src` into `dst`, visiting entries in sorted order. */
function copyTree(src: string, dst: string): void {
  mkdirSync(dst, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const entry of entries) {
    const from = join(src, entry.name);
    const to = join(dst, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
    }
  }
}

function main(): void {
  const guideDir = join(repoRoot, "app");
  const shotsDir = join(repoRoot, "screenshots");
  for (const needed of [guideDir, shotsDir]) {
    if (!existsSync(needed) || !statSync(needed).isDirectory()) {
      throw new Error(`missing input directory: ${needed}`);
    }
  }

  mkdirSync(outputDir, { recursive: true });
  emptyDirectory(outputDir);

  copyTree(guideDir, join(outputDir, "app"));
  copyTree(shotsDir, join(outputDir, "screenshots"));

  const dossier = buildDossier(outputDir, dossierCaps);
  writeFileSync(join(outputDir, "dossier.json"), dossier);
}

main();
