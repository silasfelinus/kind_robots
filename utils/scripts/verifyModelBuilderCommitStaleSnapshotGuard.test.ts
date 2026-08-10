// /utils/scripts/verifyModelBuilderCommitStaleSnapshotGuard.test.ts
//
// Regression test for checkCommitStaleSnapshotGuard() in
// verifyModelBuilderCommitStaleSnapshotGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic commit.post.ts-shaped fixtures
// covering: the pre-fix shape (stages built solely from the request-start
// `item.stageStatuses` snapshot, the exact bug found by manual read-through),
// the fixed shape (a fresh `findUnique` read merged in immediately before the
// COMMIT assignment), and a missing-anchor fixture.
import assert from 'node:assert/strict'

import { checkCommitStaleSnapshotGuard } from './verifyModelBuilderCommitStaleSnapshotGuard.js'

const BUGGY_FIXTURE = `
    const stages = parseStoredJson<Record<string, unknown>>(
      item.stageStatuses,
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
    })
`

const FIXED_FIXTURE = `
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
    })
`

function run(): void {
  const buggyErrors = checkCommitStaleSnapshotGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    2,
    'expected the buggy fixture (no fresh findUnique re-read) to fail ' +
      `twice, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /does not re-read stageStatuses/)
  assert.match(buggyErrors[1]!, /exact stale-snapshot shape/)

  const fixedErrors = checkCommitStaleSnapshotGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingAnchorErrors = checkCommitStaleSnapshotGuard(
    'const somethingElse = 1',
  )
  assert.equal(
    missingAnchorErrors.length,
    1,
    'expected a fixture with no `stages.COMMIT = {` assignment to fail ' +
      'with a "could not find" error',
  )
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Model Builder commit stale-snapshot guard self-test passed: buggy ' +
      'fixture fails twice, fixed fixture passes, missing-anchor fixture ' +
      'fails clearly.',
  )
}

run()
