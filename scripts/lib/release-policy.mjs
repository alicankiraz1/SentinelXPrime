export const releaseManifestRelativePath = "evals/release-manifest.json";

export const releaseIgnoredPathPrefixes = [
  ".git",
  ".superpowers",
  ".worktrees",
  "worktrees",
  "dist",
  "evals/artifacts",
  "docs/plans",
  "docs/specs",
  "__MACOSX",
];

export const releasePackagingExcludePatterns = [
  ...releaseIgnoredPathPrefixes,
  "._*",
  ".DS_Store",
];

export const packageRootIgnoredTopLevelDirectories = new Set([
  "node_modules",
]);

export function normalizeReleasePath(relativePath) {
  return relativePath
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/$/, "");
}

export function isAppleMetadataPath(relativePath) {
  const normalizedPath = normalizeReleasePath(relativePath);
  const segments = normalizedPath.split("/").filter(Boolean);
  const basename = segments[segments.length - 1] ?? "";

  return basename === ".DS_Store" || basename.startsWith("._") || segments.includes("__MACOSX");
}

export function isIgnoredReleasePath(relativePath) {
  const normalizedPath = normalizeReleasePath(relativePath);
  if (!normalizedPath) {
    return false;
  }

  if (isAppleMetadataPath(normalizedPath)) {
    return true;
  }

  return releaseIgnoredPathPrefixes.some((prefix) => (
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  ));
}

export function shouldIgnorePackageRootPath(relativePath) {
  const normalizedPath = normalizeReleasePath(relativePath);
  if (!normalizedPath) {
    return false;
  }

  const [topLevelSegment] = normalizedPath.split("/");
  return packageRootIgnoredTopLevelDirectories.has(topLevelSegment) || isIgnoredReleasePath(normalizedPath);
}
