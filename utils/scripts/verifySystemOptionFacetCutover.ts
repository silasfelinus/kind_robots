// Verify that illustrated enum-backed Builder decks are canonical Facet catalogs
// without replacing the Prisma enums that validate persisted values.
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { RewardType, Rarity } from '../../prisma/generated/prisma/enums'
import { CREATABLE_DREAM_TYPES } from '../../stores/helpers/dreamHelper'
import { SYSTEM_OPTION_FACET_TARGETS } from '../seeds/facetSystemOptionArtwork'
import { containsCode } from './lib/sourceText'

const root = process.cwd()

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing system option Facet contract text: ${fragment}`)
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

function sorted(values: readonly string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b))
}

function assertSameSet(
  label: string,
  actual: readonly string[],
  expected: readonly string[],
  failures: string[],
): void {
  const actualSorted = sorted(actual)
  const expectedSorted = sorted(expected)
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    failures.push(
      `${label} mismatch. Expected [${expectedSorted.join(', ')}], found [${actualSorted.join(', ')}].`,
    )
  }
}

async function main(): Promise<void> {
  const failures: string[] = []
  const missingArtwork: string[] = []

  const byTaxonomy = new Map<string, string[]>()
  const identities = new Set<string>()
  for (const target of SYSTEM_OPTION_FACET_TARGETS) {
    const identity = `${target.taxonomy}:${target.enumValue}`
    if (identities.has(identity)) failures.push(`Duplicate system option target ${identity}.`)
    identities.add(identity)

    const values = byTaxonomy.get(target.taxonomy) ?? []
    values.push(target.enumValue)
    byTaxonomy.set(target.taxonomy, values)

    if (!target.path.startsWith('/images/')) {
      failures.push(`${identity} uses non-public artwork path ${target.path}.`)
    } else if (!(await pathExists(target.path))) {
      missingArtwork.push(target.path)
    }
  }

  assertSameSet(
    'Dream Type presentation Facets',
    byTaxonomy.get('DREAM_TYPE') ?? [],
    CREATABLE_DREAM_TYPES,
    failures,
  )
  assertSameSet(
    'Reward Type presentation Facets',
    byTaxonomy.get('REWARD_TYPE') ?? [],
    Object.values(RewardType),
    failures,
  )
  assertSameSet(
    'Rarity presentation Facets',
    byTaxonomy.get('RARITY') ?? [],
    Object.values(Rarity),
    failures,
  )

  const expectedTotal =
    CREATABLE_DREAM_TYPES.length +
    Object.values(RewardType).length +
    Object.values(Rarity).length
  if (SYSTEM_OPTION_FACET_TARGETS.length !== expectedTotal) {
    failures.push(
      `Expected ${expectedTotal} enum-backed presentation Facets, found ${SYSTEM_OPTION_FACET_TARGETS.length}.`,
    )
  }

  const files = {
    serverCatalog: 'server/utils/facetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    plugin: 'plugins/20.facet-catalog.client.ts',
    seed: 'utils/scripts/seedSystemOptionFacets.ts',
    manifest: 'utils/seeds/facetSystemOptionArtwork.ts',
    wrapper: 'utils/scripts/runFacetCatalogSeed.ts',
  } as const
  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await readFile(resolve(root, path), 'utf8')] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  for (const taxonomy of ['DREAM_TYPE', 'REWARD_TYPE', 'RARITY']) {
    requireText(files.serverCatalog, text.serverCatalog, `'${taxonomy}'`)
    requireText(files.catalogStore, text.catalogStore, `'${taxonomy}'`)
  }
  requireText(files.catalogStore, text.catalogStore, 'SYSTEM_FIELD_TAXONOMIES')
  requireText(files.catalogStore, text.catalogStore, "dreamType: ['DREAM_TYPE']")
  requireText(files.catalogStore, text.catalogStore, "rewardType: ['REWARD_TYPE']")
  requireText(files.catalogStore, text.catalogStore, "rarity: ['RARITY']")
  requireText(files.catalogStore, text.catalogStore, 'builderChoicesForSystemField')
  requireText(files.catalogStore, text.catalogStore, "'enumValue'")
  requireText(files.plugin, text.plugin, 'DREAM_CARDS')
  requireText(files.plugin, text.plugin, 'REWARD_CARDS')
  requireText(files.plugin, text.plugin, 'hydrateSystemBuilder')
  requireText(files.plugin, text.plugin, 'structuralEnum: true')
  requireText(files.seed, text.seed, 'SYSTEM_OPTION_FACET_TARGETS')
  requireText(files.seed, text.seed, 'isRandomizable: false')
  requireText(files.seed, text.seed, 'randomWeight: 0')
  requireText(files.seed, text.seed, 'structuralEnum: true')
  requireText(files.seed, text.seed, 'enumValue: target.enumValue')
  requireText(files.seed, text.seed, 'taxonomy: target.taxonomy')
  requireText(files.wrapper, text.wrapper, "import('./seedSystemOptionFacets')")

  for (const forbidden of ['prisma.dreamFacet', 'prisma.rewardFacet']) {
    if (containsCode(text.seed, forbidden)) {
      failures.push(
        `${files.seed} must not duplicate structural enum values into assignment tables (${forbidden}).`,
      )
    }
  }

  if (failures.length) {
    throw new Error(`System option Facet cutover failed:\n- ${failures.join('\n- ')}`)
  }

  process.stdout.write(
    `System option Facet parity verified: ${CREATABLE_DREAM_TYPES.length} Dream Types, ` +
      `${Object.values(RewardType).length} Reward Types, and ` +
      `${Object.values(Rarity).length} Rarity tiers.\n`,
  )

  const debt = Array.from(new Set(missingArtwork)).sort()
  if (debt.length) {
    process.stdout.write(
      `Known system option artwork debt (${debt.length}; broken paths are not persisted):\n` +
        debt.map((path) => `- public${path}`).join('\n') +
        '\n',
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
