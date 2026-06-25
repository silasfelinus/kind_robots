<!-- /components/pages/workspace-page.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <!-- Header -->
    <header v-if="showHeader" class="flex shrink-0 items-center gap-2">
      <Icon name="kind-icon:gearhammer" class="size-5 text-primary" />
      <h2 class="text-lg font-semibold">Conductor Workspace</h2>
      <span class="badge badge-primary badge-sm ml-1">ADMIN</span>
      <div class="ml-auto flex items-center gap-2">
        <span v-if="data?.fetchedAt" class="text-xs text-base-content/50">
          Updated {{ fetchedLabel }}
        </span>
        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="pending"
          @click="refresh()"
        >
          <span v-if="pending" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
          Refresh
        </button>
      </div>
    </header>

    <!-- Error state -->
    <div
      v-if="error"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
    >
      <Icon name="kind-icon:warning" class="mr-1 inline size-4" />
      {{ error.message }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="pending && !data" class="flex shrink-0 gap-3">
      <div
        v-for="n in 4"
        :key="n"
        class="h-40 flex-1 animate-pulse rounded-2xl border border-base-300 bg-base-200"
      />
    </div>

    <!-- Stats bar -->
    <div v-if="data" class="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
        <p class="text-2xl font-black text-primary">{{ data.projects.length }}</p>
        <p class="text-xs font-semibold text-base-content/60">Projects</p>
      </div>
      <div class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
        <p class="text-2xl font-black text-success">{{ totalDone }}</p>
        <p class="text-xs font-semibold text-base-content/60">Tasks Done</p>
      </div>
      <div class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3">
        <p class="text-2xl font-black text-warning">{{ totalNeedsHuman }}</p>
        <p class="text-xs font-semibold text-base-content/60">Needs You</p>
      </div>
      <div
        class="cursor-pointer rounded-2xl border px-4 py-3 transition-colors"
        :class="
          showPitches
            ? 'border-warning/60 bg-warning/10'
            : 'border-base-300 bg-base-200 hover:border-warning/40'
        "
        @click="showPitches = !showPitches"
      >
        <p class="text-2xl font-black text-warning">{{ pendingPitches.length }}</p>
        <p class="text-xs font-semibold text-base-content/60">
          Pitches Pending
          <Icon
            name="kind-icon:chevron-down"
            class="ml-0.5 inline size-3 transition-transform"
            :class="showPitches ? 'rotate-180' : ''"
          />
        </p>
      </div>
    </div>

    <!-- Pitches panel (collapsible) -->
    <Transition name="slide-down">
      <div v-if="data && showPitches && pendingPitches.length" class="shrink-0 space-y-2">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/50">
          Pitches Awaiting Your Vote
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="pitch in pendingPitches"
            :key="pitch.slug"
            class="rounded-2xl border border-warning/40 bg-warning/5 p-4 transition-shadow hover:shadow-md"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <h4 class="font-bold leading-tight text-base-content">{{ pitch.title }}</h4>
              <span class="badge badge-warning badge-sm shrink-0">vote</span>
            </div>
            <p v-if="pitch.projectTarget" class="mb-2 text-xs text-base-content/50">
              <Icon name="kind-icon:folder" class="mr-0.5 inline size-3" />
              {{ pitch.projectTarget }}
              <span v-if="pitch.date" class="ml-2">· {{ pitch.date }}</span>
            </p>
            <p v-if="pitch.idea" class="line-clamp-3 text-sm text-base-content/75">
              {{ pitch.idea }}
            </p>
          </article>
        </div>
      </div>
    </Transition>

    <!-- Main content area -->
    <div v-if="data" class="flex min-h-0 flex-1 gap-4 overflow-hidden">
      <!-- Projects grid -->
      <div
        class="min-w-0 overflow-y-auto"
        :class="selectedProject ? 'hidden w-0 sm:block sm:w-80 sm:shrink-0' : 'flex-1'"
      >
        <div
          class="grid gap-3 pb-4"
          :class="selectedProject ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'"
        >
          <article
            v-for="project in data.projects"
            :key="project.slug"
            class="group cursor-pointer rounded-2xl border bg-base-200 p-4 transition-all hover:shadow-md"
            :class="
              selectedProject?.slug === project.slug
                ? 'border-primary bg-primary/5'
                : 'border-base-300 hover:border-base-content/20'
            "
            @click="toggleProject(project)"
          >
            <div class="mb-3 flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                :class="kindIconClass(project.kind)"
              >
                <Icon :name="kindIcon(project.kind)" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="truncate font-black leading-tight text-base-content">
                  {{ project.name || project.slug }}
                </h3>
                <div class="mt-1 flex flex-wrap gap-1">
                  <span class="badge badge-sm" :class="kindBadgeClass(project.kind)">
                    {{ project.kind }}
                  </span>
                  <span v-if="blockedCount(project) > 0" class="badge badge-error badge-sm">
                    {{ blockedCount(project) }} blocked
                  </span>
                  <span v-if="needsHumanCount(project) > 0" class="badge badge-accent badge-sm">
                    {{ needsHumanCount(project) }} needs you
                  </span>
                </div>
              </div>
              <Icon
                name="kind-icon:chevron-right"
                class="size-4 shrink-0 text-base-content/30 transition-transform"
                :class="selectedProject?.slug === project.slug ? 'rotate-90' : ''"
              />
            </div>

            <!-- Progress bar -->
            <div class="mb-3">
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="font-semibold text-base-content/60">Progress</span>
                <span class="font-bold text-base-content">{{ project.progress }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-base-300">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-500"
                  :style="{ width: `${project.progress}%` }"
                />
              </div>
            </div>

            <!-- Task status mini-chips -->
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="[status, count] in taskStatusSummary(project)"
                :key="status"
                class="badge badge-sm gap-0.5"
                :class="taskBadgeClass(status)"
              >
                {{ count }} {{ status }}
              </span>
            </div>
          </article>
        </div>
      </div>

      <!-- Detail panel -->
      <div
        v-if="selectedProject"
        class="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        <div class="flex shrink-0 items-center gap-2">
          <button
            class="btn btn-ghost btn-sm rounded-xl sm:hidden"
            type="button"
            @click="selectedProject = null"
          >
            <Icon name="kind-icon:arrow-left" class="size-4" />
            Back
          </button>
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border"
            :class="kindIconClass(selectedProject.kind)"
          >
            <Icon :name="kindIcon(selectedProject.kind)" class="size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-lg font-black">
              {{ selectedProject.name || selectedProject.slug }}
            </h3>
          </div>
          <span class="badge badge-sm shrink-0" :class="kindBadgeClass(selectedProject.kind)">
            {{ selectedProject.kind }}
          </span>
          <button
            class="btn btn-ghost btn-sm hidden rounded-xl sm:flex"
            type="button"
            @click="selectedProject = null"
          >
            <Icon name="kind-icon:x" class="size-4" />
          </button>
        </div>

        <!-- Notes from Silas -->
        <div
          v-if="selectedProject.notesFromSilas"
          class="shrink-0 rounded-2xl border border-info/30 bg-info/5 p-4 text-sm text-base-content/80"
        >
          <p class="mb-1 text-xs font-bold uppercase tracking-wide text-info/70">
            Notes from Silas
          </p>
          {{ selectedProject.notesFromSilas }}
        </div>

        <!-- Milestones -->
        <div v-if="selectedProject.milestones.length" class="shrink-0">
          <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
            Milestones
          </h4>
          <div class="space-y-2">
            <div
              v-for="m in selectedProject.milestones"
              :key="m.id"
              class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                :class="milestoneIconClass(m.status)"
              >
                <Icon :name="milestoneIcon(m.status)" class="size-3.5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ m.title }}</p>
                <p class="text-xs text-base-content/50">weight {{ m.weight }}</p>
              </div>
              <span class="badge badge-sm shrink-0" :class="milestoneBadgeClass(m.status)">
                {{ m.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tasks -->
        <div v-if="selectedProject.tasks.length">
          <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
            Tasks ({{ selectedProject.tasks.length }})
          </h4>
          <div class="space-y-2 pb-4">
            <div
              v-for="task in selectedProject.tasks"
              :key="task.id"
              class="rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                  :class="taskIconClass(task.status)"
                >
                  <Icon :name="taskIcon(task.status)" class="size-3" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold leading-snug">{{ task.title }}</p>
                  <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-base-content/50">
                    <span>{{ task.id }}</span>
                    <span v-if="task.milestone">· {{ task.milestone }}</span>
                    <span v-if="task.gateHuman" class="text-accent">· gate</span>
                    <span v-if="task.owner">· {{ task.owner }}</span>
                    <span v-if="task.passes > 0" class="text-warning">· pass {{ task.passes }}/3</span>
                  </div>
                </div>
                <span class="badge badge-sm shrink-0" :class="taskBadgeClass(task.status)">
                  {{ task.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!pending && data && !data.projects.length"
      class="flex flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
    >
      <div class="text-center">
        <Icon name="kind-icon:gearhammer" class="mx-auto mb-2 size-8 opacity-40" />
        <p class="text-sm text-base-content/50">No projects found in Conductor.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ConductorProject, ConductorData } from '@/server/api/conductor/projects.get'

withDefaults(
  defineProps<{
    showHeader?: boolean
  }>(),
  { showHeader: true },
)

const { data, pending, error, refresh } = await useFetch<ConductorData>('/api/conductor/projects', {
  lazy: true,
})

const selectedProject = ref<ConductorProject | null>(null)
const showPitches = ref(true)

const fetchedLabel = computed(() => {
  if (!data.value?.fetchedAt) return ''
  return new Date(data.value.fetchedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const pendingPitches = computed(
  () => data.value?.pitches.filter((p) => p.status.includes('awaiting')) ?? [],
)

const totalDone = computed(
  () =>
    data.value?.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length,
      0,
    ) ?? 0,
)

const totalNeedsHuman = computed(
  () =>
    data.value?.projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.status === 'needs-human').length,
      0,
    ) ?? 0,
)

function toggleProject(project: ConductorProject) {
  selectedProject.value = selectedProject.value?.slug === project.slug ? null : project
}

function blockedCount(p: ConductorProject) {
  return p.tasks.filter((t) => t.status === 'blocked').length
}

function needsHumanCount(p: ConductorProject) {
  return p.tasks.filter((t) => t.status === 'needs-human').length
}

const STATUS_ORDER = ['done', 'review', 'claimed', 'ready', 'waiting', 'blocked', 'needs-human']

function taskStatusSummary(p: ConductorProject): [string, number][] {
  const counts: Record<string, number> = {}
  for (const t of p.tasks) counts[t.status] = (counts[t.status] ?? 0) + 1
  return Object.entries(counts).sort(([a], [b]) => {
    const ai = STATUS_ORDER.indexOf(a)
    const bi = STATUS_ORDER.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

function kindIcon(kind: string) {
  return kind === 'software'
    ? 'kind-icon:code'
    : kind === 'proposal'
      ? 'kind-icon:sparkles'
      : 'kind-icon:document'
}

function kindIconClass(kind: string) {
  return kind === 'software'
    ? 'border-primary/40 bg-primary/10 text-primary'
    : kind === 'proposal'
      ? 'border-info/40 bg-info/10 text-info'
      : 'border-secondary/40 bg-secondary/10 text-secondary'
}

function kindBadgeClass(kind: string) {
  return kind === 'software'
    ? 'badge-primary'
    : kind === 'proposal'
      ? 'badge-info'
      : 'badge-secondary'
}

function taskBadgeClass(status: string) {
  const map: Record<string, string> = {
    done: 'badge-success',
    review: 'badge-secondary',
    claimed: 'badge-warning',
    ready: 'badge-info',
    waiting: 'badge-ghost',
    blocked: 'badge-error',
    'needs-human': 'badge-accent',
  }
  return map[status] ?? 'badge-ghost'
}

function taskIcon(status: string) {
  const map: Record<string, string> = {
    done: 'kind-icon:check',
    review: 'kind-icon:eye',
    claimed: 'kind-icon:hammer',
    ready: 'kind-icon:arrow-right',
    waiting: 'kind-icon:clock',
    blocked: 'kind-icon:warning',
    'needs-human': 'kind-icon:user',
  }
  return map[status] ?? 'kind-icon:sparkles'
}

function taskIconClass(status: string) {
  const map: Record<string, string> = {
    done: 'border-success/40 bg-success/10 text-success',
    review: 'border-secondary/40 bg-secondary/10 text-secondary',
    claimed: 'border-warning/40 bg-warning/10 text-warning',
    ready: 'border-info/40 bg-info/10 text-info',
    waiting: 'border-base-300 bg-base-200 text-base-content/40',
    blocked: 'border-error/40 bg-error/10 text-error',
    'needs-human': 'border-accent/40 bg-accent/10 text-accent',
  }
  return map[status] ?? 'border-base-300 bg-base-200 text-base-content/40'
}

function milestoneIcon(status: string) {
  return status === 'done'
    ? 'kind-icon:check'
    : status === 'in-progress'
      ? 'kind-icon:hammer'
      : 'kind-icon:clock'
}

function milestoneIconClass(status: string) {
  return status === 'done'
    ? 'border-success/40 bg-success/10 text-success'
    : status === 'in-progress'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-base-300 bg-base-200 text-base-content/40'
}

function milestoneBadgeClass(status: string) {
  return status === 'done'
    ? 'badge-success'
    : status === 'in-progress'
      ? 'badge-warning'
      : 'badge-ghost'
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 2000px;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
