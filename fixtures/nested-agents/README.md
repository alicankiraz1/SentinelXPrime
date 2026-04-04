# Nested AGENTS Fixture

This fixture validates nested repo-policy precedence.

The repository root provides broad defaults, while `services/api/AGENTS.override.md` narrows the policy for work under `services/api/`.

## Validation Flow

Open a fresh Codex session at `fixtures/nested-agents/services/api/auth/` and use this prompt:

`Use $sentinelx-prime while we plan auth changes under this directory.`

For scoped active-analysis validation, use:

`We changed auth handlers in this subtree. You may use read-only active analysis on this scope.`

## Expected Behavior

- the suite treats `services/api/AGENTS.override.md` as the controlling repo-local instruction source for work in this subtree
- the root `AGENTS.md` still provides broader defaults
- code-grounded active analysis from this subtree should stay inside `services/api/auth/` and not inspect sibling web-handler fixtures outside that subtree
- if either file changes mid-session, the suite should not promise that the current run will reload them automatically
