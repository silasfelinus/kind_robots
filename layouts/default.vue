<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3"
      :class="gridClass"
    >
      <aside
        v-if="leftSidebarOpen"
        class="hidden min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 lg:flex lg:flex-col"
      >
        <div
          class="flex shrink-0 items-center gap-2 border-b border-base-300 px-3 py-2"
        >
          <Icon name="kind-icon:sidebar-left" class="h-4 w-4 text-primary" />
          <span class="truncate text-sm font-bold">Left Panel</span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <slot name="left">
            <component :is="leftSidebarComponent" />
          </slot>
        </div>
      </aside>

      <main
        class="relative min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="h-full min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
          <slot />
        </div>
      </main>

      <aside
        v-if="rightSidebarOpen"
        class="hidden min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:flex xl:flex-col"
      >
        <div
          class="flex shrink-0 items-center gap-2 border-b border-base-300 px-3 py-2"
        >
          <Icon
            name="kind-icon:sidebar-right"
            class="h-4 w-4 text-secondary"
          />
          <span class="truncate text-sm font-bold">Right Panel</span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <slot name="right">
            <component :is="rightSidebarComponent" />
          </slot>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed, resolveComponent, type Component } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

type SidebarComponentKey = 'splash-tutorial' | 'user-panel'
type SidebarKey = SidebarComponentKey | 'none'

type SidebarPage = {
  leftSidebar?: SidebarKey | string | null
  rightSidebar?: SidebarKey | string | null
}

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const typedPage = computed<SidebarPage | null>(() => {
  return pageStore.page ? (pageStore.page as SidebarPage) : null
})

const sidebarComponentMap: Record<SidebarComponentKey, Component | string> = {
  'splash-tutorial': resolveComponent('SplashTutorial'),
  'user-panel': resolveComponent('UserPanel'),
}

function normalizeSidebarKey(
  value: SidebarPage['leftSidebar'],
  fallback: SidebarComponentKey,
): SidebarKey {
  if (value === 'none') return 'none'
  if (value === 'splash-tutorial') return 'splash-tutorial'
  if (value === 'user-panel') return 'user-panel'
  return fallback
}

const leftSidebarKey = computed<SidebarKey>(() => {
  return normalizeSidebarKey(typedPage.value?.leftSidebar, 'splash-tutorial')
})

const rightSidebarKey = computed<SidebarKey>(() => {
  return normalizeSidebarKey(typedPage.value?.rightSidebar, 'user-panel')
})

const leftSidebarOpen = computed(() => {
  return (
    leftSidebarKey.value !== 'none' &&
    displayStore.sidebarLeftState !== 'hidden'
  )
})

const rightSidebarOpen = computed(() => {
  return (
    rightSidebarKey.value !== 'none' &&
    displayStore.sidebarRightState !== 'hidden'
  )
})

const leftSidebarComponent = computed<Component | string>(() => {
  if (leftSidebarKey.value === 'none') {
    return sidebarComponentMap['splash-tutorial']
  }

  return sidebarComponentMap[leftSidebarKey.value]
})

const rightSidebarComponent = computed<Component | string>(() => {
  if (rightSidebarKey.value === 'none') {
    return sidebarComponentMap['user-panel']
  }

  return sidebarComponentMap[rightSidebarKey.value]
})

const gridClass = computed(() => {
  if (leftSidebarOpen.value && rightSidebarOpen.value) {
    return 'lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_20rem]'
  }

  if (leftSidebarOpen.value) {
    return 'lg:grid-cols-[18rem_minmax(0,1fr)]'
  }

  if (rightSidebarOpen.value) {
    return 'xl:grid-cols-[minmax(0,1fr)_20rem]'
  }

  return 'grid-cols-1'
})
</script>