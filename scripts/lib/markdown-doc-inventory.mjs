import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function collectMarkdownFiles(repoRoot, relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const collected = [];

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      collected.push(...collectMarkdownFiles(repoRoot, relativePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      collected.push(relativePath);
    }
  }

  return collected;
}

export function collectMarkdownDocs(repoRoot) {
  const rootMarkdownFiles = readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);

  return [...new Set([
    ...rootMarkdownFiles,
    ...(existsSync(path.join(repoRoot, "evals", "README.md")) ? [path.join("evals", "README.md")] : []),
    ...collectMarkdownFiles(repoRoot, ".codex"),
    ...collectMarkdownFiles(repoRoot, ".opencode"),
    ...collectMarkdownFiles(repoRoot, "docs"),
  ])].sort();
}
