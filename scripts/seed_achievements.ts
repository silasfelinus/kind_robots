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
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { achievementData } from '../training/achievementData'

const LEGACY_TRIGGER_ALIASES: Record<string, string[]> = {
  'first-character': ['fate'],
  'achievement-tour': ['test'],
}

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
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

  const prisma = createSeedPrismaClient()
  try {
    const before = await prisma.achievement.count()
    console.log(`Existing achievements in DB: ${before}`)

    let done = 0
    for (const achievement of achievementData) {
      await upsertAchievement(prisma, achievement)
      done += 1
      console.log(`  ...${done}/${achievementData.length} ${achievement.triggerCode}`)
    }

    const after = await prisma.achievement.count()
    console.log(`Done. Totals now: ${after} achievements.`)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the CLI only when executed directly, not when imported.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
