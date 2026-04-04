---
name: sentinelx-review-gate
description: Use when implementation is complete or review is requested and the user may want a focused security review of the changed code
---

# Security Review Gate

## Overview
Run an advisory-only security review after implementation. This skill reports findings but does not block progress by default.

## When to Use
- the user says the code is done or ready for review
- a feature was just implemented and needs a security pass
- a delivery or release checkpoint is approaching and source-level review would help

## Workflow
1. Ask once whether the user wants a focused security review, following `../sentinelx-prime/references/interaction-model.md` for language behavior when available.
2. If the user declines, stop and do not repeat the same offer in the same stage.
3. If the user accepts, treat that acceptance as consent for read-only active analysis within the current review scope and load `references/review-categories.md`.
4. If git and shell access are available, inspect changed code within the current repo-local scope using `../sentinelx-prime/references/active-analysis.md`. If git-backed active analysis is unavailable but shell reads still work, you may inspect files already visible in context or explicitly named by the user as a limited current-source fallback. If shell access is unavailable, stay description-based and note the fallback in assumptions.
5. Load `../shared/common-web-threats.md`, `../shared/finding-schema.md`, and a stack profile when relevant.
6. Report findings using the required fields from `../shared/finding-schema.md`. Include `evidence_source` whenever code, diff, heuristic, or description evidence materially affected the conclusion.
7. End with a closing coverage note using the shared headings: Reviewed / Not reviewed / Assumptions / Tools run.

## Guardrails
- Do not block the user's progress automatically.
- Do not call heuristic review output a scan result unless a real tool was run.
- Do not equate no findings with security completeness.
- Do not describe limited current-source fallback as diff-grounded active analysis.
- Do not inspect code outside the accepted review scope just because it shares security-related keywords.
- Do not hardcode a fixed English ask prompt in this skill.
