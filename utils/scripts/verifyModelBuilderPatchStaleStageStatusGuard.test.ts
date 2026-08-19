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

// Mirrors the real fix's shape (model-builder/t-029, cycle 17): a good deal
// of unrelated-looking code (the contentStageChecks re-validation loop, plus
// a conditional revision write) now legitimately sits between the fresh
// findUnique read and the merge assignment it feeds. The old fixed-400-char
// window would have failed this genuinely-correct shape; the check must
// pass it.
const FIXED_PATCH_ROUTE_WITH_CONTENT_CHECKS = `
    const { data, revision, stageStatusChanges, contentStageChecks } =
      prepareItemUpdate(existing, body, actor)
    const item = await prisma.$transaction(async (tx) => {
      const fresh =
        stageStatusChanges || contentStageChecks.length
          ? await tx.modelBuildItem.findUnique({
              where: { id },
              select: { stageStatuses: true },
            })
          : null
      for (const { stageKey, fieldLabel } of contentStageChecks) {
        assertContentStageEditable(fresh?.stageStatuses, stageKey, fieldLabel)
      }
      if (revision) {
        await tx.modelBuildRevision.create({
          data: { itemId: id, ...revision },
        })
      }
      if (stageStatusChanges) {
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

// The inverse defect this widened check must still catch: another write
// landing BETWEEN the fresh read and the merge that consumes it -- the read
// would no longer be "immediately before the write" once something else
// writes to the item first, reopening exactly the staleness window this
// whole guard exists to close. Distance-independent, so this can only be
// caught by checking write-vs-read-vs-merge ordering explicitly, not a
// character window.
const WRITE_BETWEEN_READ_AND_MERGE_PATCH_ROUTE = `
    const { data, revision, stageStatusChanges } = prepareItemUpdate(existing, body, actor)
    const item = await prisma.$transaction(async (tx) => {
      const fresh = await tx.modelBuildItem.findUnique({
        where: { id },
        select: { stageStatuses: true },
      })
      await tx.modelBuildItem.update({
        where: { id },
        data: { touchedAt: new Date() },
        include: itemInclude,
      })
      data.stageStatuses = mergeStageStatusChanges(
        fresh?.stageStatuses,
        stageStatusChanges,
      )
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
    2,
    'expected the missing-fresh-read fixture (merges onto `existing`, not a ' +
      'fresh findUnique) to fail twice -- once for referencing `existing` ' +
      `directly, once for no findUnique preceding it -- got: ${JSON.stringify(missingFreshReadErrors)}`,
  )
  assert.match(missingFreshReadErrors[0]!, /references `existing`/)
  assert.match(missingFreshReadErrors[1]!, /no `findUnique/)

  // The widened, distance-independent check must still pass the real fix's
  // actual shape -- a good deal of legitimate validation code (the
  // contentStageChecks loop, a conditional revision write) between the
  // fresh read and the merge, which the old fixed-400-char window did not
  // survive.
  const withContentChecksErrors = checkPatchRouteFreshMerge(
    FIXED_PATCH_ROUTE_WITH_CONTENT_CHECKS,
    'fixture-route.ts',
  )
  assert.deepEqual(
    withContentChecksErrors,
    [],
    'expected the fixed-with-content-checks fixture (fresh read separated ' +
      'from its merge by legitimate validation code) to pass, got: ' +
      JSON.stringify(withContentChecksErrors),
  )

  // The inverse ordering defect: a write landing BETWEEN the fresh read and
  // the merge that consumes it must still fail, distance-independent window
  // or not.
  const writeBetweenErrors = checkPatchRouteFreshMerge(
    WRITE_BETWEEN_READ_AND_MERGE_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.equal(
    writeBetweenErrors.length,
    1,
    'expected the write-between-read-and-merge fixture to fail once, got: ' +
      JSON.stringify(writeBetweenErrors),
  )
  assert.match(writeBetweenErrors[0]!, /before its own stageStatuses/)

  console.log(
    'Model Builder PATCH stale stage-status guard self-test passed: buggy ' +
      'fixtures fail with the expected messages, fixed fixtures pass.',
  )
}

run()
