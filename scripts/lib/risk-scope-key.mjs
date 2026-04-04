import crypto from "node:crypto";
import path from "node:path";

function normalizePortablePath(inputPath) {
  const portablePath = inputPath.replace(/\\/g, "/");
  const normalizedPath = path.posix.normalize(portablePath);
  return normalizedPath.replace(/^(\.\/)+/, "").replace(/^\/+/, "");
}

function normalizeRiskyPaths(riskyPaths) {
  return [...new Set(
    riskyPaths
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map(normalizePortablePath)
      .filter((entry) => entry.length > 0)
  )].sort();
}

function normalizeLines(lines) {
  return [...new Set(
    lines
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  )].sort();
}

export function createRiskScopePayload({
  riskyPaths = [],
  diffSummaryHeaders = [],
  mode = "current-source",
  trustBoundarySummary = "",
} = {}) {
  const normalizedMode = mode === "diff" ? "diff" : mode === "description" ? "description" : "current-source";
  const normalizedPaths = normalizeRiskyPaths(riskyPaths);
  const normalizedHeaders = normalizedMode === "diff" ? normalizeLines(diffSummaryHeaders) : [];
  const normalizedTrustBoundarySummary = trustBoundarySummary.trim();
  const segments = [
    `mode=${normalizedMode}`,
    `paths=${normalizedPaths.join(",")}`,
  ];

  if (normalizedHeaders.length > 0) {
    segments.push(`diff=${normalizedHeaders.join(" | ")}`);
  }

  if (normalizedTrustBoundarySummary.length > 0) {
    segments.push(`trust=${normalizedTrustBoundarySummary}`);
  }

  return segments.join("\n");
}

export function createRiskScopeKey({
  primaryRiskDomain,
  riskyPaths = [],
  diffSummaryHeaders = [],
  mode = "current-source",
  trustBoundarySummary = "",
} = {}) {
  const normalizedDomain = String(primaryRiskDomain ?? "").trim();
  if (normalizedDomain.length === 0) {
    throw new Error("primaryRiskDomain is required");
  }

  const payload = createRiskScopePayload({
    riskyPaths,
    diffSummaryHeaders,
    mode,
    trustBoundarySummary,
  });
  const fingerprint = crypto.createHash("sha256").update(payload, "utf8").digest("hex");

  return `${normalizedDomain}:v1:${fingerprint}`;
}
