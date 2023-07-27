<template>
  <div id="App" class="flex flex-col md:flex-row h-screen text-gray-800 bg-gray-200">
    <div class="w-full md:w-64 bg-white shadow-md p-4">
      <vertical-nav />
    </div>
    <div class="w-full md:flex-grow p-4 overflow-auto">
      <div class="mx-auto mb-8">
        <nuxt-link to="/welcome">
          <img src="/images/kindtitle.webp" class="mx-auto rounded" alt="Title" />
        </nuxt-link>
      </div>
      <bot-selector class="mb-8" />
      <nuxt-page />
      <div class="fixed bottom-0 left-0 right-0 p-4 shadow-lg">
        <loading-bar />
        <status-notifier />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBotStore } from './stores/botStore'
import { useGalleryStore } from './stores/galleryStore'
import { useErrorStore } from './stores/errorStore'
import { useStatusStore } from './stores/statusStore'
import { useContentStore } from './stores/contentStore'

const botStore = useBotStore()
const galleryStore = useGalleryStore()
const errorStore = useErrorStore()
const statusStore = useStatusStore()
const contentStore = useContentStore()

onMounted(() => {
  statusStore.loadStore()
  errorStore.loadStore()
  botStore.loadStore()
  galleryStore.loadStore()
  contentStore.loadStore()
  // Load other stores if necessary
})
</script>
