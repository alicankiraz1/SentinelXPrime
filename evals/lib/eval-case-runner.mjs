import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { evaluateCheck } from "./check-oracles.mjs";
import {
  caseTimeoutMs,
  repoRoot,
} from "./eval-constants.mjs";
import {
  cases,
  knownSecretLiterals,
  redactionMarker,
  traceSanitizerVersion,
  trackedFixtureSigningKeyLiteral,
  untrackedSecretLiteral,
} from "./case-catalog.mjs";
import { toPublicArtifactPath } from "./eval-artifacts.mjs";

function normalizeText(text) {
  return text.toLowerCase();
}

function normalizeCaseTurns(testCase) {
  if (Array.isArray(testCase.turns) && testCase.turns.length > 0) {
    return testCase.turns.map((turn) => (typeof turn === "string" ? { prompt: turn } : turn));
  }

  return [{ prompt: testCase.prompt }];
}

function toPortablePath(text) {
  if (!text) {
    return "";
  }

  return text.replace(/\\/g, "/");
}

function joinTextChunks(chunks) {
  return chunks
    .filter((chunk) => typeof chunk === "string" && chunk.length > 0)
    .map((chunk) => (chunk.endsWith("\n") ? chunk : `${chunk}\n`))
    .join("");
}

function containsPortablePathPrefix(source, targetPath) {
  const normalizedSource = toPortablePath(source);
  const normalizedTarget = toPortablePath(targetPath).replace(/\/+$/, "");
  return normalizedSource === normalizedTarget || normalizedSource.includes(`${normalizedTarget}/`) || normalizedSource.includes(`${normalizedTarget}"`);
}

function normalizeRuntimePathLabel(workspacePath, absolutePath) {
  const relative = path.relative(workspacePath, absolutePath);
  if (relative === "") {
    return path.join("runtime", "workspace");
  }

  return path.join("runtime", "workspace", relative);
}

function expandRuntimePathVariants(targetPath) {
  const portableTargetPath = toPortablePath(targetPath);
  const variants = new Set([portableTargetPath]);

  if (portableTargetPath.startsWith("/var/")) {
    variants.add(`/private${portableTargetPath}`);
  }

  if (portableTargetPath.startsWith("/private/var/")) {
    variants.add(portableTargetPath.replace(/^\/private/, ""));
  }

  return [...variants].sort((left, right) => right.length - left.length);
}

function sanitizeRuntimeReferences(text, runtimeRoot, runtimeWorkspace, runtimeSkillsDir) {
  if (!text) {
    return text;
  }

  const replacements = [
    { targets: expandRuntimePathVariants(runtimeSkillsDir), replacement: "runtime/workspace/.agents/skills" },
    { targets: expandRuntimePathVariants(runtimeWorkspace), replacement: "runtime/workspace" },
    { targets: expandRuntimePathVariants(runtimeRoot), replacement: "runtime-root" },
  ]
    .flatMap((entry) => entry.targets.map((target) => ({ target, replacement: entry.replacement })))
    .sort((left, right) => right.target.length - left.target.length);

  let sanitized = text;

  for (const entry of replacements) {
    sanitized = sanitized.split(entry.target).join(entry.replacement);
  }

  return sanitized
    .replace(/\/privateruntime\/workspace/g, "runtime/workspace")
    .replace(/\/privateruntime-root\b/g, "runtime-root");
}

function isRepoScopedSkillTrace(traceText, runtimeSkillsDir) {
  const normalizedTraceText = toPortablePath(traceText);
  const portableRuntimeSkillsRoot = toPortablePath(runtimeSkillsDir).replace(/\/+$/, "");
  const portableRelativeRoots = [
    toPortablePath(".agents/skills"),
    toPortablePath(".codex/skills"),
  ];

  return (
    normalizedTraceText.includes(`${portableRuntimeSkillsRoot}/`) ||
    normalizedTraceText.includes(`${portableRuntimeSkillsRoot}"`) ||
    portableRelativeRoots.some((root) =>
      normalizedTraceText.includes(`${root}/`) ||
      normalizedTraceText.includes(`${root}"`) ||
      normalizedTraceText.includes(`./${root}/`) ||
      normalizedTraceText.includes(`../${root}/`) ||
      normalizedTraceText.includes(`../../${root}/`)
    )
  );
}

function isLegacyUserSkillTrace(traceText, hostHome, hostCodexHome) {
  const legacyRoots = [
    path.join(hostHome ?? "", ".codex", "skills"),
    path.join(hostHome ?? "", ".agents", "skills"),
    path.join(hostCodexHome ?? "", "skills"),
  ];

  return legacyRoots.some((root) => {
    const normalizedRoot = toPortablePath(root).replace(/\/+$/, "");
    if (!normalizedRoot) {
      return false;
    }
    return toPortablePath(traceText).includes(`${normalizedRoot}/`) || toPortablePath(traceText).includes(`${normalizedRoot}"`);
  });
}

function hasAnySkillPathEvidence(parsedTrace, runtimeSkillsDir) {
  const text = `${parsedTrace.commands.join("\n")}\n${parsedTrace.commandEvents.join("\n")}`;
  const portableRuntimeSkills = toPortablePath(path.join(runtimeSkillsDir, "sentinelx-prime"));
  return (
    isRepoScopedSkillTrace(text, runtimeSkillsDir) ||
    isLegacyUserSkillTrace(text, process.env.HOME, process.env.CODEX_HOME) ||
    (toPortablePath(text).includes(".agents/skills/") && !toPortablePath(text).includes(portableRuntimeSkills)) ||
    toPortablePath(text).includes(".codex/skills/") ||
    toPortablePath(text).includes(".codex/superpowers/")
  );
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripGitTempNoise(text) {
  return text
    .split("\n")
    .filter((line) =>
      !/^git: warning: confstr\(\) failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using \/tmp instead$/.test(line) &&
      !/^git: error: couldn't create cache file '\/tmp\/xcrun_db-[^']+' \(errno=Operation not permitted\)$/.test(line)
    )
    .join("\n");
}

export function sanitizeString(text) {
  if (!text) {
    return text;
  }

  let sanitized = stripGitTempNoise(text);

  for (const literal of knownSecretLiterals) {
    sanitized = sanitized.replace(new RegExp(escapeRegExp(literal), "g"), redactionMarker);
  }

  sanitized = sanitized.replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, redactionMarker);
  sanitized = sanitized.replace(
    /((?:["']?[A-Za-z0-9_.-]*(?:password|secret|api[_-]?key|authorization|signing[_-]?key|private[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|jwt[_-]?secret)[A-Za-z0-9_.-]*["']?\s*(?::|(?<![=!<>])=(?!=))\s*["']?))([^"'\s,\]}]+)/gi,
    (_match, prefix) => `${prefix}${redactionMarker}`
  );
  sanitized = sanitized.replace(
    /(["'])(?=[A-Za-z0-9._~+/-]{24,}\1)(?=[^"'\n]*[0-9_-])([A-Za-z0-9._~+/-]{24,})\1/g,
    `$1${redactionMarker}$1`
  );
  sanitized = sanitized.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*\b/g, `$1 ${redactionMarker}`);

  return sanitized;
}

function sanitizeJsonValue(value) {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeJsonValue(nestedValue)])
    );
  }

  return value;
}

function sanitizeTraceText(traceText) {
  return traceText
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return JSON.stringify(sanitizeJsonValue(JSON.parse(line)));
      } catch {
        return JSON.stringify({
          type: "sanitized_trace_line",
          note: `${redactionMarker} UNPARSEABLE TRACE LINE`,
        });
      }
    })
    .join("\n")
    .concat(traceText.endsWith("\n") ? "\n" : "");
}

function runCommand(command, args, cwd) {
  const res = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });

  if (res.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${res.stderr || res.stdout || "unknown error"}`);
  }
}

function initializeRuntimeRepo(runtimeWorkspace) {
  runCommand("git", ["init", "-q"], runtimeWorkspace);
  runCommand("git", ["config", "user.name", "SentinelXPrime Eval"], runtimeWorkspace);
  runCommand("git", ["config", "user.email", "eval@sentinelx-prime.local"], runtimeWorkspace);
  mkdirSync(path.join(runtimeWorkspace, ".git", "info"), { recursive: true });
  writeFileSync(path.join(runtimeWorkspace, ".git", "info", "exclude"), ".agents/\n", "utf8");
  runCommand("git", ["add", "."], runtimeWorkspace);
  runCommand("git", ["commit", "-q", "-m", "fixture baseline"], runtimeWorkspace);
}

function replaceInFile(filePath, transforms) {
  let text = readFileSync(filePath, "utf8");
  const original = text;

  for (const [searchValue, replaceValue] of transforms) {
    text = text.replace(searchValue, replaceValue);
  }

  if (text === original) {
    throw new Error(`No changes applied to ${filePath}`);
  }

  writeFileSync(filePath, text, "utf8");
}

function applyCaseSetup(testCase, runtimeWorkspace) {
  if (testCase.setupMode === "tracked-auth-change") {
    replaceInFile(path.join(runtimeWorkspace, "src", "AuthMiddleware.cs"), [
      ["ValidateAudience = true,", "ValidateAudience = false,"],
      ["ValidateLifetime = true,", "ValidateLifetime = false,"],
    ]);
    return;
  }

  if (testCase.setupMode === "untracked-auth-file") {
    writeFileSync(
      path.join(runtimeWorkspace, "src", "ApiKeyMiddleware.cs"),
      `using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace LifecycleAspNet.Auth;

public sealed class ApiKeyMiddleware
{
    private const string AdminApiKey = "${untrackedSecretLiteral}";
    private readonly RequestDelegate _next;

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Api-Key", out var apiKey) && apiKey == AdminApiKey)
        {
            await _next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }
}
`,
      "utf8"
    );
    return;
  }

  if (testCase.setupMode === "context-budget-risky-files") {
    const budgetDir = path.join(runtimeWorkspace, "src", "Budget");
    mkdirSync(budgetDir, { recursive: true });

    for (let index = 1; index <= 12; index += 1) {
      const suffix = String(index).padStart(2, "0");
      const fillerMembers = Array.from({ length: 220 }, (_unused, memberIndex) => {
        const memberSuffix = String(memberIndex + 1).padStart(3, "0");
        return `    public string BudgetScope${memberSuffix} => "auth-budget-${suffix}-${memberSuffix}";`;
      }).join("\n");
      writeFileSync(
        path.join(budgetDir, `AuthBudget${suffix}.cs`),
        `using Microsoft.IdentityModel.Tokens;

namespace LifecycleAspNet.Budget;

public sealed class AuthBudget${suffix}
{
${fillerMembers}

    public TokenValidationParameters Build()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true
        };
    }
}
`,
        "utf8"
      );
    }

    return;
  }

  if (testCase.setupMode === "nested-scope-tracked-changes") {
    replaceInFile(path.join(runtimeWorkspace, "services", "api", "auth", "AuthHandler.cs"), [
      ["ValidateAudience = true,", "ValidateAudience = false,"],
      ["ValidateLifetime = true,", "ValidateLifetime = false,"],
    ]);
  }
}

function getLastAgentMessage(traceText) {
  let lastAgentMessage = "";

  for (const line of traceText.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    try {
      const event = JSON.parse(line);

      if (event.type === "item.completed" && event.item?.type === "agent_message" && typeof event.item.text === "string") {
        lastAgentMessage = event.item.text;
      }
    } catch {
      continue;
    }
  }

  return lastAgentMessage;
}

function joinSourceParts(parts) {
  return parts.filter((part) => typeof part === "string" && part.length > 0).join("\n");
}

function parseTraceArtifacts(traceText) {
  const events = [];
  const commands = [];
  const commandEvents = [];
  const messages = [];
  const parseWarnings = [];

  for (const line of traceText.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    try {
      const event = JSON.parse(line);
      events.push(event);

      const item = event.item;
      if (event.type === "item.completed" && item?.type === "command_execution") {
        const command = typeof item.command === "string" ? item.command : "";
        const aggregatedOutput = typeof item.aggregated_output === "string" ? item.aggregated_output : "";

        if (command) {
          commands.push(command);
        }

        commandEvents.push(joinSourceParts([command, aggregatedOutput]));
      }

      if (event.type === "item.completed" && item?.type === "agent_message" && typeof item.text === "string") {
        messages.push(item.text);
      }
    } catch {
      parseWarnings.push("unparseable sanitized trace line");
    }
  }

  return {
    events,
    commands,
    commandEvents,
    messages,
    parseWarnings,
    traceText,
  };
}

function buildCheckSources(lastMessage, stderrText, parsedTrace, turnMessages) {
  return {
    message: lastMessage,
    messages: joinSourceParts(parsedTrace.messages),
    commands: joinSourceParts(parsedTrace.commands),
    command_events: joinSourceParts(parsedTrace.commandEvents),
    turn_messages: joinSourceParts(turnMessages),
    turn_messages_list: turnMessages,
    trace: parsedTrace.traceText,
    stderr: stderrText,
  };
}

function collectUnexpectedExternalInstructionPaths(parsedTrace, runtimeWorkspace, hostHome, hostCodexHome) {
  const blockedPrefixes = new Set();

  if (hostHome) {
    blockedPrefixes.add(path.join(hostHome, ".codex", "superpowers") + path.sep);
    blockedPrefixes.add(path.join(hostHome, ".codex", "skills") + path.sep);
    blockedPrefixes.add(path.join(hostHome, ".codex", "AGENTS.md"));
    blockedPrefixes.add(path.join(hostHome, ".codex", "AGENTS.override.md"));
    blockedPrefixes.add(path.join(hostHome, ".agents", "skills") + path.sep);
    blockedPrefixes.add(path.join(hostHome, ".agents", "AGENTS.md"));
    blockedPrefixes.add(path.join(hostHome, ".agents", "AGENTS.override.md"));
  }

  if (hostCodexHome) {
    blockedPrefixes.add(path.join(hostCodexHome, "superpowers") + path.sep);
    blockedPrefixes.add(path.join(hostCodexHome, "skills") + path.sep);
    blockedPrefixes.add(path.join(hostCodexHome, "AGENTS.md"));
    blockedPrefixes.add(path.join(hostCodexHome, "AGENTS.override.md"));
  }

  const matches = new Set();
  const candidateTexts = [...parsedTrace.commands, ...parsedTrace.commandEvents];
  const portableRuntimeSkills = toPortablePath(path.join(runtimeWorkspace, ".agents", "skills"));
  const portableRuntimeWorkspace = toPortablePath(runtimeWorkspace);
  const portableRelativeRepoSkills = [".agents/skills/", "./.agents/skills/", "../.agents/skills/", "../../.agents/skills/"];
  const portableRelativeRuntimeSkills = [".codex/skills/", "./.codex/skills/", "../.codex/skills/", "../../.codex/skills/"];
  const hasRuntimeWorkspace = Boolean(runtimeWorkspace);
  const isRuntimeRelativeRepoSkillPath = (commandText) =>
    portableRelativeRepoSkills.some((prefix) => commandText.includes(prefix)) ||
    portableRelativeRuntimeSkills.some((prefix) => commandText.includes(prefix));

  for (const commandText of candidateTexts) {
    const portableCommandText = toPortablePath(commandText);

    for (const prefix of blockedPrefixes) {
      if (!prefix) {
        continue;
      }

      const portablePrefix = toPortablePath(prefix);

      if (portableCommandText.includes(portablePrefix) && (!hasRuntimeWorkspace || !portableCommandText.includes(portableRuntimeSkills))) {
        matches.add(prefix);
      }
    }

    if (
      (portableCommandText.includes(".agents/skills/") || portableCommandText.includes(".codex/skills/")) &&
      !portableCommandText.includes(portableRuntimeSkills) &&
      !portableCommandText.includes(portableRuntimeWorkspace) &&
      !isRuntimeRelativeRepoSkillPath(portableCommandText)
    ) {
      if (!hasRuntimeWorkspace || !portableCommandText.includes(`${portableRuntimeWorkspace}/.agents/skills/`)) {
        matches.add("repo-local skill directory outside runtime scope");
      }
    }
  }

  return [...matches].sort();
}

function shouldRetryCase(result, attemptNumber) {
  if (attemptNumber >= 2) {
    return false;
  }

  const failedChecks = result.case_checks.filter((item) => !item.pass).map((item) => item.id);

  return (
    result.exit_code === 0 &&
    !result.timed_out &&
    result.matched_phrase !== null &&
    !result.legacy_user_skill_trace_hit &&
    failedChecks.length === 1 &&
    failedChecks[0] === "repo_skill_trace"
  );
}

function buildCaseEnvironment(testCase, runtimeRoot, codexHome) {
  const runtimeTmpDir = path.join(runtimeRoot, "tmp");
  const xdgConfigHome = path.join(runtimeRoot, "xdg-config");
  const xdgCacheHome = path.join(runtimeRoot, "xdg-cache");
  mkdirSync(runtimeTmpDir, { recursive: true });
  mkdirSync(xdgConfigHome, { recursive: true });
  mkdirSync(xdgCacheHome, { recursive: true });

  const env = {
    PATH: process.env.PATH ?? "",
    HOME: runtimeRoot,
    CODEX_HOME: codexHome,
    XDG_CONFIG_HOME: xdgConfigHome,
    XDG_CACHE_HOME: xdgCacheHome,
    TMPDIR: runtimeTmpDir,
    TMP: runtimeTmpDir,
    TEMP: runtimeTmpDir,
    LANG: process.env.LANG ?? "en_US.UTF-8",
  };

  for (const key of [
    "LC_ALL",
    "LC_CTYPE",
    "TERM",
    "COLORTERM",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_ORG_ID",
    "OPENAI_PROJECT_ID",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "SSL_CERT_FILE",
    "SSL_CERT_DIR",
  ]) {
    if (process.env[key]) {
      env[key] = process.env[key];
    }
  }

  if (testCase.envMode === "git-unavailable") {
    const fakeBinDir = path.join(runtimeRoot, "fake-bin");
    const fakeGitPath = path.join(fakeBinDir, "git");
    mkdirSync(fakeBinDir, { recursive: true });
    writeFileSync(fakeGitPath, "#!/bin/sh\necho 'sentinelx-prime-eval: git unavailable' >&2\nexit 127\n", "utf8");
    chmodSync(fakeGitPath, 0o755);
    env.PATH = `${fakeBinDir}:${process.env.PATH ?? ""}`;
  }

  return env;
}

function buildFailureResult({
  artifactRoot,
  testCase,
  attemptNumber,
  workingDirectory,
  runtimeWorkspace,
  messagePath,
  tracePath,
  stderrPath,
  resultPath,
  error,
}) {
  const failNote = `Case execution failed: ${error instanceof Error ? error.message : String(error)}`;
  const runtimeWorkspaceLabel = normalizeRuntimePathLabel(runtimeWorkspace, runtimeWorkspace);
  const runtimeWorkingDirectoryLabel = normalizeRuntimePathLabel(runtimeWorkspace, workingDirectory);

  writeFileSync(tracePath, "", "utf8");
  writeFileSync(messagePath, "", "utf8");
  writeFileSync(stderrPath, `${sanitizeString(failNote)}\n`, "utf8");

  const result = {
    id: testCase.id,
    attempt: attemptNumber,
    pass: false,
    workspace: testCase.workingSubdir ?? ".",
    fixture_root: testCase.fixtureRoot,
    runtime_workspace: runtimeWorkspaceLabel,
    runtime_working_directory: runtimeWorkingDirectoryLabel,
    exit_code: 1,
    timed_out: false,
    repo_skill_trace_hit: false,
    skill_path_evidence_observed: false,
    legacy_user_skill_trace_hit: false,
    unexpected_external_instruction_paths: [],
    expected_any: testCase.expectedAny,
    matched_phrase: null,
    case_checks: [],
    artifacts_sanitized: true,
    trace_sanitizer_version: traceSanitizerVersion,
    message_path: toPublicArtifactPath(messagePath, artifactRoot),
    trace_path: toPublicArtifactPath(tracePath, artifactRoot),
    stderr_path: toPublicArtifactPath(stderrPath, artifactRoot),
    notes: failNote,
  };

  writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  return result;
}

function runCaseAttempt(testCase, artifactRoot, caseArtifactsDir, attemptNumber) {
  const attemptDir = path.join(caseArtifactsDir, `attempt-${attemptNumber}`);
  const runtimeRoot = mkdtempSync(path.join(tmpdir(), `sentinelx-prime-${testCase.id}-`));
  const runtimeWorkspace = path.join(runtimeRoot, "workspace");
  const runtimeSkillsDir = path.join(runtimeWorkspace, ".agents", "skills");
  const codexHome = path.join(runtimeRoot, "codex-home");
  const sourceCodexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME ?? "", ".codex");
  const sourceAuthPath = path.join(sourceCodexHome, "auth.json");
  const tracePath = path.join(attemptDir, "trace.jsonl");
  const messagePath = path.join(attemptDir, "last-message.txt");
  const stderrPath = path.join(attemptDir, "stderr.txt");
  const resultPath = path.join(attemptDir, "result.json");
  const rawMessagePath = path.join(runtimeRoot, "last-message.txt");
  const fixtureRoot = path.join(repoRoot, testCase.fixtureRoot);
  const workingDirectory = path.resolve(runtimeWorkspace, testCase.workingSubdir ?? ".");
  const timeoutMs = testCase.timeoutMs ?? caseTimeoutMs;
  const hostHome = process.env.HOME ?? "";
  const hostCodexHome = process.env.CODEX_HOME ?? path.join(hostHome, ".codex");
  const sourceCaseEnvironment = buildCaseEnvironment(testCase, runtimeRoot, codexHome);
  const runtimeWorkspaceLabel = normalizeRuntimePathLabel(runtimeWorkspace, runtimeWorkspace);
  const runtimeWorkingDirectoryLabel = normalizeRuntimePathLabel(runtimeWorkspace, workingDirectory);
  const requireRepoSkillTraceEvidence = testCase.requireRepoSkillTraceEvidence !== false;

  mkdirSync(attemptDir, { recursive: true });
  try {
    cpSync(fixtureRoot, runtimeWorkspace, { recursive: true });
    initializeRuntimeRepo(runtimeWorkspace);
    mkdirSync(runtimeSkillsDir, { recursive: true });
    mkdirSync(codexHome, { recursive: true });

    if (existsSync(sourceAuthPath)) {
      cpSync(sourceAuthPath, path.join(codexHome, "auth.json"));
    }

    for (const entry of readdirSync(path.join(repoRoot, "skills"))) {
      cpSync(path.join(repoRoot, "skills", entry), path.join(runtimeSkillsDir, entry), {
        recursive: true,
      });
    }

    applyCaseSetup(testCase, runtimeWorkspace);

    if (!existsSync(workingDirectory)) {
      return {
        attemptNumber,
        attemptDir,
        messagePath,
        tracePath,
        stderrPath,
        resultPath,
        result: buildFailureResult({
          artifactRoot,
          testCase,
          attemptNumber,
          workingDirectory,
          runtimeWorkspace,
          messagePath,
          tracePath,
          stderrPath,
          resultPath,
          error: `Missing runtime working directory: ${workingDirectory}`,
        }),
      };
    }

    const turns = normalizeCaseTurns(testCase);
    const rawTraceChunks = [];
    const rawStderrChunks = [];
    const rawTurnMessages = [];
    const turnResults = [];
    let rawLastMessage = "";

    for (let turnIndex = 0; turnIndex < turns.length; turnIndex += 1) {
      const turn = turns[turnIndex];
      const turnMessagePath =
        turns.length === 1
          ? rawMessagePath
          : path.join(runtimeRoot, `last-message-turn-${turnIndex + 1}.txt`);
      const args =
        turnIndex === 0
          ? [
              "exec",
              "--sandbox",
              "read-only",
              "--json",
              ...(turns.length === 1 ? ["--ephemeral"] : []),
              "--skip-git-repo-check",
              "-C",
              workingDirectory,
              "-o",
              turnMessagePath,
              turn.prompt,
            ]
          : [
              "exec",
              "resume",
              "--last",
              "--json",
              "--skip-git-repo-check",
              "-o",
              turnMessagePath,
              turn.prompt,
            ];

      const turnResult = spawnSync("codex", args, {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: timeoutMs,
        env: sourceCaseEnvironment,
      });

      const rawTurnTraceText = turnResult.stdout ?? "";
      const rawTurnStderrText = turnResult.stderr ?? "";
      const rawFileMessage = existsSync(turnMessagePath) ? readFileSync(turnMessagePath, "utf8") : "";
      const rawTraceMessage = getLastAgentMessage(rawTurnTraceText);
      const rawTurnMessage = rawFileMessage || rawTraceMessage || "";

      rawTraceChunks.push(rawTurnTraceText);
      rawStderrChunks.push(rawTurnStderrText);
      rawTurnMessages.push(rawTurnMessage);
      turnResults.push(turnResult);
      rawLastMessage = rawTurnMessage || rawLastMessage;

      if (turnResult.status !== 0 || turnResult.error?.code === "ETIMEDOUT") {
        break;
      }
    }

    const exitCode = turnResults.find((turnResult) => turnResult.status !== 0)?.status ?? turnResults.at(-1)?.status ?? 1;
    const timedOut = turnResults.some((turnResult) => turnResult.error?.code === "ETIMEDOUT");
    const rawTraceText = joinTextChunks(rawTraceChunks);
    const rawStderrText = joinTextChunks(rawStderrChunks);
    const traceText = sanitizeTraceText(rawTraceText);
    const stderrText = sanitizeString(rawStderrText);
    const lastMessage = sanitizeRuntimeReferences(
      sanitizeString(rawLastMessage),
      runtimeRoot,
      runtimeWorkspace,
      runtimeSkillsDir
    );
    const sanitizedStderrText = sanitizeRuntimeReferences(
      stderrText,
      runtimeRoot,
      runtimeWorkspace,
      runtimeSkillsDir
    );
    const turnMessages = rawTurnMessages.map((rawTurnMessage) =>
      sanitizeRuntimeReferences(
        sanitizeString(rawTurnMessage),
        runtimeRoot,
        runtimeWorkspace,
        runtimeSkillsDir
      )
    );
    const parsedTrace = parseTraceArtifacts(traceText);
    const sanitizedTraceText = sanitizeRuntimeReferences(
      traceText,
      runtimeRoot,
      runtimeWorkspace,
      runtimeSkillsDir
    );
    const sanitizedParsedTrace = parseTraceArtifacts(sanitizedTraceText);

    writeFileSync(tracePath, sanitizedTraceText, "utf8");
    writeFileSync(stderrPath, sanitizedStderrText, "utf8");
    writeFileSync(messagePath, lastMessage, "utf8");
    const turnMessagePaths = turns.length > 1
      ? turnMessages.map((turnMessage, index) => {
        const turnArtifactPath = path.join(attemptDir, `last-message-turn-${index + 1}.txt`);
        writeFileSync(turnArtifactPath, turnMessage, "utf8");
        return turnArtifactPath;
      })
      : [];

    const haystack = normalizeText(lastMessage);
    const matchedPhrase =
      testCase.expectedAny.find((needle) => haystack.includes(normalizeText(needle))) ?? null;
    const repoSkillTraceHit = parsedTrace.commands.some((command) =>
      isRepoScopedSkillTrace(command, runtimeSkillsDir)
    );
    const legacyUserSkillTraceHit = parsedTrace.commands.some((command) =>
      isLegacyUserSkillTrace(command, hostHome, hostCodexHome)
    );
    const skillPathEvidenceObserved = hasAnySkillPathEvidence(parsedTrace, runtimeSkillsDir);
    const repoSkillTraceSatisfied =
      !requireRepoSkillTraceEvidence || repoSkillTraceHit || !skillPathEvidenceObserved;
    const unexpectedExternalInstructionPaths = collectUnexpectedExternalInstructionPaths(
      parsedTrace,
      runtimeWorkspace,
      hostHome,
      hostCodexHome
    );
    const hasCapturedFinalMessage = lastMessage.length > 0;
    const sources = buildCheckSources(lastMessage, sanitizedStderrText, sanitizedParsedTrace, turnMessages);
    const caseChecks = [
      {
        id: "response_available",
        pass: exitCode === 0 || hasCapturedFinalMessage,
        notes:
          exitCode === 0 || hasCapturedFinalMessage
            ? "A final message or clean exit was captured."
            : "No final message was captured and the command did not exit cleanly.",
      },
      {
        id: "expected_phrase",
        pass: matchedPhrase !== null,
        notes:
          matchedPhrase !== null
            ? `Matched expected phrase: ${matchedPhrase}`
            : `Expected one of: ${testCase.expectedAny.join(", ")}`,
      },
      {
        id: "repo_skill_trace",
        pass: repoSkillTraceSatisfied,
        notes: requireRepoSkillTraceEvidence
          ? repoSkillTraceHit
            ? "Repo-scoped skill trace observed."
            : skillPathEvidenceObserved
              ? "Skill path evidence was emitted, but repo-scoped skill trace was not observed."
              : "No explicit skill path evidence was emitted in this run."
          : "Repo-scoped skill trace confirmation is not required for this case.",
      },
      {
        id: "no_legacy_user_skill_trace",
        pass: !legacyUserSkillTraceHit,
        notes: legacyUserSkillTraceHit
          ? "Legacy user-scoped skill trace was observed."
          : "Legacy user-scoped skill trace was not observed.",
      },
      {
        id: "no_unexpected_external_instruction_paths",
        pass: unexpectedExternalInstructionPaths.length === 0,
        notes:
          unexpectedExternalInstructionPaths.length === 0
            ? "No unexpected external instruction paths were observed."
            : `Unexpected external instruction paths observed: ${unexpectedExternalInstructionPaths.join(", ")}`,
      },
      ...((testCase.extraChecks ?? []).map((check) => evaluateCheck(check, sources))),
    ];
    const pass = caseChecks.every((check) => check.pass);
    const failureReasons = [];

    if (exitCode !== 0) {
      failureReasons.push(`codex exit code ${exitCode ?? 1}`);
    }
    if (timedOut) {
      failureReasons.push("case timed out");
    }
    if (matchedPhrase === null) {
      failureReasons.push("expected phrase not found");
    }
    if (!repoSkillTraceSatisfied) {
      failureReasons.push("repo-scoped skill trace not observed");
    }
    if (legacyUserSkillTraceHit) {
      failureReasons.push("legacy user-scoped skill trace observed");
    }
    if (unexpectedExternalInstructionPaths.length > 0) {
      failureReasons.push("unexpected external instruction paths observed");
    }
    for (const check of caseChecks.filter((item) => !item.pass)) {
      failureReasons.push(`check failed: ${check.id}`);
    }

    const result = {
      id: testCase.id,
      attempt: attemptNumber,
      pass,
      turn_count: turns.length,
      workspace: testCase.workingSubdir ?? ".",
      fixture_root: testCase.fixtureRoot,
      runtime_workspace: runtimeWorkspaceLabel,
      runtime_working_directory: runtimeWorkingDirectoryLabel,
      exit_code: exitCode,
      timed_out: timedOut,
      repo_skill_trace_hit: repoSkillTraceHit,
      skill_path_evidence_observed: skillPathEvidenceObserved,
      legacy_user_skill_trace_hit: legacyUserSkillTraceHit,
      unexpected_external_instruction_paths: unexpectedExternalInstructionPaths,
      expected_any: testCase.expectedAny,
      matched_phrase: matchedPhrase,
      case_checks: caseChecks,
      artifacts_sanitized: true,
      trace_sanitizer_version: traceSanitizerVersion,
      message_path: toPublicArtifactPath(messagePath, artifactRoot),
      turn_message_paths: turnMessagePaths.map((turnMessagePath) => toPublicArtifactPath(turnMessagePath, artifactRoot)),
      trace_path: toPublicArtifactPath(tracePath, artifactRoot),
      stderr_path: toPublicArtifactPath(stderrPath, artifactRoot),
      notes: pass
        ? exitCode === 0
          ? `Expected phrase found${requireRepoSkillTraceEvidence ? " and repo-scoped skill source confirmed." : "."}`
          : "Expected phrase found in a trace-captured final agent message and repo-scoped skill source confirmed."
        : failureReasons.join("; "),
    };

    writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    return {
      attemptNumber,
      attemptDir,
      messagePath,
      turnMessagePaths,
      tracePath,
      stderrPath,
      resultPath,
      result,
    };
  } catch (error) {
    return {
      attemptNumber,
      attemptDir,
      messagePath,
      turnMessagePaths: [],
      tracePath,
      stderrPath,
      resultPath,
      result: buildFailureResult({
        artifactRoot,
        testCase,
        attemptNumber,
        workingDirectory,
        runtimeWorkspace,
        messagePath,
        tracePath,
        stderrPath,
        resultPath,
        error,
      }),
    };
  } finally {
    rmSync(runtimeRoot, { recursive: true, force: true });
  }
}

export function runCase(testCase, artifactRoot) {
  const caseArtifactsDir = path.join(artifactRoot, testCase.id);
  rmSync(caseArtifactsDir, { recursive: true, force: true });
  mkdirSync(caseArtifactsDir, { recursive: true });

  const attempts = [];
  let selectedAttempt = null;

  for (let attemptNumber = 1; attemptNumber <= 2; attemptNumber += 1) {
    const attempt = runCaseAttempt(testCase, artifactRoot, caseArtifactsDir, attemptNumber);
    attempts.push(attempt);
    selectedAttempt = attempt;

    if (!shouldRetryCase(attempt.result, attemptNumber)) {
      break;
    }
  }

  const finalTracePath = path.join(caseArtifactsDir, "trace.jsonl");
  const finalMessagePath = path.join(caseArtifactsDir, "last-message.txt");
  const finalStderrPath = path.join(caseArtifactsDir, "stderr.txt");
  const finalResultPath = path.join(caseArtifactsDir, "result.json");
  const finalTurnMessagePaths = (selectedAttempt.turnMessagePaths ?? []).map((sourceTurnPath, index) => {
    const destinationTurnPath = path.join(caseArtifactsDir, `last-message-turn-${index + 1}.txt`);
    writeFileSync(destinationTurnPath, readFileSync(sourceTurnPath, "utf8"), "utf8");
    return destinationTurnPath;
  });
  const finalTraceText = readFileSync(selectedAttempt.tracePath, "utf8");
  const finalMessageText = readFileSync(selectedAttempt.messagePath, "utf8");
  const finalStderrText = readFileSync(selectedAttempt.stderrPath, "utf8");
  const finalResult = {
    ...selectedAttempt.result,
    attempt_count: attempts.length,
    attempts: attempts.map((attempt) => ({
      attempt: attempt.attemptNumber,
      pass: attempt.result.pass,
      repo_skill_trace_hit: attempt.result.repo_skill_trace_hit,
      legacy_user_skill_trace_hit: attempt.result.legacy_user_skill_trace_hit,
      matched_phrase: attempt.result.matched_phrase,
      notes: attempt.result.notes,
      turn_message_paths: attempt.result.turn_message_paths ?? [],
      result_path: toPublicArtifactPath(attempt.resultPath, artifactRoot),
    })),
    message_path: toPublicArtifactPath(finalMessagePath, artifactRoot),
    turn_message_paths: finalTurnMessagePaths.map((turnMessagePath) => toPublicArtifactPath(turnMessagePath, artifactRoot)),
    trace_path: toPublicArtifactPath(finalTracePath, artifactRoot),
    stderr_path: toPublicArtifactPath(finalStderrPath, artifactRoot),
    notes:
      attempts.length > 1
        ? `${selectedAttempt.result.notes} Stabilized after ${attempts.length - 1} retry for repo-scoped trace confirmation.`
        : selectedAttempt.result.notes,
  };

  writeFileSync(finalTracePath, finalTraceText, "utf8");
  writeFileSync(finalMessagePath, finalMessageText, "utf8");
  writeFileSync(finalStderrPath, finalStderrText, "utf8");
  writeFileSync(finalResultPath, `${JSON.stringify(finalResult, null, 2)}\n`, "utf8");
  return finalResult;
}
