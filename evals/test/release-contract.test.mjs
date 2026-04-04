import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createRunnerSourceFingerprint } from "../../evals/lib/release-contract.mjs";

function createTempRepoRoot() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-release-contract-"));
}

test("runner source fingerprint changes when check-oracles changes", () => {
  const repoRoot = createTempRepoRoot();
  const evalsLibDir = path.join(repoRoot, "evals", "lib");

  mkdirSync(evalsLibDir, { recursive: true });
  writeFileSync(path.join(repoRoot, "evals", "run-sentinelx-prime.mjs"), "export const runner = true;\n", "utf8");
  writeFileSync(path.join(evalsLibDir, "case-catalog.mjs"), "export const cases = ['before'];\n", "utf8");
  writeFileSync(path.join(evalsLibDir, "release-contract.mjs"), "export const contract = true;\n", "utf8");
  writeFileSync(path.join(evalsLibDir, "check-oracles.mjs"), "export const oracles = ['before'];\n", "utf8");
  writeFileSync(path.join(evalsLibDir, "release-manifest.mjs"), "export const manifest = ['before'];\n", "utf8");

  const before = createRunnerSourceFingerprint(repoRoot);

  writeFileSync(path.join(evalsLibDir, "check-oracles.mjs"), "export const oracles = ['after'];\n", "utf8");

  const after = createRunnerSourceFingerprint(repoRoot);

  assert.notEqual(after, before);
});
