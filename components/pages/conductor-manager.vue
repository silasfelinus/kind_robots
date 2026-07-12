<template>
  <div
    class="relative h-full min-h-0 overflow-hidden rounded-3xl border border-base-300/70 bg-gradient-to-br from-primary/5 via-base-200 to-secondary/10 shadow-xl"
  >
    <div
      class="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
    />
    <div
      class="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-secondary/10 blur-3xl"
    />

    <div class="relative h-full min-h-0 p-1.5 sm:p-2.5">
      <WishmasterPage v-if="pageStore.workspaceCardKey === 'wishmaster'" />
      <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
      <AppmakerPage v-else-if="pageStore.workspaceCardKey === 'appmaker'" />
      <ConductorPitchManager
        v-else-if="pageStore.workspaceCardKey === 'brainstorm'"
      />
      <ConductorOverviewGalleryPage v-else-if="showConductorGallery" />
      <ConductorPage v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppmakerPage from '@/components/pages/appmaker-page.vue'
import ConductorOverviewGalleryPage from '@/components/pages/conductor-overview-gallery-page.vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import ConductorPitchManager from '@/components/pages/conductor-pitch-manager.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import WishmasterPage from '@/components/pages/wishmaster-page.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const showConductorGallery = computed(() => {
  return !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
})
</script>
