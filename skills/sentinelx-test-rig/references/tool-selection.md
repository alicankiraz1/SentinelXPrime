# Tool Selection

## Common Tools
- `semgrep`: broad static security pattern matching across stacks
- `gitleaks`: secret and token discovery in repository history and files

## Python
- `bandit`: Python-focused secure coding checks
- `pip-audit`: dependency vulnerability review for installed packages

## Go
- `govulncheck ./...`: dependency and call-path aware vulnerability visibility
- `gosec ./...`: supplemental secure coding checks for common Go pitfalls

## Java / Spring
- `owasp dependency-check`: dependency vulnerability analysis for Maven or Gradle builds
- `spotbugs`: static analysis with Java-oriented bug patterns

## .NET / ASP.NET Core
- `dotnet list package --vulnerable --include-transitive`: dependency vulnerability visibility
- `semgrep`: supplemental static pattern review for application code

## Node / TypeScript
- `npm audit --omit=dev`: dependency vulnerability visibility for production packages
- `semgrep scan .`: supplemental static pattern review for application code

## Ruby / Rails
- `bundle audit`: dependency vulnerability visibility for Bundler-managed gems
- `brakeman`: Rails-oriented static security review

## PHP / Laravel
- `composer audit`: dependency vulnerability visibility for Composer-managed packages
- `phpstan`: supplemental static analysis when Laravel-specific tooling is unavailable

## Rust
- `cargo audit`: dependency vulnerability visibility for Cargo crates
- `cargo deny check advisories`: supplemental policy and advisory checks

## Selection Rules
- Start with the lowest-friction common tools when the stack is unclear.
- Prefer native ecosystem tooling for dependency visibility.
- If token or key handling is in scope, pair tool output with `skills/shared/crypto-guidance.md`.
- Never imply a tool was run if the user only asked for a plan.

## Worked Example
For a Rails release handoff with authentication and background jobs in scope, start with `bundle audit` for dependency visibility and `brakeman` for application-level checks. If the same release also rotates JWT signing keys, pair those commands with a manual checklist from `skills/shared/crypto-guidance.md` instead of assuming the tools cover key custody and rotation semantics.
