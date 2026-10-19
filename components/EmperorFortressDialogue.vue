<template>
  <section
    class="overflow-hidden rounded-2xl border border-warning/30 bg-base-100 shadow-lg"
    :aria-label="'Audience with ' + speaker"
  >
    <div
      class="flex items-center justify-between gap-2 border-b border-base-content/10 bg-base-200 px-3 py-2"
    >
      <strong class="font-serif text-lg">{{ speaker }}</strong>
      <div class="flex items-center gap-1">
        <label class="sr-only" for="emperor-text-speed">Text speed</label>
        <select
          id="emperor-text-speed"
          class="select select-bordered select-xs"
          :value="court.textSpeed"
          @change="
            court.setTextSpeed(
              ($event.target as HTMLSelectElement).value as TextSpeed,
            )
          "
        >
          <option value="normal">Normal text</option>
          <option value="fast">Fast text</option>
          <option value="instant">Instant text</option>
        </select>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          :aria-expanded="showLog"
          @click="showLog = !showLog"
        >
          Log
        </button>
      </div>
    </div>

    <img
      v-if="art"
      :src="art"
      :alt="speaker"
      class="mx-auto block max-h-80 w-auto bg-base-200 object-contain"
    />
    <div v-if="showLog" class="max-h-48 space-y-2 overflow-y-auto p-3 text-sm">
      <p
        v-for="(entry, i) in lines.slice(0, index + 1)"
        :key="i"
        class="opacity-80"
      >
        {{ entry }}
      </p>
    </div>
    <button
      v-else
      type="button"
      class="block min-h-28 w-full p-4 text-left font-serif text-base italic sm:text-lg"
      :aria-label="streaming ? 'Show the whole line' : 'Next line'"
      @click="advance"
    >
      <span aria-live="polite">{{ shown }}</span>
      <span
        v-if="!streaming && !lastLine"
        class="ml-2 text-warning"
        aria-hidden="true"
        >▸</span
      >
    </button>

    <div
      v-if="!streaming && lastLine && choices.length"
      class="grid gap-2 border-t border-base-content/10 p-3"
    >
      <button
        v-for="choice in choices"
        :key="choice.id"
        type="button"
        class="rounded-xl border px-3 py-2 text-left text-sm transition-colors"
        :class="
          choice.blockers.length
            ? 'cursor-not-allowed border-base-content/10 opacity-55'
            : 'border-warning/40 bg-base-200 hover:bg-warning/15'
        "
        :disabled="choice.blockers.length > 0"
        @click="emit('choose', choice.id)"
      >
        <strong class="block">{{ choice.label }}</strong>
        <span v-if="choice.note" class="block text-xs text-warning">{{
          choice.note
        }}</span>
        <span v-if="choice.blockers.length" class="block text-xs">
          {{ choice.blockers.join(' · ') }}
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import type { TextSpeed } from '~/stores/emperorFortressStore'

const props = defineProps<{
  speaker: string
  /** Illustrated image of the speaker, when one has been rendered. */
  art?: string
  lines: string[]
  choices: { id: string; label: string; note?: string; blockers: string[] }[]
}>()
const emit = defineEmits<{ choose: [id: string] }>()

const court = useEmperorFortressStore()
const index = ref(0)
const visible = ref(0)
const showLog = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const line = computed(() => props.lines[index.value] ?? '')
const shown = computed(() => line.value.slice(0, visible.value))
const streaming = computed(() => visible.value < line.value.length)
const lastLine = computed(() => index.value >= props.lines.length - 1)

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function stream() {
  stop()
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (court.textSpeed === 'instant' || reduced) {
    visible.value = line.value.length
    return
  }
  visible.value = 0
  const step = court.textSpeed === 'fast' ? 3 : 1
  timer = setInterval(() => {
    visible.value = Math.min(line.value.length, visible.value + step)
    if (visible.value >= line.value.length) stop()
  }, 22)
}

function advance() {
  if (streaming.value) {
    stop()
    visible.value = line.value.length
  } else if (!lastLine.value) {
    index.value += 1
    stream()
  }
}

watch(
  () => props.lines,
  () => {
    index.value = 0
    stream()
  },
  { immediate: true },
)
onBeforeUnmount(stop)
</script>
