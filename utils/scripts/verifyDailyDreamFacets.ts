// /utils/scripts/verifyDailyDreamFacets.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(`${path} is missing Daily Dream Facet contract text: ${value}`)
  }
}

function forbidText(path: string, text: string, value: string): void {
  if (text.includes(value)) {
    throw new Error(`${path} contains forbidden component request text: ${value}`)
  }
}

async function main(): Promise<void> {
  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration:
      'prisma/migrations/20260726061000_reward_facet_daily_dream/migration.sql',
    blueprint: 'server/utils/dailyDreamFacetBlueprint.ts',
    endpoint: 'server/api/dreams/daily.post.ts',
    dailyStore: 'stores/dailyDreamStore.ts',
    generator: 'components/dreams/daily-dream-generator.vue',
    dreamManager: 'components/dreams/dream-manager.vue',
    rewardHelper: 'server/utils/rewardFacetCatalog.ts',
    rewardGet: 'server/api/rewards/[id]/facets.get.ts',
    rewardPut: 'server/api/rewards/[id]/facets.put.ts',
    rewardFacetStore: 'stores/rewardFacetStore.ts',
    rewardPicker: 'components/rewards/reward-facet-picker.vue',
    rewardManager: 'components/rewards/reward-manager.vue',
    rewardMerge: 'utils/scripts/mergeRewardFacetDuplicateLinks.ts',
    runner: 'scripts/run_facet_catalog_maintenance.ts',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.schema, text.schema, 'model RewardFacet')
  requireText(files.schema, text.schema, '@@unique([rewardId, facetId, fieldKey])')
  requireText(files.migration, text.migration, 'CREATE TABLE `RewardFacet`')
  requireText(files.migration, text.migration, 'RewardFacet_rewardId_fkey')
  requireText(files.migration, text.migration, 'RewardFacet_facetId_fkey')

  requireText(
    files.blueprint,
    text.blueprint,
    'hashSeed(`${options.userId}:${options.dateKey}`)',
  )
  requireText(files.blueprint, text.blueprint, "one('ANIMAL', 'SPECIES')")
  requireText(
    files.blueprint,
    text.blueprint,
    "one('OCCUPATION', 'ARCHETYPE', 'ROLE')",
  )
  requireText(files.blueprint, text.blueprint, "one('MATERIAL')")
  requireText(files.blueprint, text.blueprint, "use(material, 'material')")

  // A narrator bot, two locations, and typed rewards (spec: 3 characters,
  // 2 locations, 1 narrator bot, 2 rewards — one SKILL, one ITEM).
  requireText(files.blueprint, text.blueprint, "one('BOT_TYPE')")
  requireText(files.blueprint, text.blueprint, "weightedMany(pool('SETTING'), 2, random)")
  requireText(files.blueprint, text.blueprint, "facetByEnum('REWARD_TYPE', rewardType)")
  requireText(files.blueprint, text.blueprint, "? 'SKILL'")
  requireText(files.blueprint, text.blueprint, "? 'ITEM'")
  requireText(files.blueprint, text.blueprint, "use(rewardTypeFacet, 'rewardType')")

  requireText(files.endpoint, text.endpoint, 'validDateKey(dateKey)')
  requireText(files.endpoint, text.endpoint, 'rewardType: reward.rewardType')
  requireText(files.endpoint, text.endpoint, 'tx.dreamFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'tx.characterFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'tx.rewardFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'PrismaClientKnownRequestError')
  requireText(files.endpoint, text.endpoint, 'reused: true')

  requireText(files.dailyStore, text.dailyStore, 'defineStore')
  requireText(files.dailyStore, text.dailyStore, "'/api/dreams/daily'")
  requireText(files.dailyStore, text.dailyStore, 'performFetch<DailyDreamResponse>')
  requireText(files.dailyStore, text.dailyStore, 'lastBlueprint.value')
  requireText(files.generator, text.generator, 'useDailyDreamStore')
  requireText(files.generator, text.generator, 'dailyDreamStore.createDailyDream')
  requireText(files.generator, text.generator, 'characterCount')
  requireText(files.generator, text.generator, 'rewardCount')
  forbidText(files.generator, text.generator, '/api/dreams/daily')
  forbidText(files.generator, text.generator, 'performFetch')
  requireText(
    files.dreamManager,
    text.dreamManager,
    '<daily-dream-generator @created="onDailyDreamCreated" />',
  )

  requireText(files.rewardHelper, text.rewardHelper, 'rewardFacetFieldKey')
  requireText(files.rewardHelper, text.rewardHelper, "taxonomy === 'MATERIAL'")
  requireText(files.rewardGet, text.rewardGet, 'loadRewardFacetCatalog')
  requireText(files.rewardPut, text.rewardPut, 'tx.rewardFacet.deleteMany')
  requireText(files.rewardPut, text.rewardPut, 'tx.rewardFacet.createMany')
  requireText(files.rewardPut, text.rewardPut, 'rewardFacetFieldKey(facet.taxonomy)')
  requireText(files.rewardFacetStore, text.rewardFacetStore, 'useFacetStore')
  requireText(files.rewardFacetStore, text.rewardFacetStore, 'fetchRewardFacets')
  requireText(files.rewardFacetStore, text.rewardFacetStore, 'replaceRewardFacets')
  requireText(
    files.rewardFacetStore,
    text.rewardFacetStore,
    '`/api/rewards/${id}/facets`',
  )
  requireText(files.rewardPicker, text.rewardPicker, 'useRewardFacetStore')
  requireText(
    files.rewardPicker,
    text.rewardPicker,
    'rewardFacetStore.fetchRewardFacets',
  )
  requireText(
    files.rewardPicker,
    text.rewardPicker,
    'rewardFacetStore.replaceRewardFacets',
  )
  forbidText(files.rewardPicker, text.rewardPicker, '/api/rewards/')
  forbidText(files.rewardPicker, text.rewardPicker, 'performFetch')
  requireText(files.rewardManager, text.rewardManager, 'reward-facet-picker')
  requireText(files.rewardManager, text.rewardManager, 'rewardFacetIds')

  requireText(files.rewardMerge, text.rewardMerge, 'tx.rewardFacet.createMany')
  requireText(files.rewardMerge, text.rewardMerge, 'tx.rewardFacet.deleteMany')
  const rewardMergeIndex = text.runner.indexOf(
    'mergeRewardFacetDuplicateLinks.ts',
  )
  const canonicalMergeIndex = text.runner.indexOf(
    'mergeCanonicalFacetDuplicates.ts',
  )
  if (
    rewardMergeIndex < 0 ||
    canonicalMergeIndex < 0 ||
    rewardMergeIndex > canonicalMergeIndex
  ) {
    throw new Error(
      'scripts/run_facet_catalog_maintenance.ts must preserve RewardFacet links before canonical duplicate cleanup.',
    )
  }

  process.stdout.write('Daily Dream Facet contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
