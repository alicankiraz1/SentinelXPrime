import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("catalogs node-web as a supported stack value", () => {
  const findingSchema = read("skills/shared/finding-schema.md");

  assert.match(findingSchema, /`node-web`/);
});

test("documents a generic node-web stack profile", () => {
  const profile = read("skills/shared/stack-profiles/node-web.md");

  assert.match(profile, /generic server-side Node\.js or TypeScript services/i);
  assert.match(profile, /When To Use/);
  assert.match(profile, /Focus Areas/);
  assert.match(profile, /Red Flags/);
  assert.doesNotMatch(profile, /Express/i);
});

test("lists canonical node-web commands in tool selection guidance", () => {
  const toolSelection = read("skills/sentinelx-test-rig/references/tool-selection.md");
  const sampleCommands = read("skills/sentinelx-test-rig/references/sample-commands.md");

  assert.match(toolSelection, /npm audit --omit=dev/);
  assert.match(toolSelection, /semgrep scan \./);
  assert.match(sampleCommands, /npm audit --omit=dev/);
  assert.match(sampleCommands, /semgrep scan \./);
});
