<template>
  <div class="flex h-full flex-col gap-2">
    <tzaddik-card
      :candidate="candidate"
      :earned-karma="earnedKarma"
      @open="emit('open', $event)"
    />
    <div
      class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 bg-base-100/90 px-2 py-1.5 text-xs"
    >
      <div
        class="flex items-center gap-1"
        role="group"
        :aria-label="`Vote for ${name}`"
      >
        <button
          type="button"
          class="btn btn-xs gap-1 rounded-lg"
          :class="
            candidate.community?.myVote === 1 ? 'btn-success' : 'btn-ghost'
          "
          :aria-pressed="candidate.community?.myVote === 1"
          :aria-label="`Upvote ${name}`"
          :disabled="!userStore.isLoggedIn || voting"
          :title="userStore.isLoggedIn ? 'Upvote' : 'Sign in to vote'"
          @click.stop="vote(1)"
        >
          <Icon name="kind-icon:chevron-up" class="kr-icon-3-5" />
          {{ candidate.community?.upvotes ?? 0 }}
        </button>
        <button
          type="button"
          class="btn btn-xs gap-1 rounded-lg"
          :class="
            candidate.community?.myVote === -1 ? 'btn-error' : 'btn-ghost'
          "
          :aria-pressed="candidate.community?.myVote === -1"
          :aria-label="`Downvote ${name}`"
          :disabled="!userStore.isLoggedIn || voting"
          :title="userStore.isLoggedIn ? 'Downvote' : 'Sign in to vote'"
          @click.stop="vote(-1)"
        >
          <Icon name="kind-icon:chevron-down" class="kr-icon-3-5" />
          {{ candidate.community?.downvotes ?? 0 }}
        </button>
      </div>
      <span
        class="text-base-content/60"
        :title="`Community score ${candidate.community?.score ?? 0}`"
      >
        ★
        {{
          candidate.community?.reviewCount
            ? candidate.community.averageRating.toFixed(1)
            : '–'
        }}
        · {{ candidate.community?.reviewCount ?? 0 }} reviews
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TzaddikCandidateWithTags } from '@/stores/tzaddikStore'
import { useTzaddikStore } from '@/stores/tzaddikStore'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{
  candidate: TzaddikCandidateWithTags
  earnedKarma?: number
}>()

const emit = defineEmits<{ open: [candidateId: number] }>()
const store = useTzaddikStore()
const userStore = useUserStore()
const name = computed(
  () => props.candidate.displayNameOverride || props.candidate.displayName,
)
const voting = computed(() => Boolean(store.votingById[props.candidate.id]))

async function vote(value: -1 | 1): Promise<void> {
  const next = props.candidate.community?.myVote === value ? 0 : value
  await store.voteCandidate(props.candidate.id, next)
}
</script>
