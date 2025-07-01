<!-- /components/content/hybrids/animal-explorer.vue -->
<template>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto p-2">
    <div
      v-for="animal in animalDataList"
      :key="animal.name"
      class="group cursor-pointer rounded-xl bg-base-100 shadow hover:shadow-lg transition"
      @click="selectAnimal(animal.name)"
    >
      <img
        :src="animal.imageUrl"
        :alt="animal.name"
        class="w-full h-32 object-cover rounded-t-xl"
      />
      <div class="p-3">
        <div class="font-bold text-base flex items-center gap-1">
          <span>{{ animal.icon || '🐾' }}</span>
          <span>{{ animal.name }}</span>
        </div>
        <div class="text-xs text-base-content/60 italic line-clamp-2">
          {{ animal.description }}
        </div>
        <div class="text-[10px] mt-1 text-base-content/50">
          Traits: {{ summarizeTraits(animal.traits) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHybridStore } from '@/stores/hybridStore'
import { enrichedAnimalDataList as animalDataList } from '@/stores/utils/enrichedAnimalData'

const store = useHybridStore()

function selectAnimal(name: string) {
  store.animalOne = name
}

function summarizeTraits(traits: Record<string, any>) {
  const parts: string[] = []
  if (traits.environment) parts.push(traits.environment)
  if (traits.size) parts.push(traits.size)
  if (traits.texture) parts.push(traits.texture)
  if (traits.bodyType) parts.push(traits.bodyType)
  if (typeof traits.legs === 'number') parts.push(`${traits.legs}-legged`)
  return parts.join(', ')
}
</script>
