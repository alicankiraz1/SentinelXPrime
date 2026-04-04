# Security Policy

This repository contains security-oriented skills and documentation. It is not an executable scanner, but incorrect guidance or misleading defaults can still create risk.

`sentinelx-prime` provides advisory security guidance and checkpoint offers. It does not certify a repository as secure, fully reviewed, or production-ready.

## Reporting A Problem

- Do not post sensitive exploit details, live secrets, or private customer information in a public issue.
- Use GitHub private vulnerability reporting or a repository security advisory when it is enabled for this repository.
- If private reporting is not enabled yet, open a minimal public issue without exploit details and request a secure contact path from the maintainer.

## What To Report

- guidance that could cause dangerous false negatives
- prompts or rules that encourage unsafe default behavior
- examples that normalize insecure coding patterns
- metadata or docs that make users think the suite certifies security
- platform install docs that overstate supported behavior

## Out Of Scope

- vulnerabilities in third-party tools that are only mentioned as examples
- general secure coding debates without a concrete issue in this repository

## Disclosure Preference

- Keep private reports in GitHub security advisories when possible so triage stays tied to the repository history.
- If a public issue is needed to start contact, keep it minimal and move exploit details to a private channel before sharing reproducer data.
