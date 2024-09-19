<template>
  <div class="relative">
    <!-- Reaction buttons -->
    <div
      class="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 flex justify-around"
    >
      <Icon
        name="mdi:thumb-up-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-green-500': reactionType === ReactionType.CLAPPED }"
        @click="toggleReaction(ReactionType.CLAPPED)"
      />
      <Icon
        name="mdi:thumb-down-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-red-500': reactionType === ReactionType.BOOED }"
        @click="toggleReaction(ReactionType.BOOED)"
      />
      <Icon
        name="mdi:heart-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-pink-500': reactionType === ReactionType.LOVED }"
        @click="toggleReaction(ReactionType.LOVED)"
      />
      <Icon
        name="mdi:emoticon-angry-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-yellow-500': reactionType === ReactionType.HATED }"
        @click="toggleReaction(ReactionType.HATED)"
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
      <CommentDisplay :component-id="componentId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import CommentDisplay from './CommentDisplay.vue'
import { useReactionStore } from '@/stores/reactionStore'
import { ReactionType, ReactionCategory } from '@prisma/client' // Prisma import

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
const reactionType = ref<ReactionType | null>(null) // Reaction type
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
        reactionType.value = userReaction.reactionType
      } else {
        reactionType.value = ReactionType.NEUTRAL // Default reaction
      }
    }
  },
)

// Function to toggle reactions
const toggleReaction = async (newReactionType: ReactionType) => {
  reactionType.value = newReactionType

  const existingReaction = reactionStore.getUserReactionForComponent(
    props.componentId,
    userId.value,
  )
  if (existingReaction) {
    await reactionStore.updateReaction(existingReaction.id, {
      reactionType: newReactionType,
    })
  } else {
    await reactionStore.createReaction({
      userId: userId.value,
      componentId: props.componentId,
      reactionType: newReactionType,
      reactionCategory: ReactionCategory.COMPONENT, // Use Prisma enum
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
        reactionType: reactionType.value || ReactionType.NEUTRAL,
        ReactionCategory: ReactionCategory.COMPONENT, // Use Prisma enum
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
