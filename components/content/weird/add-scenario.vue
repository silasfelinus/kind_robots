<template>
  <div class="w-full md:w-3/4 p-4 mx-auto overflow-y-auto">
    <h1 class="text-2xl font-bold text-gray-700 mb-4">Create a New Scenario</h1>

    <!-- Scenario Details -->
    <div class="grid gap-4 mb-6">
      <input
        v-model="scenarioForm.title"
        type="text"
        placeholder="Scenario Title"
        class="w-full p-3 rounded-lg border"
      />
      <textarea
        v-model="scenarioForm.description"
        placeholder="Describe your scenario..."
        class="w-full p-3 rounded-lg border"
        rows="4"
      ></textarea>
      <textarea
        v-model="scenarioForm.locations"
        placeholder="Enter scenario locations (comma-separated)..."
        class="w-full p-3 rounded-lg border"
        rows="2"
      ></textarea>
      <textarea
        v-model="scenarioForm.genres"
        placeholder="Enter genres (comma-separated)..."
        class="w-full p-3 rounded-lg border"
        rows="2"
      ></textarea>
      <textarea
        v-model="scenarioForm.inspirations"
        placeholder="Enter inspirations (comma-separated)..."
        class="w-full p-3 rounded-lg border"
        rows="2"
      ></textarea>
    </div>

    <!-- Intros Section -->
    <div class="mb-6">
      <h2 class="text-lg font-medium">Scenario Intros</h2>
      <div class="grid gap-2 mb-4">
        <input
          v-model="introTitle"
          type="text"
          placeholder="Intro Title (in caps)..."
          class="w-full p-3 rounded-lg border"
        />
        <textarea
          v-model="introPrompt"
          placeholder="Enter intro prompt..."
          class="w-full p-3 rounded-lg border"
          rows="2"
        ></textarea>
        <button class="btn btn-primary w-full" @click="addIntro">
          Add Intro
        </button>
      </div>

      <div v-if="scenarioForm.intros.length" class="space-y-2">
        <div
          v-for="(intro, index) in scenarioForm.intros"
          :key="index"
          class="p-3 rounded-lg border bg-gray-100 flex justify-between items-center"
        >
          <span>{{ intro }}</span>
          <button
            class="btn btn-error"
            @click="removeIntro(index)"
          >
            Remove
          </button>
        </div>
      </div>
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
          v-model="scenarioForm.artPrompt"
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
      {{ isSaving ? 'Saving...' : 'Save Scenario' }}
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

const scenarioForm = ref<{
  title: string
  description: string
  locations: string
  genres: string
  inspirations: string
  intros: string[]
  artPrompt: string
  imagePath: string | null
  artImageId: number | null
}>({
  title: '',
  description: '',
  locations: '',
  genres: '',
  inspirations: '',
  intros: [],
  artPrompt: '',
  imagePath: null,
  artImageId: null,
})

// Temporary intro fields
const introTitle = ref('')
const introPrompt = ref('')

// Computed property for resolving the scenario's active image
const resolvedActiveImage = computed(() => {
  return scenarioForm.value.imagePath || defaultPlaceholder
})

// Add intro to the scenario
function addIntro() {
  if (!introTitle.value || !introPrompt.value) {
    alert('Please provide both an intro title and prompt.')
    return
  }

  const formattedIntro = `${introTitle.value.toUpperCase()}: ${introPrompt.value}`
  scenarioForm.value.intros.push(formattedIntro)

  // Reset fields
  introTitle.value = ''
  introPrompt.value = ''
}

// Remove intro by index
function removeIntro(index: number) {
  scenarioForm.value.intros.splice(index, 1)
}

// Generate art for the scenario
async function generateArtImage() {
  if (!scenarioForm.value.artPrompt) {
    alert('Please provide an art prompt to generate art.')
    return
  }

  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: scenarioForm.value.artPrompt,
      title: scenarioForm.value.title || 'Untitled Scenario',
      collection: 'scenarios',
    })

    if (response.success && response.data) {
      scenarioForm.value.imagePath = null
      scenarioForm.value.artImageId = response.data.artImageId
    } else {
      throw new Error('Art generation failed.')
    }
  } catch (error) {
    console.error('Error generating art:', error)
  } finally {
    isGeneratingArt.value = false
  }
}

// Select a random image from the gallery
async function changeToRandomImage() {
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) {
      scenarioForm.value.imagePath = randomImage
    } else {
      console.error('Failed to pick a random image.')
    }
  } catch (error) {
    console.error('Error picking random image:', error)
  }
}

function handleUploadedArtImage(id: number) {
  scenarioForm.value.artImageId = id
}

// Save the scenario
async function saveScenario() {
  if (!scenarioForm.value.title) {
    alert('Please provide a title for the scenario.')
    return
  }

  isSaving.value = true
  try {
    const userId = userStore.userId() // Dynamically fetch the userId
    await scenarioStore.createScenario({
      ...scenarioForm.value,
      userId, // Include the fetched userId
    })
    alert('Scenario saved successfully!')
    scenarioForm.value = {
      title: '',
      description: '',
      locations: '',
      genres: '',
      inspirations: '',
      intros: [],
      artPrompt: '',
      imagePath: null,
      artImageId: null,
    }
  } catch (error) {
    console.error('Error saving scenario:', error)
  } finally {
    isSaving.value = false
  }
}

</script>
