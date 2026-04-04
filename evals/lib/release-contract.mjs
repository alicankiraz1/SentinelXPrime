import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const runnerSourceRelativePaths = [
  "evals/run-sentinelx-prime.mjs",
  "evals/lib/case-catalog.mjs",
  "evals/lib/release-contract.mjs",
  "evals/lib/check-oracles.mjs",
  "evals/lib/release-manifest.mjs",
];

export function normalizeCaseManifestRecord(testCase, defaultTimeoutMs) {
  return {
    id: testCase.id,
    fixtureRoot: testCase.fixtureRoot,
    workingSubdir: testCase.workingSubdir ?? ".",
    prompt: testCase.prompt ?? null,
    turns: testCase.turns ?? null,
    expectedAny: testCase.expectedAny,
    extraChecks: testCase.extraChecks ?? [],
    requireRepoSkillTraceEvidence: testCase.requireRepoSkillTraceEvidence ?? true,
    timeoutMs: testCase.timeoutMs ?? defaultTimeoutMs,
    setupMode: testCase.setupMode ?? null,
    envMode: testCase.envMode ?? null,
  };
}

export function createCaseManifestRecords(cases, defaultTimeoutMs) {
  return cases.map((testCase) => normalizeCaseManifestRecord(testCase, defaultTimeoutMs));
}

export function createCaseManifestFingerprint(cases, defaultTimeoutMs) {
  return createHash("sha256")
    .update(JSON.stringify(createCaseManifestRecords(cases, defaultTimeoutMs)))
    .digest("hex");
}

export function createRunnerSourceFingerprint(repoRoot, relativePaths = runnerSourceRelativePaths) {
  const sourcePayload = relativePaths.map((relativePath) => ({
    relativePath,
    content: readFileSync(path.join(repoRoot, relativePath), "utf8"),
  }));

  return createHash("sha256").update(JSON.stringify(sourcePayload)).digest("hex");
}

export function createManifestMetadata(cases, defaultTimeoutMs, repoRoot) {
  return {
    case_ids: cases.map((testCase) => testCase.id),
    total_available_cases: cases.length,
    case_manifest_fingerprint: createCaseManifestFingerprint(cases, defaultTimeoutMs),
    runner_source_fingerprint: createRunnerSourceFingerprint(repoRoot),
  };
}

export function collectReferencedArtifactPaths(summary) {
  const referencedPaths = [];

  for (const check of summary.checks ?? []) {
    for (const key of ["message_path", "trace_path", "stderr_path"]) {
      if (typeof check[key] === "string" && check[key].length > 0) {
        referencedPaths.push(check[key]);
      }
    }

    for (const turnMessagePath of check.turn_message_paths ?? []) {
      if (typeof turnMessagePath === "string" && turnMessagePath.length > 0) {
        referencedPaths.push(turnMessagePath);
      }
    }

    for (const attempt of check.attempts ?? []) {
      if (typeof attempt.result_path === "string" && attempt.result_path.length > 0) {
        referencedPaths.push(attempt.result_path);
      }

      for (const turnMessagePath of attempt.turn_message_paths ?? []) {
        if (typeof turnMessagePath === "string" && turnMessagePath.length > 0) {
          referencedPaths.push(turnMessagePath);
        }
      }
    }
  }

  return [...new Set(referencedPaths)].sort();
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function arraysEqual(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

export function validateSummaryContract(summary, manifestMetadata, repoRoot, options = {}) {
  const issues = [];
  const selectedCaseIds = Array.isArray(summary.selected_case_ids) ? summary.selected_case_ids : [];
  const checks = Array.isArray(summary.checks) ? summary.checks : [];
  const checkIds = checks.map((check) => check.id);
  const integrity = summary.artifact_integrity ?? {};
  const requireFullSuite = options.requireFullSuite !== false;
  const passedCount = checks.filter((check) => check.pass === true).length;
  const expectedScore = checks.length === 0 ? 0 : Math.round((passedCount / checks.length) * 100);

  if (!isNonEmptyString(summary.case_manifest_fingerprint)) {
    issues.push("summary case_manifest_fingerprint is missing or empty");
  } else if (summary.case_manifest_fingerprint !== manifestMetadata.case_manifest_fingerprint) {
    issues.push("summary case_manifest_fingerprint does not match the current manifest");
  }

  if (!isNonEmptyString(summary.runner_source_fingerprint)) {
    issues.push("summary runner_source_fingerprint is missing or empty");
  } else if (summary.runner_source_fingerprint !== manifestMetadata.runner_source_fingerprint) {
    issues.push("summary runner_source_fingerprint does not match the current runner sources");
  }

  if (summary.runner_fingerprint !== undefined && summary.runner_fingerprint !== summary.case_manifest_fingerprint) {
    issues.push("summary runner_fingerprint does not match case_manifest_fingerprint");
  }

  if (summary.selected_case_count !== selectedCaseIds.length) {
    issues.push("summary selected_case_count does not match selected_case_ids length");
  }

  if (summary.total_available_cases !== manifestMetadata.total_available_cases) {
    issues.push("summary total_available_cases does not match current manifest length");
  }

  for (const caseId of selectedCaseIds) {
    if (!manifestMetadata.case_ids.includes(caseId)) {
      issues.push(`summary selected_case_ids contains unknown case ${caseId}`);
    }
  }

  if (!Array.isArray(summary.checks)) {
    issues.push("summary checks is missing or not an array");
  } else if (checks.length !== summary.selected_case_count) {
    issues.push("summary checks length does not match selected_case_count");
  }

  if (summary.score !== expectedScore) {
    issues.push("summary score does not match the current check results");
  }

  if (checks.some((check) => check.pass !== true)) {
    issues.push("summary contains failing checks");
  }

  if (summary.overall_pass !== (passedCount === checks.length && integrity.integrity_passed === true)) {
    issues.push("summary overall_pass does not match checks/integrity state");
  }

  if (!arraysEqual(checkIds, selectedCaseIds)) {
    issues.push("summary checks ids do not exactly match selected_case_ids");
  }

  if (!Array.isArray(integrity.expected_case_ids)) {
    issues.push("artifact_integrity expected_case_ids is missing or not an array");
  } else if (!arraysEqual(integrity.expected_case_ids, selectedCaseIds)) {
    issues.push("artifact_integrity expected_case_ids does not exactly match selected_case_ids");
  }

  if (integrity.selected_case_count !== summary.selected_case_count) {
    issues.push("artifact_integrity selected_case_count does not match summary selected_case_count");
  }

  if (integrity.checks_considered !== checks.length) {
    issues.push("artifact_integrity checks_considered does not match checks length");
  }

  if (integrity.integrity_passed !== true) {
    issues.push("artifact_integrity integrity_passed must be true");
  }

  if (!Array.isArray(integrity.missing_paths)) {
    issues.push("artifact_integrity missing_paths is missing or not an array");
  } else if (integrity.missing_paths.length !== 0) {
    issues.push("artifact_integrity missing_paths must be empty");
  }

  if (!Array.isArray(integrity.extra_case_dirs)) {
    issues.push("artifact_integrity extra_case_dirs is missing or not an array");
  } else if (integrity.extra_case_dirs.length !== 0) {
    issues.push("artifact_integrity extra_case_dirs must be empty");
  }

  if (requireFullSuite && summary.full_suite !== true) {
    issues.push("summary must represent a full_suite artifact bundle");
  }

  if (summary.full_suite) {
    if (!arraysEqual(selectedCaseIds, manifestMetadata.case_ids)) {
      issues.push("summary full_suite selected_case_ids do not exactly match the current manifest order");
    }
  }

  for (const artifactPath of collectReferencedArtifactPaths(summary)) {
    if (path.isAbsolute(artifactPath)) {
      issues.push(`summary references an absolute artifact path ${artifactPath}`);
      continue;
    }

    if (!existsSync(path.join(repoRoot, artifactPath))) {
      issues.push(`summary references a missing artifact path ${artifactPath}`);
    }
  }

  return issues;
}
