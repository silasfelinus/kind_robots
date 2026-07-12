// utils/scripts/seedDaVinciEndings.ts
//
// Idempotent importer for the deterministic Da Vinci ending seed data produced
// by conductor's scripts/generate_davinci_endings.py (JSON or JSONL).
//
// For each of the 1024 ending payloads it upserts:
//   - Achievement      by triggerCode  (davinci-ending-{outcomeKey})
//   - LifeEnding       by outcomeKey   (linked to the Achievement)
//   - LifeAchievement  by conditionKey (ending:{outcomeKey}, linked to both)
//
// It NEVER creates ArtImage rows and never touches iconArtImageId /
// heroArtImageId / artImageId — icon and hero images are seeded as path
// strings only, until the local generator pipeline produces real files.
//
// Boundary: single-invocation only. The LifeAchievement find-then-write is not
// atomic, so don't run two imports against the same database concurrently.
//
// Usage (tsx, not ts-node — the repo is ESM and ts-node can't resolve the
// generated client's extensionless imports under Node's ESM loader):
//   npm run seed:davinci -- tmp/davinci-endings.jsonl            # dry run (default)
//   npm run seed:davinci -- tmp/davinci-endings.jsonl --write    # apply
//
// The parsing/validation/upsert pieces are exported for the regression check
// (verifyDaVinciSeed.ts) so both scripts share one source of truth.

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import type { Prisma } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const VICTORY_TYPES = ['VICTORY', 'FAILURE', 'MIXED', 'SECRET'] as const
type VictoryType = (typeof VICTORY_TYPES)[number]

export interface EndingPayload {
  title: string
  slug: string
  outcomeKey: string
  summary: string
  victoryType: VictoryType
  icon: string
  heroImage: string
  artPrompt: string
  metadata: Prisma.InputJsonValue
  achievement: {
    label: string
    message: string
    icon: string
    triggerCode: string
    tooltip: string
    isActive: boolean
    isRepeatable: boolean
    imagePath: string
    artPrompt: string
  }
  lifeAchievement: {
    title: string
    slug: string
    achievementType: string
    conditionKey: string
    description: string
    icon: string
    imagePath: string
    artPrompt: string
  }
}

export function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

export function parseEndings(raw: string): EndingPayload[] {
  const trimmed = raw.trim()
  // Whole-file JSON: either {"endings": [...]} or a bare array.
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed.endings)) return parsed.endings
    } catch {
      // fall through to JSONL
    }
  }
  return trimmed
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch {
        throw new Error(`Invalid JSONL at line ${index + 1}`)
      }
    })
}

export function validate(ending: EndingPayload, index: number): void {
  const where = `ending #${index} (${ending.outcomeKey ?? 'missing outcomeKey'})`
  if (!/^[01]{10}$/.test(ending.outcomeKey ?? '')) {
    throw new Error(`${where}: outcomeKey must be a 10-bit binary string`)
  }
  if (!ending.title || !ending.slug || !ending.summary) {
    throw new Error(`${where}: title, slug, and summary are required`)
  }
  if (!VICTORY_TYPES.includes(ending.victoryType)) {
    throw new Error(
      `${where}: victoryType "${ending.victoryType}" is not valid`,
    )
  }
  if (
    ending.achievement?.triggerCode !== `davinci-ending-${ending.outcomeKey}`
  ) {
    throw new Error(
      `${where}: achievement.triggerCode does not match outcomeKey`,
    )
  }
  if (ending.lifeAchievement?.conditionKey !== `ending:${ending.outcomeKey}`) {
    throw new Error(
      `${where}: lifeAchievement.conditionKey does not match outcomeKey`,
    )
  }
  if (ending.lifeAchievement.achievementType !== 'ENDING') {
    throw new Error(
      `${where}: lifeAchievement.achievementType must be ENDING`,
    )
  }
}

export function loadSeedFile(filePath: string): EndingPayload[] {
  const endings = parseEndings(readFileSync(filePath, 'utf-8'))
  endings.forEach(validate)
  const outcomeKeys = endings.map((ending) => ending.outcomeKey)
  if (new Set(outcomeKeys).size !== outcomeKeys.length) {
    throw new Error('Duplicate outcomeKeys in seed file')
  }
  return endings
}

export async function importEnding(
  prisma: PrismaClient,
  ending: EndingPayload,
): Promise<void> {
  const m = ending.achievement
  const achievementData = {
    label: m.label,
    message: m.message,
    icon: m.icon,
    tooltip: m.tooltip,
    isActive: m.isActive ?? true,
    isRepeatable: m.isRepeatable ?? false,
    imagePath: m.imagePath,
    artPrompt: m.artPrompt,
  }
  const achievement = await prisma.achievement.upsert({
    where: { triggerCode: m.triggerCode },
    update: achievementData,
    create: { ...achievementData, triggerCode: m.triggerCode },
  })

  const endingData = {
    title: ending.title,
    slug: ending.slug,
    summary: ending.summary,
    victoryType: ending.victoryType,
    icon: ending.icon,
    heroImage: ending.heroImage,
    artPrompt: ending.artPrompt,
    metadata: ending.metadata,
    achievementId: achievement.id,
    isActive: true,
  }
  const lifeEnding = await prisma.lifeEnding.upsert({
    where: { outcomeKey: ending.outcomeKey },
    update: endingData,
    create: { ...endingData, outcomeKey: ending.outcomeKey },
  })

  const a = ending.lifeAchievement
  const lifeAchievementData = {
    title: a.title,
    slug: a.slug,
    achievementType: 'ENDING' as const,
    conditionKey: a.conditionKey,
    description: a.description,
    icon: a.icon,
    imagePath: a.imagePath,
    // LifeAchievement has no artPrompt column — the prompt lives on the
    // linked Achievement and LifeEnding rows.
    metadata: ending.metadata,
    achievementId: achievement.id,
    endingId: lifeEnding.id,
    isActive: true,
  }
  // conditionKey is derived from outcomeKey and stable across regenerations,
  // while the slug embeds the (theoretically tunable) title — so match on
  // conditionKey first to avoid duplicating achievements if titles ever shift.
  // NOT atomic (find-then-write): safe only for single-invocation use.
  const existing = await prisma.lifeAchievement.findFirst({
    where: { conditionKey: a.conditionKey },
    select: { id: true },
  })
  if (existing) {
    await prisma.lifeAchievement.update({
      where: { id: existing.id },
      data: lifeAchievementData,
    })
  } else {
    await prisma.lifeAchievement.create({ data: lifeAchievementData })
  }
}

export async function importEndings(
  prisma: PrismaClient,
  endings: EndingPayload[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  let done = 0
  for (const ending of endings) {
    await importEnding(prisma, ending)
    done += 1
    if (done % 128 === 0) onProgress?.(done, endings.length)
  }
}

export function davinciCounts(prisma: PrismaClient, outcomeKeys: string[]) {
  return Promise.all([
    prisma.achievement.count({
      where: { triggerCode: { startsWith: 'davinci-ending-' } },
    }),
    prisma.lifeEnding.count({
      where: { outcomeKey: { in: outcomeKeys } },
    }),
    prisma.lifeAchievement.count({
      where: { conditionKey: { in: outcomeKeys.map((k) => `ending:${k}`) } },
    }),
  ])
}

async function main() {
  const WRITE = process.argv.includes('--write')
  const filePath = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!filePath) {
    throw new Error(
      'Usage: npm run seed:davinci -- <path/to/davinci-endings.json|jsonl> [--write]',
    )
  }

  const prisma = createSeedPrismaClient()
  try {
    const endings = loadSeedFile(filePath)
    console.log(`Parsed ${endings.length} ending payloads from ${filePath}`)

    const outcomeKeys = endings.map((ending) => ending.outcomeKey)
    const [existingAchievements, existingEndings, existingLifeAchievements] =
      await davinciCounts(prisma, outcomeKeys)
    console.log(
      `Existing: ${existingAchievements} achievements, ${existingEndings} endings, ${existingLifeAchievements} life achievements`,
    )

    if (!WRITE) {
      console.log(
        `[dry run] Would upsert ${endings.length} achievements, endings, and life achievements. Re-run with --write to apply.`,
      )
      return
    }

    await importEndings(prisma, endings, (done, total) =>
      console.log(`  ...${done}/${total}`),
    )

    const [achievements, lifeEndings, lifeAchievements] = await davinciCounts(
      prisma,
      outcomeKeys,
    )
    console.log(
      `Done. Totals now: ${achievements} davinci-ending achievements, ${lifeEndings} LifeEndings, ${lifeAchievements} ENDING life achievements.`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Run the CLI only when executed directly, not when imported by the
// regression check.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
