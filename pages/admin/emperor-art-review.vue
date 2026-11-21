<template>
  <main class="kr-surface flex min-h-0 flex-col">
    <header-page-bar compact>
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <span class="font-bold">Emperor of Dust: private ending art</span>
        <NuxtLink class="kr-btn-ghost ml-auto" to="/play/emperor-of-dust">
          Return to game
        </NuxtLink>
      </div>
    </header-page-bar>

    <section
      v-if="!userStore.isAdmin"
      class="grid flex-1 place-items-center p-6"
    >
      <p>Administrator access required.</p>
    </section>
    <section v-else class="kr-scroll flex-1 space-y-4 overflow-y-auto p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-black">Eight original ending plates</h1>
          <p class="text-sm text-base-content/70">
            Private ArtImage previews are never published by this review.
            The delivery audit below also makes no writes.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="review.loading"
          @click="review.load()"
        >
          {{ review.loading ? 'Reading originals…' : 'Reload originals' }}
        </button>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          :disabled="review.auditing"
          @click="review.audit()"
        >
          {{ review.auditing ? 'Checking share…' : 'Audit delivery (dry-run)' }}
        </button>
      </div>

      <p v-if="review.errorMessage" class="text-error" role="alert">
        {{ review.errorMessage }}
      </p>
      <p class="text-xs text-base-content/70">
        Source thumbnails are from private DONE ArtImages, not from a queued
        request or a placeholder. An accessible source still needs editorial
        curation and separate authorized media delivery.
      </p>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="target in ENDING_REVIEW_TARGETS"
          :key="target.asset"
          class="overflow-hidden rounded-2xl border border-base-content/20 bg-base-200"
        >
          <div class="aspect-[16/9] bg-base-300">
            <img
              v-if="source(target.artImageId)?.preview"
              :src="source(target.artImageId)?.preview"
              :alt="target.asset.replace('endings/', '').replaceAll('-', ' ')"
              class="h-full w-full object-contain"
            />
            <div v-else class="grid h-full place-items-center p-3 text-sm">
              {{ source(target.artImageId)?.reason || 'Preview not loaded' }}
            </div>
          </div>
          <div class="space-y-1 p-3">
            <h2 class="font-bold">
              {{ target.asset.replace('endings/', '').replaceAll('-', ' ') }}
            </h2>
            <p class="text-xs text-base-content/70">
              ArtImage #{{ target.artImageId }}
              <span v-if="source(target.artImageId)?.artJobId">
                · ArtJob #{{ source(target.artImageId)?.artJobId }}
              </span>
            </p>
            <p v-if="source(target.artImageId)?.width" class="text-xs">
              {{ source(target.artImageId)?.width }} ×
              {{ source(target.artImageId)?.height }}
            </p>
            <p class="break-all text-xs text-base-content/60">
              {{ deliveryStatus(target.artImageId) }}
            </p>
          </div>
        </article>
      </div>
      <p class="text-sm text-base-content/75">
        No keeper verdict is stored here. Public-media writes and any rejected
        rerolls remain under the Conductor art-curation process.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUserStore } from '~/stores/userStore'
import {
  ENDING_REVIEW_TARGETS,
  useEmperorArtReviewStore,
} from '~/stores/emperorArtReviewStore'

const userStore = useUserStore()
const review = useEmperorArtReviewStore()
const previewById = computed(
  () => new Map(review.images.map((image) => [image.artImageId, image])),
)
const deliveryById = computed(
  () => new Map(review.delivery.map((row) => [row.artImageId, row])),
)

const source = (id: number) => previewById.value.get(id)
const deliveryStatus = (id: number): string => {
  const row = deliveryById.value.get(id)
  return row
    ? row.status + (row.reason ? ': ' + row.reason : '')
    : 'Delivery status not checked'
}

watch(
  () => userStore.isAdmin,
  (allowed) => {
    if (import.meta.client && allowed && !review.loaded && !review.loading) {
      void review.load()
    }
  },
  { immediate: true },
)
</script>
