import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

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

test("package-release rejects unsafe archive names", () => {
  const invalidNames = ["../outside-name", ".hidden-name", "-T"];

  for (const archiveName of invalidNames) {
    const { tempRoot, tempRepo } = copyRepoToTemp("sentinelx-prime-package-invalid-name-");

    try {
      const result = spawnSync("bash", ["scripts/package-release.sh", archiveName], {
        cwd: tempRepo,
        encoding: "utf8",
      });

      assert.equal(result.status, 1, `${archiveName}\n${result.stderr}\n${result.stdout}`);
      assert.match(result.stderr, /archive/i, archiveName);
      assert.equal(existsSync(path.join(tempRepo, "outside-name.zip")), false, archiveName);
      assert.equal(readFileSync(path.join(tempRepo, "README.md"), "utf8").length > 0, true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});
