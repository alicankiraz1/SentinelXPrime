# SentinelXPrime

## Purpose
This repository contains a stage-aware cybersecurity skill suite for Codex, Claude Code, and OpenCode, plus compatibility guidance for Cursor and Kilo.

## Required Checkpoints
- Planning checkpoint: before locking a plan, task list, or architecture, run a security gap analysis.
- Risky-implementation checkpoint: when work touches authentication, authorization, tokens, secrets, middleware, outbound requests, file handling, CI, deployment, or other trust-boundary code, run a low-noise scoped risky-change review pass and surface only material concerns.
- Post-implementation checkpoint: when coding appears complete, offer a focused security review.
- Pre-release checkpoint: before release, handoff, or done confirmation, offer a stack-aware security test/check plan.

## Guardrails
- Treat the suite as advisory-first unless the user explicitly asks for stronger gating.
- Never claim the repository is secure, fully reviewed, or production-safe from a security perspective.
- Separate reviewed areas, unreviewed areas, assumptions, and tool-run status in every substantial report.
- If the user declines a security review or test/check plan in the current stage, do not repeat the same offer until the stage changes.
- If the stack is unclear, fall back to common web-security guidance and say that the stack inference is uncertain.

## Authoring Defaults
- Keep repository-facing skill files, metadata, docs, examples, and validation artifacts in English unless a localized deliverable is explicitly requested.
- Keep user-facing assistant responses in the user's configured assistant language when that signal is available. If it is unavailable, follow the active conversation language and fall back to English.
- Do not add inline or block comments in source code unless the user explicitly asks for them.
