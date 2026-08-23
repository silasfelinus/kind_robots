<template>
  <div class="kr-surface">
    <TabScrollRegion v-if="pageStore.workspaceCardKey === 'appmaker'">
      <AppmakerPage />
    </TabScrollRegion>
    <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
    <ConductorPitchManager
      v-else-if="pageStore.workspaceCardKey === 'brainstorm'"
    />
    <ConductorProjectGalleryPage v-else-if="showConductorGallery" />
    <TabScrollRegion v-else-if="projectSlug">
      <ProjectDetail :slug="projectSlug" />
    </TabScrollRegion>
    <ConductorPage v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppmakerPage from '@/components/pages/appmaker-page.vue'
import ProjectDetail from '@/components/conductor/project-detail.vue'
import ConductorProjectGalleryPage from '@/components/pages/conductor-project-gallery-page.vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import ConductorPitchManager from '@/components/pages/conductor-pitch-manager.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import TabScrollRegion from '@/components/conductor/tab-scroll-region.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const utilityKeys = new Set(['overview', 'tasks', 'brainstorm', 'appmaker', 'portos'])

const showConductorGallery = computed(() => {
  return (
    !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
  )
})

const projectSlug = computed(() => {
  const key = pageStore.workspaceCardKey
  return key && !utilityKeys.has(key) ? key : ''
})
</script>
