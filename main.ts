// Leonida Legend — GTA 6 trophy guide entry program.
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-frontend.ts.
// Node 22, standard library only. Deterministic: same bytes every run.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// The grader mounts MAKEFUN_OUTPUT_DIR as a volume: removing the mount
// point itself fails with EPERM. Empty its contents instead, never the dir.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

for (const name of ["app", "screenshots"]) {
  const src = join(repoRoot, name);
  if (!existsSync(src)) throw new Error(`missing ${name}/ in repository`);
  cpSync(src, join(outDir, name), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

// buildDossier returns a Uint8Array; write it verbatim so both grader runs
// produce byte-identical output. No timestamps or random data enter /output.
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
