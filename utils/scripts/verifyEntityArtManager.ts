// /utils/scripts/verifyEntityArtManager.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildComponentGraph, mountsElement } from './componentGraph'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function expectContains(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(
        `${path} is missing required entity-art contract: ${needle}`,
      )
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
    throw new Error(
      `Entity art manager still uses obsolete queue path: ${obsolete}`,
    )
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

/*
 * EACH SURFACE MUST REACH THE ART MANAGER -- NOT NECESSARILY MOUNT IT ITSELF.
 *
 * This used to assert that `<EntityArtManager` appeared literally in each
 * *-interact.vue. That held while the interacts were monoliths, and went red
 * the moment three of them became routers: character, scenario and reward each
 * moved their working surface into a *-workspace.vue, taking the art manager
 * one hop down with it. The art slots had not been dropped -- the check simply
 * could not see past a filename.
 *
 * Same lesson the narrative-kit counter and the route-gallery contract each
 * learned separately, which is why the walk now lives in componentGraph.ts
 * instead of being written a fourth time. A surface satisfies this if anything
 * it transitively renders mounts the manager.
 *
 * Still element-level: `<EntityArtManager` must open a tag in a template, so a
 * type import or a stray mention in a comment does not score a tick.
 */
const graph = buildComponentGraph(resolve(process.cwd(), 'components'))

for (const path of [
  'components/bots/bot-interact.vue',
  'components/characters/character-interact.vue',
  'components/scenarios/scenario-interact.vue',
  'components/rewards/reward-interact.vue',
  // The Facet art slots moved with the editor when facet-manager's Library
  // grid was retired: editing one Facet now lives in facet-interact's detail
  // slot rather than expanding inside a grid cell.
  'components/facets/facet-editor.vue',
]) {
  const reaches = graph.reaches(path, (source) =>
    mountsElement(source, 'entity-art-manager'),
  )
  if (!reaches) {
    throw new Error(
      `${path} no longer reaches <EntityArtManager, directly or through anything it renders`,
    )
  }
}

console.log(
  'Entity art manager contract verified (art slots reached through the render graph).',
)
