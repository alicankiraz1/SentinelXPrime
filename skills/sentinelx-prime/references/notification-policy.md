# Notification Policy

## Low-Noise Rules
- If review-pass output is `concern_level: none`, do not create a separate interruption.
- If review-pass output is `advisory`, fold it into the next natural progress update.
- If review-pass output is `important` or `high-risk`, emit a concise security note with evidence, impact, and the recommendation.

## Material Mapping
- `material` is a notification and suppression bucket rather than a user-facing concern level.
- Treat `material` as any result whose `concern_level` is `important` or `high-risk`.

## Suppression Memory
- Track the current inferred stage.
- Track whether the review or test-rig offer has already been shown.
- Track the current risk domains in focus.
- Track the current `risk_scope_key` in focus.
- Track whether active analysis was accepted, declined, or unavailable for the current `risk_scope_key`.
- Track the last review-pass result as `none`, `advisory`, or `material`, where `material` covers `important` and `high-risk`.
- Do not repeat the same concern unless the scope key changes materially or risk escalates.
- Treat a scope-key change as material when the normalized risky file set changes or when trust-boundary semantics change inside the same files.
