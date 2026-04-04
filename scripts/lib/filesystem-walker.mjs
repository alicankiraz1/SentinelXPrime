import { readdirSync } from "node:fs";
import path from "node:path";

export function walkFilesystem(rootPath, options = {}) {
  const {
    shouldSkip = () => false,
    visitDirectory = () => {},
    visitFile = () => {},
    sortEntries = true,
  } = options;

  function walk(currentPath, relativePath = "") {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    if (sortEntries) {
      entries.sort((left, right) => left.name.localeCompare(right.name));
    }

    for (const entry of entries) {
      const nextRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const absolutePath = path.join(currentPath, entry.name);

      if (shouldSkip({ absolutePath, relativePath: nextRelativePath, entry })) {
        continue;
      }

      if (entry.isDirectory()) {
        visitDirectory({ absolutePath, relativePath: nextRelativePath, entry });
        walk(absolutePath, nextRelativePath);
        continue;
      }

      visitFile({ absolutePath, relativePath: nextRelativePath, entry });
    }
  }

  walk(rootPath);
}
