<template>
  <main
    class="butterfly-gallery-page kr-stage kr-scroll h-full min-h-0 overflow-auto"
  >
    <div v-if="!ready" class="grid h-full min-h-80 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>

    <div
      v-else-if="!userStore.isAdmin"
      class="mx-auto mt-8 max-w-xl kr-note kr-note-error p-8 text-center font-normal"
    >
      <p class="kr-text-black-xl text-base-content">
        Administrator access required
      </p>
      <p class="kr-text-dim-sm mt-2">
        Butterfly Gallery curates private and mature art and is restricted to
        administrators.
      </p>
    </div>

    <div v-else class="butterfly-stage" :data-status="gallery.status">
      <div class="warehouse-backdrop" aria-hidden="true">
        <div class="warehouse-grid" />
        <div class="warehouse-catwalk warehouse-catwalk-left" />
        <div class="warehouse-catwalk warehouse-catwalk-right" />
        <div class="warehouse-floor" />
      </div>

      <div
        class="runway-slot"
        data-animation-slot="butterfly-runway"
        aria-hidden="true"
      >
        <span v-for="index in 8" :key="index" class="runway-panel" />
      </div>

      <div class="drop-funnel" aria-hidden="true">
        <div class="drop-funnel-neck" />
        <div class="drop-funnel-bell" />
        <div ref="funnelMouthRef" class="drop-funnel-mouth" />
      </div>

      <div
        class="foreground-butterfly-slot"
        data-animation-slot="foreground-butterfly"
        aria-hidden="true"
      />

      <div class="queue-toolbar">
        <button
          type="button"
          class="gallery-utility"
          :class="{ 'gallery-utility-active': showFilters }"
          title="Queue filters and folder/collection browsing"
          @click="showFilters = !showFilters"
        >
          <Icon name="kind-icon:sliders" class="kr-icon-4" />
          <span class="sr-only">Toggle queue filters</span>
        </button>
        <span class="queue-count">
          {{ gallery.remainingCount }} / {{ gallery.pile.length }}
        </span>
      </div>

      <section
        v-if="showFilters"
        class="queue-filter-panel kr-panel max-h-[60vh] overflow-y-auto"
        aria-label="Queue filters and folder/collection browsing"
      >
        <div class="queue-filter-row">
          <label class="queue-filter-field queue-filter-search">
            <Icon name="kind-icon:search" class="kr-icon-3 opacity-60" />
            <input
              v-model="searchModel"
              type="search"
              class="kr-input-sm"
              placeholder="Search prompt"
            />
          </label>

          <label class="queue-filter-field">
            <span class="kr-text-dim-xs">State</span>
            <select v-model="processedModel" class="kr-select-sm">
              <option value="all">All</option>
              <option value="unprocessed">Unprocessed</option>
              <option value="processed">Processed</option>
            </select>
          </label>

          <label class="queue-filter-field">
            <span class="kr-text-dim-xs">Rating</span>
            <select v-model="ratingModel" class="kr-select-sm">
              <option value="">Any</option>
              <option v-for="n in 5" :key="n" :value="String(n)">
                {{ n }}★
              </option>
            </select>
          </label>

          <label class="queue-filter-field">
            <span class="kr-text-dim-xs">Match</span>
            <select v-model="matchStateModel" class="kr-select-sm">
              <option value="all">Any</option>
              <option value="matched">Matched</option>
              <option value="unmatched">Unmatched</option>
              <option value="missing">Missing provenance</option>
            </select>
          </label>

          <label class="queue-filter-field">
            <span class="kr-text-dim-xs">Trash</span>
            <select v-model="trashViewModel" class="kr-select-sm">
              <option value="active">Active</option>
              <option value="trashed">Trashed</option>
              <option value="all">All</option>
            </select>
          </label>

          <button
            type="button"
            class="kr-btn btn-ghost btn-sm"
            @click="gallery.resetFilters()"
          >
            Reset
          </button>
        </div>

        <div class="queue-filter-groups">
          <div class="queue-filter-group">
            <p class="queue-filter-group-heading">
              <Icon name="kind-icon:folder" class="kr-icon-3" /> Folders
            </p>
            <div class="queue-filter-chips">
              <button
                v-for="folder in gallery.folderSummaries"
                :key="folder.value"
                type="button"
                class="queue-chip"
                :class="{
                  'queue-chip-active': gallery.filters.folder === folder.value,
                }"
                @click="gallery.toggleFolderFilter(folder.value)"
              >
                {{ folder.value }}
                <span class="queue-chip-count">{{ folder.count }}</span>
              </button>
              <p v-if="!gallery.folderSummaries.length" class="kr-text-dim-xs">
                No folders yet.
              </p>
            </div>
          </div>

          <div class="queue-filter-group">
            <p class="queue-filter-group-heading">
              <Icon name="kind-icon:tag" class="kr-icon-3" /> Collections
            </p>
            <div class="queue-filter-chips">
              <button
                v-for="collection in gallery.collectionSummaries"
                :key="collection.value"
                type="button"
                class="queue-chip"
                :class="{
                  'queue-chip-active':
                    gallery.filters.collection === collection.value,
                }"
                @click="gallery.toggleCollectionFilter(collection.value)"
              >
                {{ collection.value }}
                <span class="queue-chip-count">{{ collection.count }}</span>
              </button>
              <p
                v-if="!gallery.collectionSummaries.length"
                class="kr-text-dim-xs"
              >
                No collections yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside class="preset-rail" aria-label="Custom sorting presets">
        <button
          v-for="(bin, index) in gallery.leftBins"
          :key="bin.id"
          type="button"
          class="preset-bin"
          :class="[
            presetClass(index),
            {
              'gallery-drop-target-active': dragOverTarget === bin.id,
              'preset-bin-accepted': justAcceptedBinId === bin.id,
            },
          ]"
          :disabled="!gallery.selectedEntry || gallery.isBusy"
          @dragover.prevent="dragOverTarget = bin.id"
          @drop.prevent="onDrop(bin.id)"
          @click="onBinClick(bin.id)"
        >
          <Icon :name="bin.icon" class="preset-bin-icon" />
          <span class="preset-bin-copy">
            <strong>{{ presetRating(bin.label) }}</strong>
            <span>{{ presetLabel(bin.label) }}</span>
          </span>
          <Icon name="kind-icon:check" class="preset-bin-check" />
        </button>
      </aside>

      <section class="art-display" aria-label="Selected artwork">
        <div ref="frameBoxRef" class="art-display-inner">
          <template v-if="gallery.selectedEntry">
            <img
              v-show="!dropProxyActive"
              :key="`${gallery.selectedEntry.id}-${dropSequence}`"
              :src="gallery.selectedEntry.displayPath"
              :alt="gallery.selectedEntry.prompt || 'Untitled artwork'"
              class="selected-art"
              :class="{ 'selected-art-fade': fadeReveal }"
              draggable="true"
              @dragstart="gallery.startDrag(gallery.selectedEntry!.id)"
              @dragend="onDragEnd"
              @animationend="fadeReveal = false"
            />
          </template>
          <div
            v-else
            class="blank-state-loop"
            data-animation-slot="blank-state"
            aria-label="No artwork selected"
          >
            <div class="blank-orbit blank-orbit-one" aria-hidden="true" />
            <div class="blank-orbit blank-orbit-two" aria-hidden="true" />
            <Icon name="kind-icon:image" class="blank-image-icon" />
          </div>
        </div>
        <img
          v-if="dropProxyActive"
          ref="dropProxyRef"
          :src="dropProxySrc"
          :alt="dropProxyAlt"
          class="funnel-drop-proxy"
          aria-hidden="true"
        />
      </section>

      <aside class="right-rail">
        <section class="image-info-panel" aria-label="Image information">
          <div class="image-info-heading">
            <Icon name="kind-icon:info" class="kr-icon-4" />
            <span>Image Info</span>
          </div>

          <template v-if="gallery.selectedEntry">
            <dl class="image-info-list">
              <div>
                <dt>Rating</dt>
                <dd>
                  {{
                    gallery.selectedEntry.rating === null
                      ? 'Unrated'
                      : `${gallery.selectedEntry.rating}★`
                  }}
                </dd>
              </div>
              <div>
                <dt>Folder</dt>
                <dd>{{ gallery.selectedEntry.folder || '—' }}</dd>
              </div>
              <div>
                <dt>Checkpoint</dt>
                <dd>
                  {{ gallery.selectedEntry.resource.checkpoint || 'Unknown' }}
                </dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>
                  {{ gallery.selectedEntry.processed ? 'Done' : 'Unprocessed' }}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              class="image-info-details"
              @click="infoExpanded = !infoExpanded"
            >
              {{ infoExpanded ? 'Less' : 'Details' }}
              <Icon
                :name="
                  infoExpanded
                    ? 'kind-icon:chevron-up'
                    : 'kind-icon:chevron-down'
                "
                class="kr-icon-3"
              />
            </button>

            <div v-if="infoExpanded" class="image-info-expanded">
              <p>
                {{ gallery.selectedEntry.prompt || 'No prompt metadata.' }}
              </p>
              <p v-if="gallery.selectedEntry.resource.loras.length">
                LoRAs: {{ gallery.selectedEntry.resource.loras.join(', ') }}
              </p>
              <p v-if="gallery.selectedEntry.collections.length">
                Collections:
                {{ gallery.selectedEntry.collections.join(', ') }}
              </p>
            </div>
          </template>

          <p v-else class="kr-text-dim-sm">Select art from the pile.</p>
        </section>

        <button
          type="button"
          class="right-action cleanup-action"
          :disabled="true"
          title="Cleanup action wiring lands with the archive action adapter."
        >
          <Icon name="kind-icon:sparkles" class="right-action-icon" />
          <span>
            <strong>Cleanup</strong>
            <small>Enhancement tools</small>
          </span>
        </button>

        <button
          v-if="gallery.selectedEntry?.trashed"
          type="button"
          class="right-action restore-action"
          :disabled="gallery.isBusy"
          @click="gallery.restoreEntry(gallery.selectedEntry!.id)"
        >
          <Icon name="kind-icon:undo" class="right-action-icon" />
          <span>
            <strong>Restore</strong>
            <small>Return to the working pile</small>
          </span>
        </button>
        <button
          v-else
          type="button"
          class="right-action trash-action"
          :class="{
            'gallery-drop-target-active': dragOverTarget === 'trash',
            'preset-bin-accepted': justAcceptedBinId === 'trash',
          }"
          :disabled="!gallery.selectedEntry || gallery.isBusy"
          @dragover.prevent="dragOverTarget = 'trash'"
          @drop.prevent="onDrop('trash')"
          @click="onBinClick('trash')"
        >
          <Icon name="kind-icon:trash" class="right-action-icon" />
          <span>
            <strong>Trash</strong>
            <small>Remove from archive</small>
          </span>
        </button>
      </aside>

      <div
        class="robot-animation-slot"
        data-animation-slot="foreground-robot"
        aria-hidden="true"
      />

      <p v-if="!pileEntries.length" class="queue-empty-note kr-text-dim-sm">
        {{
          gallery.pile.length
            ? 'Nothing matches the current filters.'
            : 'The pile is empty.'
        }}
      </p>

      <section class="art-pile" aria-label="Unsorted artwork pile">
        <button
          v-for="(entry, index) in pileEntries"
          :key="entry.id"
          type="button"
          class="pile-card"
          :class="{
            'pile-card-selected': entry.id === gallery.selectedImageId,
            'pile-card-trashed': entry.trashed,
            'pile-card-pop': entry.id === justSelectedPileId,
          }"
          :style="pileStyle(index, pileEntries.length)"
          draggable="true"
          :aria-label="`Select artwork ${entry.id}`"
          @click="onSelectPileEntry(entry.id)"
          @dragstart="gallery.startDrag(entry.id)"
          @dragend="onDragEnd"
          @animationend="justSelectedPileId = null"
        >
          <img
            :src="entry.thumbnailPath"
            :alt="entry.prompt || 'Untitled artwork'"
          />
        </button>
      </section>

      <div class="gallery-utilities">
        <button
          type="button"
          class="gallery-utility"
          :disabled="gallery.isBusy"
          title="Rescan archive"
          @click="gallery.rescan()"
        >
          <span v-if="gallery.status === 'rescanning'" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:refresh" class="kr-icon-4" />
          <span class="sr-only">Rescan archive</span>
        </button>
        <button
          v-if="gallery.hasMore"
          type="button"
          class="gallery-utility"
          :disabled="gallery.isLoadingMore"
          title="Load more artwork"
          @click="gallery.loadMore()"
        >
          <span v-if="gallery.isLoadingMore" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:plus" class="kr-icon-4" />
          <span class="sr-only">Load more artwork</span>
        </button>
      </div>

      <div
        v-if="gallery.status === 'error'"
        class="stage-error kr-note kr-note-error"
      >
        <span>{{ gallery.errorMessage || 'Something went wrong.' }}</span>
        <button
          type="button"
          class="kr-btn btn-ghost btn-sm"
          @click="gallery.clearError()"
        >
          Dismiss
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'
import { useUserStore } from '@/stores/userStore'
import { computeButterflyFunnelDropPlan } from '@/stores/helpers/butterflyGalleryMotion'

const userStore = useUserStore()
const gallery = useButterflyGalleryStore()
const ready = ref(false)
const infoExpanded = ref(false)
const dropSequence = ref(0)
const fadeReveal = ref(false)
const showFilters = ref(false)

// -- Micro-interactions (butterfly-gallery/t-017) --------------------------
const funnelMouthRef = ref<HTMLElement | null>(null)
const frameBoxRef = ref<HTMLElement | null>(null)
const dropProxyRef = ref<HTMLImageElement | null>(null)
const dropProxyActive = ref(false)
const dropProxySrc = ref('')
const dropProxyAlt = ref('')
const dragOverTarget = ref<string | null>(null)
const justAcceptedBinId = ref<string | null>(null)
const justSelectedPileId = ref<number | null>(null)

let activeDropAnimation: Animation | null = null
let dropRunToken = 0
let acceptedBinTimer: ReturnType<typeof setTimeout> | null = null

const pileEntries = computed(() => gallery.visiblePile.slice(0, 18))

const searchModel = computed({
  get: () => gallery.filters.search,
  set: (value: string) => gallery.setFilter('search', value),
})

const processedModel = computed({
  get: () => gallery.filters.processed,
  set: (value: 'all' | 'processed' | 'unprocessed') =>
    gallery.setFilter('processed', value),
})

const ratingModel = computed({
  get: () =>
    gallery.filters.rating === null ? '' : String(gallery.filters.rating),
  set: (value: string) =>
    gallery.setFilter('rating', value ? Number(value) : null),
})

const matchStateModel = computed({
  get: () => gallery.filters.matchState,
  set: (value: 'all' | 'matched' | 'unmatched' | 'missing') =>
    gallery.setFilter('matchState', value),
})

const trashViewModel = computed({
  get: () => gallery.filters.trashView,
  set: (value: 'active' | 'trashed' | 'all') =>
    gallery.setFilter('trashView', value),
})

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (!userStore.isAdmin) return

  await gallery.loadPile()

  if (gallery.status === 'intro') gallery.completeIntro()

  window.addEventListener('resize', invalidateFunnelDrop)
  document.addEventListener('visibilitychange', invalidateFunnelDrop)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', invalidateFunnelDrop)
  document.removeEventListener('visibilitychange', invalidateFunnelDrop)
  if (acceptedBinTimer) clearTimeout(acceptedBinTimer)
  if (activeDropAnimation) activeDropAnimation.cancel()
})

watch(
  () => gallery.selectedImageId,
  async (nextId, previousId) => {
    infoExpanded.value = false
    if (nextId === null || nextId === previousId) return

    dropSequence.value += 1
    const entry = gallery.entryById(nextId)
    await runFunnelDrop(
      entry?.displayPath ?? '',
      entry?.prompt || 'Untitled artwork',
    )
  },
)

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Latest-selection-wins: a new selection, an unmount, a resize, or the tab
 * going hidden all cancel any in-flight proxy and land cleanly on the
 * ordinary steady-state DOM (no stuck proxy), per
 * MOTION-STORYBOARD.md's interruption rules. */
function invalidateFunnelDrop(): void {
  if (!dropProxyActive.value) return
  dropRunToken += 1
  if (activeDropAnimation) {
    activeDropAnimation.cancel()
    activeDropAnimation = null
  }
  dropProxyActive.value = false
}

/** Animates the selected-image entry from the drop-funnel mouth to the
 * central frame via a transient fixed-position proxy (Emerge/Stretch/Snap/
 * Settle, see stores/helpers/butterflyGalleryMotion.ts), falling back to a
 * brief opacity/scale fade on the real image under reduced motion or when
 * the funnel/frame geometry isn't usable. */
async function runFunnelDrop(src: string, alt: string): Promise<void> {
  const runToken = ++dropRunToken
  if (activeDropAnimation) {
    activeDropAnimation.cancel()
    activeDropAnimation = null
  }

  let frameRect: DOMRect | null = null
  let plan: ReturnType<typeof computeButterflyFunnelDropPlan> = null

  if (
    !prefersReducedMotion() &&
    typeof document !== 'undefined' &&
    !document.hidden &&
    funnelMouthRef.value &&
    frameBoxRef.value
  ) {
    const funnelRect = funnelMouthRef.value.getBoundingClientRect()
    frameRect = frameBoxRef.value.getBoundingClientRect()
    plan = computeButterflyFunnelDropPlan(funnelRect, frameRect)
  }

  if (!plan || !frameRect) {
    dropProxyActive.value = false
    fadeReveal.value = false
    await nextTick()
    if (runToken !== dropRunToken) return
    fadeReveal.value = true
    return
  }

  dropProxySrc.value = src
  dropProxyAlt.value = alt
  dropProxyActive.value = true
  await nextTick()
  if (runToken !== dropRunToken) return

  const proxyEl = dropProxyRef.value
  if (!proxyEl) {
    dropProxyActive.value = false
    return
  }

  proxyEl.style.left = `${frameRect.left}px`
  proxyEl.style.top = `${frameRect.top}px`
  proxyEl.style.width = `${frameRect.width}px`
  proxyEl.style.height = `${frameRect.height}px`
  proxyEl.style.transformOrigin = plan.transformOrigin

  const animation = proxyEl.animate(
    plan.keyframes.map((keyframe) => ({
      offset: keyframe.offset,
      transform: keyframe.transform,
    })),
    {
      duration: plan.durationMs,
      easing: 'cubic-bezier(0.22, 0.95, 0.36, 1)',
      fill: 'forwards',
    },
  )
  activeDropAnimation = animation

  try {
    await animation.finished
  } catch {
    // Cancelled by a newer selection, unmount, resize, or tab-hide -- the
    // canceller already restored a clean state.
    return
  }

  if (runToken !== dropRunToken) return
  activeDropAnimation = null
  dropProxyActive.value = false
}

function flashBinAccepted(binId: string): void {
  if (acceptedBinTimer) clearTimeout(acceptedBinTimer)
  justAcceptedBinId.value = binId
  acceptedBinTimer = setTimeout(() => {
    justAcceptedBinId.value = null
    acceptedBinTimer = null
  }, 380)
}

function onSelectPileEntry(entryId: number): void {
  gallery.selectImage(entryId)
  justSelectedPileId.value = entryId
}

function onDragEnd(): void {
  gallery.cancelDrag()
  dragOverTarget.value = null
}

async function onBinClick(binId: string): Promise<void> {
  if (!gallery.selectedEntry) return
  const outcome = await gallery.dropOnBin(binId, gallery.selectedEntry.id)
  if (outcome) flashBinAccepted(outcome.binId)
}

async function onDrop(binId: string): Promise<void> {
  dragOverTarget.value = null
  const outcome = await gallery.dropOnBin(binId)
  if (outcome) flashBinAccepted(outcome.binId)
}

function presetClass(index: number): string {
  return [
    'preset-bin-error',
    'preset-bin-warning',
    'preset-bin-accent',
    'preset-bin-success',
    'preset-bin-info',
  ][index % 5] as string
}

function presetRating(label: string): string {
  const match = label.match(/\d★/)
  return match?.[0] ?? '★'
}

function presetLabel(label: string): string {
  return label.replace(/^\d★\s*\+?\s*/, '')
}

function pileStyle(index: number, total: number): Record<string, string> {
  const columns = Math.max(total - 1, 1)
  const left = 4 + (index / columns) * 84
  const lift = (index % 4) * 18
  const rotation = [-10, 6, -4, 9, -7, 3][index % 6] ?? 0

  return {
    left: `${left}%`,
    bottom: `${46 + lift}px`,
    transform: `translateX(-50%) rotate(${rotation}deg)`,
    zIndex: String(20 + index),
  }
}
</script>

<style scoped>
.butterfly-gallery-page {
  background: var(--color-base-200);
}

.butterfly-stage {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 680px;
  overflow: hidden;
  background: var(--color-base-200);
  color: var(--color-base-content);
}

.warehouse-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    linear-gradient(
      90deg,
      color-mix(in oklch, var(--color-info) 10%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      0deg,
      color-mix(in oklch, var(--color-info) 8%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      180deg,
      color-mix(in oklch, var(--color-info) 16%, var(--color-base-100)) 0 56%,
      var(--color-base-200) 56% 100%
    );
  background-size:
    88px 88px,
    88px 88px,
    100% 100%;
}

.warehouse-grid {
  position: absolute;
  inset: 6% 7% 18%;
  border: 2px solid color-mix(in oklch, var(--color-neutral) 30%, transparent);
  border-bottom: 0;
  background:
    linear-gradient(
      90deg,
      transparent 49.7%,
      color-mix(in oklch, var(--color-neutral) 13%, transparent) 50%,
      transparent 50.3%
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 13%,
      color-mix(in oklch, var(--color-neutral) 10%, transparent) 13% 13.2%
    );
  opacity: 0.9;
}

.warehouse-catwalk {
  position: absolute;
  top: 28%;
  width: 26%;
  height: 8px;
  background: var(--color-warning);
  box-shadow:
    0 -9px 0 color-mix(in oklch, var(--color-neutral) 78%, transparent),
    0 8px 0 color-mix(in oklch, var(--color-neutral) 55%, transparent);
  opacity: 0.72;
}

.warehouse-catwalk::before {
  content: '';
  position: absolute;
  inset: -44px 0 8px;
  background: repeating-linear-gradient(
    90deg,
    transparent 0 38px,
    color-mix(in oklch, var(--color-warning) 80%, transparent) 38px 43px
  );
}

.warehouse-catwalk-left {
  left: 0;
}

.warehouse-catwalk-right {
  right: 0;
}

.warehouse-floor {
  position: absolute;
  inset: 56% 0 0;
  background:
    linear-gradient(
      90deg,
      transparent 49.7%,
      color-mix(in oklch, var(--color-warning) 38%, transparent) 50%,
      transparent 50.3%
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 14%,
      color-mix(in oklch, var(--color-neutral) 8%, transparent) 14% 14.2%
    ),
    linear-gradient(
      180deg,
      color-mix(in oklch, var(--color-base-100) 85%, var(--color-info) 5%),
      var(--color-base-200)
    );
}

.runway-slot {
  position: absolute;
  z-index: 2;
  top: 3%;
  left: 9%;
  right: 9%;
  height: 17%;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  overflow: hidden;
  border: 5px solid
    color-mix(in oklch, var(--color-neutral) 82%, var(--color-info));
  border-radius: 1.5rem;
  background: color-mix(in oklch, var(--color-info) 18%, var(--color-base-100));
  box-shadow:
    inset 0 0 0 3px color-mix(in oklch, var(--color-info) 28%, transparent),
    0 10px 22px color-mix(in oklch, var(--color-neutral) 20%, transparent);
}

.runway-panel {
  border-right: 2px solid
    color-mix(in oklch, var(--color-neutral) 22%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--color-info) 10%, transparent),
    transparent
  );
}

.drop-funnel {
  position: absolute;
  z-index: 7;
  top: -2%;
  left: 50%;
  width: clamp(150px, 13vw, 230px);
  height: 28%;
  transform: translateX(-50%);
  pointer-events: none;
}

.drop-funnel-neck {
  position: absolute;
  top: 0;
  left: 35%;
  width: 30%;
  height: 40%;
  border-inline: 5px solid
    color-mix(in oklch, var(--color-warning-content) 58%, transparent);
  background: var(--color-warning);
}

.drop-funnel-bell {
  position: absolute;
  top: 31%;
  left: 4%;
  width: 92%;
  height: 61%;
  clip-path: polygon(34% 0, 66% 0, 100% 100%, 0 100%);
  border-radius: 0 0 44% 44%;
  background: linear-gradient(
    90deg,
    color-mix(in oklch, var(--color-warning) 78%, var(--color-base-100)),
    var(--color-warning) 50%,
    color-mix(in oklch, var(--color-warning) 76%, var(--color-neutral)) 100%
  );
  filter: drop-shadow(
    0 8px 5px color-mix(in oklch, var(--color-neutral) 28%, transparent)
  );
}

.drop-funnel-mouth {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 18%;
  border: 5px solid
    color-mix(in oklch, var(--color-warning-content) 58%, transparent);
  border-radius: 50%;
  background: color-mix(in oklch, var(--color-neutral) 88%, black);
}

.preset-rail {
  position: absolute;
  z-index: 10;
  top: 25%;
  bottom: 17%;
  left: 2.8%;
  width: clamp(180px, 20vw, 310px);
  display: grid;
  grid-template-rows: repeat(5, minmax(0, 1fr));
  gap: clamp(6px, 0.7vw, 12px);
}

.preset-bin {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  min-height: 0;
  gap: 0.65rem;
  padding: clamp(0.55rem, 1vw, 1rem);
  border: 4px solid color-mix(in oklch, var(--color-neutral) 78%, transparent);
  border-radius: 0.85rem;
  box-shadow:
    inset 0 0 0 2px color-mix(in oklch, white 20%, transparent),
    0 7px 0 color-mix(in oklch, var(--color-neutral) 34%, transparent);
  text-align: left;
  transition:
    transform 120ms ease,
    filter 120ms ease;
}

.preset-bin:hover:not(:disabled),
.preset-bin:focus-visible:not(:disabled) {
  transform: translateX(6px);
  filter: brightness(1.05);
}

.preset-bin:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.gallery-drop-target-active {
  outline: 3px solid var(--color-base-100);
  outline-offset: -3px;
  filter: brightness(1.15);
}

.preset-bin-accepted {
  animation: butterfly-gallery-bin-accept 380ms ease;
}

.preset-bin-error {
  background: var(--color-error);
  color: var(--color-error-content);
}

.preset-bin-warning {
  background: color-mix(in oklch, var(--color-warning) 72%, var(--color-error));
  color: var(--color-warning-content);
}

.preset-bin-accent {
  background: var(--color-warning);
  color: var(--color-warning-content);
}

.preset-bin-success {
  background: var(--color-success);
  color: var(--color-success-content);
}

.preset-bin-info {
  background: var(--color-info);
  color: var(--color-info-content);
}

.preset-bin-icon {
  width: clamp(1.25rem, 2.2vw, 2rem);
  height: clamp(1.25rem, 2.2vw, 2rem);
}

.preset-bin-copy {
  min-width: 0;
}

.preset-bin-copy strong,
.preset-bin-copy span {
  display: block;
}

.preset-bin-copy strong {
  font-size: clamp(1rem, 1.7vw, 1.45rem);
  font-weight: 900;
  line-height: 1;
}

.preset-bin-copy span {
  margin-top: 0.25rem;
  overflow: hidden;
  font-size: clamp(0.68rem, 1vw, 0.95rem);
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-bin-check {
  width: 1.2rem;
  height: 1.2rem;
  opacity: 0.75;
}

.art-display {
  position: absolute;
  z-index: 8;
  top: 28%;
  left: 26%;
  right: 25%;
  bottom: 19%;
  min-width: 0;
}

.art-display-inner {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 6px solid
    color-mix(in oklch, var(--color-neutral) 82%, var(--color-info));
  border-radius: 1.15rem;
  background: color-mix(
    in oklch,
    var(--color-base-100) 88%,
    var(--color-info) 6%
  );
  box-shadow:
    inset 0 0 0 3px color-mix(in oklch, var(--color-info) 18%, transparent),
    0 16px 30px color-mix(in oklch, var(--color-neutral) 28%, transparent);
}

.selected-art {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: color-mix(in oklch, var(--color-neutral) 92%, black);
  transform-origin: 50% 0;
}

.selected-art-fade {
  animation: butterfly-gallery-fade 160ms ease;
}

.funnel-drop-proxy {
  position: fixed;
  z-index: 55;
  object-fit: contain;
  background: color-mix(in oklch, var(--color-neutral) 92%, black);
  pointer-events: none;
  will-change: transform;
}

.blank-state-loop {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  color: color-mix(in oklch, var(--color-info) 62%, var(--color-base-content));
  background:
    radial-gradient(
      circle at 50% 45%,
      color-mix(in oklch, var(--color-info) 17%, transparent),
      transparent 42%
    ),
    var(--color-base-100);
}

.blank-image-icon {
  z-index: 2;
  width: clamp(5rem, 9vw, 8rem);
  height: clamp(5rem, 9vw, 8rem);
  opacity: 0.45;
  animation: blank-state-bob 3.8s ease-in-out infinite;
}

.blank-orbit {
  position: absolute;
  width: 42%;
  aspect-ratio: 2 / 1;
  border: 3px solid color-mix(in oklch, var(--color-info) 30%, transparent);
  border-radius: 50%;
}

.blank-orbit-one {
  animation: blank-orbit-one 6s linear infinite;
}

.blank-orbit-two {
  width: 58%;
  opacity: 0.6;
  animation: blank-orbit-two 8s linear infinite reverse;
}

.right-rail {
  position: absolute;
  z-index: 10;
  top: 25%;
  right: 2.8%;
  bottom: 17%;
  width: clamp(190px, 20vw, 300px);
  display: grid;
  grid-template-rows: minmax(0, 1.9fr) minmax(72px, 0.72fr) minmax(
      72px,
      0.72fr
    );
  gap: clamp(7px, 0.8vw, 12px);
}

.image-info-panel,
.right-action {
  border: 4px solid color-mix(in oklch, var(--color-neutral) 80%, transparent);
  border-radius: 0.9rem;
  box-shadow:
    inset 0 0 0 2px color-mix(in oklch, white 14%, transparent),
    0 7px 0 color-mix(in oklch, var(--color-neutral) 32%, transparent);
}

.image-info-panel {
  min-height: 0;
  overflow: auto;
  padding: clamp(0.7rem, 1vw, 1rem);
  background: color-mix(
    in oklch,
    var(--color-neutral) 90%,
    var(--color-base-100)
  );
  color: var(--color-neutral-content);
}

.image-info-heading {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: clamp(0.8rem, 1vw, 1rem);
  font-weight: 900;
}

.image-info-list {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.7rem;
  font-size: clamp(0.65rem, 0.88vw, 0.8rem);
}

.image-info-list > div {
  display: grid;
  grid-template-columns: 42% 58%;
  gap: 0.35rem;
}

.image-info-list dt {
  opacity: 0.62;
}

.image-info-list dd {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-info-details {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.7rem;
  font-size: 0.72rem;
  font-weight: 800;
  opacity: 0.85;
}

.image-info-expanded {
  margin-top: 0.6rem;
  font-size: 0.7rem;
  line-height: 1.35;
  opacity: 0.78;
}

.image-info-expanded p + p {
  margin-top: 0.35rem;
}

.right-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: clamp(0.65rem, 1vw, 1rem);
  text-align: left;
  transition:
    transform 120ms ease,
    filter 120ms ease;
}

.right-action:hover:not(:disabled),
.right-action:focus-visible:not(:disabled) {
  transform: translateX(-5px);
  filter: brightness(1.05);
}

.right-action:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.cleanup-action {
  background: var(--color-secondary);
  color: var(--color-secondary-content);
}

.trash-action {
  background: var(--color-error);
  color: var(--color-error-content);
}

.right-action-icon {
  width: clamp(1.5rem, 2.5vw, 2.3rem);
  height: clamp(1.5rem, 2.5vw, 2.3rem);
}

.right-action strong,
.right-action small {
  display: block;
}

.right-action strong {
  font-size: clamp(0.9rem, 1.2vw, 1.2rem);
  font-weight: 900;
}

.right-action small {
  margin-top: 0.15rem;
  font-size: 0.65rem;
  font-weight: 700;
  opacity: 0.75;
}

.robot-animation-slot {
  position: absolute;
  z-index: 12;
  right: 14%;
  bottom: 5%;
  width: clamp(110px, 14vw, 210px);
  height: clamp(130px, 19vw, 260px);
  pointer-events: none;
}

.foreground-butterfly-slot {
  position: absolute;
  z-index: 24;
  top: 20%;
  left: 5%;
  width: clamp(90px, 10vw, 150px);
  height: clamp(80px, 9vw, 130px);
  pointer-events: none;
}

.art-pile {
  position: absolute;
  z-index: 20;
  left: 18%;
  right: 16%;
  bottom: -8.2rem;
  height: 21rem;
  pointer-events: none;
}

.pile-card {
  position: absolute;
  width: clamp(92px, 9.5vw, 154px);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 5px solid var(--color-base-100);
  border-radius: 0.35rem;
  background: var(--color-base-100);
  box-shadow: 0 6px 16px
    color-mix(in oklch, var(--color-neutral) 26%, transparent);
  pointer-events: auto;
  transition:
    translate 140ms ease,
    filter 140ms ease;
}

.pile-card:hover,
.pile-card:focus-visible {
  translate: 0 -14px;
  filter: brightness(1.05);
}

.pile-card-selected {
  outline: 4px solid var(--color-primary);
  outline-offset: 3px;
}

.pile-card-pop {
  /* Standalone `scale`, not `transform` -- pileStyle() sets `transform`
     inline for layout (translateX/rotate), and an `animation` on that same
     property would clobber it during the pop. `scale` composes with
     `transform` independently. */
  animation: butterfly-gallery-pile-pop 260ms ease;
}

.pile-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-utilities {
  position: absolute;
  z-index: 35;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  gap: 0.35rem;
}

.gallery-utility {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 1px solid var(--color-base-300);
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-100) 88%, transparent);
  color: var(--color-base-content);
  backdrop-filter: blur(8px);
}

.gallery-utility-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.queue-toolbar {
  position: absolute;
  z-index: 35;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.queue-count {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-100) 88%, transparent);
  font-size: 0.7rem;
  font-weight: 800;
  backdrop-filter: blur(8px);
}

.queue-filter-panel {
  position: absolute;
  z-index: 40;
  top: 3.6rem;
  left: 1rem;
  right: 1rem;
  padding: 0.85rem;
  border-radius: 1rem;
  background: color-mix(in oklch, var(--color-base-100) 96%, transparent);
  backdrop-filter: blur(10px);
}

.queue-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.6rem;
}

.queue-filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.7rem;
}

.queue-filter-search {
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
}

.queue-filter-groups {
  display: grid;
  gap: 0.7rem;
  margin-top: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.queue-filter-group-heading {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  opacity: 0.75;
}

.queue-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.queue-chip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--color-base-300);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}

.queue-chip-active {
  border-color: var(--color-primary);
  background: color-mix(in oklch, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
}

.queue-chip-count {
  opacity: 0.6;
}

.queue-empty-note {
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: 3.5rem;
  transform: translateX(-50%);
  text-align: center;
}

.restore-action {
  background: var(--color-info);
  color: var(--color-info-content);
}

.pile-card-trashed {
  opacity: 0.6;
  filter: grayscale(0.4);
}

.stage-error {
  position: absolute;
  z-index: 50;
  top: 1rem;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transform: translateX(-50%);
}

@keyframes butterfly-gallery-fade {
  from {
    opacity: 0;
    scale: 0.98;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

@keyframes butterfly-gallery-bin-accept {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes butterfly-gallery-pile-pop {
  0%,
  100% {
    scale: 1;
  }
  40% {
    scale: 1.14;
  }
}

@keyframes blank-state-bob {
  0%,
  100% {
    transform: translateY(-5px) rotate(-2deg);
  }
  50% {
    transform: translateY(6px) rotate(2deg);
  }
}

@keyframes blank-orbit-one {
  to {
    transform: rotate(360deg) scaleX(1.04);
  }
}

@keyframes blank-orbit-two {
  to {
    transform: rotate(360deg) scaleX(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .blank-image-icon,
  .blank-orbit-one,
  .blank-orbit-two,
  .pile-card-pop,
  .preset-bin-accepted {
    animation: none;
  }

  .preset-bin,
  .right-action,
  .pile-card {
    transition: none;
  }
}

@media (max-width: 900px) {
  .butterfly-stage {
    min-height: 720px;
  }

  .preset-rail {
    left: 1%;
    width: 22%;
  }

  .art-display {
    left: 24%;
    right: 23%;
  }

  .right-rail {
    right: 1%;
    width: 21%;
  }

  .preset-bin-copy span,
  .right-action small {
    display: none;
  }

  .art-pile {
    left: 12%;
    right: 12%;
  }
}
</style>
