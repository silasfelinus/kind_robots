<template>
  <div class="kr-surface">
    <ConductorPublicProjects v-if="!userStore.isAdmin" />
    <TabScrollRegion v-else-if="pageStore.workspaceCardKey === 'appmaker'">
      <AppmakerPage />
    </TabScrollRegion>
    <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
    <ConductorPitchManager
      v-else-if="pageStore.workspaceCardKey === 'proposed'"
    />
    <ConductorProjectGalleryPage v-else-if="showConductorGallery" />
    <TabScrollRegion v-else-if="projectSlug">
      <ProjectDetail :slug="projectSlug" />
    </TabScrollRegion>
    <ConductorPage v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppmakerPage from '@/components/pages/appmaker-page.vue'
import ProjectDetail from '@/components/conductor/project-detail.vue'
import ConductorProjectGalleryPage from '@/components/pages/conductor-project-gallery-page.vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import ConductorPitchManager from '@/components/pages/conductor-pitch-manager.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import TabScrollRegion from '@/components/conductor/tab-scroll-region.vue'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import ConductorPublicProjects from '@/components/pages/conductor-public-projects.vue'

const pageStore = usePageStore()
const userStore = useUserStore()
const route = useRoute()
const utilityKeys = new Set([
  'overview',
  'tasks',
  'proposed',
  'appmaker',
  'portos',
])

const showConductorGallery = computed(() => {
  return (
    !pageStore.workspaceCardKey || pageStore.workspaceCardKey === 'overview'
  )
})

const projectSlug = computed(() => {
  const key = pageStore.workspaceCardKey
  return key && !utilityKeys.has(key) ? key : ''
})

const requestedProject = computed(() => {
  const value = route.query.project
  const slug = Array.isArray(value) ? value[0] : value
  return typeof slug === 'string' &&
    /^(?=.*[a-z])[a-z0-9][a-z0-9-]*$/.test(slug)
    ? slug
    : ''
})

watch(
  [requestedProject, () => pageStore.page, () => userStore.isAdmin],
  ([slug, , isAdmin]) => {
    if (!isAdmin || !slug || utilityKeys.has(slug)) return
    if (pageStore.workspaceCardKey !== slug) pageStore.setWorkspaceCardKey(slug)
  },
  { immediate: true },
)
</script>
