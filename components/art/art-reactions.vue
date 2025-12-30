// /components/content/art/art-reactions.vue
<template>
  <div
    class="relative w-full bg-base-200 border border-base-300 rounded-2xl shadow-lg p-6 space-y-6 max-w-3xl mx-auto"
  >
    <h2 class="text-xl font-bold text-primary">React to this Art</h2>

    <!-- Rating Stars -->
    <div class="flex items-center gap-2">
      <span class="font-semibold">Rate:</span>
      <div class="flex gap-1">
        <span
          v-for="star in 5"
          :key="star"
          class="text-3xl cursor-pointer select-none transition-transform duration-100"
          :class="{
            'text-yellow-400 scale-110': hoverRating >= star,
            'text-yellow-300': hoverRating === 0 && rating >= star,
            'text-gray-400': hoverRating < star && rating < star,
          }"
          @mouseenter="hoverRating = star"
          @mouseleave="hoverRating = 0"
          @click="setRating(star)"
          >★</span
        >
      </div>
    </div>

    <!-- Reaction Type Select -->
    <div class="space-y-2">
      <label class="font-semibold">Reaction Type</label>
      <select
        v-model="selectedReactionType"
        class="select select-bordered w-full"
      >
        <option v-for="type in reactionTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Optional Comment -->
    <div>
      <input
        v-model="comment"
        class="input input-bordered w-full"
        placeholder="Leave a comment..."
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-primary" @click="submitReaction">
        <Icon name="kind-icon:submit" class="mr-1" /> Submit
      </button>
      <button class="btn btn-outline" @click="clearReaction">
        <Icon name="kind-icon:clear" class="mr-1" /> Clear
      </button>
    </div>

    <!-- Feedback Message -->
    <div v-if="reactionMessage" class="mt-2">
      <div
        :class="[
          'alert',
          reactionStatus === 'success' ? 'alert-success' : 'alert-error',
          'shadow-sm',
        ]"
      >
        <Icon
          :name="
            reactionStatus === 'success'
              ? 'kind-icon:check'
              : 'kind-icon:warning'
          "
          class="mr-2"
        />
        {{ reactionMessage }}
      </div>
    </div>

    <!-- Public Reaction History -->
    <div v-if="publicReactions.length" class="pt-6 border-t border-base-300">
      <h3 class="text-lg font-semibold text-base-content mb-2">
        Recent Reactions
      </h3>
      <ul class="space-y-2">
        <li
          v-for="r in publicReactions"
          :key="r.id"
          class="bg-base-100 border border-base-300 rounded-lg p-3 text-sm"
        >
          <div class="flex justify-between items-center">
            <div>
              <strong>{{ r.reactionType }}</strong>
              <span v-if="r.rating"> - {{ r.rating }}/5</span>
            </div>
            <span class="text-xs text-base-content/70">
              {{ new Date(r.createdAt).toLocaleString() }}
            </span>
          </div>
          <p v-if="r.comment" class="mt-1 text-base-content/80">
            “{{ r.comment }}”
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useReactionStore,
  reactionTypes,
  type ReactionTypeEnum,
} from '@/stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

const userStore = useUserStore()
const artStore = useArtStore()
const reactionStore = useReactionStore()

const art = computed(() => artStore.currentArt)
const userId = computed(() => userStore.user?.id || 10)

const rating = ref(0)
const hoverRating = ref(0)
const selectedReactionType = ref<ReactionTypeEnum>('NEUTRAL')
const comment = ref('')
const reactionMessage = ref('')
const reactionStatus = ref<'success' | 'error' | ''>('')

const publicReactions = computed(() => {
  return reactionStore.reactions.filter(
    (r: { artId: any; userId: any }) =>
      r.artId === art.value?.id && r.userId !== userId.value,
  )
})

const setRating = (val: number) => (rating.value = val)
const clearReaction = () => {
  rating.value = 0
  hoverRating.value = 0
  selectedReactionType.value = 'NEUTRAL'
  comment.value = ''
}

const submitReaction = async () => {
  if (!art.value?.id || !userStore.user?.id) {
    reactionStatus.value = 'error'
    reactionMessage.value = 'Login required.'
    return
  }

  try {
    await reactionStore.addReaction({
      artId: art.value.id,
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value,
      comment: comment.value,
      reactionCategory: 'ART',
    })
    reactionStatus.value = 'success'
    reactionMessage.value = 'Reaction submitted!'
  } catch (err) {
    console.error('Reaction failed:', err)
    reactionStatus.value = 'error'
    reactionMessage.value = 'Submission failed.'
  }

  setTimeout(() => {
    reactionStatus.value = ''
    reactionMessage.value = ''
  }, 5000)
}

onMounted(async () => {
  if (art.value?.id) {
    await reactionStore.fetchReactionsByArtId(art.value.id)
    const myReaction = reactionStore.reactions.find(
      (r: { artId: any; userId: any }) =>
        r.artId === art.value?.id && r.userId === userId.value,
    )
    if (myReaction) {
      rating.value = myReaction.rating
      selectedReactionType.value = myReaction.reactionType
      comment.value = myReaction.comment || ''
    }
  }
})
</script>
