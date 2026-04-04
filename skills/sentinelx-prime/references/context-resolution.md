# Context Resolution

## Resolution Order
- Start with the global Codex home directory.
- In global scope, use `AGENTS.override.md` if it exists; otherwise use `AGENTS.md`.
- At global scope, include only the first non-empty instruction file.
- Then walk from the project root toward the current working directory.
- If no project root is available, treat the current directory as the only project-scope directory.
- In each directory, check `AGENTS.override.md`, then `AGENTS.md`, then any configured names from `project_doc_fallback_filenames`.
- Include at most one non-empty instruction file per directory.
- When parent and child directories both define repo-local policy, the nearer file controls the current scope because it is applied later in the merged chain.
- Skip empty files.
- Stop adding project instruction files once the combined project-doc content reaches the configured `project_doc_max_bytes` limit. If the environment does not override it, assume the current default of `32 KiB`.
- Do not resolve repository policy relative to the installed skill directory.

## Nested Scope Example
- Project root contains `AGENTS.md`.
- `services/api/` contains `AGENTS.override.md`.
- Current working directory is `services/api/auth/`.
- Result: the root file provides broader defaults, and `services/api/AGENTS.override.md` is the controlling repo-local instruction source for work under `services/api/`.

## Session Boundaries
- Treat AGENTS resolution as a run-start or session-start decision.
- If the user adds or edits repo-local AGENTS files mid-session, do not promise that the active run will reload them automatically.
- If fallback filenames or project-doc byte limits change in config, validate them in a new run or session.

## Fallback Behavior
- If no repo-local AGENTS file exists in the chain, stay in explicit-only or session-local guidance mode.
- If the workspace relies on alternate instruction filenames, only treat them as repo-local policy when the active Codex config lists them in `project_doc_fallback_filenames`.
- Keep the stage classification advisory when repository policy is missing.
- Do not imply durable repo-integrated checkpoint behavior without repo-local policy.
