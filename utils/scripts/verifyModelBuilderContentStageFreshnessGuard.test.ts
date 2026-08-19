// /utils/scripts/verifyModelBuilderContentStageFreshnessGuard.test.ts
//
// Regression test for verifyModelBuilderContentStageFreshnessGuard.ts
// (model-builder/t-029, cycle 17). Exercises the real checks against
// synthetic runs/index.ts- and PATCH-route-shaped fixtures covering: the
// pre-fix shape (eager check only, against `existing`, never replayed at
// write time), the fixed shape (re-checked inside the transaction against a
// fresh `findUnique` read), and a still-stale-inside-the-transaction
// fixture (the subtle near-miss -- calls assertContentStageEditable a
// second time, but still passes `existing` instead of the fresh value).
import assert from 'node:assert/strict'

import {
  checkPatchRouteFreshContentCheck,
  checkRunsIndexExportsFreshnessPieces,
} from './verifyModelBuilderContentStageFreshnessGuard.js'

const BUGGY_RUNS_INDEX = `
  function assertContentStageEditable(stageStatuses, stageKey, fieldLabel) {
    // ...
  }

  export function prepareItemUpdate(existing, body, actor) {
    const data = {}
    if (body.pitch !== undefined) {
      assertContentStageEditable(existing.stageStatuses, 'PITCH', 'Pitch')
      data.pitch = normalizeText(body.pitch)
    }
    return { data, revision: null, stageStatusChanges: null }
  }
`

const FIXED_RUNS_INDEX = `
  export function assertContentStageEditable(stageStatuses, stageKey, fieldLabel) {
    // ...
  }

  export function prepareItemUpdate(existing, body, actor) {
    const data = {}
    const contentStageChecks: PreparedItemUpdate['contentStageChecks'] = []
    if (body.pitch !== undefined) {
      assertContentStageEditable(existing.stageStatuses, 'PITCH', 'Pitch')
      contentStageChecks.push({ stageKey: 'PITCH', fieldLabel: 'Pitch' })
      data.pitch = normalizeText(body.pitch)
    }
    if (body.fieldsDraft !== undefined) {
      assertContentStageEditable(existing.stageStatuses, 'FIELDS_AND_PROMPTS', 'Fields')
      contentStageChecks.push({ stageKey: 'FIELDS_AND_PROMPTS', fieldLabel: 'Fields' })
      data.fieldsDraft = normalizeText(body.fieldsDraft)
    }
    if (body.promptDraft !== undefined) {
      assertContentStageEditable(existing.stageStatuses, 'FIELDS_AND_PROMPTS', 'Prompt')
      contentStageChecks.push({ stageKey: 'FIELDS_AND_PROMPTS', fieldLabel: 'Prompt' })
      data.promptDraft = normalizeText(body.promptDraft)
    }
    if (body.artImageId !== undefined) {
      assertContentStageEditable(existing.stageStatuses, 'GENERATE_ASSETS', 'Art image')
      contentStageChecks.push({ stageKey: 'GENERATE_ASSETS', fieldLabel: 'Art image' })
      data.artImageId = normalizeNullableId(body.artImageId)
    }
    return { data, revision: null, stageStatusChanges: null, contentStageChecks }
  }
`

const BUGGY_PATCH_ROUTE = `
    const { data, revision, stageStatusChanges, contentStageChecks } =
      prepareItemUpdate(existing, body, actor)
    const item = await prisma.$transaction(async (tx) => {
      if (revision) {
        await tx.modelBuildRevision.create({ data: { itemId: id, ...revision } })
      }
      if (stageStatusChanges) {
        const fresh = await tx.modelBuildItem.findUnique({
          where: { id },
          select: { stageStatuses: true },
        })
        data.stageStatuses = mergeStageStatusChanges(fresh?.stageStatuses, stageStatusChanges)
      }
      return tx.modelBuildItem.update({ where: { id }, data, include: itemInclude })
    })
`

const FIXED_PATCH_ROUTE = `
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
        await tx.modelBuildRevision.create({ data: { itemId: id, ...revision } })
      }
      if (stageStatusChanges) {
        data.stageStatuses = mergeStageStatusChanges(fresh?.stageStatuses, stageStatusChanges)
      }
      return tx.modelBuildItem.update({ where: { id }, data, include: itemInclude })
    })
`

// The subtle near-miss: assertContentStageEditable IS called a second time,
// inside the transaction -- but still against `existing`, not the fresh
// read. This would satisfy a check that only asked "is it called twice?"
// without also inspecting what each call was actually passed.
const STILL_STALE_PATCH_ROUTE = `
    const { data, revision, stageStatusChanges, contentStageChecks } =
      prepareItemUpdate(existing, body, actor)
    const item = await prisma.$transaction(async (tx) => {
      const fresh = await tx.modelBuildItem.findUnique({
        where: { id },
        select: { stageStatuses: true },
      })
      for (const { stageKey, fieldLabel } of contentStageChecks) {
        assertContentStageEditable(existing.stageStatuses, stageKey, fieldLabel)
      }
      if (stageStatusChanges) {
        data.stageStatuses = mergeStageStatusChanges(fresh?.stageStatuses, stageStatusChanges)
      }
      return tx.modelBuildItem.update({ where: { id }, data, include: itemInclude })
    })
`

function run(): void {
  const buggyRunsIndexErrors =
    checkRunsIndexExportsFreshnessPieces(BUGGY_RUNS_INDEX)
  assert.equal(
    buggyRunsIndexErrors.length,
    3,
    'expected the buggy runs/index.ts fixture (private helper, no ' +
      `accumulator, no pushes) to fail three times, got: ${JSON.stringify(buggyRunsIndexErrors)}`,
  )
  assert.match(buggyRunsIndexErrors[0]!, /no longer exports/)
  assert.match(buggyRunsIndexErrors[1]!, /no longer initializes/)
  assert.match(
    buggyRunsIndexErrors[2]!,
    /only pushes onto contentStageChecks 0/,
  )

  const fixedRunsIndexErrors =
    checkRunsIndexExportsFreshnessPieces(FIXED_RUNS_INDEX)
  assert.deepEqual(
    fixedRunsIndexErrors,
    [],
    `expected the fixed runs/index.ts fixture to pass, got: ${JSON.stringify(fixedRunsIndexErrors)}`,
  )

  const buggyRouteErrors = checkPatchRouteFreshContentCheck(
    BUGGY_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.equal(
    buggyRouteErrors.length,
    1,
    `expected the buggy PATCH route fixture (no re-check at all) to fail ` +
      `once, got: ${JSON.stringify(buggyRouteErrors)}`,
  )
  assert.match(buggyRouteErrors[0]!, /never calls assertContentStageEditable/)

  const fixedRouteErrors = checkPatchRouteFreshContentCheck(
    FIXED_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.deepEqual(
    fixedRouteErrors,
    [],
    `expected the fixed PATCH route fixture to pass, got: ${JSON.stringify(fixedRouteErrors)}`,
  )

  const stillStaleErrors = checkPatchRouteFreshContentCheck(
    STILL_STALE_PATCH_ROUTE,
    'fixture-route.ts',
  )
  assert.equal(
    stillStaleErrors.length,
    1,
    'expected the still-stale fixture (re-checked, but against `existing`) ' +
      `to fail once, got: ${JSON.stringify(stillStaleErrors)}`,
  )
  assert.match(stillStaleErrors[0]!, /references `existing`/)

  console.log(
    'Model Builder content-stage freshness guard self-test passed: buggy ' +
      'and still-stale fixtures fail with the expected messages, fixed ' +
      'fixtures pass.',
  )
}

run()
