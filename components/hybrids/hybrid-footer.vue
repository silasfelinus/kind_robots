<!-- /components/content/hybrid/hybrid-footer.vue -->
<template>
  <div class="p-4 border-t mt-6 bg-base-100 rounded-t-xl">
    <div class="flex items-center justify-around text-center">
      <div class="w-1/2">
        <img
          :src="animalOne?.imageUrl"
          class="w-20 h-20 mx-auto rounded-full object-cover"
          v-if="animalOne?.imageUrl"
        />
        <div class="font-bold text-accent mt-2">
          {{ percentA }}% {{ animalOne?.name }}
        </div>
        <div class="text-xs">{{ animalOne?.description }}</div>
      </div>

      <div class="w-1/2">
        <img
          :src="animalTwo?.imageUrl"
          class="w-20 h-20 mx-auto rounded-full object-cover"
          v-if="animalTwo?.imageUrl"
        />
        <div class="font-bold text-secondary mt-2">
          {{ percentB }}% {{ animalTwo?.name }}
        </div>
        <div class="text-xs">{{ animalTwo?.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHybridStore, animalList } from '@/stores/hybridStore'
import { enrichedAnimalDataList as animalDataList } from '@/stores/utils/enrichedAnimalData'
import { computed } from 'vue'

const store = useHybridStore()

const animalOne = computed(() =>
  animalDataList.find((a) => a.name === store.animalOne),
)
const animalTwo = computed(() =>
  animalDataList.find((a) => a.name === store.animalTwo),
)

const percentA = computed(() => store.blendRatio)
const percentB = computed(() => 100 - store.blendRatio)
</script>
