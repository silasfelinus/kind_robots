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

function expectOmits(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (source.includes(needle)) {
      throw new Error(
        `${path} still contains superseded project-detail UI: ${needle}`,
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
  "| 'dream'",
  "| 'character'",
  "| 'scenario'",
  "| 'reward'",
  "| 'facet'",
  "| 'project'",
  "case 'dream'",
  'dream: {',
  "label: 'Dream'",
  "case 'project'",
  'projectArtImage.upsert',
  'buildEntityArtPrompt',
  'prepareEntityArtEnqueue',
  'applyEntityArtCompletion',
  'entityArtHistoryPrefix',
])

expectContains('components/art/entity-art-manager.vue', [
  'Queued as ArtJob',
  'startPolling(activeJobId)',
  '`/api/art/entities/${props.entityType}/${props.entity.id}/replace`',
  'collectionSlides',
  'carouselSlides',
  'for (const item of history.value)',
  'const hasCarousel = computed(() => carouselSlides.value.length > 1)',
  '@pointerdown="beginCarouselSwipe"',
  '@pointerup="endCarouselSwipe"',
  'stepCarousel(delta < 0 ? 1 : -1)',
])

expectContains('components/pages/conductor-page.vue', [
  'entity-type="project"',
  ':collection-slides="projectCollectionSlides"',
])

expectContains('components/pages/conductor-project-detail-page.vue', [
  'class="project-art-compact !p-2"',
  'height: 20vh;',
  'v-model="projectTaskText"',
  'taskStatusSummary(selectedProject)',
  '<progress',
  'Project Profile',
  'Project Notes',
  'Milestones',
  'Roadmap',
])

expectOmits('components/pages/conductor-project-detail-page.vue', [
  'Feature Wishlist',
  'projectTaskTitle',
  'projectTaskDescription',
  'DESIRED_FEATURE',
  'min-h-[200px]',
])

expectContains('components/pages/conductor-manager.vue', [
  '<ConductorProjectDetailPage',
  ':slug="projectSlug"',
])

expectContains('plugins/workspace-sheet-hero.client.ts', [
  'if (activeProject.value) return null',
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

const graph = buildComponentGraph(resolve(process.cwd(), 'components'))

for (const path of [
  'components/bots/bot-interact.vue',
  'components/characters/character-interact.vue',
  'components/scenarios/scenario-interact.vue',
  'components/rewards/reward-interact.vue',
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
