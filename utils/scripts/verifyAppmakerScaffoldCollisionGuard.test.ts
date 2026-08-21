// /utils/scripts/verifyAppmakerScaffoldCollisionGuard.test.ts
//
// Regression test for checkScaffoldCollisionGuard() in
// verifyAppmakerScaffoldCollisionGuard.ts (appmaker/t-012). Exercises the
// real check against synthetic route-shaped fixtures for BOTH covered
// routes -- scaffold-request.post.ts's `existingProject || existingDream ||
// alreadyScaffolded` shape and create-app.post.ts's `existingProject ||
// existingDream || existingAppRepo || alreadyScaffolded` shape -- covering:
// the fixed shape, the pre-fix shape (only Prisma tables checked,
// conductorList never imported/called), and a partial regression (the
// conductorList call and dir-entry filter survive, but the result is no
// longer folded into the "already taken" throw).
import assert from 'node:assert/strict'

import {
  checkScaffoldCollisionGuard,
  SCAFFOLD_COLLISION_ROUTES,
} from './verifyAppmakerScaffoldCollisionGuard.js'

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

const SCAFFOLD_REQUEST_ROUTE = SCAFFOLD_COLLISION_ROUTES.find(
  (r) => r.label === 'scaffold-request.post.ts',
)!
const CREATE_APP_ROUTE = SCAFFOLD_COLLISION_ROUTES.find(
  (r) => r.label === 'create-app.post.ts',
)!

const SCAFFOLD_REQUEST_FIXED = fixture(`
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
const SCAFFOLD_REQUEST_BUGGY = `
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
const SCAFFOLD_REQUEST_PARTIALLY_REGRESSED = fixture(`
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

const CREATE_APP_FIXED = fixture(`
    const [existingProject, existingDream, existingAppRepo, scaffoldedApps] = await Promise.all([
      prisma.project.findFirst({
        where: { OR: [{ slug }, { conductorSlug: slug }] },
        select: { id: true },
      }),
      prisma.dream.findUnique({ where: { slug }, select: { id: true } }),
      prisma.appRepo.findUnique({
        where: { slug_userId: { slug, userId: user.id } },
        select: { id: true },
      }),
      conductorList('apps'),
    ])

    const alreadyScaffolded = (scaffoldedApps ?? []).some(
      (entry) => entry.type === 'dir' && entry.name === slug,
    )

    if (existingProject || existingDream || existingAppRepo || alreadyScaffolded) {
      throw createError({ statusCode: 409, message: \`Slug '\${slug}' is already taken.\` })
    }
`)

// Pre-fix shape for create-app.post.ts: the actual state this repo shipped
// before this cycle's fix -- Project/Dream/AppRepo checked, apps/ folder
// never consulted.
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
  // scaffold-request.post.ts shape
  const fixedErrors = checkScaffoldCollisionGuard(
    SCAFFOLD_REQUEST_FIXED,
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed scaffold-request fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkScaffoldCollisionGuard(
    SCAFFOLD_REQUEST_BUGGY,
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.equal(
    buggyErrors.length,
    4,
    'expected the pre-fix scaffold-request fixture (no import, no ' +
      'conductorList call, no dir-entry filter, no folded condition) to ' +
      `fail all four checks, got: ${JSON.stringify(buggyErrors)}`,
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
    buggyErrors.some((e) => /no longer folds `alreadyScaffolded`/.test(e)),
  )

  const regressedErrors = checkScaffoldCollisionGuard(
    SCAFFOLD_REQUEST_PARTIALLY_REGRESSED,
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.equal(
    regressedErrors.length,
    1,
    'expected a scaffold-request fixture where alreadyScaffolded is ' +
      'computed but not folded into the throw to fail only that ' +
      `assertion, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(
    regressedErrors.some((e) => /no longer folds `alreadyScaffolded`/.test(e)),
  )

  const missingHandler = checkScaffoldCollisionGuard(
    "import { conductorList } from '~/server/utils/conductor-github'\nconst somethingElse = 1\n",
    SCAFFOLD_REQUEST_ROUTE.alreadyTakenPattern,
  )
  assert.equal(missingHandler.length, 1)
  assert.ok(missingHandler.some((e) => /Could not find/.test(e)))

  // create-app.post.ts shape (appmaker/t-009's external-repo flow, fixed
  // this cycle to close the same collision gap)
  const createAppFixedErrors = checkScaffoldCollisionGuard(
    CREATE_APP_FIXED,
    CREATE_APP_ROUTE.alreadyTakenPattern,
  )
  assert.deepEqual(
    createAppFixedErrors,
    [],
    `expected the fixed create-app fixture to pass, got: ${JSON.stringify(createAppFixedErrors)}`,
  )

  const createAppBuggyErrors = checkScaffoldCollisionGuard(
    CREATE_APP_BUGGY,
    CREATE_APP_ROUTE.alreadyTakenPattern,
  )
  assert.equal(
    createAppBuggyErrors.length,
    4,
    'expected the pre-fix create-app fixture to fail all four checks, got: ' +
      `${JSON.stringify(createAppBuggyErrors)}`,
  )

  console.log(
    'AppMaker scaffold-collision guard self-test passed: both covered ' +
      'routes (scaffold-request.post.ts, create-app.post.ts) fail on their ' +
      "buggy fixture, pass on their fixed fixture, and scaffold-request's " +
      'partially-regressed fixture fails only the folded-condition check.',
  )
}

run()
