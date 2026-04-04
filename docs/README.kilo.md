# SentinelXPrime for Kilo

Kilo support in v1 is compatibility guidance only.

## What Is Supported

- Reusing SentinelXPrime repository instructions as custom guidance
- Reusing example prompts and stage checkpoint language
- Reusing the skill documents as reference material

## What Is Not Claimed

- no validated Kilo plugin package in this repo
- no validated native skill-path registration flow in this repo
- no official marketplace or auto-bootstrap claim in v1

## Recommended Compatibility Path

1. Copy the checkpoint block from [`examples/repo-agents-snippet.md`](examples/repo-agents-snippet.md) into your project instructions.
2. Keep the renamed SentinelXPrime skill docs available as reference.
3. Use the SentinelXPrime prompt names directly when you want to trigger the same stage-aware flow.

## Verify

Run a planning prompt and confirm the response follows the same planning, review, and test-rig checkpoint model documented in this repo.
