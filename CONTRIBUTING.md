# Contributing

Thanks for helping improve SentinelXPrime.

## Good Contributions

- clearer stage detection rules
- better stack-specific guidance for supported ecosystems
- new stack profiles with concrete framework-specific red flags
- better install docs for supported platforms
- tighter wording that reduces false confidence

## Ground Rules

- keep each `SKILL.md` concise
- keep `description` frontmatter focused on triggering conditions, not workflow summaries
- move repeated details into shared references instead of duplicating them across skills
- do not add language that claims a repository is secure or fully reviewed
- do not add instructions that silently install tools or mutate project files unless that behavior is explicitly scoped and documented
- do not document unverified platform behaviors as supported

## If You Add A New Stack Profile

1. Add a file under `skills/shared/stack-profiles/`.
2. Keep the same section shape:
   - `When To Use`
   - `Focus Areas`
   - `Red Flags`
3. Update example prompts or docs that should mention the new stack.

## Validation Checklist

Before opening a PR, verify:

- every skill has `name` and `description` frontmatter
- skill directory names match the `name` frontmatter
- shared references stay the source of truth for common rules
- prompts and docs clearly distinguish planning gaps from confirmed findings
- no new content creates false assurance
- supported-platform docs only promise files and behaviors that exist in the repo

## Review Notes

When proposing changes, explain:

- which stage the change affects
- whether it changes opt-in behavior
- whether it changes shared reporting or stack-specific logic
- whether it changes the supported platform surface or compatibility guidance
