<template>
  <div
    class="reaction-card p-4 bg-base-200 rounded-lg shadow-md w-full max-w-md mx-auto mt-4"
  >
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
      <button
        class="btn btn-sm btn-secondary flex items-center"
        @click="share('facebook')"
      >
        <Icon name="kind-icon:facebook" class="mr-1" /> Facebook
      </button>
      <button
        class="btn btn-sm btn-secondary flex items-center"
        @click="share('twitter')"
      >
        <Icon name="kind-icon:twitter" class="mr-1" /> Twitter
      </button>
      <button
        class="btn btn-sm btn-secondary flex items-center"
        @click="share('instagram')"
      >
        <Icon name="kind-icon:instagram" class="mr-1" /> Instagram
      </button>
    </div>

    <!-- Comment and Actions Bar -->
    <div class="actions-bar flex items-center justify-between space-x-2">
      <button
        class="btn btn-sm btn-accent flex items-center"
        @click="toggleComment"
      >
        <Icon name="kind-icon:comment" class="mr-1" /> Comment
      </button>
      <button
        class="btn btn-sm btn-primary flex items-center"
        @click="submitReaction"
      >
        <Icon name="kind-icon:submit" class="mr-1" /> Submit
      </button>
      <button
        class="btn btn-sm btn-error flex items-center"
        @click="clearReaction"
      >
        <Icon name="kind-icon:clear" class="mr-1" /> Clear
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
import { useUserStore } from '@/stores/userStore'
import {
  useReactionStore,
  ReactionTypeEnum,
  ReactionCategoryEnum,
} from '@/stores/reactionStore'

const props = defineProps({
  chatExchangeId: { type: Number, default: null },
  artId: { type: Number, default: null },
  pitchId: { type: Number, default: null },
  componentId: { type: Number, default: null },
  artImageId: { type: Number, default: null },
  galleryId: { type: Number, default: null },
  botId: { type: Number, default: null },
  messageId: { type: Number, default: null },
  postId: { type: Number, default: null },
  promptId: { type: Number, default: null },
  resourceId: { type: Number, default: null },
  rewardId: { type: Number, default: null },
  tagId: { type: Number, default: null },
})

const reactionStore = useReactionStore()
const userStore = useUserStore()

const rating = ref(0)
const selectedReactionType = ref(ReactionTypeEnum.NEUTRAL) // Default enum value
const comment = ref('')
const showComment = ref(false)

// Reaction type options
const reactionTypes = Object.values(ReactionTypeEnum)

const toggleComment = () => {
  showComment.value = !showComment.value
}

const setRating = (value: number) => {
  rating.value = value
}

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
      artImageId: props.artImageId,
      galleryId: props.galleryId,
      botId: props.botId,
      messageId: props.messageId,
      postId: props.postId,
      promptId: props.promptId,
      resourceId: props.resourceId,
      rewardId: props.rewardId,
      tagId: props.tagId,
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value as ReactionTypeEnum, // Use enum type
      comment: comment.value,
      reactionCategory: ReactionCategoryEnum.COMPONENT, // Example default category
    })
    console.log('Reaction submitted successfully.')
  } catch (error) {
    console.error('Error submitting reaction:', error)
  }
}

const clearReaction = () => {
  rating.value = 0
  selectedReactionType.value = ReactionTypeEnum.NEUTRAL
  comment.value = ''
  showComment.value = false
}

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
