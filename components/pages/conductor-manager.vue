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
    <ConductorPage v-else />
    <!-- PlanProjectsGrid ("Projects in progress") was mounted here
         unconditionally, so it appended a second project list below EVERY
         Conductor view including the project gallery itself. Silas: "unneeded
         and distracting, and I don't want you to get the impression that we
         want something equivalent on other pages." A page shows its own
         content; it does not also get a digest of the same records stapled
         underneath. -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppmakerPage from '@/components/pages/appmaker-page.vue'
import ConductorProjectGalleryPage from '@/components/pages/conductor-project-gallery-page.vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import ConductorPitchManager from '@/components/pages/conductor-pitch-manager.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import TabScrollRegion from '@/components/conductor/tab-scroll-region.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

/* AppmakerPage uses kr-unbound when mounted under the content renderer, so the
 * embedded Conductor tab supplies the scroll owner in this context. */
const showConductorGallery = computed(() => {
  return (
    !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
  )
})
</script>
