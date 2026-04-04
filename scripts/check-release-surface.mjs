import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectReleaseSurface } from "./lib/release-surface-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

if (args.length > 1) {
  console.error(`Unsupported arguments: ${args.join(", ")}`);
  process.exit(1);
}

const repoRoot = args[0] ? path.resolve(args[0]) : path.resolve(__dirname, "..");
const report = inspectReleaseSurface(repoRoot);

if (report.issues.length > 0) {
  for (const issue of report.issues) {
    console.error(issue);
  }
  process.exit(1);
}
