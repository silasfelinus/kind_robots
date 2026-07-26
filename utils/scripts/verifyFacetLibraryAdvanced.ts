// /utils/scripts/verifyFacetLibraryAdvanced.ts
import { readFile } from 'node:fs/promises'

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(`${path} is missing Facet Library contract text: ${value}`)
  }
}

async function main(): Promise<void> {
  const files = {
    manager: 'components/facets/facet-manager.vue',
    editor: 'components/facets/facet-profile-editor.vue',
    form: 'utils/facetProfileForm.ts',
  } as const
  const [manager, editor, form] = await Promise.all(
    Object.values(files).map((path) => readFile(path, 'utf8')),
  )

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
    if (!manager.includes(field) && !editor.includes(field) && !form.includes(field)) {
      throw new Error(`Complete Facet profile is missing field: ${field}`)
    }
  }

  requireText(files.manager, manager, 'requestPrimaryArtwork')
  requireText(files.manager, manager, 'Request primary artwork')
  requireText(
    files.manager,
    manager,
    'facetStore.fetchFacets({ includeInactive: true, includeMature: true })',
  )
  requireText(files.manager, manager, 'Save canonical profile')
  requireText(files.manager, manager, 'FacetProfileEditor')
  requireText(files.editor, editor, 'Structured metadata (JSON object)')
  requireText(files.editor, editor, 'defineModel<FacetProfileForm>')
  requireText(files.form, form, 'parseFacetMetadata')
  requireText(files.form, form, 'Structured metadata must be a JSON object.')
  requireText(files.form, form, 'facetProfilePayload')

  process.stdout.write('Advanced Facet Library contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
