// /utils/scripts/verifyAppmakerScaffoldCollisionGuard.test.ts
//
// Regression test for checkScaffoldCollisionGuard() in
// verifyAppmakerScaffoldCollisionGuard.ts (appmaker/t-012). Exercises the
// real check against synthetic route-shaped fixtures covering: the fixed
// shape (candidate slug checked against Project, Dream, AND the conductor
// apps/ folder listing), the pre-fix shape (only Project/Dream checked,
// conductorList never imported/called), and partial regressions (the
// conductorList call and dir-entry filter survive, but the result is no
// longer folded into the "already taken" throw).
import assert from 'node:assert/strict'

import { checkScaffoldCollisionGuard } from './verifyAppmakerScaffoldCollisionGuard.js'

function fixture(body: string): string {
  return `
import { conductorList } from '~/server/utils/conductor-github'

export default defineEventHandler(async (event) => {
  try {
${body}
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
`
}

const FIXED = fixture(`
    const [existingProject, existingDream, scaffoldedApps] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({
        where: { slug },
        select: { id: true },
      }),
      conductorList('apps'),
    ])

    const alreadyScaffolded = (scaffoldedApps ?? []).some(
      (entry) => entry.type === 'dir' && entry.name === slug,
    )

    if (existingProject || existingDream || alreadyScaffolded) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
`)

// Pre-fix shape: no import, no conductorList call, slug uniqueness checked
// only against Project/Dream.
const BUGGY = `
export default defineEventHandler(async (event) => {
  try {
    const [existingProject, existingDream] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({
        where: { slug },
        select: { id: true },
      }),
    ])

    if (existingProject || existingDream) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
`

// Partial regression: conductorList is still imported and called, and the
// dir-entry filter still exists, but `alreadyScaffolded` was dropped back
// out of the "already taken" condition -- so it's computed but has no
// effect, same bug in practice.
const PARTIALLY_REGRESSED = fixture(`
    const [existingProject, existingDream, scaffoldedApps] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({
        where: { slug },
        select: { id: true },
      }),
      conductorList('apps'),
    ])

    const alreadyScaffolded = (scaffoldedApps ?? []).some(
      (entry) => entry.type === 'dir' && entry.name === slug,
    )

    if (existingProject || existingDream) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
`)

function run(): void {
  const fixedErrors = checkScaffoldCollisionGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkScaffoldCollisionGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    4,
    'expected the pre-fix fixture (no import, no conductorList call, no ' +
      'dir-entry filter, no folded condition) to fail all four checks, got: ' +
      `${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /no longer imports `conductorList`/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) => /no longer calls conductorList\('apps'\)/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) =>
      /no longer filters conductorList\('apps'\) entries/.test(e),
    ),
  )
  assert.ok(
    buggyErrors.some((e) => /no longer checks `existingProject \|\|/.test(e)),
  )

  const regressedErrors = checkScaffoldCollisionGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture where alreadyScaffolded is computed but not folded ' +
      `into the throw to fail only that assertion, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(
    regressedErrors.some((e) =>
      /no longer checks `existingProject \|\| existingDream \|\| alreadyScaffolded`/.test(
        e,
      ),
    ),
  )

  const missingHandler = checkScaffoldCollisionGuard(
    "import { conductorList } from '~/server/utils/conductor-github'\nconst somethingElse = 1\n",
  )
  assert.equal(missingHandler.length, 1)
  assert.ok(missingHandler.some((e) => /Could not find/.test(e)))

  console.log(
    'AppMaker scaffold-collision guard self-test passed: buggy fixture ' +
      'fails all checks, fixed fixture passes, a partially-regressed ' +
      'fixture fails only the folded-condition check, and a missing ' +
      'handler is detected.',
  )
}

run()
