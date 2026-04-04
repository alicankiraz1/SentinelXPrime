import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectMarkdownDocs } from "../../scripts/lib/markdown-doc-inventory.mjs";

function createTempRepo() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-markdown-docs-"));
}

test("collects root markdown plus recursive docs install surfaces without duplicates", () => {
  const tempRepo = createTempRepo();

  try {
    mkdirSync(path.join(tempRepo, "docs", "validation"), { recursive: true });
    mkdirSync(path.join(tempRepo, ".codex"), { recursive: true });
    mkdirSync(path.join(tempRepo, ".opencode"), { recursive: true });
    mkdirSync(path.join(tempRepo, "evals"), { recursive: true });

    writeFileSync(path.join(tempRepo, "README.md"), "# Readme\n", "utf8");
    writeFileSync(path.join(tempRepo, "SECURITY.md"), "# Security\n", "utf8");
    writeFileSync(path.join(tempRepo, "CHANGELOG.md"), "# Changelog\n", "utf8");
    writeFileSync(path.join(tempRepo, "notes.txt"), "ignore\n", "utf8");
    writeFileSync(path.join(tempRepo, "docs", "validation", "release-readiness.md"), "# Readiness\n", "utf8");
    writeFileSync(path.join(tempRepo, ".codex", "INSTALL.md"), "# Install\n", "utf8");
    writeFileSync(path.join(tempRepo, ".opencode", "INSTALL.md"), "# Install\n", "utf8");
    writeFileSync(path.join(tempRepo, "evals", "README.md"), "# Evals\n", "utf8");

    const docs = collectMarkdownDocs(tempRepo);

    assert.deepEqual(docs, [
      ".codex/INSTALL.md",
      ".opencode/INSTALL.md",
      "CHANGELOG.md",
      "README.md",
      "SECURITY.md",
      "docs/validation/release-readiness.md",
      "evals/README.md",
    ]);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
