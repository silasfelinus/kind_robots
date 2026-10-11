// Runs every cabinet depth-pass suite (utils/scripts/verifyCabinet*.test.ts) in name order, so a
// cabinet's new tests join test:arcade-engine without another edit to package.json (conductor
// kr-arcade m8, where several cabinets are upgraded side by side).
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const suites = readdirSync(here)
  .filter((name) => /^verifyCabinet.+\.test\.ts$/.test(name))
  .sort()
for (const name of suites) await import(pathToFileURL(join(here, name)).href)
console.log(`arcade cabinet suites: ${suites.length} ok`)
