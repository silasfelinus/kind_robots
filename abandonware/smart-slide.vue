<!-- /components/navigation/smart-slide.vue -->
<template>
  <section class="relative mx-auto h-[90%] w-full max-w-4xl overflow-visible">
    <div class="flex h-full w-full flex-col">
      <div class="px-2 pt-2 md:px-3 lg:px-4">
        <div
          class="flex w-full flex-col gap-1.5 rounded-2xl border border-base-300 bg-base-200/90 px-2.5 py-1.5 md:gap-2 md:px-3.5 md:py-2"
        >
          <div class="flex min-w-0 items-center justify-between gap-2">
            <div class="flex shrink-0 items-center gap-1 md:gap-2">
              <button
                v-for="state in states"
                :key="state.id"
                type="button"
                class="btn btn-ghost btn-xs flex items-center gap-1 rounded-full px-2 text-[10px] md:px-3 md:text-xs"
                :class="{
                  'border-base-300 bg-base-200/70': smartState === state.id,
                }"
                @click="setSmart(state.id)"
              >
                <Icon :name="state.icon" class="h-3 w-3 md:h-4 md:w-4" />
                <span class="hidden sm:inline">{{ state.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="!isCompactHeader" class="w-full overflow-x-auto">
            <smart-icons />
          </div>
        </div>
      </div>

      <div
        class="relative min-h-0 flex-1 px-2 pb-2 md:px-3 md:pb-3 lg:px-4 lg:pb-4"
      >
        <div
          class="stage rounded-3xl border-2 border-black bg-base-100/95 shadow-xl"
        >
          <div class="scene">
            <div class="absolute inset-0">
              <component :is="currCompKey" />
            </div>

            <div class="sr-only" aria-live="polite">
              {{ ariaLabel }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/navigation/smart-slide.vue
import { computed, type Component } from 'vue'
import { Icon } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import type { SmartState } from '@/stores/helpers/displayHelper'
import SmartFront from '@/components/navigation/smart-front.vue'
import SmartBack from '@/components/navigation/smart-back.vue'
import SmartDash from './smart-dash.vue'
import SmartIcons from '@/components/icons/smart-icons.vue'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const isCompactHeader = computed(() => displayStore.headerState === 'compact')
const smartState = computed<SmartState>(() => displayStore.SmartState)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const states: { id: SmartState; label: string; icon: string }[] = [
  { id: 'front', label: 'Map', icon: 'kind-icon:map' },
  { id: 'dash', label: 'Dash', icon: 'kind-icon:dashboard' },
  { id: 'back', label: 'Ami', icon: 'kind-icon:butterfly' },
]

const panelMap: Record<SmartState, Component> = {
  front: SmartFront,
  dash: SmartDash,
  back: SmartBack,
}

const currCompKey = computed<Component>(() => panelMap[smartState.value])

const ariaLabel = computed(
  () => `Showing ${smartState.value} for ${title.value}`,
)

function setSmart(nextState: SmartState) {
  if (smartState.value === nextState) return
  displayStore.setSmartState(nextState)
}
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
</style>
