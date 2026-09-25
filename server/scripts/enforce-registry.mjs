#!/usr/bin/env node
// Keeps package-lock.json pointing at the public npm registry.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_REGISTRY = "https://registry.npmjs.org/";

// Any host that must never appear in a committed lockfile.
const INTERNAL_HOSTS = ["package-firewall.replit.internal"];

// Replit's firewall mirrors the standard npmjs path layout under /npm/, so
// swapping the full origin+prefix (trailing slash included, so scoped packages
// like /npm/@types/node stay well-formed) is a faithful translation back.
const INTERNAL_PREFIX_RE = /https?:\/\/package-firewall\.replit\.internal\/npm\//g;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockfile = join(root, "package-lock.json");

const directRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

let contents;
try {
  if (!existsSync(lockfile)) {
    process.exit(directRun ? 1 : 0);
  }
  contents = readFileSync(lockfile, "utf8");
} catch (error) {
  // Never block an install because the guard itself had a bad day.
  if (directRun) {
    console.error(`[registry-guard] could not read package-lock.json: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

const offenders = INTERNAL_HOSTS.filter((host) => contents.includes(host));
const occurrences = (contents.match(INTERNAL_PREFIX_RE) || []).length;

if (offenders.length === 0) {
  if (directRun) {
    console.log("[registry-guard] package-lock.json is clean.");
  }
  process.exit(0);
}

const fixed = contents.replace(INTERNAL_PREFIX_RE, PUBLIC_REGISTRY);

// The host was present but in a shape the rewrite above does not handle.
// Say so instead of silently writing an unchanged file and claiming success.
if (fixed === contents) {
  const message =
    `[registry-guard] ${offenders.join(", ")} is in package-lock.json but not in a ` +
    `recognised /npm/ URL form - not auto-repaired, fix it by hand.`;
  if (directRun) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
  process.exit(0);
}

try {
  writeFileSync(lockfile, fixed);
} catch (error) {
  if (directRun) {
    console.error(`[registry-guard] could not rewrite package-lock.json: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

const verb = directRun ? "repaired" : "auto-repaired";
console.warn(
  `[registry-guard] ${verb} ${occurrences} internal-registry URL(s) in package-lock.json ` +
    `-> ${PUBLIC_REGISTRY}\n` +
    `[registry-guard] found: ${offenders.join(", ")}`
);
