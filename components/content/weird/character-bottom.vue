<template>
  <div class="flex flex-col space-y-4">
    <!-- Backstory -->
    <div class="w-full">
      <label class="block text-gray-700 font-bold mb-2">Backstory</label>
      <textarea
        :value="backstory"
        class="bg-base-200 p-4 rounded-lg shadow-md w-full"
        :disabled="keepField.backstory || !characterStore.generationMode"
        @input="(event) => updateField('backstory', event)"
      ></textarea>

      <!-- Generated Backstory -->
      <div
        v-if="characterStore.generationMode"
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
          @change="toggleField('backstory')"
        />
      </div>
    </div>

    <!-- Quirks, Inventory, Skills -->
    <div class="flex space-x-4">
      <!-- Quirks -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Quirks</label>
        <textarea
          :value="quirks"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.quirks || !characterStore.generationMode"
          @input="(event) => updateField('quirks', event)"
        ></textarea>

        <!-- Generated Quirks -->
        <div
          v-if="characterStore.generationMode"
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
            @change="toggleField('quirks')"
          />
        </div>
      </div>

      <!-- Inventory -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Inventory</label>
        <textarea
          :value="inventory"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.inventory || !characterStore.generationMode"
          @input="(event) => updateField('inventory', event)"
        ></textarea>

        <!-- Generated Inventory -->
        <div
          v-if="characterStore.generationMode"
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
            @change="toggleField('inventory')"
          />
        </div>
      </div>

      <!-- Skills -->
      <div class="w-1/3">
        <label class="block text-gray-700 font-bold mb-2">Skills</label>
        <textarea
          :value="skills"
          class="bg-base-200 p-4 rounded-lg shadow-md w-full"
          :disabled="keepField.skills || characterStore.generationMode"
          @input="(event) => updateField('skills', event)"
        ></textarea>

        <!-- Generated Skills -->
        <div
          v-if="characterStore.generationMode"
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
            @change="toggleField('skills')"
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
const generatedCharacter = computed(
  () => characterStore.generatedCharacter || {},
)
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

function updateField(field: keyof typeof useGenerated.value, event: Event) {
  const target = event.target as HTMLTextAreaElement
  if (!target) return

  const value = target.value

  if (useGenerated.value[field]) {
    // Ensure the field exists on generatedCharacter and is assignable
    if (generatedCharacter.value && field in generatedCharacter.value) {
      ;(generatedCharacter.value[
        field as keyof typeof generatedCharacter.value
      ] as unknown as string) = value
    }
  } else if (selectedCharacter.value) {
    // Ensure the field exists on selectedCharacter and is assignable
    if (field in selectedCharacter.value) {
      ;(selectedCharacter.value[
        field as keyof typeof selectedCharacter.value
      ] as unknown as string) = value
    }
  }
}

// Toggle between generated and original values
function toggleField(field: keyof typeof useGenerated.value) {
  useGenerated.value[field] = !useGenerated.value[field]
}
</script>
