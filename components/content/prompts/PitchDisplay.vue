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
        <!-- Pitch Content -->
        <div>
          <p class="text-sm text-secondary">{{ pitch.pitch }}</p>

          <!-- Button to Expand for Editing -->
          <button
            class="text-blue-500 mt-2 underline"
            @click="toggleExpand(pitch.id)"
          >
            {{ expandedPitchId === pitch.id ? 'Collapse' : 'Expand' }} Details
          </button>

          <!-- Expanded Editable Fields -->
          <div v-if="expandedPitchId === pitch.id" class="mt-4">
            <div class="mb-4">
              <label for="title" class="block text-sm font-medium text-gray-700"
                >Title</label
              >
              <input
                v-model="pitch.title"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div class="mb-4">
              <label
                for="designer"
                class="block text-sm font-medium text-gray-700"
                >Designer</label
              >
              <input
                v-model="pitch.designer"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div class="mb-4">
              <label
                for="flavorText"
                class="block text-sm font-medium text-gray-700"
                >Flavor Text</label
              >
              <textarea
                v-model="pitch.flavorText"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                rows="3"
              ></textarea>
            </div>

            <div class="mb-4">
              <label
                for="highlightImage"
                class="block text-sm font-medium text-gray-700"
                >Highlight Image URL</label
              >
              <input
                v-model="pitch.highlightImage"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <button
              class="bg-primary hover:bg-primary-focus text-white py-2 px-4 rounded-full"
              @click="saveChanges(pitch)"
            >
              Save Changes
            </button>
          </div>
        </div>

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
import { ref, computed, onMounted } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useUserStore } from './../../../stores/userStore'
import { useReactionStore } from './../../../stores/reactionStore'

// Initialize pitch and reaction stores
const pitchStore = usePitchStore()
const reactionStore = useReactionStore()
const userStore = useUserStore()

// Track which pitch is currently expanded for editing
const expandedPitchId = ref<number | null>(null)

// Toggle the expanded state of the pitch for editing
const toggleExpand = (pitchId: number) => {
  expandedPitchId.value = expandedPitchId.value === pitchId ? null : pitchId
}

// Fetch brainstorm pitches on component mount
onMounted(() => {
  pitchStore.fetchBrainstormPitches()
})

// Access pitches by title from the store
const pitchesByTitle = computed(() => pitchStore.pitchesByTitle)

// Save the edited changes of a pitch
const saveChanges = (pitch: Pitch) => {
  pitchStore.updatePitch(pitch.id, {
    title: pitch.title,
    designer: pitch.designer,
    flavorText: pitch.flavorText,
    highlightImage: pitch.highlightImage,
  })
}

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
