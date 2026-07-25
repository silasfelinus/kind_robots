// /utils/scripts/verifyFacetCatalogCutover.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(`${path} is missing required contract text: ${value}`)
  }
}

function forbidText(path: string, text: string, value: string): void {
  if (text.includes(value)) {
    throw new Error(`${path} contains retired runtime text: ${value}`)
  }
}

async function main(): Promise<void> {
  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration:
      'prisma/migrations/20260725113000_facet_catalog_cutover/migration.sql',
    catalog: 'server/utils/facetCatalog.ts',
    catalogRoute: 'server/api/facets/catalog.get.ts',
    characterGet: 'server/api/characters/[id]/facets.get.ts',
    characterPut: 'server/api/characters/[id]/facets.put.ts',
    seed: 'utils/scripts/seedFacetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    randomStore: 'stores/randomStore.ts',
    randomHelper: 'stores/helpers/randomHelper.ts',
    builderPlugin: 'plugins/20.facet-catalog.client.ts',
    variants: 'server/api/challenges/variants.post.ts',
    vercelBuild: 'scripts/vercel-build.mjs',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(async ([key, path]) => [key, await source(path)] as const),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.schema, text.schema, 'model FacetProfile')
  requireText(files.schema, text.schema, 'model CharacterFacet')
  requireText(files.schema, text.schema, '@@unique([characterId, facetId, fieldKey])')

  requireText(files.migration, text.migration, 'FacetProfile_facetId_fkey')
  requireText(files.migration, text.migration, 'CharacterFacet_characterId_fkey')
  requireText(files.migration, text.migration, 'CharacterFacet_facetId_fkey')
  requireText(files.migration, text.migration, 'ON DELETE CASCADE')

  for (const taxonomy of [
    'SPECIES',
    'OCCUPATION',
    'ARCHETYPE',
    'ROLE',
    'ALIGNMENT',
    'PERSONALITY',
    'BACKSTORY',
    'QUIRK',
    'MATERIAL',
    'PROMPT_ENHANCEMENT',
  ]) {
    requireText(files.catalog, text.catalog, `'${taxonomy}'`)
  }

  requireText(files.characterGet, text.characterGet, 'getOptionalApiUser')
  requireText(files.characterPut, text.characterPut, 'requireApiUser')
  requireText(files.characterPut, text.characterPut, 'resolveFacetSelection')
  requireText(files.characterPut, text.characterPut, 'characterFacet.deleteMany')
  requireText(files.characterPut, text.characterPut, 'characterFacet.createMany')

  requireText(files.seed, text.seed, 'ADVENTURE_CARDS')
  requireText(files.seed, text.seed, 'animalDataList')
  requireText(files.seed, text.seed, 'artListPresets')
  requireText(files.seed, text.seed, "title = isWaterBear ? 'Tardigrade'")
  requireText(files.seed, text.seed, "taxonomy !== 'COLOR'")
  requireText(files.seed, text.seed, 'negative prompts remain generation configuration')
  requireText(files.seed, text.seed, 'backfillCharacterLinks')
  requireText(files.seed, text.seed, 'createDatabaseAdapter')
  forbidText(files.seed, text.seed, 'new PrismaMariaDb(')
  forbidText(files.seed, text.seed, "from './../../stores/utils/randomSpecies'")

  requireText(files.catalogStore, text.catalogStore, 'CHARACTER_FIELD_TAXONOMIES')
  requireText(files.catalogStore, text.catalogStore, 'syncCharacterFacets')
  requireText(files.builderPlugin, text.builderPlugin, 'hydrateAdventureBuilder')
  requireText(files.builderPlugin, text.builderPlugin, 'patchGenerator')
  requireText(files.builderPlugin, text.builderPlugin, 'patchCharacterSave')

  requireText(files.randomStore, text.randomStore, 'useFacetCatalogStore')
  requireText(files.randomStore, text.randomStore, 'weightedSample')
  requireText(files.randomStore, text.randomStore, 'catalogPresets')
  forbidText(files.randomStore, text.randomStore, 'randomHelper')
  forbidText(files.randomStore, text.randomStore, 'dreamType=RANDOMLIST')
  forbidText(files.randomStore, text.randomStore, 'BRAINSTORM')
  forbidText(files.randomStore, text.randomStore, 'PITCH')

  requireText(files.randomHelper, text.randomHelper, 'only procedural language pools')
  forbidText(files.randomHelper, text.randomHelper, 'randomSpecies')
  forbidText(files.randomHelper, text.randomHelper, 'randomAnimal')
  forbidText(files.randomHelper, text.randomHelper, 'randomClass')

  requireText(files.variants, text.variants, 'loadFacetCatalogEntries')
  requireText(files.variants, text.variants, 'prisma.reward.findMany')
  forbidText(files.variants, text.variants, 'prisma.dream.findMany')
  forbidText(files.variants, text.variants, 'dreamToRandomListItem')

  requireText(files.vercelBuild, text.vercelBuild, 'seedFacetCatalog.ts')
  requireText(files.vercelBuild, text.vercelBuild, 'Applying production migrations')

  try {
    await access(resolve(root, 'components/art/list-manager.vue'))
    throw new Error(
      'components/art/list-manager.vue must stay removed; random content is managed through Facets.',
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('must stay removed')) {
      throw error
    }
  }

  process.stdout.write('Facet catalog cutover contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
