<!-- /components/butterfly-gallery/butterfly-painting-pile.vue -->
<!--
  The painting pile (butterfly-gallery/t-005): only the physical top of the
  stack (store.topOfPile) renders as thumbnails, lightly rotated and
  overlapping so it reads as a stack rather than a grid -- the full queue
  depth still shows through remainingCount even though most of it never
  hits the DOM. Presentational only: emits select/drag gestures back up,
  the parent owns what promoting or dragging an entry actually does.
-->
<template>
  <section aria-label="Painting pile" class="butterfly-pile">
    <p class="kr-text-eyebrow kr-text-dim-xs-45">
      Pile
      <span class="kr-text-black-sm ml-1 normal-case tracking-normal">
        {{ remainingCount }} remaining
      </span>
    </p>

    <div v-if="entries.length" class="butterfly-pile-stack">
      <button
        v-for="(entry, index) in entries"
        :key="entry.id"
        type="button"
        class="butterfly-pile-card kr-panel"
        :style="cardStyle(index)"
        :class="{ 'ring-2 ring-primary': entry.id === selectedId }"
        :disabled="disabled"
        :aria-label="pileCardLabel(entry, index)"
        :aria-current="entry.id === selectedId ? 'true' : undefined"
        draggable="true"
        @click="emit('select', entry.id)"
        @dragstart="emit('drag-start', entry.id)"
        @dragend="emit('drag-end')"
      >
        <kr-deferred-image
          :src="entry.thumbnailPath"
          :alt="entry.prompt || 'Untitled artwork'"
          eager
          class="h-full w-full object-cover"
        />
      </button>
    </div>

    <p v-else class="kr-text-dim-sm">Pile is empty.</p>
  </section>
</template>

<script setup lang="ts">
import type { ButterflyPileEntry } from '@/types/butterflyGallery'

const props = defineProps<{
  entries: ButterflyPileEntry[]
  remainingCount: number
  selectedId: number | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [entryId: number]
  'drag-start': [entryId: number]
  'drag-end': []
}>()

// Deterministic light tilt/offset per stack position so the pile reads as
// a loose stack of paintings without any randomness re-rolling on every
// render. Index 0 (the top card) stays flattest and frontmost.
function cardStyle(index: number): Record<string, string> {
  const tilt = [0, -6, 5, -4, 3][index % 5]
  const lift = index * 2
  return {
    '--butterfly-pile-tilt': `${tilt}deg`,
    '--butterfly-pile-offset': `${lift}px`,
    zIndex: String(props.entries.length - index),
  }
}

function pileCardLabel(entry: ButterflyPileEntry, index: number): string {
  const title = entry.prompt || 'Untitled artwork'
  return index === 0 ? `${title} (top of pile)` : title
}
</script>

<style scoped>
.butterfly-pile-stack {
  position: relative;
  display: flex;
  height: 9rem;
  justify-content: center;
  padding-top: 0.5rem;
}

.butterfly-pile-card {
  position: absolute;
  height: 7rem;
  width: 7rem;
  overflow: hidden;
  padding: 0;
  transform: translateY(var(--butterfly-pile-offset, 0))
    rotate(var(--butterfly-pile-tilt, 0deg));
  transition:
    transform 0.15s ease-out,
    box-shadow 0.15s ease-out;
}

.butterfly-pile-card:hover,
.butterfly-pile-card:focus-visible {
  transform: translateY(calc(var(--butterfly-pile-offset, 0) - 0.5rem))
    rotate(var(--butterfly-pile-tilt, 0deg)) scale(1.04);
  box-shadow: 0 0.75rem 1.25rem -0.5rem rgb(0 0 0 / 35%);
}

@media (prefers-reduced-motion: reduce) {
  .butterfly-pile-card {
    transition: none;
  }

  .butterfly-pile-card:hover,
  .butterfly-pile-card:focus-visible {
    transform: translateY(var(--butterfly-pile-offset, 0))
      rotate(var(--butterfly-pile-tilt, 0deg));
  }
}
</style>
