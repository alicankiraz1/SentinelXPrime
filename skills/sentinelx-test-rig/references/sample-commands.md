# Sample Commands

Use these commands as suggestions only. Do not claim they were run unless they were actually executed in the current session.

## Common
- `semgrep scan .`
- `gitleaks detect --source .`

## Python
- `bandit -r .`
- `pip-audit`

## Go
- `govulncheck ./...`
- `gosec ./...`

## Java / Spring
- `mvn org.owasp:dependency-check-maven:check`
- `spotbugs`

## .NET / ASP.NET Core
- `dotnet list package --vulnerable --include-transitive`
- `semgrep scan .`

## Node / TypeScript
- `npm audit --omit=dev`
- `semgrep scan .`

## Ruby / Rails
- `bundle audit`
- `brakeman`

## PHP / Laravel
- `composer audit`
- `phpstan`

## Rust
- `cargo audit`
- `cargo deny check advisories`

## Command Guidance
- Prefer project-root execution unless the user says otherwise.
- Mention prerequisites when a command depends on local tool installation.
- If a command is ecosystem-specific, say so plainly.
