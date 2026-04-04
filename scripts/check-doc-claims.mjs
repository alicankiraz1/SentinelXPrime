import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveFromImportMetaUrl } from "./lib/import-meta-paths.mjs";
import { collectMarkdownDocs } from "./lib/markdown-doc-inventory.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..");
const issues = [];

const claimPatterns = [
  { label: "Production-Ready", pattern: /\bproduction-ready\b/i },
  { label: "fully secure", pattern: /\bfully secure\b/i },
  { label: "absolutely secure", pattern: /\babsolutely secure\b/i },
  { label: "100% secure", pattern: /\b100%\s+secure\b/i },
  { label: "guaranteed secure", pattern: /\bguaranteed secure\b/i },
  { label: "fully reviewed", pattern: /\bfully reviewed\b/i },
];

const passCountPatterns = [
  { label: "17 eval tests %100 pass", pattern: /\b17\s+eval\s+tests?\b.*(?:100%|%100)/i },
  { label: "36 unit tests %100 pass", pattern: /\b36\s+unit\s+tests?\b.*(?:100%|%100)/i },
  { label: "17 eval testi %100 gecme", pattern: /\b17\s+eval\s+testi\b.*(?:100%|%100)/i },
  { label: "36 birim testi %100 gecme", pattern: /\b36\s+birim\s+testi\b.*(?:100%|%100)/i },
];

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

function isNegated(line) {
  return /\b(?:not|does not|do not|without|never|yanlis|degil|olmayan)\b/i.test(normalizeText(line));
}

const docsToCheck = collectMarkdownDocs(repoRoot);

for (const relativePath of docsToCheck) {
  const absolutePath = path.join(repoRoot, relativePath);
  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      continue;
    }

    for (const claim of claimPatterns) {
      if (claim.pattern.test(trimmedLine) && !isNegated(trimmedLine)) {
        issues.push(`${relativePath}:${index + 1} contains unsupported assurance-style claim "${claim.label}"`);
      }
    }

    for (const claim of passCountPatterns) {
      if (claim.pattern.test(trimmedLine)) {
        issues.push(`${relativePath}:${index + 1} contains stale pass-count language "${claim.label}"`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
