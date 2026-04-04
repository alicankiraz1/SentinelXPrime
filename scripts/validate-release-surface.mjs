import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walkFilesystem } from "./lib/filesystem-walker.mjs";
import {
  parseValidateReleaseSurfaceArgs,
  validateSummaryManifest,
} from "./lib/release-surface-validator.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const ignoredDirectories = new Set([".git", ".superpowers", "dist", "node_modules"]);
const machineSpecificPathPatterns = [
  /\/Users\/[A-Za-z0-9._-]+\//g,
  /\/Volumes\/[A-Za-z0-9._-]+\//g,
  /\/private\/var\/folders\/[A-Za-z0-9._-]+\//g,
  /\/var\/folders\/[A-Za-z0-9._-]+\//g,
];

function walk(rootPath, matcher) {
  const matches = [];
  walkFilesystem(rootPath, {
    shouldSkip({ entry, relativePath }) {
      return entry.isDirectory() && (ignoredDirectories.has(entry.name) || relativePath === "evals/artifacts");
    },
    visitFile({ absolutePath }) {
      if (matcher(absolutePath)) {
        matches.push(absolutePath);
      }
    },
  });
  return matches;
}

function stripCodeFences(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

function normalizeAnchor(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function collectAnchors(markdown) {
  const counts = new Map();
  const anchors = new Set();

  for (const line of markdown.split("\n")) {
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (!headingMatch) {
      continue;
    }

    const baseAnchor = normalizeAnchor(headingMatch[1]);
    if (!baseAnchor) {
      continue;
    }

    const nextCount = counts.get(baseAnchor) ?? 0;
    counts.set(baseAnchor, nextCount + 1);
    anchors.add(nextCount === 0 ? baseAnchor : `${baseAnchor}-${nextCount}`);
  }

  return anchors;
}

function shouldSkipLinkTarget(target) {
  return (
    target.startsWith("http://")
    || target.startsWith("https://")
    || target.startsWith("mailto:")
    || target.startsWith("tel:")
    || target.startsWith("sandbox:")
    || target.startsWith("runtime/")
    || target.startsWith("data:")
  );
}

function validateMarkdownLinks() {
  const issues = [];
  const markdownFiles = walk(repoRoot, (candidatePath) => candidatePath.endsWith(".md"));
  const anchorCache = new Map();

  for (const filePath of markdownFiles) {
    const markdown = readFileSync(filePath, "utf8");
    const searchableMarkdown = stripCodeFences(markdown);
    const linkPattern = /\[[^\]]+\]\(([^)\s]+(?:#[^)]+)?|#[^)]+)\)/g;
    let match = linkPattern.exec(searchableMarkdown);

    while (match) {
      const rawTarget = match[1].replace(/^<|>$/g, "");
      if (!rawTarget || shouldSkipLinkTarget(rawTarget)) {
        match = linkPattern.exec(searchableMarkdown);
        continue;
      }

      const [rawPathPart, rawAnchorPart] = rawTarget.split("#");
      const targetFilePath =
        rawPathPart.length === 0
          ? filePath
          : rawPathPart.startsWith("/")
            ? path.join(repoRoot, rawPathPart.slice(1))
            : path.resolve(path.dirname(filePath), rawPathPart);

      if (!existsSync(targetFilePath)) {
        issues.push(`${path.relative(repoRoot, filePath)} -> missing link target ${rawTarget}`);
        match = linkPattern.exec(searchableMarkdown);
        continue;
      }

      if (rawAnchorPart && targetFilePath.endsWith(".md")) {
        if (!anchorCache.has(targetFilePath)) {
          anchorCache.set(targetFilePath, collectAnchors(readFileSync(targetFilePath, "utf8")));
        }
        if (!anchorCache.get(targetFilePath).has(rawAnchorPart)) {
          issues.push(`${path.relative(repoRoot, filePath)} -> missing anchor ${rawTarget}`);
        }
      }

      match = linkPattern.exec(searchableMarkdown);
    }
  }

  return issues;
}

function validateReleaseSurfacePaths() {
  const issues = [];
  const markdownFiles = walk(repoRoot, (candidatePath) => candidatePath.endsWith(".md"));

  for (const filePath of markdownFiles) {
    const markdown = readFileSync(filePath, "utf8");
    for (const pattern of machineSpecificPathPatterns) {
      const matches = markdown.match(pattern) ?? [];
      for (const match of matches) {
        issues.push(`${path.relative(repoRoot, filePath)} -> machine-specific path reference ${match}`);
      }
    }
  }

  return issues;
}

function validateSkillFrontmatter() {
  const issues = [];
  const skillFiles = walk(path.join(repoRoot, "skills"), (candidatePath) => candidatePath.endsWith("SKILL.md"));

  for (const filePath of skillFiles) {
    const content = readFileSync(filePath, "utf8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatterMatch) {
      issues.push(`${path.relative(repoRoot, filePath)} -> missing frontmatter block`);
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);

    if (!nameMatch || nameMatch[1].trim().length === 0) {
      issues.push(`${path.relative(repoRoot, filePath)} -> missing frontmatter name`);
    }
    if (!descriptionMatch || descriptionMatch[1].trim().length === 0) {
      issues.push(`${path.relative(repoRoot, filePath)} -> missing frontmatter description`);
    }
  }

  return issues;
}

let validatorArgs;
try {
  validatorArgs = parseValidateReleaseSurfaceArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const issues = [
  ...validateMarkdownLinks(),
  ...validateReleaseSurfacePaths(),
  ...validateSkillFrontmatter(),
  ...validateSummaryManifest({ repoRoot, requireSummary: validatorArgs.requireSummary }),
];

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(issue);
  }
  process.exit(1);
}

console.log("release-surface validation passed");
