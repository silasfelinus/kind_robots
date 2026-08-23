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
  "import { usePageStore } from '@/stores/pageStore'",
  "import { useProjectStore } from '@/stores/projectStore'",
  "import { useScenarioStore } from '@/stores/scenarioStore'",
  '✨ Suggest prompt',
  'managerContextFromVue',
  'managerContextFromWorkspaceProject',
  'managerContextFromSelectedScenario',
  'managerEntityTypeFromChrome',
  "managerEntityTypeFromChrome(element) !== 'scenario'",
  'scenarioStore.selectedScenario',
  "{ field: 'imagePath', label: 'Scenario image', width: 1536, height: 864 }",
  "element.closest('.project-art-compact')",
  'projectStore.projectForSlug(workspaceSlug)',
  "entityType: 'project'",
  "{ field: 'heroPath', label: 'Hero', width: 1280, height: 720 }",
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
  'await serverStore.initialize({ fetchRemote: true })',
  "throw new Error(result.message || 'Prompt suggestion failed.')",
  "throw new Error('The suggestion model returned no prompt.')",
])

expectContains('server/api/suggest.post.ts', [
  "builder === 'art-asset'",
  'resolveArtModelContext',
  'buildSuggestUserPrompt',
  "import {\n  getRuntimeAnthropicKey,\n  getRuntimeOpenAiKey,\n} from '../utils/textProviderService'",
  'getRuntimeAnthropicKey(config)',
  'getRuntimeOpenAiKey(config)',
])

expectContains('server/utils/textProviderService.ts', [
  "config.openaiApiKey || process.env.OPENAI_API_KEY || ''",
  'config.anthropicApiKey ||',
  'process.env.ANTHROPIC_API_KEY ||',
])

expectContains('components/art/entity-art-manager.vue', [
  'Art direction',
  'textarea',
  'maxlength="5000"',
])

console.log('Entity art prompt suggestion contract verified.')
