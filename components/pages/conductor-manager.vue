<template>
  <WishmasterPage v-if="pageStore.workspaceCardKey === 'wishmaster'" />
  <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
  <ConductorOverviewGalleryPage v-else-if="showConductorGallery" />
  <ConductorPage v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ConductorOverviewGalleryPage from '@/components/pages/conductor-overview-gallery-page.vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import WishmasterPage from '@/components/pages/wishmaster-page.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const showConductorGallery = computed(() => {
  return !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
})
</script>
