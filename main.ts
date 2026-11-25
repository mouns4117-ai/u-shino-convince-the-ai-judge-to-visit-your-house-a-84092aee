// Convince the AI Judge to Visit Your House: A Letter in One Image.
// The entry is one picture: a letter inviting the AI judge to visit,
// drawn by draw.py in the build session and shipped here as entry.png.
// This program only carries that picture to /output/entry.png.
//
// It runs on Node 22 with the standard library only, no network, and
// writes the same bytes on every run. Outside the grader, point it at a
// scratch folder instead of /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const IMAGE_NAME = "entry.png";
const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function fail(message: string): never {
  throw new Error(`entry.png failed the gate: ${message}`);
}

// The picture lives beside this file in the repository.
const picture = readFileSync(new URL(`./${IMAGE_NAME}`, import.meta.url));
if (picture.length < 33 || !picture.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail("not a whole PNG file");
}
if (picture.length > MAX_BYTES) {
  fail(`is ${picture.length} bytes, over the 1 MiB limit`);
}
const width = picture.readUInt32BE(16);
const height = picture.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  fail(`is ${width}x${height}, over the 1024x1024 limit`);
}

// Clear /output by removing its contents only; the directory itself is
// a mount point and must stay where it is.
mkdirSync(OUT_DIR, { recursive: true });
for (const name of readdirSync(OUT_DIR)) {
  rmSync(join(OUT_DIR, name), { recursive: true, force: true });
}

copyFileSync(new URL(`./${IMAGE_NAME}`, import.meta.url), join(OUT_DIR, IMAGE_NAME));

// Read the copy back and check it byte for byte: the grader must see
// exactly the picture this repository holds, nothing else.
const written = readFileSync(join(OUT_DIR, IMAGE_NAME));
const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
if (digest(written) !== digest(picture)) {
  fail("the copy in /output does not match the shipped picture");
}
console.log(`wrote ${join(OUT_DIR, IMAGE_NAME)} (${picture.length} bytes, ${width}x${height}, sha256 ${digest(picture)})`);
