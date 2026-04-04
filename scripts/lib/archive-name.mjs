const archiveNamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function findArchiveNameIssues(archiveName) {
  const issues = [];

  if (typeof archiveName !== "string" || archiveName.length === 0) {
    return ["archive name must be a non-empty string"];
  }

  if (archiveName.includes("/") || archiveName.includes("\\")) {
    issues.push("archive name must not contain path separators");
  }

  if (archiveName.includes("..")) {
    issues.push("archive name must not contain '..'");
  }

  if (archiveName.startsWith(".")) {
    issues.push("archive name must not start with '.'");
  }

  if (archiveName.startsWith("-")) {
    issues.push("archive name must not start with '-'");
  }

  if (!archiveNamePattern.test(archiveName)) {
    issues.push("archive name must match ^[A-Za-z0-9][A-Za-z0-9._-]*$");
  }

  return [...new Set(issues)];
}

export function validateArchiveName(archiveName) {
  const issues = findArchiveNameIssues(archiveName);

  if (issues.length > 0) {
    throw new Error(`invalid archive name "${archiveName}": ${issues.join("; ")}`);
  }

  return archiveName;
}
