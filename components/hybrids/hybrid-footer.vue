<!-- /components/content/hybrid/hybrid-footer.vue -->
<template>
  <div
    class="w-full h-full bg-base-200 border-t border-base-300 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
  >
    <!-- Hybrid Summary -->
    <div
      class="flex flex-col md:flex-row items-center gap-2 text-base-content/70"
    >
      <div v-if="store.hybridName" class="font-semibold text-accent">
        🧬 {{ store.hybridName }}
      </div>
      <div v-if="store.animalOne && store.animalTwo" class="text-xs opacity-60">
        {{ store.animalOne }} + {{ store.animalTwo }} = Hybrid
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="btn btn-sm btn-outline"
        @click="store.fetchTextDirectly()"
        :disabled="store.isStreaming"
      >
        <span
          v-if="store.isStreaming"
          class="loading loading-spinner loading-xs mr-1"
        />
        🧠 Text
      </button>
      <button
        class="btn btn-sm btn-outline btn-primary"
        @click="store.generateArtFromText()"
        :disabled="!store.finalText || store.isStreaming"
      >
        🎨 Art
      </button>
      <button
        class="btn btn-sm btn-primary"
        @click="streamTextAndArt"
        :disabled="store.isStreaming"
      >
        🚀 Text + Art
      </button>
    </div>

    <!-- Session Info -->
    <div class="text-xs opacity-50 hidden md:inline">
      {{ store.history.length }} hybrids this session
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHybridStore } from '@/stores/hybridStore'
const store = useHybridStore()

async function streamTextAndArt() {
  await store.streamTextThenArt()
}
</script>
