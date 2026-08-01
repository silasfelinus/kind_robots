// scripts/seed_achievements.ts
//
// Idempotent seed for the site achievement catalog ("jellybeans"). It upserts
// every entry in training/achievementData.ts into the Achievement table keyed on
// `triggerCode` (which is @unique), so re-running never creates duplicates and
// always brings existing rows in sync with the catalog.
//
// Running without --write validates and previews the seed without touching the
// database. It NEVER creates ArtImage rows or sets artImageId — per-achievement
// raster art is backfilled separately by scripts/generate_achievement_art.ts.
//
// Usage:
//   npx tsx scripts/seed_achievements.ts            # dry run (default)
//   npx tsx scripts/seed_achievements.ts --write    # apply

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../prisma/generated/prisma/client'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'
import { achievementData } from '../training/achievementData'

const LEGACY_TRIGGER_ALIASES: Record<string, string[]> = {
  'first-character': ['fate'],
  'achievement-tour': ['test'],
}

const RETIRED_TRIGGER_MAPPINGS: Record<string, string> = {
  pitchmaster: 'artmaker',
  Artist: 'artmaker',
  matchmaker: 'memory-master',
  button: 'rebel-button',
  milestone: 'achievement-tour',
}

// The descriptive fields owned by the catalog. Generated `imagePath` and
// `artImageId` are deliberately omitted so a reconciliation never erases art.
function toUpsertData(achievement: (typeof achievementData)[number]) {
  return {
    label: achievement.label,
    message: achievement.message,
    icon: achievement.icon,
    karma: achievement.karma ?? 0,
    pageHint: achievement.pageHint,
    subtleHint: achievement.subtleHint,
    tooltip: achievement.tooltip,
    isActive: achievement.isActive ?? false,
    isRepeatable: achievement.isRepeatable ?? false,
    artPrompt: achievement.artPrompt,
  }
}

export function validateCatalog(): void {
  const codes = achievementData.map((a) => a.triggerCode)
  if (codes.some((code) => !code)) {
    throw new Error('Every achievement must have a triggerCode')
  }
  if (new Set(codes).size !== codes.length) {
    throw new Error('Duplicate triggerCodes in achievementData')
  }
}

export async function upsertAchievement(
  prisma: PrismaClient,
  achievement: (typeof achievementData)[number],
): Promise<void> {
  const triggerCode = achievement.triggerCode as string
  const data = toUpsertData(achievement)
  const existing = await prisma.achievement.findUnique({
    where: { triggerCode },
  })

  if (existing) {
    await prisma.achievement.update({
      where: { id: existing.id },
      data,
    })
    return
  }

  const legacyCodes = LEGACY_TRIGGER_ALIASES[triggerCode] ?? []
  const legacy = legacyCodes.length
    ? await prisma.achievement.findFirst({
        where: { triggerCode: { in: legacyCodes } },
      })
    : null

  if (legacy) {
    await prisma.achievement.update({
      where: { id: legacy.id },
      data: { ...data, triggerCode },
    })
    return
  }

  await prisma.achievement.create({
    data: { ...data, triggerCode },
  })
}

export async function reconcileRetiredAchievements(
  prisma: PrismaClient,
): Promise<void> {
  for (const [retiredCode, canonicalCode] of Object.entries(
    RETIRED_TRIGGER_MAPPINGS,
  )) {
    const retired = await prisma.achievement.findUnique({
      where: { triggerCode: retiredCode },
    })
    const canonical = await prisma.achievement.findUnique({
      where: { triggerCode: canonicalCode },
    })
    if (!retired || !canonical || retired.id === canonical.id) continue

    const records = await prisma.achievementRecord.findMany({
      where: { achievementId: retired.id },
      orderBy: { id: 'asc' },
    })

    for (const record of records) {
      const existing = await prisma.achievementRecord.findFirst({
        where: {
          achievementId: canonical.id,
          userId: record.userId,
        },
        orderBy: { id: 'asc' },
      })

      if (!existing) {
        await prisma.achievementRecord.update({
          where: { id: record.id },
          data: { achievementId: canonical.id },
        })
        continue
      }

      await prisma.lifeAchievementUnlock.updateMany({
        where: { achievementRecordId: record.id },
        data: { achievementRecordId: existing.id },
      })
      await prisma.achievementRecord.update({
        where: { id: existing.id },
        data: {
          isConfirmed: existing.isConfirmed || record.isConfirmed,
          createdAt:
            existing.createdAt <= record.createdAt
              ? existing.createdAt
              : record.createdAt,
        },
      })
      await prisma.achievementRecord.delete({ where: { id: record.id } })
    }

    await prisma.lifeAchievement.updateMany({
      where: { achievementId: retired.id },
      data: { achievementId: canonical.id },
    })
    await prisma.lifeEnding.updateMany({
      where: { achievementId: retired.id },
      data: { achievementId: canonical.id },
    })
    await prisma.achievement.update({
      where: { id: retired.id },
      data: { isActive: false },
    })

    console.log(
      `  retired ${retiredCode} -> ${canonicalCode}; migrated ${records.length} award record(s)`,
    )
  }
}

async function main() {
  const WRITE = process.argv.includes('--write')

  validateCatalog()
  console.log(`Parsed ${achievementData.length} achievements from the catalog.`)

  // A dry run only validates the catalog, so it never needs a database.
  if (!WRITE) {
    console.log(
      `[dry run] Catalog is valid. Would upsert ${achievementData.length} achievements by triggerCode. Re-run with --write to apply.`,
    )
    return
  }

  await withDatabaseRetry('achievement catalog reconciliation', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const before = await prisma.achievement.count()
      const activeBefore = await prisma.achievement.count({
        where: { isActive: true },
      })
      console.log(
        `Existing achievements in DB: ${before} total, ${activeBefore} active`,
      )

      let done = 0
      for (const achievement of achievementData) {
        await upsertAchievement(prisma, achievement)
        done += 1
        console.log(
          `  ...${done}/${achievementData.length} ${achievement.triggerCode}`,
        )
      }

      await reconcileRetiredAchievements(prisma)

      const after = await prisma.achievement.count()
      const activeAfter = await prisma.achievement.count({
        where: { isActive: true },
      })
      console.log(
        `Done. Totals now: ${after} stored, ${activeAfter} active achievements.`,
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

// Run the CLI only when executed directly, not when imported.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
