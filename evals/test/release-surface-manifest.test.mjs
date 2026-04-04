import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildReleaseSurfaceManifest,
  inspectReleaseSurface,
} from "../../scripts/lib/release-surface-manifest.mjs";
import { resolveFromImportMetaUrl } from "../../scripts/lib/import-meta-paths.mjs";
import { verifyReleaseArchive } from "../../scripts/lib/release-archive-verifier.mjs";
import { createReleaseManifestMetadata } from "../../evals/lib/release-manifest.mjs";

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

test("ignores local worktree directories when building the release surface manifest", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "sentinelx-prime-surface-manifest-"));

  mkdirSync(path.join(repoRoot, ".worktrees", "feature"), { recursive: true });
  mkdirSync(path.join(repoRoot, "skills", "sentinelx-prime"), { recursive: true });

  writeFileSync(path.join(repoRoot, "README.md"), "# SentinelXPrime\n", "utf8");
  writeFileSync(path.join(repoRoot, "skills", "sentinelx-prime", "SKILL.md"), "skill\n", "utf8");
  writeFileSync(path.join(repoRoot, ".worktrees", "feature", "README.md"), "# Shadow copy\n", "utf8");

  const manifest = buildReleaseSurfaceManifest(repoRoot);
  const relativePaths = manifest.map((entry) => entry.relativePath);

  assert.deepEqual(relativePaths, [
    "README.md",
    "skills",
    "skills/sentinelx-prime",
    "skills/sentinelx-prime/SKILL.md",
  ]);
});

test("reports unsupported symlinks in the source release surface", () => {
  const releaseRoot = mkdtempSync(path.join(tmpdir(), "sentinelx-prime-surface-symlink-"));

  mkdirSync(path.join(releaseRoot, "evals"), { recursive: true });
  writeFileSync(path.join(releaseRoot, "README.md"), "# SentinelXPrime\n", "utf8");
  symlinkSync("/etc/hosts", path.join(releaseRoot, "hosts-link"));

  const report = inspectReleaseSurface(releaseRoot);

  assert.deepEqual(report.manifest, [
    {
      entryType: "directory",
      relativePath: "evals",
    },
    {
      entryType: "file",
      relativePath: "README.md",
      contentHash: report.manifest[1].contentHash,
    },
  ]);
  assert.deepEqual(report.issues, [
    "release surface contains unsupported symlink hosts-link",
  ]);
});

test("fails verification when a source-tree symlink is hidden by a Linux-style zip archive", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-surface-symlink-archive-");

  try {
    symlinkSync("/etc/hosts", path.join(tempRepo, "hosts-link"));
    writeFileSync(
      path.join(tempRepo, "evals", "release-manifest.json"),
      `${JSON.stringify(createReleaseManifestMetadata(tempRepo), null, 2)}\n`,
      "utf8"
    );

    const archivePath = path.join(tempRoot, "linux-style.zip");
    const archiveRoot = path.join(tempRoot, "archive-root");
    mkdirSync(path.join(archiveRoot, "SentinelXPrime"), { recursive: true });
    cpSync(tempRepo, path.join(archiveRoot, "SentinelXPrime"), { recursive: true });

    const zipResult = spawnSync("zip", ["-qr", archivePath, "SentinelXPrime"], {
      cwd: archiveRoot,
      encoding: "utf8",
    });
    assert.equal(zipResult.status, 0, zipResult.stderr || zipResult.stdout);

    const report = verifyReleaseArchive({
      archivePath,
      sourceRoot: tempRepo,
    });

    assert.equal(report.pass, false);
    assert.match(report.issues.join("\n"), /unsupported symlink hosts-link/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
