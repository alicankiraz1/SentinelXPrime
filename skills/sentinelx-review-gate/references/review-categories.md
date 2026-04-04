# Review Categories

## Vulnerability Classes
- injection risks
- cross-site scripting and output encoding failures
- SSRF and unsafe outbound requests
- broken authorization
- session management flaws
- insecure crypto and token handling
- CORS and CSP misconfiguration
- XXE and unsafe XML parsing
- secret leakage
- error handling and information disclosure
- race conditions and async consistency bugs
- business logic abuse
- dependency and supply-chain exposure
- insecure file and path handling
- unsafe deserialization or dynamic execution

## Reporting Rubric
- `evidence`: what was seen in code or configuration
- `risk`: why it matters
- `failure_or_exploit_scenario`: how the issue can fail in practice
- `recommendation`: the smallest useful fix
- `verification`: how to prove the fix works

## Review Guidance
- Prioritize exploitable or high-impact findings first.
- Separate confirmed issues from lower-confidence concerns.
- Use `skills/shared/crypto-guidance.md` when algorithm choice, key rotation, token validation, or key custody meaningfully affects the finding.
- If code context is incomplete, say what was not reviewed.

## Worked Example
A release review sees JWT verification code plus a permissive CORS wildcard on admin endpoints. Report the auth and browser-boundary issues separately. The smallest useful fix is to lock the token algorithm and issuer checks, narrow the allowed origins, and verify that admin routes cannot be reached from unintended browser contexts.
