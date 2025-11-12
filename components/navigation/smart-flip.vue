<!-- /components/navigation/smart-flip.vue -->
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
          class="q4-stage rounded-3xl border-2 border-black shadow-xl bg-base-100/95"
        >
          <div class="q4-scene" :class="{ 'pe-none': isFlipping }">
            <div class="absolute inset-0" v-if="!isFlipping">
              <component :is="currCompKey" />
            </div>

            <div v-if="isFlipping" class="absolute inset-0">
              <div class="absolute inset-0">
                <component :is="currCompKey" />
              </div>

              <div class="quad next-tr" v-if="revealTR">
                <component :is="nextCompKey" />
              </div>
              <div
                class="quad flap-tr"
                :class="{ active: flippingTR }"
                :style="durStyle"
              >
                <component :is="currCompKey" />
              </div>

              <div class="quad next-tl" v-if="revealTL">
                <component :is="nextCompKey" />
              </div>
              <div
                class="quad flap-tl"
                :class="{ active: flippingTL }"
                :style="durStyle"
              >
                <component :is="currCompKey" />
              </div>

              <div class="quad next-br" v-if="revealBR">
                <component :is="nextCompKey" />
              </div>
              <div
                class="quad flap-br"
                :class="{ active: flippingBR }"
                :style="durStyle"
              >
                <component :is="currCompKey" />
              </div>

              <div class="quad next-bl" v-if="revealBL">
                <component :is="nextCompKey" />
              </div>
              <div
                class="quad flap-bl"
                :class="{ active: flippingBL }"
                :style="durStyle"
              >
                <component :is="currCompKey" />
              </div>

              <div class="absolute inset-0" v-if="cleanupReady">
                <component :is="nextCompKey" />
              </div>
            </div>

            <div v-if="!isFlipping" class="sr-only" aria-live="polite">
              {{ ariaLabel }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/navigation/smart-flip.vue
import { ref, computed, watch, h, type Component } from 'vue'
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

const isFlipping = ref(false)
const flippingTR = ref(false)
const flippingTL = ref(false)
const flippingBR = ref(false)
const flippingBL = ref(false)
const revealTR = ref(false)
const revealTL = ref(false)
const revealBR = ref(false)
const revealBL = ref(false)
const cleanupReady = ref(false)

const DURATION = 350
const GAP = 60

const currCompKey = computed<Component>(() => panelMap[current.value])
const nextCompKey = computed<Component>(() => panelMap[next.value])

const ariaLabel = computed(() => `Showing ${current.value} for ${title.value}`)

function setSmart(nextState: SmartState) {
  if (nextState === targetSmartState.value) return
  displayStore.setSmartState(nextState)
}

watch(
  targetSmartState,
  async (newState) => {
    if (!newState) return
    if (isFlipping.value) return
    if (newState === current.value) return
    next.value = newState
    await runSequence()
  },
  { immediate: true },
)

function wait(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms))
}

async function runSequence() {
  isFlipping.value = true
  cleanupReady.value = false
  revealTR.value = false
  revealTL.value = false
  revealBR.value = false
  revealBL.value = false
  flippingTR.value = false
  flippingTL.value = false
  flippingBR.value = false
  flippingBL.value = false

  revealTR.value = true
  flippingTR.value = true
  await wait(DURATION)
  flippingTR.value = false

  await wait(GAP)

  revealTL.value = true
  flippingTL.value = true
  await wait(DURATION)
  flippingTL.value = false

  await wait(GAP)

  revealBR.value = true
  flippingBR.value = true
  await wait(DURATION)
  flippingBR.value = false

  await wait(GAP)

  revealBL.value = true
  flippingBL.value = true
  await wait(DURATION)
  flippingBL.value = false

  cleanupReady.value = true
  await wait(16)
  current.value = next.value
  isFlipping.value = false
  cleanupReady.value = false
  revealTR.value = false
  revealTL.value = false
  revealBR.value = false
  revealBL.value = false
}

const durStyle = computed(() => ({
  transitionDuration: `${DURATION}ms`,
}))
</script>

<style scoped>
.q4-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 1.5rem;
}

.q4-scene {
  position: absolute;
  inset: 0;
}

.pe-none {
  pointer-events: none;
}

.quad {
  position: absolute;
  inset: 0;
}

.quad > * {
  position: absolute;
  inset: 0;
}

.next-tr {
  clip-path: inset(0 0 50% 50%);
  z-index: 2;
}

.flap-tr {
  clip-path: inset(0 0 50% 50%);
  transform-origin: center bottom;
  transform: rotateX(0deg);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform var(--dur, 350ms) cubic-bezier(0.2, 0.7, 0.3, 1);
  z-index: 3;
}

.flap-tr.active {
  transform: rotateX(-180deg);
}

.next-tl {
  clip-path: inset(0 50% 50% 0);
  z-index: 2;
}

.flap-tl {
  clip-path: inset(0 50% 50% 0);
  transform-origin: center bottom;
  transform: rotateX(0deg);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform var(--dur, 350ms) cubic-bezier(0.2, 0.7, 0.3, 1);
  z-index: 3;
}

.flap-tl.active {
  transform: rotateX(-180deg);
}

.next-br {
  clip-path: inset(50% 0 0 50%);
  z-index: 2;
}

.flap-br {
  clip-path: inset(50% 0 0 50%);
  transform-origin: center top;
  transform: rotateX(0deg);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform var(--dur, 350ms) cubic-bezier(0.2, 0.7, 0.3, 1);
  z-index: 3;
}

.flap-br.active {
  transform: rotateX(180deg);
}

.next-bl {
  clip-path: inset(50% 50% 0 0);
  z-index: 2;
}

.flap-bl {
  clip-path: inset(50% 50% 0 0);
  transform-origin: center top;
  transform: rotateX(0deg);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform var(--dur, 350ms) cubic-bezier(0.2, 0.7, 0.3, 1);
  z-index: 3;
}

.flap-bl.active {
  transform: rotateX(180deg);
}
</style>
