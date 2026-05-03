<!-- /components/content/weird/character-title.vue -->
<template>
  <div class="w-full space-y-4 lg:w-1/2">
    <div class="flex items-center space-x-2">
      <CheckboxToggle v-model="freezeName" label="Freeze Name" />
      <label for="character-name" class="sr-only">Name</label>
      <input
        id="character-name"
        v-model="characterStore.characterForm.name"
        type="text"
        class="w-full rounded-lg border p-3"
        placeholder="Name"
        :disabled="freezeName"
      />
      <span>The</span>
      <CheckboxToggle v-model="freezeHonorific" label="Freeze Honorific" />
      <label for="character-honorific" class="sr-only">Honorific</label>
      <input
        id="character-honorific"
        v-model="characterStore.characterForm.honorific"
        type="text"
        class="w-full rounded-lg border p-3"
        placeholder="Honorific"
        :disabled="freezeHonorific"
      />
    </div>

    <div class="flex items-center space-x-4">
      <div class="flex w-1/2 flex-col">
        <CheckboxToggle v-model="freezeSpecies" label="Freeze Species" />
        <label for="character-species" class="block text-sm font-medium">
          Species
        </label>
        <input
          id="character-species"
          v-model="characterStore.characterForm.species"
          type="text"
          class="w-full rounded-lg border p-2"
          placeholder="Species"
          :disabled="freezeSpecies"
        />
      </div>

      <div class="flex w-1/2 flex-col">
        <CheckboxToggle v-model="freezeClass" label="Freeze Class" />
        <label for="character-class" class="block text-sm font-medium">
          Class
        </label>
        <input
          id="character-class"
          v-model="characterStore.characterForm.class"
          type="text"
          class="w-full rounded-lg border p-2"
          placeholder="Class"
          :disabled="freezeClass"
        />
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <div class="flex w-1/2 flex-col">
        <CheckboxToggle
          v-model="freezePersonality"
          label="Freeze Personality"
        />
        <label for="character-personality" class="block text-sm font-medium">
          Personality
        </label>
        <input
          id="character-personality"
          v-model="characterStore.characterForm.personality"
          type="text"
          class="w-full rounded-lg border p-2"
          placeholder="Personality"
          :disabled="freezePersonality"
        />
      </div>

      <div class="flex w-1/2 flex-col">
        <CheckboxToggle v-model="freezeGenre" label="Freeze Genre" />
        <label for="character-genre" class="block text-sm font-medium">
          Genre
        </label>
        <input
          id="character-genre"
          v-model="characterStore.characterForm.genre"
          type="text"
          class="w-full rounded-lg border p-2"
          placeholder="Genre"
          :disabled="freezeGenre"
        />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap justify-start space-x-2">
      <generation-toggle />
      <button
        class="btn btn-primary"
        :class="{ 'btn-active': characterStore.characterForm.isPublic }"
        @click="toggleVisibility(!characterStore.characterForm.isPublic)"
      >
        {{ characterStore.characterForm.isPublic ? 'Public' : 'Private' }}
      </button>
      <button class="btn btn-secondary" @click="refreshCharacter">
        Refresh
      </button>
      <button
        class="btn btn-primary"
        :disabled="isLoading"
        @click="handleSubmit"
      >
        {{ isLoading ? 'Saving...' : 'Save Character' }}
      </button>
    </div>

    <p v-if="errorMessage" class="text-error">
      {{ errorMessage }}
    </p>
    <p v-if="successMessage" class="text-success">
      {{ successMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const freezeName = computed({
  get: (): boolean => Boolean(characterStore.keepField.name),
  set: (value: boolean) => {
    characterStore.keepField.name = value
  },
})

const freezeHonorific = computed({
  get: (): boolean => Boolean(characterStore.keepField.honorific),
  set: (value: boolean) => {
    characterStore.keepField.honorific = value
  },
})

const freezeSpecies = computed({
  get: (): boolean => Boolean(characterStore.keepField.species),
  set: (value: boolean) => {
    characterStore.keepField.species = value
  },
})

const freezeClass = computed({
  get: (): boolean => Boolean(characterStore.keepField.class),
  set: (value: boolean) => {
    characterStore.keepField.class = value
  },
})

const freezePersonality = computed({
  get: (): boolean => Boolean(characterStore.keepField.personality),
  set: (value: boolean) => {
    characterStore.keepField.personality = value
  },
})

const freezeGenre = computed({
  get: (): boolean => Boolean(characterStore.keepField.genre),
  set: (value: boolean) => {
    characterStore.keepField.genre = value
  },
})

function toggleVisibility(value: boolean) {
  characterStore.characterForm.isPublic = value
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    await characterStore.saveCharacter()
    successMessage.value = characterStore.selectedCharacter
      ? 'Character updated successfully!'
      : 'New character created successfully!'
  } catch (error) {
    errorMessage.value = `Error: ${error}`
  } finally {
    isLoading.value = false
  }
}

function refreshCharacter() {
  characterStore.generateRandomCharacter()
}
</script>
