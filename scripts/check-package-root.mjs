import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzePackageRootEntries,
  loadPackageRootEntries,
} from "./lib/package-root-guard.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length > 1) {
  console.error(`Unsupported arguments: ${args.join(", ")}`);
  process.exit(1);
}

const repoRoot = args[0] ? path.resolve(args[0]) : path.resolve(__dirname, "..");
const issues = analyzePackageRootEntries(loadPackageRootEntries(repoRoot));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(issue);
  }
  process.exit(1);
}
