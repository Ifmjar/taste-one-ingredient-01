// The picture that tastes of one ingredient — make.fun entry.
// A double smash burger drowned in molten cheddar: one dominant ingredient,
// the melt and the gloss, readable even at 300 px.
// Node 22, stdlib only. No network, no randomness, no clock.
// Copies ./entry.png to the output directory as entry.png and verifies the
// copy is byte-identical to the source and within the 1 MiB limit.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1048576;
const SOURCE_NAME = "entry.png";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, SOURCE_NAME);
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : resolve("/output");
const outPath = join(outDir, SOURCE_NAME);

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (!existsSync(sourcePath)) {
  fail(`source image not found: ${sourcePath}`);
}

const sourceSize = statSync(sourcePath).size;
if (sourceSize === 0) {
  fail(`source image is empty: ${sourcePath}`);
}
if (sourceSize > MAX_BYTES) {
  fail(`source image is ${sourceSize} bytes, over the ${MAX_BYTES} byte limit`);
}

// The entry must be a JPEG: check the SOI marker (0xFFD8) before copying,
// so a wrong or corrupted file fails here instead of producing a bad entry.
const header = readFileSync(sourcePath).subarray(0, 2);
if (header.length < 2 || header[0] !== 0xff || header[1] !== 0xd8) {
  fail(
    `source image is not a JPEG (missing 0xFFD8 SOI marker): ${sourcePath}`,
  );
}

mkdirSync(outDir, { recursive: true });
copyFileSync(sourcePath, outPath);

const outSize = statSync(outPath).size;
if (outSize !== sourceSize) {
  fail(`copy size mismatch: source ${sourceSize} bytes, output ${outSize} bytes`);
}
if (sha256(outPath) !== sha256(sourcePath)) {
  fail("copy hash mismatch: output is not byte-identical to the source");
}

console.log(`wrote ${outPath} (${outSize} bytes, sha256 ${sha256(outPath)})`);
