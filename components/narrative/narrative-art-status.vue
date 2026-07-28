<!-- /components/narrative/narrative-art-status.vue -->
<template>
  <section
    v-if="art"
    class="ml-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:ml-6"
    :role="isFailure ? 'alert' : 'status'"
    aria-live="polite"
    aria-atomic="true"
    :aria-label="statusMessage"
    :aria-busy="isBusy"
  >
    <img
      v-if="art.status === 'done' && art.imagePath"
      :src="art.imagePath"
      :alt="altText"
      class="aspect-video w-full object-cover"
      loading="lazy"
    />

    <div
      v-else-if="isBusy"
      class="flex min-h-28 items-center justify-center gap-3 bg-base-200/50 p-4 text-sm text-base-content/60"
    >
      <span
        class="loading loading-spinner loading-sm motion-reduce:hidden"
        aria-hidden="true"
      />
      <span>{{ statusMessage }}</span>
    </div>

    <div
      v-else-if="isFailure"
      class="flex min-h-24 flex-wrap items-center justify-between gap-3 bg-error/5 p-4"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold text-error">
          {{ art.status === 'cancelled' ? 'Illustration cancelled' : 'Illustration paused' }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-base-content/55">
          {{ art.error || 'The story continues without blocking. You can retry this image.' }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-error btn-outline btn-xs rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/70 motion-reduce:transform-none motion-reduce:transition-none"
        @click="$emit('retry')"
      >
        Retry image
      </button>
    </div>

    <div
      v-else
      class="flex min-h-20 items-center justify-center p-4 text-xs text-base-content/50"
    >
      {{ statusMessage }}
    </div>

    <footer
      class="flex items-center justify-between gap-2 border-t border-base-300 px-3 py-2 text-[0.68rem] text-base-content/45"
      aria-hidden="true"
    >
      <span class="capitalize">{{ art.moment.replace(/-/g, ' ') }}</span>
      <span>Automatic story art</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'

const props = defineProps<{
  art?: NarrativeArtJobState | null
  label?: string
}>()

defineEmits<{
  retry: []
}>()

const isBusy = computed(
  () =>
    props.art?.status === 'queueing' ||
    props.art?.status === 'queued' ||
    props.art?.status === 'rendering',
)
const isFailure = computed(
  () => props.art?.status === 'failed' || props.art?.status === 'cancelled',
)
const altText = computed(
  () =>
    props.label ||
    `Illustration for this ${props.art?.moment.replace(/-/g, ' ') || 'story'} moment`,
)
const statusMessage = computed(() => {
  const art = props.art
  if (!art) return ''
  if (art.status === 'rendering') return 'The scene illustration is rendering.'
  if (art.status === 'queued') return 'The scene illustration is queued.'
  if (art.status === 'queueing') return 'Preparing the scene illustration.'
  if (art.status === 'failed') {
    return art.error || 'The scene illustration failed. The story can continue.'
  }
  if (art.status === 'cancelled') return 'The scene illustration was cancelled.'
  return art.imagePath
    ? 'The scene illustration is ready.'
    : `Illustration ${art.artImageId || ''} is ready.`.trim()
})
</script>
