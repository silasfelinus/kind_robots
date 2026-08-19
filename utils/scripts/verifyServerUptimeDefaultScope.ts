// /utils/scripts/verifyServerUptimeDefaultScope.ts
//
// Regression guard for text-generation/t-007: server/utils/
// serverUptimeScope.ts's getUptimeDefaultServerTypes() decides which
// Server.serverType values server/api/server/uptime.get.ts includes by
// default (before any ?serverType= override). Before this fix, the default
// where-clause was hardcoded to ['A1111', 'COMFY'] only -- once
// text-generation/t-003 made OPENAI/ANTHROPIC/OLLAMA/CUSTOM real,
// resolvable text servers, they still had no uptime/latency visibility on
// the admin dashboard unless an operator manually passed
// ?serverType=OLLAMA (etc.), which nothing in the UI surfaces. Imported
// directly here (not via uptime.get.ts) because that route transitively
// pulls in ../../utils/prisma, which throws at module-load time without a
// DATABASE_URL -- this CI job intentionally has none set.
import assert from 'node:assert/strict'
import { getUptimeDefaultServerTypes } from '../../server/utils/serverUptimeScope'

let failures = 0

function check(label: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok - ${label}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL - ${label}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

const types = getUptimeDefaultServerTypes()

check('default scope includes the original art/GPU server types', () => {
  assert.ok(types.includes('A1111'))
  assert.ok(types.includes('COMFY'))
})

check('default scope includes every text-capable server type', () => {
  assert.ok(types.includes('OPENAI'))
  assert.ok(types.includes('ANTHROPIC'))
  assert.ok(types.includes('OLLAMA'))
  assert.ok(types.includes('CUSTOM'))
})

check('default scope has no duplicate entries', () => {
  assert.equal(types.length, new Set(types).size)
})

check('default scope is exactly the six known server types', () => {
  assert.deepEqual(
    [...types].sort(),
    ['A1111', 'ANTHROPIC', 'COMFY', 'CUSTOM', 'OLLAMA', 'OPENAI'].sort(),
  )
})

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
} else {
  console.log(`\nAll checks passed.`)
}
