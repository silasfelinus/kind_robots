<template>
  <div class="w-full lg:w-1/2 space-y-4">
    <h2 class="text-lg font-medium">Character Info</h2>

    <!-- Name and Honorific -->
    <div class="flex items-center space-x-2">
      <CheckboxToggle
        v-model="characterStore.keepField.name"
        label="Freeze Name"
      />
      <label for="character-name" class="sr-only">Name</label>
      <input
        id="character-name"
        v-model="characterStore.characterForm.name"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Name"
        :disabled="characterStore.keepField.name"
      />
      <span>The</span>
      <CheckboxToggle
        v-model="characterStore.keepField.honorific"
        label="Freeze Honorific"
      />
      <label for="character-honorific" class="sr-only">Honorific</label>
      <input
        id="character-honorific"
        v-model="characterStore.characterForm.honorific"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Honorific"
        :disabled="characterStore.keepField.honorific"
      />
    </div>

    <!-- Species -->
    <div class="flex items-center space-x-2">
      <CheckboxToggle
        v-model="characterStore.keepField.species"
        label="Freeze Species"
      />
      <label for="character-species" class="block text-sm font-medium">
        Species
      </label>
      <input
        id="character-species"
        v-model="characterStore.characterForm.species"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Species"
        :disabled="characterStore.keepField.species"
      />
    </div>

    <!-- Class -->
    <div class="flex items-center space-x-2">
      <CheckboxToggle
        v-model="characterStore.keepField.class"
        label="Freeze Class"
      />
      <label for="character-class" class="block text-sm font-medium">
        Class
      </label>
      <input
        id="character-class"
        v-model="characterStore.characterForm.class"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Class"
        :disabled="characterStore.keepField.class"
      />
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap justify-start space-x-4 mt-4">
      <generation-toggle />
      <button
        class="btn btn-primary"
        :class="{ 'btn-active': characterStore.characterForm.isPublic }"
        @click="toggleVisibility(!characterStore.characterForm.isPublic)"
      >
        {{ characterStore.characterForm.isPublic ? 'Public' : 'Private' }}
      </button>
      <button class="btn btn-secondary" @click="refreshCharacter">
        Refresh Character
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()

function toggleVisibility(value: boolean) {
  characterStore.characterForm.isPublic = value
}

function refreshCharacter() {
  characterStore.generateRandomCharacter()
}
</script>
