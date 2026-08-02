<template>
  <div class="kr-surface">
    <WishmasterPage v-if="pageStore.workspaceCardKey === 'wishmaster'" />
    <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
    <AppmakerPage v-else-if="pageStore.workspaceCardKey === 'appmaker'" />
    <ConductorPitchManager
      v-else-if="pageStore.workspaceCardKey === 'brainstorm'"
    />
    <ConductorProjectGalleryPage v-else-if="showConductorGallery" />
    <ConductorPage v-else />
    <PlanProjectsGrid />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppmakerPage from '@/components/pages/appmaker-page.vue'
import ConductorProjectGalleryPage from '@/components/pages/conductor-project-gallery-page.vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import ConductorPitchManager from '@/components/pages/conductor-pitch-manager.vue'
import PlanProjectsGrid from '@/components/conductor/plan-projects-grid.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import WishmasterPage from '@/components/pages/wishmaster-page.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const showConductorGallery = computed(() => {
  return !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
})
</script>
