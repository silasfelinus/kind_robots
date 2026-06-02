<!-- /layouts/builder.vue -->
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
            <slot name="left">
              <splash-tutorial />
            </slot>
          </div>
        </aside>
      </Transition>

      <main class="relative min-h-0 overflow-hidden">
        <div class="flex h-full min-h-0 flex-col overflow-hidden">
          <section class="min-h-0 flex-1 overflow-hidden">
            <dashboard-shell
              class="h-full min-h-0"
              :title="dashboardShell.title"
              :summary="dashboardShell.summary"
              :dashboard-key="dashboardShell.dashboardKey"
              :loading="navStore.loading"
              :loading-message="dashboardShell.loadingMessage"
              :error="navStore.lastError"
              :refresh-label="dashboardShell.refreshLabel"
              @refresh="navStore.refreshDashboardShell"
            >
              <slot />
            </dashboard-shell>
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
            <slot name="right">
              <screen-fx />
            </slot>
          </div>
        </aside>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'
import { getModelCards } from '@/stores/helpers/modelCards'

const displayStore = useDisplayStore()
const navStore = useNavStore()

const dashboardShell = computed(() => navStore.dashboardShell)

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
