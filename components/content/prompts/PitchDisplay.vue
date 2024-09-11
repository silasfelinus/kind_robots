<template>
  <div>
    <!-- Iterate over the grouped pitches by title -->
    <div v-for="(pitches, title) in pitchesByTitle" :key="title" class="mb-6">
      <!-- Display Title -->
      <h3 class="text-lg font-bold mb-2">{{ title }}</h3>

      <!-- Iterate over each pitch within the title group -->
      <div
        v-for="pitch in pitches"
        :key="pitch.id"
        class="bg-base-100 shadow-md rounded-lg p-4 mb-4"
      >
        <p class="text-sm text-secondary">{{ pitch.pitch }}</p>

        <!-- Reaction Buttons -->
        <div class="flex items-center justify-between mt-4">
          <button
            class="text-red-500 hover:text-red-600 flex items-center"
            @click="reactToPitch(pitch, 'LOVED')"
          >
            <icon name="love" class="text-lg mr-1" />
            Love
          </button>
          <button
            class="text-yellow-500 hover:text-yellow-600 flex items-center"
            @click="reactToPitch(pitch, 'CLAPPED')"
          >
            <icon name="clap" class="text-lg mr-1" />
            Clap
          </button>
          <button
            class="text-blue-500 hover:text-blue-600 flex items-center"
            @click="reactToPitch(pitch, 'BOOED')"
          >
            <icon name="boo" class="text-lg mr-1" />
            Boo
          </button>
        </div>
      </div>

      <!-- Button to load more pitches with the same title -->
      <button
        class="text-blue-500 mt-4 underline"
        @click="loadMorePitches(title)"
      >
        Load more pitches for {{ title }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useUserStore } from './../../../stores/userStore'
import { useReactionStore } from './../../../stores/reactionStore'

// Initialize pitch and reaction stores
const pitchStore = usePitchStore()
const reactionStore = useReactionStore()
const userStore = useUserStore()

// Fetch brainstorm pitches on component mount
onMounted(() => {
  pitchStore.fetchBrainstormPitches()
})

// Access pitches by title from the store
const pitchesByTitle = computed(() => pitchStore.pitchesByTitle)

// Load more pitches by title
const loadMorePitches = (title: string) => {
  pitchStore.fetchMorePitchesByTitle(title)
}

// Handle pitch reactions
const reactToPitch = async (pitch: Pitch, reactionType: string) => {
  try {
    await reactionStore.createReaction({
      pitchId: pitch.id,
      userId: userStore.userId,
      reactionType,
    })
  } catch (error) {
    console.error('Failed to react to pitch:', error)
  }
}
</script>

<style scoped>
/* Add any custom styles you need here */
</style>
