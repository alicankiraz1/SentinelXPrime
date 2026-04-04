import test from "node:test";
import assert from "node:assert/strict";

import { cases } from "../lib/case-catalog.mjs";

function findCase(id) {
  return cases.find((entry) => entry.id === id);
}

test("includes dedicated uncertain-stage eval coverage", () => {
  const advisoryCase = findCase("uncertain-stage-advisory");
  const noOfferCase = findCase("uncertain-stage-no-offer");

  assert.ok(advisoryCase, "uncertain-stage-advisory case should exist");
  assert.ok(noOfferCase, "uncertain-stage-no-offer case should exist");
  assert.deepEqual(advisoryCase.expectedAny, ["stage is uncertain"]);
  assert.deepEqual(noOfferCase.expectedAny, ["stay advisory"]);
});

test("includes a multi-turn lifecycle eval for plan, review, and test-rig routing", () => {
  const lifecycleCase = findCase("repo-integrated-lifecycle");

  assert.ok(lifecycleCase, "repo-integrated-lifecycle case should exist");
  assert.equal(Array.isArray(lifecycleCase.turns), true);
  assert.equal(lifecycleCase.turns.length, 3);
  assert.deepEqual(lifecycleCase.expectedAny, ["stack-aware security check plan"]);
  assert.equal(Array.isArray(lifecycleCase.extraChecks), true);
  assert.match(JSON.stringify(lifecycleCase.extraChecks), /sentinelx-plan-gap/);
  assert.match(JSON.stringify(lifecycleCase.extraChecks), /focused security review/);
});
