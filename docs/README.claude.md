# SentinelXPrime for Claude Code

SentinelXPrime ships a local Claude Code plugin manifest plus a lightweight SessionStart hook.

## What Ships

- [`.claude-plugin/plugin.json`](../.claude-plugin/plugin.json)
- [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)
- [`hooks/hooks.json`](../hooks/hooks.json)
- [`hooks/session-start`](../hooks/session-start)

## Local Install

1. Clone the repository:

   ```bash
   git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.claude/sentinelxprime
   ```

2. Load the plugin from the repository root using your Claude Code plugin workflow.

3. Start a fresh session.

## Verify

- Confirm the plugin root contains `.claude-plugin/plugin.json`.
- Ask: `Use $sentinelx-prime while we plan this admin auth change.`
- The hook should inject brief SentinelXPrime bootstrap context at session start.
- Record the result in [`validation/release-readiness.md`](validation/release-readiness.md) before calling the Claude Code surface release-ready.
- Run `node scripts/check-release-readiness.mjs` before making an external release-ready or handoff claim.

## Marketplace Notes

This repository is manifest-complete for self-hosted or development plugin flows because it includes a manifest and marketplace descriptor. It does not claim an official public marketplace listing or evidence-backed public release readiness without recorded runtime smoke results.

## Updating

```bash
cd ~/.claude/sentinelxprime && git pull
```

Restart the Claude Code session after updating.
