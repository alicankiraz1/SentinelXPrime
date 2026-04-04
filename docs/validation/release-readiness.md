# SentinelXPrime Release Readiness Matrix

Use this matrix before release, handoff, or external support claims. Codex, Claude Code, and OpenCode should only be described as release-ready supported surfaces when the table contains at least one current `pass` row for each surface.
For this matrix, `current` means the `last_verified` value is a valid `YYYY-MM-DD` date within the last 90 days.

Run `node scripts/check-release-readiness.mjs` or the `Release Claim Readiness` workflow before making an external release-ready or handoff claim.

| surface | os | install_mode | proof | status | last_verified | notes |
| --- | --- | --- | --- | --- | --- | --- |
| Codex | macOS | user-scoped | Skills appear under `.agents/skills/` and `Use $sentinelx-prime while we plan this API auth change.` returns SentinelXPrime planning help | pass | 2026-04-04 | Runtime: `codex exec` on macOS with a fresh temp-home user-scoped install. Prompt used: `Use $sentinelx-prime while we plan this API auth change.` Observed success signal: SentinelXPrime loaded, classified the stage as `plan`, used repo-local `AGENTS.md`, and produced planning-stage gap guidance plus a coverage note. |
| Codex | Linux | user-scoped | Skills appear under `.agents/skills/` and `Use $sentinelx-prime while we plan this API auth change.` returns SentinelXPrime planning help | pass | 2026-04-04 | Runtime: `codex exec` inside a Linux Docker container (`node:22-bookworm`) with `@openai/codex@0.118.0`, a git-backed clone, and fresh user-scoped skill links under `/root/.agents/skills/`. Prompt used: `Use $sentinelx-prime while we plan this API auth change.` Observed success signal: SentinelXPrime loaded, classified the stage as `plan`, returned planning-stage auth gap guidance, and ended with a coverage note. Container note: internal `read-only` tool calls hit `bwrap` user-namespace limits, so the reply fell back to provided SentinelXPrime instructions plus repo-local guidance. |
| Claude Code | macOS | local plugin | Plugin loads from the repo root and SessionStart injects SentinelXPrime bootstrap context | blocked | 2026-04-04 | Runtime: official Claude Code CLI `2.1.92` on macOS with `--plugin-dir ~/.claude/sentinelxprime`. Observed success signal before the blocker: SessionStart fired, `hooks/run-hook.cmd` injected `<SENTINELXPRIME_BOOTSTRAP>`, and init output listed the `sentinelx-prime` plugin plus related slash commands. Prompt used: `Use $sentinelx-prime while we plan this admin auth change.` Observed blocker: authentication failed with `Not logged in · Please run /login`, so no planning-stage model response was captured. |
| Claude Code | Linux | local plugin | Plugin loads from the repo root and SessionStart injects SentinelXPrime bootstrap context | blocked | 2026-04-04 | `claude` runtime was not available in this session |
| OpenCode | macOS | personal | Skill discovery lists `sentinelx-prime` and a planning prompt returns SentinelXPrime stage-aware guidance | pass | 2026-04-04 | Runtime: `opencode-ai` `1.3.13` on macOS with a personal skills install under `~/.config/opencode/skills/`. Prompt used: `Use $sentinelx-prime while we plan this API auth change.` Observed success signal: OpenCode loaded `sentinelx-prime`, read the stage-classification references, classified the request as `plan`, auto-invoked `sentinelx-plan-gap`, and asked for the plan/spec needed to continue the gap analysis. |
| OpenCode | Linux | personal | Skill discovery lists `sentinelx-prime` and a planning prompt returns SentinelXPrime stage-aware guidance | blocked | 2026-04-04 | `opencode` runtime was not available in this session |
| OpenCode | macOS/Linux | project-local | Project-local `.opencode/skills/` discovery lists `sentinelx-prime` and a planning prompt returns SentinelXPrime stage-aware guidance | blocked | 2026-04-04 | `opencode` runtime was not available in this session |
| Codex | Windows | documented-only | Junction-based install steps complete and the skill is visible in `.agents/skills/` | documented-only | 2026-04-04 | Instructions exist; no Windows run captured in this session |

## Smoke SOP

Record a row as `pass` only after a fresh runtime check in the named environment, and refresh the row before it becomes older than 90 days.

### Codex user-scoped

1. Install from the current clone using the Codex install guide.
2. Start a fresh Codex session.
3. Verify the linked skills appear under `.agents/skills/`.
4. Run: `Use $sentinelx-prime while we plan this API auth change.`
5. Record the runtime, OS, install mode, prompt used, observed SentinelXPrime response signal, and verification date in the row notes.

### Claude Code local plugin

1. Load the plugin from the repo root in Claude Code.
2. Start a fresh session so SessionStart runs.
3. Verify the plugin manifest is loaded and the hook injects SentinelXPrime bootstrap context.
4. Run: `Use $sentinelx-prime while we plan this admin auth change.`
5. Record the runtime, OS, install mode, observed hook/bootstrap evidence, prompt used, and verification date in the row notes.

### OpenCode personal or project-local

1. Install via the documented personal or project-local skills path.
2. Start a fresh OpenCode session.
3. Verify discovered skills include `sentinelx-prime`.
4. Run: `Use $sentinelx-prime while we plan this API auth change.`
5. Record the runtime, OS, install mode, discovery signal, prompt used, observed SentinelXPrime response signal, and verification date in the row notes.
