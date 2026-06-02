<!-- /layouts/workspace.vue -->
<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3"
      :class="gridClass"
    >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-x-6 opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="-translate-x-6 opacity-0"
      >
        <aside
          v-if="leftSidebarOpen"
          class="hidden min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 lg:flex lg:flex-col"
        >
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <splash-tutorial />
          </div>
        </aside>
      </Transition>

      <main
        class="relative min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="flex h-full min-h-0 flex-col overflow-hidden">
          <header
            class="shrink-0 border-b border-base-300 bg-base-100/95 px-3 py-3 backdrop-blur sm:px-4"
          >
            <div class="flex min-w-0 flex-col gap-1">
              <div class="flex min-w-0 items-center gap-2">
                <Icon
                  name="kind-icon:blueprint"
                  class="h-5 w-5 shrink-0 text-primary"
                />
                <h1 class="truncate text-xl font-black text-base-content">
                  {{ dashboardTitle }}
                </h1>
              </div>

              <p
                v-if="dashboardSummary"
                class="line-clamp-2 text-sm text-base-content/70"
              >
                {{ dashboardSummary }}
              </p>
            </div>
          </header>

          <section class="min-h-0 flex-1 overflow-hidden bg-base-200/40">
            <div
              class="h-full min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4"
            >
              <slot />
            </div>
          </section>

          <section
            v-if="hasBuilderCards"
            class="shrink-0 overflow-hidden border-t border-base-300 bg-base-100/95 p-2 shadow-[0_-0.75rem_1.5rem_rgba(0,0,0,0.06)] backdrop-blur"
          >
            <div class="h-28 min-h-28 sm:h-[22dvh] sm:max-h-52">
              <builder-hand :cards="builderCards" />
            </div>
          </section>
        </div>
      </main>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-x-6 opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-6 opacity-0"
      >
        <aside
          v-if="rightSidebarOpen"
          class="hidden min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:flex xl:flex-col"
        >
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <screen-fx />
          </div>
        </aside>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/workspace.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'
import { getModelCards } from '@/stores/helpers/modelCards'

const displayStore = useDisplayStore()
const navStore = useNavStore()

const dashboardShell = computed(() => navStore.dashboardShell)

const dashboardTitle = computed(() => {
  return dashboardShell.value.title || 'Dashboard'
})

const dashboardSummary = computed(() => {
  return dashboardShell.value.summary || ''
})

const builderCards = computed(() => {
  return getModelCards(dashboardShell.value.cards)
})

const hasBuilderCards = computed(() => {
  return builderCards.value.length > 0
})

const leftSidebarOpen = computed(() => {
  return displayStore.sidebarLeftState !== 'hidden'
})

const rightSidebarOpen = computed(() => {
  return displayStore.sidebarRightState !== 'hidden'
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
