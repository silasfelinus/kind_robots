// utils/scripts/seedStorybookDecks.ts
//
// Idempotent importer for Storybook's ending decks (storybook/t-030).
//
// Authoring lives in conductor, at projects/storybook/data/ending-decks/*.yaml:
// each file declares a deck's hidden axes in bit order and, for an authored
// deck, one ending per outcomeKey. This walks a file or a directory of them and
// upserts, per deck:
//   - EndingDeck      by key
//   - LifeEnding      by outcomeKey    (linked to the deck)
//   - Achievement     by triggerCode   (storybook-ending-{deckKey}-{outcomeKey})
//   - LifeAchievement by conditionKey  (ending:{deckKey}:{outcomeKey})
//   - one COLLECTION LifeAchievement per deck (conditionKey deck:{deckKey}),
//     which resolveStoryRunEnding awards when every ending in the deck is found
//
// The `life` deck is axes-only here: its 1,024 endings come from conductor's
// scripts/generate_davinci_endings.py through seedDaVinciEndings.ts. Importing
// life.yaml refreshes the deck row's axes and budgets and leaves the endings
// alone.
//
// BIT ORDER IS A DATA CONTRACT. outcomeKey[i] is axes[i]; reordering a deck's
// axes renames every one of its endings. The importer refuses a deck whose
// ending set does not exactly cover 2^axes, so a half-authored file cannot
// quietly ship a deck a run can fall out of.
//
// Usage:
//   npm run seed:storybook-decks -- <dir-or-file> [--write]
//
// Dry run by default. Requires DATABASE_URL only with --write.

import 'dotenv/config'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import {
  LIFE_DECK_KEY,
  deckOutcomeKeys,
  serializeDeckAxes,
  type DeckAxis,
} from '../../server/utils/endingDeckMath'

export interface DeckEndingPayload {
  outcomeKey: string
  title: string
  slug: string
  summary: string
  victoryType?: 'VICTORY' | 'FAILURE' | 'MIXED' | 'SECRET'
  icon?: string | null
  heroImage?: string | null
  artPrompt?: string | null
}

export interface DeckPayload {
  key: string
  title: string
  description?: string | null
  ownerKind?: 'LIFE' | 'GENRE_FACET' | 'SCENARIO'
  facetSlug?: string | null
  scenarioSlug?: string | null
  axes: DeckAxis[]
  passValue?: number
  turnBudget?: number
  turnBudgetByShape?: Record<string, number> | null
  minTurnsBeforeResolve?: number | null
  endings?: DeckEndingPayload[]
}

export function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

export function parseDeckFile(raw: string, source: string): DeckPayload {
  const parsed = parseYaml(raw) as DeckPayload | null
  // Arrays are objects: a file that is a bare list is not a deck, and saying
  // so beats the confusing "needs a key and a title" it would otherwise get.
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${source}: not a deck document.`)
  }
  if (!parsed.key || !parsed.title) {
    throw new Error(`${source}: a deck needs a key and a title.`)
  }
  if (!Array.isArray(parsed.axes) || !parsed.axes.length) {
    throw new Error(`${source}: a deck needs at least one axis.`)
  }
  return parsed
}

/**
 * Every deck must cover its own outcome space exactly.
 *
 * A deck missing one outcomeKey is a deck a real run can fall out of with no
 * ending to show, which surfaces as a 404 at the most expensive possible
 * moment -- after the reader has played the whole story.
 */
export function assertDeckComplete(deck: DeckPayload, source: string): void {
  const endings = deck.endings || []
  if (!endings.length) return

  const expected = deckOutcomeKeys({
    key: deck.key,
    axes: deck.axes,
    passValue: deck.passValue ?? 1,
  })
  const seen = new Set(endings.map((ending) => ending.outcomeKey))

  if (seen.size !== endings.length) {
    throw new Error(`${source}: duplicate outcomeKey in ${deck.key}.`)
  }
  const missing = expected.filter((key) => !seen.has(key))
  const extra = [...seen].filter((key) => !expected.includes(key))
  if (missing.length || extra.length) {
    throw new Error(
      `${source}: ${deck.key} must declare exactly ${expected.length} endings, one per outcomeKey.` +
        (missing.length ? ` Missing: ${missing.join(', ')}.` : '') +
        (extra.length ? ` Unexpected: ${extra.join(', ')}.` : ''),
    )
  }

  const slugs = new Set(endings.map((ending) => ending.slug))
  if (slugs.size !== endings.length) {
    throw new Error(`${source}: duplicate ending slug in ${deck.key}.`)
  }
}

export function loadDeckFiles(
  path: string,
): { source: string; deck: DeckPayload }[] {
  const isDirectory = statSync(path).isDirectory()
  const files = isDirectory
    ? readdirSync(path)
        .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
        .sort()
        .map((name) => join(path, name))
    : [path]

  return files.map((file) => {
    const deck = parseDeckFile(readFileSync(file, 'utf8'), file)
    assertDeckComplete(deck, file)
    return { source: file, deck }
  })
}

export function endingTriggerCode(deckKey: string, outcomeKey: string): string {
  // The life deck keeps its historical prefix: 1,024 Achievement rows already
  // carry it, and components/storybook/storybook-life-run.vue filters its
  // "Endings on record" list on exactly that string.
  return deckKey === LIFE_DECK_KEY
    ? `davinci-ending-${outcomeKey}`
    : `storybook-ending-${deckKey}-${outcomeKey}`
}

export function endingConditionKey(
  deckKey: string,
  outcomeKey: string,
): string {
  return deckKey === LIFE_DECK_KEY
    ? `ending:${outcomeKey}`
    : `ending:${deckKey}:${outcomeKey}`
}

export function deckConditionKey(deckKey: string): string {
  return `deck:${deckKey}`
}

export async function importDeck(
  prisma: PrismaClient,
  deck: DeckPayload,
): Promise<{ deckId: number; endings: number }> {
  const facet = deck.facetSlug
    ? await prisma.facet.findFirst({
        where: { slug: deck.facetSlug },
        select: { id: true },
      })
    : null
  if (deck.facetSlug && !facet) {
    // Not fatal: a deck is playable before its Facet card exists, and refusing
    // the import would block the engine on catalog work.
    console.warn(
      `  ! no Facet with slug "${deck.facetSlug}" -- importing ${deck.key} unlinked`,
    )
  }
  const scenario = deck.scenarioSlug
    ? await prisma.scenario.findFirst({
        where: { slug: deck.scenarioSlug },
        select: { id: true },
      })
    : null

  const deckData = {
    title: deck.title,
    description: deck.description ?? null,
    ownerKind: deck.ownerKind ?? 'GENRE_FACET',
    facetId: facet?.id ?? null,
    scenarioId: scenario?.id ?? null,
    axes: serializeDeckAxes(deck.axes),
    passValue: deck.passValue ?? 1,
    turnBudget: deck.turnBudget ?? 8,
    turnBudgetByShape: deck.turnBudgetByShape
      ? JSON.stringify(deck.turnBudgetByShape)
      : null,
    minTurnsBeforeResolve: deck.minTurnsBeforeResolve ?? null,
    isActive: true,
  }
  const row = await prisma.endingDeck.upsert({
    where: { key: deck.key },
    update: deckData,
    create: { ...deckData, key: deck.key },
  })

  const endings = deck.endings || []
  for (const ending of endings) {
    const triggerCode = endingTriggerCode(deck.key, ending.outcomeKey)
    const achievementData = {
      label: ending.title,
      message: ending.summary,
      icon: ending.icon ?? null,
      isActive: true,
      isRepeatable: false,
      artPrompt: ending.artPrompt ?? null,
    }
    const achievement = await prisma.achievement.upsert({
      where: { triggerCode },
      update: achievementData,
      create: { ...achievementData, triggerCode },
    })

    const endingData = {
      deckId: row.id,
      title: ending.title,
      slug: ending.slug,
      summary: ending.summary,
      victoryType: ending.victoryType ?? 'MIXED',
      icon: ending.icon ?? null,
      heroImage: ending.heroImage ?? null,
      artPrompt: ending.artPrompt ?? null,
      achievementId: achievement.id,
      isActive: true,
    }
    // Keyed by (deckId, outcomeKey), not outcomeKey alone. Every three-axis
    // deck produces '000'..'111', so upserting on the bare key would make each
    // genre deck overwrite the last one's endings.
    const lifeEnding = await prisma.lifeEnding.upsert({
      where: {
        deckId_outcomeKey: { deckId: row.id, outcomeKey: ending.outcomeKey },
      },
      update: endingData,
      create: { ...endingData, outcomeKey: ending.outcomeKey },
    })

    const conditionKey = endingConditionKey(deck.key, ending.outcomeKey)
    const lifeAchievementData = {
      title: ending.title,
      slug: `sb-${deck.key}-${ending.outcomeKey}`,
      achievementType: 'ENDING' as const,
      conditionKey,
      description: ending.summary,
      icon: ending.icon ?? null,
      achievementId: achievement.id,
      endingId: lifeEnding.id,
      isActive: true,
    }
    // Match on conditionKey rather than slug: the condition is derived from the
    // outcomeKey and stable across re-authoring, while a title (and therefore a
    // slug) may legitimately be rewritten.
    const existing = await prisma.lifeAchievement.findFirst({
      where: { conditionKey },
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

  // One COLLECTION achievement per authored deck: the credit for finding every
  // ending in it. Skipped for an axes-only file, which has no endings of its own.
  if (endings.length) {
    const collectionCondition = deckConditionKey(deck.key)
    const collectionData = {
      title: `${deck.title}: every ending`,
      slug: `sb-collection-${deck.key}`,
      achievementType: 'COLLECTION' as const,
      conditionKey: collectionCondition,
      description: `Found all ${endings.length} ${deck.title} endings.`,
      isActive: true,
    }
    const existingCollection = await prisma.lifeAchievement.findFirst({
      where: { conditionKey: collectionCondition },
      select: { id: true },
    })
    if (existingCollection) {
      await prisma.lifeAchievement.update({
        where: { id: existingCollection.id },
        data: collectionData,
      })
    } else {
      await prisma.lifeAchievement.create({ data: collectionData })
    }
  }

  return { deckId: row.id, endings: endings.length }
}

async function main() {
  const write = process.argv.includes('--write')
  const path = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (!path) {
    throw new Error(
      'Usage: npm run seed:storybook-decks -- <dir-or-file> [--write]',
    )
  }

  const loaded = loadDeckFiles(path)
  console.log(`Parsed ${loaded.length} deck file(s) from ${path}`)
  for (const { deck } of loaded) {
    console.log(
      `  ${deck.key}: ${deck.axes.length} axes, ${(deck.endings || []).length} endings`,
    )
  }

  if (!write) {
    console.log('\nDry run. Re-run with --write to import.')
    return
  }

  const prisma = createSeedPrismaClient()
  try {
    for (const { deck } of loaded) {
      const result = await importDeck(prisma, deck)
      console.log(
        `  imported ${deck.key} (id ${result.deckId}, ${result.endings} endings)`,
      )
    }
    console.log('\nDone.')
  } finally {
    await prisma.$disconnect()
  }
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
