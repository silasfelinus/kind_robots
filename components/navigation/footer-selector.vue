<!-- /components/navigation/footer-selector.vue -->
<template>
  <div
    class="h-full w-full overflow-hidden rounded-2xl border border-base-300 bg-base-100/80"
  >
    <component :is="activeComponent" class="h-full w-full" />
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect, type Component } from 'vue'
import ButterflyFooter from '@/components/butterfly/butterfly-footer.vue'
import BotFooter from '@/components/bots/bot-footer.vue'
import ArtFooter from '@/components/art/art-footer.vue'
import ScenarioFooter from '@/components/scenarios/scenario-footer.vue'
import ThemeFooter from '@/components/themes/theme-footer.vue'
import UserFooter from '@/components/user/user-footer.vue'
import LabFooter from '@/components/wonderlab/lab-footer.vue'
import BrainstormFooter from '@/components/brainstorm/brainstorm-footer.vue'
import GiftshopFooter from '@/components/giftshop/giftshop-footer.vue'
import DreamFooter from '@/components/dreams/dream-footer.vue'
import RewardFooter from '@/components/rewards/reward-footer.vue'
import CharacterFooter from '@/components/characters/character-footer.vue'
import { useDisplayStore } from '@/stores/displayStore'
import {
  footerKeys,
  fallbackFooterKey,
  type FooterKey,
} from '@/stores/helpers/dashboardHelper'

const displayStore = useDisplayStore()

const footerComponentMap: Record<FooterKey, Component> = {
  fx: ButterflyFooter,
  bot: BotFooter,
  art: ArtFooter,
  scenario: ScenarioFooter,
  theme: ThemeFooter,
  user: UserFooter,
  lab: LabFooter,
  brainstorm: BrainstormFooter,
  giftshop: GiftshopFooter,
  dream: DreamFooter,
  reward: RewardFooter,
  character: CharacterFooter,
}

function isFooterKey(value: unknown): value is FooterKey {
  return typeof value === 'string' && footerKeys.includes(value as FooterKey)
}

function normalizeFooterKey(value: unknown): FooterKey {
  return isFooterKey(value) ? value : fallbackFooterKey
}

const activeFooter = computed<FooterKey>(() => {
  return normalizeFooterKey(displayStore.footerComponent)
})

const activeComponent = computed<Component>(() => {
  return footerComponentMap[activeFooter.value] ?? ButterflyFooter
})

watchEffect(() => {
  const normalized = normalizeFooterKey(displayStore.footerComponent)
  if (displayStore.footerComponent !== normalized) {
    displayStore.setFooterComponent(normalized)
  }
})
</script>
