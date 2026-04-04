# Java / Spring Profile

## When To Use
- Load this profile when the repository or user request clearly targets Spring or Spring Boot.
- Pair it with `skills/shared/common-web-threats.md`.
- Fall back to common-web guidance if the framework cannot be confirmed.

## Focus Areas
- Spring Security coverage and default assumptions
- method security and endpoint authorization
- request binding and validation behavior
- actuator and management endpoint exposure
- serialization, templating, and reflection-heavy flows
- dependency hygiene in Maven or Gradle builds

## Red Flags
- unsecured actuator or admin endpoints
- custom access rules that bypass Spring Security
- dangerous deserialization or reflection patterns
- sensitive configuration living directly in repository files
