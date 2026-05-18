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
import ButterflyFooter from '~/abandonware/butterfly-footer.vue'
import BotFooter from '~/abandonware/bot-footer.vue'
import ArtFooter from './art-footer.vue'
import ScenarioFooter from '~/abandonware/scenario-footer.vue'
import ThemeFooter from '~/abandonware/theme-footer.vue'
import UserFooter from '~/abandonware/user-footer.vue'
import LabFooter from '~/abandonware/lab-footer.vue'
import BrainstormFooter from '~/abandonware/brainstorm-footer.vue'
import GiftshopFooter from '~/abandonware/giftshop-footer.vue'
import DreamFooter from '~/abandonware/dream-footer.vue'
import RewardFooter from '~/abandonware/reward-footer.vue'
import CharacterFooter from '~/abandonware/character-footer.vue'
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
