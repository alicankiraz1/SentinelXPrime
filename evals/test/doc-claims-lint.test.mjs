import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceScript = path.join(repoRoot, "scripts", "check-doc-claims.mjs");
const sourceHelper = path.join(repoRoot, "scripts", "lib", "import-meta-paths.mjs");
const sourceInventoryHelper = path.join(repoRoot, "scripts", "lib", "markdown-doc-inventory.mjs");

function createTempRepo() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-doc-claims-"));
}

function runLint(tempRepo) {
  const scriptDir = path.join(tempRepo, "scripts");
  const libDir = path.join(scriptDir, "lib");
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(libDir, { recursive: true });
  cpSync(sourceScript, path.join(scriptDir, "check-doc-claims.mjs"));
  cpSync(sourceHelper, path.join(libDir, "import-meta-paths.mjs"));
  cpSync(sourceInventoryHelper, path.join(libDir, "markdown-doc-inventory.mjs"));
  return spawnSync("node", [path.join(scriptDir, "check-doc-claims.mjs")], {
    cwd: tempRepo,
    encoding: "utf8",
  });
}

test("fails on public-facing production-ready style claims", () => {
  const tempRepo = createTempRepo();
  mkdirSync(path.join(tempRepo, "docs", "validation"), { recursive: true });
  writeFileSync(
    path.join(tempRepo, "docs", "validation", "release-readiness.md"),
    "# Release Readiness\n\nThis is production-ready.\n",
    "utf8"
  );

  const result = runLint(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /release-readiness\.md/i);
  assert.match(result.stderr, /Production-Ready|production-ready/);
});

test("allows explicitly negated security and release-assurance language", () => {
  const tempRepo = createTempRepo();
  mkdirSync(path.join(tempRepo, "docs"), { recursive: true });
  writeFileSync(
    path.join(tempRepo, "README.md"),
    "This repository does not certify a project as fully secure or production-ready.\n",
    "utf8"
  );

  const result = runLint(tempRepo);

  assert.equal(result.status, 0);
});

test("fails on unsupported claims inside root markdown docs", () => {
  const tempRepo = createTempRepo();
  writeFileSync(
    path.join(tempRepo, "CHANGELOG.md"),
    "# Changelog\n\nThis is production-ready.\n",
    "utf8"
  );

  const result = runLint(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /CHANGELOG\.md/i);
  assert.match(result.stderr, /Production-Ready|production-ready/);
});

test("allows Turkish negated assurance language", () => {
  const tempRepo = createTempRepo();
  writeFileSync(
    path.join(tempRepo, "README.md"),
    "Bu repo production-ready değil.\n",
    "utf8"
  );

  const result = runLint(tempRepo);

  assert.equal(result.status, 0, result.stderr);
});
