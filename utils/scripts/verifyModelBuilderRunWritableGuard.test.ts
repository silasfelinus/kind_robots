// /utils/scripts/verifyModelBuilderRunWritableGuard.test.ts
//
// Regression test for checkRunWritableGuard() in
// verifyModelBuilderRunWritableGuard.ts (model-builder/t-039). Exercises the
// real check against synthetic route-shaped fixtures covering: the pre-fix
// shape (assertRunAccess present, assertRunWritable missing entirely -- the
// exact gap PR #1239 closed), the fixed shape (assertRunWritable immediately
// follows assertRunAccess for the same run reference), a reordered shape
// (assertRunWritable present but before assertRunAccess, which this guard
// still flags since the anchor is "immediately after"), and assertRunAccess
// itself being absent entirely. Runs each fixture against two different
// runVar shapes (existing.Run and item.Run) to confirm the dot-escaping in
// the generated regex works for either.
import assert from 'node:assert/strict'

import { checkRunWritableGuard } from './verifyModelBuilderRunWritableGuard.js'

const EXISTING_ROUTE = {
  relativePath: 'server/api/model-builder/items/[id].patch.ts',
  runVar: 'existing.Run',
}

const ITEM_ROUTE = {
  relativePath: 'server/api/model-builder/items/[id]/commit.post.ts',
  runVar: 'item.Run',
}

function buggyFixture(runVar: string): string {
  return `
export default defineEventHandler(async (event) => {
  try {
    const existing = await prisma.modelBuildItem.findUnique({ where: { id } })
    assertRunAccess(${runVar}, auth.user)

    const body = await readBody(event)
    return { success: true }
  } catch (error) {
    return errorHandler(error, event)
  }
})
`
}

function fixedFixture(runVar: string): string {
  return `
export default defineEventHandler(async (event) => {
  try {
    const existing = await prisma.modelBuildItem.findUnique({ where: { id } })
    assertRunAccess(${runVar}, auth.user)
    assertRunWritable(${runVar})

    const body = await readBody(event)
    return { success: true }
  } catch (error) {
    return errorHandler(error, event)
  }
})
`
}

function reorderedFixture(runVar: string): string {
  return `
export default defineEventHandler(async (event) => {
  try {
    const existing = await prisma.modelBuildItem.findUnique({ where: { id } })
    assertRunWritable(${runVar})
    assertRunAccess(${runVar}, auth.user)

    const body = await readBody(event)
    return { success: true }
  } catch (error) {
    return errorHandler(error, event)
  }
})
`
}

const MISSING_ACCESS_FIXTURE = `
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    return { success: true }
  } catch (error) {
    return errorHandler(error, event)
  }
})
`

for (const route of [EXISTING_ROUTE, ITEM_ROUTE]) {
  const buggyErrors = checkRunWritableGuard(buggyFixture(route.runVar), route)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the pre-fix shape (assertRunAccess present, assertRunWritable ` +
      `missing) for ${route.runVar} to raise 1 error, got ${buggyErrors.length}: ` +
      JSON.stringify(buggyErrors),
  )
  assert.ok(buggyErrors[0]!.includes('assertRunWritable'))

  const fixedErrors = checkRunWritableGuard(fixedFixture(route.runVar), route)
  assert.equal(
    fixedErrors.length,
    0,
    `expected the fixed shape for ${route.runVar} to raise no errors, got: ` +
      JSON.stringify(fixedErrors),
  )

  const reorderedErrors = checkRunWritableGuard(
    reorderedFixture(route.runVar),
    route,
  )
  assert.equal(
    reorderedErrors.length,
    1,
    `expected assertRunWritable appearing before assertRunAccess for ` +
      `${route.runVar} to still raise 1 error (wrong anchor order), got ` +
      `${reorderedErrors.length}: ${JSON.stringify(reorderedErrors)}`,
  )

  const missingAccessErrors = checkRunWritableGuard(
    MISSING_ACCESS_FIXTURE,
    route,
  )
  assert.equal(
    missingAccessErrors.length,
    1,
    `expected assertRunAccess being absent entirely for ${route.runVar} to ` +
      `raise 1 error, got ${missingAccessErrors.length}: ` +
      JSON.stringify(missingAccessErrors),
  )
  assert.ok(missingAccessErrors[0]!.includes('assertRunAccess'))
}

console.log(
  'Model Builder run-writable guard checker verified: flags the pre-fix ' +
    'shape (assertRunAccess present, assertRunWritable missing), a ' +
    'reordered shape (assertRunWritable before assertRunAccess), clears the ' +
    'fully-fixed shape, and flags assertRunAccess being absent entirely -- ' +
    'for both existing.Run and item.Run runVar shapes.',
)
