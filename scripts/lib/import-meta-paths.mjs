import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveFromImportMetaUrl(importMetaUrl, ...relativeSegments) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), ...relativeSegments);
}
