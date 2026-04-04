import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolveFromImportMetaUrl } from "../../scripts/lib/import-meta-paths.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..", "..");

test("manifest-json ignores runtime timeout overrides", () => {
  const defaultResult = spawnSync("node", ["evals/run-sentinelx-prime.mjs", "--manifest-json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const overriddenResult = spawnSync("node", ["evals/run-sentinelx-prime.mjs", "--manifest-json"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      SENTINELX_PRIME_EVAL_TIMEOUT_MS: "12345",
    },
    encoding: "utf8",
  });

  assert.equal(defaultResult.status, 0, defaultResult.stderr || defaultResult.stdout);
  assert.equal(overriddenResult.status, 0, overriddenResult.stderr || overriddenResult.stdout);
  assert.deepEqual(JSON.parse(overriddenResult.stdout), JSON.parse(defaultResult.stdout));
});
