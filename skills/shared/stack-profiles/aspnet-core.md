# ASP.NET Core Profile

## When To Use
- Load this profile when the repository or user request clearly targets ASP.NET Core.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- authentication scheme selection and fallback behavior
- authorization policies on endpoints and handlers
- model binding and validation boundaries
- Data Protection and secret storage patterns
- middleware ordering and exception exposure
- cookie, token, and session defaults

## Red Flags
- endpoints without explicit authorization expectations
- custom authentication flows that bypass framework protections
- sensitive data in logs, problem details, or exception paths
- middleware ordering that weakens auth, validation, or error handling
