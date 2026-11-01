<template>
  <section
    class="kr-surface rounded-2xl border border-base-300 bg-(--kr-surface) p-3"
  >
    <header-page-bar>
      <div
        class="cg-bar"
        title="Browse projects, flag missing launch destinations, or start a new one."
        data-testid="conductor-gallery-bar"
      >
        <button
          class="kr-btn-xs gap-1"
          :class="
            conductor.pendingPitches.length ? 'btn-secondary' : 'btn-ghost'
          "
          :aria-label="`Proposed pitches: ${conductor.pendingPitches.length}`"
          @click="openProposed"
        >
          <Icon name="kind-icon:brain" class="kr-icon-3" />
          <span class="cg-bar-label">Proposed</span>
          <span class="kr-badge-xs">
            {{ conductor.pendingPitches.length }}
          </span>
        </button>

        <button
          type="button"
          class="kr-btn-xs gap-1"
          :class="manageOpen ? 'btn-primary' : 'btn-ghost'"
          :aria-expanded="manageOpen"
          aria-label="Manage projects"
          @click="manageOpen = !manageOpen"
        >
          <Icon name="kind-icon:sliders" class="kr-icon-3" />
          <span class="cg-bar-label">Manage projects</span>
        </button>

        <button
          class="kr-btn-xs gap-1"
          :class="createOpen ? 'btn-primary' : 'btn-ghost'"
          :aria-expanded="createOpen"
          aria-label="Create project"
          @click="createOpen = !createOpen"
        >
          <Icon name="kind-icon:plus" class="kr-icon-3-5" />
          <span class="cg-bar-label">Create</span>
        </button>

        <button
          class="btn btn-ghost btn-xs gap-1"
          aria-label="Refresh projects"
          :disabled="loading"
          @click="refresh"
        >
          <span v-if="loading" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:refresh" class="kr-icon-3-5" />
          <span class="cg-bar-label">Refresh</span>
        </button>
      </div>
    </header-page-bar>

    <section
      v-if="createOpen"
      class="shrink-0 rounded-xl border border-base-300 bg-base-100"
    >
      <div class="space-y-3 p-3">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control sm:col-span-2">
            <span class="kr-label-xs">Title</span>
            <input
              v-model="createForm.title"
              type="text"
              class="kr-input-sm"
              placeholder="Project title"
              @input="onTitleInput"
            />
          </label>
          <label class="form-control sm:col-span-2">
            <span class="kr-label-xs">
              Slug
              <span class="opacity-60">(project URL and Conductor key)</span>
            </span>
            <input
              ref="slugInputRef"
              v-model="createForm.slug"
              type="text"
              class="kr-input-sm font-mono"
              :class="{ 'input-error': slugError }"
              placeholder="project-slug"
              @input="onSlugInput"
              @blur="onSlugBlur"
            />
            <span v-if="slugError" class="label-text-alt mt-1 text-error">
              {{ slugError }}
            </span>
            <span v-else class="label-text-alt mt-1 opacity-60">
              Auto-filled from the title. Conductor will own lifecycle and
              roadmap progress after the project is scaffolded.
            </span>
          </label>
          <label class="form-control sm:col-span-2">
            <span class="kr-label-xs">Description</span>
            <textarea
              v-model="createForm.description"
              class="textarea textarea-bordered min-h-20 rounded-xl"
              placeholder="What is this project?"
            />
          </label>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm w-full rounded-xl"
          :disabled="!createForm.title.trim() || !!slugError || projects.saving"
          @click="createProject"
        >
          <span v-if="projects.saving" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:plus" class="kr-icon-3-5" />
          Create Project
        </button>
        <p v-if="createError" class="kr-text-error-xs">{{ createError }}</p>
      </div>
    </section>

    <section
      v-if="manageOpen"
      class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
    >
      <h3 class="kr-text-bold-sm">Manage project</h3>
      <p class="kr-text-dim-xs-55 mt-1">
        The title is stored in Kind Robots. Project status syncs with Conductor
        when linked. Renaming a title never changes the project slug or roadmap.
      </p>
      <div class="mt-2 flex flex-wrap items-end gap-2">
        <label class="form-control min-w-48 flex-1">
          <span class="kr-label-xs">Project</span>
          <select
            v-model.number="manageId"
            class="kr-select-sm w-full"
            :disabled="managing"
          >
            <option :value="0" disabled>Choose a project</option>
            <option
              v-for="item in manageableItems"
              :key="item.id"
              :value="item.id"
            >
              {{ item.title }}
            </option>
          </select>
        </label>
        <label class="form-control min-w-48 flex-1">
          <span class="kr-label-xs">Project title</span>
          <input
            v-model="manageTitle"
            type="text"
            class="kr-input-sm w-full"
            maxlength="200"
            placeholder="Project title"
            :disabled="!manageSelected || managing"
            @keydown.enter.prevent="saveManagedTitle"
          />
        </label>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="
            !manageSelected ||
            managing ||
            !manageTitle.trim() ||
            manageTitle.trim() === manageSelected.title
          "
          @click="saveManagedTitle"
        >
          Save title
        </button>
        <label class="form-control min-w-32">
          <span class="kr-label-xs">Status</span>
          <select
            v-model="manageStatus"
            class="kr-select-sm w-full"
            :disabled="!manageSelected || managing"
          >
            <option
              v-for="status in editableStatuses"
              :key="status"
              :value="status"
            >
              {{ statusLabel(status) }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="
            !manageSelected ||
            managing ||
            manageSelected.dbStatus === manageStatus
          "
          @click="saveManagedStatus"
        >
          <span v-if="managing" class="kr-spinner-xs" />
          Save status
        </button>
      </div>
      <p
        v-if="manageMessage"
        class="mt-2 text-xs"
        :class="manageError ? 'text-error' : 'text-success'"
        role="status"
      >
        {{ manageMessage }}
      </p>
    </section>

    <section
      v-if="showSync && syncIssueCount"
      class="shrink-0 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs"
    >
      <strong>Lifecycle reconciliation</strong>
      <p
        v-if="manageMessage"
        class="mt-2 text-xs"
        :class="manageError ? 'text-error' : 'text-success'"
        role="status"
      >
        {{ manageMessage }}
      </p>
      <div class="mt-2 grid gap-2 md:grid-cols-3">
        <div v-if="driftItems.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Status/priority drift</b>
          <button
            v-for="item in driftItems.slice(0, 8)"
            :key="item.id"
            class="mt-1 block w-full text-left hover:text-primary"
            @click="open(item)"
          >
            <span class="break-words">{{ item.title }}</span
            >: {{ item.dbStatus }} → {{ item.status }}
          </button>
          <p class="kr-text-dim-xs-55 mt-2">
            Conductor is authoritative. If the Kind Robots value is your newer
            choice, explicitly send it to Conductor:
          </p>
          <button
            v-for="item in driftItems.slice(0, 8)"
            :key="`reconcile-${item.id}`"
            type="button"
            class="btn btn-outline btn-xs mt-1 mr-1"
            :disabled="managing"
            @click.stop="reconcile(item)"
          >
            Keep {{ item.title }}: {{ statusLabel(item.dbStatus) }}
          </button>
        </div>
        <div v-if="conductorOnly.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Missing database record</b>
          <p
            v-for="project in conductorOnly.slice(0, 8)"
            :key="project.slug"
            class="mt-1 break-words"
          >
            {{ project.name || project.slug }}
          </p>
        </div>
        <div v-if="databaseOnly.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Database-only draft</b>
          <p
            v-for="item in databaseOnly.slice(0, 8)"
            :key="item.id"
            class="mt-1 break-words"
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
      <strong class="kr-text-error-sm">Why work is blocked</strong>
      <div class="mt-2 grid gap-2 lg:grid-cols-2">
        <button
          v-for="task in blockedTasks"
          :key="`${task.projectSlug}:${task.id}`"
          class="rounded-lg border border-error/20 bg-base-100 p-3 text-left hover:border-error"
          @click="openSlug(task.projectSlug)"
        >
          <p class="kr-text-black-xs text-error">
            {{ task.projectTitle }} · {{ task.id }}
          </p>
          <p class="kr-text-semibold-sm">{{ task.title }}</p>
          <p v-if="task.note" class="kr-text-dim-xs-55 line-clamp-2">
            {{ task.note }}
          </p>
        </button>
      </div>
    </section>

    <main class="kr-scroll kr-panel-compact">
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
            <button
              v-for="option in filters"
              :key="option.value"
              class="kr-btn-xs gap-1"
              :class="filter === option.value ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="filter === option.value"
              @click="filter = option.value"
            >
              <Icon :name="option.icon" class="kr-icon-3" />
              <span class="hidden sm:inline">{{ option.label }}</span>
              <span class="kr-badge-xs">{{ filterCount(option.value) }}</span>
            </button>

            <button
              v-if="syncIssueCount"
              class="kr-btn-xs gap-1"
              :class="showSync ? 'btn-warning' : 'btn-ghost'"
              :aria-pressed="showSync"
              @click="showSync = !showSync"
            >
              <Icon name="kind-icon:warning" class="kr-icon-3" />
              <span class="hidden sm:inline">Sync</span>
              <span class="kr-badge-xs">{{ syncIssueCount }}</span>
            </button>

            <button
              v-if="blockedTasks.length"
              class="kr-btn-xs gap-1"
              :class="showBlocked ? 'btn-error' : 'btn-ghost'"
              :aria-pressed="showBlocked"
              @click="showBlocked = !showBlocked"
            >
              <Icon name="kind-icon:pause" class="kr-icon-3" />
              <span class="hidden sm:inline">Blocked</span>
              <span class="kr-badge-xs">{{ blockedTasks.length }}</span>
            </button>
          </div>
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
import { useUserStore } from '@/stores/userStore'
import { useGalleryPreferenceStore } from '@/stores/galleryPreferenceStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import { IS_GALLERY_MODE, type GalleryMode } from '@/utils/galleryVocabulary'
import { slugify } from '@/utils/slugify'
import {
  projectDestination,
  projectSheetPath,
} from '@/utils/projectDestination'

const IMG_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'
type Status =
  'ACTIVE' | 'CONTINUOUS' | 'PAUSED' | 'DONE' | 'BRAINSTORM' | 'ARCHIVED'
type Filter = Exclude<Status, 'BRAINSTORM'> | 'ALL' | 'NEEDS_ENDPOINT'
type Item = {
  id: number
  slug: string
  title: string
  description: string
  status: Status
  dbStatus: Status
  priority: ProjectPriorityLevel
  dbPriority: ProjectPriorityLevel
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
  missingEndpoint: boolean
}
type BlockedTask = ConductorTask & {
  projectSlug: string
  projectTitle: string
}

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
  { value: 'ARCHIVED' as const, label: 'Archived', icon: 'kind-icon:archive' },
  { value: 'ALL' as const, label: 'All', icon: 'kind-icon:cards' },
  {
    value: 'NEEDS_ENDPOINT' as const,
    label: 'No endpoint',
    icon: 'kind-icon:warning',
  },
]
const IS_FILTER = (value: string): value is Filter =>
  filters.some((entry) => entry.value === value)

const projects = useProjectStore()
const conductor = useConductorStore()
const page = usePageStore()
const userStore = useUserStore()
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
const manageOpen = ref(false)
const manageId = ref(0)
const manageStatus = ref<Status>('ACTIVE')
const manageTitle = ref('')
const managing = ref(false)
const manageMessage = ref('')
const manageError = ref(false)
const editableStatuses: Status[] = [
  'ACTIVE',
  'CONTINUOUS',
  'PAUSED',
  'DONE',
  'ARCHIVED',
]
const createOpen = ref(false)
const createError = ref('')
const createForm = ref({ title: '', slug: '', description: '' })
const slugTouched = ref(false)
const slugInputRef = ref<HTMLInputElement | null>(null)
const slugError = computed(() => {
  if (!createForm.value.title.trim() && !createForm.value.slug.trim()) return ''
  return createForm.value.slug.trim()
    ? ''
    : 'A slug is required. It becomes the project URL and Conductor directory name.'
})

function onTitleInput() {
  if (!slugTouched.value)
    createForm.value.slug = slugify(createForm.value.title)
}

function onSlugInput() {
  slugTouched.value = true
  createForm.value.slug = createForm.value.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
}

function onSlugBlur() {
  createForm.value.slug = slugify(createForm.value.slug)
}

const loading = computed(() => projects.loading || conductor.pending)
const error = computed(() => projects.error || conductor.error || '')
const conductorBySlug = computed(
  () =>
    new Map(
      (conductor.data?.projects ?? []).map((project) => [
        project.slug,
        project,
      ]),
    ),
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
      ? record.iconPath ||
        record.imagePath ||
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
  if (!direct || canonical(direct, slug, variant)) {
    return remote || `${IMG_BASE}/${slug}-${variant}.webp`
  }
  return revision(
    direct,
    record.updatedAt ? new Date(record.updatedAt).getTime() : 0,
  )
}

const statusLabel = (value: Status) =>
  value === 'DONE'
    ? 'Completed'
    : value === 'BRAINSTORM'
      ? 'Draft'
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
            ? 'badge-neutral'
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
  const badges = [
    { label: statusLabel(status), class: statusClass(status) },
    { label: priority, class: priorityClass(priority) },
  ]
  if (drift) badges.push({ label: 'drift', class: 'badge-warning' })
  const missingEndpoint = !projectDestination(record.liveUrl)
  if (missingEndpoint)
    badges.push({ label: 'No endpoint', class: 'badge-warning' })
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
    dbPriority: record.priority as ProjectPriorityLevel,
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
    missingEndpoint,
  }
}

const allItems = computed(() => projects.projects.map(toItem))
const manageableItems = computed(() =>
  [...allItems.value].sort((a, b) => a.title.localeCompare(b.title)),
)
const manageSelected = computed(
  () => allItems.value.find((item) => item.id === manageId.value) ?? null,
)
watch(manageId, () => {
  manageStatus.value = manageSelected.value?.dbStatus ?? 'ACTIVE'
  manageTitle.value = manageSelected.value?.title ?? ''
  manageMessage.value = ''
})
const driftItems = computed(() => allItems.value.filter((item) => item.drift))
const databaseOnly = computed(() =>
  allItems.value.filter((item) => !item.hasConductor),
)
const conductorOnly = computed(() => {
  const slugs = new Set(allItems.value.map((item) => item.slug))
  return (conductor.data?.projects ?? []).filter(
    (project) => !slugs.has(project.slug),
  )
})
const syncIssueCount = computed(
  () =>
    driftItems.value.length +
    databaseOnly.value.length +
    conductorOnly.value.length,
)
const blockedTasks = computed<BlockedTask[]>(() =>
  (conductor.data?.projects ?? []).flatMap((project) =>
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
      : filter.value === 'NEEDS_ENDPOINT'
        ? allItems.value.filter((item) => item.missingEndpoint)
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
    : value === 'NEEDS_ENDPOINT'
      ? allItems.value.filter((item) => item.missingEndpoint).length
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
  ])
const refresh = () => load(true)

async function saveManagedTitle(): Promise<void> {
  const selected = manageSelected.value
  const title = manageTitle.value.trim()
  if (!selected || managing.value || !title || title === selected.title) return
  managing.value = true
  manageMessage.value = ''
  manageError.value = false
  try {
    await projects.updateProject(selected.id, { title })
    manageTitle.value = title
    manageMessage.value =
      'Project title saved in Kind Robots. Conductor slug and roadmap unchanged.'
  } catch (cause) {
    manageError.value = true
    manageMessage.value =
      cause instanceof Error ? cause.message : 'Title update failed.'
  } finally {
    managing.value = false
  }
}

async function saveManagedStatus(): Promise<void> {
  const selected = manageSelected.value
  if (!selected || managing.value || selected.dbStatus === manageStatus.value)
    return
  managing.value = true
  manageMessage.value = ''
  manageError.value = false
  try {
    const record = projects.projects.find(
      (project) => project.id === selected.id,
    )
    if (manageStatus.value === 'ARCHIVED') {
      await projects.archiveProject(selected.id)
    } else {
      await projects.updateProject(selected.id, { status: manageStatus.value })
    }
    await load(true)
    manageMessage.value = record?.conductorSlug
      ? 'Saved to Conductor. The gallery will reflect it after projection sync.'
      : 'Saved in Kind Robots. This project is not linked to Conductor.'
  } catch (cause) {
    manageError.value = true
    manageMessage.value =
      cause instanceof Error ? cause.message : 'Status update failed.'
  } finally {
    managing.value = false
  }
}

async function reconcile(item: Item): Promise<void> {
  if (managing.value) return
  managing.value = true
  manageMessage.value = ''
  manageError.value = false
  try {
    const record = projects.projects.find((project) => project.id === item.id)
    if (!record?.conductorSlug) {
      throw new Error(
        'This project is not linked to Conductor; use Manage projects for local-only projects.',
      )
    }
    await projects.updateProject(item.id, {
      status: item.dbStatus,
      ...(item.dbPriority !== item.priority
        ? { priority: item.dbPriority }
        : {}),
    })
    await load(true)
    manageMessage.value = `Sent ${item.title} to Conductor. The projection may take a moment to catch up.`
    showSync.value = true
  } catch (cause) {
    manageError.value = true
    manageMessage.value =
      cause instanceof Error ? cause.message : 'Reconciliation failed.'
    manageOpen.value = true
  } finally {
    managing.value = false
  }
}

function openProposed() {
  page.setWorkspaceCardKey('proposed')
}

/*
 * Admins open the screen that manages the project; everyone else (this
 * gallery also mounts in user dashboards) opens the project itself
 * (Silas, 2026-11-01 PT).
 */
async function open(item: Item) {
  if (!userStore.isAdmin) {
    const record = projects.projects.find((entry) => entry.id === item.id)
    const target =
      projectDestination(record?.liveUrl) || projectSheetPath(item.slug)
    await navigateTo(target, { external: target.startsWith('https://') })
    return
  }
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
  const slug = slugify(createForm.value.slug || title)
  createForm.value.slug = slug
  if (!slug) {
    createError.value =
      'A slug is required. It becomes the project URL and Conductor directory name.'
    return
  }
  try {
    const created = await projects.createProject({
      title,
      slug,
      description: createForm.value.description.trim() || null,
    })
    createForm.value = { title: '', slug: '', description: '' }
    slugTouched.value = false
    createOpen.value = false
    page.setWorkspaceCardKey(slugFor(created))
  } catch (cause) {
    const statusCode =
      cause instanceof Error
        ? (cause as Error & { statusCode?: number }).statusCode
        : undefined
    if (statusCode === 409) {
      createError.value = `The slug "${slug}" is already taken. Try a different one below.`
      slugTouched.value = true
      slugInputRef.value?.focus()
    } else {
      createError.value =
        cause instanceof Error ? cause.message : 'Project could not be created.'
    }
  }
}
</script>

<style scoped>
.cg-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  padding-inline: 0.25rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.cg-bar::-webkit-scrollbar {
  display: none;
}
.cg-bar > * {
  flex: none;
}
@container (max-width: 480px) {
  .cg-bar-label {
    display: none;
  }
}
</style>
