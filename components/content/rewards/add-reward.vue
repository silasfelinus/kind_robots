<!-- /components/content/rewards/add-reward.vue -->
// /components/content/story/add-reward.vue
<template>
  <div class="w-full md:w-3/4 p-4 mx-auto overflow-y-auto space-y-8">
    <h1 class="text-3xl font-bold text-center text-primary">
      Create a New Reward
    </h1>

    <!-- Reward Name -->
    <input
      v-model="rewardForm.text"
      type="text"
      placeholder="Reward Name"
      class="input input-bordered w-full"
    />

    <!-- Choice Fields -->
    <choice-manager label="rewardEssence" model="Reward" />

    <!-- Power Field -->
    <input
      v-model="rewardForm.power"
      type="text"
      placeholder="Power (e.g., '10 Attack')"
      class="input input-bordered w-full"
    />

    <!-- Collection Field -->
    <input
      v-model="rewardForm.collection"
      type="text"
      placeholder="Collection Name"
      class="input input-bordered w-full"
    />

    <!-- Icon Selection -->
    <div>
      <label class="block text-sm font-medium text-base-content mb-1"
        >Icon</label
      >
      <select v-model="rewardForm.icon" class="select select-bordered w-full">
        <option v-for="(name, label) in IconMap" :key="label" :value="name">
          {{ label }} - {{ name }}
        </option>
      </select>
      <a
        href="https://icon-sets.iconify.design/game-icons/"
        target="_blank"
        rel="noopener noreferrer"
        class="link link-primary mt-1 text-sm"
      >
        Explore more icons
      </a>
    </div>

    <!-- Reward Art Section -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">Reward Art</h2>
        <gallery-selector />
      </div>

      <reward-uploader @uploaded="handleUploadedArtImage" />

      <div class="flex justify-center">
        <img
          v-if="resolvedActiveImage"
          :src="resolvedActiveImage"
          alt="Reward Image"
          class="w-48 h-64 object-cover rounded-xl shadow"
        />
      </div>

      <textarea
        v-model="rewardForm.artPrompt"
        placeholder="Describe your reward's appearance..."
        class="textarea textarea-bordered w-full"
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
import { useChoiceStore } from '@/stores/choiceStore'
import IconMap from '@/training/iconMap'

const rewardStore = useRewardStore()
const artStore = useArtStore()
const choiceStore = useChoiceStore()

const isGeneratingArt = ref(false)
const isSaving = ref(false)
const defaultPlaceholder = '/images/chest1.webp'

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

const resolvedActiveImage = computed(() => {
  return rewardForm.value.imagePath || defaultPlaceholder
})

function handleUploadedArtImage(id: number) {
  rewardForm.value.artImageId = id
}

async function generateArtImage() {
  if (!rewardForm.value.artPrompt) return alert('Please provide an art prompt.')

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
    }
  } catch (err) {
    console.error('Error generating art:', err)
  } finally {
    isGeneratingArt.value = false
  }
}

async function saveReward() {
  if (!rewardForm.value.text || !rewardForm.value.icon) {
    return alert('Please fill in all required fields.')
  }

  isSaving.value = true
  try {
    choiceStore.applyToForm(rewardForm.value, 'rewardEssence', 'Reward')
    await rewardStore.createReward(rewardForm.value)
    alert('Reward saved!')
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
    alert('Failed to save reward.')
  } finally {
    isSaving.value = false
  }
}
</script>
