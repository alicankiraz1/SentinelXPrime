# Rust Web Profile

## When To Use
- Load this profile when the repository or user request clearly targets a Rust web service or API.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- extractor and middleware trust boundaries in Axum, Actix Web, or similar frameworks
- concurrency and shared-state ownership around caches, sessions, and background tasks
- explicit error mapping that avoids internal detail leakage
- token, cookie, and key material handling across async services
- dependency review for crates with networking, parsing, or crypto behavior
- file and path handling through async I/O and temporary storage layers

## Red Flags
- auth context stored in shared mutable state without clear ownership or invalidation
- broad `unwrap()` or panic paths in request handling and auth code
- custom crypto or token parsing instead of vetted crate behavior
- error responses that serialize internal state, debug structs, or secret-bearing config
