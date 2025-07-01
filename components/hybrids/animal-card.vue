<!-- /components/content/hybrid/animal-card.vue -->
<template>
  <div
    class="cursor-pointer border rounded-xl p-2 hover:shadow-lg transition"
    @click="$emit('select', animal.name)"
  >
    <img
      :src="animal.imageUrl"
      alt=""
      class="w-full h-32 object-cover rounded-md mb-2"
    />
    <div class="text-lg font-bold">{{ animal.icon }} {{ animal.name }}</div>
    <p class="text-sm opacity-70">{{ animal.description }}</p>
    <a
      :href="animal.wikiUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs text-blue-500 underline mt-1 inline-block"
    >
      Learn more
    </a>
  </div>
</template>

<script setup lang="ts">
import type { AnimalData } from '~/stores/utils/animalData'

defineProps<{
  animal: AnimalData
}>()
defineEmits(['select'])
</script>
