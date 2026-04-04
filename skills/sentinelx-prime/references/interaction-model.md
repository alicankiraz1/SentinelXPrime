# Interaction Model

## Choice Prompts
- Prefer Codex native choice UI when the client can render structured choices.
- If native choice UI is unavailable, ask one plain-text multiple-choice question.
- Do not emit the same question twice in different formats.
- Keep fallback prompts short and single-turn.

## Language
- Keep repository-facing artifacts in English.
- Prefer the user's configured assistant language for user-facing replies when available.
- If that signal is unavailable, follow the active conversation language.
- Fall back to English if neither signal is available.

## Stage Offer Language
- When a stage skill needs a yes-or-no offer, ask once in the user's configured assistant language when available.
- If that signal is unavailable, follow the active conversation language.
- Do not hardcode a fixed English ask prompt in stage skills.

## Risky-Change Review Messaging
- Keep risky-change review notes shorter than stage reviews.
- Do not present low-confidence review-pass output as a hard finding.
- If the user has not asked for a security deep dive, prefer a brief note over a long review.
