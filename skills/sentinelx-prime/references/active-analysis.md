# Active Analysis

## Purpose
- Ground risky-change and accepted review outputs in real scoped diffs and source code when the user explicitly allows read-only evidence collection.
- Keep active analysis advisory-only and bounded to the current repo-local scope.

## Consent Model
- Active analysis counts as tool execution because it runs read-only shell commands.
- Do not run active analysis without explicit user consent.
- In the `review` stage, a user accepting the focused security review offer counts as consent for read-only active analysis within the current review scope.
- In risky implementation work, ask once whether the user wants a read-only active analysis pass for the current `risk_scope_key`.
- If the user declines active analysis for the current `risk_scope_key`, do not ask again until the scope key changes materially or the stage changes.
- Do not run active analysis in the `plan` or `test-rig` stages.

## Safe Command Allowlist

### Automatic After Consent
- `git status --porcelain=v1 --untracked-files=all -- <scope>`
- `git diff --stat -- <scope>`
- `git diff --cached --stat -- <scope>`
- `git diff -- -- <file>`
- `git diff --cached -- -- <file>`
- `git log --oneline -1`
- `wc -l <file>`
- `sed -n '<start>,<end>p' <file>`
- `nl -ba <file> | sed -n '<start>,<end>p'`
- `head -n <N> <file>`
- `find <scope> -type f`
- `rg -n '<pattern>' <scope>`

### Never Automatic
- any write command
- any install command
- any network command
- any external scanner or ecosystem tool

## Shell Safety Rules
- Always quote file paths.
- Use `--` before git pathspecs and for shell commands that support it safely in the current environment.
- Skip paths that contain newline characters or shell metacharacters that cannot be safely quoted in one command.
- On BSD/macOS userlands, do not assume utilities such as `sed` accept `--` before a file path.
- If a path is skipped for safety reasons, list it in `unreviewed_areas` and note the limitation in `assumptions`.

## Scope Rules
- Resolve the current repo-local scope before active analysis starts.
- In nested workspaces, treat the controlling repo-local subtree as a hard boundary for both commands and evidence.
- In nested workspaces, inspect only files that fall under the controlling repo-local subtree.
- In nested workspaces, never run unscoped `git status`, `git diff`, `find`, or `rg` commands from the repository root because they leak sibling paths into trace artifacts.
- In a root-scoped workspace, analyze the whole repository scope, but still prioritize only the current risky file set.
- Do not read unrelated files outside the current scoped change just because they share keywords.

## Progressive Narrowing Pipeline

### 1. Discover
- Prefer `git status --porcelain=v1 --untracked-files=all -- <scope>` to discover tracked, staged, unstaged, and untracked files inside the active scope.
- If the user explicitly names a single risky file, direct inspection of that named file plus a scoped diff is an acceptable narrow-path optimization; do not broaden scope just to satisfy discovery.
- In nested workspaces, do not substitute bare `git status --short` or a repo-wide `git diff`; keep the pathspec rooted at the controlling subtree or the exact file under review.
- If the working tree is clean, use `git log --oneline -1` to confirm whether a commit history exists.
- Use `git diff --stat -- <scope>` and `git diff --cached --stat -- <scope>` only after discovery identifies files worth inspecting.

### 2. Classify
- Match changed files against the file-path signal boosters in `risky-change-signals.md`.
- Preserve explicit user-reported risky domains even when path patterns are weak or absent.
- If a file matches multiple domains, keep all matched domains in scope.

### 3. Read
- For tracked files with unstaged changes, read `git diff -- -- <file>`.
- For tracked files with staged changes, read `git diff --cached -- -- <file>`.
- For untracked files, read file content directly after checking size with `wc -l <file>`.
- When narrowing within a nested scope, keep any follow-up `rg`, `find`, or direct file reads rooted at that same subtree or exact file path.
- If a file is small enough, read the relevant full file.
- If a file is large, read only the changed hunks plus nearby context.

### 4. Review
- Build an enriched context pack for the risky-change pass or accepted review.
- Include only the scoped files that fit inside the context budget.
- Mark any skipped files as unreviewed rather than implying full coverage.

## Context Budget
- Maximum 8 risky files per pass.
- Maximum 300 lines of diff or file content per file.
- Maximum 2000 total lines of diff plus code context per pass.
- Prioritize by risk domain severity, then by change size, then alphabetically.
- Treat binary files, minified assets, lockfiles, vendored code, and generated files as low-priority unless the user explicitly flags them.

## Risk Scope Key
- Use the canonical shape `<primary-risk-domain>:v1:<sha256(payload)>`.
- Build `payload` from the normalized risky path list first: portable `/` separators, deduplicated entries, repo-scope relative paths, and alphabetical ordering.
- When diff evidence exists, append a normalized hunk-header summary to the payload.
- When diff evidence does not exist, preserve the fallback mode explicitly with `mode=current-source` or `mode=description`.
- Rotate the key when the risky file set changes materially or when trust-boundary semantics change inside the same files.

## Worked Example
If the risky scope is `src/Auth/Token.cs` plus `src/Auth/Session.cs`, the normalized payload can start with `mode=current-source` and `paths=src/Auth/Session.cs,src/Auth/Token.cs`. If later work keeps the same files but changes the trust boundary from "token validation only" to "token validation plus impersonation policy," mint a new key because the security semantics changed even though the file set did not.

## Evidence Source
- `code`: conclusion is grounded in inspected source content.
- `diff`: conclusion is grounded in diff content.
- `heuristic`: conclusion is grounded only in path or scope signals.
- `description`: conclusion is grounded only in the user's description because active analysis was unavailable or declined.

## Secret Redaction
- Redact long opaque values, key blocks, obvious password assignments, token assignments, and credential-like literals before adding diff or file content to the context pack.
- Replace secret values with `[REDACTED]`.
- Do not include raw secret values in prompts, findings, or coverage notes.
- If secret-looking material appears in diff or code context, call it out as evidence without reproducing the value.

## Fallback Behavior
- If git is unavailable, active analysis is unavailable for diff-grounded scoped discovery.
- If git is unavailable but shell reads still work, you may inspect files already visible in context or explicitly named by the user as a limited current-source fallback.
- A limited current-source fallback must not be described as diff-grounded active analysis.
- If fallback conclusions rely only on the user's description or path heuristics, set `evidence_source` to `description` or `heuristic`.
- If direct file reads materially inform the conclusion during fallback, say that active analysis was unavailable and that the review used a limited current-source fallback rather than a scoped diff review.
- If shell access is unavailable, stay description-based and note the limitation in `assumptions`.
- If the repo has no commits or the scoped working tree is clean, fall back to explicit user-described scope or visible files already in context.
- If only an unscoped command would reveal sibling paths outside the current nested scope, skip that command and continue with narrower file reads instead of broadening the trace.
- Never fail the workflow just because active analysis is unavailable.
