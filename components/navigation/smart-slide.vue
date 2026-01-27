<!-- /components/navigation/smart-slide.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flex flex-col w-full h-full">
      <div class="px-2 md:px-3 lg:px-4 pt-2">
        <div
          class="w-full rounded-2xl border border-base-300 bg-base-200/90 px-2.5 md:px-3.5 py-1.5 md:py-2 flex flex-col gap-1.5 md:gap-2"
        >
          <div class="flex items-center justify-between gap-2 min-w-0">
            <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                v-for="state in states"
                :key="state.id"
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                :class="{
                  'border-base-300 bg-base-200/70':
                    targetSmartState === state.id,
                }"
                @click="setSmart(state.id)"
              >
                <Icon :name="state.icon" class="w-3 h-3 md:w-4 md:h-4" />
                <span class="hidden sm:inline">{{ state.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="!bigMode" class="w-full overflow-x-auto">
            <smart-icons />
          </div>
        </div>
      </div>

      <div
        class="relative flex-1 min-h-0 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4"
      >
        <div
          class="stage rounded-3xl border-2 border-black shadow-xl bg-base-100/95"
        >
          <div class="scene" :class="{ 'pe-none': isTransitioning }">
            <div class="absolute inset-0 z-10">
              <component :is="currCompKey" />
            </div>

            <div v-if="isTransitioning" class="absolute inset-0 z-20 overlay">
              <div class="absolute inset-0 overlay-inner" :style="durStyle">
                <component :is="nextCompKey" />
              </div>
            </div>

            <div class="sr-only" aria-live="polite">
              {{ ariaLabel }}
            </div>
          </div>
        </div>

        <div
          class="absolute left-4 top-4 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
        >
          {{ isTransitioning ? 'Switching…' : 'Ready' }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/navigation/smart-slide.vue
import { ref, computed, watch, type Component } from 'vue'
import { Icon } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import type { SmartState } from '@/stores/helpers/displayHelper'
import SmartFront from '@/components/navigation/smart-front.vue'
import SmartBack from '@/components/navigation/smart-back.vue'
import SmartDash from '@/components/navigation/smart-dash.vue'
import SmartIcons from '@/components/navigation/smart-icons.vue'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const bigMode = computed(() => displayStore.bigMode)
const targetSmartState = computed<SmartState>(() => displayStore.SmartState)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const states: { id: SmartState; label: string; icon: string }[] = [
  { id: 'front', label: 'Map', icon: 'kind-icon:map' },
  { id: 'dash', label: 'Dash', icon: 'kind-icon:dashboard' },
  { id: 'back', label: 'Ami', icon: 'kind-icon:butterfly' },
]

const SmartFlippingShim: Component = {
  name: 'SmartFlippingShim',
  setup: () => () => null,
}

type SmartKey = SmartState | 'flipping'

const panelMap: Record<SmartKey, Component> = {
  front: SmartFront,
  dash: SmartDash,
  back: SmartBack,
  flipping: SmartFlippingShim,
}

const current = ref<SmartState>(targetSmartState.value || 'front')
const next = ref<SmartState>(targetSmartState.value || 'front')

const isTransitioning = ref(false)

const DURATION = 260

const currCompKey = computed<Component>(() => panelMap[current.value])
const nextCompKey = computed<Component>(() => panelMap[next.value])

const ariaLabel = computed(() => `Showing ${current.value} for ${title.value}`)

function setSmart(nextState: SmartState) {
  if (nextState === targetSmartState.value) return
  displayStore.setSmartState(nextState)
}

function wait(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms))
}

watch(
  targetSmartState,
  async (newState) => {
    if (!newState) return
    if (isTransitioning.value) return
    if (newState === current.value) return
    next.value = newState
    await runTransition()
  },
  { immediate: true },
)

async function runTransition() {
  isTransitioning.value = true
  await wait(DURATION)
  current.value = next.value
  isTransitioning.value = false
}

const durStyle = computed(() => ({
  '--dur': `${DURATION}ms`,
}))
</script>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 1.5rem;
}

.scene {
  position: absolute;
  inset: 0;
}

.pe-none {
  pointer-events: none;
}

.overlay {
  overflow: hidden;
}

.overlay-inner {
  width: 100%;
  height: 100%;
  animation: smart-slide-in var(--dur, 260ms) cubic-bezier(0.2, 0.8, 0.2, 1)
    forwards;
  filter: blur(6px);
  opacity: 0;
  transform: translateX(6%) scale(1.01);
  clip-path: polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%);
}

@keyframes smart-slide-in {
  0% {
    opacity: 0;
    transform: translateX(6%) scale(1.01);
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0%) scale(1);
    filter: blur(0px);
  }
}
</style>
