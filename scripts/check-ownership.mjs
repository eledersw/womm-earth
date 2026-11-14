#!/usr/bin/env node
// Warn (never fail) when a PR touches files outside its author's area.
// Source of truth: the three fenced blocks under **Eleder / Oier / Ekaitz** in
// docs/process/OWNERSHIP.md. Branch prefix (eleder/, oier/, ekaitz/) picks the owner.
// docs/** is shared by section and is not checked here.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { minimatch } from "minimatch";

const OWNERS = { eleder: "Eleder", oier: "Oier", ekaitz: "Ekaitz" };

/** @param {string} markdown @returns {Record<string, string[]>} */
export function parseAreas(markdown) {
  /** @type {Record<string, string[]>} */
  const areas = {};
  const re = /\*\*(Eleder|Oier|Ekaitz):[^\n]*\*\*\s*\n```[^\n]*\n([\s\S]*?)```/g;
  for (const [, owner, block] of markdown.matchAll(re)) {
    const globs = [];
    for (const line of block.split("\n")) {
      for (const token of line.trim().split(/\s+/)) {
        if (!token || token.startsWith("(")) break; // the rest of the line is a comment
        globs.push(token);
      }
    }
    areas[owner] = globs;
  }
  return areas;
}

/** @param {string[]} files @param {string[]} globs @returns {string[]} */
export function outsideArea(files, globs) {
  return files.filter(
    (f) => !f.startsWith("docs/") && !globs.some((g) => minimatch(f, g, { dot: true })),
  );
}

function main() {
  const branch = process.env.GITHUB_HEAD_REF || execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  const owner = OWNERS[branch.split("/")[0]?.toLowerCase()];
  if (!owner) {
    console.log(`ownership: branch "${branch}" has no owner prefix (eleder/, oier/, ekaitz/); skipping.`);
    return;
  }
  const areas = parseAreas(readFileSync("docs/process/OWNERSHIP.md", "utf8"));
  const base = process.env.OWNERSHIP_BASE || "origin/main";
  const files = execSync(`git diff --name-only ${base}...HEAD`).toString().split("\n").filter(Boolean);
  const stray = outsideArea(files, areas[owner] ?? []);
  if (stray.length === 0) {
    console.log(`ownership: all ${files.length} changed files are in ${owner}'s area.`);
    return;
  }
  const msg = `${stray.length} file(s) outside ${owner}'s area (see docs/process/OWNERSHIP.md):\n  ${stray.join("\n  ")}`;
  console.log(process.env.GITHUB_ACTIONS ? `::warning title=Ownership::${msg.replaceAll("\n", "%0A")}` : `WARNING: ${msg}`);
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}` || process.argv[1]?.endsWith("check-ownership.mjs")) {
  main();
}
