// /utils/scripts/verifyFacetHouseGenres.ts
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
  const curatorPath = 'utils/scripts/curateFacetHouseGenres.ts'
  const buildPath = 'scripts/run_facet_catalog_maintenance.ts'
  const workflowPath = '.github/workflows/facet-catalog-contract.yml'
  const [curator, build, workflow] = await Promise.all([
    read(curatorPath),
    read(buildPath),
    read(workflowPath),
  ])

  for (const title of [
    'WeirdCore',
    'ZombieCore',
    'FutureCore',
    'oddCore',
    'EldritchCore',
    'MythCore',
    'CozyCore',
    'CircusCore',
    'EcoCore',
    'KaijuCore',
    'crimeCore',
  ]) {
    requireText(curatorPath, curator, title)
  }

  for (const target of [
    'Weird Fiction',
    'Zombie Fiction',
    'Cyberpunk Fiction',
    'Everyday Wonder',
    'Mythic Fantasy',
    'Cozy Fantasy',
    'Dark Carnival',
    'Eco-Fiction',
    'Kaiju',
    'Heist Fiction',
    'Cosmic Horror',
    'Folk Horror',
  ]) {
    requireText(curatorPath, curator, target)
  }

  requireText(curatorPath, curator, "randomWeight: 0.5")
  requireText(curatorPath, curator, "relationType: 'RELATED'")
  requireText(curatorPath, curator, 'facetArtImage.count')
  requireText(curatorPath, curator, 'facetArtCollection.count')
  requireText(curatorPath, curator, 'catalogCurationHistory')
  requireText(
    curatorPath,
    curator,
    'Similar concepts are related, not falsely aliased',
  )

  for (const protectedField of [
    'flavorText:',
    'examples:',
    'artPrompt:',
    'imagePath:',
    'cardPath:',
    'heroPath:',
    'icon:',
    'artImageId:',
    'artCollectionId:',
  ]) {
    const mutationPattern = new RegExp(
      `prisma\\.facet\\.update\\([\\s\\S]*?${protectedField}`,
    )
    if (mutationPattern.test(curator)) {
      throw new Error(
        `${curatorPath} must not mutate protected artwork field ${protectedField}`,
      )
    }
  }

  requireText(buildPath, build, 'curateFacetHouseGenres.ts')
  requireOrder(
    buildPath,
    build,
    'curateFacetCatalog.ts',
    'curateFacetHouseGenres.ts',
  )
  requireText(workflowPath, workflow, 'Verify house genre curation')
  requireText(workflowPath, workflow, 'verifyFacetHouseGenres.ts')

  process.stdout.write('House genre Facet curation contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
