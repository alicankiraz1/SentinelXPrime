import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  parseValidateReleaseSurfaceArgs,
  validateSummaryManifest,
} from "../../scripts/lib/release-surface-validator.mjs";

function createTempRepoRoot() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-release-surface-"));
}

function createManifestMetadata() {
  return {
    case_ids: ["case-a"],
    total_available_cases: 1,
    case_manifest_fingerprint: "manifest-fingerprint",
    runner_source_fingerprint: "runner-source-fingerprint",
  };
}

function createValidSummary(manifestMetadata) {
  return {
    runner_fingerprint: manifestMetadata.case_manifest_fingerprint,
    case_manifest_fingerprint: manifestMetadata.case_manifest_fingerprint,
    runner_source_fingerprint: manifestMetadata.runner_source_fingerprint,
    overall_pass: true,
    score: 100,
    selected_case_ids: manifestMetadata.case_ids,
    selected_case_count: manifestMetadata.case_ids.length,
    total_available_cases: manifestMetadata.total_available_cases,
    full_suite: true,
    artifact_integrity: {
      checks_considered: manifestMetadata.case_ids.length,
      expected_case_ids: manifestMetadata.case_ids,
      selected_case_count: manifestMetadata.case_ids.length,
      missing_paths: [],
      extra_case_dirs: [],
      integrity_passed: true,
    },
    checks: manifestMetadata.case_ids.map((id) => ({
      id,
      pass: true,
    })),
  };
}

test("defaults to summary-optional mode", () => {
  const args = parseValidateReleaseSurfaceArgs([]);

  assert.equal(args.requireSummary, false);
});

test("fails when require-summary is set and summary is missing", () => {
  const repoRoot = createTempRepoRoot();
  const issues = validateSummaryManifest({
    repoRoot,
    requireSummary: true,
    manifestMetadata: createManifestMetadata(),
  });

  assert.deepEqual(issues, ["evals/artifacts/summary.json is required but missing"]);
});

test("allows missing summary in default mode", () => {
  const repoRoot = createTempRepoRoot();
  const issues = validateSummaryManifest({
    repoRoot,
    requireSummary: false,
    manifestMetadata: createManifestMetadata(),
  });

  assert.deepEqual(issues, []);
});

test("preserves current summary validation when summary exists", () => {
  const repoRoot = createTempRepoRoot();
  const manifestMetadata = createManifestMetadata();
  const summaryDir = path.join(repoRoot, "evals", "artifacts");

  mkdirSync(summaryDir, { recursive: true });
  writeFileSync(
    path.join(summaryDir, "summary.json"),
    `${JSON.stringify(createValidSummary(manifestMetadata), null, 2)}\n`,
    "utf8"
  );

  const issues = validateSummaryManifest({
    repoRoot,
    requireSummary: true,
    manifestMetadata,
  });

  assert.deepEqual(issues, []);
});

test("reports malformed summary.json in default mode", () => {
  const repoRoot = createTempRepoRoot();
  const summaryDir = path.join(repoRoot, "evals", "artifacts");

  mkdirSync(summaryDir, { recursive: true });
  writeFileSync(path.join(summaryDir, "summary.json"), "{invalid json\n", "utf8");

  const issues = validateSummaryManifest({
    repoRoot,
    requireSummary: false,
    manifestMetadata: createManifestMetadata(),
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0], /^evals\/artifacts\/summary\.json is not valid JSON:/);
});

test("reports malformed summary.json in require-summary mode", () => {
  const repoRoot = createTempRepoRoot();
  const summaryDir = path.join(repoRoot, "evals", "artifacts");

  mkdirSync(summaryDir, { recursive: true });
  writeFileSync(path.join(summaryDir, "summary.json"), "{invalid json\n", "utf8");

  const issues = validateSummaryManifest({
    repoRoot,
    requireSummary: true,
    manifestMetadata: createManifestMetadata(),
  });

  assert.equal(issues.length, 1);
  assert.match(issues[0], /^evals\/artifacts\/summary\.json is not valid JSON:/);
});
