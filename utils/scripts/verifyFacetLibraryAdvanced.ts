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
    facetEditor: 'components/facets/facet-editor.vue',
    form: 'utils/facetProfileForm.ts',
  } as const
  const [manager, editor, facetEditor, form] = await Promise.all([
    readFile(files.manager, 'utf8'),
    readFile(files.editor, 'utf8'),
    readFile(files.facetEditor, 'utf8'),
    readFile(files.form, 'utf8'),
  ])

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
    'iconPath',
    'artPrompt',
  ]) {
    if (
      !manager.includes(field) &&
      !editor.includes(field) &&
      !facetEditor.includes(field) &&
      !form.includes(field)
    ) {
      throw new Error(`Complete Facet profile is missing field: ${field}`)
    }
  }

  // EntityArtManager, the art slots and the save action moved to
  // facet-editor.vue when facet-manager's Library grid was retired: a Facet is
  // chosen in the gallery and edited in facet-interact's detail slot, rather
  // than an editor expanding inside a grid cell. The Library tab keeps
  // creation and the catalog fetch.
  requireText(files.facetEditor, facetEditor, 'EntityArtManager')
  requireText(files.facetEditor, facetEditor, "field: 'iconPath'")
  requireText(files.facetEditor, facetEditor, 'Save canonical profile')
  for (const [label, text] of [
    [files.manager, manager],
    [files.facetEditor, facetEditor],
  ] as const) {
    if (text.includes('requestPrimaryArtwork')) {
      throw new Error(
        `${label} must use ArtJobs instead of legacy YAML artwork requests.`,
      )
    }
  }
  requireText(
    files.manager,
    manager,
    'facetStore.fetchFacets({ includeInactive: true, includeMature: true })',
  )
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
