#!/usr/bin/env node
/**
 * Agent capture hook for Claude Code — 8x assignment.
 *
 * Wired in .claude/settings.json to two hook events:
 *   UserPromptSubmit -> `capture.mjs prompt`  records the verbatim user prompt
 *   Stop             -> `capture.mjs stop`    records the agent's end-of-turn reply
 *
 * One markdown file per session under .agent-logs/, named
 * <YYYY-MM-DD>_<HH-MM-SS>_<session_id>.md, with YAML frontmatter and one
 * [LOG_ENTRY] block per prompt and per response.
 *
 * Hooks must never break the session: every failure path exits 0 silently.
 */

import fs from "node:fs";
import path from "node:path";

const AUTHOR = "Mahad-007";
const PROJECT = "Amazon-Clone";
const TOOL = "claude-code";
const UNKNOWN_MODEL = "unknown";

const MODE = process.argv[2] === "stop" ? "stop" : "prompt";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
    // A hook with no piped stdin should not hang the turn.
    setTimeout(() => resolve(data), 2000).unref?.();
  });
}

/**
 * Walk the JSONL transcript and pull out the model plus the text of the last
 * assistant message that actually carried prose. Tool-only turns are skipped,
 * so `text` is the reply the user saw at the end of the turn.
 */
function readTranscript(transcriptPath) {
  const result = { model: UNKNOWN_MODEL, text: "" };
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return result;

  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return result;
  }

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue; // a half-flushed trailing line is normal, not an error
    }
    if (event?.type !== "assistant") continue;
    const message = event.message;
    if (!message) continue;
    if (message.model) result.model = message.model;

    const text = (Array.isArray(message.content) ? message.content : [])
      .filter((block) => block?.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("");
    if (text.trim()) result.text = text;
  }
  return result;
}

function utcStamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `_${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`
  );
}

function logsDir(cwd) {
  const dir = path.join(process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd(), ".agent-logs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function findSessionFile(dir, sessionId) {
  const suffix = `_${sessionId}.md`;
  const match = fs.readdirSync(dir).find((f) => f.endsWith(suffix));
  return match ? path.join(dir, match) : null;
}

function createSessionFile(dir, sessionId, model, iso) {
  const file = path.join(dir, `${utcStamp(new Date(iso))}_${sessionId}.md`);
  const date = iso.slice(0, 10);
  const shortId = sessionId.slice(0, 8);
  fs.writeFileSync(
    file,
    `---\n` +
      `session_id: ${sessionId}\n` +
      `date: ${date}\n` +
      `author: ${AUTHOR}\n` +
      `model: ${model}\n` +
      `tool: ${TOOL}\n` +
      `project: ${PROJECT}\n` +
      `total_exchanges: 0\n` +
      `first_prompt_time: ${iso}\n` +
      `last_prompt_time: ${iso}\n` +
      `---\n\n` +
      `# Session Log - ${date}\n\n` +
      `Session: \`${shortId}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\`\n\n` +
      `---\n`
  );
  return file;
}

function patchFrontmatter(content, updates) {
  if (!content.startsWith("---")) return content;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return content;

  let frontmatter = content.slice(0, end);
  const body = content.slice(end);
  for (const [key, value] of Object.entries(updates)) {
    const line = new RegExp(`^${key}: .*$`, "m");
    if (line.test(frontmatter)) frontmatter = frontmatter.replace(line, `${key}: ${value}`);
  }
  return frontmatter + body;
}

function readFrontmatterValue(content, key) {
  const match = content.match(new RegExp(`^${key}: (.*)$`, "m"));
  return match ? match[1].trim() : null;
}

/** How many PROMPT entries the file already holds — the exchange counter. */
function countPrompts(content) {
  return (content.match(/^\[LOG_ENTRY type=PROMPT /gm) || []).length;
}

/**
 * Scrub credentials before anything is written to .agent-logs/.
 *
 * The logs are committed to a public repository, and a session inevitably
 * contains tokens pasted by the user or echoed by a command. GitHub's secret
 * scanning blocks a push that contains one, so this is both a security
 * control and the thing that keeps the repo pushable.
 *
 * Publishable/anon keys are deliberately NOT redacted: they are designed to
 * be public and ship in the browser bundle anyway.
 */
const SECRET_PATTERNS = [
  [/\bsbp_[A-Za-z0-9]{32,}/g, "sbp_REDACTED"],               // Supabase PAT
  [/\bsb_secret_[A-Za-z0-9_-]{16,}/g, "sb_secret_REDACTED"], // Supabase secret key
  [/\bservice_role[^\s"']*\s*[:=]\s*\S+/g, "service_role=REDACTED"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "JWT_REDACTED"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/g, "gh_REDACTED"],          // GitHub tokens
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, "github_pat_REDACTED"],
  [/\bapify_api_[A-Za-z0-9]{20,}/g, "apify_api_REDACTED"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "AKIA_REDACTED"],               // AWS access key id
  [/\bsk-[A-Za-z0-9]{20,}/g, "sk_REDACTED"],                 // OpenAI-style keys
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, "xox_REDACTED"],      // Slack tokens
  [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    "PRIVATE_KEY_REDACTED",
  ],
];

function redact(text) {
  let out = String(text ?? "");
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function appendEntry(file, { type, num, sessionId, iso, model, text }) {
  const block =
    `\n[LOG_ENTRY type=${type} num=${num} session=${sessionId.slice(0, 8)}]\n` +
    `timestamp: ${iso}\n` +
    `model: ${model}\n\n` +
    `${redact(text).trim()}\n\n`;
  fs.appendFileSync(file, block);
}

async function main() {
  const stdin = await readStdin();
  let input = {};
  try {
    input = JSON.parse(stdin || "{}");
  } catch {
    input = {};
  }

  const sessionId = input.session_id || "unknown-session";
  const iso = new Date().toISOString();
  const dir = logsDir(input.cwd);
  const transcript = readTranscript(input.transcript_path);
  const model = transcript.model;

  if (MODE === "prompt") {
    const prompt = typeof input.prompt === "string" ? input.prompt : "";
    if (!prompt.trim()) return;

    let file = findSessionFile(dir, sessionId);
    if (!file) file = createSessionFile(dir, sessionId, model, iso);

    let content = fs.readFileSync(file, "utf8");
    const num = countPrompts(content) + 1;
    content = patchFrontmatter(content, {
      total_exchanges: num,
      last_prompt_time: iso,
      ...(model !== UNKNOWN_MODEL ? { model } : {}),
    });
    fs.writeFileSync(file, content);

    appendEntry(file, { type: "PROMPT", num, sessionId, iso, model, text: prompt });
    return;
  }

  // MODE === "stop": attach the reply to the prompt that opened this turn.
  const file = findSessionFile(dir, sessionId);
  if (!file) return; // Stop with no preceding prompt — nothing to attach to.

  let content = fs.readFileSync(file, "utf8");
  const num = countPrompts(content);
  if (num === 0) return;

  // Guard against a Stop firing twice for the same turn.
  if (content.includes(`[LOG_ENTRY type=RESPONSE num=${num} `)) return;

  const text = transcript.text || "(no end-of-turn text — turn ended on tool use)";
  if (model !== UNKNOWN_MODEL && readFrontmatterValue(content, "model") !== model) {
    fs.writeFileSync(file, patchFrontmatter(content, { model }));
  }
  appendEntry(file, { type: "RESPONSE", num, sessionId, iso, model, text });
}

main().catch(() => {}).finally(() => process.exit(0));
