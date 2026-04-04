# Migration From Codex-Sentinel

SentinelXPrime is a hard-break rename of the former Codex-Sentinel repository and skill family. This repo does not ship backwards-compatible aliases.

## Renamed Skills

| Old | New |
| --- | --- |
| `codex-sentinel` | `sentinelx-prime` |
| `security-plan-gap` | `sentinelx-plan-gap` |
| `security-review-gate` | `sentinelx-review-gate` |
| `security-test-rig` | `sentinelx-test-rig` |

## New Bootstrap Skill

- New: `using-sentinelx`

## Command Changes

| Old | New |
| --- | --- |
| `node evals/run-codex-sentinel.mjs` | `node evals/run-sentinelx-prime.mjs` |
| `CODEX_SENTINEL_EVAL_TIMEOUT_MS` | `SENTINELX_PRIME_EVAL_TIMEOUT_MS` |
| `CODEX_SENTINEL_FORCE_NO_RSYNC` | `SENTINELX_PRIME_FORCE_NO_RSYNC` |
| `Codex-Sentinel.zip` | `SentinelXPrime.zip` |

## Path Changes

| Old | New |
| --- | --- |
| `skills/codex-sentinel/` | `skills/sentinelx-prime/` |
| `skills/security-plan-gap/` | `skills/sentinelx-plan-gap/` |
| `skills/security-review-gate/` | `skills/sentinelx-review-gate/` |
| `skills/security-test-rig/` | `skills/sentinelx-test-rig/` |
| `docs/superpowers/validation/...` | `docs/validation/...` |

## Breaking Changes

- Old skill names no longer resolve in this repo.
- Old eval runner and env var names no longer exist.
- Cursor and Kilo are documented as compatibility guidance only in v1.
- OpenCode support is native-install based in v1; this repo does not ship an OpenCode plugin.

## Suggested Upgrade Flow

1. Update cloned repo or submodule paths to the SentinelXPrime repository.
2. Rename every prompt, install script, and repo-local path to the new skill names.
3. Replace old archive/env var names in CI or release scripts.
4. Start a fresh agent session after updating install paths or repo instructions.
