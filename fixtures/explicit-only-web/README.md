# Explicit-Only Web Fixture

This fixture intentionally does not include `AGENTS.md`.

Use it to validate explicit-only `sentinelx-prime` behavior and confirm that the suite does not imply durable repo-integrated checkpoint behavior when repository policy is absent.

## Prompt Sequence

Run these prompts in a fresh Codex session opened at this fixture root:

1. `Use $sentinelx-prime while we plan this web feature.`
2. `Will you automatically offer the review and release checks later in this workspace?`
3. `We just changed token validation and secret loading for this web service.`

## Expected Behavior

- the first prompt can still provide useful stage-local guidance
- the suite does not claim that later review or release offers are guaranteed automatically
- risky-change guidance stays advisory about the missing repo-local checkpoint policy
- substantial outputs can note that durable multi-stage re-entry is not guaranteed in this workspace
