<template>
  <section
    class="eod-dialogue-panel kr-panel overflow-hidden p-0"
    :aria-label="'Audience with ' + speaker"
  >
    <div
      class="flex items-center justify-between gap-2 border-b border-warning/25 px-3 py-2"
    >
      <h2
        v-if="title"
        class="min-w-0 font-serif text-lg font-bold leading-tight text-warning sm:text-xl"
      >
        {{ title }}
      </h2>
      <strong v-else class="font-serif text-lg">{{ speaker }}</strong>
      <div class="flex shrink-0 items-center gap-1">
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

    <div v-if="title" class="flex items-center gap-3 px-4 pt-4">
      <span
        class="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-warning/50 bg-base-200"
      >
        <img
          v-if="art"
          :src="art"
          alt=""
          class="h-full w-full object-cover object-top"
        />
      </span>
      <span class="min-w-0">
        <strong class="block font-serif text-base">{{ speaker }}</strong>
        <span v-if="subtitle" class="block text-xs opacity-65">{{
          subtitle
        }}</span>
      </span>
    </div>
    <img
      v-else-if="art"
      :src="art"
      :alt="speaker"
      class="mx-auto block max-h-80 w-auto bg-base-200 object-contain"
    />
    <div
      v-if="showLog"
      class="kr-scroll max-h-48 space-y-2 overflow-y-auto p-3 text-base"
    >
      <p
        v-for="(entry, i) in lines.slice(0, index + 1)"
        :key="i"
        class="opacity-80"
      >
        <strong v-if="typeof entry !== 'string'" class="text-warning"
          >{{ entry.who }}:
        </strong>
        {{ lineText(entry) }}
      </p>
    </div>
    <button
      v-else
      type="button"
      class="eod-reading block min-h-28 w-full px-4 py-4 text-left italic"
      :aria-label="streaming ? 'Show the whole line' : 'Next line'"
      @click="advance"
    >
      <span
        v-if="interjection"
        class="mb-1 flex items-center gap-2 font-sans text-xs font-semibold not-italic uppercase tracking-widest text-warning"
      >
        <img
          v-if="interjectionArt"
          :src="interjectionArt"
          alt=""
          class="h-8 w-8 rounded-full border border-warning/50 object-cover object-top"
        />
        {{ interjection.who }}
      </span>
      <span aria-live="polite">{{ shown }}</span>
    </button>
    <div v-if="!showLog && (streaming || !lastLine)" class="px-3 pb-3">
      <button
        type="button"
        class="eod-finish flex w-full items-center justify-center gap-2 px-5 py-2 text-sm"
        @click="advance"
      >
        {{ streaming ? 'Show all' : 'Continue' }}
        <span aria-hidden="true">▸</span>
      </button>
    </div>

    <div
      v-if="showChoices"
      ref="choicesEl"
      class="grid scroll-mb-3 gap-1.5 border-t border-warning/20 p-3"
    >
      <p
        class="text-[10px] font-semibold uppercase tracking-[0.25em] text-warning"
      >
        Your answer
      </p>
      <button
        v-for="choice in choices"
        :key="choice.id"
        type="button"
        class="eod-choice-reading flex items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors"
        :class="
          choice.blockers.length
            ? 'cursor-not-allowed border-base-content/10 opacity-55'
            : 'border-warning/40 bg-base-200/80 hover:border-warning hover:bg-warning/15'
        "
        :disabled="choice.blockers.length > 0"
        @click="emit('choose', choice.id)"
      >
        <span
          class="mt-2 h-2.5 w-2.5 shrink-0 rotate-45 border border-warning"
          :class="choice.blockers.length ? '' : 'bg-warning'"
          aria-hidden="true"
        />
        <span class="min-w-0">
          <strong class="block">{{ choice.label }}</strong>
          <span v-if="choice.note" class="block text-xs text-warning">{{
            choice.note
          }}</span>
          <span
            v-if="choice.stakes?.length"
            class="mt-1 flex flex-wrap gap-1"
            aria-label="What this answer touches"
          >
            <span
              v-for="(stake, i) in choice.stakes"
              :key="i"
              class="rounded-full border px-1.5 py-px text-[10px] font-semibold leading-tight"
              :class="STAKE_TONE[stake.tone]"
              >{{ stake.text }}</span
            >
          </span>
          <span v-if="choice.blockers.length" class="block text-xs">
            {{ choice.blockers.join(' · ') }}
          </span>
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import type { TextSpeed } from '~/stores/emperorFortressStore'
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import { lineText } from '~/utils/emperorOfDust/fortress/engine'
import { followerDef } from '~/utils/emperorOfDust/fortress/followers'
import type { SceneLine } from '~/utils/emperorOfDust/fortress/types'
import type { Stake } from '~/utils/emperorOfDust/fortress/board'

const props = defineProps<{
  speaker: string
  /** The petition's title, which turns the box into the throne room's petition card. */
  title?: string
  subtitle?: string
  /** Illustrated image of the speaker, when one has been rendered. */
  art?: string
  lines: SceneLine[]
  choices: {
    id: string
    label: string
    note?: string
    blockers: string[]
    stakes?: Stake[]
  }[]
}>()

const STAKE_TONE: Record<Stake['tone'], string> = {
  gain: 'border-success/50 text-success',
  loss: 'border-error/50 text-error',
  neutral: 'border-base-content/25 opacity-80',
  warning: 'border-warning/60 text-warning',
}
const emit = defineEmits<{ choose: [id: string] }>()

const court = useEmperorFortressStore()
const index = ref(0)
const visible = ref(0)
const showLog = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const current = computed<SceneLine>(() => props.lines[index.value] ?? '')
const line = computed(() => lineText(current.value))
/** A line handed to someone else in the room, with their nameplate. */
const interjection = computed(() =>
  typeof current.value === 'string' ? null : current.value,
)
const interjectionArt = computed(() => {
  const slug = interjection.value?.npc
  if (!slug) return undefined
  return followerDef(slug)
    ? illustration('followers', slug)
    : illustration('npcs', slug)
})
const shown = computed(() => line.value.slice(0, visible.value))
const streaming = computed(() => visible.value < line.value.length)
const lastLine = computed(() => index.value >= props.lines.length - 1)
const showChoices = computed(
  () => !streaming.value && lastLine.value && props.choices.length > 0,
)
const choicesEl = ref<HTMLElement | null>(null)

// The answers appear under the line; on a phone that is below the fold, so
// bring them into view the moment they arrive.
watch(showChoices, async (shown) => {
  if (!shown) return
  await nextTick()
  const reduced =
    court.preferences.motion === 'reduced' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  choicesEl.value?.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: 'nearest',
  })
})

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function stream() {
  stop()
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (
    court.textSpeed === 'instant' ||
    reduced ||
    court.preferences.motion === 'reduced'
  ) {
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
