// /utils/scripts/verifyModelBuilderPatchStaleStageStatusGuard.test.ts
//
// Regression test for verifyModelBuilderPatchStaleStageStatusGuard.ts
// (model-builder/t-029). Exercises the real checks against synthetic
// runs/index.ts- and PATCH-route-shaped fixtures covering: the pre-fix
// shape (blind wholesale stageStatuses overwrite / missing fresh-merge), the
// fixed shape (diff + fresh-read + merge), and a missing-anchor fixture.
import assert from 'node:assert/strict'

import {
  checkPatchRouteFreshMerge,
  checkRunsIndexNoBlindOverwrite,
} from './verifyModelBuilderPatchStaleStageStatusGuard.js'

const BUGGY_RUNS_INDEX = `
  if (body.stageStatuses !== undefined && body.stageStatuses !== null) {
    const stageStatuses = normalizeJson(body.stageStatuses)
    if (typeof stageStatuses === 'string') data.stageStatuses = stageStatuses
  }
`

const FIXED_RUNS_INDEX = `
  let stageStatusChanges: Record<string, unknown> | null = null
  if (body.stageStatuses !== undefined && body.stageStatuses !== null) {
    const stageStatuses = normalizeJson(body.stageStatuses)
    if (typeof stageStatuses === 'string') {
      stageStatusChanges = diffStageStatusChanges(
        existing.stageStatuses,
        stageStatuses,
      )
    }
  }

  export function diffStageStatusChanges(a: unknown, b: string) {
    return null
  }

  export function mergeStageStatusChanges(a: unknown, b: unknown) {
    return undefined
  }
`

const BUGGY_PATCH_ROUTE = `
    const { data, revision } = prepareItemUpdate(existing, body, actor)
    const item = await prisma.$transaction(async (tx) => {
      return tx.modelBuildItem.update({
        where: { id },
        data,
        include: itemInclude,
      })
    })
`

const FIXED_PATCH_ROUTE = `
    const { data, revision, stageStatusChanges } = prepareItemUpdate(existing, body, actor)
    const item = await prisma.$transaction(async (tx) => {
      if (stageStatusChanges) {
        const fresh = await tx.modelBuildItem.findUnique({
          where: { id },
          select: { stageStatuses: true },
        })
        data.stageStatuses = mergeStageStatusChanges(
          fresh?.stageStatuses,
          stageStatusChanges,
        )
      }
      return tx.modelBuildItem.update({
        where: { id },
        data,
        include: itemInclude,
      })
    })
`

const MISSING_FRESH_READ_PATCH_ROUTE = `
    const { data, revision, stageStatusChanges } = prepareItemUpdate(existing, body, actor)
    if (stageStatusChanges) {
      data.stageStatuses = mergeStageStatusChanges(
        existing.stageStatuses,
        stageStatusChanges,
      )
    }
    const item = await prisma.$transaction(async (tx) => {
      return tx.modelBuildItem.update({
        where: { id },
        data,
        include: itemInclude,
      })
    })
`

function run(): void {
  const buggyRunsIndexErrors = checkRunsIndexNoBlindOverwrite(BUGGY_RUNS_INDEX)
  assert.equal(
    buggyRunsIndexErrors.length,
    3,
    'expected the buggy runs/index.ts fixture to fail for the blind ' +
      `overwrite and both missing exports, got: ${JSON.stringify(buggyRunsIndexErrors)}`,
  )
  assert.match(buggyRunsIndexErrors[0]!, /still contains/)
  assert.match(buggyRunsIndexErrors[1]!, /diffStageStatusChanges/)
  assert.match(buggyRunsIndexErrors[2]!, /mergeStageStatusChanges/)

  const fixedRunsIndexErrors = checkRunsIndexNoBlindOverwrite(FIXED_RUNS_INDEX)
  assert.deepEqual(
    fixedRunsIndexErrors,
    [],
    `expected the fixed runs/index.ts fixture to pass, got: ${JSON.stringify(fixedRunsIndexErrors)}`,
  )

  const buggyRouteErrors = checkPatchRouteFreshMerge(
    BUGGY_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.equal(
    buggyRouteErrors.length,
    1,
    `expected the buggy PATCH route fixture to fail once, got: ${JSON.stringify(buggyRouteErrors)}`,
  )
  assert.match(buggyRouteErrors[0]!, /does not call/)

  const fixedRouteErrors = checkPatchRouteFreshMerge(
    FIXED_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.deepEqual(
    fixedRouteErrors,
    [],
    `expected the fixed PATCH route fixture to pass, got: ${JSON.stringify(fixedRouteErrors)}`,
  )

  const missingFreshReadErrors = checkPatchRouteFreshMerge(
    MISSING_FRESH_READ_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.equal(
    missingFreshReadErrors.length,
    1,
    'expected the missing-fresh-read fixture (merges onto `existing`, not a ' +
      `fresh findUnique) to fail once, got: ${JSON.stringify(missingFreshReadErrors)}`,
  )
  assert.match(missingFreshReadErrors[0]!, /no nearby/)

  console.log(
    'Model Builder PATCH stale stage-status guard self-test passed: buggy ' +
      'fixtures fail with the expected messages, fixed fixtures pass.',
  )
}

run()
