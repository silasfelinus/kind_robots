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
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 flex-col gap-1">
                <div class="flex min-w-0 items-center gap-2">
                  <Icon
                    name="kind-icon:blueprint"
                    class="h-5 w-5 shrink-0 text-primary"
                  />

                  <h1 class="truncate text-xl font-black text-base-content">
                    {{ navStore.dashboardTitle }}
                  </h1>
                </div>

                <p
                  v-if="navStore.dashboardSummary"
                  class="line-clamp-2 text-sm text-base-content/70"
                >
                  {{ navStore.dashboardSummary }}
                </p>
              </div>

              <div
                v-if="showBuilderFrame"
                class="flex shrink-0 items-center gap-2"
              >
                <button
                  type="button"
                  class="btn btn-sm btn-ghost rounded-xl lg:hidden"
                  :class="showSheet ? 'btn-active' : ''"
                  :aria-label="
                    showSheet ? 'Hide builder sheet' : 'Show builder sheet'
                  "
                  @click="showSheet = !showSheet"
                >
                  <Icon name="kind-icon:blueprint" class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  class="btn btn-sm btn-ghost rounded-xl text-base-content/50 hover:text-primary"
                  @click="builderStore.randomCard()"
                >
                  <Icon name="kind-icon:dice" class="h-4 w-4" />
                  <span class="hidden sm:inline">Random</span>
                </button>

                <button
                  type="button"
                  class="btn btn-sm btn-ghost rounded-xl text-base-content/50 hover:text-error"
                  @click="showResetConfirm = true"
                >
                  <Icon name="kind-icon:trash" class="h-4 w-4" />
                  <span class="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </header>

          <Transition name="builder-feedback">
            <div
              v-if="
                showBuilderFrame &&
                (builderStore.lastError || builderStore.statusMessage)
              "
              class="shrink-0 border-b px-4 py-2 text-sm font-semibold"
              :class="
                builderStore.lastError
                  ? 'border-error/30 bg-error/10 text-error'
                  : 'border-success/30 bg-success/10 text-success'
              "
            >
              {{ builderStore.lastError || builderStore.statusMessage }}
            </div>
          </Transition>

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

              <main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <section
                  class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
                >
                  <builder-stage />
                </section>
              </main>

              <div class="hidden">
                <slot />
              </div>
            </div>

            <div v-else class="h-full min-h-0 overflow-hidden p-3 sm:p-4">
              <slot />
            </div>
          </section>

          <section
            v-if="navStore.hasDashboardCards"
            class="shrink-0 overflow-hidden border-t border-base-300 bg-base-100/95 p-2 shadow-[0_-0.75rem_1.5rem_rgba(0,0,0,0.06)] backdrop-blur"
          >
            <div class="h-28 min-h-28 sm:h-[22dvh] sm:max-h-52">
              <builder-hand :cards="navStore.dashboardCards" />
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

    <Teleport to="body">
      <Transition name="builder-modal-fade">
        <div
          v-if="showResetConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showResetConfirm = false"
        >
          <div class="absolute inset-0 bg-base-300/60 backdrop-blur-sm" />

          <div
            class="relative w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl"
          >
            <h3 class="text-lg font-black text-base-content">
              Clear this builder?
            </h3>

            <p class="mt-2 text-sm leading-relaxed text-base-content/60">
              This clears staged answers, completed cards, rewards, stats, and
              local saved state for this builder. Pure potential. Slightly
              haunted.
            </p>

            <div class="mt-5 flex justify-end gap-2">
              <button
                type="button"
                class="btn btn-sm btn-ghost rounded-xl"
                @click="showResetConfirm = false"
              >
                Keep it
              </button>

              <button
                type="button"
                class="btn btn-sm btn-error rounded-xl"
                @click="resetBuilder"
              >
                Clear everything
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const displayStore = useDisplayStore()
const navStore = useNavStore()
const builderStore = useBuilderStore()

const showSheet = ref(false)
const showResetConfirm = ref(false)
const isDesktop = ref(false)

const leftSidebarOpen = computed(() => {
  return displayStore.sidebarLeftState !== 'hidden'
})

const rightSidebarOpen = computed(() => {
  return displayStore.sidebarRightState !== 'hidden'
})

const showBuilderFrame = computed(() => {
  return navStore.hasDashboardCards
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

function updateDesktop(): void {
  if (typeof window === 'undefined') return

  isDesktop.value = window.matchMedia('(min-width: 1024px)').matches
}

function handleResize(): void {
  updateDesktop()
}

function resetBuilder(): void {
  builderStore.resetBuilder(true)
  showResetConfirm.value = false
}

onMounted(() => {
  builderStore.hydrate()
  updateDesktop()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.builder-feedback-enter-active,
.builder-feedback-leave-active,
.builder-sheet-slide-enter-active,
.builder-sheet-slide-leave-active,
.builder-modal-fade-enter-active,
.builder-modal-fade-leave-active {
  transition: all 180ms ease;
}

.builder-feedback-enter-from,
.builder-feedback-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.builder-sheet-slide-enter-from,
.builder-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

.builder-modal-fade-enter-from,
.builder-modal-fade-leave-to {
  opacity: 0;
}
</style>