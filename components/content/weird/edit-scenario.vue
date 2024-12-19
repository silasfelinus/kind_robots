<template>
  <div class="w-full md:w-3/4 p-4 mx-auto">
    <h1 class="text-2xl font-bold text-gray-700 mb-4">Edit Scenario</h1>

    <!-- Scenario Details -->
    <div class="grid gap-4 mb-6">
      <input
        v-model="selectedScenario.title"
        type="text"
        placeholder="Scenario Title"
        class="w-full p-3 rounded-lg border"
      />
      <textarea
        v-model="selectedScenario.description"
        placeholder="Describe your scenario..."
        class="w-full p-3 rounded-lg border"
        rows="4"
      ></textarea>
      <textarea
        v-model="selectedScenario.locations"
        placeholder="Enter scenario locations (comma-separated)..."
        class="w-full p-3 rounded-lg border"
        rows="2"
      ></textarea>
    </div>

    <!-- Scenario Art Section -->
    <div class="mb-6">
      <h2 class="text-lg font-medium flex justify-between items-center">
        Scenario Art
        <gallery-selector class="w-auto" />
      </h2>
      <div class="grid gap-4">
        <!-- Freeze Art Prompt Toggle -->
        <CheckboxToggle v-model="keepArtPrompt" label="Freeze Art Prompt" />
        <scenario-uploader @uploaded="handleUploadedArtImage" />

        <!-- Scenario Image Preview -->
        <div class="flex justify-center">
          <img
            v-if="resolvedActiveImage"
            :src="resolvedActiveImage"
            alt="Scenario Image"
            class="object-cover w-48 h-64 rounded-lg"
          />
          <img
            v-else
            src="/images/scenarios/mystery.webp"
            alt="Default Scenario"
            class="object-cover w-48 h-64 rounded-lg"
          />
        </div>

        <!-- Random Image Button -->
        <button class="btn btn-accent w-full" @click="changeToRandomImage">
          Get Random Image
        </button>

        <!-- Art Prompt Textarea -->
        <textarea
          v-model="selectedScenario.artPrompt"
          placeholder="Describe your scenario's appearance..."
          class="w-full p-3 rounded-lg border"
          :disabled="keepArtPrompt || isGeneratingArt"
        ></textarea>

        <!-- Generate Art Button -->
        <button
          class="btn btn-primary w-full"
          :disabled="isGeneratingArt"
          @click="generateArtImage"
        >
          {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
        </button>
      </div>
    </div>

    <!-- Save Scenario -->
    <button
      class="btn btn-success w-full"
      :disabled="isSaving"
      @click="saveScenario"
    >
      {{ isSaving ? 'Saving...' : 'Save Changes' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useArtStore } from '@/stores/artStore'

const scenarioStore = useScenarioStore()
const galleryStore = useGalleryStore()
const artStore = useArtStore()

const isGeneratingArt = ref(false)
const isSaving = ref(false)
const keepArtPrompt = ref(false)
const defaultPlaceholder = '/images/scenarios/space.webp'

// Use the selected scenario directly from the store
const selectedScenario = computed(() => scenarioStore.selectedScenario)

// Computed property for resolving the scenario's active image
const resolvedActiveImage = computed(() => {
  return selectedScenario.value?.imagePath || defaultPlaceholder
})

// Method: Generate art for the scenario
async function generateArtImage() {
  if (!selectedScenario.value?.artPrompt) {
    alert('Please provide an art prompt to generate art.')
    return
  }

  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: selectedScenario.value.artPrompt,
      title: selectedScenario.value.title || 'Untitled Scenario',
      collection: 'scenarios',
    })

    if (response.success && response.data) {
      selectedScenario.value.imagePath = null
      selectedScenario.value.artImageId = response.data.artImageId
    } else {
      throw new Error('Art generation failed.')
    }
  } catch (error) {
    console.error('Error generating art:', error)
  } finally {
    isGeneratingArt.value = false
  }
}

// Method: Select a random image from the gallery
async function changeToRandomImage() {
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      selectedScenario.value.imagePath = randomImage
    } else {
      console.error('Failed to pick a random image.')
    }
  } catch (error) {
    console.error('Error picking random image:', error)
  }
}

function handleUploadedArtImage(id: number) {
  selectedScenario.value.artImageId = id
}

// Method: Save the scenario
async function saveScenario() {
  if (!selectedScenario.value?.title) {
    alert('Please provide a title for the scenario.')
    return
  }

  isSaving.value = true
  try {
    await scenarioStore.updateScenario(selectedScenario.value)
    alert('Scenario updated successfully!')
  } catch (error) {
    console.error('Error updating scenario:', error)
  } finally {
    isSaving.value = false
  }
}
</script>
