import { chmodSync, cpSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { buildReleaseSurfaceManifest } from "./lib/release-surface-manifest.mjs";

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error("Usage: node scripts/copy-release-surface.mjs <source-root> <target-root>");
  process.exit(1);
}

const sourceRoot = path.resolve(process.cwd(), args[0]);
const targetRoot = path.resolve(process.cwd(), args[1]);
const manifest = buildReleaseSurfaceManifest(sourceRoot);

for (const entry of manifest) {
  const targetPath = path.join(targetRoot, entry.relativePath);

  if (entry.entryType === "directory") {
    mkdirSync(targetPath, { recursive: true });
    continue;
  }

  const sourcePath = path.join(sourceRoot, entry.relativePath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath);
  chmodSync(targetPath, statSync(sourcePath).mode);
}
