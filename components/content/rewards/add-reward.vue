<template>
  <div class="w-full md:w-3/4 p-4 mx-auto overflow-y-auto">
    <h1 class="text-2xl font-bold text-gray-700 mb-4">Create a New Reward</h1>

    <!-- Reward Details -->
    <div class="grid gap-4 mb-6">
      <!-- Reward Name -->
      <input
        v-model="rewardForm.text"
        type="text"
        placeholder="Reward Name"
        class="w-full p-3 rounded-lg border"
        required
      />

      <!-- Reward Power -->
      <input
        v-model="rewardForm.power"
        type="text"
        placeholder="Power (e.g., '10 Attack')"
        class="w-full p-3 rounded-lg border"
        required
      />

      <!-- Collection Name -->
      <input
        v-model="rewardForm.collection"
        type="text"
        placeholder="Collection Name"
        class="w-full p-3 rounded-lg border"
      />

      <!-- Icon Selection -->
      <div>
        <label for="icon" class="block text-sm font-medium text-gray-600">
          Icon
        </label>
        <select
          id="icon"
          v-model="rewardForm.icon"
          required
          class="p-2 rounded-lg bg-base-300 w-full"
        >
          <option
            v-for="(name, label) in IconMap"
            :key="label"
            :value="name"
          >
            {{ label }} - {{ name }}
          </option>
        </select>
        <a
          href="https://icon-sets.iconify.design/game-icons/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 underline text-sm mt-1 block"
        >
          Explore more icons
        </a>
      </div>
    </div>

    <!-- Reward Art Section -->
    <div class="mb-6">
      <h2 class="text-lg font-medium flex justify-between items-center">
        Reward Art
        <gallery-selector class="w-auto" />
      </h2>
      <div class="grid gap-4">
        <!-- Reward Uploader -->
        <reward-uploader @uploaded="handleUploadedArtImage" />

        <!-- Reward Image Preview -->
        <div class="flex justify-center">
          <img
            v-if="resolvedActiveImage"
            :src="resolvedActiveImage"
            alt="Reward Image"
            class="object-cover w-48 h-64 rounded-lg"
          />
          <img
            v-else
            src="/images/rewards/default.webp"
            alt="Default Reward"
            class="object-cover w-48 h-64 rounded-lg"
          />
        </div>

        <!-- Art Prompt Textarea -->
        <textarea
          v-model="rewardForm.artPrompt"
          placeholder="Describe your reward's appearance..."
          class="w-full p-3 rounded-lg border"
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

    <!-- Save Reward -->
    <button
      class="btn btn-success w-full"
      :disabled="isSaving"
      @click="saveReward"
    >
      {{ isSaving ? 'Saving...' : 'Save Reward' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'
import { useArtStore } from '@/stores/artStore'
import IconMap from '@/training/iconMap'

// Stores
const rewardStore = useRewardStore()
const artStore = useArtStore()

// State
const isGeneratingArt = ref(false)
const isSaving = ref(false)

const defaultPlaceholder = '/images/rewards/default.webp'

const rewardForm = ref<{
  text: string
  power: string
  collection: string
  icon: string
  artPrompt: string
  imagePath: string | null
  artImageId: number | null
}>({
  text: '',
  power: '',
  collection: '',
  icon: '',
  artPrompt: '',
  imagePath: null,
  artImageId: null,
})

// Computed property for resolving the reward's active image
const resolvedActiveImage = computed(() => {
  return rewardForm.value.imagePath || defaultPlaceholder
})

// Handle uploaded art image
function handleUploadedArtImage(id: number) {
  rewardForm.value.artImageId = id
}

// Generate art for the reward
async function generateArtImage() {
  if (!rewardForm.value.artPrompt) {
    alert('Please provide an art prompt to generate art.')
    return
  }

  isGeneratingArt.value = true
  try {
    const response = await artStore.generateArt({
      promptString: rewardForm.value.artPrompt,
      title: rewardForm.value.text || 'Untitled Reward',
      collection: 'rewards',
    })

    if (response.success && response.data) {
      rewardForm.value.imagePath = null
      rewardForm.value.artImageId = response.data.artImageId
    } else {
      throw new Error('Art generation failed.')
    }
  } catch (error) {
    console.error('Error generating art:', error)
  } finally {
    isGeneratingArt.value = false
  }
}

// Save the reward
async function saveReward() {
  if (!rewardForm.value.text || !rewardForm.value.icon) {
    alert('Please fill in all required fields.')
    return
  }

  isSaving.value = true
  try {
    await rewardStore.createReward(rewardForm.value)
    alert('Reward saved successfully!')
    rewardForm.value = {
      text: '',
      power: '',
      collection: '',
      icon: '',
      artPrompt: '',
      imagePath: null,
      artImageId: null,
    }
  } catch (error) {
    console.error('Error saving reward:', error)
    alert('Failed to save reward. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>
