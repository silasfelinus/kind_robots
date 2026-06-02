<!-- /components/builders/creator-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <section
      v-if="activeTab === 'user'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <user-builder />
    </section>

    <section
      v-else-if="activeTab === 'pitch'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <pitch-builder />
    </section>

    <section
      v-else-if="activeTab === 'dream'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-builder />
    </section>

    <section
      v-else-if="activeTab === 'character'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <adventure-builder />
    </section>

    <section
      v-else-if="activeTab === 'bot'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <bot-builder />
    </section>

    <section
      v-else-if="activeTab === 'reward'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <reward-builder />
    </section>

    <section
      v-else-if="activeTab === 'scenario'"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <scenario-builder />
    </section>

    <div
      v-else
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown builder stage: {{ activeTab || 'none selected' }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNavStore } from '@/stores/navStore'

type CreatorTab =
  | 'user'
  | 'pitch'
  | 'dream'
  | 'character'
  | 'bot'
  | 'reward'
  | 'scenario'

const navStore = useNavStore()

const defaultDashboardKey = 'builder'
const defaultTab: CreatorTab = 'character'

const validTabs: CreatorTab[] = [
  'user',
  'pitch',
  'dream',
  'character',
  'bot',
  'reward',
  'scenario',
]

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<CreatorTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as CreatorTab)) {
    return selectedTab as CreatorTab
  }

  return defaultTab
})
</script>
