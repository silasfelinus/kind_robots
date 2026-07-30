// /utils/scripts/verifyEntityArtManager.ts
import { readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function expectContains(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${path} is missing required entity-art contract: ${needle}`)
    }
  }
}

expectContains('components/art/entity-art-manager.vue', [
  "generationEngine.value = mode === 'recreate' ? 'krea2' : 'sdxl-img2img'",
  '<option value="kontext">Kontext edit</option>',
  'Keep as inspiration',
  'Do not retain it',
  'checkpointResourceId',
  '/api/art/enqueue',
  'entityArt:',
])

expectContains('server/utils/entityArt.ts', [
  "| 'bot'",
  "| 'character'",
  "| 'scenario'",
  "| 'reward'",
  "| 'facet'",
  'buildEntityArtPrompt',
  'prepareEntityArtEnqueue',
  'applyEntityArtCompletion',
  'entityArtHistoryPrefix',
])

expectContains('server/api/art/enqueue.post.ts', [
  'prepareEntityArtEnqueue',
  'payload.entityArt = entityArt.metadata',
  'entityArt?.sourceImageBase64',
])

expectContains('server/api/art/queue/[id]/complete.post.ts', [
  'applyEntityArtCompletion',
  'completedEntityArt',
])

for (const path of [
  'components/bots/bot-interact.vue',
  'components/characters/character-interact.vue',
  'components/scenarios/scenario-interact.vue',
  'components/rewards/reward-interact.vue',
  'components/facets/facet-manager.vue',
]) {
  expectContains(path, ['<EntityArtManager'])
}

console.log('Entity art manager contract verified.')
