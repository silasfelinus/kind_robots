<!-- /app.vue -->
<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-base-100">
    <NuxtPage />

    <div class="fixed inset-0 z-50 pointer-events-none">
      <div class="pointer-events-auto">
        <footer-toggle />
        <kind-loader />
        <milestone-popup />
      </div>

      <animation-loader class="fixed z-50 pointer-events-none" />

      <div
        v-if="showSwarm"
        class="fixed inset-0 z-50 overflow-hidden pointer-events-none"
      >
        <butterfly-animation class="pointer-events-none" />
      </div>
    </div>

    <div
      v-if="isNavigating"
      class="fixed inset-0 z-40 flex items-center justify-center animate-fade-in"
    >
      <screen-debug />
      <div class="loading loading-dots loading-lg text-primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = useSmartbarStore()
const router = useRouter()

const isNavigating = ref(false)

const showSwarm = computed(() => smartbarStore.showSwarm)

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach(() => {
  window.setTimeout(() => {
    isNavigating.value = false
  }, 400)
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>
