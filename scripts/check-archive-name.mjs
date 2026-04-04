import { validateArchiveName } from "./lib/archive-name.mjs";

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: node scripts/check-archive-name.mjs <archive-name>");
  process.exit(1);
}

try {
  process.stdout.write(`${validateArchiveName(args[0])}\n`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
