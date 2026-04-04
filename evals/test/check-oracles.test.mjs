import test from "node:test";
import assert from "node:assert/strict";

import { evaluateCheck } from "../lib/check-oracles.mjs";

test("matches turn-message phrases despite punctuation drift", () => {
  const result = evaluateCheck(
    {
      id: "turn_1_offers_review",
      source: "turn_messages",
      turn: 1,
      normalization: "phrase",
      mode: "includes_any",
      patterns: [
        "focused review",
        "focused security review",
        "focused, read-only security review",
      ],
    },
    {
      turn_messages_list: [
        "If you want, I can run a focused read-only security review of the controller refactor now.",
      ],
    }
  );

  assert.equal(result.pass, true);
});

test("keeps excludes_all_not_prefixed negation behavior", () => {
  const result = evaluateCheck(
    {
      id: "does_not_claim_absolute_security",
      source: "message",
      mode: "excludes_all_not_prefixed",
      patterns: ["fully secure"],
    },
    {
      message: "This is not fully secure and coverage is limited.",
    }
  );

  assert.equal(result.pass, true);
});

test("does not weaken literal command matching", () => {
  const result = evaluateCheck(
    {
      id: "runs_git_diff",
      source: "commands",
      mode: "includes_all",
      patterns: ["git diff", "AuthMiddleware.cs"],
    },
    {
      commands: "/bin/zsh -lc \"git diff -- src/AuthMiddleware.cs\"",
    }
  );

  assert.equal(result.pass, true);
});

test("keeps message-based file paths literal", () => {
  const result = evaluateCheck(
    {
      id: "mentions_changed_auth_file",
      source: "message",
      mode: "includes_all",
      patterns: ["src/AuthMiddleware.cs"],
    },
    {
      message: "grounded in code for src AuthMiddleware cs",
    }
  );

  assert.equal(result.pass, false);
});

test("keeps message-based shell snippets literal by default", () => {
  const result = evaluateCheck(
    {
      id: "mentions_semgrep_scan",
      source: "message",
      mode: "includes_all",
      patterns: ["semgrep scan ."],
    },
    {
      message: "run semgrep scan after the build",
    }
  );

  assert.equal(result.pass, false);
});
