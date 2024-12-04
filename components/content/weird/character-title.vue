<template>
  <div class="flex flex-col space-y-4">
    <!-- Character Header -->
    <div class="flex flex-col space-y-2 bg-accent rounded-lg shadow-md p-4">
      <!-- Field Rows -->
      <div
        v-for="field in fields"
        :key="field"
        class="flex items-center space-x-2"
      >
        <label class="font-bold text-lg">{{ fieldLabels[field] }}:</label>
        <input
          :value="
            useGenerated[field]
              ? generatedCharacter?.[field]
              : character?.[field]
          "
          :placeholder="`Enter ${fieldLabels[field]}`"
          class="input input-bordered w-full"
          :disabled="keepField[field]"
          @input="(event) => updateField(field, event)"
        />
        <button
          v-if="generatedCharacter?.[field]"
          class="btn btn-sm btn-outline"
          @click="toggleGenerated(field)"
        >
          {{ useGenerated[field] ? 'Generated' : 'Original' }}
        </button>
        <input
          v-model="keepField[field]"
          type="checkbox"
          class="checkbox checkbox-primary"
          title="Freeze this field"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

// Access store
const characterStore = useCharacterStore()

// Define field keys and labels
const fields = ['name', 'honorific', 'species', 'class', 'genre'] as const
const fieldLabels = {
  name: 'Name',
  honorific: 'Honorific',
  species: 'Species',
  class: 'Class',
  genre: 'Genre',
} as const

// Computed properties
const character = computed(() => characterStore.selectedCharacter)
const generatedCharacter = computed(() => characterStore.generatedCharacter)
const useGenerated = computed(() => characterStore.useGenerated)
const keepField = computed(() => characterStore.keepField)

// Toggle between generated and original values
function toggleGenerated(field: keyof typeof fieldLabels) {
  useGenerated.value[field] = !useGenerated.value[field]
}

// Update field using the store's method
function updateField(field: keyof typeof fieldLabels, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  characterStore.updateField(field, target.value)
}
</script>

<style scoped>
.input {
  flex-grow: 1;
}
</style>
