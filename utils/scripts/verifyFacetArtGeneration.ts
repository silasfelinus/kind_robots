// /utils/scripts/verifyFacetArtGeneration.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, value: string): void {
  if (!text.includes(value)) {
    throw new Error(
      `${path} is missing required Facet art contract text: ${value}`,
    )
  }
}

async function main(): Promise<void> {
  const files = {
    selector: 'components/art/art-facet-selector.vue',
    generateButton: 'components/art/generate-button.vue',
    generator: 'components/art/art-generator.vue',
    editor: 'components/art/artjob-editor.vue',
    draftStore: 'stores/artFacetDraftStore.ts',
    requestStore: 'stores/facetArtRequestStore.ts',
    enqueue: 'server/api/art/enqueue.post.ts',
    edit: 'server/api/art/queue/[id]/edit.post.ts',
    reenqueue: 'server/api/art/queue/[id]/reenqueue.post.ts',
    complete: 'server/api/art/queue/[id]/complete.post.ts',
    selection: 'server/utils/artFacetSelection.ts',
    completion: 'server/utils/artFacetCompletion.ts',
    prompt: 'utils/artFacetPrompt.ts',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.selector, text.selector, 'requestPrimaryArtwork')
  requireText(files.selector, text.selector, 'update:modelValue')
  requireText(files.generateButton, text.generateButton, 'art-facet-selector')
  requireText(
    files.generateButton,
    text.generateButton,
    'decorateGenerationData',
  )
  // The rebuilt generator dispatches its own generation rather than delegating
  // to generate-button, so it needs its own Facet picker and its own call to
  // decorateGenerationData -- without the second one, Facets chosen on the
  // generator would never reach the ArtJob.
  requireText(files.generator, text.generator, 'art-facet-selector')
  requireText(files.generator, text.generator, 'decorateGenerationData')
  // Exactly one Facet surface on the generator. The old art-maker mounted
  // generate-button twice, so the picker (and the server dropdown inside it)
  // appeared twice on one screen.
  const facetPickers = text.generator.match(/<art-facet-selector/g) ?? []
  if (facetPickers.length !== 1) {
    throw new Error(
      `${files.generator} must mount exactly one art-facet-selector, found ${facetPickers.length}`,
    )
  }
  requireText(files.editor, text.editor, 'ArtJob Facets')
  requireText(files.editor, text.editor, 'basePromptString')
  requireText(files.editor, text.editor, 'facetIds')
  requireText(files.draftStore, text.draftStore, '__kindRobotsFacetSelection')
  requireText(
    files.requestStore,
    text.requestStore,
    '/api/conductor/art-request',
  )
  requireText(files.enqueue, text.enqueue, 'resolveArtFacetSelection')
  requireText(files.enqueue, text.enqueue, 'applyArtFacetsToPayload')
  requireText(files.edit, text.edit, 'readArtFacetIds')
  requireText(files.reenqueue, text.reenqueue, 'readArtFacetIds')
  requireText(files.selection, text.selection, 'readArtFacetSnapshots')
  requireText(files.complete, text.complete, 'copyArtImageFacets')
  requireText(files.complete, text.complete, 'syncCompletedArtImageFacets')
  requireText(files.complete, text.complete, 'completedFacetIds')
  requireText(files.completion, text.completion, 'facetArtImage.deleteMany')
  requireText(files.completion, text.completion, 'facetArtImage.createMany')
  requireText(files.prompt, text.prompt, 'Facet direction:')

  process.stdout.write('Facet art generation contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
