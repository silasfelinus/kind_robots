<!-- /components/content/hybrid/animal-card.vue -->
<template>
  <div
    class="cursor-pointer border border-base-300 rounded-2xl p-3 bg-base-100 hover:shadow-lg hover:bg-base-200 transition duration-200 flex flex-col h-full"
    @click="$emit('select', animal.name)"
  >
    <img
      :src="animal.imageUrl || '/images/backtree.webp'"
      :alt="animal.name"
      class="w-full h-32 object-cover rounded-xl mb-3 border border-base-300"
    />

    <div class="text-lg font-semibold flex items-center gap-2">
      <span class="text-2xl">{{ animal.icon }}</span>
      <span>{{ animal.name }}</span>
    </div>

    <p class="text-sm text-base-content/70 line-clamp-3">
      {{ animal.description }}
    </p>

    <a
      v-if="animal.wikiUrl"
      :href="animal.wikiUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs text-blue-500 underline mt-2"
    >
      Learn more →
    </a>
  </div>
</template>

<script setup lang="ts">
import type { AnimalData } from '@/stores/utils/animalData'

defineProps<{
  animal: AnimalData
}>()

defineEmits<{
  (e: 'select', name: string): void
}>()
</script>
