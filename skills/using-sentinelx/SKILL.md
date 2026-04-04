---
name: using-sentinelx
description: Use when a session needs quick orientation to SentinelXPrime stages, checkpoints, guardrails, and the right SentinelXPrime skill to invoke
---

# Using SentinelXPrime

## Overview
SentinelXPrime is a stage-aware security skill suite. Use it to add lightweight, advisory-first security structure without pretending to certify security.

## Skill Map
- `sentinelx-prime`: route the current conversation to the right security stage
- `sentinelx-plan-gap`: planning-stage security gap analysis
- `sentinelx-review-gate`: opt-in post-implementation security review
- `sentinelx-test-rig`: opt-in security test/check planning before release

## Operating Rules
- Keep the suite advisory-first unless the user explicitly asks for stronger gating.
- Do not claim the repository is secure, fully reviewed, or production-ready.
- Do not repeat the same review or test-rig offer after the user declines it in the current stage.
- Treat authentication, authorization, tokens, secrets, middleware, outbound requests, file handling, CI, deployment, and other trust-boundary work as the risky implementation threshold.
- Separate reviewed areas, unreviewed areas, assumptions, and tools run in substantial outputs.

## Bootstrap
- Use this skill to remind the assistant that SentinelXPrime exists in the current session.
- When the stage is already clear, prefer the more specific SentinelXPrime skill instead of repeating this bootstrap.

## Stage Hints
- If the code is done and the next question is whether the implementation is safe enough, prefer `sentinelx-review-gate`.
- If the work is moving into release, handoff, or hardening checks, prefer `sentinelx-test-rig`.
- If stage evidence is weak or contradictory, stay advisory and let `sentinelx-prime` classify the work as `uncertain`.
