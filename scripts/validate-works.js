#!/usr/bin/env node
/*
 * Validates docs/works.js — the single source of truth for the site & tables.
 * Run: node scripts/validate-works.js
 * Exits non-zero (and prints every problem) if anything is off.
 */
"use strict";
const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "docs", "works.js"));
const WORKS = global.window.WORKS;
const GROUPS = global.window.GROUPS;

const SPACES = ["text", "token", "pixel", "latent", "abstract"];
const CONDS = ["obs", "act"];
const UNCS = ["deterministic", "softmax", "gaussian", "categorical", "diffusion", "energy"];
const OBJS = ["reconstruction", "value-equivalent", "contrastive", "energy", "likelihood"];
const REQUIRED = ["id", "name", "org", "year", "venue", "url", "group", "state", "space", "cond", "unc", "obj", "x", "y", "ladder", "note"];

const errors = [];
const warns = [];
const fail = (id, msg) => errors.push(`  ✗ [${id}] ${msg}`);

if (!Array.isArray(WORKS)) { console.error("FATAL: window.WORKS is not an array"); process.exit(1); }
if (!GROUPS || typeof GROUPS !== "object") { console.error("FATAL: window.GROUPS missing"); process.exit(1); }

const seen = new Set();
for (const w of WORKS) {
  const id = w && w.id ? w.id : "(no id)";
  if (!w || typeof w !== "object") { fail(id, "entry is not an object"); continue; }
  for (const f of REQUIRED) if (!(f in w)) fail(id, `missing required field "${f}"`);
  if (seen.has(w.id)) fail(id, "duplicate id"); else seen.add(w.id);
  if (w.group && !GROUPS[w.group]) fail(id, `unknown group "${w.group}" (not in window.GROUPS)`);
  if (w.space && !SPACES.includes(w.space)) fail(id, `invalid space "${w.space}" — expected one of ${SPACES.join("|")}`);
  if (w.cond && !CONDS.includes(w.cond)) fail(id, `invalid cond "${w.cond}" — expected obs|act`);
  if (w.unc && !UNCS.includes(w.unc)) fail(id, `invalid unc "${w.unc}"`);
  if (w.obj && !OBJS.includes(w.obj)) fail(id, `invalid obj "${w.obj}"`);
  if (typeof w.x !== "number" || w.x < 0 || w.x > 1) fail(id, `x must be a number in [0,1] (got ${w.x})`);
  if (typeof w.y !== "number" || w.y < 0 || w.y > 1) fail(id, `y must be a number in [0,1] (got ${w.y})`);
  if (!Number.isInteger(w.ladder) || w.ladder < 0 || w.ladder > 5) fail(id, `ladder must be an integer 0-5 (got ${w.ladder})`);
  if (typeof w.year !== "number" || w.year < 1900 || w.year > 2100) fail(id, `year looks wrong (got ${w.year})`);
  if (w.url && !/^https?:\/\//.test(w.url)) fail(id, `url must start with http(s):// (got ${w.url})`);
  if (w.img && !/^assets\/papers\//.test(w.img)) warns.push(`  ! [${id}] img should live under assets/papers/ (got ${w.img})`);
  if (w.state && w.state.length > 110) warns.push(`  ! [${id}] state is long (${w.state.length} chars) — keep it scannable`);
}

const usedGroups = new Set(WORKS.map(w => w.group));
for (const g of Object.keys(GROUPS)) if (!usedGroups.has(g)) warns.push(`  ! group "${g}" defined but unused`);

console.log(`Checked ${WORKS.length} works across ${Object.keys(GROUPS).length} groups.`);
if (warns.length) { console.log("\nWarnings:"); warns.forEach(w => console.log(w)); }
if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):`);
  errors.forEach(e => console.error(e));
  process.exit(1);
}
console.log("\n✅ works.js is valid.");
