import { existsSync, readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function expectContains(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${path} is missing Project prompt suggestion contract: ${needle}`)
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
  "{ field: 'imagePath', label: 'Icon', width: 256, height: 256 }",
  "{ field: 'cardPath', label: 'Card', width: 512, height: 768 }",
  "{ field: 'heroPath', label: 'Hero', width: 1280, height: 720 }",
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
