import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const TEXT_MAX_BYTES = 163840;
const SCREENSHOT_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 48 * 1024 * 1024;
const DOSSIER_MAX_BYTES = 1572864;

function emptyDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

function copyTree(src: string, dest: string): number {
  let copied = 0;
  mkdirSync(dest, { recursive: true });
  for (const child of readdirSync(src)) {
    const from = join(src, child);
    const to = join(dest, child);
    if (statSync(from).isDirectory()) {
      copied += copyTree(from, to);
    } else {
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

function listShots(dir: string): Array<{ name: string; bytes: number }> {
  const shotsDir = join(dir, "screenshots");
  const out: Array<{ name: string; bytes: number }> = [];
  for (const name of readdirSync(shotsDir).sort()) {
    const p = join(shotsDir, name);
    if (statSync(p).isFile()) out.push({ name, bytes: statSync(p).size });
  }
  return out;
}

function main(): void {
  const appDir = join(repoRoot, "app");
  const shotsDir = join(repoRoot, "screenshots");
  if (!existsSync(appDir)) throw new Error("main.ts: app/ is missing from the repository");
  if (!existsSync(shotsDir)) throw new Error("main.ts: screenshots/ is missing from the repository");

  const trophiesPath = join(appDir, "data", "trophies.json");
  const trophiesDoc = JSON.parse(readFileSync(trophiesPath, "utf-8")) as {
    trophies: Array<{ name: string; guide: string }>;
  };
  if (!Array.isArray(trophiesDoc.trophies) || trophiesDoc.trophies.length !== 55) {
    throw new Error(`main.ts: expected 55 trophies, found ${trophiesDoc.trophies?.length}`);
  }
  const seen = new Set<string>();
  for (const t of trophiesDoc.trophies) {
    if (typeof t.guide !== "string" || t.guide.trim() === "") {
      throw new Error(`main.ts: trophy ${t.name} has no guide`);
    }
    if (seen.has(t.name)) throw new Error(`main.ts: duplicate trophy name ${t.name}`);
    seen.add(t.name);
  }

  emptyDir(outDir);
  const appCopied = copyTree(appDir, join(outDir, "app"));
  const shotsCopied = copyTree(shotsDir, join(outDir, "screenshots"));
  if (appCopied === 0) throw new Error("main.ts: app/ copied nothing");
  if (shotsCopied === 0) throw new Error("main.ts: screenshots/ copied nothing");

  const dossier = buildDossier(outDir, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    app_max_files: APP_MAX_FILES,
    app_max_bytes: APP_MAX_BYTES,
  });
  if (dossier.length > DOSSIER_MAX_BYTES) {
    throw new Error(`main.ts: dossier.json is ${dossier.length} bytes, over the 1.5 MiB cap`);
  }
  writeFileSync(join(outDir, "dossier.json"), dossier);
  const writtenBack = readFileSync(join(outDir, "dossier.json"));
  if (writtenBack.length !== dossier.length) {
    throw new Error(`main.ts: dossier.json on disk is ${writtenBack.length} bytes, buildDossier wrote ${dossier.length}`);
  }

  const shots = listShots(outDir);
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`main.ts: expected 3 or 4 screenshots, found ${shots.length}`);
  }
  for (const s of shots) {
    if (s.bytes > SCREENSHOT_MAX_BYTES) {
      throw new Error(`main.ts: screenshot ${s.name} is ${s.bytes} bytes, over the 256 KiB cap`);
    }
  }
  console.log(`main.ts: copied ${appCopied} app files and ${shotsCopied} screenshots to ${outDir}`);
  for (const s of shots) console.log(`main.ts: screenshot ${s.name} ${s.bytes} bytes`);
  console.log(`main.ts: dossier.json ${dossier.length} bytes, 55 trophies, ${shots.length} screenshots`);
}

main();
