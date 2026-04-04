import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { resolveFromImportMetaUrl } from "./lib/import-meta-paths.mjs";

const repoRoot = resolveFromImportMetaUrl(import.meta.url, "..");
const skillsRoot = path.join(repoRoot, "skills");
const issues = [];

function parseYamlFile(absolutePath, relativePath) {
  const rubyScript = [
    "path = ARGV.fetch(0)",
    "data = YAML.safe_load(File.read(path), permitted_classes: [], aliases: false)",
    "puts JSON.generate(data)",
  ].join("\n");
  const result = spawnSync("ruby", ["-rjson", "-ryaml", "-e", rubyScript, absolutePath], {
    encoding: "utf8",
  });

  if (result.error) {
    issues.push(`ruby is required to validate ${relativePath}: ${result.error.message}`);
    return null;
  }

  if (result.status !== 0) {
    const errorText = result.stderr.trim() || result.stdout.trim() || "unknown YAML parse error";
    issues.push(`invalid YAML in ${relativePath}: ${errorText}`);
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    issues.push(`failed to decode parsed YAML for ${relativePath}: ${error.message}`);
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateNonEmptyString(value, issueMessage) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(issueMessage);
  }
}

for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "shared") {
    continue;
  }

  const skillDir = path.join(skillsRoot, entry.name);
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!existsSync(skillFile) || !statSync(skillFile).isFile()) {
    issues.push(`missing SKILL.md for ${entry.name}`);
    continue;
  }

  const content = readFileSync(skillFile, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    issues.push(`missing frontmatter in skills/${entry.name}/SKILL.md`);
    continue;
  }

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch) {
    issues.push(`missing name frontmatter in skills/${entry.name}/SKILL.md`);
  } else if (nameMatch[1].trim() !== entry.name) {
    issues.push(`frontmatter name mismatch for skills/${entry.name}/SKILL.md`);
  }

  if (!descriptionMatch || descriptionMatch[1].trim().length === 0) {
    issues.push(`missing description frontmatter in skills/${entry.name}/SKILL.md`);
  }

  const metadataFile = path.join(skillDir, "agents", "openai.yaml");
  const relativeMetadataFile = path.join("skills", entry.name, "agents", "openai.yaml");
  if (!existsSync(metadataFile) || !statSync(metadataFile).isFile()) {
    issues.push(`missing agents/openai.yaml for skills/${entry.name}`);
    continue;
  }

  const metadata = parseYamlFile(metadataFile, relativeMetadataFile);
  if (!metadata) {
    continue;
  }

  if (!isObject(metadata)) {
    issues.push(`${relativeMetadataFile} must parse to a mapping`);
    continue;
  }

  const misnestedInterfaceKeys = ["display_name", "short_description", "default_prompt"].filter((key) => key in metadata);
  if (!isObject(metadata.interface)) {
    if (misnestedInterfaceKeys.length > 0) {
      issues.push(
        `misnested interface keys at root level in ${relativeMetadataFile}: ${misnestedInterfaceKeys.join(", ")}`
      );
    } else {
      issues.push(`missing interface mapping in ${relativeMetadataFile}`);
    }
  } else {
    validateNonEmptyString(
      metadata.interface.display_name,
      `interface.display_name must be a non-empty string in ${relativeMetadataFile}`
    );
    validateNonEmptyString(
      metadata.interface.short_description,
      `interface.short_description must be a non-empty string in ${relativeMetadataFile}`
    );
    validateNonEmptyString(
      metadata.interface.default_prompt,
      `interface.default_prompt must be a non-empty string in ${relativeMetadataFile}`
    );
  }

  if (!isObject(metadata.policy)) {
    if ("allow_implicit_invocation" in metadata) {
      issues.push(`misnested policy key at root level in ${relativeMetadataFile}: allow_implicit_invocation`);
    } else {
      issues.push(`missing policy mapping in ${relativeMetadataFile}`);
    }
  } else if (typeof metadata.policy.allow_implicit_invocation !== "boolean") {
    issues.push(`policy.allow_implicit_invocation must be a boolean in ${relativeMetadataFile}`);
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}
