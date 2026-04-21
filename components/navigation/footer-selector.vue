<!-- /components/navigation/footer-selector.vue -->
<template>
  <div
    class="flex h-full w-full items-stretch gap-2 rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <button
      type="button"
      class="flex h-full w-12 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-base-content transition hover:bg-base-300"
      aria-label="Previous footer component"
      @click="showPrevious"
    >
      <icon name="kind-icon:chevron-left" class="h-5 w-5" />
    </button>

    <div
      class="min-w-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-200/60"
    >
      <component :is="activeComponent" class="h-full w-full" />
    </div>

    <button
      type="button"
      class="flex h-full w-12 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-base-content transition hover:bg-base-300"
      aria-label="Next footer component"
      @click="showNext"
    >
      <icon name="kind-icon:chevron-right" class="h-5 w-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer-selector.vue
import { computed, watchEffect, type Component } from 'vue'
import ButterflyFooter from '@/components/butterfly/butterfly-footer.vue'
import BotFooter from '@/components/bots/bot-footer.vue'
import ArtFooter from '@/components/art/art-footer.vue'
import StoryFooter from '@/components/navigation/story-footer.vue'
import ThemeFooter from '@/components/navigation/theme-footer.vue'
import { useDisplayStore } from '@/stores/displayStore'

type FooterName = 'fx' | 'kind' | 'art' | 'story' | 'theme'

const displayStore = useDisplayStore()

const footerOptions: FooterName[] = ['fx', 'kind', 'art', 'story', 'theme']

const footerComponentMap: Record<FooterName, Component> = {
  fx: ButterflyFooter,
  kind: BotFooter,
  art: ArtFooter,
  story: StoryFooter,
  theme: ThemeFooter,
}

function isFooterName(value: unknown): value is FooterName {
  return (
    typeof value === 'string' && footerOptions.includes(value as FooterName)
  )
}

function normalizeFooterName(value: unknown): FooterName {
  return isFooterName(value) ? value : 'kind'
}

const activeFooter = computed<FooterName>(() => {
  return normalizeFooterName(displayStore.footerComponent)
})

const activeIndex = computed<number>(() => {
  const index = footerOptions.indexOf(activeFooter.value)
  return index >= 0 ? index : 0
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

function setFooterComponent(name: FooterName): void {
  displayStore.setFooterComponent(name)
}

function getWrappedFooter(step: -1 | 1): FooterName {
  const currentIndex = footerOptions.indexOf(activeFooter.value)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const nextIndex =
    (safeIndex + step + footerOptions.length) % footerOptions.length

  return footerOptions[nextIndex] ?? 'kind'
}

function showPrevious(): void {
  setFooterComponent(getWrappedFooter(-1))
}

function showNext(): void {
  setFooterComponent(getWrappedFooter(1))
}
</script>
