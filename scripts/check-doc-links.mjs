import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveFromImportMetaUrl } from "./lib/import-meta-paths.mjs";
import { collectMarkdownDocs } from "./lib/markdown-doc-inventory.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..");
const canonicalRepoUrl = "https://github.com/alicankiraz1/SentinelXPrime.git";
const installDocsRequiringCanonicalCloneUrl = new Set([
  ".codex/INSTALL.md",
  ".opencode/INSTALL.md",
  "docs/README.claude.md",
  "docs/README.codex.md",
]);

const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const issues = [];

function isWithinRepoRoot(resolvedTarget) {
  const relativeTarget = path.relative(repoRoot, resolvedTarget);
  return relativeTarget === ""
    || (!relativeTarget.startsWith("..") && !path.isAbsolute(relativeTarget));
}

const docsToCheck = collectMarkdownDocs(repoRoot);

for (const relativePath of docsToCheck) {
  const absolutePath = path.join(repoRoot, relativePath);
  const content = readFileSync(absolutePath, "utf8");

  if (content.includes("<repo-url>")) {
    issues.push(`${relativePath} contains unreplaced <repo-url> placeholder`);
  }

  if (
    installDocsRequiringCanonicalCloneUrl.has(relativePath)
    && /git clone\b/.test(content)
    && !content.includes(canonicalRepoUrl)
  ) {
    issues.push(`${relativePath} must use canonical clone URL ${canonicalRepoUrl}`);
  }

  for (const match of content.matchAll(markdownLinkPattern)) {
    const rawTarget = match[1].trim();
    if (
      rawTarget.length === 0 ||
      rawTarget.startsWith("http://") ||
      rawTarget.startsWith("https://") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("#")
    ) {
      continue;
    }

    const targetWithoutFragment = rawTarget.split("#")[0].split("?")[0];
    if (!targetWithoutFragment) {
      continue;
    }

    const resolvedTarget = path.resolve(path.dirname(absolutePath), targetWithoutFragment);
    if (!isWithinRepoRoot(resolvedTarget)) {
      issues.push(`${relativePath} references path outside repository ${rawTarget}`);
      continue;
    }

    if (!existsSync(resolvedTarget)) {
      issues.push(`${relativePath} references missing path ${rawTarget}`);
    }
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
