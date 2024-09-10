<template>
  <div class="bg-base-100 shadow-md rounded-lg p-4 w-64">
    <h2 class="text-xl font-semibold">{{ pitch.title }}</h2>
    <p class="text-sm text-secondary">{{ pitch.pitch }}</p>

    <div class="flex items-center justify-between mt-4">
      <button
        class="text-red-500 hover:text-red-600 flex items-center"
        @click="reactToPitch('LOVED')"
      >
        <Icon name="love" class="text-lg mr-1" />
        {{ lovedCount }}
      </button>
      <button
        class="text-yellow-500 hover:text-yellow-600 flex items-center"
        @click="reactToPitch('CLAPPED')"
      >
        <Icon name="clap" class="text-lg mr-1" />
        {{ clappedCount }}
      </button>
      <button
        class="text-blue-500 hover:text-blue-600 flex items-center"
        @click="reactToPitch('BOOED')"
      >
        <Icon name="boo" class="text-lg mr-1" />
        {{ booedCount }}
      </button>
    </div>
    <p v-if="userReaction" class="mt-2 text-sm">
      You {{ userReaction }} this pitch.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReactionStore } from './../../../stores/reactionStore'
import { useUserStore } from './../../../stores/userStore'
import type { Pitch } from './../../../stores/pitchStore'
import type { Reaction } from '@prisma/client'

// Props
const props = defineProps<{ pitch: Pitch }>()

// State
const lovedCount = ref(0)
const clappedCount = ref(0)
const booedCount = ref(0)
const userReaction = ref<string | null>(null)

const reactionStore = useReactionStore()
const userStore = useUserStore()

// Fetch reactions and count them
const fetchReactions = async () => {
  try {
    const reactions = await reactionStore.fetchReactionsForPitch(props.pitch.id)

    if (Array.isArray(reactions)) {
      lovedCount.value = reactions.filter(
        (r: Reaction) => r.reactionType === 'LOVED',
      ).length
      clappedCount.value = reactions.filter(
        (r: Reaction) => r.reactionType === 'CLAPPED',
      ).length
      booedCount.value = reactions.filter(
        (r: Reaction) => r.reactionType === 'BOOED',
      ).length

      // Find the current user's reaction if any
      const userReactionData = reactions.find(
        (r: Reaction) => r.userId === userStore.userId,
      )
      if (userReactionData) {
        userReaction.value = userReactionData.reactionType
      }
    } else {
      console.error('Reactions are not an array:', reactions)
    }
  } catch (error) {
    console.error('Failed to fetch reactions:', error)
  }
}

// React to a pitch
const reactToPitch = async (reactionType: string) => {
  try {
    const existingReaction = await reactionStore.findUserReactionForPitch(
      props.pitch.id,
      userStore.userId,
    )

    if (existingReaction) {
      // Update the existing reaction with reactionType
      await reactionStore.updateReaction(existingReaction.id, { reactionType })
    } else {
      // Create a new reaction with reactionType
      await reactionStore.createReaction({
        pitchId: props.pitch.id,
        userId: userStore.userId,
        reactionType, // Ensure this is reactionType, not reaction
      })
    }

    // Update the local state
    userReaction.value = reactionType
    await fetchReactions()
  } catch (error) {
    console.error('Failed to react:', error)
  }
}

onMounted(fetchReactions)
</script>

<style scoped>
/* Add styling here */
</style>
