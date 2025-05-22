<!-- /components/content/wonderlab/component-reactions.vue -->
<template>
  <div class="relative w-full bg-base-200 border border-base-300 rounded-2xl shadow-lg p-6 space-y-8 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 v-if="selectedComponent" class="text-2xl font-bold text-primary-content">
        {{ selectedComponent?.componentName }}
      </h2>
      <p v-else class="text-lg text-base-content/70">Loading component...</p>
    </div>

    <!-- Notes + Toggles -->
    <div v-if="selectedComponent" class="space-y-6">
      <div>
        <label class="block mb-1 text-sm font-semibold text-base-content">Notes</label>
        <template v-if="isAdmin">
          <textarea
            v-model="selectedComponent.notes"
            class="textarea textarea-bordered w-full"
            rows="3"
            @input="updateComponent"
          ></textarea>
        </template>
        <template v-else>
          <p class="text-base-content text-sm bg-base-100 p-3 rounded-lg border border-base-300 whitespace-pre-line">
            {{ selectedComponent.notes || 'No notes available.' }}
          </p>
        </template>
      </div>

      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox" v-model="selectedComponent.isWorking" @change="updateComponent" />
          <span class="text-base-content">Is Working</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox" v-model="selectedComponent.underConstruction" @change="updateComponent" />
          <span class="text-base-content">Under Construction</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="checkbox" v-model="selectedComponent.isBroken" @change="updateComponent" />
          <span class="text-base-content">Is Broken</span>
        </label>
      </div>
    </div>

    <!-- Reaction Section -->
    <div class="space-y-6">
      <!-- Star Rating -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label class="text-base font-semibold text-base-content">Rate:</label>
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
        <label class="text-base font-semibold text-base-content">React:</label>
        <select v-model="selectedReactionType" class="select select-bordered w-full sm:max-w-xs">
          <option v-for="type in reactionTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <!-- Comment Input -->
      <div v-if="showComment">
        <input
          v-model="comment"
          placeholder="Leave a comment..."
          class="input input-bordered w-full"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2 justify-start">
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

      <!-- Message Response -->
      <div v-if="reactionMessage" class="mt-2">
        <div
          :class="[
            'alert',
            reactionStatus === 'success' ? 'alert-success' : 'alert-error',
            'shadow-sm',
          ]"
        >
          <Icon
            :name="reactionStatus === 'success' ? 'kind-icon:check' : 'kind-icon:warning'"
            class="mr-2"
          />
          {{ reactionMessage }}
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
// Store + utils
import { ref, computed, watch, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'
import {
  useReactionStore,
  ReactionTypeEnum,
  ReactionCategoryEnum,
} from '@/stores/reactionStore'

// Component logic
const reactionStore = useReactionStore()
const componentStore = useComponentStore()
const userStore = useUserStore()

const selectedComponent = computed(() => componentStore.selectedComponent)
const userId = computed(() => userStore.user?.id || 10)

const isAdmin = computed(() => userStore.isAdmin())

const rating = ref(0)
const hoverRating = ref(0)
const selectedReactionType = ref(ReactionTypeEnum.NEUTRAL)
const comment = ref('')
const showComment = ref(false)
const reactionTypes = Object.values(ReactionTypeEnum)

// Handlers
const toggleComment = () => (showComment.value = !showComment.value)
const setRating = (val: number) => (rating.value = val)
const clearReaction = () => {
  rating.value = 0
  hoverRating.value = 0
  selectedReactionType.value = ReactionTypeEnum.NEUTRAL
  comment.value = ''
  showComment.value = false
}

const submitReaction = async () => {
  if (!userStore.user?.id) {
    reactionStatus.value = 'error'
    reactionMessage.value = 'You must be logged in to submit a reaction.'
    return
  }

  try {
    await reactionStore.addReaction({
      componentId: selectedComponent.value?.id,
      userId: userStore.user.id,
      rating: rating.value,
      reactionType: selectedReactionType.value,
      comment: comment.value,
      reactionCategory: ReactionCategoryEnum.COMPONENT,
    })
    reactionStatus.value = 'success'
    reactionMessage.value = 'Reaction submitted successfully!'
  } catch (err) {
    reactionStatus.value = 'error'
    reactionMessage.value = 'Failed to submit reaction. Please try again.'
    console.error('Reaction failed:', err)
  }

  // Optional: Clear the message after 5 seconds
  setTimeout(() => {
    reactionMessage.value = ''
    reactionStatus.value = ''
  }, 5000)
}

const reactionMessage = ref('')
const reactionStatus = ref<'success' | 'error' | ''>('')



// Load existing reaction if present
const fetchReactions = async (componentId: number) => {
  await reactionStore.fetchReactionsByComponentId(componentId)
  const r = reactionStore.getUserReactionForComponent(componentId, userId.value)
  if (r) {
    rating.value = r.rating
    selectedReactionType.value = r.reactionType
    comment.value = r.comment || ''
  }
}

watch(selectedComponent, (newVal) => {
  if (newVal) fetchReactions(newVal.id)
})

onMounted(() => {
  if (selectedComponent.value) fetchReactions(selectedComponent.value.id)
})

// Update handler
const updateComponent = async () => {
  if (selectedComponent.value) {
    await componentStore.createOrUpdateComponent(selectedComponent.value, 'update')
  }
}
</script>
m