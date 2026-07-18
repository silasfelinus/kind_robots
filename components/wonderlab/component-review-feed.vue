<!-- /components/wonderlab/component-review-feed.vue -->
<template>
  <section class="rounded-3xl border border-base-300 bg-base-200/60 p-4">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-primary">
          Museum Reviews
        </p>
        <h3 class="mt-1 text-xl font-black">
          {{ targetTitle || `Component #${componentId}` }}
        </h3>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span class="font-black text-warning">{{ averageRatingLabel }}</span>
          <span aria-hidden="true" class="text-warning">★</span>
          <span class="text-base-content/55">
            {{ reviewCountLabel }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl"
        :disabled="isLoading"
        @click="loadReviews(true)"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-4" />
        Refresh
      </button>
    </header>

    <div
      v-if="errorMessage"
      class="mt-4 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-else-if="isLoading && !reviews.length"
      class="mt-4 flex min-h-32 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
    >
      <span class="loading loading-spinner loading-md text-primary" />
    </div>

    <div
      v-else-if="!reviews.length"
      class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
    >
      <Icon name="kind-icon:comment" class="mx-auto size-10 text-base-content/25" />
      <p class="mt-2 font-black">No reviews yet</p>
      <p class="mt-1 text-sm text-base-content/55">
        This exhibit is waiting for its first visitor note.
      </p>
    </div>

    <div v-else class="mt-4 grid gap-3">
      <article
        v-for="review in reviews"
        :key="review.id"
        class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10"
          >
            <img
              v-if="review.User?.avatarImage"
              :src="normalizeImagePath(review.User.avatarImage)"
              :alt="authorName(review)"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <Icon v-else name="kind-icon:user" class="size-5 text-primary" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate font-black">{{ authorName(review) }}</p>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    v-if="review.User?.Role"
                    class="badge badge-outline badge-xs"
                  >
                    {{ review.User.Role }}
                  </span>
                  <span class="text-xs text-base-content/45">
                    {{ formatDate(review.createdAt) }}
                  </span>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <span
                  class="badge badge-sm"
                  :class="reactionBadgeClass(review.reactionType)"
                >
                  {{ formatReactionType(review.reactionType) }}
                </span>
                <span
                  v-if="review.rating > 0"
                  class="font-black text-warning"
                  :aria-label="`${review.rating} out of 5 stars`"
                >
                  {{ review.rating }} ★
                </span>
              </div>
            </div>

            <p
              v-if="review.comment"
              class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75"
            >
              {{ review.comment }}
            </p>
            <p v-else class="mt-3 text-sm italic text-base-content/40">
              No written comment.
            </p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Reaction } from '~/prisma/generated/prisma/client'
import { useReactionStore } from '@/stores/reactionStore'

type PublicReviewAuthor = {
  id: number
  username: string | null
  name: string | null
  avatarImage: string | null
  Role: string | null
  isPublic: boolean
}

type PublicComponentReview = Reaction & {
  User?: PublicReviewAuthor | null
}

const props = withDefaults(
  defineProps<{
    componentId: number
    targetTitle?: string
  }>(),
  {
    targetTitle: '',
  },
)

const reactionStore = useReactionStore()
const isLoading = ref(false)
const errorMessage = ref('')

const reviews = computed<PublicComponentReview[]>(() => {
  return [...reactionStore.getReactionsByComponentId(props.componentId)]
    .map((reaction) => reaction as PublicComponentReview)
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
})

const reviewCountLabel = computed(() => {
  const count = reviews.value.length
  return `${count} ${count === 1 ? 'review' : 'reviews'}`
})

const averageRating = computed(() => {
  const rated = reviews.value.filter((review) => review.rating > 0)
  if (!rated.length) return 0

  return rated.reduce((total, review) => total + review.rating, 0) / rated.length
})

const averageRatingLabel = computed(() => {
  return averageRating.value ? averageRating.value.toFixed(1) : '—'
})

async function loadReviews(force = false): Promise<void> {
  if (!Number.isInteger(props.componentId) || props.componentId <= 0) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await reactionStore.fetchReactionsByComponentId(props.componentId, force)

    if (reactionStore.lastError) {
      throw new Error(reactionStore.lastError)
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to load component reviews.'
  } finally {
    isLoading.value = false
  }
}

function authorName(review: PublicComponentReview): string {
  return (
    review.User?.name?.trim() ||
    review.User?.username?.trim() ||
    (review.userId ? `User #${review.userId}` : 'Anonymous visitor')
  )
}

function normalizeImagePath(value: string): string {
  if (value.startsWith('/') || value.startsWith('http')) return value
  return `/images/${value}`
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatReactionType(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function reactionBadgeClass(value: string): string {
  switch (value) {
    case 'LOVED':
    case 'CLAPPED':
      return 'badge-success'
    case 'BOOED':
    case 'HATED':
      return 'badge-error'
    case 'FLAGGED':
      return 'badge-warning'
    default:
      return 'badge-ghost'
  }
}

watch(
  () => props.componentId,
  () => {
    void loadReviews()
  },
  { immediate: true },
)
</script>
