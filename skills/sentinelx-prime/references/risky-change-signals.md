# Risky Change Signals

## High-Signal Domains
- authentication and authorization
- session or token issuance and validation
- secrets, sensitive configuration, and environment boundary loading
- middleware ordering, security headers, and request pipeline controls
- outbound requests, webhooks, and third-party trust boundaries
- file upload, file serving, archive handling, and path access
- CI, container, deployment, and infrastructure boundary changes

## Dispatch Threshold
- Run a risky-change review pass only when a high-signal domain is present and the current scope suggests a security-relevant behavior change.
- Treat file paths, task/spec text, and diff summaries as signals.

## Non-Triggers By Default
- comment-only edits
- formatting-only edits
- naming-only refactors
- doc-only changes
- UI-only changes with no trust-boundary impact

## File-Path Signal Boosters
- Treat these patterns as signal boosters, not hard rules.
- A matched file should be read and validated within the current scoped change before conclusions are raised.

### Authentication and Authorization
- `auth/`, `/auth/`, `authentication`, `authorization`, `identity`, `claims`, `roles`, `policy`
- `login`, `logout`, `signin`, `signout`, `principal`

### Session and Token
- `token`, `session`, `jwt`, `oauth`, `oidc`, `refresh`, `cookie`

### Secrets and Configuration
- `.env`, `secret`, `credential`, `vault`, `keystore`, `certificate`, `signingkey`
- `appsettings`, `application-`, `config/secrets`

### Middleware and Pipeline
- `middleware`, `filter`, `interceptor`, `handler`, `pipeline`
- `startup.cs`, `program.cs`, `securityconfig`, `websecurityconfig`, `settings.py`, `wsgi.py`, `asgi.py`

### Outbound and Trust Boundary
- `webhook`, `callback`, `proxy`, `gateway`, `httpclient`, `resttemplate`, `requests`
- `cors`, `csp`

### File Handling
- `upload`, `download`, `storage`, `archive`, `zip`, `multipart`, `attachment`
- `file` and `path` when the surrounding scope is file-serving or archive handling

### CI and Deployment
- `dockerfile`, `docker-compose`, `.github/workflows`, `.gitlab-ci`, `jenkinsfile`, `azure-pipelines`
- `deploy`, `terraform`, `helm`, `k8s`, `ansible`
