// /utils/scripts/verifyAppmakerScaffoldCollisionGuard.test.ts
//
// Regression test for verifyAppmakerScaffoldCollisionGuard.ts (appmaker/
// t-012, reshaped by kind-robots/t-094 when the duplicated collision check
// moved into the shared `appmakerSlug.ts` helper). Two independent things
// are exercised against synthetic fixtures:
//
// 1. checkSharedHelperImplementation() against fixtures shaped like
//    appmakerSlug.ts itself -- the fixed shape (still does the real
//    conductorList('apps') + dir-entry-filter + folded-boolean work) and a
//    regressed shape (conductorList call and filter survive, but the result
//    is no longer folded into the returned boolean).
// 2. checkRouteUsesSharedHelper() against fixtures shaped like the two route
//    files -- the fixed shape (imports and calls `isSlugTaken`, folds its
//    result into the route's own 409) and a pre-fix/regressed shape (no
//    import, no call, back to a bare Prisma-only check).
import assert from 'node:assert/strict'

import {
  checkRouteUsesSharedHelper,
  checkSharedHelperImplementation,
  SCAFFOLD_COLLISION_ROUTES,
} from './verifyAppmakerScaffoldCollisionGuard.js'

const SCAFFOLD_REQUEST_ROUTE = SCAFFOLD_COLLISION_ROUTES.find(
  (r) => r.label === 'scaffold-request.post.ts',
)!
const CREATE_APP_ROUTE = SCAFFOLD_COLLISION_ROUTES.find(
  (r) => r.label === 'create-app.post.ts',
)!

// --- shared helper (appmakerSlug.ts) fixtures ---

const HELPER_FIXED = `
import prisma from '@/server/utils/prisma'
import { conductorList } from '~/server/utils/conductor-github'

export async function isSlugTaken(slug: string): Promise<boolean> {
  const [existingProject, existingDream, scaffoldedApps] = await Promise.all([
    prisma.project.findFirst({
      where: { OR: [{ slug }, { conductorSlug: slug }] },
      select: { id: true },
    }),
    prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
    conductorList('apps'),
  ])

  const alreadyScaffolded = (scaffoldedApps ?? []).some(
    (entry) => entry.type === 'dir' && entry.name === slug,
  )

  return Boolean(existingProject || existingDream || alreadyScaffolded)
}
`

// Pre-fix/regressed shape: no conductorList import or call at all -- back to
// Prisma-only validation.
const HELPER_BUGGY = `
import prisma from '@/server/utils/prisma'

export async function isSlugTaken(slug: string): Promise<boolean> {
  const [existingProject, existingDream] = await Promise.all([
    prisma.project.findFirst({
      where: { OR: [{ slug }, { conductorSlug: slug }] },
      select: { id: true },
    }),
    prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
  ])

  return Boolean(existingProject || existingDream)
}
`

// Partial regression: conductorList is still imported/called and the
// dir-entry filter still exists, but `alreadyScaffolded` was dropped back
// out of the returned boolean -- computed but has no effect.
const HELPER_PARTIALLY_REGRESSED = `
import prisma from '@/server/utils/prisma'
import { conductorList } from '~/server/utils/conductor-github'

export async function isSlugTaken(slug: string): Promise<boolean> {
  const [existingProject, existingDream, scaffoldedApps] = await Promise.all([
    prisma.project.findFirst({
      where: { OR: [{ slug }, { conductorSlug: slug }] },
      select: { id: true },
    }),
    prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
    conductorList('apps'),
  ])

  const alreadyScaffolded = (scaffoldedApps ?? []).some(
    (entry) => entry.type === 'dir' && entry.name === slug,
  )

  return Boolean(existingProject || existingDream)
}
`

// --- route fixtures ---

function scaffoldRequestFixture(body: string): string {
  return `
import { SLUG_RE, slugify, isSlugTaken } from '@/server/utils/appmakerSlug'

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

const SCAFFOLD_REQUEST_FIXED = scaffoldRequestFixture(`
    if (await isSlugTaken(slug)) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
`)

// Pre-fix/regressed shape: no import of the shared helper, inline Prisma-only
// check instead.
const SCAFFOLD_REQUEST_BUGGY = `
export default defineEventHandler(async (event) => {
  try {
    const [existingProject, existingDream] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
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

// Partial regression: isSlugTaken is imported and called, but its result is
// never folded into the "already taken" throw.
const SCAFFOLD_REQUEST_PARTIALLY_REGRESSED = scaffoldRequestFixture(`
    const taken = await isSlugTaken(slug)
    if (false) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
`)

const CREATE_APP_FIXED = scaffoldRequestFixture(`
    const [taken, existingAppRepo] = await Promise.all([
      isSlugTaken(slug),
      prisma.appRepo.findUnique({
        where: { slug_userId: { slug, userId: user.id } },
        select: { id: true },
      }),
    ])

    if (taken || existingAppRepo) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
`)

// Pre-fix/regressed shape for create-app.post.ts: Project/Dream/AppRepo
// checked inline, shared helper never consulted.
const CREATE_APP_BUGGY = `
export default defineEventHandler(async (event) => {
  try {
    const [existingProject, existingDream, existingAppRepo] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
      prisma.appRepo.findUnique({
        where: { slug_userId: { slug, userId: user.id } },
        select: { id: true },
      }),
    ])

    if (existingProject || existingDream || existingAppRepo) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
`

function run(): void {
  // --- shared helper implementation checks ---

  const helperFixedErrors = checkSharedHelperImplementation(HELPER_FIXED)
  assert.deepEqual(
    helperFixedErrors,
    [],
    `expected the fixed helper fixture to pass, got: ${JSON.stringify(helperFixedErrors)}`,
  )

  const helperBuggyErrors = checkSharedHelperImplementation(HELPER_BUGGY)
  assert.equal(
    helperBuggyErrors.length,
    4,
    'expected the pre-fix helper fixture (no import, no conductorList ' +
      'call, no dir-entry filter, no folded boolean) to fail four checks, ' +
      `got: ${JSON.stringify(helperBuggyErrors)}`,
  )
  assert.ok(
    helperBuggyErrors.some((e) => /no longer imports `conductorList`/.test(e)),
  )
  assert.ok(
    helperBuggyErrors.some((e) =>
      /no longer calls conductorList\('apps'\)/.test(e),
    ),
  )
  assert.ok(
    helperBuggyErrors.some((e) =>
      /no longer filters conductorList\('apps'\) entries/.test(e),
    ),
  )
  assert.ok(
    helperBuggyErrors.some((e) =>
      /no longer folds `existingProject \|\| existingDream \|\| alreadyScaffolded`/.test(
        e,
      ),
    ),
  )

  const helperRegressedErrors = checkSharedHelperImplementation(
    HELPER_PARTIALLY_REGRESSED,
  )
  assert.equal(
    helperRegressedErrors.length,
    1,
    'expected the partially-regressed helper fixture to fail only the ' +
      `folded-boolean check, got: ${JSON.stringify(helperRegressedErrors)}`,
  )
  assert.ok(
    helperRegressedErrors.some((e) =>
      /no longer folds `existingProject \|\| existingDream \|\| alreadyScaffolded`/.test(
        e,
      ),
    ),
  )

  // --- route delegation checks ---

  const scaffoldFixedErrors = checkRouteUsesSharedHelper(
    SCAFFOLD_REQUEST_FIXED,
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.deepEqual(
    scaffoldFixedErrors,
    [],
    `expected the fixed scaffold-request fixture to pass, got: ${JSON.stringify(scaffoldFixedErrors)}`,
  )

  const scaffoldBuggyErrors = checkRouteUsesSharedHelper(
    SCAFFOLD_REQUEST_BUGGY,
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.equal(
    scaffoldBuggyErrors.length,
    3,
    'expected the pre-fix scaffold-request fixture (no import, no ' +
      `isSlugTaken call, no folded condition) to fail, got: ${JSON.stringify(scaffoldBuggyErrors)}`,
  )
  assert.ok(
    scaffoldBuggyErrors.some((e) => /no longer imports `isSlugTaken`/.test(e)),
  )
  assert.ok(
    scaffoldBuggyErrors.some((e) =>
      /no longer calls `isSlugTaken\(slug\)`/.test(e),
    ),
  )
  assert.ok(
    scaffoldBuggyErrors.some((e) =>
      /no longer folds `isSlugTaken\(\)`/.test(e),
    ),
  )

  const scaffoldRegressedErrors = checkRouteUsesSharedHelper(
    SCAFFOLD_REQUEST_PARTIALLY_REGRESSED,
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.equal(
    scaffoldRegressedErrors.length,
    1,
    'expected a scaffold-request fixture where isSlugTaken() is called but ' +
      `not folded into the throw to fail only that check, got: ${JSON.stringify(scaffoldRegressedErrors)}`,
  )
  assert.ok(
    scaffoldRegressedErrors.some((e) =>
      /no longer folds `isSlugTaken\(\)`/.test(e),
    ),
  )

  const missingHandler = checkRouteUsesSharedHelper(
    "import { isSlugTaken } from '@/server/utils/appmakerSlug'\nconst somethingElse = 1\n",
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.equal(missingHandler.length, 1)
  assert.ok(missingHandler.some((e) => /Could not find/.test(e)))

  const createAppFixedErrors = checkRouteUsesSharedHelper(
    CREATE_APP_FIXED,
    CREATE_APP_ROUTE.alreadyTakenPattern,
  )
  assert.deepEqual(
    createAppFixedErrors,
    [],
    `expected the fixed create-app fixture to pass, got: ${JSON.stringify(createAppFixedErrors)}`,
  )

  const createAppBuggyErrors = checkRouteUsesSharedHelper(
    CREATE_APP_BUGGY,
    CREATE_APP_ROUTE.alreadyTakenPattern,
  )
  assert.equal(
    createAppBuggyErrors.length,
    3,
    `expected the pre-fix create-app fixture to fail, got: ${JSON.stringify(createAppBuggyErrors)}`,
  )

  console.log(
    'AppMaker scaffold-collision guard self-test passed: the shared ' +
      'appmakerSlug.ts helper fails on its buggy/regressed fixtures and ' +
      'passes on its fixed fixture, and both routes (scaffold-request.post.ts, ' +
      'create-app.post.ts) fail on their pre-fix fixtures, pass on their ' +
      'fixed fixtures, and their partially-regressed fixtures fail only the ' +
      'folded-condition check.',
  )
}

run()
