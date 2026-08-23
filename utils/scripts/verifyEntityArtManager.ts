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

expectContains('components/conductor/project-detail.vue', [
  'class="project-detail-shell flex min-h-0 flex-col gap-2 pb-2"',
  'class="project-detail-primary grid shrink-0 gap-2"',
  'class="project-profile-fields grid gap-2 p-3"',
  'class="project-art-compact min-w-0 !p-2"',
  'data-project-profile',
  'data-project-composer',
  'data-project-roadmap',
  'data-project-milestones',
  'data-project-notes',
  '@container (min-width: 72rem)',
  'grid-template-columns: minmax(0, 3fr) minmax(22rem, 2fr);',
  'height: 20vh;',
  'v-model="projectTaskText"',
  'taskStatusSummary(selectedProject)',
  '<progress',
  'Project Profile',
  'Project Notes',
  'Milestones',
  'Roadmap',
])

const projectDetailSource = read('components/conductor/project-detail.vue')
const projectDetailOrder = [
  'class="project-art-compact min-w-0 !p-2"',
  'data-project-profile',
  'data-project-composer',
  'data-project-roadmap',
  'data-project-milestones',
  'data-project-notes',
].map((needle) => projectDetailSource.indexOf(needle))

if (
  projectDetailOrder.some((index) => index < 0) ||
  projectDetailOrder.some(
    (index, position) => position > 0 && index <= projectDetailOrder[position - 1]!,
  )
) {
  throw new Error(
    'Project detail must order art, profile, composer, open roadmap, milestones, then notes.',
  )
}

if (
  !/<details\s+v-if="selectedProject\?\.tasks\.length"\s+open[\s\S]*?data-project-roadmap/.test(
    projectDetailSource,
  )
) {
  throw new Error('Project roadmap must be an expandable container open by default.')
}

for (const marker of ['data-project-milestones', 'data-project-notes']) {
  const markerIndex = projectDetailSource.indexOf(marker)
  const detailsStart = projectDetailSource.lastIndexOf('<details', markerIndex)
  const detailsEnd = projectDetailSource.indexOf('>', markerIndex)
  if (
    detailsStart < 0 ||
    detailsEnd < 0 ||
    /\sopen(?:\s|>)/.test(projectDetailSource.slice(detailsStart, detailsEnd + 1))
  ) {
    throw new Error(`${marker} must remain collapsed by default.`)
  }
}

if (!/<section class="kr-panel-flat overflow-hidden" data-project-profile>/.test(projectDetailSource)) {
  throw new Error('Project Profile must stay always open rather than returning to a disclosure.')
}

expectOmits('components/conductor/project-detail.vue', [
  'Feature Wishlist',
  'projectTaskTitle',
  'projectTaskDescription',
  'DESIRED_FEATURE',
  'min-h-[200px]',
  'sm:grid-cols-2',
  'xl:grid-cols-',
])

expectContains('components/pages/conductor-manager.vue', [
  '<TabScrollRegion v-else-if="projectSlug">',
  '<ProjectDetail :slug="projectSlug" />',
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
