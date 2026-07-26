// /utils/scripts/verifyFacetLibraryAdvanced.ts
import { readFile } from 'node:fs/promises'

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(`${path} is missing Facet Library contract text: ${value}`)
  }
}

async function main(): Promise<void> {
  const path = 'components/facets/facet-manager.vue'
  const manager = await readFile(path, 'utf8')

  for (const field of [
    'canonicalValue',
    'sortOrder',
    'sourceRank',
    'metadata',
    'randomWeight',
    'isRandomizable',
    'artRequired',
    'imagePath',
    'cardPath',
    'heroPath',
    'artPrompt',
  ]) {
    requireText(path, manager, field)
  }

  requireText(path, manager, 'parseMetadata')
  requireText(path, manager, 'JSON object')
  requireText(path, manager, 'requestPrimaryArtwork')
  requireText(path, manager, 'Request primary artwork')
  requireText(path, manager, 'facetStore.fetchFacets({ includeInactive: true, includeMature: true })')
  requireText(path, manager, 'Save canonical profile')

  process.stdout.write('Advanced Facet Library contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
