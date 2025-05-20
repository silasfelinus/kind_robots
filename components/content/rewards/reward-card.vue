<!-- /components/content/rewards/reward-card.vue -->
<template>
  <div
    :class="[
      'relative bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
    ]"
    @click="selectReward"
  >
    <div class="relative flex justify-center items-center mb-4">
      <img
        v-if="artImage"
        :src="`data:image/${artImage.fileType};base64,${artImage.imageData}`"
        alt="Reward Art"
        class="rounded-lg object-cover w-full h-40"
        loading="lazy"
      />
      <Icon
        v-else
        :name="reward.icon || 'default-icon'"
        class="text-6xl text-gray-400"
      />
      <Icon
        :name="reward.icon || 'default-icon'"
        class="absolute top-2 right-2 text-2xl bg-white p-1 rounded-full shadow"
      />
    </div>
    <h2 class="text-lg font-bold text-gray-800 text-center mb-2">
      {{ reward.text }}
    </h2>
    <p class="text-sm text-gray-600 text-center">
      🔥 Power: {{ reward.power }}
    </p>
    <p class="text-sm text-gray-600 text-center">
      📚 Collection: {{ reward.collection }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { useRewardStore } from '@/stores/rewardStore'

const { reward } = defineProps({
  reward: {
    type: Object,
    required: true,
  },
})

const artStore = useArtStore()
const artImage = ref<ArtImage | null>(null)
const isSelected = computed(() => reward.isSelected || false)

const selectReward = () => {
  const rewardStore = useRewardStore()
  rewardStore.setRewardById(reward.id)
}

onMounted(async () => {
  if (reward.artImageId) {
    try {
      const result = await artStore.getArtImageById(reward.artImageId)
      if (result) {
        artImage.value = result
      }
    } catch (error) {
      console.error('Failed to load art image:', error)
    }
  }
})
</script>
