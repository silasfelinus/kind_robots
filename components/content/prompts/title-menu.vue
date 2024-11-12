<template>
  <div>
    <h2>Select a Title</h2>
    <ul>
      <li
        v-for="title in titles"
        :key="title.id"
        @click="setSelectedTitle(title.id)"
        :class="{ 'selected': pitchStore.selectedTitle?.id === title.id }"
      >
        {{ title.title }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore } from '~/stores/pitchStore'
const pitchStore = usePitchStore()

const titles = computed (()=> pitchStore.titles)

function setSelectedTitle(titleId: number) {
  pitchStore.setSelectedTitle(titleId)
}
</script>
