# Python Web Profile

## When To Use
- Load this profile when the repository or user request clearly targets a Python web service or API.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- framework request parsing and validation patterns
- ORM and query safety assumptions
- secret and config loading paths
- unsafe deserialization and dynamic execution
- dependency hygiene and packaging flow
- production-serving defaults and debug settings

## Red Flags
- string-built queries or shell commands
- debug-friendly runtime settings in production paths
- secret material stored directly in source code
- implicit trust in framework defaults without explicit validation
