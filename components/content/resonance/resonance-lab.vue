<!-- /components/content/resonance/resonance-lab.vue -->
<!-- /pages/lab/resonance-lab.vue -->
<template>
  <div
    class="w-full min-h-screen flex flex-col gap-8 p-4 sm:p-6 md:p-10 bg-base-200 rounded-2xl overflow-hidden"
  >
    <!-- Title + Description -->
    <div class="text-center space-y-4">
      <h1 class="text-3xl md:text-5xl font-bold text-primary">
        {{ pageStore.title }}
      </h1>
      <p class="text-lg md:text-2xl text-base-content">
        {{ pageStore.subtitle }}
      </p>
      <p class="text-md md:text-lg text-base-content/70">
        {{ pageStore.description }}
      </p>
    </div>

    <!-- Resonance Display -->
    <resonance-display class="flex-1 max-h-[65vh]" />

    <!-- Command Buttons -->
    <resonance-buttons />

    <!-- Action Buttons -->
    <div class="w-full flex flex-wrap justify-center gap-4 pt-6">
      <NuxtLink
        to="/resonance-gallery"
        class="btn btn-secondary rounded-2xl text-lg transition hover:scale-105"
      >
        Return to Gallery
      </NuxtLink>
      <button
        class="btn btn-accent rounded-2xl text-lg transition hover:scale-105"
        @click="handleReset"
      >
        Reset Resonance
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'
import { onMounted } from 'vue'

const pageStore = usePageStore()
const router = useRouter()

function handleReset() {
  router.push('/dashboard')
}
</script>
