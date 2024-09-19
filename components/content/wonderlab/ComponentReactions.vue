<template>
  <div class="relative w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
    <h2 v-if="component">Edit Component: {{ component?.componentName }}</h2>
    <p v-else>Loading component...</p>

    <!-- Display form fields for title, notes, and boolean toggles -->
    <div v-if="component" class="mt-4">
      <label class="block mb-2">Title:</label>
      <input
        v-model="component.title"
        type="text"
        class="w-full p-2 border rounded"
        @input="updateComponent"
      />

      <label class="block mt-4 mb-2">Notes:</label>
      <textarea
        v-model="component.notes"
        class="w-full p-2 border rounded"
        @input="updateComponent"
      ></textarea>

      <div class="mt-4">
        <label class="mr-2">Is Working:</label>
        <input
          v-model="component.isWorking"
          type="checkbox"
          @change="updateComponent"
        />

        <label class="ml-4 mr-2">Under Construction:</label>
        <input
          v-model="component.underConstruction"
          type="checkbox"
          @change="updateComponent"
        />

        <label class="ml-4 mr-2">Is Broken:</label>
        <input
          v-model="component.isBroken"
          type="checkbox"
          @change="updateComponent"
        />
      </div>
    </div>

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
import { ref, watch, computed, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useReactionStore } from '@/stores/reactionStore'
import { useUserStore } from '@/stores/userStore'
import { ReactionType, ReactionCategory } from '@prisma/client' // Prisma import
import CommentDisplay from './CommentDisplay.vue'
import type { Component } from '@prisma/client'

// Props
const props = defineProps({
  componentId: {
    type: Number,
    required: true,
  },
})

// Pinia stores
const reactionStore = useReactionStore()
const componentStore = useComponentStore()
const userStore = useUserStore()

// State for the component data
const component = ref<Component | null>(null) // Explicitly typing component
const reactionType = ref<ReactionType | null>(null) // Reaction type
const commentTitle = ref('')
const commentDescription = ref('')

// Get the user ID
const userId = computed(() => userStore.user?.id || 10) // Default to guest user ID 10 if not logged in

// Fetch the component by ID and load it into the local state
const fetchComponent = async () => {
  try {
    component.value = await componentStore.fetchComponentById(props.componentId)
  } catch (error) {
    console.error('Failed to fetch component:', error)
  }
}

// Fetch the reaction when componentId changes
const fetchReactions = async () => {
  await reactionStore.fetchReactionsByComponentId(props.componentId)
  const userReaction = reactionStore.getUserReactionForComponent(
    props.componentId,
    userId.value,
  )
  if (userReaction) {
    reactionType.value = userReaction.reactionType
  } else {
    reactionType.value = ReactionType.NEUTRAL // Default reaction
  }
}

// Function to update the component when fields change
const updateComponent = async () => {
  if (component.value) {
    await componentStore.createOrUpdateComponent(component.value, 'update')
  }
}

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
      reactionCategory: ReactionCategory.COMPONENT, // Correct case
    })
  }
}

// Submit comment and reaction
const submitComment = async () => {
  if (commentTitle.value && commentDescription.value) {
    await reactionStore.createReactionWithChannel(
      {
        userId: userId.value,
        componentId: props.componentId,
        reactionType: reactionType.value || ReactionType.NEUTRAL,
        ReactionCategory: ReactionCategory.COMPONENT, // Correct case
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

// Fetch component and reactions on mount
onMounted(() => {
  fetchComponent()
  fetchReactions()
})

// Watch for changes in componentId to refetch reactions and component data
watch(
  () => props.componentId,
  () => {
    fetchComponent()
    fetchReactions()
  },
)
</script>

<style scoped>
/* Styles for reaction icons */
</style>
