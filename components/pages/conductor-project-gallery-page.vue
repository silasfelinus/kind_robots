<template>
  <section class="flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3">
    <header class="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2">
      <Icon name="kind-icon:gearhammer" class="size-4 text-primary" />
      <strong>Projects</strong>
      <span class="badge badge-primary badge-sm">{{ allItems.length }} records</span>
      <span v-if="galleryItems.length !== allItems.length" class="text-xs text-base-content/45">{{ galleryItems.length }} shown</span>
      <button v-if="syncIssueCount" class="badge badge-warning badge-sm" @click="showSync = !showSync">
        {{ syncIssueCount }} sync issue{{ syncIssueCount === 1 ? '' : 's' }}
      </button>
      <button v-if="blockedTasks.length" class="badge badge-error badge-sm" @click="showBlocked = !showBlocked">
        {{ blockedTasks.length }} blocked
      </button>
      <div class="flex-1" />
      <div class="flex gap-0.5">
        <button v-for="mode in modes" :key="mode.value" class="btn btn-xs px-2" :class="galleryMode === mode.value ? 'btn-primary' : 'btn-ghost'" :title="mode.label" @click="galleryMode = mode.value">{{ mode.abbr }}</button>
      </div>
      <button class="btn btn-ghost btn-xs gap-1" :disabled="loading" @click="refresh">
        <span v-if="loading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-3.5" />
        Refresh
      </button>
    </header>

    <nav class="flex shrink-0 flex-wrap gap-1 rounded-xl border border-base-300 bg-base-100 p-2">
      <button v-for="option in filters" :key="option.value" class="btn btn-xs gap-1 rounded-xl" :class="filter === option.value ? 'btn-primary' : 'btn-ghost'" @click="filter = option.value">
        <Icon :name="option.icon" class="size-3" />{{ option.label }}
        <span class="badge badge-xs">{{ filterCount(option.value) }}</span>
      </button>
    </nav>

    <section v-if="showSync && syncIssueCount" class="shrink-0 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
      <strong>Lifecycle reconciliation</strong>
      <div class="mt-2 grid gap-2 md:grid-cols-3">
        <div v-if="driftItems.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Status/priority drift</b>
          <button v-for="item in driftItems.slice(0, 8)" :key="item.id" class="mt-1 block w-full truncate text-left hover:text-primary" @click="open(item)">{{ item.title }}: {{ item.dbStatus }} → {{ item.status }}</button>
        </div>
        <div v-if="conductorOnly.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Missing database record</b>
          <p v-for="project in conductorOnly.slice(0, 8)" :key="project.slug" class="mt-1 truncate">{{ project.name || project.slug }}</p>
        </div>
        <div v-if="databaseOnly.length" class="rounded-lg bg-base-100/80 p-2">
          <b>Database-only</b>
          <p v-for="item in databaseOnly.slice(0, 8)" :key="item.id" class="mt-1 truncate">{{ item.title }}</p>
        </div>
      </div>
    </section>

    <section v-if="showBlocked && blockedTasks.length" class="shrink-0 rounded-xl border border-error/30 bg-error/10 p-3">
      <strong class="text-sm text-error">Why work is blocked</strong>
      <div class="mt-2 grid gap-2 lg:grid-cols-2">
        <button v-for="task in blockedTasks" :key="`${task.projectSlug}:${task.id}`" class="rounded-lg border border-error/20 bg-base-100 p-3 text-left hover:border-error" @click="openSlug(task.projectSlug)">
          <p class="text-xs font-black text-error">{{ task.projectTitle }} · {{ task.id }}</p>
          <p class="text-sm font-semibold">{{ task.title }}</p>
          <p v-if="task.note" class="line-clamp-2 text-xs text-base-content/55">{{ task.note }}</p>
        </button>
      </div>
    </section>

    <main class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-3">
      <div v-if="loading && !allItems.length" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="n in 8" :key="n" class="h-56 animate-pulse rounded-2xl bg-base-200" />
      </div>
      <div v-else-if="error" class="flex min-h-64 flex-col items-center justify-center gap-2 text-error">
        <Icon name="kind-icon:warning" class="size-10" /><b>{{ error }}</b>
      </div>
      <div v-else-if="!galleryItems.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <Icon name="kind-icon:cards" class="size-12 text-base-content/20" />
        <b>No {{ filterLabel.toLowerCase() }} projects.</b>
      </div>
      <section v-else :class="gridClass">
        <button v-for="item in galleryItems" :key="item.id" class="group overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg" :class="itemClass" @click="open(item)">
          <div class="relative overflow-hidden" :class="imageWrapClass">
            <img :src="displayImage(item)" :alt="item.title" class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-linear-to-t from-base-300/90 via-transparent to-transparent" />
            <div class="absolute left-2 top-2 flex gap-1">
              <span class="badge badge-xs" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
              <span v-if="item.drift" class="badge badge-warning badge-xs">drift</span>
            </div>
            <img v-if="galleryMode !== 'icons'" :src="item.icon" alt="" class="absolute bottom-2 left-2 size-11 rounded-xl border border-white/25 object-cover shadow" />
          </div>
          <div class="p-3" :class="galleryMode === 'icons' ? 'text-center' : ''">
            <div class="flex items-start gap-2" :class="galleryMode === 'icons' ? 'justify-center' : ''">
              <div class="min-w-0 flex-1">
                <h2 class="truncate font-black">{{ item.title }}</h2>
                <p v-if="galleryMode !== 'icons'" class="line-clamp-2 text-xs text-base-content/55">{{ item.description }}</p>
              </div>
              <span class="badge badge-xs" :class="priorityClass(item.priority)">{{ item.priority }}</span>
            </div>
            <div class="mt-2 flex items-center gap-2 text-xs text-base-content/45">
              <span>{{ item.progress }}%</span><span>{{ item.done }}/{{ item.total }} done</span>
              <span v-if="item.blocked" class="font-bold text-error">{{ item.blocked }} blocked</span>
              <span v-if="item.needsHuman" class="font-bold text-accent">{{ item.needsHuman }} need you</span>
            </div>
            <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"><div class="h-full bg-primary" :style="{ width: `${item.progress}%` }" /></div>
          </div>
        </button>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ConductorProject, ConductorTask } from '@/server/api/conductor/projects.get'
import { useConductorStore } from '@/stores/conductorStore'
import { useProjectStore, type ProjectPriorityLevel, type ProjectWithRelations } from '@/stores/projectStore'
import { usePageStore } from '@/stores/pageStore'
import { useTodoStore } from '@/stores/todoStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'

const IMG_BASE = 'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'
type Mode = 'cards' | 'heroes' | 'icons' | 'list'
type Status = 'ACTIVE' | 'PAUSED' | 'DONE' | 'BRAINSTORM' | 'ARCHIVED'
type Filter = Status | 'ALL'
type Item = { id: number; slug: string; title: string; description: string; status: Status; dbStatus: Status; priority: ProjectPriorityLevel; progress: number; done: number; total: number; blocked: number; needsHuman: number; icon: string; card: string; hero: string; updated: number; drift: boolean; hasConductor: boolean }
type BlockedTask = ConductorTask & { projectSlug: string; projectTitle: string }

const modes = [{ value: 'cards' as const, label: 'Cards', abbr: 'C' }, { value: 'heroes' as const, label: 'Heroes', abbr: 'H' }, { value: 'icons' as const, label: 'Icons', abbr: 'I' }, { value: 'list' as const, label: 'List', abbr: 'L' }]
const filters = [{ value: 'ACTIVE' as const, label: 'Active', icon: 'kind-icon:sparkles' }, { value: 'PAUSED' as const, label: 'Paused', icon: 'kind-icon:pause' }, { value: 'DONE' as const, label: 'Completed', icon: 'kind-icon:check-circle' }, { value: 'BRAINSTORM' as const, label: 'Ideas', icon: 'kind-icon:lightbulb' }, { value: 'ARCHIVED' as const, label: 'Archived', icon: 'kind-icon:archive' }, { value: 'ALL' as const, label: 'All', icon: 'kind-icon:cards' }]

const projects = useProjectStore()
const conductor = useConductorStore()
const page = usePageStore()
const todos = useTodoStore()
const galleryMode = ref<Mode>('cards')
const filter = ref<Filter>('ACTIVE')
const showSync = ref(false)
const showBlocked = ref(false)
const loading = computed(() => projects.loading || conductor.pending)
const error = computed(() => projects.error || conductor.error || '')

const conductorBySlug = computed(() => new Map(conductor.projects.map((project) => [project.slug, project])))
const slugFor = (record: ProjectWithRelations) => record.conductorSlug || record.slug || `project-${record.id}`
const canonical = (path: string, slug: string, variant: string) => path.split('?')[0]?.endsWith(`/projects/images/${slug}-${variant}.webp`)
const revision = (path: string, updated: number) => !path || !updated || path.startsWith('data:') ? path : `${path}${path.includes('?') ? '&' : '?'}v=${updated}`

function image(record: ProjectWithRelations, source: ConductorProject | undefined, variant: 'icon' | 'card' | 'hero') {
  const slug = slugFor(record)
  const direct = variant === 'icon' ? record.imagePath || record.ArtImage?.imagePath || record.ArtCollection?.imagePath : variant === 'card' ? record.cardPath : record.heroPath
  const remote = variant === 'icon' ? source?.imagePath : variant === 'card' ? source?.cardPath : source?.heroPath
  if (!direct || canonical(direct, slug, variant)) return remote || `${IMG_BASE}/${slug}-${variant}.webp`
  return revision(direct, record.updatedAt ? new Date(record.updatedAt).getTime() : 0)
}

function toItem(record: ProjectWithRelations): Item {
  const slug = slugFor(record)
  const source = conductorBySlug.value.get(slug)
  const status = (source?.status || record.status) as Status
  const priority = (source?.priority || record.priority) as ProjectPriorityLevel
  const blocked = source?.tasks.filter((task) => task.status === 'blocked').length || 0
  const needsHuman = source?.tasks.filter((task) => task.status === 'needs-human').length || 0
  const done = source?.tasks.filter((task) => task.status === 'done').length || 0
  return { id: record.id, slug, title: record.title || source?.name || slug, description: record.flavorText || record.description || record.goal || source?.notesFromSilas || 'Kind Robots project.', status, dbStatus: record.status as Status, priority, progress: source?.progress ?? (status === 'DONE' ? 100 : 0), done, total: source?.tasks.length || record._count?.Todos || 0, blocked, needsHuman, icon: image(record, source, 'icon'), card: image(record, source, 'card'), hero: image(record, source, 'hero'), updated: record.updatedAt ? new Date(record.updatedAt).getTime() : 0, drift: Boolean(source && (record.status !== status || record.priority !== priority || record.isActive !== (status !== 'ARCHIVED'))), hasConductor: Boolean(source) }
}

const allItems = computed(() => projects.projects.map(toItem))
const driftItems = computed(() => allItems.value.filter((item) => item.drift))
const databaseOnly = computed(() => allItems.value.filter((item) => !item.hasConductor))
const conductorOnly = computed(() => { const slugs = new Set(allItems.value.map((item) => item.slug)); return conductor.projects.filter((project) => !slugs.has(project.slug)) })
const syncIssueCount = computed(() => driftItems.value.length + databaseOnly.value.length + conductorOnly.value.length)
const blockedTasks = computed<BlockedTask[]>(() => conductor.projects.flatMap((project) => project.tasks.filter((task) => task.status === 'blocked').map((task) => ({ ...task, projectSlug: project.slug, projectTitle: projects.projectForSlug(project.slug)?.title || project.name || project.slug }))))
const filterLabel = computed(() => filters.find((entry) => entry.value === filter.value)?.label || 'All')
const galleryItems = computed(() => { const list = filter.value === 'ALL' ? allItems.value : allItems.value.filter((item) => item.status === filter.value); const order: Record<ProjectPriorityLevel, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }; return [...list].sort((a, b) => order[a.priority] - order[b.priority] || b.updated - a.updated || a.title.localeCompare(b.title)) })
const gridClass = computed(() => galleryMode.value === 'list' ? 'flex flex-col gap-2' : galleryMode.value === 'heroes' ? 'grid gap-4 lg:grid-cols-2' : galleryMode.value === 'icons' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
const itemClass = computed(() => galleryMode.value === 'list' ? 'grid md:grid-cols-[12rem_1fr]' : '')
const imageWrapClass = computed(() => galleryMode.value === 'heroes' ? 'min-h-64' : galleryMode.value === 'icons' ? 'mx-auto mt-3 size-24 rounded-2xl' : galleryMode.value === 'list' ? 'min-h-40' : 'aspect-[4/3]')
const displayImage = (item: Item) => galleryMode.value === 'heroes' || galleryMode.value === 'list' ? item.hero : galleryMode.value === 'icons' ? item.icon : item.card
const filterCount = (value: Filter) => value === 'ALL' ? allItems.value.length : allItems.value.filter((item) => item.status === value).length

const workspaceCards = computed<BuilderCard[]>(() => [{ key: 'overview', label: 'Overview', title: 'Overview', icon: 'kind-icon:gearhammer', tagline: '', narrative: '', restoresFields: [], steps: [], deckImage: '/images/projects/overview-card.webp', payload: {} }, ...allItems.value.filter((item) => item.status !== 'ARCHIVED').map((item) => ({ key: item.slug, label: item.title, title: item.title, icon: 'kind-icon:document', tagline: '', narrative: '', restoresFields: [], steps: [], deckImage: item.card, payload: {} }))])
watch(workspaceCards, (cards) => { page.setCards(cards); if (!page.workspaceCardKey) page.setWorkspaceCardKey('overview') }, { immediate: true })
watch(galleryMode, (value) => { if (import.meta.client) localStorage.setItem('conductor-gallery-mode', value) })
watch(filter, (value) => { if (import.meta.client) localStorage.setItem('conductor-project-filter', value) })

onMounted(async () => { if (import.meta.client) { const mode = localStorage.getItem('conductor-gallery-mode') as Mode | null; if (mode && modes.some((entry) => entry.value === mode)) galleryMode.value = mode; const saved = localStorage.getItem('conductor-project-filter') as Filter | null; if (saved && filters.some((entry) => entry.value === saved)) filter.value = saved } await load(false) })
const load = (force: boolean) => Promise.all([projects.fetchProjects({ includeInactive: true, includeMature: true }, force), conductor.fetchProjects(force), todos.hasLoaded ? todos.fetchTodos(force) : Promise.resolve()])
const refresh = () => load(true)
async function open(item: Item) { await projects.fetchProject(item.id); page.setWorkspaceCardKey(item.slug) }
async function openSlug(slug: string) { const item = allItems.value.find((entry) => entry.slug === slug); if (item) await open(item) }
const statusLabel = (value: Status) => value === 'DONE' ? 'Completed' : value === 'BRAINSTORM' ? 'Idea' : value.charAt(0) + value.slice(1).toLowerCase()
const statusClass = (value: Status) => value === 'DONE' ? 'badge-success' : value === 'PAUSED' ? 'badge-warning' : value === 'ARCHIVED' ? 'badge-ghost' : value === 'BRAINSTORM' ? 'badge-secondary' : 'badge-primary'
const priorityClass = (value: ProjectPriorityLevel) => value === 'HIGH' ? 'badge-error' : value === 'LOW' ? 'badge-ghost' : 'badge-warning'
</script>
