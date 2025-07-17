<template>
  <div
    class="grid grid-cols-2 md:grid-cols-3 gap-3 px-2 py-3 w-full mx-auto rounded-2xl"
  >
    <div
      v-for="mode in modes"
      :key="mode.name"
      class="group flex flex-col items-center justify-between border border-base-300 bg-base-100 rounded-2xl p-4 transition-all cursor-pointer hover:bg-base-200"
    >
      <!-- Icon Button -->
      <div
        @click="navigateToAdd(mode)"
        :title="`Add ${mode.label}`"
        class="flex items-center justify-center w-12 h-12 rounded-full bg-base-300 border border-base-content/20 hover:bg-primary hover:text-white transition mb-2"
      >
        <Icon :name="mode.icon" class="w-6 h-6" />
      </div>

      <!-- Label Button -->
      <div
        @click="navigateToGallery(mode)"
        :title="`${mode.label} Gallery`"
        class="text-sm font-semibold text-center group-hover:text-primary transition"
      >
        {{ mode.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDisplayStore, type displayModeState } from '@/stores/displayStore'
import { modes } from '@/stores/seeds/modeLinks'

const router = useRouter()
const displayStore = useDisplayStore()

function navigateToAdd(mode: (typeof modes)[number]) {
  displayStore.setMode(mode.name as displayModeState)
  displayStore.setAction('add')
  router.push(mode.addRoute)
}

function navigateToGallery(mode: (typeof modes)[number]) {
  displayStore.setMode(mode.name as displayModeState)
  displayStore.setAction('gallery')
  router.push(mode.galleryRoute)
}
</script>
