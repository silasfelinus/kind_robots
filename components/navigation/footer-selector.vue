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
import { computed, type Component } from 'vue'
import FooterFx from '@/components/butterfly/butterfly-footer.vue'
import KindFooter from '@/components/bots/bot-chat.vue'
import ArtFooter from '@/components/art/art-footer.vue'
import { useDisplayStore } from '@/stores/displayStore'

type FooterName = 'fx' | 'kind' | 'art'

const displayStore = useDisplayStore()

const footerOptions: FooterName[] = ['fx', 'kind', 'art']

const footerComponentMap: Record<FooterName, Component> = {
  fx: FooterFx,
  kind: KindFooter,
  art: ArtFooter,
}

const activeFooter = computed<FooterName>(() => {
  const current = displayStore.footerComponent as FooterName | undefined
  return current && footerOptions.includes(current) ? current : 'kind'
})

const activeIndex = computed(() => {
  const index = footerOptions.indexOf(activeFooter.value)
  return index >= 0 ? index : 0
})

const activeComponent = computed<Component>(() => {
  return footerComponentMap[activeFooter.value]
})

function setFooterComponent(name: FooterName): void {
  displayStore.setFooterComponent(name)
}

function showPrevious(): void {
  const nextIndex =
    (activeIndex.value - 1 + footerOptions.length) % footerOptions.length
  const nextFooter = footerOptions[nextIndex]

  if (!nextFooter) return

  setFooterComponent(nextFooter)
}

function showNext(): void {
  const nextIndex = (activeIndex.value + 1) % footerOptions.length
  const nextFooter = footerOptions[nextIndex]

  if (!nextFooter) return

  setFooterComponent(nextFooter)
}
</script>
