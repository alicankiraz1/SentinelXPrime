import { createManifestMetadata } from "./release-contract.mjs";
import { cases, releaseManifestBaselineTimeoutMs } from "./case-catalog.mjs";

export function createReleaseManifestMetadata(repoRoot) {
  return createManifestMetadata(cases, releaseManifestBaselineTimeoutMs, repoRoot);
}

export function serializeReleaseManifest(repoRoot) {
  return `${JSON.stringify(createReleaseManifestMetadata(repoRoot), null, 2)}\n`;
}
