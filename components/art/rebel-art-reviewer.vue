<template>
  <section
    class="flex flex-col items-center gap-4 w-full max-w-3xl mx-auto p-2"
  >
    <div
      class="relative w-full rounded-2xl border bg-(--kr-surface-sunken) overflow-hidden shadow-lg flex items-center justify-center min-h-80"
    >
      <div v-if="store.isLoading && !store.candidate" class="p-8 text-center">
        <span class="loading loading-spinner loading-lg" />
      </div>
      <div v-else-if="store.candidate" class="relative w-full">
        <img
          :key="store.candidate.id"
          :src="store.candidate.src"
          :class="[
            'w-full max-h-[70vh] object-contain transition',
            covered ? 'blur-2xl' : '',
          ]"
          alt="Art waiting for your review"
        />
        <button
          v-if="covered"
          class="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-lg font-bold"
          @click="uncovered = true"
        >
          Mature art: tap to uncover
        </button>
      </div>
      <div v-else class="p-8 text-center space-y-2">
        <Icon name="ph:check-circle-bold" class="kr-icon-7" />
        <p class="text-lg font-bold">
          {{ store.errorMessage || "You've reviewed everything for now." }}
        </p>
        <p class="kr-text-dim-sm">
          New art arrives all the time. Come back soon.
        </p>
        <button class="btn btn-sm rounded-xl" @click="store.fetchNext()">
          Look again
        </button>
      </div>
    </div>

    <div v-if="store.candidate" class="w-full space-y-3">
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="entry in ART_REVIEW_RATINGS"
          :key="entry.rating"
          class="btn btn-primary flex-col h-auto py-3 rounded-2xl"
          :disabled="store.isSubmitting"
          @click="rate(entry.rating)"
        >
          <span class="flex">
            <Icon
              v-for="n in entry.rating"
              :key="n"
              name="ph:star-fill"
              class="w-4 h-4"
            />
          </span>
          <span class="text-xs sm:text-sm font-bold">{{ entry.label }}</span>
        </button>
      </div>

      <div class="flex items-center justify-between gap-2">
        <button class="kr-btn-ghost-md" @click="showComment = !showComment">
          {{ showComment ? 'Hide comment' : 'Add a comment' }}
        </button>
        <button
          class="kr-btn-ghost-md"
          :disabled="store.isSubmitting"
          @click="skipArt"
        >
          Skip this one
        </button>
      </div>

      <textarea
        v-if="showComment"
        v-model="comment"
        class="textarea textarea-bordered w-full rounded-2xl"
        :maxlength="ART_REVIEW_COMMENT_MAX"
        placeholder="Say something kind and honest (optional)"
        rows="2"
      />
    </div>

    <p v-if="store.errorMessage && store.candidate" class="text-error text-sm">
      {{ store.errorMessage }}
    </p>
    <p class="kr-text-dim-sm text-center">
      {{ store.sessionReviews }} reviewed this visit · Click record
      {{ userStore.clickRecord }} · Karma {{ userStore.user?.karma ?? 0 }}
      <span v-if="store.lastResult?.karmaAwarded">
        (+{{ store.lastResult.karmaAwarded }} karma, +1 click)
      </span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtReviewStore } from '@/stores/artReviewStore'
import { useUserStore } from '@/stores/userStore'
import {
  ART_REVIEW_COMMENT_MAX,
  ART_REVIEW_RATINGS,
  type ArtReviewRating,
} from '@/utils/artReview'

const store = useArtReviewStore()
const userStore = useUserStore()

const comment = ref('')
const showComment = ref(false)
const uncovered = ref(false)

const covered = computed(
  () => store.candidate?.isMature === true && !uncovered.value,
)

watch(
  () => store.candidate?.id,
  () => {
    comment.value = ''
    showComment.value = false
    uncovered.value = false
  },
)

async function rate(rating: ArtReviewRating) {
  await store.submitReview(rating, comment.value)
}

async function skipArt() {
  await store.skip()
}

onMounted(() => {
  if (!store.candidate) void store.fetchNext()
})
</script>
