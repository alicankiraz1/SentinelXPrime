import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { isIgnoredReleasePath, normalizeReleasePath } from "./release-policy.mjs";

function createFileHash(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function sortManifestEntries(entries) {
  return [...entries].sort((left, right) => (
    left.relativePath.localeCompare(right.relativePath) || left.entryType.localeCompare(right.entryType)
  ));
}

function applySyntheticFiles(manifest, syntheticFiles = []) {
  if (!Array.isArray(syntheticFiles) || syntheticFiles.length === 0) {
    return sortManifestEntries(manifest);
  }

  const manifestByPath = new Map(manifest.map((entry) => [entry.relativePath, entry]));

  for (const syntheticFile of syntheticFiles) {
    const relativePath = normalizeReleasePath(syntheticFile.relativePath ?? "");
    if (!relativePath || isIgnoredReleasePath(relativePath)) {
      continue;
    }

    const parentSegments = relativePath.split("/").slice(0, -1);
    let currentParent = "";
    for (const segment of parentSegments) {
      currentParent = currentParent ? `${currentParent}/${segment}` : segment;
      if (!manifestByPath.has(currentParent)) {
        manifestByPath.set(currentParent, {
          entryType: "directory",
          relativePath: currentParent,
        });
      }
    }

    manifestByPath.set(relativePath, {
      entryType: "file",
      relativePath,
      contentHash: createHash("sha256").update(syntheticFile.content).digest("hex"),
    });
  }

  return sortManifestEntries([...manifestByPath.values()]);
}

export function inspectReleaseSurface(rootPath, options = {}) {
  const manifest = [];
  const issues = [];

  function walk(currentPath, relativePath = "") {
    const entries = readdirSync(currentPath, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const nextRelativePath = normalizeReleasePath(
        relativePath ? `${relativePath}/${entry.name}` : entry.name
      );

      if (isIgnoredReleasePath(nextRelativePath)) {
        continue;
      }

      const absolutePath = path.join(currentPath, entry.name);
      const stats = lstatSync(absolutePath);

      if (stats.isSymbolicLink()) {
        issues.push(`release surface contains unsupported symlink ${nextRelativePath}`);
        continue;
      }

      if (stats.isDirectory()) {
        manifest.push({
          entryType: "directory",
          relativePath: nextRelativePath,
        });
        walk(absolutePath, nextRelativePath);
        continue;
      }

      if (!stats.isFile()) {
        issues.push(`release surface contains unsupported file type ${nextRelativePath}`);
        continue;
      }

      manifest.push({
        entryType: "file",
        relativePath: nextRelativePath,
        contentHash: createFileHash(absolutePath),
      });
    }
  }

  walk(rootPath);

  return {
    manifest: applySyntheticFiles(manifest, options.syntheticFiles),
    issues: [...issues].sort(),
  };
}

export function buildReleaseSurfaceManifest(rootPath, options = {}) {
  const report = inspectReleaseSurface(rootPath, options);
  if (report.issues.length > 0) {
    throw new Error(report.issues.join("\n"));
  }
  return report.manifest;
}

export function compareReleaseSurfaceManifests(sourceManifest, archiveManifest) {
  const issues = [];
  const sourceByPath = new Map(sourceManifest.map((entry) => [entry.relativePath, entry]));
  const archiveByPath = new Map(archiveManifest.map((entry) => [entry.relativePath, entry]));
  const missingPaths = [];
  const unexpectedPaths = [];

  for (const [relativePath, sourceEntry] of sourceByPath) {
    const archiveEntry = archiveByPath.get(relativePath);

    if (!archiveEntry) {
      missingPaths.push(relativePath);
      continue;
    }

    if (archiveEntry.entryType !== sourceEntry.entryType) {
      issues.push(`archive entry type does not match source for ${relativePath}`);
      continue;
    }

    if (sourceEntry.entryType === "file" && archiveEntry.contentHash !== sourceEntry.contentHash) {
      issues.push(`archive content hash does not match source for ${relativePath}`);
    }
  }

  for (const relativePath of archiveByPath.keys()) {
    if (!sourceByPath.has(relativePath)) {
      unexpectedPaths.push(relativePath);
    }
  }

  for (const relativePath of missingPaths.sort()) {
    issues.push(`archive is missing path ${relativePath}`);
  }

  for (const relativePath of unexpectedPaths.sort()) {
    issues.push(`archive contains unexpected path ${relativePath}`);
  }

  return issues;
}
