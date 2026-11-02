<template>
  <main
    class="kr-surface flex min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-5"
  >
    <header-page-bar>
      <div
        class="prv-bar"
        data-testid="playbook-reviews-page-bar"
        title="Learn what worked, which endings landed, and what each playthrough actually did."
      >
        <div
          v-if="user.isAdmin"
          class="prv-bar-filters"
          role="group"
          aria-label="Review filters"
        >
          <label class="prv-bar-field">
            <span class="prv-bar-label">Game</span>
            <select
              v-model="store.game"
              class="select select-bordered select-sm"
              aria-label="Game"
              @change="store.load()"
            >
              <option value="">All Playbooks</option>
              <option
                v-for="slug in REVIEW_GAME_SLUGS"
                :key="slug"
                :value="slug"
              >
                {{ slug }}
              </option>
            </select>
          </label>
          <label class="prv-bar-field">
            <span class="prv-bar-label">Stars</span>
            <select
              v-model.number="store.stars"
              class="select select-bordered select-sm"
              aria-label="Stars"
              @change="store.load()"
            >
              <option :value="0">Any rating</option>
              <option v-for="value in 5" :key="value" :value="value">
                {{ value }} star{{ value === 1 ? '' : 's' }}
              </option>
            </select>
          </label>
          <button
            class="kr-btn-ghost"
            :disabled="store.loading"
            @click="store.load()"
          >
            Refresh
          </button>
          <span class="prv-bar-count"
            >{{ store.reviews.length }} most recent matches</span
          >
        </div>
        <NuxtLink
          class="kr-btn-ghost ml-auto shrink-0"
          to="/admin/playbook-manager"
          >Story Atlas</NuxtLink
        >
      </div>
    </header-page-bar>
    <div v-if="!user.isAdmin" class="kr-panel p-6" role="alert">
      Administrator access required.
    </div>
    <template v-else>
      <p v-if="store.error" role="alert" class="text-error">
        {{ store.error }}
      </p>
      <div
        class="kr-scroll grid min-h-0 flex-1 items-start gap-3 lg:grid-cols-[minmax(15rem,1fr)_minmax(20rem,1.2fr)]"
      >
        <div class="min-h-0 space-y-2">
          <p v-if="store.loading" role="status">Loading reviews…</p>
          <p v-else-if="!store.reviews.length" class="opacity-70">
            No reviews match these filters yet.
          </p>
          <button
            v-for="review in store.reviews"
            :key="review.id"
            type="button"
            class="block w-full rounded-2xl border p-3 text-left hover:border-warning"
            :class="
              selected?.id === review.id
                ? 'border-warning bg-base-200'
                : 'border-base-content/15'
            "
            :aria-pressed="selected?.id === review.id"
            @click="selectedId = review.id"
          >
            <span class="flex flex-wrap items-center justify-between gap-2">
              <strong>{{ review.gameSlug }}</strong>
              <span
                class="text-warning"
                :aria-label="review.stars + ' out of five stars'"
                >{{ '★'.repeat(review.stars)
                }}{{ '☆'.repeat(5 - review.stars) }}</span
              >
            </span>
            <span class="mt-1 block text-xs opacity-65"
              >{{ review.endingKey }} ·
              {{ review.createdAt.slice(0, 10) }}</span
            >
            <span class="mt-2 block text-sm">{{
              review.comment || 'No written comment'
            }}</span>
          </button>
        </div>
        <section
          class="min-h-0 rounded-2xl border border-base-content/20 bg-base-200 p-3 sm:p-4"
          aria-label="Selected review playthrough history"
        >
          <template v-if="selected">
            <h2 class="font-serif text-xl font-bold">
              Run history: {{ selected.endingKey }}
            </h2>
            <p class="text-sm">
              {{ selected.gameSlug }} · {{ selected.stars }}/5 stars
            </p>
            <blockquote class="my-3 border-l-2 border-warning pl-3 text-sm">
              {{ selected.comment || 'No written comment provided.' }}
            </blockquote>
            <pre
              class="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-base-300 p-3 text-xs"
              >{{ JSON.stringify(selected.history, null, 2) }}</pre>
          </template>
          <p v-else class="text-sm opacity-70">
            Choose a review to inspect its gameplay decisions and final state.
          </p>
        </section>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { usePlaybookReviewAdminStore } from '~/stores/playbookReviewAdminStore'
import { REVIEW_GAME_SLUGS } from '~/utils/playbook/runReview'

const user = useUserStore()
const store = usePlaybookReviewAdminStore()
const selectedId = ref<number | null>(null)
const selected = computed(
  () =>
    store.reviews.find((item) => item.id === selectedId.value) ??
    store.reviews[0] ??
    null,
)
onMounted(() => {
  if (user.isAdmin) void store.load()
})
</script>

<style scoped>
.prv-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}
.prv-bar-filters {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.prv-bar-filters::-webkit-scrollbar {
  display: none;
}
.prv-bar-filters > * {
  flex: none;
}
.prv-bar-field {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.prv-bar-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.75;
}
.prv-bar-count {
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
}
@container (max-width: 720px) {
  .prv-bar-count {
    display: none;
  }
}
@container (max-width: 520px) {
  .prv-bar-label {
    display: none;
  }
}
</style>
