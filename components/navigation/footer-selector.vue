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
import StoryFooter from '~/components/weird/story-footer.vue'
import ThemeFooter from '~/components/wonderlab/theme-footer.vue'
import UserFooter from '@/components/user/user-footer.vue'
import LabFooter from '@/components/wonderlab/lab-footer.vue'
import BrainstormFooter from '@/components/brainstorm/brainstorm-footer.vue'
import GiftshopFooter from '@/components/giftshop/giftshop-footer.vue'
import DreamFooter from '@/components/dreams/dream-footer.vue'
import RewardFooter from '@/components/rewards/reward-footer.vue'
import CharacterFooter from '@/components/characters/character-footer.vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

type FooterName = (typeof displayStore.footerComponentNames)[number]

const footerOptions = [...displayStore.footerComponentNames] as FooterName[]

const footerComponentMap: Record<FooterName, Component> = {
  fx: ButterflyFooter,
  bot: BotFooter,
  art: ArtFooter,
  story: StoryFooter,
  theme: ThemeFooter,
  user: UserFooter,
  lab: LabFooter,
  brainstorm: BrainstormFooter,
  giftshop: GiftshopFooter,
  dream: DreamFooter,
  reward: RewardFooter,
  character: CharacterFooter,
}

function isFooterName(value: unknown): value is FooterName {
  return (
    typeof value === 'string' && footerOptions.includes(value as FooterName)
  )
}

function normalizeFooterName(value: unknown): FooterName {
  return isFooterName(value) ? value : 'bot'
}

const activeFooter = computed<FooterName>(() => {
  return normalizeFooterName(displayStore.footerComponent)
})

const activeComponent = computed<Component>(() => {
  return footerComponentMap[activeFooter.value] ?? BotFooter
})

watchEffect(() => {
  const normalized = normalizeFooterName(displayStore.footerComponent)

  if (displayStore.footerComponent !== normalized) {
    displayStore.setFooterComponent(normalized)
  }
})
</script>
