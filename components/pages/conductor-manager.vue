<template>
  <WishmasterPage v-if="pageStore.workspaceCardKey === 'wishmaster'" />
  <PortosPage v-else-if="pageStore.workspaceCardKey === 'portos'" />
  <ConductorPage v-else />
</template>

<script setup lang="ts">
import ConductorPage from '@/components/pages/conductor-page.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import WishmasterPage from '@/components/pages/wishmaster-page.vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
</script>
