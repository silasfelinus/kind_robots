// /utils/scripts/verifyFacetTaxonomyLeaks.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

async function read(path: string): Promise<string> {
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

async function main(): Promise<void> {
  const curatorPath = 'utils/scripts/curateFacetTaxonomyLeaks.ts'
  const buildPath = 'scripts/run_facet_catalog_maintenance.ts'
  const workflowPath = '.github/workflows/facet-catalog-contract.yml'
  const [curator, build, workflow] = await Promise.all([
    read(curatorPath),
    read(buildPath),
    read(workflowPath),
  ])

  const taxonomyContracts: ReadonlyArray<readonly [string, string]> = [
    ['Creative Writer', "taxonomy: 'OCCUPATION'"],
    ["Believes They're Psychic", "taxonomy: 'QUIRK'"],
    ['Animist', "taxonomy: 'THEME'"],
    ['Can only sleep standing up', "taxonomy: 'QUIRK'"],
    ['Cursed to speak only in riddles', "taxonomy: 'QUIRK'"],
  ]
  for (const [title, taxonomy] of taxonomyContracts) {
    requireText(curatorPath, curator, title)
    requireText(curatorPath, curator, taxonomy)
  }

  for (const suppressed of [
    '4k render',
    'award-winning',
    'award-winning concept art',
    'Ambiguous',
  ]) {
    requireText(curatorPath, curator, suppressed)
  }
  requireText(curatorPath, curator, 'isRandomizable: false')
  requireText(curatorPath, curator, 'randomWeight: 0')

  requireText(curatorPath, curator, 'Whimsical Stew')
  requireText(curatorPath, curator, "slug: 'whimsical-tone'")
  requireText(curatorPath, curator, "title: 'Whimsical Tone'")
  requireText(curatorPath, curator, "title: 'Culinary Fantasy'")
  requireText(curatorPath, curator, 'findUnique({ where: { slug: definition.slug } })')
  requireText(curatorPath, curator, "relationType: 'CONTAINS'")
  requireText(curatorPath, curator, "groupKey: 'genre-recipe'")

  requireText(curatorPath, curator, 'facetArtImage.count')
  requireText(curatorPath, curator, 'facetArtCollection.count')
  requireText(curatorPath, curator, 'catalogCurationHistory')
  requireText(
    curatorPath,
    curator,
    'Taxonomy repairs preserve stable Facet rows',
  )

  requireText(buildPath, build, 'curateFacetTaxonomyLeaks.ts')
  requireOrder(
    buildPath,
    build,
    'mergeFacetPersonalitySynonyms.ts',
    'curateFacetTaxonomyLeaks.ts',
  )
  requireText(workflowPath, workflow, 'Verify Facet taxonomy leak repairs')
  requireText(workflowPath, workflow, 'verifyFacetTaxonomyLeaks.ts')

  process.stdout.write('Facet taxonomy leak repair contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
