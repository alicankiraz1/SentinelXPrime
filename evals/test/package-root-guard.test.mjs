import test from "node:test";
import assert from "node:assert/strict";

import { analyzePackageRootEntries } from "../../scripts/lib/package-root-guard.mjs";

test("allows a canonical package root", () => {
  const issues = analyzePackageRootEntries([
    "README.md",
    "LICENSE",
    "skills/sentinelx-prime/SKILL.md",
    "scripts/package-release.sh",
    "evals/run-sentinelx-prime.mjs",
  ]);

  assert.deepEqual(issues, []);
});

test("rejects a nested SentinelXPrime-main source tree", () => {
  const issues = analyzePackageRootEntries([
    "README.md",
    "skills/sentinelx-prime/SKILL.md",
    "scripts/package-release.sh",
    "SentinelXPrime-main/README.md",
    "SentinelXPrime-main/skills/sentinelx-prime/SKILL.md",
    "SentinelXPrime-main/scripts/package-release.sh",
  ]);

  assert.deepEqual(issues, [
    "nested source tree detected at SentinelXPrime-main/",
  ]);
});

test("rejects a nested git directory", () => {
  const issues = analyzePackageRootEntries([
    "README.md",
    "skills/sentinelx-prime/SKILL.md",
    "scripts/package-release.sh",
    "scratch/.git/HEAD",
  ]);

  assert.deepEqual(issues, [
    "nested git directory detected at scratch/.git/",
  ]);
});

test("rejects a second repo-shaped root", () => {
  const issues = analyzePackageRootEntries([
    "README.md",
    "skills/sentinelx-prime/SKILL.md",
    "scripts/package-release.sh",
    "workspace-copy/README.md",
    "workspace-copy/skills/extra/SKILL.md",
    "workspace-copy/scripts/package-release.sh",
  ]);

  assert.deepEqual(issues, [
    "duplicate repo-shaped tree detected at workspace-copy/",
  ]);
});

test("rejects a recursively nested SentinelXPrime-main source tree", () => {
  const issues = analyzePackageRootEntries([
    "README.md",
    "skills/sentinelx-prime/SKILL.md",
    "scripts/package-release.sh",
    "wrapper/SentinelXPrime-main/README.md",
    "wrapper/SentinelXPrime-main/skills/sentinelx-prime/SKILL.md",
    "wrapper/SentinelXPrime-main/scripts/package-release.sh",
  ]);

  assert.deepEqual(issues, [
    "nested source tree detected at wrapper/SentinelXPrime-main/",
  ]);
});

test("rejects a deeply nested duplicate repo-shaped tree", () => {
  const issues = analyzePackageRootEntries([
    "README.md",
    "skills/sentinelx-prime/SKILL.md",
    "scripts/package-release.sh",
    "foo/bar/workspace-copy/README.md",
    "foo/bar/workspace-copy/skills/extra/SKILL.md",
    "foo/bar/workspace-copy/scripts/package-release.sh",
  ]);

  assert.deepEqual(issues, [
    "duplicate repo-shaped tree detected at foo/bar/workspace-copy/",
  ]);
});
