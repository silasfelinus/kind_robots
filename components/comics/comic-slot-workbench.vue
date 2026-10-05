<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <input
          v-model="draft.title"
          class="kr-input w-full font-bold"
          aria-label="Slot title"
        />
        <p class="kr-text-dim-xs mt-1">
          {{ attemptCount }} render{{ attemptCount === 1 ? '' : 's' }} ·
          {{ subject.kind }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="draft.aspect" class="kr-select-sm" aria-label="Aspect">
          <option v-for="aspect in aspects" :key="aspect" :value="aspect">
            {{ aspect }}
          </option>
        </select>
        <select
          v-model="draft.status"
          class="kr-select-sm"
          aria-label="Slot status"
        >
          <option value="open">Open</option>
          <option value="accepted">Accepted</option>
          <option value="final">Final</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>

    <div
      class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]"
    >
      <label class="flex flex-col gap-1">
        <span class="kr-text-dim-xs"
          >Prose prompt (Z-Image, Krea, nihilmania)</span
        >
        <textarea
          v-model="draft.promptProse"
          class="kr-textarea min-h-28 text-sm"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="kr-text-dim-xs">Tag prompt (Illustrious lanes)</span>
        <textarea
          v-model="draft.promptTags"
          class="kr-textarea min-h-28 text-sm"
        />
      </label>
    </div>
    <div
      v-if="!compact"
      class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]"
    >
      <label class="flex flex-col gap-1">
        <span class="kr-text-dim-xs">Negative prompt (SDXL family only)</span>
        <textarea
          v-model="draft.negativePrompt"
          class="kr-textarea min-h-16 text-sm"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="kr-text-dim-xs">Slot notes</span>
        <textarea v-model="draft.notes" class="kr-textarea min-h-16 text-sm" />
      </label>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-xs">
        <input
          v-model="draft.useSeriesStyle"
          type="checkbox"
          class="kr-checkbox-primary-sm"
        />
        Add the series style
      </label>
      <button
        type="button"
        class="kr-btn btn-outline btn-sm"
        :disabled="!dirty || studio.saving"
        @click="save"
      >
        Save prompt
      </button>
      <button
        v-if="studio.primaryLane"
        type="button"
        class="kr-btn btn-primary btn-sm"
        :disabled="busy"
        @click="renderLane(studio.primaryLane.key)"
      >
        <icon name="kind-icon:brush" class="kr-icon-4" />
        {{ dirty ? 'Save & render' : 'Render' }} in
        {{ studio.primaryLane.label }}
      </button>
      <button
        type="button"
        class="kr-btn btn-outline btn-sm"
        :disabled="busy"
        @click="renderAll"
      >
        <span v-if="busy" class="kr-spinner-xs" />
        <icon v-else name="kind-icon:sparkles" class="kr-icon-4" />
        {{ dirty ? 'Save & render' : 'Render' }} every active lane
      </button>
    </div>

    <div
      class="grid gap-2"
      :class="
        compact
          ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]'
          : 'grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]'
      "
    >
      <comic-lane-column
        v-for="lane in studio.activeLanes"
        :key="lane.key"
        :subject="subject"
        :lane="lane"
        :dirty="dirty"
        @render="renderLane"
      />
    </div>

    <section v-if="history.length" class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="kr-text-black-base">History</p>
        <select
          v-model="historyFilter"
          class="kr-select-sm"
          aria-label="History filter"
        >
          <option value="all">Every render</option>
          <option value="kept">Liked and final</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <div v-for="attempt in history" :key="attempt.id" class="w-28 shrink-0">
          <comic-attempt-tile :attempt="attempt" compact />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import type { ComicSlotDto } from '~/types/comicStudio'
import { COMIC_ASPECTS } from '~/utils/comicLanes'

const props = defineProps<{ subject: ComicSlotDto; compact?: boolean }>()
const studio = useComicStudioStore()
const aspects = COMIC_ASPECTS
const historyFilter = ref<'all' | 'kept' | 'rejected'>('all')

function fromSlot(slot: ComicSlotDto) {
  return {
    title: slot.title,
    aspect: slot.aspect,
    status: slot.status,
    promptProse: slot.promptProse ?? '',
    promptTags: slot.promptTags ?? '',
    negativePrompt: slot.negativePrompt ?? '',
    notes: slot.notes ?? '',
    useSeriesStyle: slot.useSeriesStyle,
  }
}

const draft = reactive(fromSlot(props.subject))
watch(
  () => props.subject,
  (slot) => Object.assign(draft, fromSlot(slot)),
)

const patch = computed(() => {
  const original = fromSlot(props.subject)
  const changes: Record<string, unknown> = {}
  for (const key of Object.keys(original) as Array<keyof typeof original>) {
    if (draft[key] !== original[key]) changes[key] = draft[key]
  }
  return changes
})
const dirty = computed(() => Object.keys(patch.value).length > 0)
const busy = computed(() => studio.renderingSlotIds.includes(props.subject.id))
const attempts = computed(() => studio.attemptsFor(props.subject.id))
const attemptCount = computed(() => attempts.value.length)
const history = computed(() =>
  attempts.value.filter((attempt) => {
    if (historyFilter.value === 'kept')
      return attempt.verdict === 'liked' || attempt.verdict === 'selected'
    if (historyFilter.value === 'rejected')
      return attempt.verdict === 'rejected'
    return true
  }),
)

function save() {
  if (dirty.value) void studio.saveSlot(props.subject.id, patch.value)
}

function renderLane(laneKey: string) {
  void studio.renderSlot(
    props.subject.id,
    [laneKey],
    dirty.value ? patch.value : undefined,
  )
}

function renderAll() {
  void studio.renderSlot(
    props.subject.id,
    studio.activeLanes.map((lane) => lane.key),
    dirty.value ? patch.value : undefined,
  )
}
</script>
