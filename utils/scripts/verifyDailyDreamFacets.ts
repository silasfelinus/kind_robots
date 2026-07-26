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

async function main(): Promise<void> {
  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration:
      'prisma/migrations/20260726061000_reward_facet_daily_dream/migration.sql',
    blueprint: 'server/utils/dailyDreamFacetBlueprint.ts',
    endpoint: 'server/api/dreams/daily.post.ts',
    generator: 'components/dreams/daily-dream-generator.vue',
    dreamManager: 'components/dreams/dream-manager.vue',
    rewardHelper: 'server/utils/rewardFacetCatalog.ts',
    rewardGet: 'server/api/rewards/[id]/facets.get.ts',
    rewardPut: 'server/api/rewards/[id]/facets.put.ts',
    rewardPicker: 'components/rewards/reward-facet-picker.vue',
    rewardManager: 'components/rewards/reward-manager.vue',
    rewardMerge: 'utils/scripts/mergeRewardFacetDuplicateLinks.ts',
    vercelBuild: 'scripts/vercel-build.mjs',
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

  requireText(files.endpoint, text.endpoint, 'validDateKey(dateKey)')
  requireText(files.endpoint, text.endpoint, 'tx.dreamFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'tx.characterFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'tx.rewardFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'PrismaClientKnownRequestError')
  requireText(files.endpoint, text.endpoint, 'reused: true')

  requireText(files.generator, text.generator, '/api/dreams/daily')
  requireText(files.generator, text.generator, 'characterCount')
  requireText(files.generator, text.generator, 'rewardCount')
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
  requireText(files.rewardPicker, text.rewardPicker, '/api/rewards/${props.rewardId}/facets')
  requireText(files.rewardManager, text.rewardManager, 'reward-facet-picker')
  requireText(files.rewardManager, text.rewardManager, 'rewardFacetIds')

  requireText(files.rewardMerge, text.rewardMerge, 'tx.rewardFacet.createMany')
  requireText(files.rewardMerge, text.rewardMerge, 'tx.rewardFacet.deleteMany')
  const rewardMergeIndex = text.vercelBuild.indexOf(
    'mergeRewardFacetDuplicateLinks.ts',
  )
  const canonicalMergeIndex = text.vercelBuild.indexOf(
    'mergeCanonicalFacetDuplicates.ts',
  )
  if (
    rewardMergeIndex < 0 ||
    canonicalMergeIndex < 0 ||
    rewardMergeIndex > canonicalMergeIndex
  ) {
    throw new Error(
      'scripts/vercel-build.mjs must preserve RewardFacet links before canonical duplicate cleanup.',
    )
  }

  process.stdout.write('Daily Dream Facet contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
