# Common Web Threats

Use this file when the stack is unclear or as the baseline companion to a stack profile.

## Core Categories

### Authentication and Session Handling
Look for unclear login flow ownership, session invalidation gaps, weak token handling, and missing logout expectations.

### Authorization and Trust Boundaries
Look for missing role or policy decisions, implicit trust in client input, and service-to-service assumptions that are not enforced.

### Input Validation and Output Encoding
Look for undefined validation rules, unsafe parsing, missing normalization, and unescaped output paths.

### Injection Risks
Look for query construction, shell execution, unsafe templating, or string-built commands that accept untrusted input.

### Sensitive Data Handling
Look for unclear data classification, logging of secrets or PII, missing retention limits, and insecure transport or storage assumptions.

### Secret Management
Look for inline credentials, unclear secret rotation, missing environment separation, and ad hoc key handling.

### Crypto And Key Lifecycle
Look for vague algorithm selection, missing key ownership, weak token verification assumptions, and rotation plans that stop at "we will rotate later." Pair detailed crypto questions with `skills/shared/crypto-guidance.md`.

### Dependency and Supply-Chain Risk
Look for unowned dependency updates, unreviewed transitive dependencies, and no vulnerability-check process.

### Logging, Monitoring, and Abuse Controls
Look for missing audit trails, no rate limiting, weak alerting assumptions, and unclear incident visibility.

## Usage Guidance
- Pair this file with a stack profile when the framework is known.
- If no stack can be confirmed, stay in `common-web` mode and say so.
- If crypto choices or token semantics matter, cross-check `skills/shared/crypto-guidance.md`.
- If the workload is GraphQL or serverless but no dedicated stack profile exists, keep the main assessment in `common-web` mode and name the missing stack-specific nuance explicitly.
- Do not describe the absence of findings as proof of security.
