import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReleaseArchive } from "./lib/release-archive-verifier.mjs";

function parseArgs(argv) {
  const positional = [];
  let sourceRoot = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source-root") {
      sourceRoot = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  if (positional.length !== 1) {
    throw new Error("Usage: node scripts/verify-release-archive.mjs <archive-path> [--source-root <path>]");
  }

  if (argv.includes("--source-root") && !sourceRoot) {
    throw new Error("Missing value for --source-root");
  }

  return {
    archivePath: positional[0],
    sourceRoot,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultSourceRoot = path.resolve(__dirname, "..");

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const report = verifyReleaseArchive({
  archivePath: path.resolve(process.cwd(), args.archivePath),
  sourceRoot: path.resolve(process.cwd(), args.sourceRoot ?? defaultSourceRoot),
});

console.log(JSON.stringify(report, null, 2));

if (!report.pass) {
  process.exit(1);
}
