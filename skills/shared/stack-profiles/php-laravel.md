# PHP Laravel Profile

## When To Use
- Load this profile when the repository or user request clearly targets Laravel or a modern PHP web application.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- middleware and guard configuration for auth and tenant boundaries
- validation rules at controller and form-request entry points
- Eloquent mass assignment, casts, and query safety
- signed URLs, queue workers, and background task trust boundaries
- secret handling in `.env`, config caching, and deployment flow
- file storage drivers, path resolution, and upload handling

## Red Flags
- controllers or jobs that bypass policies or gates for convenience
- `$guarded = []` or similarly broad model assignment settings
- queue or notification flows that trust client-provided identifiers
- production secret material managed through copied `.env` files without rotation ownership
