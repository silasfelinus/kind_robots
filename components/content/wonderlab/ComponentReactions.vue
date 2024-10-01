<template>
  <div class="relative w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
    <!-- Display component information dynamically -->
    <h2 v-if="selectedComponent">
      Edit Component: {{ selectedComponent?.componentName }}
    </h2>
    <p v-else>Loading component...</p>

    <!-- Display form fields for title, notes, and boolean toggles -->
    <div v-if="selectedComponent" class="mt-4">
      <label class="block mb-2">Title:</label>
      <input
        v-model="selectedComponent.title"
        type="text"
        class="w-full p-2 border rounded"
        @input="updateComponent"
      />

      <label class="block mt-4 mb-2">Notes:</label>
      <textarea
        v-model="selectedComponent.notes"
        class="w-full p-2 border rounded"
        @input="updateComponent"
      ></textarea>

      <div class="mt-4">
        <label class="mr-2">Is Working:</label>
        <input
          v-model="selectedComponent.isWorking"
          type="checkbox"
          @change="updateComponent"
        />

        <label class="ml-4 mr-2">Under Construction:</label>
        <input
          v-model="selectedComponent.underConstruction"
          type="checkbox"
          @change="updateComponent"
        />

        <label class="ml-4 mr-2">Is Broken:</label>
        <input
          v-model="selectedComponent.isBroken"
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
        :class="{ 'text-green-500': reactionType === 'CLAPPED' }"
        @click="toggleReaction('CLAPPED')"
      />
      <Icon
        name="mdi:thumb-down-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-red-500': reactionType === 'BOOED' }"
        @click="toggleReaction('BOOED')"
      />
      <Icon
        name="mdi:heart-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-pink-500': reactionType === 'LOVED' }"
        @click="toggleReaction('LOVED')"
      />
      <Icon
        name="mdi:emoticon-angry-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-yellow-500': reactionType === 'HATED' }"
        @click="toggleReaction('HATED')"
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
    <div v-if="selectedComponent" class="mt-6">
      <CommentDisplay :component-id="selectedComponent?.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import {
  useReactionStore,
  type ReactionTypeEnum as ReactionType,
} from './../../../stores/reactionStore'
import { useUserStore } from './../../../stores/userStore'
import CommentDisplay from './CommentDisplay.vue'

// Pinia stores
const reactionStore = useReactionStore()
const componentStore = useComponentStore()
const userStore = useUserStore()

// State for reaction and comments
const reactionType = ref<string | null>(null)
const commentTitle = ref('')
const commentDescription = ref('')

// Get the selected component from the store
const selectedComponent = computed(() => componentStore.selectedComponent)

// Get the user ID
const userId = computed(() => userStore.user?.id || 10) // Default to guest user ID 10 if not logged in

// Watch the selectedComponent to update the local reaction state
watch(selectedComponent, (newComponent) => {
  if (newComponent) {
    fetchReactions(newComponent.id)
  }
})

// Fetch reactions for the selected component
const fetchReactions = async (componentId: number) => {
  await reactionStore.fetchReactionsByComponentId(componentId)
  const userReaction = reactionStore.getUserReactionForComponent(
    componentId,
    userId.value,
  )
  if (userReaction) {
    reactionType.value = userReaction.reactionType // Now using ReactionType directly
  } else {
    reactionType.value = 'NEUTRAL' // Default reaction if none exists
  }
}

// Function to update the component when fields change
const updateComponent = async () => {
  if (selectedComponent.value) {
    await componentStore.createOrUpdateComponent(
      selectedComponent.value,
      'update',
    )
  }
}

const toggleReaction = async (newReactionType: string) => {
  // Cast the string value to ReactionType
  reactionType.value = newReactionType as ReactionType

  const existingReaction = reactionStore.getUserReactionForComponent(
    selectedComponent.value?.id || 0,
    userId.value,
  )
  if (existingReaction) {
    await reactionStore.updateReaction(existingReaction.id, {
      reactionType: newReactionType as ReactionType, // Cast to ReactionType
    })
  } else {
    await reactionStore.createReaction({
      userId: userId.value,
      componentId: selectedComponent.value?.id || 0,
      reactionType: newReactionType as ReactionType, // Cast to ReactionType
      reactionCategory: 'COMPONENT',
    })
  }
}

// Submit comment and reaction
const submitComment = async () => {
  if (commentTitle.value && commentDescription.value) {
    await reactionStore.createReactionWithChannel(
      {
        userId: userId.value,
        componentId: selectedComponent.value?.id || 0,
        reactionType: (reactionType.value as ReactionType) || 'NEUTRAL',
        reactionCategory: 'COMPONENT',
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

// Fetch reactions and initialize when component is mounted
onMounted(() => {
  if (selectedComponent.value) {
    fetchReactions(selectedComponent.value.id)
  }
})
</script>
