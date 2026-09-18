<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="kr-spinner-lg-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center font-normal"
      >
        <p class="kr-text-black-xl text-base-content">
          Administrator access required
        </p>
        <p class="kr-text-dim-sm mt-2">
          Butterfly Gallery curates private and mature art and is restricted to
          administrators.
        </p>
      </div>

      <template v-else>
        <header
          class="kr-toolbar flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <p class="kr-text-eyebrow text-xs tracking-widest text-primary">
              Private curation
            </p>
            <div class="kr-text-black-2xl mt-1">Butterfly Gallery</div>
            <p class="kr-text-dim-sm mt-1 max-w-2xl">
              Sort the incoming painting pile into your bins. Fixture data until
              art-archive's read contract lands.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="gallery.status !== 'intro'"
              type="button"
              class="kr-btn btn-outline"
              :disabled="gallery.isBusy"
              @click="gallery.replayIntro()"
            >
              <Icon name="kind-icon:play" class="kr-icon-4" />
              Replay intro
            </button>
            <button
              type="button"
              class="kr-btn btn-outline"
              :disabled="gallery.isBusy"
              @click="gallery.rescan()"
            >
              <span
                v-if="gallery.status === 'rescanning'"
                class="kr-spinner-xs"
              />
              <Icon v-else name="kind-icon:refresh" class="kr-icon-4" />
              Rescan
            </button>
          </div>
        </header>

        <div
          v-if="gallery.status === 'loading'"
          class="grid min-h-60 place-items-center kr-panel"
        >
          <span class="kr-spinner-lg-primary" />
        </div>

        <div
          v-else-if="gallery.status === 'intro'"
          class="kr-panel flex min-h-60 flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <p class="kr-text-black-xl">A trapdoor opens overhead&hellip;</p>
          <p class="kr-text-dim-sm max-w-md">
            Rainbow butterflies are carrying {{ gallery.pile.length }} pictures
            into the room. (Motion lands in a later milestone; this is the
            skippable placeholder.)
          </p>
          <button
            type="button"
            class="kr-btn-primary"
            @click="gallery.completeIntro()"
          >
            <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
            Skip to gallery
          </button>
        </div>

        <div
          v-else-if="gallery.status === 'error'"
          class="kr-note kr-note-error p-8 text-center"
        >
          <p class="kr-text-black-xl">
            {{ gallery.errorMessage || 'Something went wrong.' }}
          </p>
          <button
            type="button"
            class="kr-btn btn-outline mt-4"
            @click="gallery.clearError()"
          >
            Dismiss
          </button>
        </div>

        <template v-else>
          <section class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="kr-panel p-3">
              <p class="kr-text-eyebrow kr-text-dim-xs-45">In pile</p>
              <p class="kr-text-black-2xl mt-1">{{ gallery.remainingCount }}</p>
            </div>
            <div class="kr-panel p-3">
              <p class="kr-text-eyebrow kr-text-dim-xs-45">Selected</p>
              <p class="kr-text-black-2xl mt-1">
                {{
                  gallery.selectedEntry ? `#${gallery.selectedEntry.id}` : '—'
                }}
              </p>
            </div>
            <div class="kr-panel p-3">
              <p class="kr-text-eyebrow kr-text-dim-xs-45">Batch selected</p>
              <p class="kr-text-black-2xl mt-1">
                {{ gallery.batchSelectedCount }}
              </p>
            </div>
            <div class="kr-panel p-3">
              <p class="kr-text-eyebrow kr-text-dim-xs-45">State</p>
              <p class="kr-text-black-2xl mt-1 capitalize">
                {{ gallery.status }}
              </p>
            </div>
          </section>

          <p v-if="gallery.lastSaveMessage" class="kr-text-dim-sm">
            {{ gallery.lastSaveMessage }}
          </p>

          <div class="grid gap-3 lg:grid-cols-[1fr_2fr_1fr]">
            <section aria-label="Cleanup bins" class="space-y-2">
              <button
                v-for="bin in gallery.leftBins"
                :key="bin.id"
                type="button"
                class="kr-panel flex w-full items-center gap-2 p-3 text-left"
                :disabled="!gallery.selectedEntry || gallery.isBusy"
                @dragover.prevent
                @drop.prevent="onDrop(bin.id)"
                @click="onBinClick(bin.id)"
              >
                <Icon :name="bin.icon" class="kr-icon-4" />
                {{ bin.label }}
              </button>
            </section>

            <section
              aria-label="Selected image"
              class="kr-panel min-h-72 space-y-3 p-4"
            >
              <template v-if="gallery.selectedEntry">
                <img
                  :src="gallery.selectedEntry.displayPath"
                  :alt="gallery.selectedEntry.prompt || 'Untitled artwork'"
                  class="mx-auto max-h-64 rounded-box object-contain"
                  draggable="true"
                  @dragstart="gallery.startDrag(gallery.selectedEntry!.id)"
                  @dragend="gallery.cancelDrag()"
                />
                <dl class="kr-text-dim-sm grid grid-cols-2 gap-2">
                  <dt>Rating</dt>
                  <dd>{{ gallery.selectedEntry.rating ?? 'unrated' }}</dd>
                  <dt>Processed</dt>
                  <dd>{{ gallery.selectedEntry.processed ? 'yes' : 'no' }}</dd>
                  <dt>Match state</dt>
                  <dd>{{ gallery.selectedEntry.matchState }}</dd>
                  <dt>Prompt</dt>
                  <dd class="truncate">
                    {{ gallery.selectedEntry.prompt || '—' }}
                  </dd>
                </dl>
              </template>
              <p v-else class="kr-text-dim-sm text-center">Pile is empty.</p>
            </section>

            <section aria-label="Keep bins" class="space-y-2">
              <button
                v-for="bin in gallery.rightBins"
                :key="bin.id"
                type="button"
                class="kr-panel flex w-full items-center gap-2 p-3 text-left"
                :disabled="!gallery.selectedEntry || gallery.isBusy"
                @dragover.prevent
                @drop.prevent="onDrop(bin.id)"
                @click="onBinClick(bin.id)"
              >
                <Icon :name="bin.icon" class="kr-icon-4" />
                {{ bin.label }}
              </button>
            </section>
          </div>

          <section aria-label="Pile" class="flex flex-wrap gap-2">
            <button
              v-for="entry in gallery.visiblePile"
              :key="entry.id"
              type="button"
              class="kr-panel h-16 w-16 overflow-hidden p-0"
              :class="{
                'ring-2 ring-primary': entry.id === gallery.selectedImageId,
              }"
              draggable="true"
              @click="gallery.selectImage(entry.id)"
              @dragstart="gallery.startDrag(entry.id)"
              @dragend="gallery.cancelDrag()"
            >
              <img
                :src="entry.thumbnailPath"
                :alt="entry.prompt || 'Untitled artwork'"
                class="h-full w-full object-cover"
              />
            </button>
            <button
              v-if="gallery.hasMore"
              type="button"
              class="kr-btn btn-outline h-16"
              :disabled="gallery.isLoadingMore"
              @click="gallery.loadMore()"
            >
              <span v-if="gallery.isLoadingMore" class="kr-spinner-xs" />
              <span v-else>Load more</span>
            </button>
          </section>
        </template>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const gallery = useButterflyGalleryStore()
const ready = ref(false)

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await gallery.loadPile()
})

function onBinClick(binId: string): void {
  if (!gallery.selectedEntry) return
  gallery.dropOnBin(binId, gallery.selectedEntry.id)
}

function onDrop(binId: string): void {
  gallery.dropOnBin(binId)
}
</script>
