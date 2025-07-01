
<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    <animal-card
      v-for="animal in animalDataList"
      :key="animal.name"
      :animal="animal"
      @select="selectAnimal"
    />
  </div>
</template>

<script setup lang="ts">
import { animalDataList } from '@/stores/utils/enrichedAnimalData'
import { useHybridStore } from '@/stores/hybridStore'

const hybridStore = useHybridStore()

const props = defineProps<{
  target: 'animalOne' | 'animalTwo'
}>()

function selectAnimal(name: string) {
  hybridStore[props.target] = name
}
</script>

