<template>
  <div
    class="w-full mb-6 p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all"
  >
    <div v-if="reward?.value">
      <!-- Header Section -->
      <div class="flex items-center gap-6">
        <!-- Reward Image or Icon -->
        <div class="flex-shrink-0">
          <img
            v-if="computedImage"
            :src="computedImage"
            alt="Reward image"
            class="h-24 w-24 object-cover rounded-lg"
          />
          <Icon
            v-else-if="reward.value.icon"
            :name="reward.value.icon"
            class="h-24 w-24 text-primary"
          />
          <div
            v-else
            class="h-24 w-24 flex items-center justify-center bg-base-200 rounded-lg"
          >
            <span class="text-sm text-gray-500">No Image</span>
          </div>
        </div>

        <!-- Reward Info -->
        <div class="flex-grow">
          <h2 class="text-xl font-bold text-gray-800">Magic Item</h2>
          <p class="mt-2 text-sm">
            <span class="font-bold">Text:</span>
            {{ reward.value.text || 'No text' }}
          </p>
          <p class="mt-1 text-sm">
            <span class="font-bold">Power:</span>
            {{ reward.value.power || 'N/A' }}
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Designer: {{ designerName || 'Unknown' }}
          </p>
        </div>
        <button
          class="text-sm text-error underline hover:no-underline ml-auto"
          @click="deselectReward"
        >
          Deselect
        </button>
      </div>

      <!-- Debugging Details Toggle -->
      <button
        class="mt-4 text-sm text-primary underline hover:no-underline"
        @click="toggleDetails"
      >
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </button>

      <!-- Full Object Details -->
      <div
        v-if="showDetails"
        class="mt-2 bg-base-200 border rounded-lg p-4 text-sm"
      >
        <h3 class="font-semibold mb-2">Debugging Info:</h3>
        <pre class="whitespace-pre-wrap text-gray-600">
            {{ JSON.stringify(reward.value, null, 2) }}
          </pre
        >
      </div>
    </div>

    <!-- Reward Selector -->
    <reward-selector v-else />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

// Props
const { reward: propReward } = defineProps({
  reward: { type: Object, required: false, default: null },
})

// Stores
const rewardStore = useRewardStore()
const artStore = useArtStore()
const userStore = useUserStore()

// Selected Reward
const reward = computed(() => propReward || rewardStore.selectedReward)

const artImage = ref<{ fileType: string; imageData: string } | null>(null)

const computedImage = computed(() =>
  artImage.value
    ? `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
    : reward?.value?.imagePath || null,
)

const designerName = computed(() =>
  reward?.value?.userId
    ? userStore.getUserNameByUserId(reward.value.userId) || 'Unknown'
    : 'Unknown',
)

// Debugging Details Toggle
const showDetails = ref(false)
const toggleDetails = () => (showDetails.value = !showDetails.value)

// Load Art Image Reactively
const loadArtImage = async () => {
  if (reward?.value?.artImageId) {
    try {
      const result = await artStore.getArtImageById(reward.value.artImageId)
      if (result) {
        artImage.value = {
          fileType: result.fileType,
          imageData: result.imageData,
        }
      }
    } catch (error) {
      console.error('Failed to load reward image:', error)
    }
  } else {
    artImage.value = null
  }
}

// Deselect Reward
const deselectReward = () => {
  rewardStore.selectedReward = null
}

// Watch Reward for Changes
watch(reward, loadArtImage, { immediate: true })
</script>
