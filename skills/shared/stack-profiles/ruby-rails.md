# Ruby on Rails Profile

## When To Use
- Load this profile when the repository or user request clearly targets Ruby on Rails.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- controller authorization boundaries and before-action coverage
- mass assignment protections and strong parameters
- session, CSRF, and cookie configuration defaults
- Active Record query construction and unsafe interpolation
- encrypted credentials, secret rotation, and environment separation
- background job trust boundaries and deserialization behavior

## Red Flags
- `permit!` or broad parameter whitelists on sensitive models
- controller actions that rely on view or route assumptions instead of explicit auth checks
- session or remember-me logic without revocation or fixation handling
- dynamic query fragments built from request parameters
