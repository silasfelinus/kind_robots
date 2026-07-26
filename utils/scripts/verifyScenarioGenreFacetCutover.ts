// /utils/scripts/verifyScenarioGenreFacetCutover.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { SCENARIO_CARDS } from '../../stores/helpers/scenarioCards'

const root = process.cwd()

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing Scenario Genre Facet contract text: ${fragment}`)
  }
}

async function main(): Promise<void> {
  const failures: string[] = []
  const genreCard = SCENARIO_CARDS.find((card) => card.key === 'genre')
  if (!genreCard) throw new Error('Scenario Genre Builder card is missing.')

  const direct: Array<{ value: string; label: string; imagePath: string }> = []
  const extended = new Set<string>()

  for (const step of genreCard.steps) {
    if ((clean(step.field) || clean(step.key)) !== 'genres') continue
    for (const choice of step.choices ?? []) {
      if (choice.opensCustom) continue
      if (choice.opensList) {
        for (const value of choice.listOptions ?? []) {
          const cleaned = clean(value)
          if (cleaned) extended.add(cleaned)
        }
        continue
      }

      const value = clean(choice.value)
      const label = clean(choice.label) || value
      const imagePath = clean(choice.image)
      if (!value) continue
      if (!imagePath) {
        failures.push(`${label} is a direct Scenario Genre choice without artwork.`)
        continue
      }
      direct.push({ value, label, imagePath })
      try {
        await access(resolve(root, 'public', imagePath.slice(1)))
      } catch {
        failures.push(`${label} references missing Scenario Genre artwork: public${imagePath}`)
      }
    }
  }

  if (direct.length < 10) {
    failures.push(`Expected at least 10 illustrated Scenario Genres, found ${direct.length}.`)
  }
  if (extended.size < 40) {
    failures.push(`Expected at least 40 extended Scenario Genres, found ${extended.size}.`)
  }

  const files = {
    seed: 'utils/scripts/seedScenarioGenreFacetCatalog.ts',
    wrapper: 'utils/scripts/runFacetCatalogSeed.ts',
    plugin: 'plugins/20.facet-catalog.client.ts',
    sync: 'server/utils/scenarioGenreFacetSync.ts',
    create: 'server/api/scenarios/index.post.ts',
    patch: 'server/api/scenarios/[id].patch.ts',
    batch: 'server/api/scenarios/batch.post.ts',
    policy: 'scripts/lib/facetCatalogSeedPolicy.mjs',
  } as const
  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await readFile(resolve(root, path), 'utf8')] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.seed, text.seed, 'SCENARIO_CARDS')
  requireText(files.seed, text.seed, "taxonomy: 'GENRE'")
  requireText(files.seed, text.seed, "groupKey: 'scenario-genre'")
  requireText(files.seed, text.seed, 'builderLabel')
  requireText(files.seed, text.seed, 'backfillScenarioGenres')
  requireText(files.seed, text.seed, 'existingPublicImagePath')
  requireText(files.wrapper, text.wrapper, "import('./seedScenarioGenreFacetCatalog')")
  requireText(files.plugin, text.plugin, 'SCENARIO_CARDS')
  requireText(files.plugin, text.plugin, "if (key === 'genres') return 'genre'")
  requireText(files.plugin, text.plugin, 'hydrateScenarioBuilder')
  requireText(files.plugin, text.plugin, 'hydrateBuilderCards(SCENARIO_CARDS, catalog)')
  requireText(files.sync, text.sync, 'syncScenarioGenreFacetsInTransaction')
  requireText(files.sync, text.sync, "where: { taxonomy: 'GENRE' }")
  requireText(files.sync, text.sync, 'facetId: { in: genreFacetIds }')
  requireText(files.create, text.create, 'prisma.$transaction')
  requireText(files.create, text.create, 'syncScenarioGenreFacetsInTransaction')
  requireText(files.patch, text.patch, "if ('genres' in data)")
  requireText(files.patch, text.patch, 'syncScenarioGenreFacetsInTransaction')
  requireText(files.batch, text.batch, 'prisma.$transaction')
  requireText(files.batch, text.batch, 'syncScenarioGenreFacetsInTransaction')
  requireText(files.policy, text.policy, 'stores/helpers/scenarioCards.ts')
  requireText(files.policy, text.policy, 'utils/scripts/seedScenarioGenreFacetCatalog.ts')

  if (failures.length) {
    throw new Error(`Scenario Genre Facet cutover failed:\n- ${failures.join('\n- ')}`)
  }

  process.stdout.write(
    `Scenario Genre Facet cutover verified: ${direct.length} illustrated choices and ${extended.size} extended genres.\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
