// /utils/scripts/verifyModelBuilderCommitIdempotencyClaimGuard.test.ts
//
// Regression test for checkCommitIdempotencyClaimGuard() in
// verifyModelBuilderCommitIdempotencyClaimGuard.ts (model-builder/t-029,
// cycle 102). Exercises the real check against synthetic commit.post.ts-shaped
// fixtures covering: the fully-fixed shape (atomic `idempotencyKey: null`
// compare-and-swap claim, `claim.count === 0` short-circuit, and a
// `catch (writeError)` block that resets idempotencyKey to null before
// re-throwing), a regression that drops `idempotencyKey: null` from the
// claim's WHERE clause (the compare-and-swap becomes a bare `id` lookup), a
// regression that drops the reset-on-failure half, a regression that
// swallows writeError instead of re-throwing it, and a fixture missing the
// claim entirely.
import assert from 'node:assert/strict'

import { checkCommitIdempotencyClaimGuard } from './verifyModelBuilderCommitIdempotencyClaimGuard.js'

function fixedFixture(): string {
  return `
export default defineEventHandler(async (event) => {
  try {
    const claim = await prisma.modelBuildItem.updateMany({
      where: { id, idempotencyKey: null },
      data: { idempotencyKey: \`commit:\${id}\` },
    })
    if (claim.count === 0) {
      const fresh = await prisma.modelBuildItem.findUnique({
        where: { id },
        select: { targetType: true, targetId: true },
      })
      return { success: true, data: { alreadyCommitted: true } }
    }

    let target
    try {
      if (plan.action === 'ASSET_ONLY') {
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      }
    } catch (writeError) {
      await prisma.modelBuildItem.updateMany({
        where: { id },
        data: { idempotencyKey: null },
      })
      throw writeError
    }

    return { success: true, data: { target } }
  } catch (error) {
    return errorHandler(error)
  }
})
`
}

// Regression shape: the claim's WHERE clause drops `idempotencyKey: null`,
// leaving only an `id` lookup. This is the same class of regression as a full
// plain read-then-write -- the claim stops being an atomic compare-and-swap,
// so two concurrent requests can both pass it and both proceed to the real
// write -- while keeping every other line (updateMany, claim.count === 0, the
// catch block) intact so only the WHERE-clause check is exercised.
function droppedCompareAndSwapFixture(): string {
  return fixedFixture().replace(
    'where: { id, idempotencyKey: null },',
    'where: { id },',
  )
}

// Regression shape: the catch block no longer resets idempotencyKey on
// failure -- a transient write error permanently wedges the item as claimed.
function noResetOnFailureFixture(): string {
  return fixedFixture().replace(
    "    } catch (writeError) {\n" +
      "      await prisma.modelBuildItem.updateMany({\n" +
      "        where: { id },\n" +
      "        data: { idempotencyKey: null },\n" +
      "      })\n" +
      "      throw writeError\n" +
      "    }",
    '    } catch (writeError) {\n      throw writeError\n    }',
  )
}

// Regression shape: writeError is swallowed instead of re-thrown -- a failed
// commit would report success to the caller.
function swallowedErrorFixture(): string {
  return fixedFixture().replace('throw writeError', '// swallowed')
}

function noClaimFixture(): string {
  return `
export default defineEventHandler(async (event) => {
  try {
    return { success: true }
  } catch (error) {
    return errorHandler(error)
  }
})
`
}

function run(): void {
  const fixedErrors = checkCommitIdempotencyClaimGuard(fixedFixture())
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const droppedErrors = checkCommitIdempotencyClaimGuard(
    droppedCompareAndSwapFixture(),
  )
  assert.equal(
    droppedErrors.length,
    1,
    'expected the dropped-compare-and-swap regression to raise 1 error, got ' +
      `${droppedErrors.length}: ${JSON.stringify(droppedErrors)}`,
  )
  assert.match(droppedErrors[0]!, /compare-and-swap/)

  const noResetErrors = checkCommitIdempotencyClaimGuard(
    noResetOnFailureFixture(),
  )
  assert.equal(
    noResetErrors.length,
    1,
    'expected the missing-reset regression to raise 1 error, got ' +
      `${noResetErrors.length}: ${JSON.stringify(noResetErrors)}`,
  )
  assert.match(noResetErrors[0]!, /does not reset/)

  const swallowedErrors = checkCommitIdempotencyClaimGuard(
    swallowedErrorFixture(),
  )
  assert.equal(
    swallowedErrors.length,
    1,
    'expected the swallowed-error regression to raise 1 error, got ' +
      `${swallowedErrors.length}: ${JSON.stringify(swallowedErrors)}`,
  )
  assert.match(swallowedErrors[0]!, /does not re-throw/)

  const noClaimErrors = checkCommitIdempotencyClaimGuard(noClaimFixture())
  assert.equal(
    noClaimErrors.length,
    1,
    'expected a fixture with no claim at all to fail with 1 "no longer ' +
      `contains" error, got: ${JSON.stringify(noClaimErrors)}`,
  )
  assert.match(noClaimErrors[0]!, /no longer contains/)

  console.log(
    'Model Builder commit idempotency-claim guard self-test passed: fixed ' +
      'fixture passes; a dropped compare-and-swap WHERE clause, a missing ' +
      'reset-on-failure, a swallowed writeError, and a missing claim ' +
      'entirely are each caught.',
  )
}

run()
