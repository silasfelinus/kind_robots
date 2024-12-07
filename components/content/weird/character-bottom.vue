<template>
  <div class="flex flex-col space-y-4">
    <!-- Backstory -->
    <div class="w-full">
      <label class="block text-gray-700 font-bold mb-2">Backstory</label>
      <textarea
        v-model="backstory"
        class="bg-base-200 p-4 rounded-lg shadow-md w-full"
        :disabled="keepField.backstory || characterStore.currentDisplayMode === 'normal'"
      ></textarea>

      <!-- Generated Backstory -->
      <div
        v-if="characterStore.currentDisplayMode === 'generator'"
        class="mt-2 flex items-center space-x-4"
      >
        <span class="text-sm text-gray-500">
          Generated: {{ generatedCharacter.backstory || 'N/A' }}
        </span>
        <input
          v-model="useGenerated.backstory"
          type="checkbox"
          class="checkbox checkbox-primary"
          title="Use generated backstory"
        />
      </div>
    </div>

    <!-- Quirks, Inventory, Skills -->
    <div class="flex space-x-4">
      <!-- Quirks -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Quirks</label>
        <textarea
          v-model="quirks"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.quirks || characterStore.currentDisplayMode === 'normal'"
        ></textarea>

        <!-- Generated Quirks -->
        <div
          v-if="characterStore.currentDisplayMode === 'generator'"
          class="mt-2 flex items-center space-x-4"
        >
          <span class="text-sm text-gray-500">
            Generated: {{ generatedCharacter.quirks || 'N/A' }}
          </span>
          <input
            v-model="useGenerated.quirks"
            type="checkbox"
            class="checkbox checkbox-primary"
            title="Use generated quirks"
          />
        </div>
      </div>

      <!-- Inventory -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Inventory</label>
        <textarea
          v-model="inventory"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.inventory || characterStore.currentDisplayMode === 'normal'"
        ></textarea>

        <!-- Generated Inventory -->
        <div
          v-if="characterStore.currentDisplayMode === 'generator'"
          class="mt-2 flex items-center space-x-4"
        >
          <span class="text-sm text-gray-500">
            Generated: {{ generatedCharacter.inventory || 'N/A' }}
          </span>
          <input
            v-model="useGenerated.inventory"
            type="checkbox"
            class="checkbox checkbox-primary"
            title="Use generated inventory"
          />
        </div>
      </div>

      <!-- Skills -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Skills</label>
        <textarea
          v-model="skills"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.skills || characterStore.currentDisplayMode === 'normal'"
        ></textarea>

        <!-- Generated Skills -->
        <div
          v-if="characterStore.currentDisplayMode === 'generator'"
          class="mt-2 flex items-center space-x-4"
        >
          <span class="text-sm text-gray-500">
            Generated: {{ generatedCharacter.skills || 'N/A' }}
          </span>
          <input
            v-model="useGenerated.skills"
            type="checkbox"
            class="checkbox checkbox-primary"
            title="Use generated skills"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

// Access the character store
const characterStore = useCharacterStore()

const selectedCharacter = computed(() => characterStore.selectedCharacter)
const generatedCharacter = computed(() => characterStore.generatedCharacter || {})
const keepField = computed(() => characterStore.keepField)
const useGenerated = computed(() => characterStore.useGenerated)

// Computed properties for each field
const backstory = computed<string>({
  get: () =>
    useGenerated.value.backstory
      ? generatedCharacter.value.backstory || ''
      : selectedCharacter.value?.backstory || '',
  set: (value) => {
    if (useGenerated.value.backstory) {
      generatedCharacter.value.backstory = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.backstory = value
    }
  },
})

const quirks = computed<string>({
  get: () =>
    useGenerated.value.quirks
      ? generatedCharacter.value.quirks || ''
      : selectedCharacter.value?.quirks || '',
  set: (value) => {
    if (useGenerated.value.quirks) {
      generatedCharacter.value.quirks = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.quirks = value
    }
  },
})

const inventory = computed<string>({
  get: () =>
    useGenerated.value.inventory
      ? generatedCharacter.value.inventory || ''
      : selectedCharacter.value?.inventory || '',
  set: (value) => {
    if (useGenerated.value.inventory) {
      generatedCharacter.value.inventory = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.inventory = value
    }
  },
})

const skills = computed<string>({
  get: () =>
    useGenerated.value.skills
      ? generatedCharacter.value.skills || ''
      : selectedCharacter.value?.skills || '',
  set: (value) => {
    if (useGenerated.value.skills) {
      generatedCharacter.value.skills = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.skills = value
    }
  },
})

// Update a field value
function updateField(field: keyof typeof useGenerated.value, event: Event) {
  const target = event.target as HTMLTextAreaElement
  if (!target) return
  const value = target.value

  if (useGenerated.value[field]) {
    generatedCharacter.value[field] = value
  } else if (selectedCharacter.value) {
    selectedCharacter.value[field] = value
  }
}

// Toggle between generated and original values
function toggleField(field: keyof typeof useGenerated.value) {
  useGenerated.value[field] = !useGenerated.value[field]
}
</script>
