// /utils/scripts/verifyFacetCuration.ts
import { readFile } from 'node:fs/promises'
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

function requireOrder(
  path: string,
  text: string,
  before: string,
  after: string,
): void {
  const beforeIndex = text.indexOf(before)
  const afterIndex = text.indexOf(after)
  if (beforeIndex < 0 || afterIndex < 0 || beforeIndex >= afterIndex) {
    throw new Error(`${path} must run ${after} after ${before}`)
  }
}

function forbidFacetArtMutation(path: string, text: string): void {
  const updateCalls = text.match(/prisma\.facet\.update\(\{[\s\S]*?\n\s*\}\)/g) ?? []
  const protectedFields = [
    'flavorText',
    'examples',
    'artPrompt',
    'imagePath',
    'cardPath',
    'heroPath',
    'icon',
    'artImageId',
    'artCollectionId',
  ]

  for (const call of updateCalls) {
    const dataStart = call.indexOf('data:')
    if (dataStart < 0) continue
    const data = call.slice(dataStart)
    for (const field of protectedFields) {
      if (new RegExp(`\\b${field}\\s*:`).test(data)) {
        throw new Error(
          `${path} mutates protected curated-art field ${field} inside prisma.facet.update`,
        )
      }
    }
  }
}

async function main(): Promise<void> {
  const files = {
    curation: 'utils/seeds/facetCatalogCuration.ts',
    curator: 'utils/scripts/curateFacetCatalog.ts',
    runner: 'scripts/run_facet_catalog_maintenance.ts',
    workflow: '.github/workflows/facet-catalog-contract.yml',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.curation, text.curation, "'The Big Blue'")
  requireText(files.curation, text.curation, "taxonomy: 'SETTING'")
  requireText(files.curation, text.curation, "'Underwater Cathedral'")
  requireText(files.curation, text.curation, "'Infinite Archive'")
  requireText(files.curation, text.curation, "'Bioluminescent Underground'")

  for (const composite of [
    'Isekai (reluctant)',
    'Slice of Life (complicated)',
    'Shonen (aging protagonist)',
    'Magical Girl (retired)',
    'Hard Sci-Fi (soft feelings)',
    'Body Horror (tender)',
    "Kaiju (from the kaiju's perspective)",
    'Noir (one detail wrong)',
    'Carnival (abandoned, still running)',
    'Western (strange angle)',
  ]) {
    requireText(files.curation, text.curation, composite)
  }

  requireText(files.curation, text.curation, "groupKey: 'genre-recipe'")
  requireText(files.curation, text.curation, 'isRandomizable: false')
  requireText(files.curation, text.curation, 'randomWeight: 0')
  requireText(files.curation, text.curation, "relationType: 'CONTAINS'")
  requireText(files.curation, text.curation, 'randomWeight: 3')
  requireText(files.curation, text.curation, 'randomWeight: 1.5')
  requireText(files.curation, text.curation, 'randomWeight: 0.5')

  requireText(files.curator, text.curator, 'CURATION_SOURCE_RANK = 1')
  requireText(files.curator, text.curator, 'facetArtImage.count')
  requireText(files.curator, text.curator, 'facetArtCollection.count')
  requireText(files.curator, text.curator, 'catalogCurationHistory')
  requireText(files.curator, text.curator, 'fromFacetId_toFacetId_relationType')
  requireText(
    files.curator,
    text.curator,
    'Facet ids and all direct or joined artwork are preserved',
  )
  forbidFacetArtMutation(files.curator, text.curator)

  requireText(files.runner, text.runner, 'curateFacetCatalog.ts')
  requireOrder(
    files.runner,
    text.runner,
    'mergeCanonicalFacetDuplicates.ts',
    'curateFacetCatalog.ts',
  )

  requireText(files.workflow, text.workflow, 'Verify Facet curation batches')
  requireText(files.workflow, text.workflow, 'verifyFacetCuration.ts')

  process.stdout.write('Facet curation contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
