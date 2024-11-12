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
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

const newTitle = ref('')
const errorMessage = ref('')

async function createTitle() {
  const { success, message } = await pitchStore.createTitle({ title: newTitle.value, PitchType: 'TITLE' })
  if (!success) {
    errorMessage.value = message
  } else {
    newTitle.value = ''
  }
}
</script>
