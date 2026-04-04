import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceScript = path.join(repoRoot, "scripts", "check-release-readiness.mjs");
const millisecondsPerDay = 24 * 60 * 60 * 1000;

function createTempRepo(prefix) {
  const tempRepo = mkdtempSync(path.join(tmpdir(), prefix));
  mkdirSync(path.join(tempRepo, "docs", "validation"), { recursive: true });
  return tempRepo;
}

function runCheck(tempRepo) {
  return spawnSync(process.execPath, [sourceScript], {
    cwd: tempRepo,
    encoding: "utf8",
  });
}

function isoDateDaysAgo(daysAgo) {
  return new Date(Date.now() - (daysAgo * millisecondsPerDay)).toISOString().slice(0, 10);
}

test("fails claim readiness when a required surface has no pass row", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-blocked-");

  try {
    writeFileSync(
      path.join(tempRepo, "docs", "validation", "release-readiness.md"),
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Codex | macOS | user-scoped | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| Claude Code | macOS | local plugin | smoke | blocked | ${isoDateDaysAgo(0)} | missing runtime |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        "",
      ].join("\n"),
      "utf8"
    );

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /Claude Code/i);
    assert.match(result.stderr, /pass/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("passes claim readiness when Codex, Claude Code, and OpenCode each have a pass row", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-pass-");

  try {
    writeFileSync(
      path.join(tempRepo, "docs", "validation", "release-readiness.md"),
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Codex | macOS | user-scoped | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| Claude Code | macOS | local plugin | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        "",
      ].join("\n"),
      "utf8"
    );

    const result = runCheck(tempRepo);

    assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("fails cleanly when the release-readiness path is a directory", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-directory-");

  try {
    mkdirSync(path.join(tempRepo, "docs", "validation", "release-readiness.md"));

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /^unable to read release-readiness file /m);
    assert.match(result.stderr, /release-readiness\.md/);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("fails cleanly when the release-readiness file cannot be read", (t) => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-permissions-");
  const readinessPath = path.join(tempRepo, "docs", "validation", "release-readiness.md");

  try {
    if (process.getuid?.() === 0) {
      t.skip("root can still read chmod 000 files");
    }

    writeFileSync(
      readinessPath,
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Codex | macOS | user-scoped | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| Claude Code | macOS | local plugin | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        "",
      ].join("\n"),
      "utf8"
    );
    chmodSync(readinessPath, 0o000);

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /^unable to read release-readiness file /m);
    assert.match(result.stderr, /release-readiness\.md/);
  } finally {
    chmodSync(readinessPath, 0o644);
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("ignores fake pass rows inside fenced code blocks", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-fenced-");

  try {
    writeFileSync(
      path.join(tempRepo, "docs", "validation", "release-readiness.md"),
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Codex | macOS | user-scoped | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| Claude Code | macOS | local plugin | smoke | blocked | ${isoDateDaysAgo(0)} | missing runtime |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        "",
        "```md",
        "| Claude Code | fakeOS | fake-install | fake-proof | pass | 2026-04-04 | injected |",
        "```",
        "",
      ].join("\n"),
      "utf8"
    );

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /Claude Code/i);
    assert.match(result.stderr, /pass/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("ignores fake pass rows in secondary markdown tables", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-secondary-table-");

  try {
    writeFileSync(
      path.join(tempRepo, "docs", "validation", "release-readiness.md"),
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Codex | macOS | user-scoped | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| Claude Code | macOS | local plugin | smoke | blocked | ${isoDateDaysAgo(0)} | missing runtime |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        "",
        "## Example Table",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Claude Code | exampleOS | example-install | example-proof | pass | ${isoDateDaysAgo(0)} | injected |`,
        "",
      ].join("\n"),
      "utf8"
    );

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /Claude Code/i);
    assert.match(result.stderr, /pass/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("fails claim readiness when a required surface only has stale pass evidence", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-stale-");

  try {
    writeFileSync(
      path.join(tempRepo, "docs", "validation", "release-readiness.md"),
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        `| Codex | macOS | user-scoped | smoke | pass | ${isoDateDaysAgo(120)} | stale |`,
        `| Claude Code | macOS | local plugin | smoke | pass | ${isoDateDaysAgo(120)} | stale |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(120)} | stale |`,
        "",
      ].join("\n"),
      "utf8"
    );

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /stale|current/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("fails claim readiness when a pass row has an invalid verification date", () => {
  const tempRepo = createTempRepo("sentinelx-prime-readiness-invalid-date-");

  try {
    writeFileSync(
      path.join(tempRepo, "docs", "validation", "release-readiness.md"),
      [
        "# Release Readiness",
        "",
        "| surface | os | install_mode | proof | status | last_verified | notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| Codex | macOS | user-scoped | smoke | pass | not-a-date | invalid |",
        `| Claude Code | macOS | local plugin | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        `| OpenCode | macOS | personal | smoke | pass | ${isoDateDaysAgo(0)} | ok |`,
        "",
      ].join("\n"),
      "utf8"
    );

    const result = runCheck(tempRepo);

    assert.equal(result.status, 1, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stderr, /invalid/i);
    assert.match(result.stderr, /Codex/i);
  } finally {
    rmSync(tempRepo, { recursive: true, force: true });
  }
});
