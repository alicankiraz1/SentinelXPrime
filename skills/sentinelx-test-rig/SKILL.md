---
name: sentinelx-test-rig
description: Use when a feature or project is nearing handoff or release and the user may want a stack-aware security check plan without automatic setup
---

# Security Test Rig

## Overview
Offer a recommendation-only security check plan after implementation. This skill helps users set up the next validation step without silently provisioning anything.

## When to Use
- a feature or project is approaching release or handoff
- the user wants a lightweight hardening or validation pass
- the next useful step is tool selection rather than source review

## Workflow
1. Ask once whether the user wants a stack-aware security check plan, following `../sentinelx-prime/references/interaction-model.md` for language behavior when available.
2. If the user declines, stop and do not repeat the same offer in the same stage.
3. If the user accepts, load `references/tool-selection.md` and `references/sample-commands.md`.
4. Recommend tools, commands, and checklist items based on the stack.
5. End the recommendation with a closing coverage note using the shared headings: Reviewed / Not reviewed / Assumptions / Tools run.
6. State clearly that no environment was provisioned and no tooling was installed automatically.

## Guardrails
- Recommendation-only in v1.
- No installation, config mutation, CI wiring, or environment provisioning.
- Avoid presenting optional tools as mandatory without context.
- Do not hardcode a fixed English ask prompt in this skill.
