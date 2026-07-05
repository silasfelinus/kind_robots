// utils/scripts/seedDaVinciEndings.ts
//
// Idempotent importer for the deterministic Da Vinci ending seed data produced
// by conductor's scripts/generate_davinci_endings.py (JSON or JSONL).
//
// For each of the 1024 ending payloads it upserts:
//   - Milestone        by triggerCode  (davinci-ending-{outcomeKey})
//   - LifeEnding       by outcomeKey   (linked to the Milestone)
//   - LifeAchievement  by conditionKey (ending:{outcomeKey}, linked to both)
//
// It NEVER creates ArtImage rows and never touches iconArtImageId /
// heroArtImageId / artImageId — icon and hero images are seeded as path
// strings only, until the local generator pipeline produces real files.
//
// Usage (tsx, not ts-node — the repo is ESM and ts-node can't resolve the
// generated client's extensionless imports under Node's ESM loader):
//   npm run seed:davinci -- tmp/davinci-endings.jsonl            # dry run (default)
//   npm run seed:davinci -- tmp/davinci-endings.jsonl --write    # apply

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import type { Prisma } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

const WRITE = process.argv.includes('--write')
const filePath = ((): string => {
  const arg = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!arg) {
    throw new Error(
      'Usage: npm run seed:davinci -- <path/to/davinci-endings.json|jsonl> [--write]',
    )
  }
  return arg
})()

const VICTORY_TYPES = ['VICTORY', 'FAILURE', 'MIXED', 'SECRET'] as const
type VictoryType = (typeof VICTORY_TYPES)[number]

interface EndingPayload {
  title: string
  slug: string
  outcomeKey: string
  summary: string
  victoryType: VictoryType
  icon: string
  heroImage: string
  artPrompt: string
  metadata: Prisma.InputJsonValue
  milestone: {
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
  achievement: {
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

function parseEndings(raw: string): EndingPayload[] {
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

function validate(ending: EndingPayload, index: number): void {
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
  if (ending.milestone?.triggerCode !== `davinci-ending-${ending.outcomeKey}`) {
    throw new Error(`${where}: milestone.triggerCode does not match outcomeKey`)
  }
  if (ending.achievement?.conditionKey !== `ending:${ending.outcomeKey}`) {
    throw new Error(
      `${where}: achievement.conditionKey does not match outcomeKey`,
    )
  }
  if (ending.achievement.achievementType !== 'ENDING') {
    throw new Error(`${where}: achievement.achievementType must be ENDING`)
  }
}

async function importEnding(ending: EndingPayload) {
  const m = ending.milestone
  const milestoneData = {
    label: m.label,
    message: m.message,
    icon: m.icon,
    tooltip: m.tooltip,
    isActive: m.isActive ?? true,
    isRepeatable: m.isRepeatable ?? false,
    imagePath: m.imagePath,
    artPrompt: m.artPrompt,
  }
  const milestone = await prisma.milestone.upsert({
    where: { triggerCode: m.triggerCode },
    update: milestoneData,
    create: { ...milestoneData, triggerCode: m.triggerCode },
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
    milestoneId: milestone.id,
    isActive: true,
  }
  const lifeEnding = await prisma.lifeEnding.upsert({
    where: { outcomeKey: ending.outcomeKey },
    update: endingData,
    create: { ...endingData, outcomeKey: ending.outcomeKey },
  })

  const a = ending.achievement
  const achievementData = {
    title: a.title,
    slug: a.slug,
    achievementType: 'ENDING' as const,
    conditionKey: a.conditionKey,
    description: a.description,
    icon: a.icon,
    imagePath: a.imagePath,
    // LifeAchievement has no artPrompt column — the prompt lives on the
    // linked Milestone and LifeEnding rows.
    metadata: ending.metadata,
    milestoneId: milestone.id,
    endingId: lifeEnding.id,
    isActive: true,
  }
  // conditionKey is derived from outcomeKey and stable across regenerations,
  // while the slug embeds the (theoretically tunable) title — so match on
  // conditionKey first to avoid duplicating achievements if titles ever shift.
  const existing = await prisma.lifeAchievement.findFirst({
    where: { conditionKey: a.conditionKey },
    select: { id: true },
  })
  if (existing) {
    await prisma.lifeAchievement.update({
      where: { id: existing.id },
      data: achievementData,
    })
  } else {
    await prisma.lifeAchievement.create({ data: achievementData })
  }
}

async function main() {
  const endings = parseEndings(readFileSync(filePath, 'utf-8'))
  console.log(`Parsed ${endings.length} ending payloads from ${filePath}`)
  endings.forEach(validate)

  const outcomeKeys = endings.map((ending) => ending.outcomeKey)
  if (new Set(outcomeKeys).size !== outcomeKeys.length) {
    throw new Error('Duplicate outcomeKeys in seed file')
  }

  const [existingMilestones, existingEndings, existingAchievements] =
    await Promise.all([
      prisma.milestone.count({
        where: { triggerCode: { startsWith: 'davinci-ending-' } },
      }),
      prisma.lifeEnding.count({
        where: { outcomeKey: { in: outcomeKeys } },
      }),
      prisma.lifeAchievement.count({
        where: { conditionKey: { in: outcomeKeys.map((k) => `ending:${k}`) } },
      }),
    ])
  console.log(
    `Existing: ${existingMilestones} milestones, ${existingEndings} endings, ${existingAchievements} achievements`,
  )

  if (!WRITE) {
    console.log(
      `[dry run] Would upsert ${endings.length} milestones, endings, and achievements. Re-run with --write to apply.`,
    )
    return
  }

  let done = 0
  for (const ending of endings) {
    await importEnding(ending)
    done += 1
    if (done % 128 === 0) console.log(`  ...${done}/${endings.length}`)
  }

  const [milestones, lifeEndings, achievements] = await Promise.all([
    prisma.milestone.count({
      where: { triggerCode: { startsWith: 'davinci-ending-' } },
    }),
    prisma.lifeEnding.count({
      where: { outcomeKey: { in: outcomeKeys } },
    }),
    prisma.lifeAchievement.count({
      where: { conditionKey: { in: outcomeKeys.map((k) => `ending:${k}`) } },
    }),
  ])
  console.log(
    `Done. Totals now: ${milestones} davinci-ending milestones, ${lifeEndings} LifeEndings, ${achievements} ENDING achievements.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
