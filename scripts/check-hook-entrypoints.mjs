import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { resolveFromImportMetaUrl } from "./lib/import-meta-paths.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..");
const hooksConfigPath = path.join(repoRoot, "hooks", "hooks.json");
const config = JSON.parse(readFileSync(hooksConfigPath, "utf8"));
const issues = [];
const commandHooks = [];

for (const hookGroup of Object.values(config.hooks ?? {})) {
  for (const matcherEntry of hookGroup ?? []) {
    for (const hook of matcherEntry.hooks ?? []) {
      if (hook?.type === "command" && typeof hook.command === "string") {
        commandHooks.push(hook.command);
      }
    }
  }
}

for (const command of commandHooks) {
  const match = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+)/);
  if (!match) {
    issues.push(`unable to resolve hook entrypoint from command: ${command}`);
    continue;
  }

  const relativePath = match[1];
  const entrypointPath = path.join(repoRoot, relativePath);

  if (!existsSync(entrypointPath)) {
    issues.push(`declared hook entrypoint is missing: ${relativePath}`);
    continue;
  }

  if (process.platform !== "win32" && (statSync(entrypointPath).mode & 0o111) === 0) {
    issues.push(`declared hook entrypoint is not executable on POSIX: ${relativePath}`);
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
