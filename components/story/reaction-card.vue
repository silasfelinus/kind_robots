<template>
  <div
    class="reaction-card w-full max-w-xl mx-auto p-6 bg-base-200 border border-base-300 rounded-2xl shadow-md space-y-6"
  >
    <!-- Star Rating -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label class="text-base font-semibold text-base-content whitespace-nowrap"
        >Rate:</label
      >
      <div class="flex gap-1 sm:gap-2 items-center">
        <span
          v-for="star in 5"
          :key="star"
          class="text-4xl sm:text-5xl cursor-pointer select-none transition-transform duration-100 px-1 py-0.5"
          :class="{
            'text-yellow-400 scale-110': hoverRating >= star,
            'text-yellow-300': hoverRating === 0 && rating >= star,
            'text-gray-400': hoverRating < star && rating < star,
          }"
          @mouseenter="hoverRating = star"
          @mouseleave="hoverRating = 0"
          @click="setRating(star)"
        >
          ★
        </span>
      </div>
    </div>

    <!-- Reaction Type -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label class="text-base font-semibold text-base-content whitespace-nowrap"
        >React:</label
      >
      <select
        v-model="selectedReactionType"
        class="select select-bordered w-full sm:max-w-xs"
      >
        <option v-for="type in reactionTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <!-- Comment Input -->
    <div v-if="showComment" class="comment-input">
      <input
        v-model="comment"
        placeholder="Leave a comment..."
        class="input input-bordered w-full"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-2 justify-between sm:justify-start">
      <button class="btn btn-sm btn-accent" @click="toggleComment">
        <Icon name="kind-icon:comment" class="mr-1" /> Comment
      </button>
      <button class="btn btn-sm btn-primary" @click="submitReaction">
        <Icon name="kind-icon:submit" class="mr-1" /> Submit
      </button>
      <button class="btn btn-sm btn-error" @click="clearReaction">
        <Icon name="kind-icon:clear" class="mr-1" /> Clear
      </button>
    </div>

    <!-- Social Share -->
    <div
      class="flex flex-wrap gap-2 justify-center pt-2 border-t border-base-300"
    >
      <button class="btn btn-sm btn-secondary" @click="share('facebook')">
        <Icon name="kind-icon:facebook" class="mr-1" /> Facebook
      </button>
      <button class="btn btn-sm btn-secondary" @click="share('twitter')">
        <Icon name="kind-icon:twitter" class="mr-1" /> Twitter
      </button>
      <button class="btn btn-sm btn-secondary" @click="share('instagram')">
        <Icon name="kind-icon:instagram" class="mr-1" /> Instagram
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import {
  useReactionStore,
  type ReactionTypeEnum,
  type reactionTypes,
} from '@/stores/reactionStore'

const props = defineProps({
  chatId: { type: Number, default: null },
  artId: { type: Number, default: null },
  pitchId: { type: Number, default: null },
  componentId: { type: Number, default: null },
  artImageId: { type: Number, default: null },
  galleryId: { type: Number, default: null },
  botId: { type: Number, default: null },
  promptId: { type: Number, default: null },
  resourceId: { type: Number, default: null },
  rewardId: { type: Number, default: null },
  tagId: { type: Number, default: null },
})

const reactionStore = useReactionStore()
const userStore = useUserStore()

const rating = ref(0)
const selectedReactionType = ref<ReactionTypeEnum>('NEUTRAL')
const comment = ref('')
const showComment = ref(false)
const hoverRating = ref(0)

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
      chatId: props.chatId,
      artId: props.artId,
      pitchId: props.pitchId,
      componentId: props.componentId,
      artImageId: props.artImageId,
      galleryId: props.galleryId,
      botId: props.botId,
      promptId: props.promptId,
      resourceId: props.resourceId,
      rewardId: props.rewardId,
      tagId: props.tagId,
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value as ReactionTypeEnum, // Use enum type
      comment: comment.value,
      reactionCategory: 'COMPONENT', // Example default category
    })
    console.log('Reaction submitted successfully.')
  } catch (error) {
    console.error('Error submitting reaction:', error)
  }
}

const clearReaction = () => {
  rating.value = 0
  selectedReactionType.value = 'NEUTRAL'
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
