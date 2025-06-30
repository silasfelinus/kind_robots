<!-- /components/content/prompts/pitch-gallery.vue -->
<template>
  <div class="w-full h-full relative bg-base-300 flex flex-col">
    <!-- Pitch Type Selector -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <pitch-type-selector
        v-model="selectedPitchType"
        :options="pitchTypes"
        class="w-full md:w-1/3"
      />
      <div class="flex items-center w-full md:w-1/2">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="Search pitches by title"
          placeholder="Search pitches by title..."
          class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
        />
      </div>
    </div>

    <!-- Pitch Grid -->
    <div class="min-h-0 overflow-auto">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="errorMessage"
        class="flex justify-center items-center h-full text-center"
      >
        <p class="text-lg font-bold text-red-600">{{ errorMessage }}</p>
      </div>
      <div
        v-else-if="filteredPitches.length === 0"
        class="flex w-full overflow-y-auto h-full"
      >
        <p class="text-lg font-bold text-gray-600">No pitches found.</p>
      </div>
      <div v-else class="grid grid-cols-1 gap-4">
        <PitchCard
          v-for="pitch in filteredPitches"
          :key="pitch.id"
          :pitch="pitch"
          class="h-auto"
          @click="selectPitch(pitch.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'

// Store
const pitchStore = usePitchStore()

// State
const selectedPitchType = ref(null)
const searchQuery = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

// Computed: Dynamic Pitch Types from the Store
const pitchTypes = computed(() => pitchStore.pitchTypes)

// Fetch Pitches on Mount
onMounted(async () => {
  try {
    isLoading.value = true
    await pitchStore.fetchPitches()
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load pitches:', error)
    errorMessage.value = 'Failed to load pitches. Please try again.'
    isLoading.value = false
  }
})

// Computed: Filtered and searched pitches
const filteredPitches = computed(() => {
  let pitches = pitchStore.pitches

  // Filter by pitch type
  if (selectedPitchType.value) {
    pitches = pitchStore.getPitchesByType(selectedPitchType.value)
  }

  // Search by title
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    pitches = pitches.filter((pitch) =>
      (pitch.title || '').toLowerCase().includes(query),
    )
  }

  return pitches
})

// Methods
function selectPitch(id) {
  try {
    pitchStore.setSelectedPitch(id)
  } catch (error) {
    console.error('Error selecting pitch:', error)
    errorMessage.value = 'Failed to select pitch. Please try again.'
  }
}
</script>
