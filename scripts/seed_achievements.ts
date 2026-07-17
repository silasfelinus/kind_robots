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

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

// The fields we own from the catalog. `triggerCode` is the upsert key, so it is
// applied only on create (updating it would move the row to a different bean).
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
    imagePath: achievement.imagePath,
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
  await prisma.achievement.upsert({
    where: { triggerCode },
    update: data,
    create: { ...data, triggerCode },
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
