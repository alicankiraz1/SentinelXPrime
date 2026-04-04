---
name: sentinelx-prime
description: Use when a repository wants stage-aware cybersecurity guidance during planning, risky implementation changes across authentication, authorization, tokens, secrets, middleware, outbound requests, file handling, CI, deployment, and other trust boundaries, post-implementation review, or pre-release hardening; do not trigger for doc-only, naming-only, formatting-only, or UI-only changes that do not affect a trust boundary
---

# SentinelXPrime

## Overview
Thin orchestrator for stage-aware security guidance. It chooses the right security skill for the current project stage and keeps outputs consistent.

## When to Use
- planning a feature, architecture, or task breakdown
- changing authentication, authorization, tokens, secrets, middleware, outbound requests, file handling, CI, deployment, or another trust boundary
- finishing implementation and deciding whether to run a security review
- preparing release, handoff, or hardening checks

## When Not to Use
- doc-only changes
- naming-only refactors
- formatting-only edits
- UI-only changes that do not affect a trust boundary

## Workflow
1. Read `references/context-resolution.md`, `references/activation-rules.md`, `references/interaction-model.md`, `references/risky-change-signals.md`, `references/notification-policy.md`, `references/lifecycle-persistence.md`, and `references/active-analysis.md`.
2. Classify the stage as `plan`, `review`, `test-rig`, or `uncertain`, and classify whether the current work crosses a risky-change threshold.
3. Resolve repo-local checkpoint guidance through `references/context-resolution.md` rather than assuming a relative `../../AGENTS.md` path.
4. For `plan`, invoke `../sentinelx-plan-gap/SKILL.md` automatically.
5. For risky implementation work, ask once whether the user wants a read-only active analysis pass for the current scope. If they accept, collect scoped evidence through `references/active-analysis.md`. If git-backed discovery is unavailable but shell reads still work for files already visible in context or explicitly named by the user, use a limited current-source fallback and note the limitation in assumptions. If they decline or shell/file evidence is unavailable, stay description-based and note the limitation in assumptions.
6. For risky implementation work, run a low-noise scoped risky-change review pass using `references/risky-change-review-pass-template.md` with an enriched context pack when active analysis was allowed and available.
7. If a risky-change review pass returns no material concern, do not create a separate interruption.
8. For `review`, ask once before invoking `../sentinelx-review-gate/SKILL.md`. If the user accepts, treat that acceptance as consent for read-only active analysis within the current review scope.
9. For `test-rig`, ask once before invoking `../sentinelx-test-rig/SKILL.md`.
10. Normalize findings using `../shared/finding-schema.md`.
11. End substantial outputs with a coverage note.

## Stage Fallback
- If the stage is `uncertain`, stay advisory, do not trigger a risky-change review pass, do not imply a full review occurred, and wait for stronger stage evidence or explicit user intent.

## Guardrails
- Never claim the project is secure.
- Never run tools or mutate files without explicit user consent.
- Treat read-only active analysis as tool execution that still requires explicit user consent.
- If the stack is unclear, load `../shared/common-web-threats.md` and say the stack is uncertain.
- Do not repeat the same offer after a clear refusal in the same stage.
- Do not imply that a child agent was spawned unless the user explicitly asked for delegation and the active environment actually supports that flow.
- Never send the full session history when a narrow scoped context pack is sufficient for the risky-change review pass.
- Risky-change review passes must remain advisory-only unless the user explicitly asks for stronger gating.
- If repo-local checkpoint policy is missing, do not imply that later-stage security offers are guaranteed automatically.
