import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveFromImportMetaUrl } from "../../scripts/lib/import-meta-paths.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..", "..");

function copyRepoToTemp(prefix) {
  const tempRoot = mkdtempSync(path.join(tmpdir(), prefix));
  const tempRepo = path.join(tempRoot, "repo");

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

  return { tempRoot, tempRepo };
}

test("packaged Claude hook entrypoint keeps an executable bit on POSIX", { skip: process.platform === "win32" }, () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-hook-archive-");
  const extractRoot = path.join(tempRoot, "unpacked");

  try {
    const packageResult = spawnSync("bash", ["scripts/package-release.sh"], {
      cwd: tempRepo,
      encoding: "utf8",
    });
    assert.equal(packageResult.status, 0, packageResult.stderr || packageResult.stdout);

    const archivePath = packageResult.stdout.trim();
    const unzipResult = spawnSync("unzip", ["-q", archivePath, "-d", extractRoot], {
      cwd: tempRepo,
      encoding: "utf8",
    });
    assert.equal(unzipResult.status, 0, unzipResult.stderr || unzipResult.stdout);

    const entrypointPath = path.join(extractRoot, "SentinelXPrime", "hooks", "run-hook.cmd");
    assert.notEqual(statSync(entrypointPath).mode & 0o111, 0);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
