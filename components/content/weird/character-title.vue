<template>
  <div class="flex flex-col space-y-4">
    <!-- Character Header -->
    <div class="flex flex-wrap items-center bg-accent rounded-lg shadow-md p-4">
      <!-- Field Rows -->
      <div
        v-for="field in fields"
        :key="field"
        class="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-2 w-full lg:w-1/2 p-2"
      >
        <!-- Label -->
        <label class="font-bold text-sm lg:text-base w-full lg:w-1/3 text-right">
          {{ fieldLabels[field] }}:
        </label>

        <!-- Editable Input -->
        <div class="flex items-center w-full lg:w-2/3">
          <input
            :value="
              characterStore.currentDisplayMode === 'generator'
                ? generatedCharacter?.[field] || character?.[field]
                : character?.[field]
            "
            :placeholder="`Enter ${fieldLabels[field]}`"
            class="input input-bordered flex-grow"
            :disabled="characterStore.currentDisplayMode === 'generator' && keepField[field]"
            @input="(event) => updateField(field, event)"
          />
        </div>

        <!-- Generated Area (Visible in Generator Mode) -->
        <div
          v-if="characterStore.currentDisplayMode === 'generator'"
          class="flex items-center w-full lg:w-2/3 lg:ml-auto"
        >
          <span class="text-gray-600 text-sm">
            Generated: {{ generatedCharacter?.[field] || 'N/A' }}
          </span>
          <input
            v-model="useGenerated[field]"
            type="checkbox"
            class="checkbox checkbox-primary ml-2"
            title="Use generated value"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="w-full mt-4 flex justify-center space-x-4">
        <button
          v-if="characterStore.currentDisplayMode === 'generator'"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          @click="applyGeneratedFields"
        >
          Apply Generated Fields
        </button>
        <button
          v-if="characterStore.currentDisplayMode === 'generator'"
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          @click="resetGeneratedFields"
        >
          Reset to Standard
        </button>
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

// Update a field using the store's method
function updateField(field: keyof typeof fieldLabels, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  characterStore.updateField(field, target.value)
}

// Apply generated fields to the character
function applyGeneratedFields() {
  if (!generatedCharacter.value || !character.value) return

  fields.forEach((field) => {
    if (useGenerated.value[field]) {
      character.value[field] = generatedCharacter.value[field] || character.value[field]
    }
  })

  alert('Generated fields applied to the character!')
}

// Reset all fields to original character values
function resetGeneratedFields() {
  if (!character.value) return

  fields.forEach((field) => {
    useGenerated.value[field] = false
  })

  alert('All fields reset to original values!')
}
</script>
