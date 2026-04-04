# Crypto Guidance

Use this file when the plan, review, or release discussion touches password storage, encryption, signatures, token validation, or key lifecycle decisions.

## Password Hashing
- Prefer Argon2id where it is mature in the target stack; otherwise prefer bcrypt with a current cost setting.
- Treat password hashing separately from general-purpose hashing.
- Require explicit upgrade and rehash strategy when legacy hashes remain in circulation.

## Encryption And AEAD
- Prefer authenticated encryption modes such as AES-256-GCM or ChaCha20-Poly1305.
- Require a clear IV or nonce strategy and prohibit nonce reuse assumptions.
- Separate data-at-rest encryption decisions from transport-layer protection.

## Token Signing And Verification
- Require explicit algorithm allowlists for JWT or similar token formats.
- Validate issuer, audience, expiry, and key selection behavior together.
- Reject patterns that trust unsigned tokens, algorithm downgrade, or shared symmetric keys across trust boundaries without justification.

## Key Storage And Rotation
- Keep keys in managed secret stores, KMS-backed services, or equivalent protected configuration channels.
- Define ownership for generation, rollout, rotation cadence, emergency revocation, and decommissioning.
- Document how stale keys are retired from caches, workers, and background jobs.

## Unsafe Defaults And Anti-Patterns
- Do not use MD5, SHA-1, or plain SHA-256 for password storage.
- Do not hardcode keys, salts, IVs, or signing secrets in source control.
- Do not reuse the same credential or key material across environments without an explicit exception.
- Do not rely on library defaults when algorithm selection, issuer checks, or key lookup behavior materially affect trust boundaries.

## Worked Example
An API design says "we will store passwords securely" but never names the hash function, rehash flow, or reset-token signing key rotation. Treat that as a planning gap, not as proof that crypto is handled. The smallest useful remediation is to require Argon2id or bcrypt, define reset-token issuer and expiry checks, and document where keys live plus how they rotate.
