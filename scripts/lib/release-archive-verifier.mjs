import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  createReleaseManifestMetadata,
  serializeReleaseManifest,
} from "../../evals/lib/release-manifest.mjs";
import {
  compareReleaseSurfaceManifests,
  inspectReleaseSurface,
} from "./release-surface-manifest.mjs";
import {
  isIgnoredReleasePath,
  normalizeReleasePath,
  releaseManifestRelativePath,
} from "./release-policy.mjs";

function normalizeArchiveEntry(entry) {
  return normalizeReleasePath(entry).replace(/^\.\/+/, "");
}

export function analyzeArchiveEntries(entries) {
  const normalizedEntries = entries.map(normalizeArchiveEntry).filter(Boolean);
  const rootDirNames = [...new Set(normalizedEntries.map((entry) => entry.split("/")[0]).filter(Boolean))];

  if (rootDirNames.length !== 1) {
    const finderMetadataPresent = rootDirNames.includes("__MACOSX") || normalizedEntries.some((entry) => entry.includes("/._") || entry.startsWith("._"));
    const issue = [
      "archive must contain exactly one top-level root directory",
      `found: ${rootDirNames.sort().join(", ") || "(none)"}`,
      finderMetadataPresent ? "Apple metadata entries are present" : null,
    ]
      .filter(Boolean)
      .join("; ");

    return {
      rootDirName: null,
      forbiddenEntries: [],
      issues: [issue],
    };
  }

  const rootDirName = rootDirNames[0];
  const forbiddenEntries = [];

  for (const entry of normalizedEntries) {
    if (entry === rootDirName || entry === `${rootDirName}/`) {
      continue;
    }

    const relativePath = entry.startsWith(`${rootDirName}/`) ? entry.slice(rootDirName.length + 1) : entry;
    if (!relativePath) {
      continue;
    }

    if (isIgnoredReleasePath(relativePath)) {
      forbiddenEntries.push(entry);
    }
  }

  return {
    rootDirName,
    forbiddenEntries: [...new Set(forbiddenEntries)].sort(),
    issues: [],
  };
}

export function compareManifestMetadata(sourceManifest, archiveManifest) {
  const issues = [];

  if (archiveManifest.total_available_cases !== sourceManifest.total_available_cases) {
    issues.push("archive total_available_cases does not match source manifest length");
  }

  if (archiveManifest.case_manifest_fingerprint !== sourceManifest.case_manifest_fingerprint) {
    issues.push("archive case_manifest_fingerprint does not match source manifest fingerprint");
  }

  if (archiveManifest.runner_source_fingerprint !== sourceManifest.runner_source_fingerprint) {
    issues.push("archive runner_source_fingerprint does not match source runner fingerprint");
  }

  const sameCaseOrder =
    Array.isArray(sourceManifest.case_ids)
    && Array.isArray(archiveManifest.case_ids)
    && sourceManifest.case_ids.length === archiveManifest.case_ids.length
    && sourceManifest.case_ids.every((caseId, index) => archiveManifest.case_ids[index] === caseId);

  if (!sameCaseOrder) {
    issues.push("archive case_ids do not exactly match source manifest order");
  }

  return issues;
}

function runCommand(command, args, cwd = undefined) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }

  return result.stdout;
}

function formatSurfaceIssues(prefix, surfaceIssues) {
  return surfaceIssues.map((issue) => `${prefix} ${issue}`);
}

function loadArchiveReleaseManifest(extractedRoot) {
  const manifestPath = path.join(extractedRoot, releaseManifestRelativePath);

  if (!existsSync(manifestPath)) {
    return {
      manifestMetadata: null,
      issues: [`archive is missing ${releaseManifestRelativePath}`],
    };
  }

  try {
    return {
      manifestMetadata: JSON.parse(readFileSync(manifestPath, "utf8")),
      issues: [],
    };
  } catch (error) {
    return {
      manifestMetadata: null,
      issues: [`archive release manifest is not valid JSON: ${error.message}`],
    };
  }
}

export function listArchiveEntries(archivePath) {
  return runCommand("unzip", ["-Z1", archivePath])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function verifyReleaseArchive({ archivePath, sourceRoot }) {
  const entries = listArchiveEntries(archivePath);
  const entryReport = analyzeArchiveEntries(entries);
  const issues = [...entryReport.issues];
  const surfaceIssues = [];
  const sourceManifest = createReleaseManifestMetadata(sourceRoot);
  let archiveManifest = null;

  if (entryReport.forbiddenEntries.length > 0) {
    issues.push("archive contains forbidden entries");
  }

  if (!entryReport.rootDirName) {
    return {
      pass: false,
      rootDirName: null,
      forbiddenEntries: entryReport.forbiddenEntries,
      issues,
      surfaceIssues,
      sourceManifest,
      archiveManifest,
    };
  }

  const extractRoot = mkdtempSync(path.join(tmpdir(), "sentinelx-prime-archive-"));

  try {
    runCommand("unzip", ["-q", archivePath, "-d", extractRoot]);
    const extractedRoot = path.join(extractRoot, entryReport.rootDirName);

    if (!existsSync(extractedRoot)) {
      issues.push(`archive root ${entryReport.rootDirName} was not extracted`);
    } else {
      const archiveManifestResult = loadArchiveReleaseManifest(extractedRoot);
      archiveManifest = archiveManifestResult.manifestMetadata;
      issues.push(...archiveManifestResult.issues);

      const sourceSurface = inspectReleaseSurface(sourceRoot, {
        syntheticFiles: [
          {
            relativePath: releaseManifestRelativePath,
            content: serializeReleaseManifest(sourceRoot),
          },
        ],
      });
      const archiveSurface = inspectReleaseSurface(extractedRoot);

      surfaceIssues.push(...formatSurfaceIssues("source", sourceSurface.issues));
      surfaceIssues.push(...formatSurfaceIssues("archive", archiveSurface.issues));

      if (archiveManifest) {
        issues.push(...compareManifestMetadata(sourceManifest, archiveManifest));
      }

      if (sourceSurface.issues.length === 0 && archiveSurface.issues.length === 0) {
        surfaceIssues.push(
          ...compareReleaseSurfaceManifests(
            sourceSurface.manifest,
            archiveSurface.manifest
          )
        );
      }

      issues.push(...surfaceIssues);
    }
  } finally {
    rmSync(extractRoot, { recursive: true, force: true });
  }

  return {
    pass: issues.length === 0,
    rootDirName: entryReport.rootDirName,
    forbiddenEntries: entryReport.forbiddenEntries,
    issues,
    surfaceIssues,
    sourceManifest,
    archiveManifest,
  };
}
