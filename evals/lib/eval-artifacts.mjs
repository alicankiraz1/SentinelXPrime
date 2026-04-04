import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cases } from "./case-catalog.mjs";
import { artifactsRoot, publicArtifactsRoot, repoRoot } from "./eval-constants.mjs";

export { artifactsRoot };

export function toPublicArtifactPath(artifactPath, artifactRoot) {
  return path.join(publicArtifactsRoot, path.relative(artifactRoot, artifactPath));
}

export function toActualArtifactPath(publicPath, artifactRoot) {
  if (publicPath === publicArtifactsRoot) {
    return artifactRoot;
  }

  const prefix = `${publicArtifactsRoot}${path.sep}`;
  if (publicPath.startsWith(prefix)) {
    return path.join(artifactRoot, publicPath.slice(prefix.length));
  }

  return path.resolve(repoRoot, publicPath);
}

export function createStagedArtifactsRoot() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-artifacts-"));
}

export function validateSuiteArtifactIntegrity(selectedCases, checks, artifactRoot) {
  const requiredPaths = new Set();
  const selectedIds = new Set(selectedCases.map((testCase) => testCase.id));
  const existingCaseDirs = existsSync(artifactRoot)
    ? readdirSync(artifactRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    : [];

  for (const testCase of selectedCases) {
    requiredPaths.add(path.join(artifactRoot, testCase.id, "result.json"));
  }

  for (const check of checks) {
    requiredPaths.add(toActualArtifactPath(check.message_path, artifactRoot));
    requiredPaths.add(toActualArtifactPath(check.trace_path, artifactRoot));
    requiredPaths.add(toActualArtifactPath(check.stderr_path, artifactRoot));

    for (const attempt of check.attempts ?? []) {
      requiredPaths.add(toActualArtifactPath(attempt.result_path, artifactRoot));
    }
  }

  const missingPaths = [...requiredPaths].filter((artifactPath) => !existsSync(artifactPath));
  const extraCaseDirs = selectedCases.length === cases.length
    ? existingCaseDirs.filter((dirName) => !selectedIds.has(dirName))
    : [];

  return {
    checks_considered: checks.length,
    expected_case_ids: [...selectedIds],
    selected_case_count: selectedCases.length,
    missing_paths: missingPaths.map((artifactPath) => path.relative(repoRoot, artifactPath)).sort(),
    extra_case_dirs: extraCaseDirs,
    integrity_passed: missingPaths.length === 0 && extraCaseDirs.length === 0,
  };
}
