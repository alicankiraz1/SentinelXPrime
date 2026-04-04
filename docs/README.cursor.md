# SentinelXPrime for Cursor

Cursor support in v1 is compatibility guidance only.

## What Is Supported

- Reusing SentinelXPrime docs, prompts, and repository checkpoint snippets
- Translating the `AGENTS.md` checkpoint model into project rules or workspace instructions

## What Is Not Claimed

- no validated Cursor plugin manifest in this repo
- no validated Cursor session-start hook in this repo
- no marketplace-ready Cursor packaging claim in v1

## Recommended Compatibility Path

1. Use [`examples/repo-agents-snippet.md`](examples/repo-agents-snippet.md) as the basis for project rules.
2. Keep the SentinelXPrime repo nearby for reference.
3. Invoke the renamed skills and prompts manually when the session needs them.

## Verify

Ask for a planning or review prompt using the new SentinelXPrime names and confirm the model follows the checkpoint language you copied into rules.
