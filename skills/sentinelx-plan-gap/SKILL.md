---
name: sentinelx-plan-gap
description: Use when defining plans, specs, or task breakdowns for web application work that may be missing security requirements
---

# Security Plan Gap

## Overview
Find missing security requirements before code exists. This skill turns design omissions into actionable plan additions.

## When to Use
- writing a feature plan or architecture
- reviewing a spec before implementation starts
- breaking work into tasks that may cross trust boundaries or handle sensitive data

## Workflow
1. Read the current plan, spec, or task breakdown.
2. Load `references/plan-gap-checklist.md`.
3. Load `../shared/common-web-threats.md`, `../shared/finding-schema.md`, and the relevant stack profile if known.
4. Produce a gap report with missing controls, risk scenarios, and suggested plan additions.
5. End with a closing coverage note using the shared headings: Reviewed / Not reviewed / Assumptions / Tools run.

## Guardrails
- Treat missing requirements as gaps, not confirmed vulnerabilities.
- Prefer concise, actionable additions over generic best-practice lists.
- Lower confidence when the stack or architecture is only partly defined.
- Treat this skill as the default planning-stage review pass when `sentinelx-prime` invokes it automatically.
