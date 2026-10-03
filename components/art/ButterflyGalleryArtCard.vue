<template>
  <div
    v-if="entry"
    class="art-card-backdrop"
    role="presentation"
    @click.self="gallery.closeArtCard()"
  >
    <article
      ref="cardRef"
      class="art-card"
      role="dialog"
      aria-modal="true"
      :aria-label="`Artwork ${fileName}`"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <div class="art-card-stage">
        <img
          :key="entry.id"
          :src="entry.displayPath"
          :alt="entry.prompt || 'Untitled artwork'"
          class="art-card-image"
          :class="{ 'art-card-image-trashed': entry.trashed }"
        />
        <button
          type="button"
          class="art-card-nav art-card-nav-prev"
          title="Previous (←)"
          @click="gallery.stepArtCard(-1)"
        >
          <Icon name="kind-icon:chevron-left" class="kr-icon-5" />
          <span class="sr-only">Previous artwork</span>
        </button>
        <button
          type="button"
          class="art-card-nav art-card-nav-next"
          title="Next (→)"
          @click="gallery.stepArtCard(1)"
        >
          <Icon name="kind-icon:chevron-right" class="kr-icon-5" />
          <span class="sr-only">Next artwork</span>
        </button>
        <label class="art-card-select">
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            :checked="isBatchSelected"
            @change="toggleBatch"
          />
          <span>Select</span>
        </label>
      </div>

      <section class="art-card-panel" aria-label="Artwork details">
        <header class="art-card-header">
          <div class="min-w-0">
            <p class="art-card-title" :title="entry.relativePath || fileName">
              {{ fileName }}
            </p>
            <p class="kr-text-dim-xs">
              {{ entry.trashed ? 'In trash' : matchLabel }} · #{{ entry.id }}
            </p>
          </div>
          <button
            type="button"
            class="kr-btn btn-ghost btn-sm"
            title="Close (Esc)"
            @click="gallery.closeArtCard()"
          >
            <Icon name="kind-icon:close" class="kr-icon-4" />
            <span class="sr-only">Close art card</span>
          </button>
        </header>

        <p
          v-if="gallery.status === 'error' && gallery.errorMessage"
          class="kr-note kr-note-error art-card-note"
        >
          {{ gallery.errorMessage }}
          <button
            type="button"
            class="kr-btn btn-ghost btn-xs"
            @click="gallery.clearError()"
          >
            Dismiss
          </button>
        </p>
        <p v-else-if="notice" class="kr-note art-card-note" role="status">
          {{ notice }}
        </p>

        <div class="art-card-block">
          <span class="art-card-label">Rating</span>
          <div class="art-card-stars" role="group" aria-label="Rating">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="art-card-star"
              :class="{ 'art-card-star-on': (entry.rating ?? 0) >= n }"
              :aria-pressed="entry.rating === n"
              :title="`${n}★ (press ${n})`"
              :disabled="gallery.isBusy"
              @click="rate(entry.rating === n ? null : n)"
            >
              <Icon name="kind-icon:star" class="kr-icon-4" />
              <span class="sr-only">{{ n }} stars</span>
            </button>
            <button
              v-if="entry.rating !== null"
              type="button"
              class="kr-btn btn-ghost btn-xs"
              :disabled="gallery.isBusy"
              @click="rate(null)"
            >
              Clear
            </button>
          </div>
        </div>

        <div class="art-card-block">
          <span class="art-card-label">Folder</span>
          <p class="art-card-folder" :title="entry.relativePath || undefined">
            <Icon name="kind-icon:folder" class="kr-icon-3 opacity-70" />
            {{ entry.folder || 'Archive Root' }}
          </p>
          <ButterflyGalleryFolderPicker
            :current="entry.folder"
            :disabled="gallery.isBusy || entry.trashed || moving"
            @move="move"
          />
        </div>

        <div class="art-card-block">
          <span class="art-card-label">Collections</span>
          <div v-if="collectionRefs.length" class="art-card-chips">
            <span
              v-for="collection in collectionRefs"
              :key="collection.slug"
              class="art-card-chip"
            >
              {{ collection.label }}
              <button
                type="button"
                class="art-card-chip-remove"
                :disabled="gallery.isBusy"
                :title="`Remove from ${collection.label}`"
                @click="gallery.removeFromCollection(entry.id, collection.slug)"
              >
                <Icon name="kind-icon:close" class="kr-icon-3" />
                <span class="sr-only">Remove from {{ collection.label }}</span>
              </button>
            </span>
          </div>
          <p v-else class="kr-text-dim-xs">Not in any collection yet.</p>
          <ButterflyGalleryCollectionPicker
            :exclude="entry.collections"
            :disabled="gallery.isBusy || entry.trashed"
            @add="addCollection"
          />
        </div>

        <div
          v-if="!entry.trashed && gallery.leftBins.length"
          class="art-card-block"
        >
          <span class="art-card-label">Sort into</span>
          <div class="art-card-bins">
            <button
              v-for="bin in gallery.leftBins"
              :key="bin.id"
              type="button"
              class="kr-btn btn-sm art-card-bin"
              :disabled="gallery.isBusy"
              @click="sortInto(bin.id)"
            >
              <Icon :name="bin.icon" class="kr-icon-3" />
              {{ bin.label }}
            </button>
          </div>
        </div>

        <div class="art-card-actions">
          <button
            v-if="entry.trashed"
            type="button"
            class="kr-btn btn-info btn-sm"
            :disabled="gallery.isBusy"
            @click="gallery.restoreEntry(entry.id)"
          >
            <Icon name="kind-icon:undo" class="kr-icon-3" />
            Restore
          </button>
          <button
            v-else
            type="button"
            class="kr-btn btn-error btn-sm"
            :disabled="gallery.isBusy"
            @click="trash"
          >
            <Icon name="kind-icon:trash" class="kr-icon-3" />
            Trash
          </button>
        </div>

        <details class="art-card-details">
          <summary>Prompt and generation details</summary>
          <dl>
            <div>
              <dt>Prompt</dt>
              <dd>{{ entry.prompt || 'No prompt metadata.' }}</dd>
            </div>
            <div v-if="entry.negativePrompt">
              <dt>Negative</dt>
              <dd>{{ entry.negativePrompt }}</dd>
            </div>
            <div>
              <dt>Checkpoint</dt>
              <dd>{{ entry.resource.checkpoint || 'Unknown' }}</dd>
            </div>
            <div v-if="entry.resource.loras.length">
              <dt>LoRAs</dt>
              <dd>{{ entry.resource.loras.join(', ') }}</dd>
            </div>
            <div v-for="item in generationItems" :key="item.key">
              <dt>{{ item.key }}</dt>
              <dd>{{ item.value }}</dd>
            </div>
            <div v-if="entry.relativePath">
              <dt>File</dt>
              <dd class="break-all">{{ entry.relativePath }}</dd>
            </div>
          </dl>
        </details>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'

const gallery = useButterflyGalleryStore()
const cardRef = ref<HTMLElement | null>(null)
const notice = ref('')
const moving = ref(false)

const entry = computed(() => gallery.artCardEntry)

const fileName = computed(() => {
  const current = entry.value
  if (!current) return ''
  const path = current.relativePath ?? ''
  return path.split('/').pop() || `Artwork ${current.id}`
})

const matchLabel = computed(() => {
  switch (entry.value?.matchState) {
    case 'matched':
      return 'Provenance matched'
    case 'missing':
      return 'File missing'
    default:
      return 'Unmatched provenance'
  }
})

const collectionRefs = computed(() => {
  const current = entry.value
  if (!current) return []
  return current.collections.map(
    (slug) =>
      current.collectionRefs?.find((ref) => ref.slug === slug) ?? {
        id: -1,
        slug,
        label:
          gallery.collectionSummaries.find((c) => c.value === slug)?.label ??
          slug,
      },
  )
})

const generationItems = computed(() =>
  Object.entries(entry.value?.generationMetadata ?? {})
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    )
    .map(([key, value]) => ({ key, value: String(value) })),
)

const isBatchSelected = computed(
  () => !!entry.value && gallery.batchSelectedIds.includes(entry.value.id),
)

watch(
  () => entry.value?.id,
  async (id, previous) => {
    if (id === previous) return
    notice.value = ''
    if (id !== undefined && previous === undefined) {
      await nextTick()
      cardRef.value?.focus()
    }
  },
  { immediate: true },
)

function toggleBatch(): void {
  if (!entry.value) return
  if (!gallery.batchMode) gallery.setBatchMode(true)
  gallery.toggleBatchSelected(entry.value.id)
}

async function rate(rating: number | null): Promise<void> {
  if (!entry.value) return
  if (await gallery.setRating(entry.value.id, rating))
    notice.value = rating === null ? 'Rating cleared.' : `Rated ${rating}★.`
}

async function move(folder: string): Promise<void> {
  if (!entry.value) return
  moving.value = true
  try {
    const result = await gallery.moveEntriesToFolder([entry.value.id], folder)
    notice.value = result.moved.length
      ? `Moved to ${result.folder || 'the archive root'}.`
      : `Not moved: ${result.failures[0]?.message ?? 'unknown error'}`
  } finally {
    moving.value = false
  }
}

async function addCollection(
  choice: { value: string; label: string } | { newLabel: string },
): Promise<void> {
  if (!entry.value) return
  const added =
    'newLabel' in choice
      ? await gallery.addToNewCollection(entry.value.id, choice.newLabel)
      : await gallery.addToCollection(entry.value.id, choice.value)
  if (added)
    notice.value = `Added to ${'newLabel' in choice ? choice.newLabel : choice.label}.`
}

async function sortInto(binId: string): Promise<void> {
  const current = entry.value
  if (!current) return
  const outcome = await gallery.dropOnBin(binId, current.id)
  if (!outcome) return
  const next = gallery.selectedImageId
  if (next !== null && next !== current.id) gallery.openArtCard(next)
  else gallery.closeArtCard()
}

async function trash(): Promise<void> {
  const current = entry.value
  if (!current) return
  if (!(await gallery.trashEntry(current.id))) return
  const next = gallery.selectedImageId
  if (next !== null && next !== current.id) gallery.openArtCard(next)
  else notice.value = 'Moved to trash.'
}

function onKeydown(event: KeyboardEvent): void {
  event.stopPropagation()
  const target = event.target as HTMLElement
  const editing =
    target.tagName === 'INPUT' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'TEXTAREA'
  if (event.key === 'Escape') {
    event.preventDefault()
    gallery.closeArtCard()
    return
  }
  if (editing || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    gallery.stepArtCard(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    gallery.stepArtCard(1)
  } else if (/^[1-5]$/.test(event.key)) {
    event.preventDefault()
    void rate(Number(event.key))
  } else if (event.key === '0') {
    event.preventDefault()
    void rate(null)
  } else if (event.key === ' ') {
    event.preventDefault()
    toggleBatch()
  }
}
</script>

<style scoped>
.art-card-backdrop {
  position: absolute;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: clamp(0.5rem, 2vw, 1.5rem);
  background: color-mix(in oklch, var(--color-neutral) 62%, transparent);
  backdrop-filter: blur(6px);
}

.art-card {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 1fr);
  width: min(100%, 78rem);
  height: min(100%, 52rem);
  overflow: hidden;
  border: 4px solid color-mix(in oklch, var(--color-neutral) 80%, transparent);
  border-radius: 1.25rem;
  background: var(--color-base-100);
  color: var(--color-base-content);
  box-shadow: 0 24px 60px color-mix(in oklch, black 45%, transparent);
  outline: none;
}

.art-card-stage {
  position: relative;
  min-height: 0;
  background: color-mix(in oklch, var(--color-neutral) 92%, black);
}

.art-card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.art-card-image-trashed {
  opacity: 0.5;
  filter: grayscale(0.5);
}

.art-card-nav {
  position: absolute;
  top: 50%;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-100) 80%, transparent);
  color: var(--color-base-content);
  transform: translateY(-50%);
  backdrop-filter: blur(6px);
}

.art-card-nav-prev {
  left: 0.75rem;
}

.art-card-nav-next {
  right: 0.75rem;
}

.art-card-select {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-100) 85%, transparent);
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  backdrop-filter: blur(6px);
}

.art-card-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.9rem;
  overflow-y: auto;
  padding: 1rem 1.1rem 1.25rem;
}

.art-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.art-card-title {
  overflow: hidden;
  font-size: 1rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.art-card-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.art-card-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.art-card-label {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.6;
}

.art-card-stars {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.art-card-star {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.5rem;
  color: color-mix(in oklch, var(--color-base-content) 30%, transparent);
}

.art-card-star:hover:not(:disabled) {
  background: color-mix(in oklch, var(--color-warning) 18%, transparent);
}

.art-card-star-on {
  color: var(--color-warning);
}

.art-card-folder {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow-wrap: anywhere;
  font-size: 0.8rem;
  font-weight: 800;
}

.art-card-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.art-card-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.3rem 0.15rem 0.6rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-primary) 16%, transparent);
  color: var(--color-base-content);
  font-size: 0.72rem;
  font-weight: 800;
}

.art-card-chip-remove {
  display: grid;
  place-items: center;
  padding: 0.1rem;
  border-radius: 999px;
  opacity: 0.7;
}

.art-card-chip-remove:hover {
  opacity: 1;
}

.art-card-bins {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.art-card-bin {
  justify-content: flex-start;
}

.art-card-actions {
  display: flex;
  gap: 0.5rem;
}

.art-card-details {
  font-size: 0.75rem;
}

.art-card-details summary {
  cursor: pointer;
  font-weight: 800;
}

.art-card-details dl {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.art-card-details dt {
  font-weight: 800;
  opacity: 0.6;
}

.art-card-details dd {
  line-height: 1.35;
}

@media (max-width: 760px) {
  .art-card {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(12rem, 45%) minmax(0, 1fr);
    height: 100%;
  }
}
</style>
