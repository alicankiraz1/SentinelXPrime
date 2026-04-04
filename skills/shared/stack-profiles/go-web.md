# Go Web Profile

## When To Use
- Load this profile when the repository or user request clearly targets a Go web service or API.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- handler and middleware auth boundaries in `net/http`, Gin, Echo, or Chi
- request context propagation and cancellation across trust boundaries
- file upload handling and temporary file lifecycle
- secret loading, environment parsing, and config package behavior
- goroutine fan-out around authorization, logging, or cache invalidation
- dependency and module integrity through `go.mod` and `go.sum`

## Red Flags
- auth or tenant context copied through untyped context keys without validation
- request bodies or files read multiple times without size limits or cleanup
- goroutines launched from handlers without cancellation or error ownership
- secrets or signing keys embedded in code or test fixtures
