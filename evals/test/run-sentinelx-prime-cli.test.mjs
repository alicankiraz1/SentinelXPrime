import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

function writeExecutable(filePath, content) {
  writeFileSync(filePath, content, "utf8");
  chmodSync(filePath, 0o755);
}

function installCodexStub(tempRoot, phrase = "focused security review") {
  const binDir = path.join(tempRoot, "bin");
  const stubPath = path.join(binDir, "codex");
  mkdirSync(binDir, { recursive: true });
  writeExecutable(
    stubPath,
    [
      "#!/usr/bin/env node",
      'const fs = require("node:fs");',
      "const args = process.argv.slice(2);",
      'const outputIndex = args.indexOf("-o");',
      "if (outputIndex >= 0 && args[outputIndex + 1]) {",
      `  fs.writeFileSync(args[outputIndex + 1], ${JSON.stringify(`${phrase}\n`)}, "utf8");`,
      "}",
      "process.exit(0);",
      "",
    ].join("\n")
  );

  return { binDir, stubPath, phrase };
}

function writeAuthFile(tempRoot) {
  const codexHome = path.join(tempRoot, "codex-home");
  mkdirSync(codexHome, { recursive: true });
  writeFileSync(
    path.join(codexHome, "auth.json"),
    `${JSON.stringify({ access_token: "test-token", refresh_token: "refresh-token" })}\n`,
    "utf8"
  );
  return codexHome;
}

function runEval(tempRepo, args, env = {}) {
  return spawnSync(process.execPath, ["evals/run-sentinelx-prime.mjs", ...args], {
    cwd: tempRepo,
    env: {
      ...process.env,
      ...env,
    },
    encoding: "utf8",
  });
}

function readSummary(repoPath) {
  return JSON.parse(readFileSync(path.join(repoPath, "evals", "artifacts", "summary.json"), "utf8"));
}

function seedPersistentArtifacts(repoPath) {
  const summaryPath = path.join(repoPath, "evals", "artifacts", "summary.json");
  const caseResultPath = path.join(repoPath, "evals", "artifacts", "repo-review-offer", "result.json");
  const summaryText = `${JSON.stringify({ sentinel: "original-summary", score: 100 }, null, 2)}\n`;
  const caseResultText = `${JSON.stringify({ sentinel: "original-case-result", pass: true }, null, 2)}\n`;
  writeFileSync(summaryPath, summaryText, "utf8");
  writeFileSync(caseResultPath, caseResultText, "utf8");
  return { summaryText, caseResultText };
}

test("preflight-only fails fast when codex is missing and does not touch persistent artifacts", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-eval-preflight-missing-codex-");
  const { summaryText: originalSummary } = seedPersistentArtifacts(tempRepo);

  try {
    const result = runEval(tempRepo, ["--preflight-only"], {
      PATH: "/usr/bin:/bin",
      HOME: path.join(tempRoot, "home"),
      CODEX_HOME: path.join(tempRoot, "home", ".codex"),
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /codex/i);
    assert.equal(readFileSync(path.join(tempRepo, "evals", "artifacts", "summary.json"), "utf8"), originalSummary);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("preflight-only reports missing auth without leaking token-like content", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-eval-preflight-missing-auth-");
  const { binDir } = installCodexStub(tempRoot);

  try {
    const result = runEval(tempRepo, ["--preflight-only"], {
      PATH: `${binDir}:/usr/bin:/bin`,
      HOME: path.join(tempRoot, "home"),
      CODEX_HOME: path.join(tempRoot, "missing-codex-home"),
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /auth\.json/i);
    assert.doesNotMatch(result.stderr, /test-token|refresh-token|access_token/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("default eval runs without promoting persistent artifacts", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-eval-no-promote-");
  const { binDir } = installCodexStub(tempRoot);
  const codexHome = writeAuthFile(tempRoot);
  const {
    summaryText: originalSummary,
    caseResultText: originalCaseResult,
  } = seedPersistentArtifacts(tempRepo);

  try {
    const result = runEval(tempRepo, ["repo-review-offer"], {
      PATH: `${binDir}:${process.env.PATH ?? ""}`,
      HOME: tempRoot,
      CODEX_HOME: codexHome,
      SENTINELX_PRIME_FAKE_MESSAGE: "focused security review",
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(readFileSync(path.join(tempRepo, "evals", "artifacts", "summary.json"), "utf8"), originalSummary);
    assert.equal(readFileSync(path.join(tempRepo, "evals", "artifacts", "repo-review-offer", "result.json"), "utf8"), originalCaseResult);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("promote-artifacts writes the selected summary into evals/artifacts", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-eval-promote-");
  const { binDir } = installCodexStub(tempRoot);
  const codexHome = writeAuthFile(tempRoot);

  try {
    const result = runEval(tempRepo, ["--promote-artifacts", "repo-review-offer"], {
      PATH: `${binDir}:${process.env.PATH ?? ""}`,
      HOME: tempRoot,
      CODEX_HOME: codexHome,
      SENTINELX_PRIME_FAKE_MESSAGE: "focused security review",
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const summary = readSummary(tempRepo);
    assert.deepEqual(summary.selected_case_ids, ["repo-review-offer"]);
    assert.equal(summary.selected_case_count, 1);
    assert.equal(summary.score, 100);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("returns a failing exit code when eval checks do not pass", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-eval-failing-suite-");
  const { binDir } = installCodexStub(tempRoot, "unexpected text");
  const codexHome = writeAuthFile(tempRoot);

  try {
    const result = runEval(tempRepo, ["--promote-artifacts", "repo-review-offer"], {
      PATH: `${binDir}:${process.env.PATH ?? ""}`,
      HOME: tempRoot,
      CODEX_HOME: codexHome,
    });

    assert.equal(result.status, 1);

    const summary = readSummary(tempRepo);
    assert.equal(summary.overall_pass, false);
    assert.equal(summary.score, 0);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
