<template>
  <section
    v-if="session && session.status === 'open'"
    class="min-h-0 rounded-2xl border border-warning/40 bg-base-100/95 p-3 shadow-xl sm:p-5"
    aria-label="Review this playthrough"
    data-testid="playbook-run-review"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p class="text-xs font-black uppercase tracking-[.18em] text-warning">
          The final curtain
        </p>
        <h3 class="font-serif text-xl font-bold sm:text-2xl">
          How was this run?
        </h3>
        <p class="text-sm opacity-75">
          Your rating stays with this run's choices and ending to help improve
          the story.
        </p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="skip">
        Skip
      </button>
    </div>
    <div
      class="mt-3 flex gap-1"
      role="radiogroup"
      aria-label="Rate this run from one to five stars"
    >
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        role="radio"
        :aria-label="star + (star === 1 ? ' star' : ' stars')"
        :aria-checked="rating === star"
        class="rounded-lg px-1 py-1 text-3xl transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning sm:text-4xl"
        :class="rating >= star ? 'text-warning' : 'text-base-content/25'"
        @click="rating = star"
      >
        ★
      </button>
    </div>
    <label class="mt-2 block text-sm font-semibold" :for="commentId"
      >Any thoughts?
      <span class="font-normal opacity-60">(optional)</span></label
    >
    <textarea
      :id="commentId"
      v-model="comment"
      class="textarea textarea-bordered mt-1 w-full"
      rows="2"
      maxlength="2000"
      placeholder="What delighted you, frustrated you, or deserved another chapter?"
    />
    <p v-if="reviews.error" role="alert" class="mt-2 text-sm text-error">
      {{ reviews.error }}
    </p>
    <button
      type="button"
      class="btn btn-warning mt-2"
      :disabled="rating === 0 || reviews.saving"
      data-testid="playbook-review-submit"
      @click="submit"
    >
      {{ reviews.saving ? 'Saving review…' : 'Send run review' }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { playbookRunKey } from '~/utils/playbook/runReview'

const props = defineProps<{ game: string; run: unknown; ending: string }>()
const reviews = usePlaybookRunReviewStore()
const rating = ref(0)
const comment = ref('')
const commentId = 'playbook-review-comment-' + props.game
const runKey = computed(() => playbookRunKey(props.run))
const session = computed(
  () => reviews.sessions[props.game + ':' + runKey.value],
)
watch(
  () => [props.game, runKey.value],
  () => reviews.ensure(props.game, runKey.value),
  { immediate: true },
)
function skip() {
  reviews.skip(props.game, runKey.value)
}
async function submit() {
  if (rating.value < 1) return
  await reviews.submit(
    props.game,
    runKey.value,
    props.ending,
    rating.value,
    comment.value,
    props.run,
  )
}
</script>
