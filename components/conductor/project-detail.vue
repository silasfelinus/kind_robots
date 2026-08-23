<template>
  <section class="flex min-h-0 flex-col gap-2 pb-2">
    <div
      class="kr-toolbar flex-wrap rounded-xl border border-base-300/70 bg-(--kr-surface-raised)/90 px-2.5 py-1.5"
    >
      <button
        type="button"
        class="btn btn-ghost btn-xs gap-0.5 rounded-lg px-1.5"
        @click="goBack"
      >
        <Icon name="kind-icon:chevron-left" class="size-3" />
        Back
      </button>
      <Icon name="kind-icon:folder" class="size-3.5 shrink-0 text-primary/70" />
      <span class="min-w-0 max-w-48 truncate text-xs font-bold sm:max-w-none">
        {{ linkedProject?.title || selectedProject?.name || props.slug }}
      </span>

      <template v-if="userStore.isAdmin && linkedProject">
        <span class="mx-0.5 h-3.5 w-px shrink-0 bg-base-content/10" />
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-xs"
          :class="linkedProject.isPublic ? 'text-success' : 'text-base-content/35'"
          :title="linkedProject.isPublic ? 'Public project' : 'Private project'"
          :aria-label="linkedProject.isPublic ? 'Make project private' : 'Make project public'"
          :disabled="projectSaving"
          @click="patchProject({ isPublic: !linkedProject.isPublic })"
        >
          <Icon
            :name="linkedProject.isPublic ? 'kind-icon:eye' : 'kind-icon:eye-off'"
            class="size-3.5"
          />
        </button>
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-xs"
          :class="linkedProject.isMature ? 'text-warning' : 'text-base-content/35'"
          :title="linkedProject.isMature ? 'Mature content' : 'Safe content'"
          :aria-label="linkedProject.isMature ? 'Mark project safe' : 'Mark project mature'"
          :disabled="projectSaving"
          @click="patchProject({ isMature: !linkedProject.isMature })"
        >
          <Icon name="kind-icon:warning" class="size-3.5" />
        </button>
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-xs"
          :class="linkedProject.allowReviews ? 'text-success' : 'text-base-content/35'"
          :title="linkedProject.allowReviews ? 'Reviews on' : 'Reviews off'"
          :aria-label="linkedProject.allowReviews ? 'Turn reviews off' : 'Turn reviews on'"
          :disabled="projectSaving"
          @click="patchProject({ allowReviews: !linkedProject.allowReviews })"
        >
          <Icon name="kind-icon:comment" class="size-3.5" />
        </button>
      </template>

      <div
        v-if="selectedProject"
        class="ml-auto flex min-w-40 flex-1 items-center justify-end gap-1 overflow-x-auto"
      >
        <progress
          class="progress progress-primary h-1.5 min-w-16 max-w-40 flex-1"
          :value="selectedProject.progress"
          max="100"
        />
        <span class="shrink-0 text-[0.65rem] font-bold text-base-content/65">
          {{ selectedProject.progress }}%
        </span>
        <span
          v-for="[status, count] in taskStatusSummary(selectedProject)"
          :key="status"
          class="badge badge-xs shrink-0 gap-0.5"
          :class="taskBadgeClass(status)"
          :title="`${count} ${status}`"
        >
          <Icon :name="taskIcon(status)" class="size-2.5" />
          {{ count }}
          <span class="hidden 2xl:inline">{{ statusLabel(status) }}</span>
        </span>
      </div>
      <div v-else class="flex-1" />

      <span
        v-if="projectSaving"
        class="loading loading-spinner loading-xs text-primary"
      />
      <span
        v-else-if="projectSaveMessage"
        class="hidden text-[0.62rem] font-semibold sm:inline"
        :class="projectSaveError ? 'text-error' : 'text-success'"
      >
        {{ projectSaveError ? 'save failed' : 'saved' }}
      </span>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-lg"
        :disabled="refreshing"
        title="Refresh project"
        @click="refreshProject"
      >
        <span v-if="refreshing" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-3.5" />
      </button>
    </div>

    <div
      v-if="linkedProject"
      class="project-detail-primary grid shrink-0 gap-2 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] xl:items-start"
    >
      <EntityArtManager
        class="project-art-compact min-w-0 !p-2"
        entity-type="project"
        :entity="linkedProject"
        :collection-slides="projectCollectionSlides"
        :slots="projectArtSlots"
      />

      <div class="flex min-w-0 flex-col gap-2">
        <section class="kr-panel-flat overflow-hidden" data-project-profile>
          <header class="flex items-center gap-2 border-b border-base-300/70 px-3 py-2">
            <Icon name="kind-icon:dream" class="size-4 text-primary" />
            <span class="text-xs font-bold uppercase tracking-wide text-base-content/60">
              Project Profile
            </span>
            <span class="ml-auto text-[0.65rem] text-base-content/35">saves on blur</span>
          </header>
          <div class="grid gap-2 p-3 sm:grid-cols-2">
            <div class="form-control min-w-0">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">Goal</span>
              </label>
              <textarea
                class="textarea textarea-bordered min-h-16 w-full rounded-xl text-sm leading-relaxed"
                rows="2"
                placeholder="What does 100% look like?"
                :value="linkedProject.goal ?? ''"
                :disabled="projectSaving"
                @blur="autosave('goal', $event)"
              />
            </div>
            <div class="form-control min-w-0">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">Description</span>
              </label>
              <textarea
                class="textarea textarea-bordered min-h-16 w-full rounded-xl text-sm leading-relaxed"
                rows="2"
                placeholder="What is this project?"
                :value="linkedProject.description ?? ''"
                :disabled="projectSaving"
                @blur="autosave('description', $event)"
              />
            </div>
            <div class="form-control min-w-0">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">Live URL</span>
              </label>
              <input
                type="url"
                class="input input-bordered input-sm w-full rounded-xl text-sm"
                placeholder="https://…"
                :value="linkedProject.liveUrl ?? ''"
                :disabled="projectSaving"
                @blur="autosave('liveUrl', $event)"
              />
            </div>
            <div class="form-control min-w-0">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">Repo URL</span>
              </label>
              <input
                type="url"
                class="input input-bordered input-sm w-full rounded-xl text-sm"
                placeholder="https://github.com/…"
                :value="linkedProject.repoUrl ?? ''"
                :disabled="projectSaving"
                @blur="autosave('repoUrl', $event)"
              />
            </div>
          </div>
        </section>

        <form
          class="kr-panel-flat flex flex-col gap-2 p-3"
          data-project-composer
          @submit.prevent="submitProjectTask"
        >
          <label class="min-w-0">
            <span class="mb-1 block text-[0.65rem] font-bold uppercase tracking-wide text-base-content/50">
              Add task / comment
            </span>
            <textarea
              v-model="projectTaskText"
              placeholder="Tell the project worker what you need…"
              class="textarea textarea-bordered min-h-16 w-full rounded-xl text-sm leading-relaxed"
              rows="2"
              :disabled="projectTaskSubmitting"
            />
          </label>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="projectTaskCategory"
              class="select select-bordered select-sm min-w-40 flex-1 rounded-xl"
              :disabled="projectTaskSubmitting"
            >
              <option value="AGENT">🤖 Agent / comment</option>
              <option value="HONEYDO">🍯 Honey Do</option>
            </select>
            <select
              v-model="projectTaskPriority"
              class="select select-bordered select-sm min-w-32 flex-1 rounded-xl"
              :disabled="projectTaskSubmitting"
            >
              <option value="HIGH">🔴 High</option>
              <option value="NORMAL">🟡 Normal</option>
              <option value="LOW">🟢 Low</option>
            </select>
            <button
              type="submit"
              class="btn btn-primary btn-sm rounded-xl"
              :disabled="!projectTaskText.trim() || projectTaskSubmitting"
            >
              <span
                v-if="projectTaskSubmitting"
                class="loading loading-spinner loading-xs"
              />
              Add
            </button>
          </div>
        </form>
      </div>
    </div>

    <details
      v-if="selectedProject?.tasks.length"
      open
      class="group kr-panel-flat shrink-0 overflow-hidden"
      data-project-roadmap
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 marker:content-none"
      >
        <Icon
          name="kind-icon:chevron-right"
          class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
        />
        <span class="text-xs font-bold uppercase tracking-wide text-base-content/60">
          Roadmap
        </span>
        <span class="badge badge-ghost badge-xs ml-auto">
          {{ selectedProject.tasks.length }} tasks
        </span>
      </summary>
      <div class="space-y-2 border-t border-base-300/70 p-3">
        <div
          v-for="task in activeTasks"
          :key="task.id"
          class="kr-panel-flat px-3 py-2.5"
        >
          <div class="flex items-start gap-2.5">
            <div
              class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border"
              :class="taskIconClass(task.status)"
            >
              <Icon :name="taskIcon(task.status)" class="size-3" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="break-words text-sm font-semibold leading-snug">
                {{ task.title }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-base-content/50">
                <span>{{ task.id }}</span>
                <span v-if="task.milestone">· {{ task.milestone }}</span>
                <span v-if="task.owner">· {{ task.owner }}</span>
                <span v-if="task.passes > 0" class="text-warning">· pass {{ task.passes }}/3</span>
                <span
                  v-if="task.stakes && task.stakes !== 'reversible'"
                  class="badge badge-xs"
                  :class="stakesBadgeClass(task.stakes)"
                >
                  {{ task.stakes }}
                </span>
                <span v-if="task.updated" class="ml-auto text-base-content/25">
                  {{ relativeTime(task.updated) }}
                </span>
              </div>
              <p
                v-if="task.note"
                class="mt-1.5 line-clamp-3 text-xs leading-relaxed text-base-content/50"
              >
                {{ task.note }}
              </p>
            </div>
            <span
              class="badge badge-sm shrink-0"
              :class="taskBadgeClass(task.status)"
            >
              {{ task.status }}
            </span>
          </div>
        </div>

        <details
          v-if="doneTasksByMilestone.length"
          class="group rounded-xl border border-base-300 bg-base-200/50"
        >
          <summary
            class="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-base-content/50 marker:content-none"
          >
            <Icon
              name="kind-icon:chevron-right"
              class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
            />
            Completed
            <span class="badge badge-success badge-xs ml-auto">{{ doneTaskCount }}</span>
          </summary>
          <div class="space-y-2 px-3 pb-3">
            <div v-for="group in doneTasksByMilestone" :key="group.id">
              <p class="mb-1 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40">
                {{ group.title }}
              </p>
              <div class="space-y-1">
                <div
                  v-for="task in group.tasks"
                  :key="task.id"
                  class="flex items-start gap-2 rounded-lg bg-base-100/60 px-2.5 py-2"
                >
                  <Icon name="kind-icon:check" class="mt-0.5 size-3.5 shrink-0 text-success/70" />
                  <div class="min-w-0 flex-1">
                    <p class="break-words text-xs font-medium leading-snug text-base-content/70">
                      {{ task.title }}
                    </p>
                    <span class="text-[0.65rem] text-base-content/40">{{ task.id }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </details>

    <details
      v-if="selectedProject?.milestones.length"
      class="group kr-panel-flat shrink-0 overflow-hidden"
      data-project-milestones
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 marker:content-none"
      >
        <Icon
          name="kind-icon:chevron-right"
          class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
        />
        <span class="text-xs font-bold uppercase tracking-wide text-base-content/60">
          Milestones
        </span>
        <span class="badge badge-ghost badge-xs ml-auto">
          {{ selectedProject.milestones.length }}
        </span>
      </summary>
      <div class="space-y-2 border-t border-base-300/70 p-3">
        <div
          v-for="milestone in selectedProject.milestones"
          :key="milestone.id"
          class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
        >
          <div
            class="flex size-6 shrink-0 items-center justify-center rounded-full border"
            :class="milestoneIconClass(milestone.status)"
          >
            <Icon :name="milestoneIcon(milestone.status)" class="size-3" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="break-words text-sm font-semibold leading-snug">
              {{ milestone.title }}
            </p>
            <p class="text-xs text-base-content/50">
              <span v-if="milestoneTaskCounts.get(milestone.id)?.total">
                {{ milestoneTaskCounts.get(milestone.id)?.done }}/{{
                  milestoneTaskCounts.get(milestone.id)?.total
                }} done
              </span>
              <span v-else>weight {{ milestone.weight }}</span>
            </p>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="milestoneBadgeClass(milestone.status)"
          >
            {{ milestone.status }}
          </span>
        </div>
      </div>
    </details>

    <details
      v-if="selectedProject?.notesFromSilas"
      class="group kr-panel-flat shrink-0 overflow-hidden"
      data-project-notes
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 marker:content-none"
      >
        <Icon
          name="kind-icon:chevron-right"
          class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
        />
        <Icon name="kind-icon:document" class="size-4 text-info" />
        <span class="text-xs font-bold uppercase tracking-wide text-base-content/60">
          Project Notes
        </span>
        <span class="ml-auto text-xs text-base-content/35">Conductor</span>
      </summary>
      <div
        class="whitespace-pre-wrap border-t border-base-300/70 px-4 py-3 text-sm leading-relaxed text-base-content/75"
      >
        {{ selectedProject.notesFromSilas }}
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EntityArtManager from '@/components/art/entity-art-manager.vue'
import type {
  ConductorProject,
  ConductorTask,
} from '@/server/api/conductor/projects.get'
import {
  useProjectStore,
  type ProjectPriorityLevel,
  type ProjectWithRelations,
} from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { usePageStore } from '@/stores/pageStore'
import { useTodoStore } from '@/stores/todoStore'
import type { TodoCategory } from '@/stores/todoStore'
import { useConductorStore } from '@/stores/conductorStore'
import { useCollectionStore } from '@/stores/collectionStore'

const props = defineProps<{ slug: string }>()

const projectStore = useProjectStore()
const userStore = useUserStore()
const pageStore = usePageStore()
const todoStore = useTodoStore()
const conductorStore = useConductorStore()
const collectionStore = useCollectionStore()

const refreshing = ref(false)
const projectSaving = ref(false)
const projectSaveMessage = ref('')
const projectSaveError = ref(false)
const projectTaskText = ref('')
const projectTaskCategory = ref<TodoCategory>('AGENT')
const projectTaskPriority = ref<ProjectPriorityLevel>('NORMAL')
const projectTaskSubmitting = ref(false)
let saveMessageTimer: ReturnType<typeof setTimeout> | null = null

const projectArtSlots = [
  { field: 'heroPath', label: 'Hero', aspect: '16 / 9', width: 1280, height: 720 },
  { field: 'cardPath', label: 'Card', aspect: '2 / 3', width: 512, height: 768 },
  { field: 'imagePath', label: 'Icon', aspect: '1 / 1', width: 256, height: 256 },
]

type ProjectPatch = {
  description?: string | null
  goal?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
  isPublic?: boolean
  isMature?: boolean
  allowReviews?: boolean
}

const linkedProject = computed(() => projectStore.projectForSlug(props.slug))

function projectRecordToConductor(project: ProjectWithRelations): ConductorProject {
  return {
    slug: project.conductorSlug || project.slug || props.slug,
    name: project.title,
    kind: 'project',
    milestones: [],
    tasks: [],
    progress: project.status === 'DONE' ? 100 : 0,
    imagePath: project.imagePath || '',
    cardPath: project.cardPath || '',
    heroPath: project.heroPath || '',
  }
}

const selectedProject = computed<ConductorProject | null>(() => {
  const projected = conductorStore.projects.find((project) => project.slug === props.slug)
  if (projected) return projected
  return linkedProject.value ? projectRecordToConductor(linkedProject.value) : null
})

const matchedProjectCollection = computed(() => {
  void collectionStore.collections
  return collectionStore.findCollectionBySlug?.(props.slug) ?? null
})

const projectCollectionSlides = computed(() => {
  if (!matchedProjectCollection.value) return []
  const images = collectionStore.getCollectionImages?.(matchedProjectCollection.value.id) ?? []
  return images
    .map((image, index) => ({
      src: image.imagePath || (image as { path?: string | null }).path || image.fileName || '',
      label: `Collection ${index + 1}`,
    }))
    .filter((slide) => Boolean(slide.src))
})

const activeTasks = computed(
  () => selectedProject.value?.tasks.filter((task) => task.status !== 'done') ?? [],
)

const doneTasksByMilestone = computed(() => {
  const project = selectedProject.value
  if (!project) return []

  const doneByMilestone = new Map<string, ConductorTask[]>()
  for (const task of project.tasks) {
    if (task.status !== 'done') continue
    const key = task.milestone || ''
    const bucket = doneByMilestone.get(key)
    if (bucket) bucket.push(task)
    else doneByMilestone.set(key, [task])
  }

  const groups: { id: string; title: string; tasks: ConductorTask[] }[] = []
  for (const milestone of project.milestones) {
    const tasks = doneByMilestone.get(milestone.id)
    if (tasks?.length) groups.push({ id: milestone.id, title: milestone.title, tasks })
    doneByMilestone.delete(milestone.id)
  }
  for (const [key, tasks] of doneByMilestone) {
    if (tasks.length) groups.push({ id: key || 'other', title: 'Other', tasks })
  }
  return groups
})

const doneTaskCount = computed(() =>
  doneTasksByMilestone.value.reduce((total, group) => total + group.tasks.length, 0),
)

const milestoneTaskCounts = computed(() => {
  const counts = new Map<string, { done: number; total: number }>()
  const project = selectedProject.value
  if (!project) return counts
  for (const task of project.tasks) {
    const key = task.milestone || ''
    const entry = counts.get(key) ?? { done: 0, total: 0 }
    entry.total += 1
    if (task.status === 'done') entry.done += 1
    counts.set(key, entry)
  }
  return counts
})

const statusOrder = ['done', 'review', 'claimed', 'ready', 'waiting', 'blocked', 'needs-human']

function taskStatusSummary(project: ConductorProject): [string, number][] {
  const counts: Record<string, number> = {}
  for (const task of project.tasks) counts[task.status] = (counts[task.status] ?? 0) + 1
  return Object.entries(counts).sort(([a], [b]) => {
    const ai = statusOrder.indexOf(a)
    const bi = statusOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

function statusLabel(status: string): string {
  return status === 'needs-human' ? 'needs human' : status
}

function taskBadgeClass(status: string): string {
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

function taskIcon(status: string): string {
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

function taskIconClass(status: string): string {
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

function stakesBadgeClass(stakes: string): string {
  if (stakes === 'irreversible') return 'badge-error'
  if (stakes === 'outward-facing') return 'badge-warning'
  if (stakes === 'needs-human') return 'badge-accent'
  return 'badge-ghost'
}

function milestoneIcon(status: string): string {
  if (status === 'done') return 'kind-icon:check'
  if (status === 'in-progress') return 'kind-icon:hammer'
  return 'kind-icon:clock'
}

function milestoneIconClass(status: string): string {
  if (status === 'done') return 'border-success/40 bg-success/10 text-success'
  if (status === 'in-progress') return 'border-warning/40 bg-warning/10 text-warning'
  return 'border-base-300 bg-base-200 text-base-content/40'
}

function milestoneBadgeClass(status: string): string {
  if (status === 'done') return 'badge-success'
  if (status === 'in-progress') return 'badge-warning'
  return 'badge-ghost'
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

function goBack() {
  pageStore.setWorkspaceCardKey('overview')
}

function showSaveMessage(message: string, isError = false) {
  projectSaveMessage.value = message
  projectSaveError.value = isError
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  saveMessageTimer = setTimeout(() => {
    projectSaveMessage.value = ''
  }, 3000)
}

async function patchProject(patch: ProjectPatch) {
  if (!linkedProject.value) return
  projectSaving.value = true
  projectSaveMessage.value = ''
  projectSaveError.value = false
  try {
    await projectStore.updateProject(linkedProject.value.id, patch)
    showSaveMessage('Saved')
  } catch (error) {
    showSaveMessage(error instanceof Error ? error.message : 'Save failed', true)
  } finally {
    projectSaving.value = false
  }
}

async function autosave(field: keyof ProjectPatch, event: FocusEvent) {
  if (!linkedProject.value) return
  const element = event.target as HTMLInputElement | HTMLTextAreaElement | null
  if (!element) return
  const value = element.value.trim() || null
  const current = (linkedProject.value[field as keyof typeof linkedProject.value] ?? null) as string | null
  if (value === current) return
  await patchProject({ [field]: value })
}

async function refreshProject() {
  refreshing.value = true
  try {
    await Promise.all([
      projectStore.fetchProjects({ includeInactive: true, includeMature: true }, true),
      conductorStore.fetchProjects(true),
      collectionStore.fetchCollections(),
    ])
    if (linkedProject.value?.id) await todoStore.fetchProjectTodos(linkedProject.value.id)
  } finally {
    refreshing.value = false
  }
}

async function submitProjectTask() {
  const raw = projectTaskText.value.trim()
  if (!raw || !linkedProject.value || !selectedProject.value) return

  projectTaskSubmitting.value = true
  try {
    const [firstLine = '', ...restLines] = raw.split('\n')
    const title = firstLine.slice(0, 160).trim()
    const overflow = firstLine.slice(160).trim()
    const userContext = [overflow, ...restLines]
      .filter((line) => line.trim().length > 0)
      .join('\n')
      .trim()
    const description =
      projectTaskCategory.value === 'AGENT'
        ? [`Project: ${selectedProject.value.slug}`, userContext].filter(Boolean).join('\n\n')
        : userContext || null

    const created = await todoStore.createTodo({
      title: title || raw.slice(0, 160),
      description,
      category: projectTaskCategory.value,
      priority: projectTaskPriority.value,
      projectId: linkedProject.value.id,
    })
    if (!created) return
    projectTaskText.value = ''
    projectTaskCategory.value = 'AGENT'
    projectTaskPriority.value = 'NORMAL'
  } finally {
    projectTaskSubmitting.value = false
  }
}

watch(
  linkedProject,
  async (project) => {
    if (project?.id) await todoStore.fetchProjectTodos(project.id)
  },
  { immediate: true },
)

watch(
  () => props.slug,
  async () => {
    await refreshProject()
  },
)

onMounted(async () => {
  await refreshProject()
})

onBeforeUnmount(() => {
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
})
</script>

<style scoped>
:deep(.project-art-compact header p),
:deep(.project-art-compact header .badge),
:deep(.project-art-compact .mt-2.flex.flex-wrap.justify-center) {
  display: none;
}

:deep(.project-art-compact:has(.group.relative.mt-3.min-h-40) .mt-3.grid.gap-3) {
  display: none;
}

:deep(.project-art-compact .mt-3.grid.gap-3) {
  margin-top: 0.5rem;
}

:deep(.project-art-compact .mt-3.grid.gap-3 > div) {
  height: 20vh;
  min-height: 8rem;
  max-height: 12rem;
  aspect-ratio: auto !important;
}

:deep(.project-art-compact .mt-3.grid.gap-3 aside) {
  display: none;
}

:deep(.project-art-compact .group.relative.mt-3.min-h-40) {
  height: 20vh;
  min-height: 8rem;
  max-height: 12rem;
  margin-top: 0.5rem;
}
</style>
