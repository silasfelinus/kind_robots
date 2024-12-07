<template>
  <select v-model="characterStore.selectedCharacter">
    <option
      v-for="character in characterStore.characters"
      :key="character.id"
      :value="character"
    >
      {{ character.name }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()
</script>
