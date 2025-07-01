<!-- /components/content/hybrids/animal-picker.vue -->
<template>
  <div class="w-full space-y-2">
    <!-- Label & Random -->
    <div class="flex justify-between items-center">
      <label class="text-sm font-semibold">{{ label }}</label>
      <button
        class="btn btn-xs btn-outline"
        @click="$emit('click-random')"
        title="Randomize"
      >
        🎲
      </button>
    </div>

    <!-- Animal Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <animal-card
        v-for="animal in animalDataList"
        :key="animal.name"
        :animal="animal"
        :class="{
          'ring-2 ring-primary': modelValue === animal.name,
        }"
        @select="selectAnimal(animal.name)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { animalDataList } from '@/stores/utils/enrichedAnimalData'

const props = defineProps<{
  modelValue: string
  label?: string
  target: 'animalOne' | 'animalTwo'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'click-random'): void
}>()

function selectAnimal(name: string) {
  emit('update:modelValue', name)
}
</script>
