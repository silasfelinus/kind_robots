<template>
  <div class="reaction-card p-4 bg-base-200 rounded-lg shadow-md w-full max-w-md mx-auto mt-4">
    <!-- Star Rating System -->
    <div class="star-rating flex items-center mb-4">
      <p class="font-semibold mr-2">Rate:</p>
      <div class="flex">
        <span
          v-for="star in 5"
          :key="star"
          class="cursor-pointer text-xl"
          :class="star <= rating ? 'text-yellow-400' : 'text-gray-300'"
          @click="setRating(star)"
        >
          ★
        </span>
      </div>
    </div>

    <!-- Reaction Type Selection -->
    <div class="reaction-type flex items-center mb-4">
      <p class="font-semibold mr-2">React:</p>
      <select v-model="selectedReactionType" class="select select-bordered">
        <option v-for="type in reactionTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Comment Section -->
    <div class="comment-section mb-4">
      <textarea
        v-model="comment"
        placeholder="Leave a comment..."
        class="textarea textarea-bordered w-full"
      />
    </div>

    <!-- Action Buttons -->
    <div class="actions flex justify-end mt-4">
      <button class="btn btn-primary mr-2" @click="submitReaction">Submit</button>
      <button class="btn btn-secondary" @click="clearReaction">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useReactionStore } from '@/stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import { ReactionType } from '@prisma/client'

// Props
const props = defineProps({
  chatExchangeId: Number,
  artId: Number,
  pitchId: Number,
  componentId: Number,
})

// Stores
const reactionStore = useReactionStore()
const userStore = useUserStore()

// Local state
const rating = ref(0)
const selectedReactionType = ref<ReactionType>(ReactionType.NEUTRAL)
const comment = ref('')

// Reaction types
const reactionTypes = Object.values(ReactionType)

// Update rating
const setRating = (value: number) => {
  rating.value = value
}

// Submit reaction
const submitReaction = async () => {
  if (!userStore.user?.id) {
    console.error('User not logged in')
    return
  }

  try {
    await reactionStore.addReaction({
      chatExchangeId: props.chatExchangeId,
      artId: props.artId,
      pitchId: props.pitchId,
      componentId: props.componentId,
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value,
      comment: comment.value,
    })
    console.log('Reaction submitted successfully.')
  } catch (error) {
    console.error('Error submitting reaction:', error)
  }
}

// Clear reaction input
const clearReaction = () => {
  rating.value = 0
  selectedReactionType.value = ReactionType.NEUTRAL
  comment.value = ''
}
</script>

<style scoped>
.star-rating span:hover,
.star-rating span:hover ~ span {
  color: #ffb400; /* Yellow color on hover */
}
</style>
