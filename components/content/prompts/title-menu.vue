<template>
  <div>
    <!-- Custom Title Input -->
    <label class="block text-gray-700 text-sm font-bold mb-2" for="customTitle">
      Custom Title (Optional)
    </label>
    <input
      id="customTitle"
      v-model="customTitle"
      class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
      type="text"
      placeholder="Enter a custom title"
    />

    <!-- Existing Title Selection -->
    <label class="block text-gray-700 text-sm font-bold mb-2" for="titleSelect">
      Select Existing Title
    </label>
    <select
      id="titleSelect"
      v-model="selectedTitle"
      class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    >
      <option v-for="title in availableTitles" :key="title.id" :value="title">
        {{ title.title }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePitchStore, type Pitch, PitchType } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'

// Initialize user store to access `userId`
const userStore = useUserStore()

const pitchStore = usePitchStore()
const customTitle = ref('')
const selectedTitle = ref<Pitch | null>(null)

// Filter titles based on the selected PitchType
const availableTitles = computed(() =>
  pitchStore.pitches.filter((p) => p.PitchType === PitchType.TITLE),
)

// Watch for changes and update the store with an appropriate object
watch([customTitle, selectedTitle], ([newCustom, newSelected]) => {
  if (newCustom) {
    // Create a temporary object for custom titles
    pitchStore.selectedTitle = {
      id: -1, // Temporary ID for custom entries
      title: newCustom,
      pitch: newCustom,
      PitchType: PitchType.TITLE,
      createdAt: new Date(),
      updatedAt: null,
      designer: null,
      flavorText: null,
      highlightImage: null,
      isPublic: true,
      userId: userStore.userId,
      artImageId: null,

      // Add default values for missing fields
      isMature: false,
      imagePrompt: null,
      description: null,
      examples: null,
    }
  } else if (newSelected) {
    // Assign the selected title directly
    pitchStore.selectedTitle = newSelected
  }
})
</script>
