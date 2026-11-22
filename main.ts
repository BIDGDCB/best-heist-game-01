// main.ts — The Velvet Vault's hand-in program (Node 22, standard library
// only). It stages the entry for the grader: copy this repository's game/
// and screenshots/ into the output directory, then write dossier.json with
// the vendored make.fun library, exactly as the gate rebuilds it. Outside
// the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The run must be deterministic: the same repository always writes the same
// bytes, so the grader's two runs match.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from an empty output directory so stale files can never leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');

if (!existsSync(gameSrc)) throw new Error('game/ is missing from the repository');
if (!existsSync(shotsSrc)) throw new Error('screenshots/ is missing from the repository');

cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });

// The gate's own caps, so this program fails locally exactly where the
// scorer would refuse the entry: at most 4 screenshots of 256 KiB, game/
// at most 993 entries and 48 MiB, paths at most 1000 bytes, dossier text
// at most 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
