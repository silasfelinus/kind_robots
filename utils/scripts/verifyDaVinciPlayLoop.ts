// utils/scripts/verifyDaVinciPlayLoop.ts
//
// Headless regression check for the Da Vinci play loop (davinci/t-011).
// Drives server/utils/davinci.ts's functions directly — create-run ->
// record-choice -> resolve -> re-resolve -> reject-a-late-choice — so the
// whole loop gets coverage without a dev server or auth session. Calls the
// exact functions the live API handlers (server/api/davinci/runs/**) call,
// so this catches regressions in the same code path production traffic hits.
//
// Requires at least one LifeEnding seeded for the all-pass outcomeKey
// ("1111111111...", one '1' per DAVINCI_DIMENSIONS entry) — run
// `npm run seed:davinci:verify` (or `seed:davinci -- --write`) against the
// same database first.
//
// Point it at a scratch database — it WRITES (a throwaway User, LifeRun,
// LifeChoice, LifeStat, and award rows). Cleans up everything it creates in
// a `finally` block so a re-run against a persisted database stays
// idempotent, but this is still not meant for production data.
//
// Usage:
//   npm run seed:davinci:playloop-verify
//
// Requires DATABASE_URL.

import 'dotenv/config'
import prisma from '../../server/utils/prisma'
import {
  DAVINCI_DIMENSIONS,
  createLifeRun,
  recordLifeChoice,
  resolveLifeRunEnding,
  resolveOutcomeKey,
} from '../../server/utils/davinci'

const TEST_USERNAME = 'davinci-playloop-verify'

let failures = 0
function check(cond: unknown, label: string): void {
  if (cond) {
    console.log(`  ok: ${label}`)
  } else {
    failures += 1
    console.error(`  FAIL: ${label}`)
  }
}

async function main() {
  const user = await prisma.user.upsert({
    where: { username: TEST_USERNAME },
    create: { username: TEST_USERNAME },
    update: {},
  })

  try {
    console.log('1. create run')
    const run = await createLifeRun(user.id, { title: 'Play loop verify run' })
    check(run.status === 'ACTIVE', `run starts ACTIVE (${run.status})`)
    check(run.userId === user.id, 'run is owned by the test user')

    console.log('2. record choice (pass every dimension)')
    const effects = Object.fromEntries(
      DAVINCI_DIMENSIONS.map((dimension) => [dimension, 1]),
    )
    const { choice, stats } = await recordLifeChoice(run.id, user.id, {
      chapter: 1,
      prompt: 'Test prompt',
      choiceText: 'Test choice',
      effects,
    })
    check(choice.lifeRunId === run.id, 'choice recorded against the run')
    check(
      stats.length === DAVINCI_DIMENSIONS.length,
      `all ${DAVINCI_DIMENSIONS.length} dimensions got a LifeStat row (${stats.length})`,
    )

    console.log('3. resolve')
    const expectedOutcomeKey = resolveOutcomeKey(
      Object.fromEntries(stats.map((stat) => [stat.key, stat.value])),
    )
    check(
      expectedOutcomeKey === '1'.repeat(DAVINCI_DIMENSIONS.length),
      `all-pass choice yields the all-pass outcomeKey (${expectedOutcomeKey})`,
    )
    const firstResolve = await resolveLifeRunEnding(
      run.id,
      user.id,
      user.username,
    )
    check(
      firstResolve.outcomeKey === expectedOutcomeKey,
      `resolve derives the expected outcomeKey (${firstResolve.outcomeKey})`,
    )
    check(
      firstResolve.achievementAwarded,
      'first resolve awards the Achievement',
    )
    check(
      firstResolve.lifeAchievementAwarded,
      'first resolve awards the LifeAchievement',
    )

    console.log('4. re-resolve (COMPLETE guard, davinci/t-011)')
    const secondResolve = await resolveLifeRunEnding(
      run.id,
      user.id,
      user.username,
    )
    check(
      secondResolve.outcomeKey === firstResolve.outcomeKey,
      're-resolve returns the same outcomeKey',
    )
    check(
      secondResolve.ending.id === firstResolve.ending.id,
      're-resolve returns the same ending',
    )
    check(
      secondResolve.achievementAwarded === false,
      're-resolve does not re-award the Achievement',
    )
    check(
      secondResolve.lifeAchievementAwarded === false,
      're-resolve does not re-award the LifeAchievement',
    )
    check(
      secondResolve.achievementRecordId === firstResolve.achievementRecordId,
      're-resolve reports the same AchievementRecord id',
    )
    check(
      secondResolve.unlockId === firstResolve.unlockId,
      're-resolve reports the same LifeAchievementUnlock id',
    )

    console.log('5. choices rejected on a COMPLETE run')
    let rejected = false
    let statusCode: number | undefined
    try {
      await recordLifeChoice(run.id, user.id, {
        chapter: 2,
        prompt: 'Too late',
        choiceText: 'Should be rejected',
      })
    } catch (error) {
      rejected = true
      statusCode = (error as { statusCode?: number }).statusCode
    }
    check(rejected, 'a choice on a COMPLETE run throws')
    check(
      statusCode === 409,
      `rejection carries a 409 status (got ${statusCode})`,
    )

    if (failures > 0) {
      console.error(`\n${failures} check(s) FAILED`)
      process.exitCode = 1
    } else {
      console.log('\nALL PLAY LOOP CHECKS PASSED')
    }
  } finally {
    await prisma.lifeRun.deleteMany({ where: { userId: user.id } })
    await prisma.achievementRecord.deleteMany({ where: { userId: user.id } })
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
