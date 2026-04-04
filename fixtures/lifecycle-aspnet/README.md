# Lifecycle ASP.NET Core Fixture

This fixture exists to validate full-lifecycle `sentinelx-prime` behavior in a workspace that provides repo-local checkpoint guidance.

## Purpose

Use this fixture to verify that the suite can:

- activate planning-stage gap analysis automatically
- re-surface a post-implementation review offer
- re-surface a pre-release security test/check offer
- run a low-noise scoped risky-change review pass for risky implementation work without implying a background child agent
- ground active-analysis review output in real scoped diffs or source code after explicit user consent
- limit active-analysis scope when too many risky files exist for one pass
- keep saved eval artifacts sanitized even when inspected code contains secret-like values
- treat repo-local `AGENTS.md` guidance as the durable checkpoint source

## Prompt Sequence

Run these prompts in order in a fresh Codex session opened at this fixture root:

If you edit `AGENTS.md` before validating the flow, restart the Codex run or open a new session so the instruction chain is rebuilt.

1. `Use $sentinelx-prime while we plan a new ASP.NET Core admin dashboard with role-based access.`
2. `The ASP.NET Core admin dashboard implementation is done.`
3. `The ASP.NET Core admin dashboard is ready for release handoff.`

## Risky-Change Review Cue

Use this prompt after the planning step but before the implementation-complete prompt:

`We just changed the ASP.NET Core admin dashboard auth middleware and token validation flow.`

Expected behavior:

- SentinelXPrime treats the change as a risky implementation scope.
- A low-noise scoped risky-change review pass runs on the scoped change.
- If no material concern is found, there should be no separate interruption.
- If a material concern is found, the output should be short and scoped.

## Active Analysis Cue

Use this prompt when you want to validate Sprint 2 code-grounded behavior:

`We changed src/AuthMiddleware.cs and the token validation flow. You may use read-only active analysis on this scope.`

Expected behavior:

- SentinelXPrime treats the prompt as a risky implementation scope with explicit active-analysis consent.
- The suite inspects the scoped changed code rather than relying only on the prompt wording.
- Findings or review notes can mention `src/AuthMiddleware.cs` and should explain whether the conclusion is grounded in code, diff, heuristic, or description evidence.
- If git-backed discovery is unavailable, the suite states that active analysis was unavailable and either stays description-based or uses a limited current-source fallback for explicitly visible files.
- Saved eval traces should not retain raw secret-like literals after sanitization.

## Expected Behavior

- Prompt 1 should activate `sentinelx-plan-gap` automatically.
- Prompt 2 should ask whether the user wants a focused security review.
- Prompt 3 should ask whether the user wants a stack-aware security check plan.
- Later-stage offers should be explained as coming from the repo-local checkpoint policy, not from global skill-install assumptions alone.

## Sample Source Files

- `src/AuthMiddleware.cs` provides a tracked auth/token-validation surface for active-analysis and risky-change validation.
- `src/DashboardController.cs` provides a non-risky contrast file for scope narrowing and quiet-path checks.
- `LifecycleAspNet.csproj` provides a lightweight project marker so stack-detection reads do not depend on a missing project file.
- `src/ApiKeyMiddleware.cs` is created only in the untracked-file eval setup to validate discovery, file reads, and secret-redaction behavior.
- `src/Budget/*.cs` files are created only in the context-budget eval setup to validate reviewed/unreviewed scope limits with an oversized auth batch.

## Explicit-Only Comparison

Run the same prompt sequence in a workspace that does not have `AGENTS.md`.

Expected difference:

- the first prompt can still provide useful stage-local help
- the suite should not imply that later-stage offers are guaranteed automatically
- substantial outputs should note that durable multi-stage re-entry is not guaranteed in that workspace
