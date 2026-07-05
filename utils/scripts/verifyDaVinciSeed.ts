// utils/scripts/verifyDaVinciSeed.ts
//
// Regression check for the Da Vinci seed importer (davinci/t-010). Turns the
// manual t-008 verification into a repeatable pass/fail run:
//
//   1. payload shape  — the seed file parses, validates, and has unique keys
//   2. import         — a full --write import completes
//   3. link integrity — every ending has its Milestone, every achievement has
//                       its ending + milestone, triggerCodes match the keys
//   4. art boundary   — no seeded row points at an ArtImage
//   5. idempotency    — a second import leaves every count unchanged
//
// Exits non-zero on the first failed check, so it can back a CI job whenever
// one gets a database service. Point it at a scratch database — it WRITES
// (imports the seed file twice).
//
// Usage:
//   npm run seed:davinci:verify -- tmp/davinci-endings.jsonl
//
// Requires DATABASE_URL. Never run against production: the import itself is
// idempotent, but a verify run is a bulk write and belongs on scratch data.

import 'dotenv/config'
import {
  createSeedPrismaClient,
  loadSeedFile,
  importEndings,
  davinciCounts,
} from './seedDaVinciEndings'

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
  const filePath = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!filePath) {
    throw new Error(
      'Usage: npm run seed:davinci:verify -- <path/to/davinci-endings.json|jsonl>',
    )
  }

  const prisma = createSeedPrismaClient()
  try {
    console.log('1. payload shape')
    const endings = loadSeedFile(filePath)
    const outcomeKeys = endings.map((ending) => ending.outcomeKey)
    check(endings.length > 0, `seed file has payloads (${endings.length})`)
    check(
      endings.length === 1024,
      `seed file has all 1024 endings (found ${endings.length})`,
    )

    console.log('2. import (--write pass 1)')
    await importEndings(prisma, endings)
    const [milestones1, endings1, achievements1] = await davinciCounts(
      prisma,
      outcomeKeys,
    )
    check(
      milestones1 === endings.length,
      `milestone count matches payloads (${milestones1})`,
    )
    check(
      endings1 === endings.length,
      `LifeEnding count matches payloads (${endings1})`,
    )
    check(
      achievements1 === endings.length,
      `LifeAchievement count matches payloads (${achievements1})`,
    )

    console.log('3. link integrity')
    const unlinkedEndings = await prisma.lifeEnding.count({
      where: { outcomeKey: { in: outcomeKeys }, milestoneId: null },
    })
    check(
      unlinkedEndings === 0,
      `endings missing milestoneId: ${unlinkedEndings}`,
    )

    const conditionKeys = outcomeKeys.map((k) => `ending:${k}`)
    const unlinkedAchievements = await prisma.lifeAchievement.count({
      where: {
        conditionKey: { in: conditionKeys },
        OR: [{ endingId: null }, { milestoneId: null }],
      },
    })
    check(
      unlinkedAchievements === 0,
      `achievements missing endingId/milestoneId: ${unlinkedAchievements}`,
    )

    // Spot-check that links point at the right rows, not just any rows.
    const sample = endings[endings.length - 1]
    if (!sample) throw new Error('seed file has no payloads to spot-check')
    const sampleEnding = await prisma.lifeEnding.findUnique({
      where: { outcomeKey: sample.outcomeKey },
      include: { Milestone: true, Achievements: true },
    })
    check(
      sampleEnding?.Milestone?.triggerCode ===
        `davinci-ending-${sample.outcomeKey}`,
      'sample ending links to the milestone with its own triggerCode',
    )
    check(
      sampleEnding?.Achievements.some(
        (a) => a.conditionKey === `ending:${sample.outcomeKey}`,
      ),
      'sample ending links to the achievement with its own conditionKey',
    )

    console.log('4. art boundary')
    const endingsWithArt = await prisma.lifeEnding.count({
      where: {
        outcomeKey: { in: outcomeKeys },
        OR: [
          { iconArtImageId: { not: null } },
          { heroArtImageId: { not: null } },
        ],
      },
    })
    check(endingsWithArt === 0, `endings with ArtImage ids: ${endingsWithArt}`)
    const achievementsWithArt = await prisma.lifeAchievement.count({
      where: { conditionKey: { in: conditionKeys }, artImageId: { not: null } },
    })
    check(
      achievementsWithArt === 0,
      `achievements with ArtImage ids: ${achievementsWithArt}`,
    )
    const milestonesWithArt = await prisma.milestone.count({
      where: {
        triggerCode: { startsWith: 'davinci-ending-' },
        artImageId: { not: null },
      },
    })
    check(
      milestonesWithArt === 0,
      `davinci milestones with ArtImage ids: ${milestonesWithArt}`,
    )

    console.log('5. idempotency (--write pass 2)')
    await importEndings(prisma, endings)
    const [milestones2, endings2, achievements2] = await davinciCounts(
      prisma,
      outcomeKeys,
    )
    check(
      milestones2 === milestones1,
      `milestone count unchanged (${milestones1} -> ${milestones2})`,
    )
    check(
      endings2 === endings1,
      `LifeEnding count unchanged (${endings1} -> ${endings2})`,
    )
    check(
      achievements2 === achievements1,
      `LifeAchievement count unchanged (${achievements1} -> ${achievements2})`,
    )

    if (failures > 0) {
      console.error(`\n${failures} check(s) FAILED`)
      process.exitCode = 1
    } else {
      console.log('\nALL SEED REGRESSION CHECKS PASSED')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
