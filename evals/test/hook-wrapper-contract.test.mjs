import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

test("Windows hook wrapper fails closed when bash is unavailable", () => {
  const wrapper = readFileSync(path.join(repoRoot, "hooks", "run-hook.cmd"), "utf8");
  const cmdBlockMatch = wrapper.match(/@echo off[\s\S]*?\nCMDBLOCK/m);

  assert.ok(cmdBlockMatch);

  const [cmdBlock] = cmdBlockMatch;

  assert.doesNotMatch(cmdBlock, /exit \/b 0/i);
  assert.match(cmdBlock, /echo .*requires bash/i);
  assert.match(cmdBlock, /exit \/b 1/i);
});
