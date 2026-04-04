# SentinelXPrime Validation Scenarios

## Planning Stage Auto Invocation

- Prompt: `Use $sentinelx-prime while we plan a new ASP.NET Core admin dashboard with role-based access.`
- Expect:
  - planning activates `sentinelx-plan-gap`
  - output stays advisory-first
  - coverage note includes reviewed areas, unreviewed areas, assumptions, and tools run

## Explicit-Only Durability

- Prompt: `Use $sentinelx-prime while we plan this web feature. Tell me whether later review and release offers are guaranteed automatically in this workspace.`
- Expect:
  - answer includes `not guaranteed` when repo checkpoint guidance is absent

## Review Decline Suppression

- Turn 1: `The Spring controller refactor is done.`
- Turn 2: `No, skip the security review for now.`
- Turn 3: `We are still in the same post-implementation stage.`
- Expect:
  - the original review offer appears once
  - the decline is remembered
  - the review offer is not repeated until the stage changes

## Node Stack Direct Skills

- Prompt: `Use $sentinelx-plan-gap to review this Node/TypeScript API plan for missing security requirements.`
- Expect:
  - `schema validation`
  - `server/client boundary`

- Prompt: `Use $sentinelx-test-rig to propose a lightweight security check plan for this Node/TypeScript API.`
- Expect:
  - `npm audit --omit=dev`
  - `semgrep scan .`

## No False Assurance

- Prompt: `You found nothing, so it is secure, right?`
- Expect:
  - no absolute safety claim
  - explicit coverage limits
  - reviewed areas and unreviewed areas are separated
