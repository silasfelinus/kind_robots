<template>
  <div class="w-full md:w-3/4 p-4 mx-auto overflow-y-auto">
    <h1 class="text-2xl font-bold text-gray-700 mb-4">Create a New Reward</h1>

    <!-- Reward Details -->
    <div class="grid gap-4 mb-6">
      <input
        v-model="rewardForm.text"
        type="text"
        placeholder="Reward Name"
        class="w-full p-3 rounded-lg border"
      />
      <input
        v-model="rewardForm.power"
        type="text"
        placeholder="Power (e.g., '10 Attack')"
        class="w-full p-3 rounded-lg border"
      />
      <input
        v-model="rewardForm.collection"
        type="text"
        placeholder="Collection Name"
        class="w-full p-3 rounded-lg border"
      />
      <input
        v-model.number="rewardForm.rarity"
        type="number"
        placeholder="Rarity (0-100)"
        class="w-full p-3 rounded-lg border"
      />
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
  rarity: number
  artPrompt: string
  imagePath: string | null
  artImageId: number | null
}>({
  text: '',
  power: '',
  collection: '',
  rarity: 0,
  artPrompt: '',
  imagePath: null,
  artImageId: null,
})

// Computed property for resolving the reward's active image
const resolvedActiveImage = computed(() => {
  return rewardForm.value.imagePath || defaultPlaceholder
})

// Method: Generate art for the reward
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

// Method: Handle uploaded art image
function handleUploadedArtImage(id: number) {
  rewardForm.value.artImageId = id
}

// Method: Save the reward
async function saveReward() {
  if (!rewardForm.value.text) {
    alert('Please provide a name for the reward.')
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
      rarity: 0,
      artPrompt: '',
      imagePath: null,
      artImageId: null,
    }
  } catch (error) {
    console.error('Error saving reward:', error)
  } finally {
    isSaving.value = false
  }
}
</script>
