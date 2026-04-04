# Plan Gap Checklist

## Review Categories

### Authentication And Authorization Requirements
- Which identities, roles, tenants, or service principals cross the boundary?
- Where must authorization be enforced explicitly instead of assumed from the client or UI flow?
- What is the failure mode if a route, handler, or job skips the intended authorization check?

### Trust Boundaries And External Integrations
- Which outbound services, callbacks, queues, or webhooks are trusted, and why?
- What data enters from third parties, and where is it normalized before use?
- How would the system fail if an external dependency returned malicious or stale data?

### Input Validation And Output Handling Expectations
- What are the accepted schemas, normalization rules, and rejection rules at each entry point?
- Which responses, templates, or exports need explicit output encoding?
- What breaks if validation is partial, inconsistent, or left to framework defaults?

### Sensitive Data Handling And Retention
- Which fields count as secrets, credentials, tokens, regulated data, or customer content?
- Where may that data be logged, cached, exported, or copied into support tooling?
- What retention, masking, or deletion expectations are missing from the plan?

### Secret Management And Configuration Flow
- Where do runtime secrets, signing keys, and environment overrides originate?
- How are secrets rotated, revoked, and separated across environments?
- What happens if a secret is copied into source control, fixtures, or error messages?

### Crypto And Key Lifecycle
- Which algorithms, token validation rules, and key ownership decisions are explicit?
- What rotation, revocation, or rehash path exists for long-lived secrets or password material?
- Pair detailed crypto questions with `skills/shared/crypto-guidance.md`.

### Logging, Monitoring, And Abuse Controls
- Which security-relevant actions need audit visibility or anomaly detection?
- What rate limits, replay defenses, or abuse throttles are required?
- How would responders detect misuse without exposing sensitive data in logs?

### Dependency And Supply-Chain Assumptions
- Which packages, container images, or generated artifacts create trust-boundary risk?
- Who owns upgrade cadence and vulnerability triage?
- What fails if a build-time dependency or plugin is compromised?

### Compliance Or Data-Boundary Triggers
- Does the plan move data across regions, tenants, or regulated boundaries?
- Are there requirements for consent, minimization, or audit evidence?
- What legal or contractual obligations become security requirements here?

## Output Template
- Summary
- Gaps
- Risk scenarios
- Recommended plan additions
- Coverage note

## Review Guidance
- Start with the most material missing control, not the largest list.
- Tie every suggestion to a concrete failure mode.
- Cross-check the plan against any loaded stack profile so stack-specific controls are not skipped.
- If abuse resistance or rate limiting matters, say so directly rather than hiding it under generic monitoring language.
- If crypto choices are underspecified, point to `skills/shared/crypto-guidance.md`.
- If the plan is strong, say what is already covered before listing gaps.

## Worked Example
A feature plan says "admins can upload CSVs that trigger payout adjustments" but never defines file validation, auth boundaries for the uploader, abuse throttling, or rollback behavior when queued jobs fail. The smallest useful plan addition is to require explicit admin authorization, CSV schema validation, rate limiting for bulk uploads, and an audit trail for each payout mutation.
