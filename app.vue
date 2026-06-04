<!-- /app.vue -->
<template>
  <div class="relative h-dvh min-h-dvh w-full overflow-hidden bg-base-100">
    <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-40">
      <kind-loader @pageReady="handlePageReady" />
    </div>

    <butterfly-layer />
    <animation-layer />
    <milestone-popup />

    <div
      v-if="isNavigating"
      class="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-base-100/70 backdrop-blur-sm"
    >
      <div
        class="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 text-center shadow-xl"
      >
        <Icon
          name="kind-icon:portal"
          class="h-10 w-10 animate-pulse text-primary"
        />

        <p class="text-sm font-black uppercase tracking-widest text-primary">
          Loading
        </p>

        <p class="text-sm leading-relaxed text-base-content/60">
          Reality is recompiling. Try not to make eye contact with the stack
          trace.
        </p>
      </div>
    </div>

    <dashboard-shell>
      <template #default="{ activeTab, activeTabConfig }">
        <section
          class="flex h-full min-h-0 w-full flex-col overflow-hidden"
          data-dashboard-page-slot
        >
          <workspace-sheet />
          <div
            v-if="showPageSlotDebug"
            class="mb-3 shrink-0 rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-xs font-bold text-info"
          >
            Page slot mounted · active tab: {{ activeTab || 'none' }} · title:
            {{ activeTabConfig?.title || activeTabConfig?.label || 'none' }}
          </div>

          <div class="min-h-0 flex-1 overflow-hidden">
            <NuxtPage />
          </div>
        </section>

        <worspace-hand />
      </template>
    </dashboard-shell>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/navStore'

const router = useRouter()
const navStore = useNavStore()

const showLoader = ref(true)
const isNavigating = ref(false)
const showPageSlotDebug = ref(true)

function handlePageReady(): void {
  showLoader.value = false
}

router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) {
    isNavigating.value = true
  }
})

router.afterEach((to) => {
  navStore.recordVisit(to.fullPath)
  isNavigating.value = false
})

router.onError(() => {
  isNavigating.value = false
})
</script>
