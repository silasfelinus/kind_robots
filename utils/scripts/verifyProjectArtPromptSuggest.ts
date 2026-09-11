import { existsSync, readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function expectContains(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(
        `${path} is missing Project prompt suggestion contract: ${needle}`,
      )
    }
  }
}

const legacyPlugin = 'plugins/project-art-prompt-suggest.client.ts'
if (existsSync(legacyPlugin)) {
  throw new Error(
    `${legacyPlugin} must stay retired; Project prompt suggestions belong to the shared entity-art plugin.`,
  )
}

expectContains('components/art/entity-art-manager.vue', [
  'maxlength="5000"',
  'entityType: props.entityType',
])

expectContains('plugins/entity-art-prompt-suggest.client.ts', [
  'suggestArtAssetPrompt',
  'managerContextFromWorkspaceProject',
  "element.closest('.project-art-compact')",
  'projectStore.projectForSlug(workspaceSlug)',
  "entityType: 'project'",
  // Primary FIRST, and at the collapsed 1024 size. entity-art-manager.vue
  // hides its Target select when an entity has one generatable slot, so
  // selectedSlot() falls through to the head of this roster -- a heroPath or
  // 256px icon head would frame the suggestion for a slot enqueue rejects.
  "{ field: 'imagePath', label: 'Image', width: 1024, height: 1024 }",
  "{ field: 'heroPath', label: 'Hero', width: 1280, height: 720 }",
  "{ field: 'cardPath', label: 'Card', width: 512, height: 768 }",
  'context.slots[0]',
  "button.textContent = '✨ Suggest prompt'",
  'entityRef: entityRef(context)',
  'current: textarea.value',
  'setTextareaValue(textarea, suggestion)',
])

expectContains('stores/helpers/artAssetSuggest.ts', [
  "builder: 'art-asset'",
  "field: 'prompt'",
  'entityRef: input.entityRef',
  'await serverStore.initialize({ fetchRemote: true })',
])

expectContains('server/utils/suggest/sheets/artAssetSuggest.ts', [
  'Projects: communicate what the project actually does',
])

expectContains('utils/artModelContext.ts', ["'project'"])

console.log('Project art prompt suggestion contract verified.')
