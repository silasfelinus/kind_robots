import { readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function expectContains(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${path} is missing prompt-suggestion contract: ${needle}`)
    }
  }
}

expectContains('plugins/entity-art-prompt-suggest.client.ts', [
  "import { suggestArtAssetPrompt } from '@/stores/helpers/artAssetSuggest'",
  '✨ Suggest prompt',
  'managerContextFromVue',
  'entityRef: entityRef(context)',
  'current: textarea.value',
  'variantForSlot',
  'generationMode(form)',
  "textarea.dispatchEvent(new Event('input', { bubbles: true }))",
  'MutationObserver',
])

expectContains('stores/helpers/artAssetSuggest.ts', [
  "builder: 'art-asset'",
  "field: 'prompt'",
  "stepKey: 'model-art'",
  '/api/suggest',
  'entityRef: input.entityRef',
])

expectContains('server/api/suggest.post.ts', [
  "builder === 'art-asset'",
  'resolveArtModelContext',
  'buildSuggestUserPrompt',
])

expectContains('server/utils/suggest/sheets/artAssetSuggest.ts', [
  "builder: 'art-asset'",
  'Write one production-ready image-generation prompt',
  'Return exactly one prompt paragraph',
  "variant === 'icon'",
  "variant === 'card'",
  "variant === 'hero'",
])

expectContains('components/art/entity-art-manager.vue', [
  'Art direction',
  'textarea',
  'maxlength="5000"',
  "generationMode.value = mode === 'recreate' ? 'krea2' : 'sdxl-img2img'",
])

console.log('Entity art prompt suggestion contract verified.')
