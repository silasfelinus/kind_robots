// /utils/scripts/verifyBotFacetCutover.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { BOT_PERSONALITY_TRAITS, BOT_TYPES } from '../../stores/helpers/botCards'
import {
  BOT_TYPE_ARTWORK_PATHS,
  BOT_TYPE_ARTWORK_TARGETS,
} from '../seeds/facetBotTypeArtwork'
import { LEGACY_BOT_TYPE_VALUES } from '../seeds/facetLegacyBotTypes'

const root = process.cwd()

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing Bot Facet contract text: ${fragment}`)
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(resolve(root, 'public', path.slice(1)))
    return true
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  const failures: string[] = []
  const missingArtwork: string[] = []

  if (BOT_TYPES.length !== 7) {
    failures.push(`Expected 7 illustrated Bot Types, found ${BOT_TYPES.length}.`)
  }
  if (BOT_PERSONALITY_TRAITS.length < 70) {
    failures.push(
      `Expected at least 70 Bot Personality traits, found ${BOT_PERSONALITY_TRAITS.length}.`,
    )
  }
  if (LEGACY_BOT_TYPE_VALUES.length < 3) {
    failures.push('Legacy CHATBOT, PROMPTBOT, and NARRATOR coverage is incomplete.')
  }

  const builderPaths = new Set(BOT_TYPES.map((entry) => entry.image))
  for (const target of BOT_TYPE_ARTWORK_TARGETS) {
    if (!builderPaths.has(target.path)) {
      failures.push(
        `Bot Type artwork target ${target.path} is not represented by BOT_TYPES.`,
      )
    }
  }
  for (const entry of BOT_TYPES) {
    if (!BOT_TYPE_ARTWORK_PATHS.has(entry.image)) {
      failures.push(`${entry.label} has untracked artwork path ${entry.image}.`)
      continue
    }
    if (!(await pathExists(entry.image))) missingArtwork.push(entry.image)
  }

  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration: 'prisma/migrations/20260726214500_bot_facet/migration.sql',
    serverCatalog: 'server/utils/facetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    seed: 'utils/scripts/seedBotFacetCatalog.ts',
    legacySeed: 'utils/scripts/seedLegacyBotTypeFacets.ts',
    normalizePersonality: 'utils/scripts/normalizeBotPersonalityFacetValues.ts',
    wrapper: 'utils/scripts/runFacetCatalogSeed.ts',
    sync: 'server/utils/botFacetSync.ts',
    create: 'server/api/bots/index.post.ts',
    patch: 'server/api/bots/[id].patch.ts',
    batch: 'server/api/bots/batch.post.ts',
    get: 'server/api/bots/[id]/facets.get.ts',
    plugin: 'plugins/20.facet-catalog.client.ts',
    randomStore: 'stores/randomStore.ts',
    policy: 'scripts/lib/facetCatalogSeedPolicy.mjs',
    legacyTypes: 'utils/seeds/facetLegacyBotTypes.ts',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await readFile(resolve(root, path), 'utf8')] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.schema, text.schema, 'model BotFacet')
  requireText(files.schema, text.schema, '@@unique([botId, facetId, fieldKey])')
  requireText(files.migration, text.migration, 'BotFacet_botId_fkey')
  requireText(files.migration, text.migration, 'BotFacet_facetId_fkey')
  requireText(files.migration, text.migration, 'ON DELETE CASCADE')
  requireText(files.serverCatalog, text.serverCatalog, "'BOT_TYPE'")
  requireText(files.serverCatalog, text.serverCatalog, 'loadBotFacetCatalog')
  requireText(files.catalogStore, text.catalogStore, 'BOT_FIELD_TAXONOMIES')
  requireText(files.catalogStore, text.catalogStore, "BotType: ['BOT_TYPE']")
  requireText(files.catalogStore, text.catalogStore, "personality: ['PERSONALITY']")
  requireText(files.catalogStore, text.catalogStore, 'builderChoicesForBotField')
  requireText(files.seed, text.seed, 'BOT_TYPES')
  requireText(files.seed, text.seed, 'BOT_PERSONALITY_TRAITS')
  requireText(files.seed, text.seed, 'backfillBots')
  requireText(files.seed, text.seed, 'builderValue')
  requireText(files.legacySeed, text.legacySeed, 'LEGACY_BOT_TYPE_VALUES')
  requireText(
    files.normalizePersonality,
    text.normalizePersonality,
    "canonicalValue: { startsWith: 'personality:' }",
  )
  requireText(
    files.normalizePersonality,
    text.normalizePersonality,
    'data: { canonicalValue: update.to }',
  )
  for (const value of ['CHATBOT', 'PROMPTBOT', 'NARRATOR']) {
    requireText(files.legacyTypes, text.legacyTypes, value)
  }
  requireText(files.wrapper, text.wrapper, "import('./seedLegacyBotTypeFacets')")
  requireText(files.wrapper, text.wrapper, "import('./seedBotFacetCatalog')")
  requireText(
    files.wrapper,
    text.wrapper,
    "import('./normalizeBotPersonalityFacetValues')",
  )
  requireText(files.sync, text.sync, 'syncBotFacetsInTransaction')
  requireText(
    files.sync,
    text.sync,
    "taxonomy: { in: ['BOT_TYPE', 'PERSONALITY'] }",
  )
  requireText(
    files.sync,
    text.sync,
    "fieldKey: { in: ['BotType', 'personality'] }",
  )
  for (const [source, label] of [
    [text.create, files.create],
    [text.patch, files.patch],
    [text.batch, files.batch],
  ] as const) {
    requireText(label, source, 'prisma.$transaction')
    requireText(label, source, 'syncBotFacetsInTransaction')
  }
  requireText(files.get, text.get, 'loadBotFacetCatalog')
  requireText(files.get, text.get, 'Bot is private.')
  requireText(files.plugin, text.plugin, 'BOT_CARDS')
  requireText(files.plugin, text.plugin, 'hydrateBotBuilder')
  requireText(files.plugin, text.plugin, 'builderChoicesForBotField')
  requireText(files.plugin, text.plugin, "fieldKey === 'personality'")
  requireText(files.randomStore, text.randomStore, "botType: ['BOT_TYPE']")
  for (const source of [
    'stores/helpers/botCards.ts',
    'utils/seeds/facetBotTypeArtwork.ts',
    'utils/seeds/facetLegacyBotTypes.ts',
    'utils/scripts/normalizeBotPersonalityFacetValues.ts',
    'utils/scripts/seedBotFacetCatalog.ts',
    'utils/scripts/seedLegacyBotTypeFacets.ts',
  ]) {
    requireText(files.policy, text.policy, source)
  }

  if (failures.length) {
    throw new Error(`Bot Facet cutover failed:\n- ${failures.join('\n- ')}`)
  }

  process.stdout.write(
    `Bot Facet cutover verified: ${BOT_TYPES.length} illustrated Bot Types, ` +
      `${LEGACY_BOT_TYPE_VALUES.length} legacy Bot Types, and ` +
      `${BOT_PERSONALITY_TRAITS.length} shared Personality choices.\n`,
  )
  const debt = Array.from(new Set(missingArtwork)).sort()
  if (debt.length) {
    process.stdout.write(
      `Known Bot Type artwork debt (${debt.length}; broken paths are not persisted):\n` +
        debt.map((path) => `- public${path}`).join('\n') +
        '\n',
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
