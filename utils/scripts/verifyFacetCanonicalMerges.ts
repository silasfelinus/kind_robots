// /utils/scripts/verifyFacetCanonicalMerges.ts
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

function forbidText(path: string, text: string, value: string): void {
  if (text.includes(value)) {
    throw new Error(`${path} contains retired contract text: ${value}`)
  }
}

async function main(): Promise<void> {
  const files = {
    wrapper: 'utils/scripts/runFacetCatalogSeed.ts',
    merge: 'utils/scripts/mergeCanonicalFacetDuplicates.ts',
    build: 'scripts/vercel-build.mjs',
    package: 'package.json',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.wrapper, text.wrapper, "=== 'waterbear'")
  requireText(files.wrapper, text.wrapper, ").name = 'Tardigrade'")
  requireText(files.wrapper, text.wrapper, "await import('./seedFacetCatalog')")

  requireText(files.merge, text.merge, "canonicalSlug: 'tardigrade'")
  requireText(files.merge, text.merge, "duplicateSlug: 'water-bear'")
  requireText(files.merge, text.merge, "aliases: ['Water Bear']")
  requireText(files.merge, text.merge, 'characterFacet.createMany')
  requireText(files.merge, text.merge, 'dreamFacet.createMany')
  requireText(files.merge, text.merge, 'scenarioFacet.createMany')
  requireText(files.merge, text.merge, 'facetArtImage.createMany')
  requireText(files.merge, text.merge, 'facetArtCollection.createMany')
  requireText(files.merge, text.merge, 'facetRelation.createMany')
  requireText(files.merge, text.merge, 'reaction.updateMany')
  requireText(files.merge, text.merge, "taxonomy: 'ANIMAL'")
  requireText(files.merge, text.merge, 'isActive: false')
  requireText(files.merge, text.merge, 'facetAlias.upsert')

  requireText(files.build, text.build, 'runFacetCatalogSeed.ts')
  requireText(files.build, text.build, 'mergeCanonicalFacetDuplicates.ts')
  forbidText(
    files.build,
    text.build,
    "['utils/scripts/seedFacetCatalog.ts', '--apply']",
  )

  requireText(files.package, text.package, 'runFacetCatalogSeed.ts')
  requireText(files.package, text.package, 'mergeCanonicalFacetDuplicates.ts')
  requireText(files.package, text.package, 'verifyFacetCanonicalMerges.ts')

  process.stdout.write('Facet canonical merge contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
