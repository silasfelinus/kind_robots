<template>
  <main class="butterfly-gallery-page h-full min-h-0 overflow-hidden">
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
        <span
          v-for="index in 8"
          :key="index"
          class="runway-panel"
        />
      </div>

      <div class="drop-funnel" aria-hidden="true">
        <div class="drop-funnel-neck" />
        <div class="drop-funnel-bell" />
        <div class="drop-funnel-mouth" />
      </div>

      <div
        class="foreground-butterfly-slot"
        data-animation-slot="foreground-butterfly"
        aria-hidden="true"
      />

      <aside class="preset-rail" aria-label="Custom sorting presets">
        <button
          v-for="(bin, index) in gallery.leftBins"
          :key="bin.id"
          type="button"
          class="preset-bin"
          :class="presetClass(index)"
          :disabled="!gallery.selectedEntry || gallery.isBusy"
          @dragover.prevent
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
        <div class="art-display-inner">
          <template v-if="gallery.selectedEntry">
            <img
              :key="`${gallery.selectedEntry.id}-${dropSequence}`"
              :src="gallery.selectedEntry.displayPath"
              :alt="gallery.selectedEntry.prompt || 'Untitled artwork'"
              class="selected-art"
              :class="{ 'selected-art-drop': animateDrop }"
              draggable="true"
              @dragstart="gallery.startDrag(gallery.selectedEntry!.id)"
              @dragend="gallery.cancelDrag()"
              @animationend="animateDrop = false"
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
                <dd>{{ gallery.selectedEntry.resource.checkpoint || 'Unknown' }}</dd>
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
          type="button"
          class="right-action trash-action"
          :disabled="!gallery.selectedEntry || gallery.isBusy"
          @dragover.prevent
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

      <section class="art-pile" aria-label="Unsorted artwork pile">
        <button
          v-for="(entry, index) in pileEntries"
          :key="entry.id"
          type="button"
          class="pile-card"
          :class="{
            'pile-card-selected': entry.id === gallery.selectedImageId,
          }"
          :style="pileStyle(index, pileEntries.length)"
          draggable="true"
          :aria-label="`Select artwork ${entry.id}`"
          @click="gallery.selectImage(entry.id)"
          @dragstart="gallery.startDrag(entry.id)"
          @dragend="gallery.cancelDrag()"
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
        <button type="button" class="kr-btn btn-ghost btn-sm" @click="gallery.clearError()">
          Dismiss
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const gallery = useButterflyGalleryStore()
const ready = ref(false)
const infoExpanded = ref(false)
const dropSequence = ref(0)
const animateDrop = ref(false)

const pileEntries = computed(() => gallery.visiblePile.slice(0, 18))

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (!userStore.isAdmin) return

  await gallery.loadPile()

  if (gallery.status === 'intro') gallery.completeIntro()
})

watch(
  () => gallery.selectedImageId,
  async (nextId, previousId) => {
    infoExpanded.value = false
    if (nextId === null || nextId === previousId) return

    animateDrop.value = false
    dropSequence.value += 1
    await nextTick()
    animateDrop.value = true
  },
)

function onBinClick(binId: string): void {
  if (!gallery.selectedEntry) return
  gallery.dropOnBin(binId, gallery.selectedEntry.id)
}

function onDrop(binId: string): void {
  gallery.dropOnBin(binId)
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
  min-height: clamp(680px, calc(100vh - 4.5rem), 940px);
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
  background-size: 88px 88px, 88px 88px, 100% 100%;
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
  border: 5px solid color-mix(in oklch, var(--color-neutral) 82%, var(--color-info));
  border-radius: 1.5rem;
  background: color-mix(in oklch, var(--color-info) 18%, var(--color-base-100));
  box-shadow:
    inset 0 0 0 3px color-mix(in oklch, var(--color-info) 28%, transparent),
    0 10px 22px color-mix(in oklch, var(--color-neutral) 20%, transparent);
}

.runway-panel {
  border-right: 2px solid color-mix(in oklch, var(--color-neutral) 22%, transparent);
  background:
    linear-gradient(
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
  border-inline: 5px solid color-mix(in oklch, var(--color-warning-content) 58%, transparent);
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
  background:
    linear-gradient(
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
  border: 5px solid color-mix(in oklch, var(--color-warning-content) 58%, transparent);
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
  border: 6px solid color-mix(in oklch, var(--color-neutral) 82%, var(--color-info));
  border-radius: 1.15rem;
  background: color-mix(in oklch, var(--color-base-100) 88%, var(--color-info) 6%);
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

.selected-art-drop {
  animation: butterfly-gallery-drop 520ms cubic-bezier(0.22, 0.95, 0.36, 1);
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
  grid-template-rows: minmax(0, 1.9fr) minmax(72px, 0.72fr) minmax(72px, 0.72fr);
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
  background: color-mix(in oklch, var(--color-neutral) 90%, var(--color-base-100));
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
  box-shadow: 0 6px 16px color-mix(in oklch, var(--color-neutral) 26%, transparent);
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

@keyframes butterfly-gallery-drop {
  0% {
    opacity: 0;
    transform: translateY(-72%) scaleX(0.78) scaleY(2.45);
  }
  62% {
    opacity: 1;
    transform: translateY(0) scaleX(0.92) scaleY(1.18);
  }
  78% {
    transform: translateY(1%) scaleX(1.06) scaleY(0.82);
  }
  90% {
    transform: translateY(0) scaleX(0.98) scaleY(1.04);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scaleX(1) scaleY(1);
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
  .selected-art-drop {
    animation: none;
  }

  .blank-image-icon,
  .blank-orbit-one,
  .blank-orbit-two {
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
