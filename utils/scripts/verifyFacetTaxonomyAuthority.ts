// Verify that FacetProfile.taxonomy is the typed, user-facing classifier and
// Facet.kind survives only as a server-derived compatibility column.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing taxonomy authority text: ${fragment}`)
  }
}

function forbidText(path: string, text: string, fragment: string): void {
  if (text.includes(fragment)) {
    throw new Error(`${path} contains deprecated kind authority: ${fragment}`)
  }
}

function extractQuotedArray(text: string, marker: string): string[] {
  const start = text.indexOf(marker)
  if (start < 0) throw new Error(`Could not find ${marker}`)
  const open = text.indexOf('[', start)
  const close = text.indexOf('] as const', open)
  if (open < 0 || close < 0) throw new Error(`Could not parse ${marker}`)
  return Array.from(text.slice(open, close).matchAll(/'([A-Z_]+)'/g), (match) => match[1])
}

function extractPrismaEnum(text: string, enumName: string): string[] {
  const match = text.match(new RegExp(`enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\}`))
  if (!match) throw new Error(`Could not parse Prisma enum ${enumName}.`)
  return match[1]
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => /^[A-Z][A-Z_]+$/.test(value))
}

function sameValues(label: string, left: string[], right: string[]): void {
  const a = [...left].sort()
  const b = [...right].sort()
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${label} mismatch:\nleft=${a.join(', ')}\nright=${b.join(', ')}`)
  }
}

async function main(): Promise<void> {
  const files = {
    schema: 'prisma/facet-catalog.prisma',
    migration:
      'prisma/migrations/20260727022500_facet_taxonomy_authority/migration.sql',
    serverCatalog: 'server/utils/facetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    profileInput: 'server/utils/facetProfileInput.ts',
    createApi: 'server/api/facets/index.post.ts',
    patchApi: 'server/api/facets/[id].patch.ts',
    listApi: 'server/api/facets/index.get.ts',
    assignments: 'server/utils/facetAssignments.ts',
    facetStore: 'stores/facetStore.ts',
    profileForm: 'utils/facetProfileForm.ts',
    picker: 'components/facets/facet-picker.vue',
    manager: 'components/facets/facet-manager.vue',
    serendipity: 'components/pages/serendipity-page.vue',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  const prismaTaxonomies = extractPrismaEnum(text.schema, 'FacetTaxonomy')
  const serverTaxonomies = extractQuotedArray(text.serverCatalog, 'FACET_TAXONOMIES')
  const clientTaxonomies = extractQuotedArray(text.catalogStore, 'FACET_TAXONOMIES')
  sameValues('Prisma/server taxonomy', prismaTaxonomies, serverTaxonomies)
  sameValues('Prisma/client taxonomy', prismaTaxonomies, clientTaxonomies)

  requireText(files.schema, text.schema, 'taxonomy         FacetTaxonomy @default(OTHER)')
  requireText(files.migration, text.migration, 'MODIFY `taxonomy` ENUM(')
  requireText(files.migration, text.migration, "SET `taxonomy` = 'OTHER'")
  for (const taxonomy of prismaTaxonomies) {
    requireText(files.migration, text.migration, `'${taxonomy}'`)
  }

  requireText(files.profileInput, text.profileInput, 'assertLegacyFacetKindAbsent')
  requireText(files.profileInput, text.profileInput, 'legacyFacetKindForTaxonomy')
  requireText(files.profileInput, text.profileInput, 'Facet kind is deprecated. Use taxonomy instead.')
  requireText(files.createApi, text.createApi, 'assertLegacyFacetKindAbsent(body)')
  requireText(files.createApi, text.createApi, 'legacyFacetKindForTaxonomy(profileData.taxonomy)')
  requireText(files.patchApi, text.patchApi, 'assertLegacyFacetKindAbsent(body)')
  requireText(files.patchApi, text.patchApi, 'legacyFacetKindForTaxonomy(nextTaxonomy)')
  requireText(files.listApi, text.listApi, 'query.taxonomy')
  requireText(files.listApi, text.listApi, 'prisma.facetProfile.findMany')
  requireText(files.listApi, text.listApi, 'Facet kind filtering is deprecated. Use taxonomy instead.')

  requireText(files.assignments, text.assignments, 'sortFacetSummaries')
  requireText(files.assignments, text.assignments, 'profile?.taxonomy')
  forbidText(files.assignments, text.assignments, 'export const facetKinds')
  forbidText(files.assignments, text.assignments, "orderBy: [{ kind: 'asc' }")

  requireText(files.facetStore, text.facetStore, 'taxonomy?: FacetTaxonomy')
  requireText(files.facetStore, text.facetStore, 'taxonomy: FacetTaxonomy')
  forbidText(files.facetStore, text.facetStore, 'FacetKind')
  forbidText(files.facetStore, text.facetStore, 'kind?:')
  forbidText(files.profileForm, text.profileForm, 'kindForTaxonomy')
  forbidText(files.profileForm, text.profileForm, 'kind:')

  requireText(files.picker, text.picker, 'newTaxonomy')
  requireText(files.picker, text.picker, 'facet.taxonomy')
  requireText(files.picker, text.picker, 'FACET_TAXONOMIES')
  for (const forbidden of ['FacetKind', 'newKind', 'facet.kind', 'kindLabel']) {
    forbidText(files.picker, text.picker, forbidden)
  }

  requireText(files.manager, text.manager, 'taxonomyLabel(facet.taxonomy)')
  forbidText(files.manager, text.manager, 'facet.kind')

  // One bounded compatibility consumer remains until the physical Facet.kind
  // column is dropped: Serendipity uses only five broad values for which the
  // server-derived compatibility kind is exactly equal to taxonomy.
  requireText(
    files.serendipity,
    text.serendipity,
    "const storyGrammarKinds = new Set(['GENRE', 'CORE', 'THEME', 'MOOD', 'STYLE'])",
  )
  requireText(files.serendipity, text.serendipity, 'storyGrammarKinds.has(facet.kind)')

  process.stdout.write(
    `Facet taxonomy authority verified across ${prismaTaxonomies.length} typed taxonomies.\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
