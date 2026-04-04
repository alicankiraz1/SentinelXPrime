import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveFromImportMetaUrl } from "./lib/import-meta-paths.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..");
const issues = [];

const workedExampleDocs = [
  "skills/sentinelx-prime/references/active-analysis.md",
  "skills/sentinelx-plan-gap/references/plan-gap-checklist.md",
  "skills/sentinelx-review-gate/references/review-categories.md",
  "skills/sentinelx-test-rig/references/tool-selection.md",
];
const cryptoReferenceDocs = [
  "skills/shared/common-web-threats.md",
  "skills/sentinelx-plan-gap/references/plan-gap-checklist.md",
  "skills/sentinelx-review-gate/references/review-categories.md",
];

for (const relativePath of [
  "skills/shared/crypto-guidance.md",
  "skills/shared/stack-profiles/go-web.md",
  "skills/shared/stack-profiles/ruby-rails.md",
  "skills/shared/stack-profiles/php-laravel.md",
  "skills/shared/stack-profiles/rust-web.md",
]) {
  if (!existsSync(path.join(repoRoot, relativePath))) {
    issues.push(`missing required reference file ${relativePath}`);
  }
}

for (const relativePath of workedExampleDocs) {
  const content = readFileSync(path.join(repoRoot, relativePath), "utf8");
  if (!/Worked Example/i.test(content)) {
    issues.push(`${relativePath} must include a Worked Example section`);
  }
}

for (const relativePath of cryptoReferenceDocs) {
  const content = readFileSync(path.join(repoRoot, relativePath), "utf8");
  if (!/crypto-guidance\.md/.test(content)) {
    issues.push(`${relativePath} must cross-reference skills/shared/crypto-guidance.md`);
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
