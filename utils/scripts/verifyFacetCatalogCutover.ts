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

async function requireMissingPath(path: string, reason: string): Promise<void> {
  try {
    await access(resolve(root, path))
    throw new Error(`${path} must stay removed; ${reason}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('must stay removed')) {
      throw error
    }
  }
}

async function main(): Promise<void> {
  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration:
      'prisma/migrations/20260725113000_facet_catalog_cutover/migration.sql',
    catalog: 'server/utils/facetCatalog.ts',
    catalogRoute: 'server/api/facets/catalog.get.ts',
    facetAssignments: 'server/utils/facetAssignments.ts',
    facetCreate: 'server/api/facets/index.post.ts',
    facetPatch: 'server/api/facets/[id].patch.ts',
    profileInput: 'server/utils/facetProfileInput.ts',
    facetStore: 'stores/facetStore.ts',
    facetManager: 'components/facets/facet-manager.vue',
    characterCreate: 'server/api/characters/index.post.ts',
    characterPatch: 'server/api/characters/[id].patch.ts',
    characterFacetSync: 'server/utils/characterFacetSync.ts',
    characterGet: 'server/api/characters/[id]/facets.get.ts',
    characterPut: 'server/api/characters/[id]/facets.put.ts',
    seedWrapper: 'utils/scripts/runFacetCatalogSeed.ts',
    seed: 'utils/scripts/seedFacetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    generatorStore: 'stores/generatorStore.ts',
    randomStore: 'stores/randomStore.ts',
    randomHelper: 'stores/helpers/randomHelper.ts',
    builderPlugin: 'plugins/20.facet-catalog.client.ts',
    variants: 'server/api/challenges/variants.post.ts',
    vercelBuild: 'scripts/vercel-build.mjs',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
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

  requireText(files.catalog, text.catalog, 'normalizeFacetLookupKey')
  requireText(files.catalog, text.catalog, 'prisma.facetAlias.findMany')
  requireText(files.catalog, text.catalog, 'aliasFacetIds')
  requireText(files.catalog, text.catalog, 'lookupKey: { contains: normalizedSearch }')
  requireText(files.catalog, text.catalog, 'id: { in: aliasFacetIds }')
  requireText(files.catalog, text.catalog, 'if (options.take == null)')

  requireText(files.profileInput, text.profileInput, 'normalizeFacetTaxonomy')
  requireText(files.profileInput, text.profileInput, 'buildFacetProfileCreateData')
  requireText(files.profileInput, text.profileInput, 'buildFacetProfileUpdateData')
  requireText(files.profileInput, text.profileInput, "taxonomy !== 'COLOR'")
  requireText(
    files.profileInput,
    text.profileInput,
    'Facet metadata must be a valid JSON object.',
  )
  requireText(files.facetCreate, text.facetCreate, 'buildFacetProfileCreateData')
  requireText(files.facetCreate, text.facetCreate, 'tx.facetProfile.create')
  requireText(files.facetCreate, text.facetCreate, 'facetId: facet.id')
  requireText(files.facetPatch, text.facetPatch, 'buildFacetProfileUpdateData')
  requireText(files.facetPatch, text.facetPatch, 'tx.facetProfile.upsert')
  requireText(files.facetPatch, text.facetPatch, 'where: { facetId: id }')

  requireText(files.facetAssignments, text.facetAssignments, 'prisma.facetProfile.findMany')
  requireText(files.facetAssignments, text.facetAssignments, 'randomWeight: profile?.randomWeight')
  requireText(files.facetAssignments, text.facetAssignments, 'metadata: parseMetadata')
  requireText(files.facetStore, text.facetStore, 'FACET_LIBRARY_PAGE_SIZE')
  requireText(files.facetStore, text.facetStore, 'while (true)')
  requireText(files.facetStore, text.facetStore, 'skip += page.length')
  requireText(files.facetStore, text.facetStore, 'taxonomy: FacetTaxonomy')
  requireText(files.facetManager, text.facetManager, 'Create canonical Facet')
  requireText(files.facetManager, text.facetManager, 'newRandomWeight')
  requireText(files.facetManager, text.facetManager, 'editForm.isRandomizable')
  requireText(files.facetManager, text.facetManager, 'kindForTaxonomy')

  requireText(
    files.characterFacetSync,
    text.characterFacetSync,
    'syncCharacterFacetsInTransaction',
  )
  requireText(files.characterFacetSync, text.characterFacetSync, 'CHARACTER_MUTATION')
  requireText(files.characterFacetSync, text.characterFacetSync, 'tx.characterFacet.deleteMany')
  requireText(files.characterFacetSync, text.characterFacetSync, 'tx.characterFacet.createMany')
  requireText(files.characterFacetSync, text.characterFacetSync, 'allowed.includes(taxonomy)')
  requireText(files.characterCreate, text.characterCreate, 'prisma.$transaction')
  requireText(files.characterCreate, text.characterCreate, 'syncCharacterFacetsInTransaction')
  requireText(files.characterPatch, text.characterPatch, 'prisma.$transaction')
  requireText(files.characterPatch, text.characterPatch, 'syncCharacterFacetsInTransaction')

  requireText(files.characterGet, text.characterGet, 'getOptionalApiUser')
  requireText(files.characterPut, text.characterPut, 'requireApiUser')
  requireText(files.characterPut, text.characterPut, 'resolveFacetSelection')
  requireText(files.characterPut, text.characterPut, 'characterFacet.deleteMany')
  requireText(files.characterPut, text.characterPut, 'characterFacet.createMany')

  requireText(files.seedWrapper, text.seedWrapper, 'ADVENTURE_CARDS')
  requireText(files.seedWrapper, text.seedWrapper, 'if (!choice.opensList) continue')
  requireText(files.seedWrapper, text.seedWrapper, 'choice.listOptions')
  requireText(files.seedWrapper, text.seedWrapper, 'step.listOptions = Array.from(completeList)')
  requireText(files.seedWrapper, text.seedWrapper, 'promotedBuilderOptions')

  requireText(files.seed, text.seed, 'ADVENTURE_CARDS')
  requireText(files.seed, text.seed, 'animalDataList')
  requireText(files.seed, text.seed, 'artListPresets')
  requireText(files.seed, text.seed, "title = isWaterBear ? 'Tardigrade'")
  requireText(files.seed, text.seed, "taxonomy !== 'COLOR'")
  requireText(
    files.seed,
    text.seed,
    'negative prompts remain generation configuration',
  )
  requireText(files.seed, text.seed, 'backfillCharacterLinks')
  requireText(files.seed, text.seed, 'createDatabaseAdapter')
  forbidText(files.seed, text.seed, 'new PrismaMariaDb(')
  forbidText(files.seed, text.seed, "from './../../stores/utils/randomSpecies'")

  requireText(files.catalogStore, text.catalogStore, 'CHARACTER_FIELD_TAXONOMIES')
  requireText(files.catalogStore, text.catalogStore, 'fetchAllCatalogPages')
  requireText(files.catalogStore, text.catalogStore, 'while (true)')
  requireText(files.catalogStore, text.catalogStore, 'skip += page.length')
  requireText(files.catalogStore, text.catalogStore, 'entriesById.set(entry.id, entry)')
  forbidText(files.catalogStore, text.catalogStore, 'syncCharacterFacets')
  forbidText(files.catalogStore, text.catalogStore, 'characterAssignments')
  forbidText(files.catalogStore, text.catalogStore, 'splitCharacterField')

  requireText(files.generatorStore, text.generatorStore, 'useFacetCatalogStore')
  requireText(files.generatorStore, text.generatorStore, 'const facetCatalog = useFacetCatalogStore()')
  requireText(files.generatorStore, text.generatorStore, 'facetCatalog.randomFacetForField(fieldKey)')
  requireText(files.generatorStore, text.generatorStore, '.facetsForCharacterField(fieldKey)')
  requireText(files.generatorStore, text.generatorStore, 'entry.isRandomizable && entry.randomWeight > 0')
  requireText(files.generatorStore, text.generatorStore, "return facetValue('species'")
  requireText(files.generatorStore, text.generatorStore, "return facetValue('backstory', legacyBackstory)")
  forbidText(files.generatorStore, text.generatorStore, '__facetCatalogPatched')

  requireText(files.builderPlugin, text.builderPlugin, 'hydrateAdventureBuilder')
  requireText(files.builderPlugin, text.builderPlugin, 'Generator methods read this same catalog')
  forbidText(files.builderPlugin, text.builderPlugin, 'patchGenerator')
  forbidText(files.builderPlugin, text.builderPlugin, '__facetCatalogPatched')
  forbidText(files.builderPlugin, text.builderPlugin, 'useGeneratorStore')
  forbidText(files.builderPlugin, text.builderPlugin, 'patchCharacterSave')
  forbidText(files.builderPlugin, text.builderPlugin, 'useCharacterStore')

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
  forbidText(files.variants, text.variants, 'take: 1000')
  forbidText(files.variants, text.variants, 'prisma.dream.findMany')
  forbidText(files.variants, text.variants, 'dreamToRandomListItem')

  requireText(files.vercelBuild, text.vercelBuild, 'seedFacetCatalog.ts')
  requireText(files.vercelBuild, text.vercelBuild, 'Applying production migrations')

  await requireMissingPath(
    'components/art/list-manager.vue',
    'random content is managed through Facets.',
  )
  await requireMissingPath(
    'stores/utils/randomCharacter.ts',
    'the canonical catalog and Reward system own reusable Character generation pools.',
  )
  await requireMissingPath(
    'stores/utils/randomSpecies.ts',
    'species selection is canonical Facet data rather than a nondeterministic module-level generator.',
  )
  await requireMissingPath(
    'stores/utils/randomAnimal.ts',
    'animals are canonical Facets enriched from animalData rather than a duplicate string pool.',
  )
  await requireMissingPath(
    'stores/utils/randomSkills.ts',
    'skills are Reward records rather than an orphaned random string module.',
  )

  process.stdout.write('Facet catalog cutover contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
