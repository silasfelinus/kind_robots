<template>
  <div>
    <h1>Content Manager</h1>

    <button @click="refreshContent">Refresh Content</button>

    <div v-if="contentStore.page">
      <h2>Current Page</h2>
      <p>Title: {{ contentStore.page.title }}</p>
      <p>Subtitle: {{ contentStore.page.subtitle }}</p>
      <p>Layout: {{ contentStore.page.layout }}</p>
      <p>Image: {{ contentStore.page.image }}</p>
      <p>Gallery: {{ contentStore.page.gallery }}</p>
    </div>

    <div v-if="errorStore.message">
      <h2>Error</h2>
      <p>Type: {{ errorStore.type }}</p>
      <p>Message: {{ errorStore.message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContentStore } from '../../../stores/contentStore'
import { useErrorStore } from '../../../stores/errorStore'

const contentStore = useContentStore()
const errorStore = useErrorStore()

const refreshContent = async () => {
  try {
    await contentStore.refreshContent()
  } catch (error) {
    console.error(error)
  }
}
</script>
