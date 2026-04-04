# SentinelXPrime Repository Snippet

Add this block to a target repository `AGENTS.md` when you want durable SentinelXPrime checkpoints:

```md
# SentinelXPrime Integration

## Security Checkpoints
- Planning checkpoint: before locking a plan, task list, or architecture, run a security gap analysis.
- Risky-implementation checkpoint: when work touches authentication, authorization, tokens, secrets, middleware, outbound requests, file handling, CI, deployment, or another trust boundary, run a low-noise scoped risky-change review pass and surface only material concerns.
- Post-implementation checkpoint: when coding appears complete, offer a focused security review.
- Pre-release checkpoint: before release, handoff, or done confirmation, offer a stack-aware security test/check plan.

## Guardrails
- Treat SentinelXPrime as advisory-first unless the user explicitly asks for stronger gating.
- Never claim the repository is secure, fully reviewed, or production-safe from a security perspective.
- Separate reviewed areas, unreviewed areas, assumptions, and tool-run status in substantial reports.
- If the user declines a security review or test/check plan in the current stage, do not repeat the same offer until the stage changes.
```
