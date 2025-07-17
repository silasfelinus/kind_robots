<template>
  <div
    class="grid gap-4 p-4 w-full max-w-screen-xl mx-auto rounded-2xl"
    :style="{
      gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))'
    }"
  >
    <div
      v-for="mode in modes"
      :key="mode.name"
      class="group flex flex-col items-center justify-between text-center border border-base-300 bg-base-100 rounded-2xl p-4 transition-all cursor-pointer hover:bg-base-200 min-h-[10rem] w-full"
    >
      <!-- Icon Button -->
      <div
        @click="navigateToAdd(mode)"
        :title="`Add ${mode.label}`"
        class="flex items-center justify-center w-14 h-14 rounded-full bg-base-300 border border-base-content/20 hover:bg-primary hover:text-white transition mb-3"
      >
        <Icon :name="mode.icon" class="w-6 h-6" />
      </div>

      <!-- Label Button -->
      <div
        @click="navigateToGallery(mode)"
        :title="`${mode.label} Gallery`"
        class="text-sm font-semibold group-hover:text-primary transition leading-snug px-2 break-words w-full"
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
