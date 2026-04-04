# Lifecycle Persistence

## Adoption Modes
- Explicit invocation: immediate stage-specific help in the current interaction.
- Repo-integrated invocation: repo-local `AGENTS.md` checkpoint instructions that can re-surface later stages.
- Hybrid invocation: global skill install plus repo-local checkpoint instructions. This is the recommended mode for durable three-stage coverage.

## Guarantees
- Do not imply that a single explicit invocation guarantees future review or test-rig offers.
- When repo-local checkpoint instructions exist, use them as the durable source of later-stage checkpoint behavior.
- If repo-local checkpoint instructions are missing, say that later security checkpoints may need to be invoked explicitly.

## Limitation Note
- When working without repo-local checkpoint policy, end substantial stage outputs with a note that durable multi-stage re-entry is not guaranteed in this workspace.
