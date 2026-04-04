import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function copyRepoToTemp(prefix) {
  const tempRoot = mkdtempSync(path.join(tmpdir(), prefix));
  const tempRepo = path.join(tempRoot, "repo türkçe boşluk");

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

function runNodeScript(tempRepo, relativeScriptPath) {
  return spawnSync(process.execPath, [relativeScriptPath], {
    cwd: tempRepo,
    encoding: "utf8",
  });
}

test("validator scripts behave correctly under space and unicode repo roots", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-space-path-");

  const scenarios = [
    {
      name: "check-doc-links reports broken links",
      script: "scripts/check-doc-links.mjs",
      setup() {
        writeFileSync(
          path.join(tempRepo, "README.md"),
          `${readFileSync(path.join(tempRepo, "README.md"), "utf8")}\n[broken](docs/does-not-exist.md)\n`,
          "utf8"
        );
      },
      stderrPattern: /does-not-exist\.md/i,
    },
    {
      name: "check-doc-claims reports unsupported claims",
      script: "scripts/check-doc-claims.mjs",
      setup() {
        writeFileSync(
          path.join(tempRepo, "README.md"),
          `${readFileSync(path.join(tempRepo, "README.md"), "utf8")}\nThis surface is production-ready.\n`,
          "utf8"
        );
      },
      stderrPattern: /production-ready/i,
    },
    {
      name: "check-hook-entrypoints reports missing hook targets",
      script: "scripts/check-hook-entrypoints.mjs",
      setup() {
        const hooksPath = path.join(tempRepo, "hooks", "hooks.json");
        writeFileSync(
          hooksPath,
          readFileSync(hooksPath, "utf8").replace("hooks/run-hook.cmd", "hooks/missing-hook.cmd"),
          "utf8"
        );
      },
      stderrPattern: /missing-hook\.cmd/i,
    },
    {
      name: "check-legacy-names reports legacy naming",
      script: "scripts/check-legacy-names.mjs",
      setup() {
        const legacyLabel = ["Codex", "Sentinel"].join(" ");
        writeFileSync(
          path.join(tempRepo, "README.md"),
          `${readFileSync(path.join(tempRepo, "README.md"), "utf8")}\n${legacyLabel} legacy wording.\n`,
          "utf8"
        );
      },
      stderrPattern: /legacy name match/i,
      forbiddenStderrPattern: /ReferenceError|Node\.js|at file:\/\//i,
    },
    {
      name: "check-reference-coverage reports missing crypto cross-references",
      script: "scripts/check-reference-coverage.mjs",
      setup() {
        const threatsPath = path.join(tempRepo, "skills", "shared", "common-web-threats.md");
        writeFileSync(
          threatsPath,
          readFileSync(threatsPath, "utf8").replace(/.*crypto-guidance\.md.*\n/g, ""),
          "utf8"
        );
      },
      stderrPattern: /crypto-guidance\.md/i,
    },
    {
      name: "check-skill-metadata reports missing metadata files",
      script: "scripts/check-skill-metadata.mjs",
      setup() {
        unlinkSync(path.join(tempRepo, "skills", "using-sentinelx", "agents", "openai.yaml"));
      },
      stderrPattern: /missing agents\/openai\.yaml/i,
    },
  ];

  try {
    for (const scenario of scenarios) {
      scenario.setup();
      const result = runNodeScript(tempRepo, scenario.script);
      assert.equal(result.status, 1, `${scenario.name}\n${result.stderr}\n${result.stdout}`);
      assert.match(result.stderr, scenario.stderrPattern, scenario.name);
      if (scenario.forbiddenStderrPattern) {
        assert.doesNotMatch(result.stderr, scenario.forbiddenStderrPattern, scenario.name);
      }
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("affected eval tests pass when the repository root includes spaces and unicode", () => {
  const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-space-tests-");

  try {
    const result = spawnSync(
      process.execPath,
      [
        "--test",
        "evals/test/package-release-default-name.test.mjs",
        "evals/test/release-archive-verifier.test.mjs",
        "evals/test/release-archive-hook-permissions.test.mjs",
        "evals/test/release-manifest.test.mjs",
        "evals/test/release-surface-manifest.test.mjs",
        "evals/test/run-sentinelx-prime-cli.test.mjs",
      ],
      {
        cwd: tempRepo,
        encoding: "utf8",
      }
    );

    assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
