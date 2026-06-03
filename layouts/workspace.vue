<!-- /layouts/workspace.vue -->
<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3"
      :class="gridClass"
    >
      <main
        class="relative min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <dashboard-shell>
          <div class="flex h-full min-h-0 flex-col overflow-hidden">
            <section class="min-h-0 flex-1 overflow-hidden bg-base-200/40">
              <div
                v-if="showBuilderFrame"
                class="relative flex h-full min-h-0 overflow-hidden"
              >
                <Transition name="builder-sheet-slide">
                  <aside
                    v-show="showSheet || isDesktop"
                    class="absolute inset-y-0 left-0 z-30 flex min-h-0 w-[min(20rem,calc(100vw-2rem))] shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 shadow-xl lg:static lg:z-auto lg:w-80 lg:shadow-none"
                  >
                    <div
                      class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
                    >
                      <builder-sheet />
                    </div>
                  </aside>
                </Transition>

                <button
                  v-if="showSheet && !isDesktop"
                  type="button"
                  class="absolute inset-0 z-20 bg-base-300/40 backdrop-blur-[1px] lg:hidden"
                  aria-label="Close builder sheet overlay"
                  @click="showSheet = false"
                />

                <main
                  class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                >
                  <section
                    class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
                  >
                    <builder-stage>
                      <slot />
                    </builder-stage>
                  </section>
                </main>
              </div>

              <div v-else class="h-full min-h-0 overflow-y-auto p-3 sm:p-4">
                <slot />
              </div>
            </section>

            <section
              v-if="navStore.hasDashboardCards"
              class="shrink-0 overflow-hidden border-t border-base-300 bg-base-100/95 p-2 shadow-[0_-0.75rem_1.5rem_rgba(0,0,0,0.06)] backdrop-blur"
            >
              <div class="h-28 min-h-28 sm:h-[22dvh] sm:max-h-52">
                <builder-hand />
              </div>
            </section>
          </div>
        </dashboard-shell>

        <button
          v-if="showBuilderFrame"
          type="button"
          class="absolute right-3 top-3 z-20 btn btn-sm btn-ghost rounded-xl lg:hidden"
          :class="showSheet ? 'btn-active' : ''"
          :aria-label="showSheet ? 'Hide builder sheet' : 'Show builder sheet'"
          @click="showSheet = !showSheet"
        >
          <Icon name="kind-icon:blueprint" class="h-4 w-4" />
        </button>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'
import { type DashboardKey } from '@/stores/helpers/dashboardHelper'

const displayStore = useDisplayStore()
const navStore = useNavStore()
const builderStore = useBuilderStore()

const showSheet = ref(false)
const isDesktop = ref(false)

const leftSidebarOpen = computed(() => {
  return displayStore.sidebarLeftState !== 'hidden'
})

const rightSidebarOpen = computed(() => {
  return displayStore.sidebarRightState !== 'hidden'
})

const showBuilderFrame = computed(() => {
  return navStore.hasDashboardCards || builderStore.cards.length > 0
})

const dashboardCards = computed(() => {
  return navStore.dashboardCards ?? []
})

const dashboardBuilderKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || 'builder'
})

const dashboardTitle = computed(() => {
  return navStore.dashboardTitle || 'Builder'
})

function syncWorkspaceBuilder(): void {
  if (!dashboardCards.value.length) return

  builderStore.registerWorkspaceBuilder({
    key: dashboardBuilderKey.value,
    label: dashboardTitle.value,
    title: dashboardTitle.value,
    modelType: dashboardBuilderKey.value,
    cards: dashboardCards.value,
    storageKey: `kindrobots.builder.${dashboardBuilderKey.value}.v1`,
  })

  builderStore.setBuilder(dashboardBuilderKey.value)
}
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

function updateDesktop(): void {
  if (typeof window === 'undefined') return

  isDesktop.value = window.matchMedia('(min-width: 1024px)').matches

  if (isDesktop.value) {
    showSheet.value = false
  }
}

function handleResize(): void {
  updateDesktop()
}

watch(
  () => [dashboardBuilderKey.value, dashboardCards.value.length],
  () => {
    syncWorkspaceBuilder()
  },
  { immediate: true },
)

onMounted(() => {
  syncWorkspaceBuilder()
  updateDesktop()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.builder-sheet-slide-enter-active,
.builder-sheet-slide-leave-active {
  transition: all 180ms ease;
}

.builder-sheet-slide-enter-from,
.builder-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}
</style>
