#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
hook_script="$repo_root/hooks/run-hook.cmd"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/sentinelx-prime-hook-test.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

claude_output="$tmp_dir/claude.json"
default_output="$tmp_dir/default.json"

CLAUDE_PLUGIN_ROOT="$repo_root" "$hook_script" session-start >"$claude_output"
"$hook_script" session-start >"$default_output"

node - "$claude_output" "$default_output" <<'NODE'
const fs = require("node:fs");

const [claudePath, defaultPath] = process.argv.slice(2);
const claudePayload = JSON.parse(fs.readFileSync(claudePath, "utf8"));
const defaultPayload = JSON.parse(fs.readFileSync(defaultPath, "utf8"));

if (typeof claudePayload?.hookSpecificOutput?.additionalContext !== "string") {
  throw new Error("Claude payload missing hookSpecificOutput.additionalContext");
}

if (!claudePayload.hookSpecificOutput.additionalContext.includes("SentinelXPrime")) {
  throw new Error("Claude payload missing SentinelXPrime context");
}

if (typeof defaultPayload?.additionalContext !== "string") {
  throw new Error("Default payload missing additionalContext");
}

if (!defaultPayload.additionalContext.includes("using-sentinelx")) {
  throw new Error("Default payload missing using-sentinelx bootstrap context");
}
NODE
