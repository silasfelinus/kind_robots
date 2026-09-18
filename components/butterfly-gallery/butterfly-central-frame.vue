<!-- /components/butterfly-gallery/butterfly-central-frame.vue -->
<!--
  The central frame (butterfly-gallery/t-005): shows the selected pile
  entry, is itself a drop target that promotes a dragged pile card without
  sorting it (see store.promoteToFrame), and cross-fades between entries so
  advancing to the next image after a sort reads as smooth rather than a
  hard cut. Presentational only -- promotion/sort decisions live in the
  store, this only emits the raw gestures.

  A `metadata` slot sits below the image, reserved for t-008's quick-action
  drawer so that task doesn't need to touch this component's layout.
-->
<template>
  <section aria-label="Selected image" class="kr-panel min-h-72 space-y-3 p-4">
    <div
      class="butterfly-frame-dropzone rounded-box"
      @dragover.prevent
      @drop.prevent="emit('drop')"
    >
      <Transition name="butterfly-frame" mode="out-in">
        <figure v-if="entry" :key="entry.id" class="text-center">
          <kr-deferred-image
            :src="entry.displayPath"
            :alt="entry.prompt || 'Untitled artwork'"
            eager
            class="mx-auto max-h-64 rounded-box object-contain"
            draggable="true"
            @dragstart="emit('drag-start', entry.id)"
            @dragend="emit('drag-end')"
          />
        </figure>
        <p v-else key="empty" class="kr-text-dim-sm py-16 text-center">
          Pile is empty.
        </p>
      </Transition>
    </div>

    <dl v-if="entry" class="kr-text-dim-sm grid grid-cols-2 gap-2">
      <dt>Rating</dt>
      <dd>{{ entry.rating ?? 'unrated' }}</dd>
      <dt>Processed</dt>
      <dd>{{ entry.processed ? 'yes' : 'no' }}</dd>
      <dt>Match state</dt>
      <dd>{{ entry.matchState }}</dd>
      <dt>Prompt</dt>
      <dd class="truncate">{{ entry.prompt || '—' }}</dd>
    </dl>

    <slot name="metadata" />
  </section>
</template>

<script setup lang="ts">
import type { ButterflyPileEntry } from '@/types/butterflyGallery'

defineProps<{
  entry: ButterflyPileEntry | null
}>()

const emit = defineEmits<{
  'drag-start': [entryId: number]
  'drag-end': []
  drop: []
}>()
</script>

<style scoped>
.butterfly-frame-dropzone {
  min-height: 16rem;
}

.butterfly-frame-enter-active,
.butterfly-frame-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.butterfly-frame-enter-from {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.98);
}

.butterfly-frame-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .butterfly-frame-enter-active,
  .butterfly-frame-leave-active {
    transition: opacity 0.12s linear;
  }

  .butterfly-frame-enter-from,
  .butterfly-frame-leave-to {
    transform: none;
  }
}
</style>
