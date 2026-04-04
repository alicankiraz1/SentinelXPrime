import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..", "..");
export const artifactsRoot = path.join(repoRoot, "evals", "artifacts");
export const publicArtifactsRoot = path.join("evals", "artifacts");
export const DEFAULT_TIMEOUT_MS = 90000;
export const caseTimeoutMs = Number.parseInt(
  process.env.SENTINELX_PRIME_EVAL_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS),
  10
);
