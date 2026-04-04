import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { resolveFromImportMetaUrl } from "./lib/import-meta-paths.mjs";
import { walkFilesystem } from "./lib/filesystem-walker.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..");
const ignoredDirectories = new Set([".git", ".worktrees", "dist"]);
const ignoredRelativePaths = new Set([
  "docs/migration-from-codex-sentinel.md",
  "scripts/check-legacy-names.mjs",
]);
const ignoredExtensions = new Set([".zip", ".png", ".jpg", ".jpeg", ".gif", ".pdf"]);
const legacyPatterns = [
  /Codex-Sentinel/g,
  /codex-sentinel/g,
  /Codex Sentinel/g,
  /security-plan-gap/g,
  /security-review-gate/g,
  /security-test-rig/g,
];
const issues = [];

walkFilesystem(repoRoot, {
  shouldSkip({ entry, relativePath }) {
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) || relativePath === "evals/artifacts";
    }

    return ignoredRelativePaths.has(relativePath) || ignoredExtensions.has(path.extname(entry.name));
  },
  visitFile({ absolutePath, relativePath }) {
    if (!statSync(absolutePath).isFile()) {
      return;
    }

    const content = readFileSync(absolutePath, "utf8")
      .replaceAll("docs/migration-from-codex-sentinel.md", "")
      .replaceAll("migration-from-codex-sentinel.md", "");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      for (const pattern of legacyPatterns) {
        if (pattern.test(line)) {
          issues.push(`${relativePath}:${index + 1}: legacy name match ${pattern}`);
        }
        pattern.lastIndex = 0;
      }
    });
  },
});

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
