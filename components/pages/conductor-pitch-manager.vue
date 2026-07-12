<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-base-300/70 bg-gradient-to-br from-primary/5 via-base-200 to-secondary/10 shadow-xl"
  >
    <header class="shrink-0 border-b border-base-300/70 bg-base-100/85 p-4 backdrop-blur">
      <div class="flex flex-wrap items-start gap-3">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          @click="goBack"
        >
          <Icon name="kind-icon:chevron-left" class="size-4" />
          Projects
        </button>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="flex size-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
              <Icon name="kind-icon:sparkles" class="size-5" />
            </span>
            <div>
              <h2 class="text-xl font-black tracking-tight sm:text-2xl">
                Pitch Review
              </h2>
              <p class="text-xs font-medium text-base-content/50 sm:text-sm">
                Decisions stay visible. Duplicates stop cosplaying as new projects.
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span
            v-if="conductorStore.fetchedAt"
            class="hidden text-xs text-base-content/35 lg:inline"
          >
            Synced {{ fetchedLabel }}
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="size-4" />
            Refresh
          </button>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-for="tab in tabOptions"
          :key="tab.key"
          type="button"
          class="group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all"
          :class="tabClass(tab.key)"
          @click="activeTab = tab.key"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-xl"
            :class="tab.iconClass"
          >
            <Icon :name="tab.icon" class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-black uppercase tracking-wide">
              {{ tab.label }}
            </span>
            <span class="text-lg font-black leading-none">{{ tab.count }}</span>
          </span>
        </button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <label class="input input-bordered input-sm flex min-w-52 flex-1 items-center gap-2 rounded-2xl bg-base-100">
          <Icon name="kind-icon:search" class="size-4 text-base-content/35" />
          <input
            v-model="query"
            type="search"
            class="grow"
            placeholder="Search title, target, or idea..."
          />
        </label>

        <span
          v-if="activeTab === 'review' && likelyOverlapCount"
          class="badge badge-warning h-8 gap-1 rounded-2xl px-3"
        >
          <Icon name="kind-icon:warning" class="size-3.5" />
          {{ likelyOverlapCount }} overlap signal{{ likelyOverlapCount === 1 ? '' : 's' }}
        </span>
      </div>

      <div
        v-if="feedback"
        class="shrink-0 rounded-2xl border px-4 py-3 text-sm font-semibold"
        :class="feedbackError ? 'border-error/30 bg-error/10 text-error' : 'border-success/30 bg-success/10 text-success'"
      >
        {{ feedback }}
      </div>

      <div
        v-if="conductorStore.pitchUpdateError"
        class="shrink-0 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
      >
        {{ conductorStore.pitchUpdateError }}
      </div>

      <main class="min-h-0 flex-1 overflow-y-auto pr-1">
        <div
          v-if="isLoading && !conductorStore.pitches.length"
          class="grid gap-3 lg:grid-cols-2"
        >
          <div
            v-for="index in 4"
            :key="index"
            class="h-72 animate-pulse rounded-3xl border border-base-300 bg-base-100"
          />
        </div>

        <div
          v-else-if="visiblePitches.length"
          class="grid items-start gap-4 xl:grid-cols-2"
        >
          <article
            v-for="pitch in visiblePitches"
            :key="pitch.slug"
            class="group overflow-hidden rounded-3xl border bg-base-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            :class="pitchCardClass(pitch)"
          >
            <div class="flex items-start gap-3 border-b border-base-300/60 p-4">
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                :class="statusIconClass(pitch)"
              >
                <Icon :name="statusIcon(pitch)" class="size-5" />
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <h3 class="min-w-0 flex-1 text-lg font-black leading-tight">
                    {{ pitch.title }}
                  </h3>
                  <span
                    class="badge badge-sm shrink-0 rounded-2xl font-bold"
                    :class="statusBadgeClass(pitch)"
                  >
                    {{ statusLabel(pitch) }}
                  </span>
                </div>
                <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/45">
                  <span v-if="pitch.projectTarget" class="flex items-center gap-1">
                    <Icon name="kind-icon:folder" class="size-3" />
                    {{ pitch.projectTarget }}
                  </span>
                  <span v-if="pitch.date">{{ pitch.date }}</span>
                  <span v-if="pitch.effort" class="badge badge-ghost badge-xs rounded-xl">
                    {{ pitch.effort }} effort
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-4 p-4">
              <div>
                <p class="text-xs font-black uppercase tracking-widest text-base-content/35">
                  The idea
                </p>
                <p class="mt-1 text-sm leading-relaxed text-base-content/75">
                  {{ pitch.idea || 'No idea summary was parsed from this pitch.' }}
                </p>
              </div>

              <div v-if="pitch.whyDoIt">
                <p class="text-xs font-black uppercase tracking-widest text-base-content/35">
                  Why bother
                </p>
                <p class="mt-1 text-sm leading-relaxed text-base-content/60">
                  {{ pitch.whyDoIt }}
                </p>
              </div>

              <div
                v-if="overlapSignals(pitch).length"
                class="rounded-2xl border border-warning/30 bg-warning/8 p-3"
              >
                <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-warning">
                  <Icon name="kind-icon:warning" class="size-4" />
                  Existing-work check
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="signal in overlapSignals(pitch)"
                    :key="signal.key"
                    class="badge badge-warning badge-outline h-auto min-h-6 max-w-full whitespace-normal rounded-2xl px-2 py-1 text-left"
                    :title="signal.detail"
                  >
                    {{ signal.label }}
                  </span>
                </div>
                <p class="mt-2 text-xs leading-relaxed text-base-content/50">
                  This is a warning, not an automatic verdict. The useful increment may belong inside an existing roadmap instead of becoming another project.
                </p>
              </div>

              <div
                v-if="activeTab === 'review'"
                class="grid grid-cols-2 gap-2 border-t border-base-300/60 pt-3 sm:grid-cols-4"
              >
                <button
                  type="button"
                  class="btn btn-success btn-sm rounded-2xl"
                  :disabled="isUpdating(pitch.slug)"
                  @click="setStatus(pitch, 'approved')"
                >
                  <span v-if="isUpdating(pitch.slug)" class="loading loading-spinner loading-xs" />
                  <Icon v-else name="kind-icon:check" class="size-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  class="btn btn-error btn-outline btn-sm rounded-2xl"
                  :disabled="isUpdating(pitch.slug)"
                  @click="setStatus(pitch, 'rejected')"
                >
                  <Icon name="kind-icon:x" class="size-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  class="btn btn-warning btn-outline btn-sm rounded-2xl"
                  :disabled="isUpdating(pitch.slug)"
                  @click="setStatus(pitch, 'duplicate')"
                >
                  <Icon name="kind-icon:layers" class="size-3.5" />
                  Duplicate
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm rounded-2xl border border-base-300"
                  :disabled="isUpdating(pitch.slug)"
                  @click="setStatus(pitch, 'archived')"
                >
                  <Icon name="kind-icon:archive" class="size-3.5" />
                  Archive
                </button>
              </div>

              <div v-else class="flex flex-wrap justify-end gap-2 border-t border-base-300/60 pt-3">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm rounded-2xl"
                  :disabled="isUpdating(pitch.slug)"
                  @click="setStatus(pitch, 'awaiting-silas')"
                >
                  <Icon name="kind-icon:undo" class="size-3.5" />
                  Return to review
                </button>
                <button
                  v-if="activeTab !== 'archived'"
                  type="button"
                  class="btn btn-ghost btn-sm rounded-2xl border border-base-300"
                  :disabled="isUpdating(pitch.slug)"
                  @click="setStatus(pitch, 'archived')"
                >
                  <Icon name="kind-icon:archive" class="size-3.5" />
                  Archive
                </button>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-base-300 bg-base-100/70 p-8 text-center"
        >
          <span class="flex size-16 items-center justify-center rounded-3xl bg-success/10 text-success">
            <Icon :name="emptyIcon" class="size-8" />
          </span>
          <h3 class="mt-4 text-xl font-black">{{ emptyTitle }}</h3>
          <p class="mt-1 max-w-lg text-sm text-base-content/50">
            {{ emptyMessage }}
          </p>
          <button
            v-if="activeTab === 'review' && !query"
            type="button"
            class="btn btn-secondary btn-sm mt-4 rounded-2xl"
            :disabled="requestingPitches"
            @click="requestPitchRun"
          >
            <span v-if="requestingPitches" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:sparkles" class="size-4" />
            Queue a fresh pitch run
          </button>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ConductorPitch } from '@/server/api/conductor/projects.get'
import {
  normalizePitchStatus,
  pitchBucket,
  useConductorStore,
  type PitchBucket,
  type PitchStatus,
} from '@/stores/conductorStore'
import { usePageStore } from '@/stores/pageStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTodoStore } from '@/stores/todoStore'

interface ProjectSearchRecord {
  slug: string
  title: string
  text: string
}

interface OverlapSignal {
  key: string
  label: string
  detail: string
  score: number
}

const conductorStore = useConductorStore()
const pageStore = usePageStore()
const projectStore = useProjectStore()
const todoStore = useTodoStore()

const activeTab = ref<PitchBucket>('review')
const query = ref('')
const feedback = ref('')
const feedbackError = ref(false)
const requestingPitches = ref(false)

const stopWords = new Set([
  'about',
  'after',
  'again',
  'already',
  'also',
  'another',
  'because',
  'being',
  'build',
  'could',
  'from',
  'into',
  'kind',
  'make',
  'more',
  'project',
  'robots',
  'that',
  'their',
  'this',
  'using',
  'with',
])

const featureSignals = [
  {
    key: 'coloring-book-feature',
    label: 'Coloring Book project + product pipeline',
    detail: 'The coloring-book roadmap already covers generated line art, printable books, the app surface, storefront, and purchasable sets.',
    words: ['coloring', 'line-art', 'lineart', 'colouring', 'pdf-coloring'],
  },
  {
    key: 'conductor-health-feature',
    label: 'Conductor cockpit + status reporting',
    detail: 'Conductor already exposes projects, task state, human gates, status snapshots, PR triage, and mobile-client work.',
    words: ['conductor', 'agent-health', 'health-dashboard', 'task-dashboard', 'roadmap-dashboard'],
  },
  {
    key: 'subscription-feature',
    label: 'Subscriptions + Stripe + mana credits',
    detail: 'Kind Robots already has subscription UI, Stripe subscribe APIs, membership state, monthly mana, and credit-purchase work.',
    words: ['subscription', 'subscriptions', 'session-credits', 'stripe', 'patron', 'mana-credits'],
  },
]

const isLoading = computed(
  () => conductorStore.pending || projectStore.loading,
)

const tabOptions = computed(() => [
  {
    key: 'review' as const,
    label: 'Review',
    count: conductorStore.pendingPitches.length,
    icon: 'kind-icon:eye',
    iconClass: 'bg-warning/15 text-warning',
  },
  {
    key: 'approved' as const,
    label: 'Approved',
    count: conductorStore.approvedPitches.length,
    icon: 'kind-icon:check',
    iconClass: 'bg-success/15 text-success',
  },
  {
    key: 'rejected' as const,
    label: 'Rejected',
    count: conductorStore.rejectedPitches.length,
    icon: 'kind-icon:x',
    iconClass: 'bg-error/15 text-error',
  },
  {
    key: 'archived' as const,
    label: 'Archived',
    count: conductorStore.archivedPitches.length,
    icon: 'kind-icon:archive',
    iconClass: 'bg-base-300 text-base-content/50',
  },
])

const projectCatalog = computed<ProjectSearchRecord[]>(() => {
  const catalog = new Map<string, ProjectSearchRecord>()

  for (const project of conductorStore.projects) {
    catalog.set(project.slug, {
      slug: project.slug,
      title: project.name || project.slug,
      text: [
        project.slug,
        project.name,
        project.kind,
        project.notesFromSilas,
        ...project.milestones.map((milestone) => milestone.title),
        ...project.tasks.flatMap((task) => [task.title, task.note, task.stakes]),
      ]
        .filter(Boolean)
        .join(' '),
    })
  }

  for (const project of projectStore.projects) {
    const slug = project.conductorSlug || project.slug
    if (!slug) continue
    const existing = catalog.get(slug)
    catalog.set(slug, {
      slug,
      title: project.title || existing?.title || slug,
      text: [
        existing?.text,
        project.title,
        project.description,
        project.flavorText,
        project.pitch,
        project.goal,
      ]
        .filter(Boolean)
        .join(' '),
    })
  }

  return [...catalog.values()]
})

const pitchesForTab = computed(() =>
  conductorStore.pitches
    .filter(
      (pitch) =>
        pitchBucket(conductorStore.pitchStatus(pitch.slug)) === activeTab.value,
    )
    .sort((a, b) => {
      const dateOrder = (b.date || '').localeCompare(a.date || '')
      return dateOrder || a.title.localeCompare(b.title)
    }),
)

const visiblePitches = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return pitchesForTab.value
  return pitchesForTab.value.filter((pitch) =>
    [pitch.title, pitch.projectTarget, pitch.idea, pitch.whyDoIt, pitch.status]
      .join(' ')
      .toLowerCase()
      .includes(term),
  )
})

const likelyOverlapCount = computed(
  () =>
    conductorStore.pendingPitches.filter(
      (pitch) => overlapSignals(pitch).length > 0,
    ).length,
)

const fetchedLabel = computed(() => {
  if (!conductorStore.fetchedAt) return ''
  return new Date(conductorStore.fetchedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const emptyIcon = computed(() =>
  query.value ? 'kind-icon:search' : 'kind-icon:check-circle',
)
const emptyTitle = computed(() => {
  if (query.value) return 'No matching pitches'
  if (activeTab.value === 'review') return 'The review queue is clean'
  return `No ${activeTab.value} pitches yet`
})
const emptyMessage = computed(() => {
  if (query.value) return 'Try a broader search term or switch to another tab.'
  if (activeTab.value === 'review') {
    return 'Approved, rejected, and archived decisions stay in their own history tabs instead of haunting the active queue.'
  }
  return 'Pitch history will appear here as decisions are recorded in the Conductor repository.'
})

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !stopWords.has(token))
}

function overlapSignals(pitch: ConductorPitch): OverlapSignal[] {
  const pitchText = [pitch.title, pitch.projectTarget, pitch.idea, pitch.whyDoIt]
    .filter(Boolean)
    .join(' ')
  const pitchTokens = new Set(tokenize(pitchText))
  const titleTokens = new Set(tokenize(pitch.title))
  const normalizedText = pitchText.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const signals: OverlapSignal[] = []

  for (const project of projectCatalog.value) {
    const projectTokens = new Set(tokenize(project.text))
    let score = 0

    if (
      pitch.projectTarget === project.slug ||
      pitch.projectTarget === project.title
    ) {
      score += 12
    }
    if (normalizedText.includes(project.slug)) score += 8

    for (const token of titleTokens) {
      if (projectTokens.has(token)) score += 4
    }
    for (const token of pitchTokens) {
      if (projectTokens.has(token)) score += 1
    }

    if (score >= 7) {
      signals.push({
        key: `project-${project.slug}`,
        label: project.title,
        detail: `Likely overlap with the ${project.slug} project inventory.`,
        score,
      })
    }
  }

  for (const feature of featureSignals) {
    const matches = feature.words.filter((word) => normalizedText.includes(word))
    if (!matches.length) continue
    signals.push({
      key: feature.key,
      label: feature.label,
      detail: feature.detail,
      score: 20 + matches.length,
    })
  }

  return signals
    .sort((a, b) => b.score - a.score)
    .filter(
      (signal, index, all) =>
        all.findIndex((candidate) => candidate.label === signal.label) === index,
    )
    .slice(0, 4)
}

function tabClass(tab: PitchBucket): string {
  return activeTab.value === tab
    ? 'border-primary/40 bg-primary/10 shadow-sm'
    : 'border-base-300 bg-base-100/70 hover:border-primary/25 hover:bg-base-100'
}

function pitchStatus(pitch: ConductorPitch): PitchStatus {
  return conductorStore.pitchStatus(pitch.slug)
}

function statusLabel(pitch: ConductorPitch): string {
  const status = pitchStatus(pitch)
  if (status === 'awaiting-silas') return 'Needs review'
  if (status === 'superseded') return 'Superseded'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusIcon(pitch: ConductorPitch): string {
  const status = pitchStatus(pitch)
  if (status === 'approved') return 'kind-icon:check'
  if (status === 'rejected') return 'kind-icon:x'
  if (status === 'awaiting-silas') return 'kind-icon:eye'
  return 'kind-icon:archive'
}

function statusIconClass(pitch: ConductorPitch): string {
  const status = pitchStatus(pitch)
  if (status === 'approved') return 'bg-success/15 text-success'
  if (status === 'rejected') return 'bg-error/15 text-error'
  if (status === 'awaiting-silas') return 'bg-warning/15 text-warning'
  return 'bg-base-300 text-base-content/50'
}

function statusBadgeClass(pitch: ConductorPitch): string {
  const status = pitchStatus(pitch)
  if (status === 'approved') return 'badge-success'
  if (status === 'rejected') return 'badge-error'
  if (status === 'awaiting-silas') return 'badge-warning'
  if (status === 'duplicate' || status === 'superseded') return 'badge-info'
  return 'badge-ghost'
}

function pitchCardClass(pitch: ConductorPitch): string {
  const status = pitchStatus(pitch)
  if (status === 'approved') return 'border-success/35'
  if (status === 'rejected') return 'border-error/25'
  if (status === 'awaiting-silas') return 'border-warning/35'
  return 'border-base-300 opacity-90'
}

function isUpdating(slug: string): boolean {
  return conductorStore.updatingPitchSlugs.includes(slug)
}

async function setStatus(
  pitch: ConductorPitch,
  status: PitchStatus,
): Promise<void> {
  feedback.value = ''
  feedbackError.value = false
  const success = await conductorStore.updatePitchStatus(pitch.slug, status)
  feedbackError.value = !success
  feedback.value = success
    ? `${pitch.title} moved to ${pitchBucket(status)}.`
    : `Could not update ${pitch.title}.`
}

async function refresh(): Promise<void> {
  feedback.value = ''
  await Promise.all([
    conductorStore.fetchProjects(true),
    projectStore.fetchProjects({ includeInactive: true, includeMature: true }),
  ])
}

async function requestPitchRun(): Promise<void> {
  requestingPitches.value = true
  feedback.value = ''
  feedbackError.value = false
  try {
    const created = await todoStore.createTodo({
      title: 'Generate a deduplicated pitch cycle',
      description:
        'The pitch review queue is empty. Run the brainstorm cycle using the current project, feature, and archived-pitch dedup policy before proposing anything new.',
      priority: 'NORMAL',
      category: 'AGENT',
    })
    feedback.value = created
      ? 'Fresh pitch run queued with the new dedup rules.'
      : 'The pitch run could not be queued.'
    feedbackError.value = !created
  } catch (cause) {
    feedbackError.value = true
    feedback.value =
      cause instanceof Error ? cause.message : 'The pitch run could not be queued.'
  } finally {
    requestingPitches.value = false
  }
}

function goBack(): void {
  pageStore.setWorkspaceCardKey('overview')
}

onMounted(refresh)
</script>
