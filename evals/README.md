# SentinelXPrime Eval Scaffold

This directory contains a lightweight runnable scaffold for validating core `sentinelx-prime` contract behavior with `codex exec --json`.

The goal is not to replace human review. The goal is to turn the highest-value walkthroughs into repeatable checks that can catch regressions in:

- review and release checkpoint offers
- explicit-only durability limits
- non-trigger quiet behavior
- nested `AGENTS` precedence
- consented active-analysis behavior
- untracked risky-file discovery
- graceful fallback when git-backed active analysis is unavailable
- context-budget scope limiting for oversized risky batches
- nested-scope containment under a nearer override
- plan-stage auto-invocation
- refusal suppression after review decline
- no-false assurance behavior
- unclear-stack fallback handling
- advisory-only review output bundling
- generic Node/TypeScript planning guidance
- generic Node/TypeScript test-rig guidance

## Prerequisites

- Node.js 22
- `codex` CLI on `PATH`
- readable Codex auth at `$CODEX_HOME/auth.json` or `~/.codex/auth.json` for live eval runs
- `git` available on `PATH`

## Run All Cases

```bash
node evals/run-sentinelx-prime.mjs --preflight-only
node evals/run-sentinelx-prime.mjs
node evals/run-sentinelx-prime.mjs --promote-artifacts
```

## Run Specific Cases

```bash
node evals/run-sentinelx-prime.mjs repo-review-offer explicit-no-persistence
```

## List Available Cases

```bash
node evals/run-sentinelx-prime.mjs --list
```

## Artifacts

Each run writes JSONL traces, final messages, and per-case result files under `evals/artifacts/`.

By default, `node evals/run-sentinelx-prime.mjs` writes case artifacts into a temporary staging directory and leaves checked-in `evals/artifacts/` unchanged. Use `--promote-artifacts` only when you intentionally want to refresh the persistent artifact bundle.

Every case directory also keeps `attempt-*` subdirectories so a retryable oracle miss can be inspected without losing the final promoted artifact set.

Multi-turn cases also promote sanitized `last-message-turn-N.txt` artifacts so the oracle can validate specific turn outcomes instead of only the final reply.

Only sanitized traces are written into `evals/artifacts/`. Raw `codex exec --json` output stays in temporary runtime state and is discarded after checks complete.

Treat `evals/artifacts/` as an internal validation bundle unless you have explicitly curated a separate sanitized evidence export. Default source releases and default `scripts/package-release.sh` archives do not ship `evals/artifacts/`.

If a curated evidence bundle includes `summary.json`, every promoted artifact path referenced by that summary must exist in the bundle and the bundle should pass `node scripts/validate-release-surface.mjs --require-summary`.

Build release zips only from a clean clone of the repository or the canonical repo root. Do not package from workspace wrappers or directories that contain another repo-shaped copy of SentinelXPrime.

`node scripts/verify-release-archive.mjs` now compares the shipped release surface against the source tree using normalized paths, file hashes, and eval manifest provenance. A matching manifest alone is not treated as sufficient proof anymore.

The script prints a final JSON summary with:

- `case_manifest_fingerprint`
- `runner_source_fingerprint`
- `runner_fingerprint` (deprecated alias of `case_manifest_fingerprint`)
- `overall_pass`
- `score`
- `selected_case_ids`
- `selected_case_count`
- `total_available_cases`
- `full_suite`
- `artifact_integrity`
- `checks`

Each case result also includes `case_checks`, a structured rubric for the per-case oracle. This keeps phrase matching, trace validation, and skill-source validation separate instead of collapsing them into one free-form note.

Command-related checks are evaluated against parsed `command_execution` events rather than whole-trace substring matches. This prevents a case from passing only because a command string appeared in a loaded skill or reference document.

When a case needs a retry to confirm a repo-scoped skill trace, the promoted top-level `result.json` also records `attempt_count` and an `attempts` summary.

The runner also minimizes inherited environment state by setting a temporary `HOME`, `CODEX_HOME`, and XDG config/cache roots per case. Unexpected repo-external instruction paths should fail the acceptance run.

`case_manifest_fingerprint` proves which normalized case manifest produced the summary. `runner_source_fingerprint` proves which checked-in runner source files produced it. The deprecated `runner_fingerprint` field is kept only as a transition alias for the manifest fingerprint; it does not prove the full runner implementation on its own.

## Current Limits

- The checks are intentionally lightweight at the acceptance level even though command oracles are now structured.
- They are strongest for contract regressions, not nuanced review quality.
- They assume English prompts so the expected phrases stay deterministic.
- Use `SENTINELX_PRIME_EVAL_TIMEOUT_MS` to raise the per-case timeout when local environment latency is high.
- Inspect the trace artifacts to confirm the case read the repo-scoped `.agents/skills/sentinelx-prime/` path rather than a legacy user-installed copy.
- The harness initializes a temporary git repository for each case so active-analysis scenarios can inspect real tracked diffs without touching repo-local state.
- The harness pins `codex exec` to `--sandbox read-only` so the eval profile stays deterministic and least-privilege by default.
- If you choose to check in or ship `evals/artifacts/summary.json`, it should represent a refreshed full-suite run, not a partial smoke subset.
- Multi-turn cases now prove specific per-turn message outcomes, but they still do not claim to model every possible conversational state transition.
