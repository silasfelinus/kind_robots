<!-- /components/content/icons/splash-nav.vue -->
<template>
  <div class="flex flex-col gap-4 w-full pointer-events-auto">
    <div class="text-center">
      <button
        class="btn btn-xs md:btn-sm btn-outline border-base-content/40 bg-primary rounded-2xl"
        @click="cycleNavSource"
      >
        🔄 Toggle View:
        <span class="ml-1 font-mono">{{ currentLabel }}</span>
      </button>
    </div>

    <!-- Navigation Select -->
    <Transition name="fade-expand">
      <div
        v-if="currentNav === 'nav-select'"
        class="space-y-2 min-h-[300px] bg-base-200 border border-dashed border-primary rounded-2xl p-4"
      >
        <label
          class="text-sm font-semibold text-base-content/70 text-center block mb-2"
        >
          Navigation Menu
        </label>
        <nav-nav
          class="w-full max-w-3xl mx-auto"
          @nav-selected="currentNav = 'custom'"
        />
      </div>
    </Transition>

    <!-- Active Custom Nav -->
    <Transition name="fade-expand">
      <div
        v-if="currentNav === 'custom' && resolvedNavComponent"
        class="space-y-2 min-h-[300px] bg-base-200 border border-dashed border-accent rounded-2xl p-4"
      >
        <label
          class="text-sm font-semibold text-base-content/70 text-center block mb-2"
        >
          {{ formatLabel(resolvedNavComponent) }}
        </label>
        <component
          :is="resolvedNavComponent"
          class="w-full max-w-3xl mx-auto"
        />
      </div>
    </Transition>

    <!-- Mode Row -->
    <Transition name="fade-expand">
      <div
        v-if="currentNav === 'mode-row'"
        class="space-y-2 border border-base-300 bg-base-100 rounded-2xl"
      >
        <label
          class="text-sm font-semibold text-base-content/70 text-center block"
        >
          🎮 Mode Row
        </label>
        <div class="flex justify-center">
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useLinkStore } from '@/stores/linkStore'

const pageStore = usePageStore()
const linkStore = useLinkStore()

const navStates = ['custom', 'nav-select', 'mode-row'] as const
const currentNav = ref<(typeof navStates)[number]>('custom')

const resolvedNavComponent = computed(() => {
  return (
    linkStore.navComponent?.trim() ||
    pageStore.page?.navComponent?.trim() ||
    null
  )
})

const currentLabel = computed(() => {
  if (currentNav.value === 'custom' && resolvedNavComponent.value) {
    return formatLabel(resolvedNavComponent.value)
  } else if (currentNav.value === 'nav-select') {
    return 'Navigation'
  } else {
    return 'Mode Row'
  }
})

function cycleNavSource() {
  const currentIndex = navStates.indexOf(currentNav.value)
  const nextIndex = (currentIndex + 1) % navStates.length
  const next = navStates[nextIndex]
  currentNav.value = next

  if (next === 'nav-select') {
    linkStore.navComponent = ''
  }
}

function formatLabel(raw: string): string {
  return (
    raw
      .replace(/-nav$/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase()) + ' Navigation'
  )
}
</script>
