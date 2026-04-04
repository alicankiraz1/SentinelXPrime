import test from "node:test";
import assert from "node:assert/strict";

import { createRiskScopeKey } from "../../scripts/lib/risk-scope-key.mjs";

test("normalizes risky paths before hashing the scope key", () => {
  const first = createRiskScopeKey({
    primaryRiskDomain: "authn",
    riskyPaths: ["src\\Auth\\Token.cs", "./src/Auth/../Auth/Token.cs", "src/Auth/Token.cs"],
    mode: "current-source",
  });

  const second = createRiskScopeKey({
    primaryRiskDomain: "authn",
    riskyPaths: ["src/Auth/Token.cs"],
    mode: "current-source",
  });

  assert.equal(first, second);
  assert.match(first, /^authn:v1:[a-f0-9]{64}$/);
});

test("changes the scope key when the risky file set changes materially", () => {
  const first = createRiskScopeKey({
    primaryRiskDomain: "authn",
    riskyPaths: ["src/Auth/Token.cs"],
    mode: "current-source",
  });

  const second = createRiskScopeKey({
    primaryRiskDomain: "authn",
    riskyPaths: ["src/Auth/Token.cs", "src/Auth/Session.cs"],
    mode: "current-source",
  });

  assert.notEqual(first, second);
});

test("changes the scope key when trust-boundary semantics change inside the same files", () => {
  const first = createRiskScopeKey({
    primaryRiskDomain: "authn",
    riskyPaths: ["src/Auth/Token.cs"],
    diffSummaryHeaders: ["@@ validate issuer and audience @@"],
    trustBoundarySummary: "token validation only",
    mode: "diff",
  });

  const second = createRiskScopeKey({
    primaryRiskDomain: "authn",
    riskyPaths: ["src/Auth/Token.cs"],
    diffSummaryHeaders: ["@@ validate issuer and audience @@"],
    trustBoundarySummary: "token validation plus admin impersonation rules",
    mode: "diff",
  });

  assert.notEqual(first, second);
});
