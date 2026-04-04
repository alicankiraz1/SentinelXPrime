import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateSummaryContract } from "../../evals/lib/release-contract.mjs";
import { createReleaseManifestMetadata } from "../../evals/lib/release-manifest.mjs";

export function parseValidateReleaseSurfaceArgs(argv) {
  const supportedFlags = new Set(["--require-summary"]);
  const unsupportedArgs = argv.filter((arg) => !supportedFlags.has(arg));

  if (unsupportedArgs.length > 0) {
    throw new Error(`Unsupported arguments: ${unsupportedArgs.join(", ")}`);
  }

  return {
    requireSummary: argv.includes("--require-summary"),
  };
}

export function loadManifestMetadata(repoRoot) {
  try {
    return {
      issues: [],
      manifestMetadata: createReleaseManifestMetadata(repoRoot),
    };
  } catch (error) {
    return {
      issues: [`unable to load eval manifest metadata: ${error.message}`],
      manifestMetadata: null,
    };
  }
}

export function validateSummaryManifest({ repoRoot, requireSummary = false, manifestMetadata = null }) {
  const issues = [];
  const summaryPath = path.join(repoRoot, "evals", "artifacts", "summary.json");

  if (!existsSync(summaryPath)) {
    if (requireSummary) {
      issues.push("evals/artifacts/summary.json is required but missing");
    }
    return issues;
  }

  let summary;

  try {
    summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  } catch (error) {
    issues.push(`evals/artifacts/summary.json is not valid JSON: ${error.message}`);
    return issues;
  }

  if (manifestMetadata !== null) {
    issues.push(...validateSummaryContract(summary, manifestMetadata, repoRoot));
    return issues;
  }

  const manifestResult = loadManifestMetadata(repoRoot);
  issues.push(...manifestResult.issues);
  if (!manifestResult.manifestMetadata) {
    return issues;
  }

  issues.push(...validateSummaryContract(summary, manifestResult.manifestMetadata, repoRoot));
  return issues;
}
