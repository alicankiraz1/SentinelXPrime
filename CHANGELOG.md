# Changelog

## 2026-04-04

- fixed broken relative links in `docs/superpowers/plans/2026-04-04-release-readiness-hardening.md` so doc-link validation passes again
- added clean failure handling and regression tests for unreadable or invalid `release-readiness.md` states
- changed release packaging to copy the release surface from the manifest-driven source tree so nested `.opencode/**/dist/` directories are no longer dropped
- extracted a shared filesystem walker helper for release-surface, legacy-name, and package-root traversal
- centralized the default eval timeout in `evals/lib/eval-constants.mjs`
- split `evals/run-sentinelx-prime.mjs` into entrypoint, case-runner, artifact, and constants modules
- kept release-readiness claim gating truthful: `Claude Code` remains blocked until an authenticated runtime smoke produces a real `pass` row
