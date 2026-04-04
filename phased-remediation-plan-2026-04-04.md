# SentinelXPrime Phased Remediation Plan

**Date:** 2026-04-04  
**Status:** This remediation wave is complete; repo validation is green and the release-claim gate is blocked only by the remaining Claude Code runtime evidence

## Summary

- **Completed phases:** `Phase 0`, `Phase 1`, `Phase 2`, `Phase 3`
- **No-op phase:** `Phase 4`
- **Partially blocked phase:** `Phase 5`
- **Current verification:**
  - `bash scripts/static-validation.sh` -> **PASS**
  - `node scripts/check-release-readiness.mjs` -> **FAIL**
  - remaining blocker: `Claude Code must have at least one pass row before making release-ready or handoff claims`

## Phase 0: Critical Hotfix

**Entry Condition:** none  
**Exit Condition:** the claim gate cannot be falsely turned green by non-canonical evidence

| Order | Finding ID | Task | Files | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | FINDING-001 | Restrict the release-readiness parser to the canonical table and add bypass regressions | `scripts/check-release-readiness.mjs`, `evals/test/release-readiness-check.test.mjs` | M | Completed |

**Phase-end verification:**
- [x] `node --test evals/test/release-readiness-check.test.mjs`
- [x] `node scripts/check-release-readiness.mjs` only trusts the authoritative table
- [x] The gate still reports the Claude Code blocker honestly

## Phase 1: Stabilization

**Entry Condition:** Phase 0 completed  
**Exit Condition:** validator bugs are closed and lint/error behavior is consistent

| Order | Finding ID | Task | Files | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | FINDING-002 | Add root markdown coverage and repo-boundary guards | `scripts/check-doc-links.mjs`, `scripts/check-doc-claims.mjs`, related tests | M | Completed |
| 2 | FINDING-003 | Fix the `check-legacy-names` crash and close the false-green regression | `scripts/check-legacy-names.mjs`, `evals/test/space-unicode-path-regressions.test.mjs` | S | Completed |
| 3 | FINDING-007 | Fix the Turkish negation false positive | `scripts/check-doc-claims.mjs`, related tests | S | Completed |

**Phase-end verification:**
- [x] `node --test evals/test/doc-links-lint.test.mjs evals/test/doc-claims-lint.test.mjs evals/test/space-unicode-path-regressions.test.mjs`
- [x] Root markdown files are now covered
- [x] Repo-external link escapes are rejected
- [x] Legacy-name lint is actionable instead of crashing

## Phase 2: Code Quality & Refactor

**Entry Condition:** Phase 1 completed  
**Exit Condition:** doc-validator structure is maintainable and DRY

| Order | Finding ID | Task | Files | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | FINDING-009 | Extract a shared markdown inventory helper and centralize the inclusion policy | `scripts/lib/markdown-doc-inventory.mjs`, `scripts/check-doc-links.mjs`, `scripts/check-doc-claims.mjs`, related tests | S | Completed |

**Phase-end verification:**
- [x] `node --test evals/test/markdown-doc-inventory.test.mjs`
- [x] Duplicate discovery logic is gone
- [x] No behavior regression was introduced

## Phase 3: Hardening

**Entry Condition:** Phase 2 completed  
**Exit Condition:** claim-integrity and test-portability baselines are in place

| Order | Finding ID | Task | Files | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | FINDING-004 | Define and enforce a freshness policy for `current pass` | `docs/validation/release-readiness.md`, `scripts/check-release-readiness.mjs`, related tests | S | Completed |
| 2 | FINDING-006 | Close the root/privileged portability gap | `evals/test/release-readiness-check.test.mjs` | S | Completed |

**Phase-end verification:**
- [x] `node --test evals/test/release-readiness-check.test.mjs`
- [x] Stale `pass` rows do not satisfy the gate
- [x] Invalid `last_verified` values fail with actionable output
- [x] The permission-denied regression does not false-fail under root

## Phase 4: Enhancement

**Entry Condition:** Phase 3 completed  
**Exit Condition:** no required unified bug remains in scope

| Order | Finding ID | Task | Files | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | N/A | No required enhancement-level unified finding was left in scope for this wave | N/A | XS | No-op |

**Phase-end verification:**
- [x] No new product-scope work was introduced
- [x] Extra runtime-breadth work remains separate backlog

## Phase 5: Polish & Ship

**Entry Condition:** Phase 4 completed  
**Exit Condition:** release or handoff decisions can be made from real evidence

| Order | Finding ID | Task | Files | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | FINDING-005 | Run a real authenticated Claude Code macOS smoke, update the row truthfully, and rerun the gate | `docs/validation/release-readiness.md` | M | Blocked |
| 2 | FINDING-008 | Mark the stale release-readiness hardening plan as historical | `docs/superpowers/plans/2026-04-04-release-readiness-hardening.md` | XS | Completed |
| 3 | Reporting | Bring the root cross-validation and phased plan artifacts up to date as current-state reports | `cross-validation-report-2026-04-04.md`, `phased-remediation-plan-2026-04-04.md` | S | Completed |

**Blockers:**
- `claude` is not available in this workspace
- a real authenticated macOS Claude Code smoke could not be run here
- the Claude Code row in `docs/validation/release-readiness.md` remains truthfully `blocked`

**Phase-end verification:**
- [x] `node scripts/check-doc-links.mjs`
- [x] `node scripts/check-doc-claims.mjs`
- [x] the historical hardening plan no longer presents itself as the current source of truth
- [ ] `node scripts/check-release-readiness.mjs`

## Phase-End Commands

```bash
bash scripts/static-validation.sh
node scripts/check-release-readiness.mjs
node scripts/check-doc-links.mjs
node scripts/check-doc-claims.mjs
```

## Next Steps

1. Install or expose the `claude` CLI in the target macOS environment.
2. Run a real authenticated Claude Code plugin smoke.
3. Update the macOS Claude Code row in `docs/validation/release-readiness.md` only if a real model response is observed.
4. Re-run `node scripts/check-release-readiness.mjs` before making any release-ready or handoff claim.
