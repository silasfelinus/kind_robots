// /utils/scripts/verifyModelBuilderCommitTargetPersistenceGuard.test.ts
//
// Regression test for checkCommitTargetPersistenceGuard() in
// verifyModelBuilderCommitTargetPersistenceGuard.ts (model-builder/t-029
// cycle 27). Exercises the real check against synthetic commit.post.ts-shaped
// fixtures covering: the pre-fix shape (targetType/targetId only written
// inside the final combined stageStatuses update), the fixed shape (an early,
// separate write persists target before the final update, which then only
// carries stageStatuses), and a missing-anchor fixture.
import assert from 'node:assert/strict'

import {
  checkCommitTargetPersistenceGuard,
  splitAroundFinalUpdate,
} from './verifyModelBuilderCommitTargetPersistenceGuard.js'

const BUGGY_FIXTURE = `
    const latest = await prisma.modelBuildItem.findUnique({
      where: { id },
      select: { stageStatuses: true },
    })
    const stages = parseStoredJson<Record<string, unknown>>(
      latest?.stageStatuses ?? item.stageStatuses,
      {},
    )
    stages.COMMIT = {
      status: 'approved',
      note: \`Committed → \${target.type} #\${target.id}\`,
    }

    const updated = await prisma.modelBuildItem.update({
      where: { id },
      data: {
        targetType: target.type,
        targetId: target.id,
        stageStatuses: JSON.stringify(stages),
      },
      include: {
        Artifacts: { orderBy: { id: 'asc' } },
      },
    })
`

const FIXED_FIXTURE = `
    target = await prisma.modelBuildItem
      .update({
        where: { id },
        data: { targetType: target.type, targetId: target.id },
        select: { targetType: true, targetId: true },
      })
      .then((row) => ({
        type: row.targetType as SourceType,
        id: row.targetId as number,
        created: target.created,
        linked: target.linked,
      }))

    const latest = await prisma.modelBuildItem.findUnique({
      where: { id },
      select: { stageStatuses: true },
    })
    const stages = parseStoredJson<Record<string, unknown>>(
      latest?.stageStatuses ?? item.stageStatuses,
      {},
    )
    stages.COMMIT = {
      status: 'approved',
      note: \`Committed → \${target.type} #\${target.id}\`,
    }

    const updated = await prisma.modelBuildItem.update({
      where: { id },
      data: {
        stageStatuses: JSON.stringify(stages),
      },
      include: {
        Artifacts: { orderBy: { id: 'asc' } },
      },
    })
`

function run(): void {
  const buggyErrors = checkCommitTargetPersistenceGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    2,
    'expected the buggy fixture (target only in the combined final write) ' +
      `to fail twice, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /does not durably persist targetType\/targetId/)
  assert.match(buggyErrors[1]!, /exact combined-write shape/)

  const fixedErrors = checkCommitTargetPersistenceGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingAnchorErrors = checkCommitTargetPersistenceGuard(
    'const somethingElse = 1',
  )
  assert.equal(
    missingAnchorErrors.length,
    1,
    'expected a fixture with no `stages.COMMIT = {` / final update anchor ' +
      'to fail with a "could not locate" error',
  )
  assert.match(missingAnchorErrors[0]!, /Could not locate/)

  assert.notEqual(
    splitAroundFinalUpdate(FIXED_FIXTURE),
    null,
    'expected splitAroundFinalUpdate to find both anchors in the fixed fixture',
  )

  console.log(
    'Model Builder commit target-persistence guard self-test passed: buggy ' +
      'fixture fails twice, fixed fixture passes, missing-anchor fixture ' +
      'fails clearly.',
  )
}

run()
