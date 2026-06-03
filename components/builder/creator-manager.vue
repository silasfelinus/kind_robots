<!-- /components/builders/creator-manager.vue -->
<template>
  <component :is="activeBuilderComponent" v-if="activeBuilderComponent" />

  <div
    v-else
    class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
  >
    Unknown builder stage: {{ activeTab || 'none selected' }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNavStore } from '@/stores/navStore'

import UserBuilder from '@/components/users/user-builder.vue'
import PitchBuilder from '@/components/pitch/pitch-builder.vue'
import DreamBuilder from '@/components/dreams/dream-builder.vue'
import AdventureBuilder from '@/components/adventure/adventure-builder.vue'
import BotBuilder from '@/components/bots/bot-builder.vue'
import RewardBuilder from '@/components/rewards/reward-builder.vue'
import ScenarioBuilder from '@/components/scenarios/scenario-builder.vue'

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

const builderComponentMap: Record<CreatorTab, Component> = {
  user: UserBuilder,
  pitch: PitchBuilder,
  dream: DreamBuilder,
  character: AdventureBuilder,
  bot: BotBuilder,
  reward: RewardBuilder,
  scenario: ScenarioBuilder,
}

const activeBuilderComponent = computed(() => {
  return builderComponentMap[activeTab.value] ?? null
})
</script>