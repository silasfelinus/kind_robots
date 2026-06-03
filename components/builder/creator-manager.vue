<!-- /components/builders/creator-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
    <div class="min-h-0 flex-1 overflow-hidden">
      <user-builder
        v-if="activeTab === 'user'"
        class="h-full min-h-0 overflow-hidden"
      />

      <art-builder
        v-else-if="activeTab === 'art'"
        class="h-full min-h-0 overflow-hidden"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNavStore } from '@/stores/navStore'
import {
  defaultBuilderStage,
  isBuilderStageKey,
  type BuilderStageKey,
} from '@/stores/seeds/builderSchema'

import UserBuilder from '@/components/user/user-builder.vue'
import ArtDesigner from '~/components/builder/art-builder.vue'

const navStore = useNavStore()

const defaultDashboardKey = 'builder'

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<BuilderStageKey>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)
  return isBuilderStageKey(selectedTab) ? selectedTab : defaultBuilderStage
})
</script>
