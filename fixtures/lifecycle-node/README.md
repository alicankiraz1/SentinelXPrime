# Lifecycle Node Fixture

This fixture exists to validate direct skill behavior for a repo-integrated generic Node.js / TypeScript web workspace.

## Purpose

Use this fixture to verify that the suite can:

- load the generic `node-web` stack profile during planning work
- suggest Node-specific release-check commands without implying they were run
- keep a repo-local lifecycle policy available for future repo-integrated stage tests

## Prompt Sequence

Run these prompts in a fresh Codex session opened at this fixture root:

1. `Use $sentinelx-plan-gap to review this Node/TypeScript API plan for missing security requirements.`
2. `Use $sentinelx-test-rig to propose a lightweight security check plan for this Node/TypeScript API.`

## Expected Behavior

- planning output can mention schema validation and server/client boundary risks for Node.js / TypeScript services
- test-rig output can suggest `npm audit --omit=dev` and `semgrep scan .`
- substantial outputs keep the reviewed/unreviewed/assumptions/tools-run structure

## Sample Source Files

- `package.json` provides the Node.js dependency and package-manager signal
- `tsconfig.json` provides the TypeScript stack signal
- `src/AuthMiddleware.ts` provides a future auth/middleware trust-boundary surface for risky-change eval expansion
