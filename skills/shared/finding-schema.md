# Finding Schema

Use this schema across planning, review, and test-planning outputs so the suite keeps one reporting shape.

## Required Fields
- `id`: stable short identifier such as `authz-missing-role-check`
- `title`: short human-readable label
- `category`: security concern family such as `authz`, `input-validation`, or `secret-management`
- `severity`: `low`, `medium`, `high`, or `critical`
- `confidence`: `low`, `medium`, or `high`
- `stage`: `plan`, `review`, or `test-rig`
- `stack`: `common-web`, `aspnet-core`, `java-spring`, `python-web`, `node-web`, `go-web`, `ruby-rails`, `php-laravel`, or `rust-web`
- `evidence`: what was actually observed
- `risk`: why the issue matters
- `failure_or_exploit_scenario`: how the issue can fail in practice
- `recommendation`: the smallest useful next action
- `verification`: how to confirm the issue is fixed or the gap is closed

## Optional Fields
- `evidence_source`: `code`, `diff`, `heuristic`, or `description`

## Severity
- `low`: low-impact weakness or hygiene issue
- `medium`: meaningful risk with plausible impact
- `high`: strong security concern that should be addressed before release
- `critical`: severe issue with material compromise potential

## Confidence
- `low`: weak or incomplete evidence
- `medium`: likely valid but context may still change the conclusion
- `high`: directly supported by code, configuration, or an explicit requirement gap

## Risky-Change Review Concern Level
- `none`
- `advisory`
- `important`
- `high-risk`

## Notification Mapping
- `material` is a suppression and notification bucket, not a user-facing concern level
- treat `material` as `important` or `high-risk` when mapping review results into low-noise notifications

## Risky-Change Review Result Fields
- `concern_level`
- `risk_domain`
- `risk_scope_key`
- `evidence`
- `evidence_source`
- `risk`
- `recommendation`
- `confidence`
- `reviewed_areas`
- `unreviewed_areas`
- `active_analysis_scope`
- `assumptions`
- `tools_run`

## Evidence Source
- `code`: directly supported by inspected source code
- `diff`: directly supported by diff content
- `heuristic`: inferred from scope or file-path signals without direct source evidence
- `description`: based on the user's description because active analysis was unavailable, declined, or out of scope

## Coverage Note Template
- Reviewed:
- Not reviewed:
- Assumptions:
- Tools run:

## Guardrails
- If no tool ran, do not label the result as a scan result.
- If the stack is uncertain, lower confidence before raising certainty.
- If only planning artifacts exist, report gaps rather than confirmed vulnerabilities.
