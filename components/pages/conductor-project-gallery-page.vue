<template>
  <section
    class="kr-surface rounded-2xl border border-base-300 bg-(--kr-surface) p-3"
  >
    <!--
      ONE ROW, and it is the shell's own.

      This page opened with FOUR stacked bands before a single project card: an
      identity/count header, a filter `<nav>`, a full-width `<details>` bar
      whose entire job was to say "+ Create a Project", and then kr-gallery's
      Cards/Heroes/Icons bar. Silas, 2026-08-07: "we're still sitting at three
      rows when one row is desired."

      Everything now rides kr-gallery's `#toolbar` slot, which exists so a
      gallery's controls share the mode bar's line instead of stacking above it
      (reward-gallery and icon-gallery use it the same way). Counts, status
      filters, Create and Refresh sit on that one line.

      The identity band is GONE rather than shrunk: the app's tab strip
      directly above already reads "Projects" in a highlighted tab, so a second
      "Projects" heading was a full row spent restating the navigation.

      The create FORM still expands below on demand; only its summary bar died.
    -->
    <section
      v-if="createOpen"
      class="shrink-0 rounded-xl border border-base-300 bg-base-100"
    >
      <div class="space-y-3 p-3">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control sm:col-span-2">
            <span class="label-text text-xs">Title</span>
            <input
              v-model="createForm.title"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Project title"
            />
          </label>
          <label class="form-control sm:col-span-2">
            <span class="label-text text-xs">Description</span>
            <textarea
              v-model="createForm.description"
              class="textarea textarea-bordered min-h-20 rounded-xl"
              placeholder="What is this project?"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Status</span>
            <select
              v-model="createForm.status"
              class="select select-bordered select-sm rounded-xl"
            >
              <option
                v-for="option in PROJECT_STATUSES"
                :key="option"
                :value="option"
              >
                {{ statusLabel(option) }}
              </option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Priority</span>
            <select
              v-model="createForm.priority"
              class="select select-bordered select-sm rounded-xl"
            >
              <option
                v-for="option in PROJECT_PRIORITIES"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm w-full rounded-xl"
          :disabled="!createForm.title.trim() || projects.saving"
          @click="createProject"
        >
          <span
            v-if="projects.saving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:plus" class="size-3.5" />
          Create Project
        </button>
        <p v-if="createError" class="text-xs text-error">{{ createError }}</p>
      </div>
    </section>

    <section
      v-if="showSync && syncIssueCount"
      class="shrink-0 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs"
    >
      <strong>Lifecycle reconciliation</strong>
      <div class="mt-2 grid gap-2 md:grid-cols-3">
        <div v-if="driftItems.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Status/priority drift</b>
          <button
            v-for="item in driftItems.slice(0, 8)"
            :key="item.id"
            class="mt-1 block w-full truncate text-left hover:text-primary"
            @click="open(item)"
          >
            {{ item.title }}: {{ item.dbStatus }} → {{ item.status }}
          </button>
        </div>
        <div v-if="conductorOnly.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Missing database record</b>
          <p
            v-for="project in conductorOnly.slice(0, 8)"
            :key="project.slug"
            class="mt-1 truncate"
          >
            {{ project.name || project.slug }}
          </p>
        </div>
        <div v-if="databaseOnly.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Database-only</b>
          <p
            v-for="item in databaseOnly.slice(0, 8)"
            :key="item.id"
            class="mt-1 truncate"
          >
            {{ item.title }}
          </p>
        </div>
      </div>
    </section>

    <section
      v-if="showBlocked && blockedTasks.length"
      class="shrink-0 rounded-xl border border-error/30 bg-error/10 p-3"
    >
      <strong class="text-sm text-error">Why work is blocked</strong>
      <div class="mt-2 grid gap-2 lg:grid-cols-2">
        <button
          v-for="task in blockedTasks"
          :key="`${task.projectSlug}:${task.id}`"
          class="rounded-lg border border-error/20 bg-base-100 p-3 text-left hover:border-error"
          @click="openSlug(task.projectSlug)"
        >
          <p class="text-xs font-black text-error">
            {{ task.projectTitle }} · {{ task.id }}
          </p>
          <p class="text-sm font-semibold">{{ task.title }}</p>
          <p v-if="task.note" class="line-clamp-2 text-xs text-base-content/55">
            {{ task.note }}
          </p>
        </button>
      </div>
    </section>

    <main class="kr-scroll rounded-xl border border-base-300 bg-base-100 p-3">
      <kr-gallery
        :items="galleryItems"
        :mode="galleryMode"
        :loading="loading"
        :error="error"
        :empty-label="`${filterLabel.toLowerCase()} projects`"
        @update:mode="galleryMode = $event"
        @open="(item) => open(item as Item)"
      >
        <template #toolbar>
          <div class="flex flex-wrap items-center gap-1">
            <span class="badge badge-primary badge-sm">{{
              allItems.length
            }}</span>
            <span
              v-if="galleryItems.length !== allItems.length"
              class="text-xs text-base-content/45"
              >{{ galleryItems.length }} shown</span
            >

            <button
              v-if="syncIssueCount"
              class="badge badge-warning badge-sm"
              @click="showSync = !showSync"
            >
              {{ syncIssueCount }} sync
            </button>
            <button
              v-if="blockedTasks.length"
              class="badge badge-error badge-sm"
              @click="showBlocked = !showBlocked"
            >
              {{ blockedTasks.length }} blocked
            </button>

            <button
              v-for="option in filters"
              :key="option.value"
              class="btn btn-xs gap-1 rounded-xl"
              :class="filter === option.value ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="filter === option.value"
              @click="filter = option.value"
            >
              <Icon :name="option.icon" class="size-3" />
              <span class="hidden sm:inline">{{ option.label }}</span>
              <span class="badge badge-xs">{{
                filterCount(option.value)
              }}</span>
            </button>

            <button
              class="btn btn-xs gap-1 rounded-xl"
              :class="createOpen ? 'btn-primary' : 'btn-ghost'"
              :aria-expanded="createOpen"
              @click="createOpen = !createOpen"
            >
              <Icon name="kind-icon:plus" class="size-3.5" />
              <span class="hidden sm:inline">Create</span>
            </button>

            <button
              class="btn btn-ghost btn-xs gap-1"
              :disabled="loading"
              @click="refresh"
            >
              <span v-if="loading" class="loading loading-spinner loading-xs" />
              <Icon v-else name="kind-icon:refresh" class="size-3.5" />
              <span class="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </template>

        <template #item-trailing="{ item }">
          <span
            class="badge badge-xs"
            :class="priorityClass((item as Item).priority)"
            >{{ (item as Item).priority }}</span
          >
        </template>
      </kr-gallery>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type {
  ConductorProject,
  ConductorTask,
} from '@/server/api/conductor/projects.get'
import { useConductorStore } from '@/stores/conductorStore'
import {
  useProjectStore,
  type ProjectPriorityLevel,
  type ProjectWithRelations,
} from '@/stores/projectStore'
import { usePageStore } from '@/stores/pageStore'
import { useTodoStore } from '@/stores/todoStore'
import { useGalleryPreferenceStore } from '@/stores/galleryPreferenceStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import { IS_GALLERY_MODE, type GalleryMode } from '@/utils/galleryVocabulary'

const IMG_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'
type Status =
  'ACTIVE' | 'CONTINUOUS' | 'PAUSED' | 'DONE' | 'BRAINSTORM' | 'ARCHIVED'
type Filter = Status | 'ALL'
type Item = {
  id: number
  slug: string
  title: string
  description: string
  status: Status
  dbStatus: Status
  priority: ProjectPriorityLevel
  progress: number
  done: number
  total: number
  blocked: number
  needsHuman: number
  icon: string
  card: string
  hero: string
  meta: string
  progressPercent: number
  badges: Array<{ label: string; class?: string }>
  updated: number
  drift: boolean
  hasConductor: boolean
}
type BlockedTask = ConductorTask & { projectSlug: string; projectTitle: string }

const GALLERY_KEY = 'conductor-project-gallery'
const filters = [
  { value: 'ACTIVE' as const, label: 'Active', icon: 'kind-icon:sparkles' },
  {
    value: 'CONTINUOUS' as const,
    label: 'Continuous',
    icon: 'kind-icon:refresh',
  },
  { value: 'PAUSED' as const, label: 'Paused', icon: 'kind-icon:pause' },
  {
    value: 'DONE' as const,
    label: 'Completed',
    icon: 'kind-icon:check-circle',
  },
  { value: 'BRAINSTORM' as const, label: 'Ideas', icon: 'kind-icon:lightbulb' },
  { value: 'ARCHIVED' as const, label: 'Archived', icon: 'kind-icon:archive' },
  { value: 'ALL' as const, label: 'All', icon: 'kind-icon:cards' },
]
const IS_FILTER = (value: string): value is Filter =>
  filters.some((entry) => entry.value === value) || value === 'ALL'

const projects = useProjectStore()
const conductor = useConductorStore()
const page = usePageStore()
const todos = useTodoStore()
const galleryPrefs = useGalleryPreferenceStore()
const galleryMode = computed({
  get: () =>
    galleryPrefs.get<GalleryMode>(
      GALLERY_KEY,
      'mode',
      'cards',
      IS_GALLERY_MODE,
    ),
  set: (value: GalleryMode) => galleryPrefs.set(GALLERY_KEY, 'mode', value),
})
const filter = computed({
  get: () =>
    galleryPrefs.get<Filter>(GALLERY_KEY, 'filter', 'ACTIVE', IS_FILTER),
  set: (value: Filter) => galleryPrefs.set(GALLERY_KEY, 'filter', value),
})
const showSync = ref(false)
const showBlocked = ref(false)
const PROJECT_STATUSES = filters
  .map((entry) => entry.value)
  .filter((value): value is Status => value !== 'ALL')
const PROJECT_PRIORITIES: ProjectPriorityLevel[] = ['LOW', 'NORMAL', 'HIGH']
const createOpen = ref(false)
const createError = ref('')
const createForm = ref<{
  title: string
  description: string
  status: Status
  priority: ProjectPriorityLevel
}>({
  title: '',
  description: '',
  status: 'BRAINSTORM',
  priority: 'NORMAL',
})
const loading = computed(() => projects.loading || conductor.pending)
const error = computed(() => projects.error || conductor.error || '')

const conductorBySlug = computed(
  () => new Map(conductor.projects.map((project) => [project.slug, project])),
)
const slugFor = (record: ProjectWithRelations) =>
  record.conductorSlug || record.slug || `project-${record.id}`
const canonical = (path: string, slug: string, variant: string) =>
  path.split('?')[0]?.endsWith(`/projects/images/${slug}-${variant}.webp`)
const revision = (path: string, updated: number) =>
  !path || !updated || path.startsWith('data:')
    ? path
    : `${path}${path.includes('?') ? '&' : '?'}v=${updated}`

function image(
  record: ProjectWithRelations,
  source: ConductorProject | undefined,
  variant: 'icon' | 'card' | 'hero',
) {
  const slug = slugFor(record)
  const direct =
    variant === 'icon'
      ? record.imagePath ||
        record.ArtImage?.imagePath ||
        record.ArtCollection?.imagePath
      : variant === 'card'
        ? record.cardPath
        : record.heroPath
  const remote =
    variant === 'icon'
      ? source?.imagePath
      : variant === 'card'
        ? source?.cardPath
        : source?.heroPath
  if (!direct || canonical(direct, slug, variant))
    return remote || `${IMG_BASE}/${slug}-${variant}.webp`
  return revision(
    direct,
    record.updatedAt ? new Date(record.updatedAt).getTime() : 0,
  )
}

const statusLabel = (value: Status) =>
  value === 'DONE'
    ? 'Completed'
    : value === 'BRAINSTORM'
      ? 'Idea'
      : value.charAt(0) + value.slice(1).toLowerCase()
const statusClass = (value: Status) =>
  value === 'DONE'
    ? 'badge-success'
    : value === 'CONTINUOUS'
      ? 'badge-accent'
      : value === 'PAUSED'
        ? 'badge-warning'
        : value === 'ARCHIVED'
          ? 'badge-ghost'
          : value === 'BRAINSTORM'
            ? 'badge-secondary'
            : 'badge-primary'
const priorityClass = (value: ProjectPriorityLevel) =>
  value === 'HIGH'
    ? 'badge-error'
    : value === 'LOW'
      ? 'badge-ghost'
      : 'badge-warning'

function toItem(record: ProjectWithRelations): Item {
  const slug = slugFor(record)
  const source = conductorBySlug.value.get(slug)
  const status = (source?.status || record.status) as Status
  const priority = (source?.priority || record.priority) as ProjectPriorityLevel
  const blocked =
    source?.tasks.filter((task) => task.status === 'blocked').length || 0
  const needsHuman =
    source?.tasks.filter((task) => task.status === 'needs-human').length || 0
  const done =
    source?.tasks.filter((task) => task.status === 'done').length || 0
  const total = source?.tasks.length || record._count?.Todos || 0
  const progress = source?.progress ?? (status === 'DONE' ? 100 : 0)
  const drift = Boolean(
    source &&
    (record.status !== status ||
      record.priority !== priority ||
      record.isActive !== (status !== 'ARCHIVED')),
  )
  const metaParts = [`${progress}%`, `${done}/${total} done`]
  if (blocked) metaParts.push(`${blocked} blocked`)
  if (needsHuman) metaParts.push(`${needsHuman} need you`)
  const badges = [{ label: statusLabel(status), class: statusClass(status) }]
  if (drift) badges.push({ label: 'drift', class: 'badge-warning' })
  return {
    id: record.id,
    slug,
    title: record.title || source?.name || slug,
    description:
      record.flavorText ||
      record.description ||
      record.goal ||
      source?.notesFromSilas ||
      'Kind Robots project.',
    status,
    dbStatus: record.status as Status,
    priority,
    progress,
    done,
    total,
    blocked,
    needsHuman,
    icon: image(record, source, 'icon'),
    card: image(record, source, 'card'),
    hero: image(record, source, 'hero'),
    meta: metaParts.join(' · '),
    progressPercent: progress,
    badges,
    updated: record.updatedAt ? new Date(record.updatedAt).getTime() : 0,
    drift,
    hasConductor: Boolean(source),
  }
}

const allItems = computed(() => projects.projects.map(toItem))
const driftItems = computed(() => allItems.value.filter((item) => item.drift))
const databaseOnly = computed(() =>
  allItems.value.filter((item) => !item.hasConductor),
)
const conductorOnly = computed(() => {
  const slugs = new Set(allItems.value.map((item) => item.slug))
  return conductor.projects.filter((project) => !slugs.has(project.slug))
})
const syncIssueCount = computed(
  () =>
    driftItems.value.length +
    databaseOnly.value.length +
    conductorOnly.value.length,
)
const blockedTasks = computed<BlockedTask[]>(() =>
  conductor.projects.flatMap((project) =>
    project.tasks
      .filter((task) => task.status === 'blocked')
      .map((task) => ({
        ...task,
        projectSlug: project.slug,
        projectTitle:
          projects.projectForSlug(project.slug)?.title ||
          project.name ||
          project.slug,
      })),
  ),
)
const filterLabel = computed(
  () => filters.find((entry) => entry.value === filter.value)?.label || 'All',
)
const galleryItems = computed(() => {
  const list =
    filter.value === 'ALL'
      ? allItems.value
      : allItems.value.filter((item) => item.status === filter.value)
  const order: Record<ProjectPriorityLevel, number> = {
    HIGH: 0,
    NORMAL: 1,
    LOW: 2,
  }
  return [...list].sort(
    (a, b) =>
      order[a.priority] - order[b.priority] ||
      b.updated - a.updated ||
      a.title.localeCompare(b.title),
  )
})
const filterCount = (value: Filter) =>
  value === 'ALL'
    ? allItems.value.length
    : allItems.value.filter((item) => item.status === value).length

const workspaceCards = computed<BuilderCard[]>(() => [
  {
    key: 'overview',
    label: 'Overview',
    title: 'Overview',
    icon: 'kind-icon:gearhammer',
    tagline: '',
    narrative: '',
    restoresFields: [],
    steps: [],
    deckImage: '/images/projects/overview-card.webp',
    payload: {},
  },
  ...allItems.value
    .filter((item) => item.status !== 'ARCHIVED')
    .map((item) => ({
      key: item.slug,
      label: item.title,
      title: item.title,
      icon: 'kind-icon:document',
      tagline: '',
      narrative: '',
      restoresFields: [],
      steps: [],
      deckImage: item.card,
      payload: {},
    })),
])
watch(
  workspaceCards,
  (cards) => {
    page.setCards(cards)
    if (!page.workspaceCardKey) page.setWorkspaceCardKey('overview')
  },
  { immediate: true },
)

onMounted(async () => {
  await load(true)
})
const load = (force: boolean) =>
  Promise.all([
    projects.fetchProjects(
      { includeInactive: true, includeMature: true },
      force,
    ),
    conductor.fetchProjects(force),
    todos.hasLoaded ? todos.fetchTodos(force) : Promise.resolve(),
  ])
const refresh = () => load(true)
async function open(item: Item) {
  await projects.fetchProject(item.id)
  page.setWorkspaceCardKey(item.slug)
}
async function openSlug(slug: string) {
  const item = allItems.value.find((entry) => entry.slug === slug)
  if (item) await open(item)
}

async function createProject(): Promise<void> {
  createError.value = ''
  const title = createForm.value.title.trim()
  if (!title) return
  try {
    const created = await projects.createProject({
      title,
      description: createForm.value.description.trim() || null,
      status: createForm.value.status,
      priority: createForm.value.priority,
    })
    createForm.value = {
      title: '',
      description: '',
      status: 'BRAINSTORM',
      priority: 'NORMAL',
    }
    createOpen.value = false
    page.setWorkspaceCardKey(slugFor(created))
  } catch (error) {
    createError.value =
      error instanceof Error ? error.message : 'Project could not be created.'
  }
}
</script>
