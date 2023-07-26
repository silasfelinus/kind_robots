<template>
  <div class="container mx-auto px-4">
    <div class="flex flex-col min-h-screen justify-between">
      <div>
        <nuxt-link to="/welcome">
          <img src="/images/kindtitle.webp" class="mx-auto rounded" alt="Title" />
        </nuxt-link>
      </div>
      <vertical-nav />
      <page-details />
      <bot-selector />
      <nuxt-page />
      <status-notifier />
    </div>
    <loading-bar v-show="statusStore.isLoading" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStatusStore } from '~/stores/statusStore'

const statusStore = useStatusStore()

let statusMessage = ref('')

onMounted(async () => {
  const statusLoadMessage = await statusStore.loadStore()
  statusMessage.value = `${statusLoadMessage}`
})
</script>
