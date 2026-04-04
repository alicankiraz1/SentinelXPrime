# SentinelXPrime Cross-Validation Report

**Date:** 2026-04-04  
**Status:** Remediation implemented; repo validation is green; the release-claim gate is limited to one live runtime blocker

## Executive Summary

- `bash scripts/static-validation.sh`: **PASS**
- `node scripts/check-release-readiness.mjs`: **FAIL**
- Current live blocker: no fresh authenticated `Claude Code` planning-response evidence has been recorded as a current `pass` row
- Key changes implemented in this remediation wave:
  - closed the release-readiness parser bypass
  - enforced `current pass` and valid `YYYY-MM-DD` freshness checks
  - expanded doc validators to root markdown files
  - rejected repo-escape local links
  - fixed the Turkish negation false positive in `check-doc-claims`
  - fixed the `check-legacy-names` crash and its false-green regression
  - extracted a shared markdown inventory helper
  - marked the historical release-readiness hardening plan as non-authoritative

## Step 1: Cross-Validation

### Verified Findings

| External ID | Finding Summary | Independent Validation | Severity |
| --- | --- | --- | --- |
| VULN-001 | Release-claim gate parser bypass | The old parser treated fenced-code and secondary-table `pass` rows as authoritative and could be tricked into a false green result | P1-High |
| BUG-001 | Doc-guard coverage and path-validation blind spots | Root markdown files were skipped, and repo-external absolute paths could be accepted as local links | P2-Medium |
| BUG-002 | `check-legacy-names` crashes on a real hit | A `nextRelativePath` typo caused a stack trace instead of actionable lint output | P2-Medium |
| F-001 | Claude Code authenticated smoke evidence is missing | The macOS Claude Code row is still `blocked`, so the claim gate stays red | P1-High |

### Partially Correct Findings

| External ID | Finding Summary | What Was Incomplete Or Incorrect | Corrected Assessment |
| --- | --- | --- | --- |
| BUG-003 | Unreadable-file test is not portable under root | The issue did not reproduce here, but `chmod 000` is still unreliable under privileged users | A root-aware skip reduced the portability risk; this was not a release blocker |
| R-001 / A-002 | A shared markdown helper is required | The helper was a solution choice, not the root bug | The behavioral bug was fixed first, then the shared helper was extracted |
| R-002 | All validator tests should enforce no-stack-trace output | The recommendation was too broad as written | A concrete gap existed in the legacy-name regression and was fixed there |
| R-003 / F-004 | Historical plans are drifting broadly | The issue was not systemic | One stale plan was real and is now clearly marked historical |
| A-004 / F-003 | A freshness policy is needed | This was not a nice-to-have | The gate now enforces a 90-day current-pass rule |

### Invalid Findings

| External ID | Finding Summary | Why It Is Invalid |
| --- | --- | --- |
| R-004 | Release commands need a machine-readable step summary | This did not validate as a correctness or claim-integrity blocker; it remains an optional observability improvement |

### Findings Missed By The External Review

| New ID | Finding | Severity | Location |
| --- | --- | --- | --- |
| NEW-001 | `space-unicode-path-regressions` could still pass while `check-legacy-names` emitted a stack trace | P2-Medium | `evals/test/space-unicode-path-regressions.test.mjs` |
| NEW-002 | `check-doc-claims` did not recognize Turkish negation such as `değil` and flagged honest negative wording as unsupported assurance | P2-Medium | `scripts/check-doc-claims.mjs` |
| NEW-003 | The release-readiness docs said `current pass`, but the gate did not enforce freshness | P2-Medium | `docs/validation/release-readiness.md`, `scripts/check-release-readiness.mjs` |

## Step 2: Unified Findings

### FINDING-001: Release-claim gate accepted non-canonical table rows

- **Type:** `Vulnerability`
- **Severity:** `P1-High`
- **Location:** `scripts/check-release-readiness.mjs`
- **Current State:** Any pipe-delimited row could be parsed as evidence, even outside the canonical matrix.
- **Target State:** Only the contiguous authoritative readiness table is accepted.
- **Fix Strategy:** Parse by exact header and delimiter, then only consume contiguous data rows; keep bypass regressions in the test suite.
- **Test Criteria:** `node --test evals/test/release-readiness-check.test.mjs`
- **Status:** `Completed`

### FINDING-002: Doc validators missed root markdown files and repo-boundary escapes

- **Type:** `Bug`
- **Severity:** `P2-Medium`
- **Location:** `scripts/check-doc-links.mjs`, `scripts/check-doc-claims.mjs`
- **Current State:** Root `.md` files were skipped and repo-external local targets could slip through.
- **Target State:** Root markdown files are scanned and local targets must stay under the repo root.
- **Fix Strategy:** Expand markdown discovery, add repo-boundary checks, and keep root-doc plus path-escape regressions.
- **Test Criteria:** `node --test evals/test/doc-links-lint.test.mjs evals/test/doc-claims-lint.test.mjs`
- **Status:** `Completed`

### FINDING-003: Legacy-name validation crashed and the regression suite could miss it

- **Type:** `Bug`
- **Severity:** `P2-Medium`
- **Location:** `scripts/check-legacy-names.mjs`, `evals/test/space-unicode-path-regressions.test.mjs`
- **Current State:** A real legacy-name hit produced a stack trace, and the regression suite could still pass.
- **Target State:** The validator emits actionable `file:line` lint output and the regression suite rejects uncaught stack traces.
- **Fix Strategy:** Fix the variable typo and harden the stderr assertion with a forbidden-pattern check.
- **Test Criteria:** `node --test evals/test/space-unicode-path-regressions.test.mjs`
- **Status:** `Completed`

### FINDING-004: The documented `current pass` contract was not enforced

- **Type:** `Vulnerability`
- **Severity:** `P2-Medium`
- **Location:** `docs/validation/release-readiness.md`, `scripts/check-release-readiness.mjs`
- **Current State:** The docs required a current pass row, but the gate accepted stale or malformed dates.
- **Target State:** `last_verified` must be a valid `YYYY-MM-DD` within the freshness window.
- **Fix Strategy:** Enforce a 90-day recency policy, reject invalid dates, and document the contract explicitly.
- **Test Criteria:** `node --test evals/test/release-readiness-check.test.mjs`
- **Status:** `Completed`

### FINDING-005: Claude Code macOS authenticated smoke evidence is still missing

- **Type:** `Missing Feature`
- **Severity:** `P1-High`
- **Location:** `docs/validation/release-readiness.md`
- **Current State:** Hook/bootstrap evidence exists, but no authenticated model response has been captured.
- **Target State:** A real authenticated macOS Claude Code run records either a truthful `pass` row or an updated blocker note.
- **Fix Strategy:** Run a fresh authenticated plugin smoke in the target environment and update the matrix only with real evidence.
- **Test Criteria:** `node scripts/check-release-readiness.mjs`
- **Status:** `Blocked`

### FINDING-006: The unreadable-file regression was not portable under privileged users

- **Type:** `Bug`
- **Severity:** `P3-Low`
- **Location:** `evals/test/release-readiness-check.test.mjs`
- **Current State:** `chmod 000` was assumed to fail everywhere, which is false under root.
- **Target State:** The test behaves deterministically under normal and privileged users.
- **Fix Strategy:** Skip the permission-denied assertion when the test is running as root.
- **Test Criteria:** `node --test evals/test/release-readiness-check.test.mjs`
- **Status:** `Completed`

### FINDING-007: `check-doc-claims` misread Turkish negation

- **Type:** `Bug`
- **Severity:** `P2-Medium`
- **Location:** `scripts/check-doc-claims.mjs`
- **Current State:** `production-ready değil` was treated as an unsupported assurance claim.
- **Target State:** Negative assurance wording in supported repo languages is recognized correctly.
- **Fix Strategy:** Normalize diacritics and check for negation before flagging the sentence.
- **Test Criteria:** `node --test evals/test/doc-claims-lint.test.mjs`
- **Status:** `Completed`

### FINDING-008: The release-readiness hardening plan had gone stale

- **Type:** `Tech Debt`
- **Severity:** `P3-Low`
- **Location:** `docs/superpowers/plans/2026-04-04-release-readiness-hardening.md`
- **Current State:** The plan still described already-completed Codex/OpenCode work as pending.
- **Target State:** The document is clearly historical and points to current authoritative artifacts.
- **Fix Strategy:** Add a historical note and redirect readers to the current report and phased plan.
- **Test Criteria:** `node scripts/check-doc-links.mjs`
- **Status:** `Completed`

### FINDING-009: Markdown discovery logic was duplicated and drift-prone

- **Type:** `Tech Debt`
- **Severity:** `P3-Low`
- **Location:** `scripts/check-doc-links.mjs`, `scripts/check-doc-claims.mjs`
- **Current State:** Each validator maintained its own markdown inventory logic.
- **Target State:** Inventory rules live in one helper with shared tests.
- **Fix Strategy:** Use `scripts/lib/markdown-doc-inventory.mjs` and keep an inventory contract test.
- **Test Criteria:** `node --test evals/test/markdown-doc-inventory.test.mjs`
- **Status:** `Completed`

## Remaining Live Blocker

- `Claude Code` could not be re-verified in this workspace.
- The `claude` runtime is not available here, so a fresh authenticated smoke could not be captured.
- The readiness matrix therefore keeps the Claude Code row truthfully marked as `blocked`.

## Coverage Note

- **Reviewed:** `scripts/*`, `scripts/lib/*`, `evals/test/*`, `docs/validation/release-readiness.md`, `docs/superpowers/plans/2026-04-04-release-readiness-hardening.md`, root assessment artifacts
- **Not reviewed:** a live authenticated Claude Code model response, Windows runtime smoke, Linux `Claude Code` and `OpenCode` live smoke
- **Assumptions:** the existing Codex and OpenCode runtime rows in `docs/validation/release-readiness.md` remain authoritative; no row was upgraded without fresh evidence
- **Tools run:** `bash scripts/static-validation.sh`, `node scripts/check-release-readiness.mjs`, targeted `node --test` commands, `command -v claude`, and focused shell reproductions
