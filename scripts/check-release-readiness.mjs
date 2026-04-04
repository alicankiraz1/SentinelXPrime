import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const requiredSurfaces = ["Codex", "Claude Code", "OpenCode"];
const maxPassAgeDays = 90;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const canonicalHeader = [
  "surface",
  "os",
  "install_mode",
  "proof",
  "status",
  "last_verified",
  "notes",
];

function parseCells(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isCanonicalHeader(cells) {
  return cells.length === canonicalHeader.length
    && cells.every((cell, index) => cell === canonicalHeader[index]);
}

function isDelimiterRow(cells) {
  return cells.length === canonicalHeader.length
    && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseVerifiedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isCurrentPassRow(row, now) {
  const verifiedAt = parseVerifiedDate(row.lastVerified);
  if (!verifiedAt) {
    return {
      isCurrent: false,
      reason: "invalid",
    };
  }

  const ageInDays = Math.floor((now - verifiedAt.getTime()) / millisecondsPerDay);
  if (ageInDays > maxPassAgeDays) {
    return {
      isCurrent: false,
      reason: "stale",
    };
  }

  return {
    isCurrent: true,
    reason: null,
  };
}

function parseRows(markdown) {
  const rows = [];
  const lines = markdown.split(/\r?\n/);
  let tableStart = -1;

  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index].trim();
    const delimiterLine = lines[index + 1].trim();
    if (!headerLine.startsWith("|") || !delimiterLine.startsWith("|")) {
      continue;
    }

    if (!isCanonicalHeader(parseCells(headerLine))) {
      continue;
    }

    if (!isDelimiterRow(parseCells(delimiterLine))) {
      continue;
    }

    tableStart = index + 2;
    break;
  }

  if (tableStart === -1) {
    return rows;
  }

  for (let index = tableStart; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith("|")) {
      break;
    }

    const cells = parseCells(line);
    if (cells.length !== canonicalHeader.length) {
      continue;
    }

    rows.push({
      surface: cells[0],
      os: cells[1],
      installMode: cells[2],
      proof: cells[3],
      status: cells[4],
      lastVerified: cells[5],
      notes: cells[6],
    });
  }

  return rows;
}

const args = process.argv.slice(2);

if (args.length > 1) {
  console.error(`Unsupported arguments: ${args.join(", ")}`);
  process.exit(1);
}

const readinessPath = args[0]
  ? path.resolve(process.cwd(), args[0])
  : path.resolve(process.cwd(), "docs", "validation", "release-readiness.md");

if (!existsSync(readinessPath)) {
  console.error(`release-readiness file is missing: ${readinessPath}`);
  process.exit(1);
}

let rows;
try {
  rows = parseRows(readFileSync(readinessPath, "utf8"));
} catch (error) {
  console.error(`unable to read release-readiness file ${readinessPath}: ${error.message}`);
  process.exit(1);
}

const issues = [];
const now = Date.now();

for (const surface of requiredSurfaces) {
  const matchingRows = rows.filter((row) => row.surface === surface);

  if (matchingRows.length === 0) {
    issues.push(`${surface} is missing from ${path.relative(process.cwd(), readinessPath)}`);
    continue;
  }

  const passRows = matchingRows.filter((row) => row.status.toLowerCase() === "pass");
  const currentPassRows = [];
  let hasInvalidPassRow = false;
  let hasStalePassRow = false;

  for (const row of passRows) {
    const evaluation = isCurrentPassRow(row, now);
    if (evaluation.isCurrent) {
      currentPassRows.push(row);
      continue;
    }

    if (evaluation.reason === "invalid") {
      hasInvalidPassRow = true;
    }

    if (evaluation.reason === "stale") {
      hasStalePassRow = true;
    }
  }

  if (currentPassRows.length > 0) {
    continue;
  }

  if (hasInvalidPassRow) {
    issues.push(`${surface} has pass rows with invalid last_verified values; use YYYY-MM-DD`);
  }

  if (hasStalePassRow) {
    issues.push(`${surface} must have at least one current pass row verified within the last ${maxPassAgeDays} days before making release-ready or handoff claims`);
  }

  if (passRows.length === 0) {
    issues.push(`${surface} must have at least one pass row before making release-ready or handoff claims`);
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`release-readiness claim gate passed for ${requiredSurfaces.join(", ")}`);
