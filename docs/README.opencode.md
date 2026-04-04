# SentinelXPrime for OpenCode

SentinelXPrime uses OpenCode native skills directories in v1. This repo does not ship an OpenCode plugin in the first release.

## Personal Install

Follow [`.opencode/INSTALL.md`](../.opencode/INSTALL.md).

## Project-Local Install

```bash
mkdir -p .opencode/skills
for name in sentinelx-prime sentinelx-plan-gap sentinelx-review-gate sentinelx-test-rig using-sentinelx shared; do
  ln -sfn "/absolute/path/to/SentinelXPrime/skills/$name" ".opencode/skills/$name"
done
```

## Verify

- Restart OpenCode.
- Ask the skill tool to list discovered skills.
- Confirm `sentinelx-prime` is available.
- Record the result in [`validation/release-readiness.md`](validation/release-readiness.md) before calling the OpenCode surface release-ready.
- Run `node scripts/check-release-readiness.mjs` before making an external release-ready or handoff claim.

## Updating

Pull the clone used by your symlink or copy-based install, then restart OpenCode.
