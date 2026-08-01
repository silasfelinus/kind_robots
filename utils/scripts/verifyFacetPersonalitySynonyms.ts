// /utils/scripts/verifyFacetPersonalitySynonyms.ts
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
  const mergePath = 'utils/scripts/mergeFacetPersonalitySynonyms.ts'
  const buildPath = 'scripts/vercel-build.mjs'
  const workflowPath = '.github/workflows/facet-catalog-contract.yml'
  const [merge, build, workflow] = await Promise.all([
    read(mergePath),
    read(buildPath),
    read(workflowPath),
  ])

  const synonymPairs: ReadonlyArray<readonly [string, string]> = [
    ["canonicalSlug: 'optimist'", "duplicateSlug: 'optimistic'"],
    ["canonicalSlug: 'pessimist'", "duplicateSlug: 'pessimistic'"],
    [
      "canonicalSlug: 'melancholy'",
      "duplicateSlug: 'personality-melancholic'",
    ],
    [
      "canonicalSlug: 'inquisitive'",
      "duplicateSlug: 'personality-curious'",
    ],
    [
      "canonicalSlug: 'scatter-brained'",
      "duplicateSlug: 'personality-scattered'",
    ],
  ]

  for (const [canonical, duplicate] of synonymPairs) {
    requireText(mergePath, merge, canonical)
    requireText(mergePath, merge, duplicate)
  }

  for (const model of [
    'characterFacet',
    'botFacet',
    'rewardFacet',
    'dreamFacet',
    'scenarioFacet',
    'facetArtImage',
    'facetArtCollection',
    'facetRelation',
    'reaction',
    'facetAlias',
  ]) {
    requireText(mergePath, merge, `prisma.${model}`)
  }

  requireText(mergePath, merge, 'canonical.description || duplicate.description')
  requireText(mergePath, merge, 'canonical.imagePath || duplicate.imagePath')
  requireText(mergePath, merge, 'canonical.artImageId ?? duplicate.artImageId')
  requireText(mergePath, merge, 'skipDuplicates: true')
  requireText(mergePath, merge, "action: 'merge-exact-synonym'")
  requireText(
    mergePath,
    merge,
    'Only exact personality synonyms are merged',
  )

  requireText(buildPath, build, 'mergeFacetPersonalitySynonyms.ts')
  requireOrder(
    buildPath,
    build,
    'curateFacetCulturalGenres.ts',
    'mergeFacetPersonalitySynonyms.ts',
  )
  requireText(workflowPath, workflow, 'Verify Personality synonym merges')
  requireText(workflowPath, workflow, 'verifyFacetPersonalitySynonyms.ts')

  process.stdout.write('Personality synonym merge contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
