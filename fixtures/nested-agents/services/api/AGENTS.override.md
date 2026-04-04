# Nested Fixture API Override

## Scope Rule
- This file controls work under `services/api/`.
- When planning auth changes from this subtree, say that `services/api/AGENTS.override.md` is the controlling repo-local instruction source for the current scope.
- For active analysis from this subtree, keep `git`, `rg`, and file-read commands scoped to `services/api/` or a narrower path under it; do not enumerate sibling paths outside this subtree.

## Required Checkpoints
- Planning checkpoint: before locking a plan, run a security gap analysis that is scoped to the API subtree.
- Post-implementation checkpoint: when coding appears complete, offer a focused security review.
- Pre-release checkpoint: before release or handoff, offer a stack-aware security test/check plan.
