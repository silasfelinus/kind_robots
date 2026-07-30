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
  'generationTargetUrl',
])

expectContains('plugins/project-art-prompt-suggest.client.ts', [
  'suggestArtAssetPrompt',
  "modelType: 'project'",
  'projectContextFromVue',
  'projectSlugFromTarget',
  "value.includes('/projects/images/')",
  'hasProjectTarget(form)',
  'textarea[maxlength="4000"]',
  "imagePath: { label: 'Icon', variant: 'icon', width: 256, height: 256 }",
  "cardPath: { label: 'Card', variant: 'card', width: 512, height: 768 }",
  "heroPath: { label: 'Hero', variant: 'hero', width: 1280, height: 720 }",
  "button.textContent = '✨ Suggest prompt'",
  'current: textarea.value',
  'setTextareaValue(textarea, suggestion)',
])

const plugin = read('plugins/project-art-prompt-suggest.client.ts')
const attachIndex = plugin.indexOf('attached.add(textarea)')
const clickIndex = plugin.indexOf("button.addEventListener('click'")
const contextIndex = plugin.indexOf('projectContext(textarea, form)')
if (attachIndex < 0 || clickIndex < 0 || contextIndex < clickIndex) {
  throw new Error(
    'Project Suggest prompt must attach from the explicit Project form before resolving context on click.',
  )
}

const representativeTarget =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images/coloring-book-card.webp'
const slugMatch = representativeTarget.match(
  /\/projects\/images\/(.+)-(?:icon|card|hero)\.webp(?:[?#].*)?$/i,
)
if (slugMatch?.[1] !== 'coloring-book') {
  throw new Error('Project target URL fallback did not preserve a hyphenated slug.')
}

expectContains('stores/helpers/artAssetSuggest.ts', [
  "builder: 'art-asset'",
  "field: 'prompt'",
  'entityRef: input.entityRef',
])

expectContains('server/utils/suggest/sheets/artAssetSuggest.ts', [
  'Projects: communicate what the project actually does',
])

expectContains('utils/artModelContext.ts', ["'project'"])

console.log('Project art prompt suggestion contract verified.')
