#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

node --check evals/run-sentinelx-prime.mjs
node --check evals/lib/case-catalog.mjs
node --check evals/lib/check-oracles.mjs
node --check evals/lib/eval-artifacts.mjs
node --check evals/lib/eval-case-runner.mjs
node --check evals/lib/eval-constants.mjs
node --check evals/lib/release-contract.mjs
node --check evals/lib/release-manifest.mjs
node --check scripts/check-release-surface.mjs
node --check scripts/check-release-readiness.mjs
node --check scripts/check-archive-name.mjs
node --check scripts/check-doc-links.mjs
node --check scripts/check-doc-claims.mjs
node --check scripts/check-hook-entrypoints.mjs
node --check scripts/check-legacy-names.mjs
node --check scripts/check-reference-coverage.mjs
node --check scripts/check-skill-metadata.mjs
node --check scripts/copy-release-surface.mjs
node --check scripts/lib/package-root-guard.mjs
node --check scripts/lib/filesystem-walker.mjs
node --check scripts/lib/import-meta-paths.mjs
node --check scripts/lib/markdown-doc-inventory.mjs
node --check scripts/lib/archive-name.mjs
node --check scripts/lib/release-policy.mjs
node --check scripts/lib/release-archive-verifier.mjs
node --check scripts/lib/risk-scope-key.mjs
node --check scripts/lib/release-surface-manifest.mjs
node --check scripts/lib/release-surface-validator.mjs
node --check scripts/print-release-exclude-patterns.mjs
node --check scripts/validate-release-surface.mjs
node --check scripts/verify-release-archive.mjs
node --check scripts/write-release-manifest.mjs

node -e 'const fs = require("node:fs"); for (const file of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", "hooks/hooks.json"]) { JSON.parse(fs.readFileSync(file, "utf8")); }'

node --test evals/test/*.test.mjs

ruby <<'RUBY'
require "yaml"

Dir.glob("skills/**/agents/openai.yaml").sort.each do |file|
  YAML.load_file(file)
end
RUBY

bash tests/hooks/test-session-start.sh
node scripts/check-doc-links.mjs
node scripts/check-doc-claims.mjs
node scripts/check-hook-entrypoints.mjs
node scripts/check-skill-metadata.mjs
node scripts/check-legacy-names.mjs
node scripts/check-reference-coverage.mjs
node scripts/validate-release-surface.mjs
