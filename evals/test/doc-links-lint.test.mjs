import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceScript = path.join(repoRoot, "scripts", "check-doc-links.mjs");
const sourceHelper = path.join(repoRoot, "scripts", "lib", "import-meta-paths.mjs");
const sourceInventoryHelper = path.join(repoRoot, "scripts", "lib", "markdown-doc-inventory.mjs");

function createTempRepo() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-doc-links-"));
}

function runLint(tempRepo) {
  const scriptDir = path.join(tempRepo, "scripts");
  const libDir = path.join(scriptDir, "lib");
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(libDir, { recursive: true });
  cpSync(sourceScript, path.join(scriptDir, "check-doc-links.mjs"));
  cpSync(sourceHelper, path.join(libDir, "import-meta-paths.mjs"));
  cpSync(sourceInventoryHelper, path.join(libDir, "markdown-doc-inventory.mjs"));
  return spawnSync("node", [path.join(scriptDir, "check-doc-links.mjs")], {
    cwd: tempRepo,
    encoding: "utf8",
  });
}

test("fails on broken links inside validation docs", () => {
  const tempRepo = createTempRepo();
  mkdirSync(path.join(tempRepo, "docs", "validation"), { recursive: true });
  writeFileSync(
    path.join(tempRepo, "docs", "validation", "release-readiness.md"),
    "# Release Readiness\n\n[broken](./missing-file.md)\n",
    "utf8"
  );

  const result = runLint(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /release-readiness\.md/i);
  assert.match(result.stderr, /missing-file\.md/i);
});

test("allows valid local links inside validation docs", () => {
  const tempRepo = createTempRepo();
  mkdirSync(path.join(tempRepo, "docs", "validation"), { recursive: true });
  writeFileSync(
    path.join(tempRepo, "docs", "validation", "release-readiness.md"),
    "# Release Readiness\n\n[scenario](./scenario.md)\n",
    "utf8"
  );
  writeFileSync(path.join(tempRepo, "docs", "validation", "scenario.md"), "# Scenario\n", "utf8");

  const result = runLint(tempRepo);

  assert.equal(result.status, 0);
});

test("fails on broken links inside root markdown docs", () => {
  const tempRepo = createTempRepo();
  writeFileSync(
    path.join(tempRepo, "SECURITY.md"),
    "# Security\n\n[broken](./missing-file.md)\n",
    "utf8"
  );

  const result = runLint(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /SECURITY\.md/i);
  assert.match(result.stderr, /missing-file\.md/i);
});

test("rejects local links that escape the repository root", () => {
  const tempRepo = createTempRepo();
  const outsideRoot = mkdtempSync(path.join(tmpdir(), "sentinelx-prime-doc-links-outside-"));
  const outsideTarget = path.join(outsideRoot, "outside.md");

  try {
    writeFileSync(
      path.join(tempRepo, "README.md"),
      `# Readme\n\n[outside](${outsideTarget})\n`,
      "utf8"
    );
    writeFileSync(outsideTarget, "# Outside\n", "utf8");

    const result = runLint(tempRepo);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /README\.md/i);
    assert.match(result.stderr, /outside/i);
  } finally {
    rmSync(outsideRoot, { recursive: true, force: true });
  }
});
