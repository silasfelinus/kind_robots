<template>
  <select v-model="characterStore.selectedCharacter">
    <option
      v-for="character in characterStore.characters"
      :key="character.id"
      :value="character"
    >
      {{ character.name }} the {{character.honorific}}
    </option>
  </select>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()
</script>
