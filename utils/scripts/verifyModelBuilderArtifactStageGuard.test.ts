// /utils/scripts/verifyModelBuilderArtifactStageGuard.test.ts
//
// Regression test for checkArtifactStageGuard() in
// verifyModelBuilderArtifactStageGuard.ts (model-builder/t-029 cycle 28).
// Exercises the real check against synthetic artifacts.post.ts-shaped
// fixtures covering: the pre-fix shape (no stage gate at all, a bare
// `prisma.modelBuildArtifact.create`), a partial fix (only the eager check,
// no fresh-read re-check inside a transaction -- still leaves the TOCTOU gap
// open), and the fully fixed shape.
import assert from 'node:assert/strict'

import { checkArtifactStageGuard } from './verifyModelBuilderArtifactStageGuard.js'

const BUGGY_FIXTURE = `
    assertRunAccess(item.Run, auth.user)
    assertRunWritable(item.Run)

    const body = await readBody<ArtifactBody>(event)
    if (typeof body.kind !== 'string' || !body.kind.trim()) {
      throw createError({ statusCode: 400, message: 'Artifact "kind" is required.' })
    }
    await assertArtImageAttachable(body.artImageId, auth.user.id, auth.isAdmin)

    const artifact = await prisma.modelBuildArtifact.create({
      data: {
        itemId,
        kind: body.kind.slice(0, 64),
      },
    })
`

const PARTIAL_FIXTURE = `
    assertRunAccess(item.Run, auth.user)
    assertRunWritable(item.Run)
    assertContentStageEditable(
      item.stageStatuses,
      'GENERATE_ASSETS',
      'Art image',
    )

    const body = await readBody<ArtifactBody>(event)
    await assertArtImageAttachable(body.artImageId, auth.user.id, auth.isAdmin)

    const artifact = await prisma.modelBuildArtifact.create({
      data: {
        itemId,
        kind: body.kind!.slice(0, 64),
      },
    })
`

const FIXED_FIXTURE = `
    assertRunAccess(item.Run, auth.user)
    assertRunWritable(item.Run)
    assertContentStageEditable(
      item.stageStatuses,
      'GENERATE_ASSETS',
      'Art image',
    )

    const body = await readBody<ArtifactBody>(event)
    await assertArtImageAttachable(body.artImageId, auth.user.id, auth.isAdmin)

    const artifact = await prisma.$transaction(async (tx) => {
      const fresh = await tx.modelBuildItem.findUnique({
        where: { id: itemId },
        select: { stageStatuses: true },
      })
      assertContentStageEditable(
        fresh?.stageStatuses,
        'GENERATE_ASSETS',
        'Art image',
      )
      return tx.modelBuildArtifact.create({
        data: {
          itemId,
          kind: body.kind!.slice(0, 64),
        },
      })
    })
`

function run(): void {
  const buggyErrors = checkArtifactStageGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    3,
    'expected the buggy fixture (no gate at all, bare create outside any ' +
      `transaction) to fail three ways, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /0 time\(s\), expected at least 2/)
  assert.match(
    buggyErrors[1]!,
    /does not wrap a `tx\.modelBuildItem\.findUnique`/,
  )
  assert.match(
    buggyErrors[2]!,
    /still calls `prisma\.modelBuildArtifact\.create`/,
  )

  const partialErrors = checkArtifactStageGuard(PARTIAL_FIXTURE)
  assert.equal(
    partialErrors.length,
    3,
    'expected the partial fixture (eager check only, no transaction ' +
      're-check, bare create) to fail three ways, got: ' +
      JSON.stringify(partialErrors),
  )
  assert.match(partialErrors[0]!, /1 time\(s\), expected at least 2/)
  assert.match(
    partialErrors[1]!,
    /does not wrap a `tx\.modelBuildItem\.findUnique`/,
  )
  assert.match(
    partialErrors[2]!,
    /still calls `prisma\.modelBuildArtifact\.create`/,
  )

  const fixedErrors = checkArtifactStageGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // A regression that reintroduces a bare, ungated create alongside the
  // transaction (e.g. a stray leftover call) must still fail even though
  // both assertContentStageEditable calls are present.
  const bareCreateAlongsideFixed = `${FIXED_FIXTURE}\n    const stray = await prisma.modelBuildArtifact.create({ data: { itemId } })\n`
  const strayErrors = checkArtifactStageGuard(bareCreateAlongsideFixed)
  assert.equal(
    strayErrors.length,
    1,
    `expected exactly the bare-create error, got: ${JSON.stringify(strayErrors)}`,
  )
  assert.match(
    strayErrors[0]!,
    /still calls `prisma\.modelBuildArtifact\.create`/,
  )

  console.log(
    'Model Builder artifact-stage guard self-test passed: buggy fixture ' +
      'fails three ways, partial fixture fails three ways, fixed fixture ' +
      'passes, a stray bare create alongside the fix still fails.',
  )
}

run()
