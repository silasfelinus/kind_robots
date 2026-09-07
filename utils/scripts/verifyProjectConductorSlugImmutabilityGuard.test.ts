// /utils/scripts/verifyProjectConductorSlugImmutabilityGuard.test.ts
//
// Self-test for checkConductorSlugImmutabilityGuard() in
// verifyProjectConductorSlugImmutabilityGuard.ts (kind-robots/t-061).
// Exercises the real check against synthetic route-shaped fixtures: the
// fixed shape (reads `existing.conductorSlug`, throws 409 on a mismatch),
// the pre-fix shape (accepts any new value unconditionally), and a partial
// regression (still reads `existing.conductorSlug` but no longer throws).
import assert from 'node:assert/strict'

import { checkConductorSlugImmutabilityGuard } from './verifyProjectConductorSlugImmutabilityGuard.js'

const FIXED = `
export default defineEventHandler(async (event) => {
  try {
    if (body.conductorSlug !== undefined) {
      const nextConductorSlug = normalizeSlug(body.conductorSlug)
      if (
        existing.conductorSlug &&
        nextConductorSlug !== existing.conductorSlug
      ) {
        throw createError({
          statusCode: 409,
          message: \`conductorSlug is immutable once set (already linked to '\${existing.conductorSlug}').\`,
        })
      }
      data.conductorSlug = nextConductorSlug
    }
  } catch (error) {
    return errorHandler(error)
  }
})
`

// Pre-fix shape: any owner-supplied conductorSlug is accepted unconditionally,
// even once the project is already linked to Conductor.
const BUGGY = `
export default defineEventHandler(async (event) => {
  try {
    if (body.conductorSlug !== undefined) {
      data.conductorSlug = normalizeSlug(body.conductorSlug)
    }
  } catch (error) {
    return errorHandler(error)
  }
})
`

// Partial regression: the already-set value is still read (maybe for a log
// line or unrelated check), but the block no longer rejects a mismatch.
const PARTIALLY_REGRESSED = `
export default defineEventHandler(async (event) => {
  try {
    if (body.conductorSlug !== undefined) {
      const nextConductorSlug = normalizeSlug(body.conductorSlug)
      console.log('existing.conductorSlug was', existing.conductorSlug)
      data.conductorSlug = nextConductorSlug
    }
  } catch (error) {
    return errorHandler(error)
  }
})
`

function run(): void {
  const fixedErrors = checkConductorSlugImmutabilityGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkConductorSlugImmutabilityGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    2,
    'expected the pre-fix fixture (no existing.conductorSlug read, no 409) ' +
      `to fail both checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /no longer reads `existing\.conductorSlug`/.test(e)),
  )
  assert.ok(buggyErrors.some((e) => /no longer throws a 409/.test(e)))

  const regressedErrors = checkConductorSlugImmutabilityGuard(
    PARTIALLY_REGRESSED,
  )
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture that reads existing.conductorSlug but never throws ' +
      `to fail only the 409 check, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(regressedErrors.some((e) => /no longer throws a 409/.test(e)))

  const missingBlock = checkConductorSlugImmutabilityGuard(
    'export default defineEventHandler(async (event) => {\n  return {}\n})\n',
  )
  assert.equal(missingBlock.length, 1)
  assert.ok(missingBlock.some((e) => /Could not find/.test(e)))

  console.log(
    'conductorSlug immutability guard self-test passed: fails on the ' +
      'buggy fixture, passes on the fixed fixture, and the partially ' +
      'regressed fixture fails only the missing-409 check.',
  )
}

run()
