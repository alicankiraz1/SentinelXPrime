# SentinelXPrime Release Readiness Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Historical note:** This document is no longer the current execution source.
> Codex Linux and OpenCode macOS evidence rows are already recorded as `pass` in `docs/validation/release-readiness.md`.
> The remaining live blocker is `Claude Code` authenticated runtime evidence, and the current authoritative status lives in `cross-validation-report-2026-04-04.md` and `phased-remediation-plan-2026-04-04.md`.

**Goal:** Collect the remaining live runtime smoke evidence needed for claim-safe release/handoff decisions, update the readiness matrix truthfully, and close the release-readiness hardening phase without expanding product scope.

**Architecture:** Treat [`docs/validation/release-readiness.md`](../../validation/release-readiness.md) as the single source of truth for release-ready claims and [`scripts/check-release-readiness.mjs`](../../../scripts/check-release-readiness.mjs) as the only claim gate. Each runtime surface is handled in isolation: establish the blocked baseline, run a fresh smoke in the target environment, update exactly one matrix row only if the run really passed, then re-run the gate before moving on.

**Tech Stack:** Markdown docs, Node.js 22, Bash, GitHub Actions, Codex CLI, Claude Code local plugin, OpenCode native skills install

---

## Scope Split

This plan intentionally covers only the remaining critical-path work from `Phase 3` and the claim-safe portion of `Phase 5`.

Do **not** mix these independent follow-ups into this execution:
- GraphQL/serverless profile expansion
- large-repo performance fixtures
- Cursor/Kilo runtime proof or compatibility hardening

Those should get separate plans after the release-readiness path is closed.

## File Map

**Primary files**
- Modify: `docs/validation/release-readiness.md`
- Verify: `README.md`
- Verify: `docs/README.codex.md`
- Verify: `docs/README.claude.md`
- Verify: `docs/README.opencode.md`
- Verify: `phased-remediation-plan-2026-04-04.md`
- Verify: `cross-validation-report-2026-04-04.md`

**No new production code is expected**
- If a smoke run fails because of a real product defect in install, hook, or skill behavior, stop after capturing evidence and spin a separate code-fix plan instead of patching ad hoc inside this execution.

**Assumptions**
- Execute from a real git-backed clone, not an archive snapshot.
- Do not mark any blocked row as `pass` without a fresh runtime run in the named environment.
- Leave any unrun OS/install-mode rows unchanged.

### Task 1: Capture Codex Linux Smoke Evidence

**Files:**
- Modify: `docs/validation/release-readiness.md`
- Verify: `.codex/INSTALL.md`
- Verify: `docs/README.codex.md`

- [ ] **Step 1: Confirm the current Linux Codex row is still blocked**

Run:

```bash
rg -n '^\| Codex \| Linux \|' docs/validation/release-readiness.md
```

Expected: one row exists and still contains `| blocked |`.

- [ ] **Step 2: Prepare a fresh user-scoped install on a Linux host**

Run:

```bash
git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.codex/sentinelxprime
mkdir -p ~/.agents/skills
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  ln -sfn "$HOME/.codex/sentinelxprime/skills/$name" "$HOME/.agents/skills/$name"
done
ls -la ~/.agents/skills/sentinelx-prime
```

Expected: the symlinked `sentinelx-prime` skill is visible under `~/.agents/skills/`.

- [ ] **Step 3: Run the live Codex Linux smoke**

Run:

```bash
codex exec --sandbox read-only --json --ephemeral --skip-git-repo-check -C "$HOME/.codex/sentinelxprime" -o /tmp/sentinelx-codex-linux-last-message.txt 'Use $sentinelx-prime while we plan this API auth change.'
cat /tmp/sentinelx-codex-linux-last-message.txt
```

Expected: exit `0` and the captured message shows SentinelXPrime loading, stage classification as `plan`, repo-local `AGENTS.md` usage, and a coverage note.

- [ ] **Step 4: Update the Linux Codex row only with the observed runtime evidence**

Edit the existing Linux row in `docs/validation/release-readiness.md` to match this shape:

```md
| Codex | Linux | user-scoped | Skills appear under `.agents/skills/` and `Use $sentinelx-prime while we plan this API auth change.` returns SentinelXPrime planning help | pass | 2026-04-04 | Runtime: `codex exec` on Linux with a fresh user-scoped install. Prompt used: `Use $sentinelx-prime while we plan this API auth change.` Observed success signal: <copy the real observed signal from the run>. |
```

Preserve the existing proof text exactly. Change only `status`, `last_verified`, and `notes`.

- [ ] **Step 5: Re-run the claim gate to prove Codex is no longer part of the blocker set**

Run:

```bash
node scripts/check-release-readiness.mjs
```

Expected: still FAIL because `Claude Code` and `OpenCode` remain blocked, but it should no longer complain about `Codex`.

- [ ] **Step 6: Commit**

```bash
git add docs/validation/release-readiness.md
git commit -m "docs: record Codex Linux smoke evidence"
```

### Task 2: Capture Claude Code macOS Plugin Evidence

**Files:**
- Modify: `docs/validation/release-readiness.md`
- Verify: `docs/README.claude.md`
- Verify: `hooks/hooks.json`
- Verify: `hooks/run-hook.cmd`
- Verify: `hooks/session-start`

- [ ] **Step 1: Confirm the Claude Code macOS row is blocked before the smoke**

Run:

```bash
rg -n '^\| Claude Code \| macOS \|' docs/validation/release-readiness.md
```

Expected: one row exists and contains `| blocked |`.

- [ ] **Step 2: Prepare the local plugin clone**

Run:

```bash
git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.claude/sentinelxprime
test -f ~/.claude/sentinelxprime/.claude-plugin/plugin.json
test -f ~/.claude/sentinelxprime/hooks/hooks.json
test -f ~/.claude/sentinelxprime/hooks/session-start
```

Expected: all three file checks succeed.

- [ ] **Step 3: Run the live Claude Code macOS smoke**

Manual action:
1. Load the plugin from `~/.claude/sentinelxprime`.
2. Start a fresh Claude Code session so SessionStart runs.
3. Send: `Use $sentinelx-prime while we plan this admin auth change.`
4. Capture the exact success signal: bootstrap context present, stage `plan`, and planning-stage guidance returned.

Expected: the hook injects SentinelXPrime bootstrap context and the prompt returns stage-aware planning help.

- [ ] **Step 4: Update exactly the macOS Claude Code row**

Edit the macOS row in `docs/validation/release-readiness.md` to match this shape:

```md
| Claude Code | macOS | local plugin | Plugin loads from the repo root and SessionStart injects SentinelXPrime bootstrap context | pass | 2026-04-04 | Runtime: Claude Code local plugin on macOS. Prompt used: `Use $sentinelx-prime while we plan this admin auth change.` Observed success signal: <copy the real observed signal from the run>. |
```

Do **not** update the Linux Claude row unless a separate Linux runtime was actually tested.

- [ ] **Step 5: Re-run the claim gate**

Run:

```bash
node scripts/check-release-readiness.mjs
```

Expected: still FAIL because `OpenCode` remains blocked, but it should no longer mention `Claude Code`.

- [ ] **Step 6: Commit**

```bash
git add docs/validation/release-readiness.md
git commit -m "docs: record Claude Code macOS smoke evidence"
```

### Task 3: Capture OpenCode macOS Personal-Install Evidence

**Files:**
- Modify: `docs/validation/release-readiness.md`
- Verify: `.opencode/INSTALL.md`
- Verify: `docs/README.opencode.md`

- [ ] **Step 1: Confirm the OpenCode macOS personal row is blocked**

Run:

```bash
rg -n '^\| OpenCode \| macOS \| personal \|' docs/validation/release-readiness.md
```

Expected: one row exists and contains `| blocked |`.

- [ ] **Step 2: Prepare the personal OpenCode install**

Run:

```bash
git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.config/opencode/sentinelxprime
mkdir -p ~/.config/opencode/skills
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  ln -sfn "$HOME/.config/opencode/sentinelxprime/skills/$name" "$HOME/.config/opencode/skills/$name"
done
ls -la ~/.config/opencode/skills/sentinelx-prime
```

Expected: the symlinked `sentinelx-prime` skill is visible under `~/.config/opencode/skills/`.

- [ ] **Step 3: Run the live OpenCode smoke**

Manual action:
1. Restart OpenCode.
2. Ask it to list available skills and confirm `sentinelx-prime` is visible.
3. Send: `Use $sentinelx-prime while we plan this API auth change.`
4. Capture the exact success signal from the response.

Expected: discovered skills include `sentinelx-prime`, and the planning prompt returns SentinelXPrime stage-aware guidance.

- [ ] **Step 4: Update exactly the macOS personal OpenCode row**

Edit the row in `docs/validation/release-readiness.md` to match this shape:

```md
| OpenCode | macOS | personal | Skill discovery lists `sentinelx-prime` and a planning prompt returns SentinelXPrime stage-aware guidance | pass | 2026-04-04 | Runtime: OpenCode personal install on macOS. Prompt used: `Use $sentinelx-prime while we plan this API auth change.` Observed success signal: <copy the real observed signal from the run>. |
```

Leave the Linux and project-local OpenCode rows unchanged unless those runs were actually performed.

- [ ] **Step 5: Re-run the claim gate and verify it turns green**

Run:

```bash
node scripts/check-release-readiness.mjs
```

Expected: PASS with `release-readiness claim gate passed for Codex, Claude Code, OpenCode`.

- [ ] **Step 6: Commit**

```bash
git add docs/validation/release-readiness.md
git commit -m "docs: record OpenCode macOS smoke evidence"
```

### Task 4: Final Claim-Safe Verification And Status Alignment

**Files:**
- Modify: `phased-remediation-plan-2026-04-04.md`
- Modify: `cross-validation-report-2026-04-04.md`
- Verify: `README.md`
- Verify: `docs/validation/release-readiness.md`

- [ ] **Step 1: Re-run the full static verification suite**

Run:

```bash
bash scripts/static-validation.sh
```

Expected: PASS with `70` tests passing and `release-surface validation passed`.

- [ ] **Step 2: Rebuild and verify both release archives**

Run:

```bash
bash scripts/package-release.sh
SENTINELX_PRIME_FORCE_NO_RSYNC=1 bash scripts/package-release.sh SentinelXPrime-fallback
node scripts/verify-release-archive.mjs dist/SentinelXPrime.zip
node scripts/verify-release-archive.mjs dist/SentinelXPrime-fallback.zip
```

Expected: both archives verify with `"pass": true`.

- [ ] **Step 3: Update the status docs from blocked to complete**

Make these documentation changes:
- In `phased-remediation-plan-2026-04-04.md`, mark `Phase 3` as completed if and only if the three smoke-evidence tasks above succeeded.
- In `cross-validation-report-2026-04-04.md`, change `FINDING-005` from `Blocked` to `Completed` only if the readiness matrix and claim gate are both green.
- If any surface could not be tested, keep both docs in `NO-GO` / blocked state.

- [ ] **Step 4: Re-run the claim gate after the doc updates**

Run:

```bash
node scripts/check-release-readiness.mjs
```

Expected: PASS if all required surfaces now have a `pass` row. If it fails, revert the optimistic status wording from the docs and leave the project in `NO-GO`.

- [ ] **Step 5: Commit**

```bash
git add docs/validation/release-readiness.md phased-remediation-plan-2026-04-04.md cross-validation-report-2026-04-04.md
git commit -m "docs: close release readiness hardening"
```

## Acceptance Checklist

- [ ] `docs/validation/release-readiness.md` contains fresh `pass` evidence for the intended surfaces and truthful `blocked` rows for anything unrun
- [ ] `node scripts/check-release-readiness.mjs` passes
- [ ] `bash scripts/static-validation.sh` passes
- [ ] Both release archives verify successfully
- [ ] `phased-remediation-plan-2026-04-04.md` and `cross-validation-report-2026-04-04.md` match the real runtime evidence state

## Stop Conditions

- Stop immediately if any smoke run reveals a real product defect instead of a missing runtime.
- Stop if the environment cannot provide the named runtime; leave the row blocked and do not fabricate evidence.
- Stop if a manual UI flow succeeds only intermittently; capture that instability as evidence and treat the surface as not yet claim-ready.
