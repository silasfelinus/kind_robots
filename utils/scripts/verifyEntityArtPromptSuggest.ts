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

// Pins managerContext()'s fallback ordering: the explicit DOM identity path
// (Page/WorkspaceProject/SelectedScenario) must be tried before the legacy
// managerContextFromVue private-property introspection, which is
// compatibility-only and should stay last (kind_robots#2898 kaizen).
function expectOrder(path: string, needles: string[]): void {
  const source = read(path)
  let lastIndex = -1
  let lastNeedle = ''
  for (const needle of needles) {
    const index = source.indexOf(needle)
    if (index === -1) {
      throw new Error(`${path} is missing prompt-suggestion contract: ${needle}`)
    }
    if (index <= lastIndex) {
      throw new Error(
        `${path} must try ${JSON.stringify(needle)} after ${JSON.stringify(
          lastNeedle,
        )} -- the explicit DOM identity path must be checked before the legacy managerContextFromVue fallback`,
      )
    }
    lastIndex = index
    lastNeedle = needle
  }
}

expectContains('plugins/entity-art-prompt-suggest.client.ts', [
  "import { suggestArtAssetPrompt } from '@/stores/helpers/artAssetSuggest'",
  "import { usePageStore } from '@/stores/pageStore'",
  "import { useProjectStore } from '@/stores/projectStore'",
  "import { useScenarioStore } from '@/stores/scenarioStore'",
  '✨ Suggest prompt',
  'managerContextFromVue',
  'managerContextFromPage',
  "'[data-art-model], [data-model-id], [data-model-slug]'",
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

expectOrder('plugins/entity-art-prompt-suggest.client.ts', [
  'managerContextFromPage(element) ||',
  'managerContextFromWorkspaceProject(element, pageStore, projectStore) ||',
  'managerContextFromSelectedScenario(element, scenarioStore) ||',
  'managerContextFromVue(element) ||',
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
  "import {\n  getRuntimeAnthropicKey,\n  getRuntimeOpenAiKey,\n  resolveGatedProviderKey,\n} from '../utils/textProviderService'",
  'getRuntimeAnthropicKey(config)',
  'getRuntimeOpenAiKey(config)',
  // The site key is only reachable when manaGate allowed it -- an
  // own-resource / free-server request must bring its own key.
  'siteKeyAllowed: gate.siteKeyAllowed',
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
  ':data-art-model="props.entityType"',
  ':data-model-id="props.entity.id"',
  ':data-model-slug="props.entity.slug || undefined"',
  ':data-art-subject="title"',
  'slug?: string | null',
])

console.log('Entity art prompt suggestion contract verified.')
