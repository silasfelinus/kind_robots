<template>
  <div
    class="p-4 bg-white rounded-lg shadow-lg hover:shadow-xl hover:bg-primary hover:text-white cursor-pointer transition duration-300 ease-in-out"
    @click="$emit('select', reward)"
  >
    <div class="relative text-center">
      <!-- Show Art Image if Available -->
      <img
        v-if="reward.artImageId && reward.ArtImage"
        :src="reward.ArtImage.url"
        alt="Reward Art"
        class="rounded-lg shadow-md w-full h-48 object-cover mb-2"
      />
      <!-- Fallback Icon -->
      <Icon
        v-else
        :name="reward.icon || 'default-icon'"
        class="text-6xl mb-2"
      />
      <!-- Small Icon Always Visible -->
      <Icon
        :name="reward.icon || 'default-icon'"
        class="absolute top-2 right-2 text-2xl bg-white p-1 rounded-full shadow"
      />
      <p class="text-lg font-semibold mt-2">{{ reward.text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reward } from '@/stores/rewardStore'

defineProps({
  reward: {
    type: Object as () => Reward,
    required: true,
  },
})
</script>
