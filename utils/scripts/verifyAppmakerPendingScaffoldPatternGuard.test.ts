// /utils/scripts/verifyAppmakerPendingScaffoldPatternGuard.test.ts
//
// Regression test for checkPendingScaffoldPatternGuard() in
// verifyAppmakerPendingScaffoldPatternGuard.ts (appmaker/t-012). Exercises
// the real check against synthetic route-shaped fixtures covering: the fixed
// shape (both title prefixes queried, both patterns recognized by the
// regex), the pre-fix shape (only the monorepo "new app" pattern), and a
// partial regression (query widened but the regex not updated to match).
import assert from 'node:assert/strict'

import { checkPendingScaffoldPatternGuard } from './verifyAppmakerPendingScaffoldPatternGuard.js'

function fixture(whereClause: string, regexSource: string): string {
  return `
import { defineEventHandler, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'

const SCAFFOLD_TITLE_RE = ${regexSource}

export default defineEventHandler(async () => {
  const openScaffoldTodos = await prisma.todo.findMany({
    where: {
      status: 'OPEN',
      category: 'AGENT',
      ${whereClause}
    },
  })
})
`
}

const FIXED = fixture(
  `OR: [
        { title: { startsWith: "Scaffold new app '" } },
        { title: { startsWith: "Scaffold external app '" } },
      ],`,
  `/^Scaffold (?:new|external) app '([a-z0-9-]+)'/`,
)

// Pre-fix shape: the query and regex only ever recognized the monorepo flow.
const BUGGY = fixture(
  `title: { startsWith: "Scaffold new app '" },`,
  `/^Scaffold new app '([a-z0-9-]+)'/`,
)

// Partial regression: the query was widened to cover both flows, but the
// extraction regex was never updated to match the external-repo title.
const PARTIALLY_REGRESSED = fixture(
  `OR: [
        { title: { startsWith: "Scaffold new app '" } },
        { title: { startsWith: "Scaffold external app '" } },
      ],`,
  `/^Scaffold new app '([a-z0-9-]+)'/`,
)

function run(): void {
  const fixedErrors = checkPendingScaffoldPatternGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkPendingScaffoldPatternGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    2,
    'expected the pre-fix fixture (no external-repo prefix in the query, ' +
      `regex not widened) to fail both checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /"Scaffold external app '" title prefix/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) =>
      /no longer recognizes both "new" and "external"/.test(e),
    ),
  )

  const regressedErrors = checkPendingScaffoldPatternGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture with a widened query but a stale regex to fail ' +
      `only the regex assertion, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(
    regressedErrors.some((e) =>
      /no longer recognizes both "new" and "external"/.test(e),
    ),
  )

  console.log(
    'AppMaker pending-scaffold-pattern guard self-test passed: buggy ' +
      'fixture fails both checks, fixed fixture passes, and a ' +
      'query-widened-but-regex-stale regression fails only the regex check.',
  )
}

run()
