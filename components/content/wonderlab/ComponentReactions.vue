<template>
  <div
    class="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 flex justify-around"
  >
    <!-- Display Reaction Totals -->
    <div class="text-center">
      <Icon
        name="mdi:thumb-up-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-green-500': reaction.isClapped }"
        @click="toggleReaction('isClapped')"
      />
      <p class="text-white">{{ totalClaps }} Claps</p>
      <!-- Show total claps -->
    </div>
    <div class="text-center">
      <Icon
        name="mdi:thumb-down-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-red-500': reaction.isBooed }"
        @click="toggleReaction('isBooed')"
      />
      <p class="text-white">{{ totalBoos }} Boos</p>
      <!-- Show total boos -->
    </div>
    <div class="text-center">
      <Icon
        name="mdi:heart-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-pink-500': reaction.isLoved }"
        @click="toggleReaction('isLoved')"
      />
      <p class="text-white">{{ totalLoves }} Loves</p>
      <!-- Show total loves -->
    </div>
    <div class="text-center">
      <Icon
        name="mdi:emoticon-angry-outline"
        class="text-6xl cursor-pointer"
        :class="{ 'text-yellow-500': reaction.isHated }"
        @click="toggleReaction('isHated')"
      />
      <p class="text-white">{{ totalHates }} Hates</p>
      <!-- Show total hates -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useReactionStore } from '../../../stores/reactionStore'
import { useUserStore } from '@/stores/userStore'

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

// Computed properties for total reactions
const totalClaps = computed(() =>
  reactionStore.getTotalReactionsForComponent(props.componentId, 'isClapped'),
)
const totalBoos = computed(() =>
  reactionStore.getTotalReactionsForComponent(props.componentId, 'isBooed'),
)
const totalLoves = computed(() =>
  reactionStore.getTotalReactionsForComponent(props.componentId, 'isLoved'),
)
const totalHates = computed(() =>
  reactionStore.getTotalReactionsForComponent(props.componentId, 'isHated'),
)

// Fetch the reaction when componentId changes
watch(
  () => props.componentId,
  async (newId) => {
    if (newId) {
      await reactionStore.fetchReactionsByComponentId(newId) // Fetch all reactions for the component
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
  // Toggle the selected reaction and turn off others
  Object.keys(reaction.value).forEach((key) => {
    reaction.value[key as keyof typeof reaction.value] = false
  })
  reaction.value[reactionType] = true

  // Check if there is an existing reaction and update it
  const existingReaction = reactionStore.getUserReactionForComponent(
    props.componentId,
    userId.value,
  )
  if (existingReaction) {
    await reactionStore.updateReaction(existingReaction.id, {
      ...reaction.value,
    })
  } else {
    // Create a new reaction if no previous reaction exists
    await reactionStore.createReaction({
      userId: userId.value,
      componentId: props.componentId,
      ...reaction.value,
    })
  }
}
</script>

<style scoped>
/* Styles for reaction icons */
</style>
