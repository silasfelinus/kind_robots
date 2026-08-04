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
  "| 'project'",
  "| 'achievement'",
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

// interface-vision/t-026: conductor-art-gallery.vue's bespoke Project carousel
// was deleted in favor of this one canonical component. Project now adopts it
// directly (entity-type="project") with an extra collection-carousel panel
// that only mounts when a caller passes collectionSlides.
expectContains('components/art/entity-art-manager.vue', [
  'Queued as ArtJob',
  'startPolling(activeJobId)',
  '`/api/art/entities/${props.entityType}/${props.entity.id}/replace`',
  'collectionSlides',
  'hasCarousel',
  'carouselSlides',
])

expectContains('components/pages/conductor-page.vue', [
  'entity-type="project"',
  ':collection-slides="projectCollectionSlides"',
])

const entityArtManagerSource = read('components/art/entity-art-manager.vue')
for (const obsolete of [
  "'/api/conductor/art-request'",
  '/art/prepare-generation',
  '/api/projects/${projectId}/art/replace',
]) {
  if (entityArtManagerSource.includes(obsolete)) {
    throw new Error(`Entity art manager still uses obsolete queue path: ${obsolete}`)
  }
}

expectContains('server/api/art/enqueue.post.ts', [
  'prepareEntityArtEnqueue',
  'payload.entityArt = entityArt.metadata',
  'entityArt?.sourceImageBase64',
])

// Relay/server completion is the durable contract; no browser process is required.
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

console.log('Entity art manager contract verified.')
