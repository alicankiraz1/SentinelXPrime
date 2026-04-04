# Activation Rules

## Signal Priority
1. `AGENTS.md` checkpoint rules
2. Direct user intent
3. Work-context clues from the current session

## Adoption Modes

### Explicit-only use
Use when the user invokes the skill directly in a workspace that does not provide repo-local checkpoint guidance.

Rules:
- treat the invocation as stage-local help for the current interaction
- do not imply that later `review` or `test-rig` offers will automatically reappear
- if later checkpoints matter, say that repo-local checkpoint guidance or explicit re-invocation may be needed

### Repo-integrated use
Use when the current workspace provides repo-local checkpoint guidance through `AGENTS.md`, `AGENTS.override.md`, or a configured fallback project instruction filename.

Rules:
- treat repo-local checkpoint guidance as the durable source of stage re-entry
- use checkpoint wording from the repo when classifying `plan`, `review`, and `test-rig`
- prefer repo-local guidance over any global skill-install assumptions

### Hybrid use
Use when the skill is available through a Codex discovery path and the current workspace also provides repo-local checkpoint guidance.

Rules:
- treat this as the preferred adoption mode for reliable three-stage behavior
- use the discovery path for skill availability and the repo-local checkpoint file for durability
- keep later-stage offers tied to the repo-local checkpoint rules

## Stage Classification

### `plan`
Use when the session is about planning, scoping, architecture, spec writing, or task breakdown.

Signals:
- the user asks for a plan, roadmap, or design
- a spec is being written or reviewed
- the code has not been written yet and requirements are still being shaped

### `review`
Use when implementation appears complete or the user asks for a code review or final pass.

Signals:
- the user says the code is done, finished, or ready for review
- a diff, patch, or recently edited source files are in focus
- the conversation shifts from building to validation

### `test-rig`
Use when the feature or project is approaching release, handoff, or hardening.

Signals:
- the user asks about release readiness, hardening, or validation
- the feature is described as complete and the next step is test planning
- the repository needs a security-check workflow rather than a code review

### `uncertain`
Use when the stage evidence is weak, contradictory, or too sparse to place the work confidently into `plan`, `review`, or `test-rig`.

Rules:
- stay advisory
- do not trigger a risky-change review pass
- do not imply a full review occurred
- wait for stronger stage evidence or explicit user intent

## Prompting Rules
- For `plan`, invoke `sentinelx-plan-gap` automatically.
- For `review`, ask once whether the user wants a focused security review.
- For `test-rig`, ask once whether the user wants a stack-aware security check plan.

## Active Analysis Consent
- Active analysis is allowed only after explicit user consent.
- In the `review` stage, accepting the focused security review offer counts as consent for read-only active analysis within the accepted review scope.
- In risky implementation work, ask once whether the user wants a read-only active analysis pass for the current `risk_scope_key`.
- If the user declines active analysis for the current `risk_scope_key`, do not ask again until the scope key changes materially or the stage changes.
- Do not run active analysis in the `plan` or `test-rig` stages.

## Active Analysis Fallback
- If git is unavailable, do not claim diff-grounded active analysis.
- If git is unavailable but shell reads still work, a limited current-source fallback is allowed only for files already visible in context or explicitly named by the user.
- If shell access is unavailable, fall back to description-based review.
- If the scoped working tree is clean, prefer explicit user-described scope over broad repository guessing.
- When falling back, keep the output advisory and set `evidence_source` to `description` or `heuristic` unless direct file content materially changed the conclusion and the output explicitly says it was a limited current-source fallback.

## Interaction Rules
- For stage questions, follow `interaction-model.md`.
- Prefer native choice UI when available.
- If native choice UI is unavailable, use one concise text fallback.
- Do not repeat the same choice prompt in multiple formats.

## Re-Prompt Suppression
- If the user declines at a given stage, do not ask again until the stage materially changes.
- If the evidence is ambiguous, prefer a soft suggestion over a strong claim.
- If the user declines active analysis for the current `risk_scope_key`, do not repeat the same active-analysis ask until that scope changes materially.

## Risky Implementation Signals
- Use the risky-change review pass when the current scope crosses the threshold defined in `risky-change-signals.md`.
- Prefer file-path and diff-based evidence over vague keyword guesses.
- If the scope is ambiguous, stay advisory and do not imply a full review occurred.

## Risky-Change Review Pass Rules
- Run only one risky-change review pass per materially distinct risky scope key.
- Derive the risky scope key from the risk domain plus a normalized scope fingerprint, such as the stable file set or diff summary for the trust boundary in focus.
- Reuse the current scope summary instead of re-running on every minor follow-up edit inside the same scope key.
- Mint a new scope key when the risky file set changes materially or when the trust-boundary semantics change inside the same files.
- When active analysis is allowed, build the scope fingerprint from scoped changed files rather than only from user phrasing.
- If the review pass returns `none`, continue without interruption.
- If the review pass returns `advisory`, bundle it into the next natural update.
- If the review pass returns `important` or `high-risk`, surface a concise security note.

## Output Rules
- Always name the inferred stage when it matters to the recommendation.
- If the stage is uncertain, say so and stay in advisory mode.
- If repo-local checkpoint guidance is missing, say that durable multi-stage re-entry is not guaranteed in the current workspace.
- End substantial outputs with a coverage note.
