#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDay } from "../packages/content-schema/dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, "../apps/api/src/content");
const dayNumbers = [1, 2, 3, 4, 5, 6];

let issueCount = 0;

for (const dayNumber of dayNumbers) {
  const file = `day${dayNumber}.json`;
  const path = join(contentDir, file);
  const day = JSON.parse(readFileSync(path, "utf-8"));
  const result = validateDay(day, file);

  if (result.ok) {
    console.log(`✓ ${file}`);
    continue;
  }

  console.log(`✗ ${file}`);
  for (const issue of result.issues) {
    issueCount += 1;
    console.log(`  - ${issue.path}: ${issue.message}`);
  }
}

if (issueCount > 0) {
  console.error(`\nContent validation failed with ${issueCount} issue(s).`);
  process.exit(1);
}

console.log("\nContent validation passed.");
