<!-- /components/pages/conductor-overview-gallery-page.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
  >
    <header
      class="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-base-300/70 bg-base-100/90 px-3 py-1.5"
    >
      <span class="flex items-center gap-1.5">
        <Icon
          name="kind-icon:gearhammer"
          class="size-3.5 shrink-0 text-primary/70"
        />
        <span class="text-xs font-semibold text-base-content/50">
          {{ userStore.isAdmin ? 'Conductor' : 'Projects' }}
        </span>
      </span>

      <template v-if="galleryItems.length">
        <span class="mx-0.5 h-3.5 w-px shrink-0 bg-base-content/10" />
        <span class="flex items-baseline gap-0.5">
          <span class="text-sm font-black leading-none text-primary">{{
            galleryItems.length
          }}</span>
          <span class="text-[0.62rem] font-semibold text-base-content/50">
            project{{ galleryItems.length === 1 ? '' : 's' }}
          </span>
        </span>
        <template v-if="humanQueueCount">
          <span class="text-[0.7rem] text-base-content/20">·</span>
          <span class="flex items-baseline gap-0.5">
            <span class="text-sm font-black leading-none text-accent">{{
              humanQueueCount
            }}</span>
            <span class="text-[0.62rem] font-semibold text-base-content/50"
              >need you</span
            >
          </span>
        </template>
        <template v-if="blockedQueueCount">
          <span class="text-[0.7rem] text-base-content/20">·</span>
          <span class="flex items-baseline gap-0.5">
            <span class="text-sm font-black leading-none text-error">{{
              blockedQueueCount
            }}</span>
            <span class="text-[0.62rem] font-semibold text-base-content/50"
              >blocked</span
            >
          </span>
        </template>
        <span class="hidden text-[0.7rem] text-base-content/20 sm:inline"
          >·</span
        >
        <span class="hidden items-baseline gap-0.5 sm:flex">
          <span class="text-sm font-black leading-none text-info"
            >{{ averageProgress }}%</span
          >
          <span class="text-[0.62rem] font-semibold text-base-content/50"
            >avg</span
          >
        </span>
      </template>

      <div class="flex-1" />

      <KaizenPopup />

      <div class="flex items-center gap-0.5">
        <button
          v-for="mode in galleryModeOptions"
          :key="mode.value"
          type="button"
          class="btn btn-xs rounded-md px-1.5"
          :class="modeButtonClass(mode.value)"
          :title="mode.label"
          @click="projectGalleryMode = mode.value"
        >
          {{ mode.abbr }}
        </button>
      </div>

      <button
        v-if="userStore.isAdmin"
        type="button"
        class="btn btn-ghost btn-xs gap-1 rounded-lg"
        @click="goToTasks"
      >
        <Icon name="kind-icon:check" class="size-3" />
        Tasks
        <span
          v-if="todoStore.openTodos.length"
          class="badge badge-warning badge-xs"
        >
          {{ todoStore.openTodos.length }}
        </span>
      </button>

      <button
        v-if="userStore.isAdmin && brainstormCount"
        type="button"
        class="btn btn-ghost btn-xs gap-1 rounded-lg"
        @click="goToBrainstorm"
      >
        <Icon name="kind-icon:sparkles" class="size-3" />
        <span class="hidden sm:inline">Brainstorm</span>
        <span class="badge badge-secondary badge-xs">{{
          brainstormCount
        }}</span>
      </button>

      <button
        v-if="userStore.isAdmin"
        type="button"
        class="btn btn-primary btn-xs gap-1 rounded-lg"
        @click="startProjectDream"
      >
        <Icon name="kind-icon:plus" class="size-3" />
        New
      </button>

      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-lg"
        :disabled="isLoading"
        @click="refreshGallery"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-3.5" />
      </button>
    </header>

    <main
      class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div
        v-if="isLoading && !galleryItems.length"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="h-72 animate-pulse rounded-2xl bg-base-200"
        />
      </div>

      <div
        v-else-if="errorMessage"
        class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-error/30 bg-error/10 p-6 text-center text-error"
      >
        <Icon name="kind-icon:warning" class="h-10 w-10" />
        <p class="max-w-xl font-bold">{{ errorMessage }}</p>

        <button
          type="button"
          class="btn btn-error btn-sm rounded-2xl"
          @click="refreshGallery"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Try again
        </button>
      </div>

      <div
        v-else-if="!galleryItems.length"
        class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
      >
        <Icon name="kind-icon:cards" class="h-12 w-12 text-primary/50" />
        <p class="text-lg font-black">No projects found.</p>
        <p class="max-w-lg text-sm text-base-content/55">
          Create a Project or sync the Conductor roadmap, then the gallery
          will show up with actual drip.
        </p>
      </div>

      <section
        v-else-if="projectGalleryMode === 'cards'"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      >
        <button
          v-for="item in galleryItems"
          :key="item.slug"
          type="button"
          class="group relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl"
          @click="openProject(item)"
        >
          <img
            :src="item.cardPath"
            :alt="item.title"
            class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div
            class="absolute inset-0 bg-linear-to-t from-base-300 via-base-300/40 to-transparent"
          />

          <div
            class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3"
          >
            <span
              class="badge badge-sm rounded-2xl font-black"
              :class="priorityBadgeClass(item.priority)"
            >
              {{ item.priority }}
            </span>

            <span
              v-if="item.blocked"
              class="badge badge-error badge-sm rounded-2xl"
            >
              {{ item.blocked }} blocked
            </span>
            <span
              v-else-if="item.needsHuman"
              class="badge badge-accent badge-sm rounded-2xl"
            >
              {{ item.needsHuman }} need you
            </span>
          </div>

          <div class="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4">
            <div class="flex items-end gap-3">
              <img
                :src="item.iconPath"
                alt=""
                class="h-12 w-12 shrink-0 rounded-2xl border border-base-100/30 object-cover shadow"
              />

              <div class="min-w-0">
                <p
                  class="line-clamp-2 text-2xl font-black leading-none text-base-content drop-shadow"
                >
                  {{ item.title }}
                </p>
                <p
                  class="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-base-content/70"
                >
                  {{ item.flavor }}
                </p>
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-content/10 bg-base-100/80 p-3 shadow-sm backdrop-blur"
            >
              <div
                class="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-base-content/45"
              >
                <span>{{ item.kindLabel }}</span>
                <span>{{ item.progress }}%</span>
              </div>

              <div
                class="mt-2 h-2 overflow-hidden rounded-full bg-base-content/15"
              >
                <div
                  class="h-full rounded-full transition-all"
                  :class="kindProgressClass(item.kind)"
                  :style="{ width: `${item.progress}%` }"
                />
              </div>
            </div>
          </div>
        </button>
      </section>

      <section
        v-else-if="projectGalleryMode === 'heroes'"
        class="grid gap-4 lg:grid-cols-2"
      >
        <button
          v-for="item in galleryItems"
          :key="item.slug"
          type="button"
          class="group relative min-h-72 overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          @click="openProject(item)"
        >
          <img
            :src="item.heroPath"
            :alt="item.title"
            class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div
            class="absolute inset-0 bg-linear-to-t from-base-300 via-base-300/45 to-transparent"
          />

          <div
            class="absolute inset-x-0 bottom-0 p-4 transition-all duration-300"
          >
            <div class="flex items-end gap-3">
              <img
                :src="item.iconPath"
                alt=""
                class="h-12 w-12 rounded-2xl border border-base-100/40 object-cover shadow"
              />

              <div class="min-w-0">
                <p
                  class="text-2xl font-black leading-tight text-base-content drop-shadow"
                >
                  {{ item.title }}
                </p>
                <p
                  class="line-clamp-2 text-sm font-semibold text-base-content/65"
                >
                  {{ item.flavor }}
                </p>
              </div>
            </div>

            <div
              class="mt-3 max-h-0 overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/85 opacity-0 shadow-sm backdrop-blur transition-all duration-300 group-hover:max-h-72 group-hover:p-3 group-hover:opacity-100 group-focus-visible:max-h-72 group-focus-visible:p-3 group-focus-visible:opacity-100"
            >
              <p
                class="line-clamp-4 text-sm font-semibold leading-relaxed text-base-content/75"
              >
                {{ item.details }}
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  class="badge badge-sm rounded-2xl"
                  :class="priorityBadgeClass(item.priority)"
                >
                  {{ item.priority }}
                </span>
                <span class="badge badge-info badge-sm rounded-2xl">
                  {{ item.progress }}% progress
                </span>
                <span
                  v-if="item.needsHuman"
                  class="badge badge-accent badge-sm rounded-2xl"
                >
                  {{ item.needsHuman }} human gate
                </span>
                <span
                  v-if="item.blocked"
                  class="badge badge-error badge-sm rounded-2xl"
                >
                  {{ item.blocked }} blocked
                </span>
                <span
                  v-if="item.liveUrl"
                  class="badge badge-outline badge-sm rounded-2xl"
                >
                  Live
                </span>
                <span
                  v-if="item.repoUrl"
                  class="badge badge-outline badge-sm rounded-2xl"
                >
                  Repo
                </span>
              </div>
            </div>
          </div>
        </button>
      </section>

      <section
        v-else-if="projectGalleryMode === 'icons'"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <button
          v-for="item in galleryItems"
          :key="item.slug"
          type="button"
          class="group flex h-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-base-100 hover:shadow-lg"
          @click="openProject(item)"
        >
          <div class="flex items-start gap-3">
            <img
              :src="item.iconPath"
              :alt="item.title"
              class="h-16 w-16 shrink-0 rounded-2xl border border-base-300 object-cover shadow-sm transition group-hover:scale-105"
            />

            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-lg font-black leading-tight">
                {{ item.title }}
              </p>
              <p
                class="mt-1 text-xs font-bold uppercase tracking-widest text-base-content/40"
              >
                {{ item.kindLabel }}
              </p>
            </div>
          </div>

          <p
            class="line-clamp-3 text-sm font-semibold leading-relaxed text-base-content/70"
          >
            {{ item.details }}
          </p>

          <div class="mt-auto flex flex-wrap gap-1.5">
            <span
              class="badge badge-sm rounded-2xl"
              :class="priorityBadgeClass(item.priority)"
            >
              {{ item.priority }}
            </span>
            <span class="badge badge-ghost badge-sm rounded-2xl">
              {{ item.status }}
            </span>
            <span
              v-if="item.totalTasks"
              class="badge badge-info badge-sm rounded-2xl"
            >
              {{ item.totalTasks }} tasks
            </span>
            <span
              v-if="item.needsHuman"
              class="badge badge-accent badge-sm rounded-2xl"
            >
              {{ item.needsHuman }} need you
            </span>
          </div>

          <div class="h-2 overflow-hidden rounded-full bg-base-content/10">
            <div
              class="h-full rounded-full transition-all"
              :class="kindProgressClass(item.kind)"
              :style="{ width: `${item.progress}%` }"
            />
          </div>
        </button>
      </section>

      <section v-else class="flex flex-col gap-3">
        <button
          v-for="item in galleryItems"
          :key="item.slug"
          type="button"
          class="group grid gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-base-100 hover:shadow-md md:grid-cols-[11rem_1fr_auto]"
          @click="openProject(item)"
        >
          <div
            class="relative min-h-36 overflow-hidden rounded-2xl bg-base-300 md:min-h-full"
          >
            <img
              :src="item.heroPath"
              :alt="item.title"
              class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div
              class="absolute inset-0 bg-linear-to-t from-base-300/80 to-transparent"
            />

            <img
              :src="item.iconPath"
              alt=""
              class="absolute bottom-3 left-3 h-12 w-12 rounded-2xl border border-base-100/30 object-cover shadow"
            />
          </div>

          <div class="min-w-0 py-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="badge badge-sm rounded-2xl"
                :class="priorityBadgeClass(item.priority)"
              >
                {{ item.priority }}
              </span>
              <span class="badge badge-ghost badge-sm rounded-2xl">
                {{ item.kindLabel }}
              </span>
              <span
                v-if="item.status"
                class="badge badge-outline badge-sm rounded-2xl"
              >
                {{ item.status }}
              </span>
            </div>

            <h2 class="mt-2 text-xl font-black leading-tight sm:text-2xl">
              {{ item.title }}
            </h2>
            <p class="mt-1 text-sm font-bold text-primary/80">
              {{ item.flavor }}
            </p>
            <p
              class="mt-2 line-clamp-3 text-sm leading-relaxed text-base-content/70"
            >
              {{ item.details }}
            </p>
            <p
              v-if="item.notes"
              class="mt-2 line-clamp-2 rounded-2xl border border-info/20 bg-info/5 px-3 py-2 text-xs font-semibold text-info/80"
            >
              {{ item.notes }}
            </p>
          </div>

          <aside
            class="flex flex-row flex-wrap items-end gap-2 md:w-36 md:flex-col md:flex-nowrap md:items-stretch"
          >
            <div
              class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"
            >
              <p class="text-2xl font-black text-primary">
                {{ item.progress }}%
              </p>
              <p
                class="text-xs font-black uppercase tracking-widest text-base-content/40"
              >
                progress
              </p>
            </div>

            <div class="grid flex-1 grid-cols-3 gap-2 text-center md:w-full">
              <div class="rounded-xl bg-base-100 p-2">
                <p class="font-black text-success">{{ item.done }}</p>
                <p class="text-[0.65rem] text-base-content/40">done</p>
              </div>
              <div class="rounded-xl bg-base-100 p-2">
                <p class="font-black text-accent">{{ item.needsHuman }}</p>
                <p class="text-[0.65rem] text-base-content/40">you</p>
              </div>
              <div class="rounded-xl bg-base-100 p-2">
                <p class="font-black text-error">{{ item.blocked }}</p>
                <p class="text-[0.65rem] text-base-content/40">block</p>
              </div>
            </div>
          </aside>
        </button>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ConductorProject } from '@/server/api/conductor/projects.get'
import { useConductorStore, type DreamPriority } from '@/stores/conductorStore'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useProjectStore, type ProjectWithRelations } from '@/stores/projectStore'
import { usePageStore } from '@/stores/pageStore'
import { useTodoStore } from '@/stores/todoStore'
import { useUserStore } from '@/stores/userStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import KaizenPopup from '@/components/pages/kaizen-popup.vue'

const CONDUCTOR_IMG_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

type GalleryMode = 'cards' | 'heroes' | 'icons' | 'list'

type GalleryOption = {
  value: GalleryMode
  label: string
  abbr: string
  icon: string
}

type ProjectGalleryItem = {
  slug: string
  title: string
  flavor: string
  details: string
  notes: string
  kind: string
  kindLabel: string
  status: string
  priority: DreamPriority
  progress: number
  blocked: number
  needsHuman: number
  ready: number
  review: number
  done: number
  totalTasks: number
  dreamId: number | null
  projectId: number | null
  iconPath: string
  cardPath: string
  heroPath: string
  liveUrl: string
  repoUrl: string
}

const galleryModeOptions: GalleryOption[] = [
  { value: 'cards', label: 'Cards', abbr: 'C', icon: 'kind-icon:cards' },
  { value: 'heroes', label: 'Heroes', abbr: 'H', icon: 'kind-icon:image' },
  { value: 'icons', label: 'Icons', abbr: 'I', icon: 'kind-icon:cards' },
  { value: 'list', label: 'List', abbr: 'L', icon: 'kind-icon:document' },
]

const conductorStore = useConductorStore()
const dreamStore = useDreamStore()
const projectStore = useProjectStore()
const pageStore = usePageStore()
const todoStore = useTodoStore()
const userStore = useUserStore()

const projectGalleryMode = ref<GalleryMode>('cards')

const isLoading = computed(
  () => conductorStore.pending || projectStore.loading || dreamStore.loading,
)
const errorMessage = computed(
  () => conductorStore.error || projectStore.error || dreamStore.error || '',
)
const brainstormCount = computed(
  () => conductorStore.pendingPitches.length + brainstormProjects.value.length,
)

const activeProjects = computed(() => {
  return conductorStore.projects.filter((project) => {
    const record = dbProjectForSlug(project.slug)
    const status = record?.status ?? projectDreamForSlug(project.slug)?.projectStatus
    return status !== 'BRAINSTORM' && status !== 'ARCHIVED'
  })
})

const brainstormProjects = computed(() => {
  return conductorStore.projects.filter((project) => {
    const record = dbProjectForSlug(project.slug)
    return (record?.status ?? projectDreamForSlug(project.slug)?.projectStatus) === 'BRAINSTORM'
  })
})

const sortedActiveProjects = computed(() => {
  const order: Record<DreamPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }

  return [...activeProjects.value].sort((a, b) => {
    const aPriority =
      (dbProjectForSlug(a.slug)?.priority as DreamPriority | undefined) ??
      conductorStore.getProjectPriority(projectDreamForSlug(a.slug)?.id)
    const bPriority =
      (dbProjectForSlug(b.slug)?.priority as DreamPriority | undefined) ??
      conductorStore.getProjectPriority(projectDreamForSlug(b.slug)?.id)

    return (order[aPriority] ?? 1) - (order[bPriority] ?? 1)
  })
})

const adminItems = computed<ProjectGalleryItem[]>(() => {
  const conductorItems = sortedActiveProjects.value.map((project) => itemFromProject(project))
  const conductorSlugs = new Set(conductorStore.projects.map((project) => project.slug))
  const databaseOnlyItems = projectStore.activeProjects.flatMap((project) =>
    project.slug && !conductorSlugs.has(project.slug) ? [itemFromProjectRecord(project)] : [],
  )
  return [...conductorItems, ...databaseOnlyItems]
})

const publicItems = computed<ProjectGalleryItem[]>(() => {
  return projectStore.publicProjects
    .flatMap((project) => (project.slug ? [itemFromProjectRecord(project)] : []))
    .sort((a, b) => a.title.localeCompare(b.title))
})

const galleryItems = computed(() => {
  return userStore.isAdmin ? adminItems.value : publicItems.value
})

const humanQueueCount = computed(() =>
  galleryItems.value.reduce((sum, item) => sum + item.needsHuman, 0),
)

const blockedQueueCount = computed(() =>
  galleryItems.value.reduce((sum, item) => sum + item.blocked, 0),
)

const averageProgress = computed(() => {
  if (!galleryItems.value.length) return 0

  const total = galleryItems.value.reduce((sum, item) => sum + item.progress, 0)
  return Math.round(total / galleryItems.value.length)
})

const workspaceCards = computed<BuilderCard[]>(() => {
  const cards: BuilderCard[] = [
    makeCard(
      'overview',
      'Overview',
      'kind-icon:gearhammer',
      '/images/projects/overview-card.webp',
    ),
  ]

  if (userStore.isAdmin) {
    cards.push(
      makeCard(
        'tasks',
        todoStore.openTodos.length
          ? `Tasks (${todoStore.openTodos.length})`
          : 'Tasks',
        'kind-icon:check',
        '/images/projects/tasks-card.webp',
      ),
    )

    if (brainstormCount.value) {
      cards.push(
        makeCard(
          'brainstorm',
          `Brainstorm (${brainstormCount.value})`,
          'kind-icon:sparkles',
          '/images/projects/brainstorm-card.webp',
        ),
      )
    }
  }

  for (const item of galleryItems.value) {
    cards.push(
      makeCard(item.slug, item.title, kindIcon(item.kind), item.cardPath),
    )
  }

  return cards
})

watch(
  workspaceCards,
  (cards) => {
    if (!cards.length) return

    pageStore.setCards(cards)
    if (!pageStore.workspaceCardKey) pageStore.setWorkspaceCardKey('overview')
  },
  { immediate: true },
)

watch(projectGalleryMode, (mode) => {
  if (!import.meta.client) return

  localStorage.setItem('conductor-gallery-mode', mode)
})

onMounted(async () => {
  if (import.meta.client) {
    const saved = localStorage.getItem(
      'conductor-gallery-mode',
    ) as GalleryMode | null
    if (saved && galleryModeOptions.some((mode) => mode.value === saved)) {
      projectGalleryMode.value = saved
    }
  }

  await ensureData()
})

async function ensureData(force = false) {
  const projectOptions = userStore.isAdmin
    ? { includeInactive: true, includeMature: true }
    : {}

  if (userStore.isAdmin) {
    await Promise.all([
      conductorStore.fetchProjects(force),
      projectStore.fetchProjects(projectOptions),
      dreamStore.fetchDreams({ dreamType: 'PROJECT' }),
      todoStore.hasLoaded ? todoStore.fetchTodos(force) : Promise.resolve(),
    ])
    return
  }

  await Promise.all([
    force || !projectStore.loaded
      ? projectStore.fetchProjects(projectOptions)
      : Promise.resolve(projectStore.projects),
    force || !dreamStore.hasLoaded
      ? dreamStore.fetchDreams({ dreamType: 'PROJECT' })
      : Promise.resolve(dreamStore.projectDreams),
  ])
}

async function refreshGallery() {
  await ensureData(true)
}

function makeCard(
  key: string,
  label: string,
  icon: string,
  deckImage?: string,
): BuilderCard {
  return {
    key,
    label,
    title: label,
    icon,
    tagline: '',
    narrative: '',
    restoresFields: [],
    steps: [],
    deckImage,
    payload: {},
  }
}

function projectDreamForSlug(slug: string) {
  return dreamStore.projectDreams.find((dream) => dream.slug === slug) ?? null
}

function dbProjectForSlug(slug: string) {
  return projectStore.projectForSlug(slug)
}

function itemFromProject(project: ConductorProject): ProjectGalleryItem {
  const record = dbProjectForSlug(project.slug)
  const dream = projectDreamForSlug(project.slug)
  const priority =
    (record?.priority as DreamPriority | undefined) ??
    conductorStore.getProjectPriority(dream?.id)
  const counts = taskCounts(project)
  const details =
    record?.description ||
    record?.goal ||
    dream?.description ||
    dream?.pitch ||
    project.notesFromSilas ||
    `${project.name || project.slug} has ${project.tasks.length} tracked tasks across ${project.milestones.length} milestones.`

  return {
    slug: project.slug,
    title: record?.title || project.name || getDreamTitle(dream) || project.slug,
    flavor:
      record?.flavorText ||
      dream?.flavorText ||
      project.notesFromSilas ||
      'Active Kind Robots project.',
    details,
    notes: project.notesFromSilas || '',
    kind: project.kind || 'project',
    kindLabel: formatKind(project.kind),
    status: record?.status || dream?.projectStatus || 'ACTIVE',
    priority,
    progress: Number.isFinite(project.progress) ? project.progress : 0,
    blocked: counts.blocked,
    needsHuman: counts.needsHuman,
    ready: counts.ready,
    review: counts.review,
    done: counts.done,
    totalTasks: project.tasks.length,
    dreamId: dream?.id ?? null,
    projectId: record?.id ?? null,
    iconPath:
      record?.imagePath ||
      dream?.imagePath ||
      project.imagePath ||
      `${CONDUCTOR_IMG_BASE}/${project.slug}-icon.webp`,
    cardPath:
      record?.cardPath ||
      dream?.cardPath ||
      project.cardPath ||
      `${CONDUCTOR_IMG_BASE}/${project.slug}-card.webp`,
    heroPath:
      record?.heroPath ||
      dream?.heroPath ||
      project.heroPath ||
      `${CONDUCTOR_IMG_BASE}/${project.slug}-hero.webp`,
    liveUrl: record?.liveUrl || dream?.liveUrl || '',
    repoUrl: record?.repoUrl || dream?.repoUrl || '',
  }
}

function itemFromProjectRecord(record: ProjectWithRelations): ProjectGalleryItem {
  const conductorProject = record.slug
    ? conductorStore.projects.find((project) => project.slug === record.slug)
    : null
  if (conductorProject) return itemFromProject(conductorProject)

  const dream = record.slug ? projectDreamForSlug(record.slug) : null
  return {
    slug: record.slug || `project-${record.id}`,
    title: record.title,
    flavor: record.flavorText || record.goal || 'Kind Robots project.',
    details:
      record.description ||
      record.goal ||
      'This project is waiting for a richer public description.',
    notes: '',
    kind: 'project',
    kindLabel: 'Project',
    status: record.status,
    priority: record.priority as DreamPriority,
    progress: record.status === 'DONE' ? 100 : 0,
    blocked: 0,
    needsHuman: 0,
    ready: 0,
    review: 0,
    done: record.status === 'DONE' ? 1 : 0,
    totalTasks: record._count?.Todos ?? 0,
    dreamId: dream?.id ?? null,
    projectId: record.id,
    iconPath:
      record.imagePath ||
      dream?.imagePath ||
      `${CONDUCTOR_IMG_BASE}/${record.slug}-icon.webp`,
    cardPath:
      record.cardPath ||
      dream?.cardPath ||
      `${CONDUCTOR_IMG_BASE}/${record.slug}-card.webp`,
    heroPath:
      record.heroPath ||
      dream?.heroPath ||
      `${CONDUCTOR_IMG_BASE}/${record.slug}-hero.webp`,
    liveUrl: record.liveUrl || dream?.liveUrl || '',
    repoUrl: record.repoUrl || dream?.repoUrl || '',
  }
}

function taskCounts(project: ConductorProject) {
  const counts = {
    blocked: 0,
    needsHuman: 0,
    ready: 0,
    review: 0,
    done: 0,
  }

  for (const task of project.tasks) {
    if (task.status === 'blocked') counts.blocked++
    if (task.status === 'needs-human') counts.needsHuman++
    if (task.status === 'ready') counts.ready++
    if (task.status === 'review') counts.review++
    if (task.status === 'done') counts.done++
  }

  return counts
}

async function openProject(item: ProjectGalleryItem) {
  if (item.projectId) await projectStore.fetchProject(item.projectId)
  if (item.dreamId) await dreamStore.selectDreamById(item.dreamId)

  if (userStore.isAdmin) {
    pageStore.setWorkspaceCardKey(item.slug)
    return
  }

  if (item.liveUrl && import.meta.client) {
    window.open(item.liveUrl, '_blank', 'noopener,noreferrer')
  }
}

async function startProjectDream() {
  if (!import.meta.client) return
  const title = window.prompt('Project title')?.trim()
  if (!title) return

  const project = await projectStore.createProject({
    title,
    isPublic: true,
    isActive: true,
    status: 'BRAINSTORM',
    designer: userStore.username || 'Kind Designer',
  })
  await projectStore.fetchProjects({ includeInactive: true, includeMature: true })
  pageStore.setWorkspaceCardKey(project.slug || 'overview')
}

function goToTasks() {
  pageStore.setWorkspaceCardKey('tasks')
}

function goToBrainstorm() {
  pageStore.setWorkspaceCardKey('brainstorm')
}

function modeButtonClass(mode: GalleryMode) {
  return projectGalleryMode.value === mode
    ? 'btn-primary text-white'
    : 'btn-ghost'
}

function priorityBadgeClass(priority: DreamPriority): string {
  if (priority === 'HIGH') return 'badge-error'
  if (priority === 'LOW') return 'badge-ghost'
  return 'badge-warning'
}

function kindIcon(kind: string) {
  if (kind === 'software') return 'kind-icon:code'
  if (kind === 'proposal') return 'kind-icon:sparkles'
  return 'kind-icon:document'
}

function kindProgressClass(kind: string) {
  if (kind === 'software') return 'bg-primary'
  if (kind === 'proposal') return 'bg-info'
  return 'bg-secondary'
}

function formatKind(kind: string) {
  return String(kind || 'project')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getDreamTitle(dream?: DreamWithRelations | null) {
  return dream?.title || dream?.slug || ''
}
</script>
