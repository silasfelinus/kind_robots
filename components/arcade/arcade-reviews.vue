<template>
  <section
    :class="
      compact
        ? 'border-t border-base-content/15 pt-4'
        : 'kr-panel mt-5 rounded-2xl border border-primary/20 p-4 sm:p-6'
    "
    :aria-label="'Reviews for ' + title"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3"
      :class="compact ? 'mb-3' : 'mb-4'"
    >
      <div>
        <p
          class="text-xs font-bold uppercase tracking-widest"
          :class="compact ? 'opacity-70' : 'text-primary'"
        >
          Player reviews
        </p>
        <h2 v-if="!compact" class="text-xl font-black">{{ title }}</h2>
      </div>
      <p class="font-bold text-warning" :class="{ 'text-sm': compact }">
        {{
          summary?.count
            ? summary.average.toFixed(1) + ' ★ (' + summary.count + ')'
            : 'Not rated yet'
        }}
      </p>
    </div>

    <form
      v-if="user.isLoggedIn"
      class="grid"
      :class="compact ? 'mb-4 gap-2' : 'mb-5 gap-3'"
      @submit.prevent="submit"
    >
      <label class="text-sm font-bold" for="arcade-review-rating"
        >Your rating</label
      >
      <select
        id="arcade-review-rating"
        v-model.number="rating"
        class="select select-bordered w-full"
        :class="compact ? 'select-sm' : 'max-w-xs'"
        required
      >
        <option v-for="stars in [5, 4, 3, 2, 1]" :key="stars" :value="stars">
          {{ stars }} ★
        </option>
      </select>
      <label class="text-sm font-bold" for="arcade-review-comment"
        >Your comment</label
      >
      <textarea
        id="arcade-review-comment"
        v-model="comment"
        class="textarea textarea-bordered w-full"
        :class="{ 'textarea-sm': compact }"
        rows="3"
        maxlength="2000"
        placeholder="What made this game shine? What needs improvement?"
      />
      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          :disabled="reviews.saving"
        >
          {{ reviews.saving ? 'Saving…' : 'Post review' }}
        </button>
        <span class="text-xs opacity-60">{{ comment.length }}/2000</span>
      </div>
    </form>
    <p v-else class="mb-4 text-sm opacity-75">
      Sign in to rate and comment. Everyone can read reviews.
    </p>
    <p v-if="reviews.error" role="alert" class="mb-3 text-sm text-error">
      {{ reviews.error }}
    </p>
    <p v-if="reviews.loading" class="text-sm opacity-60">Loading reviews…</p>
    <div
      v-else-if="entries.length"
      class="grid"
      :class="compact ? 'gap-2' : 'gap-3'"
    >
      <article
        v-for="entry in entries"
        :key="entry.id"
        class="rounded-xl bg-base-200/70 p-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <span class="font-bold">{{ entry.username || 'Player' }}</span>
          <span class="text-sm text-warning">{{ entry.rating }} ★</span>
        </div>
        <p v-if="entry.comment" class="mt-2 whitespace-pre-line text-sm">
          {{ entry.comment }}
        </p>
      </article>
    </div>
    <p v-else class="text-sm opacity-60">
      No reviews yet. Be the first to leave one.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArcadeReviewsStore } from '@/stores/arcadeReviewsStore'
import { findArcadeGame } from '~/utils/arcade/games'

// compact: the slimmer form the game page's sidebar uses under the high
// scores; the hall keeps the full panel.
const props = defineProps<{ game: string; compact?: boolean }>()
const user = useUserStore()
const reviews = useArcadeReviewsStore()
const rating = ref(5)
const comment = ref('')
const title = computed(() => findArcadeGame(props.game)?.title ?? 'Game')
const summary = computed(() => reviews.summaries[props.game])
const entries = computed(() => reviews.reviewsByGame[props.game] ?? [])

async function load() {
  await reviews.fetchReviews(props.game)
  const own = entries.value.find((row) => row.userId === user.userId)
  rating.value = own?.rating ?? 5
  comment.value = own?.comment ?? ''
}

async function submit() {
  if (await reviews.saveReview(props.game, rating.value, comment.value))
    await load()
}

onMounted(() => {
  void load()
  void reviews.fetchSummaries()
})
watch(
  () => props.game,
  () => {
    void load()
  },
)
</script>
