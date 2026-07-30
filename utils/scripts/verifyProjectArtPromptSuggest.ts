import { readFileSync } from 'node:fs'

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

expectContains('components/pages/conductor-art-gallery.vue', [
  'maxlength="4000"',
  'generationPrompt',
  'imagePath',
  'cardPath',
  'heroPath',
])

expectContains('plugins/project-art-prompt-suggest.client.ts', [
  "suggestArtAssetPrompt",
  "modelType: 'project'",
  'props.projectId',
  'props.slug',
  "textarea[maxlength=\"4000\"]",
  "imagePath: { label: 'Icon', variant: 'icon', width: 256, height: 256 }",
  "cardPath: { label: 'Card', variant: 'card', width: 512, height: 768 }",
  "heroPath: { label: 'Hero', variant: 'hero', width: 1280, height: 720 }",
  "button.textContent = '✨ Suggest prompt'",
  'current: textarea.value',
  'setTextareaValue(textarea, suggestion)',
])

expectContains('stores/helpers/artAssetSuggest.ts', [
  "builder: 'art-asset'",
  "field: 'prompt'",
  'entityRef: input.entityRef',
])

expectContains('server/utils/suggest/sheets/artAssetSuggest.ts', [
  'Projects: communicate what the project actually does',
  "modelType: 'project'",
])

console.log('Project art prompt suggestion contract verified.')
