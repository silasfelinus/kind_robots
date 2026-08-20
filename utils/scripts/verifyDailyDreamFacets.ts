// /utils/scripts/verifyDailyDreamFacets.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { DailyDreamBlueprint } from '../../server/utils/dailyDreamFacetBlueprint'
import { diversifyDailyDreamNames } from '../../server/utils/dailyDreamNameDiversity'
import { containsCode } from './lib/sourceText'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(
      `${path} is missing Daily Dream Facet contract text: ${value}`,
    )
  }
}

function forbidText(path: string, text: string, value: string): void {
  if (containsCode(text, value)) {
    throw new Error(
      `${path} contains forbidden component request text: ${value}`,
    )
  }
}

function nameShape(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return 'mononym'
  if (/^[A-Z]\.\s/.test(name)) return 'initial'
  if (
    /^(Captain|Chef|Detective|Archivist|Courier|Doctor|Professor|Pilot|Caretaker|Inspector|Quartermaster|Engineer|Keeper|Guide|Clerk|Mechanic|Ranger|Steward)\s/.test(
      name,
    )
  ) {
    return 'title'
  }
  if (/\b(the|at|of|from|behind)\b/i.test(name)) return 'byname'
  return 'grounded'
}

function sampleBlueprint(): DailyDreamBlueprint {
  const character = (name: string): DailyDreamBlueprint['characters'][number] => ({
    name,
    species: 'Human',
    characterClass: 'Pilot',
    role: null,
    alignment: 'Neutral',
    personality: 'curious',
    quirks: 'keeps a brass key',
    backstory: `${name} arrived yesterday and already knows the shortcut.`,
    artPrompt: `${name}, curious pilot, expressive full character design`,
    facets: [],
  })

  return {
    dateKey: '2026-08-20',
    title: 'Naming Contract Dream',
    slug: 'daily-dream-2026-08-20-1-naming-contract-dream',
    description:
      'Nim Starling narrates while Mira Voss, Orlo Oddwick, and Vesper Moonspoon compare maps.',
    pitch:
      'Nim Starling asks Mira Voss to find Orlo Oddwick before Vesper Moonspoon reaches the station.',
    flavorText: 'A deterministic naming fixture.',
    artPrompt:
      'Nim Starling with Mira Voss, Orlo Oddwick, and Vesper Moonspoon in an ensemble scene.',
    facets: [],
    narrator: {
      name: 'Nim Starling',
      botType: 'Story Bot',
      personality: 'wry',
      voice: 'Nim Starling narrates in a wry register',
      artPrompt: 'Nim Starling, expressive mascot bot design',
      facets: [],
    },
    locations: [],
    characters: [
      character('Mira Voss'),
      character('Orlo Oddwick'),
      character('Vesper Moonspoon'),
    ],
    rewards: [],
  }
}

function verifyNameDiversityBehavior(): void {
  const options = { dateKey: '2026-08-20', userId: 1 }
  const first = diversifyDailyDreamNames(sampleBlueprint(), options)
  const second = diversifyDailyDreamNames(sampleBlueprint(), options)
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error('Daily Dream diversified names must remain date-seed deterministic.')
  }

  const names = [
    first.narrator?.name,
    ...first.characters.map((character) => character.name),
  ].filter((name): name is string => Boolean(name))
  if (new Set(names).size !== names.length) {
    throw new Error('Daily Dream narrator and character names must be unique within a bundle.')
  }

  const shapes = new Set(names.map(nameShape))
  if (shapes.size !== names.length) {
    throw new Error(
      `Daily Dream naming structures must rotate within a bundle; got ${names.join(', ')}.`,
    )
  }

  const serialized = JSON.stringify(first)
  for (const oldName of [
    'Nim Starling',
    'Mira Voss',
    'Orlo Oddwick',
    'Vesper Moonspoon',
  ]) {
    if (serialized.includes(oldName)) {
      throw new Error(
        `Daily Dream name replacement left stale prose/art reference: ${oldName}`,
      )
    }
  }

  const nextDay = diversifyDailyDreamNames(sampleBlueprint(), {
    dateKey: '2026-08-21',
    userId: 1,
  })
  if (JSON.stringify(nextDay) === JSON.stringify(first)) {
    throw new Error('Daily Dream naming must vary across date seeds.')
  }
}

async function main(): Promise<void> {
  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration:
      'prisma/migrations/20260726061000_reward_facet_daily_dream/migration.sql',
    blueprint: 'server/utils/dailyDreamFacetBlueprint.ts',
    nameDiversity: 'server/utils/dailyDreamNameDiversity.ts',
    endpoint: 'server/api/dreams/daily.post.ts',
    dailyStore: 'stores/dailyDreamStore.ts',
    generator: 'components/dreams/daily-dream-generator.vue',
    // The daily generator's HOST. It used to be dream-manager, in a
    // `#persistent` slot that put "Today's Facet Dream" above every Dreams
    // tab -- Silas, 2026-08-07: "if that's supposed to be part of the daily
    // dream index, it shouldn't be here." /for-you IS that index, so the
    // mount moved and this contract follows it rather than pinning the
    // component to a page it no longer belongs on.
    dailyDreamHost: 'components/pages/for-you-manager.vue',
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
  requireText(
    files.schema,
    text.schema,
    '@@unique([rewardId, facetId, fieldKey])',
  )
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
  requireText(
    files.blueprint,
    text.blueprint,
    "weightedMany(pool('SETTING'), 2, random)",
  )
  requireText(
    files.blueprint,
    text.blueprint,
    "facetByEnum('REWARD_TYPE', rewardType)",
  )
  requireText(files.blueprint, text.blueprint, "? 'SKILL'")
  requireText(files.blueprint, text.blueprint, "? 'ITEM'")
  requireText(
    files.blueprint,
    text.blueprint,
    "use(rewardTypeFacet, 'rewardType')",
  )

  // The blueprint must not draw from MOOD. applyFacetCatalogDirectives migrates
  // narrative tone to THEME and then asserts no MOOD profiles remain, so a pick
  // from that taxonomy silently returns null -- which is how every daily dream
  // came to be built with an empty atmosphere and nobody noticed. Re-adding the
  // pick would restore the silence, not the facet.
  forbidText(files.blueprint, text.blueprint, "one('MOOD')")

  requireText(files.nameDiversity, text.nameDiversity, 'NAME_STYLE_POOLS')
  requireText(files.nameDiversity, text.nameDiversity, 'pickUniqueName')
  requireText(files.nameDiversity, text.nameDiversity, 'replaceNames')
  requireText(files.endpoint, text.endpoint, 'diversifyDailyDreamNames')
  requireText(files.endpoint, text.endpoint, 'const buildBlueprint = async')
  requireText(files.endpoint, text.endpoint, 'return buildBlueprint(characterCount, rewardCount)')
  verifyNameDiversityBehavior()

  requireText(files.endpoint, text.endpoint, 'validDateKey(dateKey)')
  requireText(files.endpoint, text.endpoint, 'rewardType: reward.rewardType')
  requireText(files.endpoint, text.endpoint, 'tx.dreamFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'tx.characterFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'tx.rewardFacet.createMany')
  requireText(files.endpoint, text.endpoint, 'PrismaClientKnownRequestError')
  requireText(files.endpoint, text.endpoint, 'reused: true')

  requireText(files.dailyStore, text.dailyStore, 'defineStore')
  requireText(files.dailyStore, text.dailyStore, "'/api/dreams/daily'")
  requireText(
    files.dailyStore,
    text.dailyStore,
    'performFetch<DailyDreamResponse>',
  )
  requireText(files.dailyStore, text.dailyStore, 'lastBlueprint.value')
  requireText(files.generator, text.generator, 'useDailyDreamStore')
  requireText(
    files.generator,
    text.generator,
    'dailyDreamStore.createDailyDream',
  )
  requireText(files.generator, text.generator, 'characterCount')
  requireText(files.generator, text.generator, 'rewardCount')
  forbidText(files.generator, text.generator, '/api/dreams/daily')
  forbidText(files.generator, text.generator, 'performFetch')
  // Element-level, not the old exact prop string: the `@created` handler was
  // dream-manager's own (it re-selected the new Dream and switched tabs) and
  // has no meaning on the daily index. What this contract actually cares about
  // is that the generator is still MOUNTED somewhere a user can reach.
  requireText(
    files.dailyDreamHost,
    text.dailyDreamHost,
    '<daily-dream-generator',
  )

  requireText(files.rewardHelper, text.rewardHelper, 'rewardFacetFieldKey')
  requireText(files.rewardHelper, text.rewardHelper, "taxonomy === 'MATERIAL'")
  requireText(files.rewardGet, text.rewardGet, 'loadRewardFacetCatalog')
  requireText(files.rewardPut, text.rewardPut, 'tx.rewardFacet.deleteMany')
  requireText(files.rewardPut, text.rewardPut, 'tx.rewardFacet.createMany')
  requireText(
    files.rewardPut,
    text.rewardPut,
    'rewardFacetFieldKey(facet.taxonomy)',
  )
  requireText(files.rewardFacetStore, text.rewardFacetStore, 'useFacetStore')
  requireText(
    files.rewardFacetStore,
    text.rewardFacetStore,
    'fetchRewardFacets',
  )
  requireText(
    files.rewardFacetStore,
    text.rewardFacetStore,
    'replaceRewardFacets',
  )
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