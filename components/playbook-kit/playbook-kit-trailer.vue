<template>
  <div
    ref="root"
    class="absolute inset-0 z-40 flex flex-col overflow-hidden bg-black text-white"
    role="dialog"
    aria-modal="true"
    :aria-label="`${spec.title} trailer`"
    tabindex="-1"
    @keydown="onKey"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-10 h-[8%] bg-black"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[8%] bg-black"
    />

    <transition name="pk-cut" mode="out-in">
      <div v-if="beat" :key="index" class="absolute inset-0">
        <PlaybookKitArt
          :art="beat.moment.art"
          :tone="MOMENT_TONES[beat.moment.kind]"
          icon="kind-icon:camera"
          :pan="!reduced"
          class="absolute inset-0"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40"
        />
        <p
          class="pk-display absolute inset-x-6 bottom-[16%] mx-auto max-w-3xl text-center text-2xl font-semibold leading-snug drop-shadow-lg @2xl:text-4xl"
        >
          {{ beat.line }}
        </p>
      </div>
      <div v-else key="title" class="absolute inset-0 grid place-items-center">
        <PlaybookKitArt
          :art="spec.keyArt"
          tone="primary"
          icon="kind-icon:sparkles"
          :pan="!reduced"
          class="absolute inset-0 opacity-70"
        />
        <div class="absolute inset-0 bg-black/45" />
        <div
          class="relative z-10 flex max-w-2xl flex-col items-center gap-3 px-6 text-center"
        >
          <p
            class="text-xs font-semibold uppercase tracking-[.35em] text-white/70"
          >
            {{ spec.trailer.tagline }}
          </p>
          <p
            class="pk-display text-4xl font-black leading-none drop-shadow-lg @2xl:text-6xl"
          >
            {{ spec.title }}
          </p>
          <p class="pk-prose text-white/85">{{ spec.premise }}</p>
          <button
            ref="begin"
            type="button"
            class="pf-cta mt-2"
            @click="kit.finishTrailer()"
          >
            <Icon name="kind-icon:play" class="size-5" />
            Begin
          </button>
        </div>
      </div>
    </transition>

    <div
      class="absolute inset-x-0 bottom-0 z-20 flex h-[8%] min-h-10 items-center gap-3 px-4"
    >
      <ol class="flex items-center gap-1.5" aria-label="Trailer progress">
        <li v-for="(_, i) in beats" :key="i">
          <button
            type="button"
            class="block h-1.5 rounded-full transition-all"
            :class="i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'"
            :aria-label="`Beat ${i + 1}`"
            @click="go(i)"
          />
        </li>
      </ol>
      <button
        v-if="beat"
        type="button"
        class="btn btn-ghost btn-sm ml-auto text-white/80"
        @click="go(beats.length)"
      >
        Skip
        <Icon name="kind-icon:arrow-right" class="size-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { MOMENT_TONES } from '~/utils/playbookKit/view'
import type { PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()

const BEAT_MS = 4200
const index = ref(0)
const begin = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLDivElement | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const beats = computed(() =>
  props.spec.trailer.beats.flatMap((entry) => {
    const moment = props.spec.moments.find((m) => m.id === entry.moment)
    return moment ? [{ line: entry.line, moment }] : []
  }),
)
const beat = computed(() => beats.value[index.value] ?? null)
const reduced = computed(() => kit.settings.motion === 'reduced')

function schedule() {
  if (timer) clearTimeout(timer)
  if (index.value < beats.value.length)
    timer = setTimeout(() => go(index.value + 1), BEAT_MS)
}

function go(next: number) {
  index.value = Math.max(0, Math.min(next, beats.value.length))
  schedule()
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') kit.finishTrailer()
  else if (event.key === 'ArrowRight') go(index.value + 1)
  else if (event.key === 'ArrowLeft') go(index.value - 1)
}

watch(beat, async (current) => {
  if (current) return
  await nextTick()
  begin.value?.focus()
})

onMounted(() => {
  schedule()
  if (beat.value) root.value?.focus()
  else begin.value?.focus()
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.pk-cut-enter-active,
.pk-cut-leave-active {
  transition: opacity 0.6s ease;
}
.pk-cut-enter-from,
.pk-cut-leave-to {
  opacity: 0;
}
</style>
