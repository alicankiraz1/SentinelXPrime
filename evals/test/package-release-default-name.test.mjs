import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveFromImportMetaUrl } from "../../scripts/lib/import-meta-paths.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..", "..");

test("package-release defaults to the public SentinelXPrime archive name", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "sentinelx-prime-package-default-"));
  const tempRepo = path.join(tempRoot, "repo");

  try {
    cpSync(repoRoot, tempRepo, {
      recursive: true,
      filter: (sourcePath) => {
        const relativePath = path.relative(repoRoot, sourcePath);
        if (!relativePath) {
          return true;
        }

        const [topLevelSegment] = relativePath.split(path.sep);
        return topLevelSegment !== ".git" && topLevelSegment !== ".worktrees" && topLevelSegment !== "dist";
      },
    });

    const result = spawnSync("bash", ["scripts/package-release.sh"], {
      cwd: tempRepo,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const archivePath = result.stdout.trim();
    assert.equal(path.basename(archivePath), "SentinelXPrime.zip");
    assert.equal(existsSync(path.join(tempRepo, "dist", "SentinelXPrime.zip")), true);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
