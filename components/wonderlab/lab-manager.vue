<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <section
      v-if="activeTab === 'memory-dungeon'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <memory-dungeon class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'screen-fx'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <screen-fx
        class="h-full min-h-0 flex-1 overflow-hidden"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'animation-manager'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <animation-manager class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <div
      v-else
      class="kr-note kr-note-warning flex min-h-0 flex-1 items-center justify-center"
    >
      Unknown Lab tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNavStore } from '@/stores/navStore'

import AnimationManager from '@/components/animation/animation-manager.vue'
import MemoryDungeon from '@/components/pages/memory-dungeon.vue'
import ScreenFx from '@/components/screenfx/screen-fx.vue'

type LabTab = 'memory-dungeon' | 'screen-fx' | 'animation-manager'

const dashboardKey = 'wonder' as const
const fallbackTab: LabTab = 'memory-dungeon'
const validTabs: LabTab[] = [
  'memory-dungeon',
  'screen-fx',
  'animation-manager',
]

const route = useRoute()
const navStore = useNavStore()

const activeTab = computed<LabTab>(() => {
  const routePath = route.path.replace(/\/+$/, '') || '/'

  // Explicit routes are authoritative. Remembered dashboard state is only a
  // fallback for embedded/global Lab surfaces and must never hijack a URL.
  if (routePath === '/play/memory') return 'memory-dungeon'
  if (routePath === '/play/screenfx') return 'screen-fx'
  if (routePath === '/build/animation-manager') return 'animation-manager'

  const selectedTab = navStore.getDashboardTab(dashboardKey)

  if (validTabs.includes(selectedTab as LabTab)) {
    return selectedTab as LabTab
  }

  return fallbackTab
})
</script>
