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
    creator: 'components/abandonware/art/art-creator.vue',
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
  requireText(files.creator, text.creator, 'art-facet-selector')
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
