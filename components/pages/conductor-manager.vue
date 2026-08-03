<template>
  <div class="kr-surface">
    <TabScrollRegion v-if="needsScrollWrap">
      <WishmasterPage v-if="pageStore.workspaceCardKey === 'wishmaster'" />
      <AppmakerPage v-else-if="pageStore.workspaceCardKey === 'appmaker'" />
    </TabScrollRegion>
    <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
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
import TabScrollRegion from '@/components/conductor/tab-scroll-region.vue'
import WishmasterPage from '@/components/pages/wishmaster-page.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

/*
 * WishmasterPage and AppmakerPage adopt kr-unbound (interface-vision t-057)
 * so they can also mount scroll-free under pages/[...slug].vue's own
 * content-host. This kr-surface tab shell has no content-host, so this is
 * their only scroll owner in this context (t-070).
 */
const needsScrollWrap = computed(() => {
  return (
    pageStore.workspaceCardKey === 'wishmaster' ||
    pageStore.workspaceCardKey === 'appmaker'
  )
})

const showConductorGallery = computed(() => {
  return !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
})
</script>
