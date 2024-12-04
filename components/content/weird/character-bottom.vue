<template>
  <div class="flex flex-col space-y-4">
    <!-- Backstory -->
    <div class="w-full">
      <label class="block text-gray-700 font-bold mb-2">Backstory</label>
      <textarea
        v-model="backstory"
        class="bg-base-200 p-4 rounded-lg shadow-md w-full"
        :disabled="keepField.backstory || !selectedCharacter"
        @input="(event) => updateField('backstory', event)"
      ></textarea>
      <button
        v-if="newCharacter.backstory"
        class="absolute top-0 right-0 mt-2 mr-2 bg-gray-700 px-2 py-1 text-sm rounded"
        @click="toggleField('backstory')"
      >
        {{ useGenerated.backstory ? 'Generated' : 'Original' }}
      </button>
    </div>

    <!-- Quirks, Inventory, Skills -->
    <div class="flex space-x-4">
      <!-- Quirks -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Quirks</label>
        <textarea
          v-model="quirks"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.quirks || !selectedCharacter"
          @input="(event) => updateField('quirks', event)"
        ></textarea>
        <button
          v-if="newCharacter.quirks"
          class="absolute top-0 right-0 mt-2 mr-2 bg-gray-700 px-2 py-1 text-sm rounded"
          @click="toggleField('quirks')"
        >
          {{ useGenerated.quirks ? 'Generated' : 'Original' }}
        </button>
      </div>

      <!-- Inventory -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Inventory</label>
        <textarea
          v-model="inventory"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.inventory || !selectedCharacter"
          @input="(event) => updateField('inventory', event)"
        ></textarea>
        <button
          v-if="newCharacter.inventory"
          class="absolute top-0 right-0 mt-2 mr-2 bg-gray-700 px-2 py-1 text-sm rounded"
          @click="toggleField('inventory')"
        >
          {{ useGenerated.inventory ? 'Generated' : 'Original' }}
        </button>
      </div>

      <!-- Skills -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Skills</label>
        <textarea
          v-model="skills"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.skills || !selectedCharacter"
          @input="(event) => updateField('skills', event)"
        ></textarea>
        <button
          v-if="newCharacter.skills"
          class="absolute top-0 right-0 mt-2 mr-2 bg-gray-700 px-2 py-1 text-sm rounded"
          @click="toggleField('skills')"
        >
          {{ useGenerated.skills ? 'Generated' : 'Original' }}
        </button>
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
const newCharacter = computed(() => characterStore.generatedCharacter || {})
const keepField = computed(() => characterStore.keepField)
const useGenerated = computed(() => characterStore.useGenerated)
const character = computed(() => characterStore.selectedCharacter)
const generatedCharacter = computed(
  () => characterStore.generatedCharacter || {},
)

// Computed properties for each field
const backstory = computed<string>({
  get: () =>
    useGenerated.value.backstory
      ? newCharacter.value.backstory || ''
      : selectedCharacter.value?.backstory || '',
  set: (value) => {
    if (useGenerated.value.backstory) {
      newCharacter.value.backstory = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.backstory = value
    }
  },
})

const quirks = computed<string>({
  get: () =>
    useGenerated.value.quirks
      ? newCharacter.value.quirks || ''
      : selectedCharacter.value?.quirks || '',
  set: (value) => {
    if (useGenerated.value.quirks) {
      newCharacter.value.quirks = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.quirks = value
    }
  },
})

const inventory = computed<string>({
  get: () =>
    useGenerated.value.inventory
      ? newCharacter.value.inventory || ''
      : selectedCharacter.value?.inventory || '',
  set: (value) => {
    if (useGenerated.value.inventory) {
      newCharacter.value.inventory = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.inventory = value
    }
  },
})

const skills = computed<string>({
  get: () =>
    useGenerated.value.skills
      ? newCharacter.value.skills || ''
      : selectedCharacter.value?.skills || '',
  set: (value) => {
    if (useGenerated.value.skills) {
      newCharacter.value.skills = value
    } else if (selectedCharacter.value) {
      selectedCharacter.value.skills = value
    }
  },
})

// Update field values
function updateField(field: keyof Character, event: Event) {
  const target = event.target as HTMLInputElement
  if (!target || !character.value) return

  const value = target.value
  if (useGenerated.value[field]) {
    characterStore.generatedCharacter = {
      ...generatedCharacter.value,
      [field]: value,
    }
  } else {
    characterStore.selectedCharacter = {
      ...character.value,
      [field]: value,
    }
  }
}

function toggleField(field: keyof typeof useGenerated.value) {
  if (!selectedCharacter.value || !newCharacter.value) return
  useGenerated.value[field] = !useGenerated.value[field]
}
</script>
