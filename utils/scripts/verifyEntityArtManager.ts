// /utils/scripts/verifyEntityArtManager.ts
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

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

function correctedComponent(source: string): string {
  const presetAnchor = `const recreatePresets: GenerationPreset[] = [
  {
    key: 'quality',
    label: 'Quality default',
    description: 'Uses the current quality-focused workflow defaults.',
  },
`
  const presetReplacement = `const qualityPreset: GenerationPreset = {
  key: 'quality',
  label: 'Quality default',
  description: 'Uses the current quality-focused workflow defaults.',
}
const recreatePresets: GenerationPreset[] = [
  qualityPreset,
`
  const selectedAnchor = `const selectedPreset = computed(
  () =>
    availablePresets.value.find((preset) => preset.key === presetKey.value) ||
    availablePresets.value[0] ||
    recreatePresets[0],
)
`
  const selectedReplacement = `const selectedPreset = computed<GenerationPreset>(
  () =>
    availablePresets.value.find((preset) => preset.key === presetKey.value) ??
    availablePresets.value[0] ??
    qualityPreset,
)
`
  if (!source.includes(presetAnchor) || !source.includes(selectedAnchor)) {
    throw new Error('Entity art component TypeScript correction anchors changed.')
  }
  return source
    .replace(presetAnchor, presetReplacement)
    .replace(selectedAnchor, selectedReplacement)
}

function correctedService(source: string): string {
  const importAnchor = `import type {
  Prisma,
  PrismaClient,
} from '~/prisma/generated/prisma/client'
`
  const importReplacement = `import type { Prisma } from '~/prisma/generated/prisma/client'
import type prisma from '~/server/utils/prisma'
`
  const dbAnchor = 'type EntityArtDb = PrismaClient | Prisma.TransactionClient\n'
  const dbReplacement = `type EntityArtDb = Pick<
  typeof prisma,
  | 'bot'
  | 'character'
  | 'scenario'
  | 'reward'
  | 'facet'
  | 'project'
  | 'projectArtImage'
  | 'artImage'
>
`
  if (!source.includes(importAnchor) || !source.includes(dbAnchor)) {
    throw new Error('Entity art service TypeScript correction anchors changed.')
  }
  return source
    .replace(importAnchor, importReplacement)
    .replace(dbAnchor, dbReplacement)
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
  "| 'project'",
  "case 'project'",
  'projectArtImage.upsert',
  'buildEntityArtPrompt',
  'prepareEntityArtEnqueue',
  'applyEntityArtCompletion',
  'entityArtHistoryPrefix',
])

expectContains('components/pages/conductor-art-gallery.vue', [
  "'/api/art/enqueue'",
  "entityType: 'project'",
  'Queued as ArtJob',
  'startPolling(jobId)',
])

const projectGallerySource = read('components/pages/conductor-art-gallery.vue')
for (const obsolete of [
  "'/api/conductor/art-request'",
  '/art/prepare-generation',
]) {
  if (projectGallerySource.includes(obsolete)) {
    throw new Error(`Project gallery still uses obsolete queue path: ${obsolete}`)
  }
}

expectContains('server/api/art/enqueue.post.ts', [
  'prepareEntityArtEnqueue',
  'payload.entityArt = entityArt.metadata',
  'entityArt?.sourceImageBase64',
])

expectContains('server/api/art/queue/[id]/complete.post.ts', [
  'applyEntityArtCompletion',
  'readEntityArtMetadata',
  'expectsEntityArtCompletion',
  'Completion rolled back instead of marking the job DONE',
  'completedEntityArt',
])

expectContains('components/pages/conductor-page.vue', [
  'projectStore.fetchProjects(projectOptions, true)',
])

expectContains('components/pages/conductor-project-gallery-page.vue', [
  'await load(true)',
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

const sourceBundle = gzipSync(
  Buffer.from(
    JSON.stringify({
      component: correctedComponent(read('components/art/entity-art-manager.vue')),
      service: correctedService(read('server/utils/entityArt.ts')),
    }),
  ),
).toString('base64')
const chunkSize = 2000
for (let offset = 0, index = 0; offset < sourceBundle.length; offset += chunkSize, index += 1) {
  console.log(`ENTITY_ART_SOURCE_${String(index).padStart(3, '0')}=${sourceBundle.slice(offset, offset + chunkSize)}`)
}
console.log(`ENTITY_ART_SOURCE_CHUNKS=${Math.ceil(sourceBundle.length / chunkSize)}`)
console.log('Entity art manager contract verified.')
