import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  analyzeArchiveEntries,
  compareManifestMetadata,
  verifyReleaseArchive,
} from "../../scripts/lib/release-archive-verifier.mjs";
import { resolveFromImportMetaUrl } from "../../scripts/lib/import-meta-paths.mjs";
import { compareReleaseSurfaceManifests } from "../../scripts/lib/release-surface-manifest.mjs";

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

function runCommand(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

test("rejects forbidden archive entries under the packaged root", () => {
  const report = analyzeArchiveEntries([
    "SentinelXPrime/",
    "SentinelXPrime/README.md",
    "SentinelXPrime/dist/old.zip",
    "SentinelXPrime/.worktrees/feature/README.md",
    "SentinelXPrime/worktrees/scratch/README.md",
    "SentinelXPrime/evals/artifacts/summary.json",
    "SentinelXPrime/docs/plans/internal-plan.md",
    "SentinelXPrime/docs/specs/internal-spec.md",
    "SentinelXPrime/__MACOSX/._README.md",
    "SentinelXPrime/._README.md",
  ]);

  assert.equal(report.rootDirName, "SentinelXPrime");
  assert.deepEqual(report.forbiddenEntries, [
    "SentinelXPrime/._README.md",
    "SentinelXPrime/.worktrees/feature/README.md",
    "SentinelXPrime/__MACOSX/._README.md",
    "SentinelXPrime/dist/old.zip",
    "SentinelXPrime/docs/plans/internal-plan.md",
    "SentinelXPrime/docs/specs/internal-spec.md",
    "SentinelXPrime/evals/artifacts/summary.json",
    "SentinelXPrime/worktrees/scratch/README.md",
  ]);
});

test("requires a single packaged root directory", () => {
  const report = analyzeArchiveEntries([
    "SentinelXPrime/README.md",
    "Another-Root/README.md",
  ]);

  assert.equal(report.issues.length, 1);
  assert.match(report.issues[0], /^archive must contain exactly one top-level root directory/);
  assert.match(report.issues[0], /Another-Root/);
  assert.match(report.issues[0], /SentinelXPrime/);
});

test("reports detected top-level roots and Apple metadata for Finder-style multi-root archives", () => {
  const report = analyzeArchiveEntries([
    "SentinelXPrime/README.md",
    "__MACOSX/._README.md",
    "Another-Root/README.md",
  ]);

  assert.equal(report.issues.length, 1);
  assert.match(report.issues[0], /SentinelXPrime/);
  assert.match(report.issues[0], /Another-Root/);
  assert.match(report.issues[0], /__MACOSX/);
  assert.match(report.issues[0], /Apple metadata/i);
});

test("rejects manifest metadata drift between source and archive", () => {
  const issues = compareManifestMetadata(
    {
      case_ids: ["case-a", "case-b"],
      total_available_cases: 2,
      case_manifest_fingerprint: "source-manifest",
      runner_source_fingerprint: "source-runner",
    },
    {
      case_ids: ["case-a"],
      total_available_cases: 1,
      case_manifest_fingerprint: "archive-manifest",
      runner_source_fingerprint: "archive-runner",
    }
  );

  assert.deepEqual(issues, [
    "archive total_available_cases does not match source manifest length",
    "archive case_manifest_fingerprint does not match source manifest fingerprint",
    "archive runner_source_fingerprint does not match source runner fingerprint",
    "archive case_ids do not exactly match source manifest order",
  ]);
});

test("allows an unchanged shipped surface", () => {
  const issues = compareReleaseSurfaceManifests(
    [
      { entryType: "directory", relativePath: "docs" },
      { entryType: "file", relativePath: "README.md", contentHash: "hash-a" },
      { entryType: "file", relativePath: "skills/sentinelx-prime/SKILL.md", contentHash: "hash-b" },
    ],
    [
      { entryType: "directory", relativePath: "docs" },
      { entryType: "file", relativePath: "README.md", contentHash: "hash-a" },
      { entryType: "file", relativePath: "skills/sentinelx-prime/SKILL.md", contentHash: "hash-b" },
    ]
  );

  assert.deepEqual(issues, []);
});

test("rejects a tampered shipped file", () => {
  const issues = compareReleaseSurfaceManifests(
    [
      { entryType: "file", relativePath: "README.md", contentHash: "hash-a" },
    ],
    [
      { entryType: "file", relativePath: "README.md", contentHash: "hash-b" },
    ]
  );

  assert.deepEqual(issues, [
    "archive content hash does not match source for README.md",
  ]);
});

test("rejects an extra nested SentinelXPrime-main tree", () => {
  const issues = compareReleaseSurfaceManifests(
    [
      { entryType: "file", relativePath: "README.md", contentHash: "hash-a" },
    ],
    [
      { entryType: "file", relativePath: "README.md", contentHash: "hash-a" },
      { entryType: "directory", relativePath: "SentinelXPrime-main" },
      { entryType: "file", relativePath: "SentinelXPrime-main/README.md", contentHash: "hash-c" },
    ]
  );

  assert.deepEqual(issues, [
    "archive contains unexpected path SentinelXPrime-main",
    "archive contains unexpected path SentinelXPrime-main/README.md",
  ]);
});

test("rejects a missing shipped file", () => {
  const issues = compareReleaseSurfaceManifests(
    [
      { entryType: "file", relativePath: "README.md", contentHash: "hash-a" },
      { entryType: "file", relativePath: "skills/sentinelx-prime/SKILL.md", contentHash: "hash-b" },
    ],
    [
      { entryType: "file", relativePath: "skills/sentinelx-prime/SKILL.md", contentHash: "hash-b" },
    ]
  );

  assert.deepEqual(issues, [
    "archive is missing path README.md",
  ]);
});

test("requires release-manifest.json inside packaged archives", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-archive-missing-manifest-");

  try {
    const packageResult = runCommand("bash", ["scripts/package-release.sh"], tempRepo);
    const archivePath = packageResult.stdout.trim();
    const unpackedRoot = path.join(tempRoot, "unpacked");
    const repackedArchivePath = path.join(tempRoot, "missing-release-manifest.zip");

    runCommand("unzip", ["-q", archivePath, "-d", unpackedRoot], tempRepo);
    rmSync(path.join(unpackedRoot, "SentinelXPrime", "evals", "release-manifest.json"), { force: true });
    runCommand("zip", ["-qr", repackedArchivePath, "SentinelXPrime"], unpackedRoot);

    const report = verifyReleaseArchive({
      archivePath: repackedArchivePath,
      sourceRoot: tempRepo,
    });

    assert.equal(report.pass, false);
    assert.match(report.issues.join("\n"), /release-manifest\.json/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("rejects malformed release-manifest.json files", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-archive-malformed-manifest-");

  try {
    const packageResult = runCommand("bash", ["scripts/package-release.sh"], tempRepo);
    const archivePath = packageResult.stdout.trim();
    const unpackedRoot = path.join(tempRoot, "unpacked");
    const repackedArchivePath = path.join(tempRoot, "malformed-release.zip");

    runCommand("unzip", ["-q", archivePath, "-d", unpackedRoot], tempRepo);
    writeFileSync(
      path.join(unpackedRoot, "SentinelXPrime", "evals", "release-manifest.json"),
      "{invalid json\n",
      "utf8"
    );
    runCommand("zip", ["-qr", repackedArchivePath, "SentinelXPrime"], unpackedRoot);

    const report = verifyReleaseArchive({
      archivePath: repackedArchivePath,
      sourceRoot: tempRepo,
    });

    assert.equal(report.pass, false);
    assert.match(report.issues.join("\n"), /release manifest/i);
    assert.match(report.issues.join("\n"), /JSON|parse/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("does not execute archive runner code while verifying", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-archive-no-exec-");
  const markerPath = path.join(tempRoot, "archive-runner-executed.txt");

  try {
    writeFileSync(
      path.join(tempRepo, "evals", "run-sentinelx-prime.mjs"),
      [
        'import { writeFileSync } from "node:fs";',
        'if (process.env.SENTINELX_PRIME_MARKER_PATH) {',
        '  writeFileSync(process.env.SENTINELX_PRIME_MARKER_PATH, "executed\\n", "utf8");',
        '}',
        'console.log(JSON.stringify({',
        '  case_ids: ["archive-runner"],',
        '  total_available_cases: 1,',
        '  case_manifest_fingerprint: "archive-runner",',
        '  runner_source_fingerprint: "archive-runner"',
        "}));",
        "",
      ].join("\n"),
      "utf8"
    );

    process.env.SENTINELX_PRIME_MARKER_PATH = markerPath;
    const packageResult = runCommand("bash", ["scripts/package-release.sh"], tempRepo);
    const archivePath = packageResult.stdout.trim();
    const report = verifyReleaseArchive({
      archivePath,
      sourceRoot: tempRepo,
    });

    assert.equal(report.pass, true, JSON.stringify(report, null, 2));
    assert.equal(existsSync(markerPath), false);
  } finally {
    delete process.env.SENTINELX_PRIME_MARKER_PATH;
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
