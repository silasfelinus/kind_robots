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

    <!-- Social Media Sharing Buttons -->
    <div class="social-share flex items-center space-x-2 mb-4">
      <button class="btn btn-sm btn-secondary flex items-center" @click="share('facebook')">
        <Icon name="kindicon:facebook" class="mr-1" /> Facebook
      </button>
      <button class="btn btn-sm btn-secondary flex items-center" @click="share('twitter')">
        <Icon name="kindicon:twitter" class="mr-1" /> Twitter
      </button>
      <button class="btn btn-sm btn-secondary flex items-center" @click="share('instagram')">
        <Icon name="kindicon:instagram" class="mr-1" /> Instagram
      </button>
    </div>

    <!-- Comment and Actions Bar -->
    <div class="actions-bar flex items-center justify-between space-x-2">
      <button class="btn btn-sm btn-accent flex items-center" @click="toggleComment">
        <Icon name="kindicon:comment" class="mr-1" /> Comment
      </button>
      <button class="btn btn-sm btn-primary flex items-center" @click="submitReaction">
        <Icon name="kindicon:submit" class="mr-1" /> Submit
      </button>
      <button class="btn btn-sm btn-error flex items-center" @click="clearReaction">
        <Icon name="kindicon:clear" class="mr-1" /> Clear
      </button>
    </div>

    <!-- Toggleable Comment Input -->
    <div v-if="showComment" class="comment-input mt-4">
      <input
        v-model="comment"
        placeholder="Leave a comment..."
        class="input input-bordered w-full"
      />
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
const showComment = ref(false) // Toggle state for comment input

// Reaction types
const reactionTypes = Object.values(ReactionType)

// Toggle comment input visibility
const toggleComment = () => {
  showComment.value = !showComment.value
}

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
  showComment.value = false
}

// Social media share function
const share = (platform: string) => {
  console.log(`Shared on ${platform}`)
}
</script>

<style scoped>
.star-rating span:hover,
.star-rating span:hover ~ span {
  color: #ffb400; /* Yellow color on hover */
}
.comment-input {
  transition: all 0.3s ease;
}
</style>
