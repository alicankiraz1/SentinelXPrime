# Node Web Profile

## When To Use
- Load this profile when the repository or user request clearly targets generic server-side Node.js or TypeScript services.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- authentication and authorization boundaries in middleware, handlers, and service layers
- schema validation at request boundaries and serialization safety
- server/client boundary leakage in SSR flows or shared code
- outbound HTTP calls, SSRF exposure, and other trust-boundary integrations
- file handling, uploads, path resolution, and temporary storage
- dependency scripts, configuration loading, and secret handling

## Red Flags
- assuming framework defaults cover auth, validation, or error handling
- unsafe string building for shell commands, queries, or URLs
- direct filesystem trust for user-controlled paths or uploaded files
- secrets, tokens, or service credentials checked into source or logged
- custom middleware or handler ordering that weakens enforcement
