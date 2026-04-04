import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { cases } from "./lib/case-catalog.mjs";
import { repoRoot } from "./lib/eval-constants.mjs";
import {
  artifactsRoot,
  createStagedArtifactsRoot,
  validateSuiteArtifactIntegrity,
} from "./lib/eval-artifacts.mjs";
import { runCase, sanitizeString } from "./lib/eval-case-runner.mjs";
import { createReleaseManifestMetadata } from "./lib/release-manifest.mjs";

const manifestMetadata = createReleaseManifestMetadata(repoRoot);

function listCases() {
  for (const testCase of cases) {
    console.log(testCase.id);
  }
}

function printManifestMetadata() {
  console.log(JSON.stringify(manifestMetadata, null, 2));
}

function parseEvalArgs(argv) {
  const options = {
    list: false,
    manifestJson: false,
    preflightOnly: false,
    promoteArtifacts: false,
    requestedIds: [],
  };

  for (const arg of argv) {
    if (arg === "--list") {
      options.list = true;
      continue;
    }

    if (arg === "--manifest-json") {
      options.manifestJson = true;
      continue;
    }

    if (arg === "--preflight-only") {
      options.preflightOnly = true;
      continue;
    }

    if (arg === "--promote-artifacts") {
      options.promoteArtifacts = true;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unsupported arguments: ${arg}`);
    }

    options.requestedIds.push(arg);
  }

  return options;
}

function runPreflight() {
  const issues = [];
  const sourceCodexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME ?? "", ".codex");
  const authPath = path.join(sourceCodexHome, "auth.json");
  const codexCheck = spawnSync("codex", ["--version"], {
    encoding: "utf8",
    timeout: 10000,
    env: process.env,
  });

  if (codexCheck.error?.code === "ENOENT") {
    issues.push("codex CLI is required on PATH for live eval runs.");
  } else if (codexCheck.error) {
    issues.push(`codex CLI preflight failed: ${sanitizeString(codexCheck.error.message)}`);
  }

  if (!existsSync(authPath)) {
    issues.push(`Codex auth.json is required for live eval runs: ${authPath}`);
  } else {
    try {
      readFileSync(authPath, "utf8");
    } catch (error) {
      issues.push(`Codex auth.json is not readable: ${sanitizeString(error.message)}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

function main() {
  let options;
  try {
    options = parseEvalArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (options.list) {
    listCases();
    return;
  }

  if (options.manifestJson) {
    printManifestMetadata();
    return;
  }

  const selectedCases =
    options.requestedIds.length === 0 ? cases : cases.filter((testCase) => options.requestedIds.includes(testCase.id));

  if (selectedCases.length === 0) {
    console.error("No matching eval cases selected.");
    process.exit(1);
  }

  const preflight = runPreflight();
  if (!preflight.ok) {
    console.error(preflight.issues.join("\n"));
    process.exit(2);
  }

  if (options.preflightOnly) {
    console.log(JSON.stringify({
      ok: true,
      checks: [
        "codex CLI available",
        "Codex auth.json readable",
      ],
    }, null, 2));
    return;
  }

  const stagedArtifactsRoot = createStagedArtifactsRoot();

  try {
    const checks = selectedCases.map((testCase) => runCase(testCase, stagedArtifactsRoot));
    const artifactIntegrity = validateSuiteArtifactIntegrity(selectedCases, checks, stagedArtifactsRoot);
    const passedCount = checks.filter((check) => check.pass).length;
    const score = Math.round((passedCount / checks.length) * 100);
    const summary = {
      runner_fingerprint: manifestMetadata.case_manifest_fingerprint,
      case_manifest_fingerprint: manifestMetadata.case_manifest_fingerprint,
      runner_source_fingerprint: manifestMetadata.runner_source_fingerprint,
      overall_pass: passedCount === checks.length && artifactIntegrity.integrity_passed,
      score,
      selected_case_ids: selectedCases.map((testCase) => testCase.id),
      selected_case_count: selectedCases.length,
      total_available_cases: manifestMetadata.total_available_cases,
      full_suite: selectedCases.length === cases.length,
      artifact_integrity: artifactIntegrity,
      checks,
    };

    writeFileSync(path.join(stagedArtifactsRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    if (options.promoteArtifacts) {
      rmSync(artifactsRoot, { recursive: true, force: true });
      mkdirSync(path.dirname(artifactsRoot), { recursive: true });
      cpSync(stagedArtifactsRoot, artifactsRoot, { recursive: true });
    }

    console.log(JSON.stringify(summary, null, 2));
    if (!summary.overall_pass) {
      process.exit(1);
    }
  } finally {
    rmSync(stagedArtifactsRoot, { recursive: true, force: true });
  }
}

main();
