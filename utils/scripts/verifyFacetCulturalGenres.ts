// /utils/scripts/verifyFacetCulturalGenres.ts
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

function requireOrder(path: string, text: string, before: string, after: string): void {
  const beforeIndex = text.indexOf(before)
  const afterIndex = text.indexOf(after)
  if (beforeIndex < 0 || afterIndex < 0 || beforeIndex >= afterIndex) {
    throw new Error(`${path} must run ${after} after ${before}`)
  }
}

async function main(): Promise<void> {
  const curatorPath = 'utils/scripts/curateFacetCulturalGenres.ts'
  const buildPath = 'scripts/run_facet_catalog_maintenance.ts'
  const workflowPath = '.github/workflows/facet-catalog-contract.yml'
  const [curator, build, workflow] = await Promise.all([
    read(curatorPath),
    read(buildPath),
    read(workflowPath),
  ])

  for (const oldTitle of [
    'Asian Fantasy',
    'African Mythpunk',
    'Arabian Nights Redux',
    'Oceanic Mythology',
    'Eastern European Folklore',
  ]) {
    requireText(curatorPath, curator, oldTitle)
  }

  for (const refinedTitle of [
    'East Asian Fantasy',
    'African Mythic Fantasy',
    'One Thousand and One Nights Fantasy',
    'Oceanian Mythic Fantasy',
    'Eastern European Folkloric Fantasy',
    'Japanese Folkloric Fantasy',
    'Everyday Animist Fantasy',
    'Africanfuturism',
    'Afrofuturism',
  ]) {
    requireText(curatorPath, curator, refinedTitle)
  }

  requireText(curatorPath, curator, 'Nnedi Okorafor: Africanfuturism Defined')
  requireText(
    curatorPath,
    curator,
    'Smithsonian National Museum of African American History and Culture: Afrofuturism',
  )
  requireText(curatorPath, curator, 'const canRename = !artBacked')
  requireText(curatorPath, curator, 'preserved-art-backed-title')
  requireText(curatorPath, curator, 'do not treat as aliases')
  requireText(curatorPath, curator, 'facetArtImage.count')
  requireText(curatorPath, curator, 'facetArtCollection.count')

  requireText(buildPath, build, 'curateFacetCulturalGenres.ts')
  requireOrder(
    buildPath,
    build,
    'curateFacetHouseGenres.ts',
    'curateFacetCulturalGenres.ts',
  )
  requireText(workflowPath, workflow, 'Verify cultural genre curation')
  requireText(workflowPath, workflow, 'verifyFacetCulturalGenres.ts')

  process.stdout.write('Cultural genre Facet curation contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
