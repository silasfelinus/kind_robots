<template>
  <section class="space-y-3 border-t border-base-300 pt-3" aria-label="Batch sorting">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 class="kr-text-black-md">Batch sort</h3>
        <p class="kr-text-dim-xs">
          Select from the filtered queue, then apply one preset to the whole batch.
        </p>
      </div>
      <button
        v-if="gallery.batchSelectedCount"
        type="button"
        class="kr-btn btn-ghost btn-sm"
        @click="clearSelection"
      >
        Clear {{ gallery.batchSelectedCount }}
      </button>
    </div>

    <div class="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
      <button
        v-for="entry in gallery.visiblePile"
        :key="entry.id"
        type="button"
        class="relative aspect-square overflow-hidden rounded-lg border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        :class="isSelected(entry.id) ? 'border-primary' : 'border-base-300'"
        :aria-pressed="isSelected(entry.id)"
        :aria-label="`${isSelected(entry.id) ? 'Remove' : 'Add'} artwork ${entry.id} ${isSelected(entry.id) ? 'from' : 'to'} batch`"
        @click="gallery.toggleBatchSelected(entry.id)"
      >
        <img
          :src="entry.thumbnailPath"
          :alt="entry.prompt || 'Untitled artwork'"
          class="h-full w-full object-cover"
        />
        <span
          v-if="isSelected(entry.id)"
          class="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-primary text-primary-content"
          aria-hidden="true"
        >
          <Icon name="kind-icon:check" class="kr-icon-3" />
        </span>
      </button>
    </div>

    <p v-if="!gallery.visiblePile.length" class="kr-text-dim-xs">
      Nothing in the current filtered queue.
    </p>

    <div v-if="gallery.batchSelectedCount" class="space-y-2">
      <p class="kr-text-dim-xs">
        {{ gallery.batchSelectedCount }} selected. Choose an action:
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="bin in batchBins"
          :key="bin.id"
          type="button"
          class="kr-btn btn-sm"
          :disabled="batch.running"
          @click="prepare(bin.id)"
        >
          {{ bin.label }}
        </button>
      </div>
    </div>

    <div
      v-if="batch.prepared"
      class="kr-note kr-note-warning space-y-2 text-sm"
      role="alertdialog"
      aria-modal="false"
      aria-label="Confirm batch action"
    >
      <p>
        Apply <strong>{{ batch.prepared.label }}</strong> to
        <strong>{{ batch.prepared.preview.count }}</strong> artworks?
      </p>
      <p class="kr-text-dim-xs">
        This action requires confirmation because it may be destructive or enqueue generation work.
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="kr-btn btn-primary btn-sm"
          :disabled="batch.running"
          @click="runPrepared(true)"
        >
          Confirm batch
        </button>
        <button
          type="button"
          class="kr-btn btn-ghost btn-sm"
          :disabled="batch.running"
          @click="batch.cancelPreparedBatch()"
        >
          Cancel
        </button>
      </div>
    </div>

    <div v-if="batch.lastResult" class="kr-note text-sm" role="status" aria-live="polite">
      {{ resultSummary }}
      <ul v-if="batch.lastResult.failures.length" class="mt-1 list-disc pl-5 text-xs">
        <li v-for="failure in batch.lastResult.failures" :key="failure.entryId">
          Artwork {{ failure.entryId }}: {{ failure.message }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyGalleryBatchStore } from '@/stores/butterflyGalleryBatchStore'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'

const gallery = useButterflyGalleryStore()
const batch = useButterflyGalleryBatchStore()

const batchBins = computed(() => [
  ...gallery.leftBins,
  ...gallery.rightBins.filter((bin) => bin.kind === 'trash'),
])

const resultSummary = computed(() => {
  const result = batch.lastResult
  if (!result) return ''
  const succeeded = result.succeededIds.length
  const failed = result.failures.length
  return failed
    ? `${succeeded} succeeded; ${failed} failed and remain selected for retry.`
    : `${succeeded} artworks updated successfully.`
})

function isSelected(entryId: number): boolean {
  return gallery.batchSelectedIds.includes(entryId)
}

function clearSelection(): void {
  gallery.clearBatchSelection()
  batch.cancelPreparedBatch()
}

async function prepare(binId: string): Promise<void> {
  const prepared = batch.prepareBinBatch(binId)
  if (!prepared) return
  if (!prepared.preview.requiresConfirmation) await runPrepared(false)
}

async function runPrepared(confirmed: boolean): Promise<void> {
  await batch.executePreparedBatch(confirmed)
}
</script>
