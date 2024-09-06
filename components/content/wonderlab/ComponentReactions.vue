<template>
  <div class="relative">
    <!-- Existing reaction buttons -->
    <div
      class="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 flex justify-around"
    >
      <Icon
        name="mdi:thumb-up-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-green-500': reaction.isClapped }"
        @click="toggleReaction('isClapped')"
      />
      <Icon
        name="mdi:thumb-down-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-red-500': reaction.isBooed }"
        @click="toggleReaction('isBooed')"
      />
      <Icon
        name="mdi:heart-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-pink-500': reaction.isLoved }"
        @click="toggleReaction('isLoved')"
      />
      <Icon
        name="mdi:emoticon-angry-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-yellow-500': reaction.isHated }"
        @click="toggleReaction('isHated')"
      />
    </div>

    <!-- Comment Section -->
    <div class="mt-4 p-4 bg-gray-100">
      <textarea
        v-model="commentTitle"
        placeholder="Title"
        class="w-full mb-2 p-2 border border-gray-300 rounded"
      ></textarea>
      <textarea
        v-model="commentDescription"
        placeholder="Add your comment..."
        class="w-full p-2 border border-gray-300 rounded"
      ></textarea>
      <button class="btn btn-primary mt-2 w-full" @click="submitComment">
        Submit Comment
      </button>
    </div>

    <!-- Comment Display Section -->
    <div class="mt-6">
      <CommentDisplay :component-id="props.componentId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useReactionStore } from '../../../stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import CommentDisplay from './CommentDisplay.vue'

// Props
const props = defineProps({
  componentId: {
    type: Number,
    required: true,
  },
})

// Pinia stores
const reactionStore = useReactionStore()
const userStore = useUserStore()

// State
const userId = computed(() => userStore.user?.id || 10) // Default to guest user ID 10 if not logged in
const reaction = ref({
  isClapped: false,
  isBooed: false,
  isLoved: false,
  isHated: false,
})
const commentTitle = ref('')
const commentDescription = ref('')

// Fetch the reaction when componentId changes
watch(
  () => props.componentId,
  async (newId) => {
    if (newId) {
      await reactionStore.fetchReactionsByComponentId(newId)
      const userReaction = reactionStore.getUserReactionForComponent(
        newId,
        userId.value,
      )
      if (userReaction) {
        reaction.value = {
          isClapped: userReaction.isClapped || false,
          isBooed: userReaction.isBooed || false,
          isLoved: userReaction.isLoved || false,
          isHated: userReaction.isHated || false,
        }
      }
    }
  },
)

// Function to toggle reactions
const toggleReaction = async (reactionType: keyof typeof reaction.value) => {
  Object.keys(reaction.value).forEach((key) => {
    reaction.value[key as keyof typeof reaction.value] = false
  })
  reaction.value[reactionType] = true

  const existingReaction = reactionStore.getUserReactionForComponent(
    props.componentId,
    userId.value,
  )
  if (existingReaction) {
    await reactionStore.updateReaction(existingReaction.id, {
      ...reaction.value,
    })
  } else {
    await reactionStore.createReaction({
      userId: userId.value,
      componentId: props.componentId,
      ...reaction.value,
    })
  }
}

// Submit comment and create channel
const submitComment = async () => {
  if (commentTitle.value && commentDescription.value) {
    await reactionStore.createReactionWithChannel(
      {
        userId: userId.value,
        componentId: props.componentId,
        ...reaction.value,
      },
      {
        title: commentTitle.value,
        description: commentDescription.value,
      },
    )
    commentTitle.value = ''
    commentDescription.value = ''
  } else {
    alert('Please add both a title and a comment.')
  }
}
</script>

<style scoped>
/* Styles for reaction icons */
</style>
