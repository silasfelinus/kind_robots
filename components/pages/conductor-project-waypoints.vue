<!-- /components/pages/conductor-project-waypoints.vue -->
<!-- Project roadmap "waypoints": lightweight ordered steps stored on
     Dream.waypoints as a pipe-delimited string. A "✓ " prefix marks a waypoint
     done ("hit"), a "~ " prefix marks it in progress; several waypoints can be
     worked on at once. Distinct from the Milestone model (user achievements)
     and conductor roadmap milestones. -->
<template>
  <div class="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4">
    <div
      v-if="projectLiveUrl"
      class="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center"
    >
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-primary/70">
          Project front end
        </p>
        <p class="mt-0.5 truncate text-sm text-base-content/60">
          Open {{ dreamTitle }} in its working interface.
        </p>
      </div>
      <NuxtLink
        v-if="internalProjectPath"
        :to="internalProjectPath"
        class="btn btn-primary btn-sm shrink-0 gap-1.5 rounded-xl"
      >
        <Icon name="kind-icon:external-link" class="size-3.5" />
        Open Project
      </NuxtLink>
      <a
        v-else
        :href="projectLiveUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-primary btn-sm shrink-0 gap-1.5 rounded-xl"
      >
        <Icon name="kind-icon:external-link" class="size-3.5" />
        Open Project
      </a>
    </div>

    <div
      v-else
      class="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 px-3 py-2.5"
    >
      <Icon name="kind-icon:warning" class="mt-0.5 size-4 shrink-0 text-warning" />
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wide text-warning/80">
          Front end not linked
        </p>
        <p class="mt-0.5 text-xs leading-relaxed text-base-content/50">
          Add a Live URL in Project Intent to connect this project to its Kind
          Robots page or external app.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Icon name="kind-icon:map" class="size-4 text-primary" />
      <h4
        class="text-xs font-bold uppercase tracking-wide text-base-content/60"
      >
        Waypoints
      </h4>
      <span
        v-if="waypointList.length"
        class="badge badge-ghost badge-sm font-semibold"
      >
        {{ doneCount }}/{{ waypointList.length }}
      </span>
      <span
        v-if="activeCount"
        class="badge badge-warning badge-sm font-semibold"
      >
        {{ activeCount }} in progress
      </span>
      <span class="ml-auto flex items-center gap-2">
        <span
          v-if="saving"
          class="loading loading-spinner loading-xs text-primary"
        />
        <button
          type="button"
          class="btn btn-secondary btn-xs gap-1 rounded-lg"
          :disabled="draftRequested || todoStore.loading"
          title="Ask the agent to draft a step-by-step roadmap for this project"
          @click="requestDraft"
        >
          <Icon name="kind-icon:sparkles" class="size-3" />
          {{ draftRequested ? 'Draft requested' : 'Draft with AI' }}
        </button>
      </span>
    </div>

    <div
      v-if="waypointList.length"
      class="flex h-1.5 overflow-hidden rounded-full bg-base-content/10"
    >
      <div
        class="h-full bg-primary transition-all"
        :style="{ width: `${donePct}%` }"
      />
      <div
        class="h-full bg-warning/60 transition-all"
        :style="{ width: `${activePct}%` }"
      />
    </div>

    <div v-if="waypointList.length" class="space-y-1.5">
      <div
        v-for="(waypoint, idx) in waypointList"
        :key="`${idx}-${waypoint.label}`"
        class="group flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors"
        :class="rowClass(waypoint, idx)"
      >
        <button
          type="button"
          class="shrink-0 transition-colors"
          :class="statusButtonClass(waypoint.status)"
          :disabled="saving"
          :title="statusButtonTitle(waypoint.status)"
          @click="cycleWaypoint(idx)"
        >
          <Icon :name="statusIcon(waypoint.status)" class="size-5" />
        </button>
        <span
          class="min-w-0 flex-1 text-sm leading-snug"
          :class="
            waypoint.status === 'done'
              ? 'text-base-content/40 line-through'
              : ''
          "
        >
          {{ waypoint.label }}
        </span>
        <span
          v-if="waypoint.status === 'active'"
          class="badge badge-warning badge-xs shrink-0"
          >in progress</span
        >
        <span
          v-else-if="waypoint.status === 'pending' && idx === nextWaypointIndex"
          class="badge badge-primary badge-xs shrink-0"
          >next up</span
        >
        <div
          class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <button
            type="button"
            class="btn btn-ghost btn-xs h-5 min-h-0 rounded px-1 opacity-60 hover:opacity-100 disabled:opacity-20"
            :disabled="idx === 0 || saving"
            @click="moveWaypoint(idx, -1)"
          >
            ▲
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs h-5 min-h-0 rounded px-1 opacity-60 hover:opacity-100 disabled:opacity-20"
            :disabled="idx === waypointList.length - 1 || saving"
            @click="moveWaypoint(idx, 1)"
          >
            ▼
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs h-5 min-h-0 rounded px-1 text-base-content/30 hover:text-error"
            :disabled="saving"
            title="Remove waypoint"
            @click="removeWaypoint(idx)"
          >
            <Icon name="kind-icon:x" class="size-3" />
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-xs text-base-content/40">
      No waypoints yet. Sketch the steps this project will take — or let the AI
      draft a roadmap for you.
    </p>

    <form class="flex gap-2" @submit.prevent="addWaypoint">
      <input
        v-model="newWaypointLabel"
        type="text"
        placeholder="Add a waypoint..."
        class="input input-bordered input-sm flex-1 rounded-xl text-sm"
        :disabled="saving"
      />
      <button
        type="submit"
        class="btn btn-outline btn-sm rounded-xl"
        :disabled="!newWaypointLabel.trim() || saving"
      >
        Add
      </button>
    </form>
    <p v-if="errorMessage" class="text-xs text-error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useTodoStore } from '@/stores/todoStore'

const props = defineProps<{
  dreamId: number
  dreamTitle: string
  waypoints: string | null | undefined
}>()

const dreamStore = useDreamStore()
const todoStore = useTodoStore()
const requestUrl = useRequestURL()

const DONE_PREFIX = '✓'
const ACTIVE_PREFIX = '~'

type WaypointStatus = 'pending' | 'active' | 'done'
type Waypoint = { label: string; status: WaypointStatus }

const saving = ref(false)
const errorMessage = ref('')
const newWaypointLabel = ref('')
const draftRequested = ref(false)

const projectDream = computed(
  () => dreamStore.projectDreams.find((dream) => dream.id === props.dreamId) ?? null,
)
const projectLiveUrl = computed(() => projectDream.value?.liveUrl?.trim() ?? '')
const internalProjectPath = computed(() => {
  const value = projectLiveUrl.value
  if (!value) return null
  if (value.startsWith('/')) return value

  try {
    const parsed = new URL(value)
    if (parsed.origin !== requestUrl.origin) return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
})

const waypointList = computed<Waypoint[]>(() => parseWaypoints(props.waypoints))

const doneCount = computed(
  () => waypointList.value.filter((w) => w.status === 'done').length,
)
const activeCount = computed(
  () => waypointList.value.filter((w) => w.status === 'active').length,
)

const donePct = computed(() =>
  waypointList.value.length
    ? Math.round((doneCount.value / waypointList.value.length) * 100)
    : 0,
)
const activePct = computed(() =>
  waypointList.value.length
    ? Math.round((activeCount.value / waypointList.value.length) * 100)
    : 0,
)

// First pending waypoint — the suggested next step when nothing else calls.
const nextWaypointIndex = computed(() =>
  waypointList.value.findIndex((w) => w.status === 'pending'),
)

function parseWaypoints(raw: string | null | undefined): Waypoint[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      if (entry.startsWith(DONE_PREFIX))
        return {
          label: entry.slice(DONE_PREFIX.length).trim(),
          status: 'done' as const,
        }
      if (entry.startsWith(ACTIVE_PREFIX))
        return {
          label: entry.slice(ACTIVE_PREFIX.length).trim(),
          status: 'active' as const,
        }
      return { label: entry, status: 'pending' as const }
    })
}

function serializeWaypoints(waypoints: Waypoint[]): string | null {
  if (!waypoints.length) return null
  return waypoints
    .map((w) => {
      if (w.status === 'done') return `${DONE_PREFIX} ${w.label}`
      if (w.status === 'active') return `${ACTIVE_PREFIX} ${w.label}`
      return w.label
    })
    .join(' | ')
}

function statusIcon(status: WaypointStatus): string {
  if (status === 'done') return 'kind-icon:check-circle'
  if (status === 'active') return 'kind-icon:hammer'
  return 'kind-icon:circle'
}

function statusButtonClass(status: WaypointStatus): string {
  if (status === 'done') return 'text-success'
  if (status === 'active') return 'text-warning'
  return 'text-base-content/30 hover:text-warning'
}

function statusButtonTitle(status: WaypointStatus): string {
  if (status === 'pending') return 'Start working on this waypoint'
  if (status === 'active') return 'Mark waypoint done'
  return 'Reset waypoint to pending'
}

function rowClass(waypoint: Waypoint, idx: number): string {
  if (waypoint.status === 'done') return 'border-success/20 bg-success/5'
  if (waypoint.status === 'active') return 'border-warning/40 bg-warning/5'
  if (idx === nextWaypointIndex.value) return 'border-primary/40 bg-primary/5'
  return 'border-base-300 bg-base-200'
}

async function saveWaypoints(waypoints: Waypoint[]) {
  saving.value = true
  errorMessage.value = ''
  const result = await dreamStore.updateDream(props.dreamId, {
    waypoints: serializeWaypoints(waypoints),
  })
  saving.value = false
  if (!result?.success) {
    errorMessage.value = result?.message || 'Failed to save waypoints.'
  }
}

async function addWaypoint() {
  const label = newWaypointLabel.value.trim().replace(/\|/g, '/')
  if (!label) return
  await saveWaypoints([...waypointList.value, { label, status: 'pending' }])
  newWaypointLabel.value = ''
}

// pending → active → done → pending. Any number of waypoints can be active
// at the same time — progress doesn't have to be linear.
async function cycleWaypoint(index: number) {
  const nextStatus: Record<WaypointStatus, WaypointStatus> = {
    pending: 'active',
    active: 'done',
    done: 'pending',
  }
  const waypoints = waypointList.value.map((w, i) =>
    i === index ? { ...w, status: nextStatus[w.status] } : w,
  )
  await saveWaypoints(waypoints)
}

async function removeWaypoint(index: number) {
  await saveWaypoints(waypointList.value.filter((_, i) => i !== index))
}

async function moveWaypoint(index: number, delta: -1 | 1) {
  const target = index + delta
  if (target < 0 || target >= waypointList.value.length) return
  const waypoints = [...waypointList.value]
  const moved = waypoints.splice(index, 1)[0]!
  waypoints.splice(target, 0, moved)
  await saveWaypoints(waypoints)
}

async function requestDraft() {
  draftRequested.value = true
  const created = await todoStore.createTodo({
    title: `Draft a roadmap for ${props.dreamTitle}`,
    description:
      `Propose a step-by-step roadmap for the "${props.dreamTitle}" project ` +
      `and save it to the project Dream's "waypoints" field as pipe-separated ` +
      `steps (e.g. "First step | Second step | Third step"). Prefix a step ` +
      `with "✓ " if it is already done or "~ " if it is in progress. Keep ` +
      `steps small and incremental (kaizen), ordered from next action to ` +
      `project completion. Do not overwrite existing waypoints — extend or ` +
      `refine them.`,
    priority: 'NORMAL',
    category: 'AGENT',
    dreamId: props.dreamId,
  })
  if (!created) draftRequested.value = false
}
</script>
