// /utils/scripts/verifyFacetGenreLeaks.ts
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
  const curatorPath = 'utils/scripts/curateFacetGenreLeaks.ts'
  const buildPath = 'scripts/run_facet_catalog_maintenance.ts'
  const workflowPath = '.github/workflows/facet-catalog-contract.yml'
  const [curator, build, workflow] = await Promise.all([
    read(curatorPath),
    read(buildPath),
    read(workflowPath),
  ])

  requireText(curatorPath, curator, 'Artificial Intelligence')
  requireText(curatorPath, curator, 'Animal Protagonists')
  requireText(curatorPath, curator, "taxonomy: 'THEME'")
  requireText(curatorPath, curator, "groupKey: 'subject-theme'")
  requireText(curatorPath, curator, "groupKey: 'cast-theme'")

  requireText(curatorPath, curator, 'Sky Nomad')
  requireText(curatorPath, curator, "slug: 'aerial-world'")
  requireText(curatorPath, curator, "slug: 'nomadic-culture'")
  requireText(curatorPath, curator, 'Political Candlelight Drama')
  requireText(curatorPath, curator, "slug: 'political-drama'")
  requireText(curatorPath, curator, "slug: 'candlelit-intimacy'")
  requireText(curatorPath, curator, "groupKey: 'genre-recipe'")
  requireText(curatorPath, curator, 'isRandomizable: false')
  requireText(curatorPath, curator, 'randomWeight: 0')
  requireText(curatorPath, curator, "relationType: 'CONTAINS'")

  requireText(curatorPath, curator, 'facetArtImage.count')
  requireText(curatorPath, curator, 'facetArtCollection.count')
  requireText(curatorPath, curator, 'catalogCurationHistory')
  requireText(
    curatorPath,
    curator,
    'Art-backed subject and cast Facets keep their stable rows',
  )

  requireText(buildPath, build, 'curateFacetGenreLeaks.ts')
  requireOrder(
    buildPath,
    build,
    'curateFacetTaxonomyLeaks.ts',
    'curateFacetGenreLeaks.ts',
  )
  requireText(workflowPath, workflow, 'Verify Facet genre leak repairs')
  requireText(workflowPath, workflow, 'verifyFacetGenreLeaks.ts')

  process.stdout.write('Facet genre leak repair contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
