import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceScript = path.join(repoRoot, "scripts", "check-skill-metadata.mjs");
const sourceHelper = path.join(repoRoot, "scripts", "lib", "import-meta-paths.mjs");

function createTempRepo() {
  return mkdtempSync(path.join(tmpdir(), "sentinelx-prime-skill-metadata-"));
}

function writeSkill(tempRepo, skillName) {
  const skillDir = path.join(tempRepo, "skills", skillName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    path.join(skillDir, "SKILL.md"),
    `---\nname: ${skillName}\ndescription: Example skill\n---\n\n# ${skillName}\n`,
    "utf8"
  );
  return skillDir;
}

function runValidator(tempRepo) {
  const scriptDir = path.join(tempRepo, "scripts");
  const libDir = path.join(scriptDir, "lib");
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(libDir, { recursive: true });
  cpSync(sourceScript, path.join(scriptDir, "check-skill-metadata.mjs"));
  cpSync(sourceHelper, path.join(libDir, "import-meta-paths.mjs"));
  return spawnSync("node", [path.join(scriptDir, "check-skill-metadata.mjs")], {
    cwd: tempRepo,
    encoding: "utf8",
  });
}

test("fails when a top-level skill is missing agents/openai.yaml", () => {
  const tempRepo = createTempRepo();
  writeSkill(tempRepo, "example-skill");

  const result = runValidator(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing agents\/openai\.yaml/i);
});

test("fails when openai.yaml omits required interface metadata fields", () => {
  const tempRepo = createTempRepo();
  const skillDir = writeSkill(tempRepo, "example-skill");

  mkdirSync(path.join(skillDir, "agents"), { recursive: true });
  writeFileSync(
    path.join(skillDir, "agents", "openai.yaml"),
    "interface:\n  display_name: \"Example\"\npolicy:\n  allow_implicit_invocation: false\n",
    "utf8"
  );

  const result = runValidator(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /short_description/i);
  assert.match(result.stderr, /default_prompt/i);
});

test("fails when interface is missing entirely", () => {
  const tempRepo = createTempRepo();
  const skillDir = writeSkill(tempRepo, "example-skill");

  mkdirSync(path.join(skillDir, "agents"), { recursive: true });
  writeFileSync(
    path.join(skillDir, "agents", "openai.yaml"),
    "policy:\n  allow_implicit_invocation: false\n",
    "utf8"
  );

  const result = runValidator(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /interface/i);
});

test("fails when policy is missing entirely", () => {
  const tempRepo = createTempRepo();
  const skillDir = writeSkill(tempRepo, "example-skill");

  mkdirSync(path.join(skillDir, "agents"), { recursive: true });
  writeFileSync(
    path.join(skillDir, "agents", "openai.yaml"),
    "interface:\n  display_name: Example\n  short_description: Example\n  default_prompt: Example\n",
    "utf8"
  );

  const result = runValidator(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /policy/i);
});

test("fails when required keys are present at the wrong level", () => {
  const tempRepo = createTempRepo();
  const skillDir = writeSkill(tempRepo, "example-skill");

  mkdirSync(path.join(skillDir, "agents"), { recursive: true });
  writeFileSync(
    path.join(skillDir, "agents", "openai.yaml"),
    [
      "display_name: Wrong Level",
      "short_description: Wrong Level",
      "default_prompt: Wrong Level",
      "policy:",
      "  allow_implicit_invocation: false",
      "",
    ].join("\n"),
    "utf8"
  );

  const result = runValidator(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /interface/i);
  assert.match(result.stderr, /wrong level|root level|misnested/i);
});

test("fails when allow_implicit_invocation is not a real boolean", () => {
  const tempRepo = createTempRepo();
  const skillDir = writeSkill(tempRepo, "example-skill");

  mkdirSync(path.join(skillDir, "agents"), { recursive: true });
  writeFileSync(
    path.join(skillDir, "agents", "openai.yaml"),
    [
      "interface:",
      "  display_name: Example",
      "  short_description: Example",
      "  default_prompt: Example",
      "policy:",
      "  allow_implicit_invocation: \"false\"",
      "",
    ].join("\n"),
    "utf8"
  );

  const result = runValidator(tempRepo);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /allow_implicit_invocation/i);
  assert.match(result.stderr, /boolean/i);
});

test("keeps shared exempt from the metadata contract", () => {
  const tempRepo = createTempRepo();
  const sharedDir = path.join(tempRepo, "skills", "shared");
  mkdirSync(sharedDir, { recursive: true });
  writeFileSync(path.join(sharedDir, "placeholder.md"), "# shared\n", "utf8");
  writeSkill(tempRepo, "example-skill");
  mkdirSync(path.join(tempRepo, "skills", "example-skill", "agents"), { recursive: true });
  writeFileSync(
    path.join(tempRepo, "skills", "example-skill", "agents", "openai.yaml"),
    [
      "interface:",
      "  display_name: Example",
      "  short_description: Example",
      "  default_prompt: Example",
      "policy:",
      "  allow_implicit_invocation: false",
      "",
    ].join("\n"),
    "utf8"
  );

  const result = runValidator(tempRepo);

  assert.equal(result.status, 0);
});
