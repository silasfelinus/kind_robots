<!-- /components/content/weird/add-scenario.vue -->
// /components/content/story/add-scenario.vue
<template>
  <div class="w-full md:w-3/4 p-4 mx-auto overflow-y-auto space-y-8">
    <h1 class="text-3xl font-bold text-center text-primary">
      Create a New Scenario
    </h1>

    <!-- Scenario Inputs -->
    <input
      v-model="scenarioForm.title"
      type="text"
      placeholder="Scenario Title"
      class="input input-bordered w-full"
    />
    <textarea
      v-model="scenarioForm.description"
      placeholder="Describe your scenario..."
      class="textarea textarea-bordered w-full"
      rows="4"
    />

    <choice-manager label="locations" model="Scenario" />
    <choice-manager label="genres" model="Scenario" />
    <choice-manager label="inspirations" model="Scenario" />

    <!-- Intros -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Scenario Intros</h2>
      <input
        v-model="introTitle"
        type="text"
        placeholder="Intro Title (in caps)..."
        class="input input-bordered w-full"
      />
      <textarea
        v-model="introPrompt"
        placeholder="Enter intro prompt..."
        class="textarea textarea-bordered w-full"
        rows="2"
      />
      <button class="btn btn-primary w-full" @click="addIntro">
        Add Intro
      </button>

      <div v-if="scenarioForm.intros.length" class="space-y-2">
        <div
          v-for="(intro, index) in scenarioForm.intros"
          :key="index"
          class="flex justify-between items-center p-3 bg-base-200 rounded-xl"
        >
          <span>{{ intro }}</span>
          <button class="btn btn-error btn-sm" @click="removeIntro(index)">
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- Art Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold flex justify-between items-center">
        Scenario Art <gallery-selector />
      </h2>
      <CheckboxToggle v-model="keepArtPrompt" label="Freeze Art Prompt" />
      <scenario-uploader @uploaded="handleUploadedArtImage" />

      <div class="flex justify-center">
        <img
          :src="resolvedActiveImage"
          alt="Scenario Image"
          class="w-48 h-64 object-cover rounded-xl"
        />
      </div>

      <button class="btn btn-accent w-full" @click="changeToRandomImage">
        Get Random Image
      </button>
      <textarea
        v-model="scenarioForm.artPrompt"
        placeholder="Describe your scenario's appearance..."
        class="textarea textarea-bordered w-full"
        :disabled="keepArtPrompt || isGeneratingArt"
      />
      <button
        class="btn btn-primary w-full"
        :disabled="isGeneratingArt"
        @click="generateArtImage"
      >
        {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
      </button>
    </div>

    <!-- Save Button -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useChoiceStore } from '@/stores/choiceStore'

const scenarioStore = useScenarioStore()
const galleryStore = useGalleryStore()
const artStore = useArtStore()
const userStore = useUserStore()
const displayStore = useDisplayStore()
const choiceStore = useChoiceStore()

const isGeneratingArt = ref(false)
const isSaving = ref(false)

const keepArtPrompt = ref(false)
const defaultPlaceholder = '/images/scenarios/space.webp'

const introTitle = ref('')
const introPrompt = ref('')

const userId = computed(() => userStore.userId)

const scenarioForm = ref({
  title: '',
  description: '',
  locations: '',
  genres: '',
  inspirations: '',
  intros: [] as string[],
  artPrompt: '',
  imagePath: null as string | null,
  artImageId: null as number | null,
})

const resolvedActiveImage = computed(
  () => scenarioForm.value.imagePath || defaultPlaceholder,
)

function addIntro() {
  if (!introTitle.value || !introPrompt.value)
    return alert('Both intro title and prompt are required.')
  scenarioForm.value.intros.push(
    `${introTitle.value.toUpperCase()}: ${introPrompt.value}`,
  )
  introTitle.value = ''
  introPrompt.value = ''
}

function removeIntro(index: number) {
  scenarioForm.value.intros.splice(index, 1)
}

function handleUploadedArtImage(id: number) {
  scenarioForm.value.artImageId = id
}

async function generateArtImage() {
  if (!scenarioForm.value.artPrompt)
    return alert('Please provide an art prompt.')
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
    }
  } catch (err) {
    console.error('Error generating art:', err)
  } finally {
    isGeneratingArt.value = false
  }
}

async function changeToRandomImage() {
  try {
    const randomImage = await galleryStore.changeToRandomImage()
    if (randomImage) scenarioForm.value.imagePath = randomImage
  } catch (err) {
    console.error('Error picking random image:', err)
  }
}

async function saveScenario() {
  if (!scenarioForm.value.title) return alert('Please provide a title.')
  isSaving.value = true
  try {
    choiceStore.applyToForm(scenarioForm.value, 'locations', 'Scenario')
    choiceStore.applyToForm(scenarioForm.value, 'genres', 'Scenario')
    choiceStore.applyToForm(scenarioForm.value, 'inspirations', 'Scenario')

    await scenarioStore.createScenario({
      ...scenarioForm.value,
      intros: scenarioForm.value.intros.join('\n'),
      userId: userId.value || 10,
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
  } catch (err) {
    console.error('Failed to save scenario:', err)
  } finally {
    isSaving.value = false
  }
}
</script>
