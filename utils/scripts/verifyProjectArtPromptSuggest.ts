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

// interface-vision/t-026 deleted conductor-art-gallery.vue: Project's
// generation form is now entity-art-manager.vue's shared form (maxlength
// 5000, no bespoke DOM markup), so the plugin below keys off the component's
// `entityType` prop instead of Project-specific DOM shape.
expectContains('components/art/entity-art-manager.vue', [
  'maxlength="5000"',
  'entityType: props.entityType',
])

expectContains('plugins/project-art-prompt-suggest.client.ts', [
  'suggestArtAssetPrompt',
  "modelType: 'project'",
  'projectContextFromVue',
  "instance.props?.entityType === 'project'",
  'projectSlugFromTarget',
  "value.includes('/projects/images/')",
  'projectEntityTypeMatches(textarea)',
  'textarea[maxlength="5000"]',
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
