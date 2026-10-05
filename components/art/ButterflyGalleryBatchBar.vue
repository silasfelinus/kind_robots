<template>
  <section class="batch-bar kr-panel" aria-label="Batch edit">
    <div class="batch-bar-row">
      <strong class="batch-bar-count">
        {{ gallery.batchSelectedCount }} selected
      </strong>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs"
        :disabled="!gallery.displayEntries.length"
        @click="gallery.selectEntries(gallery.displayEntries.map((e) => e.id))"
      >
        Select shown ({{ gallery.displayEntries.length }})
      </button>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs"
        :disabled="!gallery.visiblePile.length"
        @click="gallery.selectEntries(gallery.visiblePile.map((e) => e.id))"
      >
        Select all loaded ({{ gallery.visiblePile.length }})
      </button>
      <button
        v-if="gallery.batchSelectedCount"
        type="button"
        class="kr-btn btn-ghost btn-xs"
        @click="clear"
      >
        Clear
      </button>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs batch-bar-done"
        @click="done"
      >
        Done
      </button>
    </div>

    <div v-if="gallery.batchSelectedCount" class="batch-bar-row">
      <div class="batch-bar-group" role="group" aria-label="Rate selection">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="kr-btn btn-ghost btn-xs"
          :disabled="busy"
          @click="batch.prepareEdit({ type: 'rating', rating: n })"
        >
          {{ n }}★
        </button>
        <button
          type="button"
          class="kr-btn btn-ghost btn-xs"
          :disabled="busy"
          @click="batch.prepareEdit({ type: 'rating', rating: null })"
        >
          No ★
        </button>
      </div>

      <ButterflyGalleryFolderPicker
        class="batch-bar-picker"
        :disabled="busy"
        placeholder="Move selection to folder…"
        @move="(folder) => batch.prepareEdit({ type: 'move', folder })"
      />

      <ButterflyGalleryCollectionPicker
        class="batch-bar-picker"
        :disabled="busy"
        placeholder="Add selection to collection…"
        @add="addCollection"
      />

      <select
        v-if="selectedCollections.length"
        class="kr-select-sm batch-bar-remove"
        aria-label="Remove selection from collection"
        :disabled="busy"
        @change="removeCollection"
      >
        <option value="">Remove from collection…</option>
        <option
          v-for="collection in selectedCollections"
          :key="collection.value"
          :value="collection.value"
        >
          {{ collection.label }}
        </option>
      </select>

      <div class="batch-bar-group">
        <button
          type="button"
          class="kr-btn btn-error btn-xs"
          :disabled="busy"
          @click="batch.prepareEdit({ type: 'trash' })"
        >
          <Icon name="kind-icon:trash" class="kr-icon-3" />
          Trash
        </button>
        <button
          v-if="selectionHasTrashed"
          type="button"
          class="kr-btn btn-info btn-xs"
          :disabled="busy"
          @click="batch.prepareEdit({ type: 'restore' })"
        >
          <Icon name="kind-icon:undo" class="kr-icon-3" />
          Restore
        </button>
      </div>
    </div>

    <div
      v-if="batch.prepared"
      class="kr-note kr-note-warning batch-bar-row"
      role="alertdialog"
      aria-label="Confirm batch action"
    >
      <span>
        {{ batch.prepared.label }} for
        <strong>{{ batch.prepared.preview.count }}</strong>
        artwork{{ batch.prepared.preview.count === 1 ? '' : 's' }}?
        <template v-if="isMove">
          The files move on disk and the archive updates to match.
        </template>
      </span>
      <button
        type="button"
        class="kr-btn btn-primary btn-xs"
        :disabled="batch.running"
        @click="batch.executePreparedBatch(true)"
      >
        <span v-if="batch.running" class="kr-spinner-xs" />
        Confirm
      </button>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs"
        :disabled="batch.running"
        @click="batch.cancelPreparedBatch()"
      >
        Cancel
      </button>
    </div>

    <div
      v-else-if="batch.running"
      class="batch-bar-row kr-text-dim-xs"
      role="status"
    >
      <span class="kr-spinner-xs" /> Working…
    </div>

    <div
      v-if="batch.lastResult && !batch.running"
      class="kr-note batch-bar-row"
      :class="{ 'kr-note-error': batch.lastResult.failures.length }"
      role="status"
      aria-live="polite"
    >
      <span>{{ resultSummary }}</span>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs"
        @click="batch.dismissResult()"
      >
        Dismiss
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyGalleryBatchStore } from '@/stores/butterflyGalleryBatchStore'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'

const gallery = useButterflyGalleryStore()
const batch = useButterflyGalleryBatchStore()

const busy = computed(() => batch.running || gallery.isBusy)

const isMove = computed(
  () => batch.prepared?.kind === 'edit' && batch.prepared.edit.type === 'move',
)

const selectedEntries = computed(() =>
  gallery.batchSelectedIds.flatMap((id) => {
    const entry = gallery.entryById(id)
    return entry ? [entry] : []
  }),
)

const selectionHasTrashed = computed(() =>
  selectedEntries.value.some((entry) => entry.trashed),
)

const selectedCollections = computed(() => {
  const seen = new Map<string, string>()
  for (const entry of selectedEntries.value)
    for (const slug of entry.collections)
      if (!seen.has(slug))
        seen.set(
          slug,
          entry.collectionRefs?.find((ref) => ref.slug === slug)?.label ?? slug,
        )
  return [...seen.entries()].map(([value, label]) => ({ value, label }))
})

const resultSummary = computed(() => {
  const result = batch.lastResult
  if (!result) return ''
  const succeeded = result.succeededIds.length
  const failed = result.failures.length
  const head = `${batch.lastLabel}: ${succeeded} done`
  if (!failed) return `${head}.`
  const first = result.failures[0]?.message
  return `${head}, ${failed} failed${first ? ` (${first})` : ''}.`
})

function addCollection(
  choice: { value: string; label: string } | { newLabel: string },
): void {
  void batch.prepareEdit(
    'newLabel' in choice
      ? { type: 'new-collection', label: choice.newLabel }
      : {
          type: 'add-collection',
          collection: choice.value,
          label: choice.label,
        },
  )
}

function removeCollection(event: Event): void {
  const select = event.target as HTMLSelectElement
  const value = select.value
  select.value = ''
  if (!value) return
  const match = selectedCollections.value.find((c) => c.value === value)
  void batch.prepareEdit({
    type: 'remove-collection',
    collection: value,
    label: match?.label,
  })
}

function clear(): void {
  gallery.clearBatchSelection()
  batch.cancelPreparedBatch()
}

function done(): void {
  batch.cancelPreparedBatch()
  gallery.setBatchMode(false)
}
</script>

<style scoped>
.batch-bar {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-width: min(100%, 64rem);
  padding: 0.55rem 0.7rem;
  border-radius: 1rem;
  background: color-mix(in oklch, var(--color-base-100) 95%, transparent);
  box-shadow: 0 10px 26px color-mix(in oklch, black 22%, transparent);
  backdrop-filter: blur(10px);
}

.batch-bar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
}

.batch-bar-count {
  font-size: 0.8rem;
  font-weight: 900;
}

.batch-bar-done {
  margin-left: auto;
}

.batch-bar-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
}

.batch-bar-picker {
  flex: 1 1 14rem;
}

.batch-bar-remove {
  flex: 0 1 12rem;
}
</style>
