<!-- /components/content/prompts/title-maker.vue -->
<template>
  <div>
    <h2>Create a New Title</h2>
    <input v-model="newTitle" placeholder="Enter a title" />
    <button @click="createTitle">Create Title</button>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePitchStore, PitchType } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

const newTitle = ref('')
const errorMessage = ref('')

async function createTitle() {
  const { success, message } = await pitchStore.addTitle({
    title: newTitle.value,
    PitchType: PitchType.TITLE,
  })
  if (!success) {
    errorMessage.value = message ?? 'Unknown error'
  } else {
    newTitle.value = ''
  }
}
</script>
