# SentinelXPrime for Codex

SentinelXPrime uses Codex native skill discovery.

## Quick Install

Follow [`.codex/INSTALL.md`](../.codex/INSTALL.md).

## User-Scoped Install

```bash
git clone https://github.com/alicankiraz1/SentinelXPrime.git ~/.codex/sentinelxprime
mkdir -p ~/.agents/skills
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  ln -sfn "$HOME/.codex/sentinelxprime/skills/$name" "$HOME/.agents/skills/$name"
done
```

## Project-Scoped Install

```bash
git clone https://github.com/alicankiraz1/SentinelXPrime.git .vendor/sentinelxprime
mkdir -p .agents/skills
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  ln -sfn "$PWD/.vendor/sentinelxprime/skills/$name" "$PWD/.agents/skills/$name"
done
```

## Verify

- Restart Codex.
- Confirm the skills appear under `.agents/skills/`.
- Ask: `Use $sentinelx-prime while we plan this API auth change.`
- Record the result in [`validation/release-readiness.md`](validation/release-readiness.md) before calling the Codex surface release-ready.
- Run `node scripts/check-release-readiness.mjs` before making an external release-ready or handoff claim.

## Updating

Pull the clone you installed from, then restart Codex.

## Troubleshooting

- If a skill is missing, make sure both the skill directory and `shared` were linked.
- If old prompt names fail, use the new names from [`migration-from-codex-sentinel.md`](migration-from-codex-sentinel.md).
