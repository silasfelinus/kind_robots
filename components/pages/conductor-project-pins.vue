<!-- /components/pages/conductor-project-pins.vue -->
<!-- Project roadmap "pins": lightweight ordered steps stored on Dream.pins as a
     pipe-delimited string. A "✓ " prefix marks a pin done. Distinct from the
     Milestone model (user achievements) and conductor roadmap milestones. -->
<template>
  <div class="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-wrap items-center gap-2">
      <Icon name="kind-icon:map" class="size-4 text-primary" />
      <h4
        class="text-xs font-bold uppercase tracking-wide text-base-content/60"
      >
        Roadmap
      </h4>
      <span
        v-if="pinList.length"
        class="badge badge-ghost badge-sm font-semibold"
      >
        {{ doneCount }}/{{ pinList.length }}
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
      v-if="pinList.length"
      class="h-1.5 overflow-hidden rounded-full bg-base-content/10"
    >
      <div
        class="h-full rounded-full bg-primary transition-all"
        :style="{ width: `${progressPct}%` }"
      />
    </div>

    <div v-if="pinList.length" class="space-y-1.5">
      <div
        v-for="(pin, idx) in pinList"
        :key="`${idx}-${pin.label}`"
        class="group flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors"
        :class="
          pin.done
            ? 'border-success/20 bg-success/5'
            : idx === nextPinIndex
              ? 'border-primary/40 bg-primary/5'
              : 'border-base-300 bg-base-200'
        "
      >
        <button
          type="button"
          class="shrink-0 transition-colors"
          :class="
            pin.done
              ? 'text-success'
              : 'text-base-content/30 hover:text-success'
          "
          :disabled="saving"
          :title="pin.done ? 'Mark not done' : 'Mark done'"
          @click="togglePin(idx)"
        >
          <Icon
            :name="pin.done ? 'kind-icon:check-circle' : 'kind-icon:circle'"
            class="size-5"
          />
        </button>
        <span
          class="min-w-0 flex-1 text-sm leading-snug"
          :class="pin.done ? 'text-base-content/40 line-through' : ''"
        >
          {{ pin.label }}
        </span>
        <span
          v-if="!pin.done && idx === nextPinIndex"
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
            @click="movePin(idx, -1)"
          >
            ▲
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs h-5 min-h-0 rounded px-1 opacity-60 hover:opacity-100 disabled:opacity-20"
            :disabled="idx === pinList.length - 1 || saving"
            @click="movePin(idx, 1)"
          >
            ▼
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs h-5 min-h-0 rounded px-1 text-base-content/30 hover:text-error"
            :disabled="saving"
            title="Remove step"
            @click="removePin(idx)"
          >
            <Icon name="kind-icon:x" class="size-3" />
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-xs text-base-content/40">
      No roadmap yet. Sketch the steps this project will take — or let the AI
      draft one for you.
    </p>

    <form class="flex gap-2" @submit.prevent="addPin">
      <input
        v-model="newPinLabel"
        type="text"
        placeholder="Add a roadmap step..."
        class="input input-bordered input-sm flex-1 rounded-xl text-sm"
        :disabled="saving"
      />
      <button
        type="submit"
        class="btn btn-outline btn-sm rounded-xl"
        :disabled="!newPinLabel.trim() || saving"
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
  pins: string | null | undefined
}>()

const dreamStore = useDreamStore()
const todoStore = useTodoStore()

const DONE_PREFIX = '✓'

type Pin = { label: string; done: boolean }

const saving = ref(false)
const errorMessage = ref('')
const newPinLabel = ref('')
const draftRequested = ref(false)

const pinList = computed<Pin[]>(() => parsePins(props.pins))

const doneCount = computed(() => pinList.value.filter((p) => p.done).length)

const progressPct = computed(() =>
  pinList.value.length
    ? Math.round((doneCount.value / pinList.value.length) * 100)
    : 0,
)

const nextPinIndex = computed(() => pinList.value.findIndex((pin) => !pin.done))

function parsePins(raw: string | null | undefined): Pin[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      entry.startsWith(DONE_PREFIX)
        ? { label: entry.slice(DONE_PREFIX.length).trim(), done: true }
        : { label: entry, done: false },
    )
}

function serializePins(pins: Pin[]): string | null {
  if (!pins.length) return null
  return pins
    .map((pin) => (pin.done ? `${DONE_PREFIX} ${pin.label}` : pin.label))
    .join(' | ')
}

async function savePins(pins: Pin[]) {
  saving.value = true
  errorMessage.value = ''
  const result = await dreamStore.updateDream(props.dreamId, {
    pins: serializePins(pins),
  })
  saving.value = false
  if (!result?.success) {
    errorMessage.value = result?.message || 'Failed to save roadmap.'
  }
}

async function addPin() {
  const label = newPinLabel.value.trim().replace(/\|/g, '/')
  if (!label) return
  await savePins([...pinList.value, { label, done: false }])
  newPinLabel.value = ''
}

async function togglePin(index: number) {
  const pins = pinList.value.map((pin, i) =>
    i === index ? { ...pin, done: !pin.done } : pin,
  )
  await savePins(pins)
}

async function removePin(index: number) {
  await savePins(pinList.value.filter((_, i) => i !== index))
}

async function movePin(index: number, delta: -1 | 1) {
  const target = index + delta
  if (target < 0 || target >= pinList.value.length) return
  const pins = [...pinList.value]
  const moved = pins.splice(index, 1)[0]!
  pins.splice(target, 0, moved)
  await savePins(pins)
}

async function requestDraft() {
  draftRequested.value = true
  const created = await todoStore.createTodo({
    title: `Draft a roadmap for ${props.dreamTitle}`,
    description:
      `Propose a step-by-step roadmap for the "${props.dreamTitle}" project ` +
      `and save it to the project Dream's "pins" field as pipe-separated steps ` +
      `(e.g. "First step | Second step | Third step"). Keep steps small and ` +
      `incremental (kaizen), ordered from next action to project completion. ` +
      `Do not overwrite existing pins — extend or refine them.`,
    priority: 'NORMAL',
    category: 'AGENT',
    dreamId: props.dreamId,
  })
  if (!created) draftRequested.value = false
}
</script>
