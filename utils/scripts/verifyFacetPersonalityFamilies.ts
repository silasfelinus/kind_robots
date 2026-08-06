// /utils/scripts/verifyFacetPersonalityFamilies.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { containsCode } from './lib/sourceText'

const root = process.cwd()

async function read(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(`${path} is missing required contract text: ${value}`)
  }
}

function forbidText(path: string, text: string, value: string): void {
  if (containsCode(text, value)) {
    throw new Error(`${path} must not contain production mutation hook: ${value}`)
  }
}

async function main(): Promise<void> {
  const curatorPath = 'utils/scripts/curateFacetPersonalityFamilies.ts'
  const buildPath = 'scripts/run_facet_catalog_maintenance.ts'
  const workflowPath = '.github/workflows/facet-catalog-contract.yml'
  const [curator, build, workflow] = await Promise.all([
    read(curatorPath),
    read(buildPath),
    read(workflowPath),
  ])

  for (const family of [
    'Grounded Practicality',
    'Composure',
    'Warmth and Care',
    'Emotional Distance',
    'Cheerfulness',
    'Theatricality',
    'Analytical Method',
    'Social Restraint',
    'Vigilance and Anxiety',
    'Audacity and Risk',
    'Creative Imagination',
    'Secrecy and Strategy',
    'Humor Style',
    'Melancholy and Reflection',
    'Sociability and Charisma',
  ]) {
    requireText(curatorPath, curator, family)
  }

  requireText(curatorPath, curator, "anchor: 'practical'")
  requireText(curatorPath, curator, "members: ['pragmatic', 'realistic']")
  requireText(curatorPath, curator, "relationType: 'RELATED'")
  requireText(curatorPath, curator, 'Related neighbor, not an alias')
  requireText(curatorPath, curator, "aliasPolicy: 'related-neighbor-not-alias'")
  requireText(curatorPath, curator, "role === 'anchor' ? 1 : 0.5")
  requireText(curatorPath, curator, 'Math.min(profile.randomWeight, ceiling)')
  requireText(curatorPath, curator, 'facetArtImage.findMany')
  requireText(curatorPath, curator, 'facetArtCollection.findMany')
  requireText(curatorPath, curator, 'prisma.$transaction')
  requireText(
    curatorPath,
    curator,
    'stable Facet rows, prose, prompts, and artwork remain untouched',
  )

  for (const protectedMutation of [
    'prisma.facet.update',
    'prisma.facet.delete',
    'prisma.facetAlias.upsert',
  ]) {
    if (curator.includes(protectedMutation)) {
      throw new Error(
        `${curatorPath} must not use ${protectedMutation}; semantic-family curation is profile-and-relation only.`,
      )
    }
  }

  forbidText(buildPath, build, 'curateFacetPersonalityFamilies.ts')
  requireText(workflowPath, workflow, 'Verify Personality semantic families')
  requireText(workflowPath, workflow, 'verifyFacetPersonalityFamilies.ts')

  process.stdout.write('Personality semantic-family contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
