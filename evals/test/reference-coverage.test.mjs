import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("catalogs the expanded supported stack values in the finding schema", () => {
  const findingSchema = read("skills/shared/finding-schema.md");

  for (const stack of ["go-web", "ruby-rails", "php-laravel", "rust-web"]) {
    assert.match(findingSchema, new RegExp(`\\\`${stack}\\\``));
  }
});

test("ships crypto guidance and links to it from planning and review references", () => {
  const cryptoPath = path.join(repoRoot, "skills/shared/crypto-guidance.md");
  assert.equal(existsSync(cryptoPath), true);

  const cryptoGuidance = read("skills/shared/crypto-guidance.md");
  const planChecklist = read("skills/sentinelx-plan-gap/references/plan-gap-checklist.md");
  const reviewCategories = read("skills/sentinelx-review-gate/references/review-categories.md");
  const commonThreats = read("skills/shared/common-web-threats.md");

  assert.match(cryptoGuidance, /Password Hashing/i);
  assert.match(cryptoGuidance, /Encryption/i);
  assert.match(cryptoGuidance, /Token Signing/i);
  assert.match(cryptoGuidance, /Key Storage/i);
  assert.match(cryptoGuidance, /Unsafe Defaults/i);

  assert.match(planChecklist, /crypto-guidance\.md/);
  assert.match(reviewCategories, /crypto-guidance\.md/);
  assert.match(commonThreats, /crypto-guidance\.md/);
});

test("ships four new stack profiles with the common profile structure", () => {
  for (const profileName of ["go-web", "ruby-rails", "php-laravel", "rust-web"]) {
    const relativePath = `skills/shared/stack-profiles/${profileName}.md`;
    assert.equal(existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);

    const profile = read(relativePath);
    assert.match(profile, /When To Use/);
    assert.match(profile, /Focus Areas/);
    assert.match(profile, /Red Flags/);
  }
});

test("documents worked examples and a stage decision aid", () => {
  const activeAnalysis = read("skills/sentinelx-prime/references/active-analysis.md");
  const planChecklist = read("skills/sentinelx-plan-gap/references/plan-gap-checklist.md");
  const reviewCategories = read("skills/sentinelx-review-gate/references/review-categories.md");
  const toolSelection = read("skills/sentinelx-test-rig/references/tool-selection.md");
  const readme = read("README.md");

  for (const content of [activeAnalysis, planChecklist, reviewCategories, toolSelection]) {
    assert.match(content, /Worked Example/i);
  }

  assert.match(readme, /Stage Decision Aid/i);
  assert.match(readme, /code is done/i);
  assert.match(readme, /release or handoff hardening/i);
  assert.match(readme, /stage evidence is weak or contradictory/i);
});

test("documents the canonical risk_scope_key shape in both reference files", () => {
  const activeAnalysis = read("skills/sentinelx-prime/references/active-analysis.md");
  const reviewTemplate = read("skills/sentinelx-prime/references/risky-change-review-pass-template.md");

  for (const content of [activeAnalysis, reviewTemplate]) {
    assert.match(content, /<primary-risk-domain>:v1:<sha256\(payload\)>/);
    assert.match(content, /mode=current-source/);
    assert.match(content, /mode=description/);
  }
});
