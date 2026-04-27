<!-- /components/navigation/footer-selector.vue -->
<template>
  <div v-if="footerIsHidden">
    <button
      type="button"
      class="fixed bottom-4 left-4 z-[75] flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300 bg-base-100/90 text-base-content shadow-xl backdrop-blur transition hover:bg-base-200"
      aria-label="Previous footer component"
      @click="showPrevious"
    >
      <icon name="kind-icon:chevron-left" class="h-6 w-6" />
    </button>

    <button
      type="button"
      class="fixed bottom-4 right-4 z-[75] flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300 bg-base-100/90 text-base-content shadow-xl backdrop-blur transition hover:bg-base-200"
      aria-label="Next footer component"
      @click="showNext"
    >
      <icon name="kind-icon:chevron-right" class="h-6 w-6" />
    </button>
  </div>

  <div
    v-else
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

    <div class="min-w-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-200/60">
      <component :is="activeComponent" class="h-full w-full" />
    </div>

    <div class="flex w-12 shrink-0 flex-col items-center justify-center gap-1">
      <button
        type="button"
        class="flex h-8 w-full items-center justify-center rounded-xl border border-base-300 bg-base-200 text-base-content transition hover:bg-base-300"
        :title="isLocked ? 'Locked to page' : 'Navigate on change'"
        @click="toggleLock"
      >
        <icon
          :name="isLocked ? 'kind-icon:lock' : 'kind-icon:house'"
          class="h-4 w-4"
        />
      </button>

      <button
        type="button"
        class="flex flex-1 w-full items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-base-content transition hover:bg-base-300"
        aria-label="Next footer component"
        @click="showNext"
      >
        <icon name="kind-icon:chevron-right" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer-selector.vue
import { computed, ref, watchEffect, type Component, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import ButterflyFooter from '@/components/butterfly/butterfly-footer.vue'
import BotFooter from '@/components/bots/bot-footer.vue'
import ArtFooter from '@/components/art/art-footer.vue'
import StoryFooter from '@/components/navigation/story-footer.vue'
import ThemeFooter from '~/components/wonderlab/theme-footer.vue'
import UserFooter from '@/components/user/user-footer.vue'
import LabFooter from '@/components/wonderlab/lab-footer.vue'
import BrainstormFooter from '@/components/prompts/brainstorm-footer.vue'
import GiftshopFooter from '@/components/giftshop/giftshop-footer.vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const router = useRouter()

const isLocked = ref(false)

const footerIsHidden = computed(() => displayStore.footerState === 'hidden')

type FooterName = (typeof displayStore.footerComponentNames)[number]

const footerOptions = [...displayStore.footerComponentNames] as FooterName[]

const footerComponentMap: Record<FooterName, Component> = {
  fx: ButterflyFooter,
  kind: BotFooter,
  art: ArtFooter,
  story: StoryFooter,
  theme: ThemeFooter,
  user: UserFooter,
  lab: LabFooter,
  brainstorm: BrainstormFooter,
  giftshop: GiftshopFooter,
}

const footerRouteMap: Record<FooterName, string> = {
  fx: '/butterflies',
  kind: '/bots',
  art: '/addart',
  story: '/stories',
  theme: '/themes',
  user: '/dashboard',
  lab: '/wonderlab',
  brainstorm: '/brainstorm',
  giftshop: '/giftshop',
}



const selectorShellClass = computed(() => [
  'flex items-stretch gap-2 rounded-2xl border border-base-300 bg-base-100/80 p-2 shadow-xl backdrop-blur transition-all',
  footerIsHidden.value
    ? 'h-16 w-[min(92vw,28rem)]'
    : 'h-full w-full',
])

const selectorShellStyle = computed<CSSProperties>(() => {
  if (!footerIsHidden.value) return {}

  return {
    position: 'fixed',
    left: '50%',
    bottom: `calc(var(--vh) * ${displayStore.sectionPaddingSize})`,
    transform: 'translateX(-50%)',
    zIndex: '75',
  }
})

const selectorButtonClass = computed(() => [
  'flex shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-base-content transition hover:bg-base-300',
  footerIsHidden.value ? 'h-full w-12' : 'h-full w-12',
])

const rightControlsClass = computed(() => [
  'flex w-12 shrink-0 flex-col items-center justify-center gap-1',
  footerIsHidden.value ? 'h-full' : '',
])

const nextButtonClass = computed(() => [
  'flex w-full items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-base-content transition hover:bg-base-300',
  footerIsHidden.value ? 'h-8' : 'h-full flex-1',
])

function isFooterName(value: unknown): value is FooterName {
  return typeof value === 'string' && footerOptions.includes(value as FooterName)
}

function normalizeFooterName(value: unknown): FooterName {
  return isFooterName(value) ? value : 'kind'
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

function toggleLock(): void {
  isLocked.value = !isLocked.value
}

function setFooterComponent(name: FooterName): void {
  displayStore.setFooterComponent(name)

  if (!isLocked.value) {
    router.push(footerRouteMap[name])
  }
}

function getWrappedFooter(step: -1 | 1): FooterName {
  const currentIndex = footerOptions.indexOf(activeFooter.value)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const nextIndex = (safeIndex + step + footerOptions.length) % footerOptions.length

  return footerOptions[nextIndex] ?? 'kind'
}

function showPrevious(): void {
  setFooterComponent(getWrappedFooter(-1))
}

function showNext(): void {
  setFooterComponent(getWrappedFooter(1))
}
</script>