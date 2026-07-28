<!-- /components/narrative/narrative-art-status.vue -->
<template>
  <section
    v-if="art"
    class="ml-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:ml-6"
    :aria-busy="art.status === 'queueing' || art.status === 'queued' || art.status === 'rendering'"
  >
    <img
      v-if="art.status === 'done' && art.imagePath"
      :src="art.imagePath"
      :alt="altText"
      class="aspect-video w-full object-cover"
      loading="lazy"
    />

    <div
      v-else-if="art.status === 'queueing' || art.status === 'queued' || art.status === 'rendering'"
      class="flex min-h-28 items-center justify-center gap-3 bg-base-200/50 p-4 text-sm text-base-content/60"
    >
      <span class="loading loading-spinner loading-sm" />
      <span>
        {{
          art.status === 'rendering'
            ? 'The scene illustration is rendering…'
            : art.status === 'queued'
              ? 'The scene illustration is queued…'
              : 'Preparing the scene illustration…'
        }}
      </span>
    </div>

    <div
      v-else-if="art.status === 'failed' || art.status === 'cancelled'"
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
      <button type="button" class="btn btn-error btn-outline btn-xs rounded-xl" @click="$emit('retry')">
        Retry image
      </button>
    </div>

    <div v-else class="flex min-h-20 items-center justify-center p-4 text-xs text-base-content/50">
      Illustration #{{ art.artImageId }} is ready.
    </div>

    <footer class="flex items-center justify-between gap-2 border-t border-base-300 px-3 py-2 text-[0.68rem] text-base-content/45">
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

const altText = computed(
  () => props.label || `Illustration for this ${props.art?.moment.replace(/-/g, ' ') || 'story'} moment`,
)
</script>
