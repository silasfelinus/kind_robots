// Verify that FacetProfile.taxonomy is the typed, user-facing classifier and
// Facet.kind is gone (t-072); FacetProfile.taxonomy is the sole authority.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { containsCode } from './lib/sourceText'

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
  if (containsCode(text, fragment)) {
    throw new Error(`${path} contains deprecated kind authority: ${fragment}`)
  }
}

function extractQuotedArray(text: string, marker: string): string[] {
  const start = text.indexOf(marker)
  if (start < 0) throw new Error(`Could not find ${marker}`)
  const open = text.indexOf('[', start)
  const close = text.indexOf('] as const', open)
  if (open < 0 || close < 0) throw new Error(`Could not parse ${marker}`)
  return Array.from(text.slice(open, close).matchAll(/'([A-Z_]+)'/g))
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
}

function extractPrismaEnum(text: string, enumName: string): string[] {
  const match = text.match(
    new RegExp(`enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\}`),
  )
  const body = match?.[1]
  if (!body) throw new Error(`Could not parse Prisma enum ${enumName}.`)
  return body
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => /^[A-Z][A-Z_]+$/.test(value))
}

function sameValues(label: string, left: string[], right: string[]): void {
  const a = [...left].sort()
  const b = [...right].sort()
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(
      `${label} mismatch:\nleft=${a.join(', ')}\nright=${b.join(', ')}`,
    )
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
    taskmaster: 'components/pages/taskmaster-page.vue',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  const prismaTaxonomies = extractPrismaEnum(text.schema, 'FacetTaxonomy')
  const serverTaxonomies = extractQuotedArray(
    text.serverCatalog,
    'FACET_TAXONOMIES',
  )
  const clientTaxonomies = extractQuotedArray(
    text.catalogStore,
    'FACET_TAXONOMIES',
  )
  sameValues('Prisma/server taxonomy', prismaTaxonomies, serverTaxonomies)
  sameValues('Prisma/client taxonomy', prismaTaxonomies, clientTaxonomies)

  requireText(
    files.schema,
    text.schema,
    'taxonomy         FacetTaxonomy @default(OTHER)',
  )
  requireText(files.migration, text.migration, 'MODIFY `taxonomy` ENUM(')
  requireText(files.migration, text.migration, "SET `taxonomy` = 'OTHER'")
  for (const taxonomy of prismaTaxonomies) {
    requireText(files.migration, text.migration, `'${taxonomy}'`)
  }

  requireText(
    files.profileInput,
    text.profileInput,
    'assertLegacyFacetKindAbsent',
  )
  /* t-072 dropped the physical Facet.kind column, which made the
     legacyFacetKindForTaxonomy() derivation dead code -- so these flipped from
     "must derive it" to "must not resurrect it". FacetProfile.taxonomy is the
     only classification left. */
  forbidText(
    files.profileInput,
    text.profileInput,
    'legacyFacetKindForTaxonomy',
  )
  requireText(
    files.profileInput,
    text.profileInput,
    'Facet kind is deprecated. Use taxonomy instead.',
  )
  requireText(
    files.createApi,
    text.createApi,
    'assertLegacyFacetKindAbsent(body)',
  )
  forbidText(files.createApi, text.createApi, 'legacyFacetKindForTaxonomy')
  requireText(
    files.patchApi,
    text.patchApi,
    'assertLegacyFacetKindAbsent(body)',
  )
  forbidText(files.patchApi, text.patchApi, 'legacyFacetKindForTaxonomy')
  requireText(files.listApi, text.listApi, 'query.taxonomy')
  requireText(files.listApi, text.listApi, 'prisma.facetProfile.findMany')
  requireText(
    files.listApi,
    text.listApi,
    'Facet kind filtering is deprecated. Use taxonomy instead.',
  )

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

  /*
   * The manager keys on `taxonomy`, never on the retired `kind`. It used to
   * spell that as `taxonomyLabel(facet.taxonomy)` inside its Library card grid;
   * that grid is gone (it was a second Facet browser on the Facets route), and
   * the manager now labels taxonomies for its catalog breakdown while reading
   * `facet.taxonomy` to count them. Both halves are asserted separately so the
   * contract tracks the authority rather than one deleted call site.
   */
  requireText(files.manager, text.manager, 'taxonomyLabel(')
  requireText(files.manager, text.manager, 'facet.taxonomy')
  forbidText(files.manager, text.manager, 'facet.kind')

  requireText(
    files.taskmaster,
    text.taskmaster,
    'storyGrammarTaxonomies.has(facet.taxonomy)',
  )
  forbidText(files.taskmaster, text.taskmaster, 'facet.kind')
  forbidText(files.taskmaster, text.taskmaster, 'serendipity')

  process.stdout.write(
    `Facet taxonomy authority verified across ${prismaTaxonomies.length} typed taxonomies.\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
