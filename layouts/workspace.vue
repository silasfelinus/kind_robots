<!-- /layouts/workspace.vue -->
<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <div class="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
      <main
        class="relative flex h-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <dashboard-shell>
          <div class="flex h-full min-h-0 flex-col overflow-hidden">
            <section
              class="relative flex min-h-0 flex-1 overflow-hidden bg-base-200/40"
            >
              <Transition name="workspace-sheet-slide">
                <aside
                  v-show="sheetVisible"
                  class="hidden min-h-0 w-80 shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 lg:flex"
                >
                  <div
                    class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
                  >
                    <workspace-sheet />
                  </div>
                </aside>
              </Transition>

              <main
                class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              >
                <section
                  class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
                >
                  <slot />
                </section>
              </main>
            </section>

            <section
              class="shrink-0 overflow-hidden border-t border-base-300 bg-base-100/95 p-2 shadow-[0_-0.75rem_1.5rem_rgba(0,0,0,0.06)] backdrop-blur"
            >
              <div class="h-28 min-h-28 sm:h-[22dvh] sm:max-h-52">
                <workspace-hand />
              </div>
            </section>
          </div>
        </dashboard-shell>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sheetVisible = computed(() => {
  return !['hidden', 'disabled'].includes(displayStore.sidebarLeftState)
})
</script>

<style scoped>
.workspace-sheet-slide-enter-active,
.workspace-sheet-slide-leave-active {
  transition: all 180ms ease;
}

.workspace-sheet-slide-enter-from,
.workspace-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}
</style>
