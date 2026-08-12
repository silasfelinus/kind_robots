<!-- /components/reviews/review-list.vue -->
<!--
  The reviews already left on one object.

  Nothing displayed reviews. reaction-card.vue is a submit form and always was;
  the only feed, wonderlab/component-review-feed.vue, was deleted with the
  museum in #1766. So a review could be written and never read back -- which,
  together with allowReviews defaulting to false, is why nobody has ever seen
  one on this site.

  This is that feed with the museum taken out: generic over target type, and
  aware that a review may be authored by a Bot or a Character rather than a
  person. First-party commentary is labelled as such rather than dressed up as
  a user, because pretending a Character is an account is the one thing the
  authorship split exists to prevent.
-->
<template>
  <section class="grid gap-3">
    <header v-if="showHeader" class="flex flex-wrap items-baseline justify-between gap-2">
      <p class="text-xs font-black uppercase tracking-widest text-base-content/45">
        {{ headingLabel }}
      </p>
      <span v-if="averageRating" class="text-sm font-black text-warning">
        {{ averageRating }} ★
      </span>
    </header>

    <div v-if="loading && !reviews.length" class="flex min-h-16 items-center justify-center">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <p
      v-else-if="!reviews.length"
      class="rounded-2xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/55"
    >
      {{ emptyLabel }}
    </p>

    <article
      v-for="review in reviews"
      v-else
      :key="review.id"
      class="kr-panel flex items-start gap-3 p-3"
    >
      <div
        class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10"
      >
        <img
          v-if="avatarFor(review)"
          :src="avatarFor(review) as string"
          :alt="nameFor(review)"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <Icon
          v-else
          :name="authorOf(review) ? 'kind-icon:sparkles' : 'kind-icon:user'"
          class="size-5 text-primary"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-baseline gap-2">
          <p class="truncate font-black">{{ nameFor(review) }}</p>

          <span
            v-if="authorOf(review)"
            class="badge badge-primary badge-outline badge-xs"
            :title="`Written in character, published by a Kind Robots account`"
          >
            {{ authorOf(review)?.kind === 'BOT' ? 'bot' : 'character' }}
          </span>

          <span v-if="roleFor(review)" class="badge badge-outline badge-xs">
            {{ roleFor(review) }}
          </span>

          <span v-if="review.rating > 0" class="ml-auto shrink-0 text-sm font-black text-warning">
            {{ review.rating }} ★
          </span>
        </div>

        <p v-if="review.comment" class="mt-1 whitespace-pre-line text-sm">
          {{ review.comment }}
        </p>
        <p v-else class="mt-1 text-sm italic text-base-content/45">
          Reacted without a comment.
        </p>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useReactionStore, type ReactionTargetType } from '@/stores/reactionStore'
import {
  firstPartyReactionAuthor,
  type FirstPartyReactionAuthor,
} from '@/utils/reactions/firstPartyReactionAuthor'
import type { Reaction } from '~/prisma/generated/prisma/client'

/**
 * The relations the feed needs. They are optional because the store's cache is
 * shared with writes, which come back without them -- a freshly submitted
 * review still renders, just without its author chrome until the next fetch.
 */
type ReviewRow = Reaction & {
  User?: { id: number; username: string | null; avatarImage: string | null } | null
  AuthorBot?: { id: number; name: string | null; avatarImage: string | null; BotType: string | null } | null
  AuthorCharacter?: { id: number; name: string | null; imagePath: string | null; role: string | null } | null
}

const props = withDefaults(
  defineProps<{
    targetType: ReactionTargetType
    targetId: number
    showHeader?: boolean
    emptyLabel?: string
  }>(),
  {
    showHeader: true,
    emptyLabel: 'No reviews yet.',
  },
)

const reactionStore = useReactionStore()

const reviews = computed<ReviewRow[]>(() =>
  (
    reactionStore.getReactionsByTarget(props.targetType, props.targetId) as ReviewRow[]
  ).filter((review) => review.comment || review.rating > 0),
)

const loading = computed(
  () => reactionStore.loadingMap[`${props.targetType}:${props.targetId}`] === true,
)

const headingLabel = computed(() =>
  reviews.value.length === 1 ? '1 review' : `${reviews.value.length} reviews`,
)

const averageRating = computed(() => {
  const rated = reviews.value.filter((review) => review.rating > 0)
  if (!rated.length) return ''
  const total = rated.reduce((sum, review) => sum + review.rating, 0)
  return (total / rated.length).toFixed(1)
})

function authorOf(review: ReviewRow): FirstPartyReactionAuthor | null {
  return firstPartyReactionAuthor(review)
}

function nameFor(review: ReviewRow): string {
  return authorOf(review)?.name || review.User?.username || 'Someone'
}

function roleFor(review: ReviewRow): string {
  const role = authorOf(review)?.role || ''
  return role && role !== 'BOT' && role !== 'CHARACTER' ? role : ''
}

function avatarFor(review: ReviewRow): string | null {
  return authorOf(review)?.avatarImage || review.User?.avatarImage || null
}

function load() {
  if (!props.targetId) return
  reactionStore.fetchReactionsByTarget(props.targetType, props.targetId)
}

onMounted(load)
watch(() => [props.targetType, props.targetId], load)
</script>
