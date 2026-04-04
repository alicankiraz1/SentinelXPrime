import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { serializeReleaseManifest } from "../evals/lib/release-manifest.mjs";
import { releaseManifestRelativePath } from "./lib/release-policy.mjs";

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error("Usage: node scripts/write-release-manifest.mjs <source-root> <target-root>");
  process.exit(1);
}

const sourceRoot = path.resolve(process.cwd(), args[0]);
const targetRoot = path.resolve(process.cwd(), args[1]);
const manifestPath = path.join(targetRoot, releaseManifestRelativePath);

mkdirSync(path.dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, serializeReleaseManifest(sourceRoot), "utf8");
