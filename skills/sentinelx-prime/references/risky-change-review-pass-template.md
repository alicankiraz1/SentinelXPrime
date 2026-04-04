# Risky-Change Review Pass Prompt Template

Use this template when running a low-noise scoped risky-change review pass inside the main skill flow.

## Required Context Pack
- `stage`
- `dispatch_reason`
- `reviewed_scope`
- `risk_scope_key`
- `relevant_files_or_diff_summary`
- `diff_summary`
- `diff_snippets`
- `code_snippets`
- `active_analysis_scope`
- `evidence_source`
- `stack_hint`
- `constraints`

## Required Constraints
- advisory-only
- no file mutation
- no silent tool execution
- no automatic child-agent spawning
- state uncertainty when scope is incomplete
- redact or summarize secret material instead of forwarding raw values

## Scope Key Derivation
- Use the canonical shape `<primary-risk-domain>:v1:<sha256(payload)>`.
- Build `payload` from the normalized risky path list first: portable `/` separators, deduplicated entries, repo-scope relative paths, and alphabetical ordering.
- When diff evidence exists, append a normalized hunk-header summary to the payload.
- When diff evidence does not exist, preserve the fallback mode explicitly with `mode=current-source` or `mode=description`.
- Rotate the key when the risky file set changes materially or when the trust-boundary semantics change inside the same files.
- Prefer this deterministic fingerprint over prompt wording, timestamps, or ephemeral session details.

## Output Schema
- `concern_level`: `none` | `advisory` | `important` | `high-risk`
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

## Prompt Skeleton
You are reviewing a narrow risky-change scope inside the parent skill flow.

Review only the provided context pack. Do not infer that you reviewed the whole repository.
Return `concern_level: none` if you do not see a material issue in the scoped change.

When `diff_snippets` or `code_snippets` are present, ground findings in that source evidence.
Use `evidence_source: code` or `evidence_source: diff` when a conclusion comes directly from inspected content.
Use `evidence_source: heuristic` only when path or scope signals were all you had.
Use `evidence_source: description` only when the pass had to fall back to the user's description.

## Worked Example
If the review scope is an auth middleware patch under `src/Auth/AuthMiddleware.cs` and `src/Auth/SessionStore.cs`, keep the key stable while the file set and trust boundary stay the same. If a follow-up edit in those files adds admin impersonation or cross-tenant session sharing, mint a new `risk_scope_key` because the trust-boundary semantics changed materially.
