<!-- /app.vue -->
<template>
  <div
    class="relative h-dvh w-full overflow-hidden bg-base-200 text-base-content"
  >
    <div class="pointer-events-auto">
      <footer-toggle />
      <kind-loader />
      <milestone-popup />
    </div>

    <animation-loader class="fixed z-50 pointer-events-none" />

    <!-- Butterfly swarm overlay -->
    <div
      v-if="showSwarm"
      class="pointer-events-none fixed inset-0 z-9000 overflow-hidden"
      aria-hidden="true"
    >
      <butterfly-animation />
    </div>

    <!-- Navigation loading overlay -->
    <Transition
      enter-active-class="transition-opacity duration-[220ms] ease-in-out"
      leave-active-class="transition-opacity duration-[220ms] ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isNavigating"
        class="pointer-events-none fixed inset-0 z-9500 flex items-center justify-center bg-base-200/55 backdrop-blur-sm"
      >
        <div
          class="flex flex-col items-center gap-4 rounded-2xl border border-info bg-base-100/90 px-6 py-5 shadow-2xl"
        >
          <Icon
            name="kind-icon:loading"
            class="h-12 w-12 animate-spin text-info"
          />
          <div class="text-center">
            <div
              class="text-xs font-black uppercase tracking-[0.3em] text-info"
            >
              Loading
            </div>
            <p class="mt-2 text-sm opacity-80">
              The butterflies are filing a very professional incident report.
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main layout -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Debug panel — collapsible gear, bottom-left -->
    <div class="fixed bottom-4 left-4 z-10001">
      <button
        v-if="!debugPanelOpen"
        class="btn btn-xs btn-ghost rounded-2xl opacity-30 transition-opacity hover:opacity-70"
        @click="debugPanelOpen = true"
      >
        ⚙
      </button>

      <Transition
        enter-active-class="transition-[opacity,transform] duration-[180ms] ease-in-out"
        leave-active-class="transition-[opacity,transform] duration-[180ms] ease-in-out"
        enter-from-class="opacity-0 translate-y-2"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="debugPanelOpen"
          class="rounded-2xl border border-base-300 bg-base-100/95 shadow-2xl backdrop-blur"
        >
          <div class="flex min-w-[16rem] flex-col gap-3 p-3">
            <div class="flex items-center justify-between gap-2">
              <div
                class="text-xs font-black uppercase tracking-[0.3em] text-primary"
              >
                Debug
              </div>
              <button
                class="btn btn-xs btn-ghost rounded-2xl"
                @click="debugPanelOpen = false"
              >
                ✕
              </button>
            </div>

            <!-- Viewport info -->
            <div class="text-xs opacity-60 space-y-0.5">
              <div>Viewport: {{ displayStore.viewportSize }}</div>
              <div>Resolved: {{ layoutStore.resolvedLayout }}</div>
              <div>Layout: {{ layoutStore.currentLayout }}</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const layoutStore = useLayoutStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const isNavigating = ref(false)
const debugPanelOpen = ref(false)

const showSwarm = computed(() => smartbarStore.showSwarm)

let removeAfter: (() => void) | null = null
let removeBefore: (() => void) | null = null

onMounted(() => {
  removeBefore = router.beforeEach(() => {
    isNavigating.value = true
  })

  removeAfter = router.afterEach(() => {
    setTimeout(() => {
      isNavigating.value = false
    }, 450)
  })
})

onUnmounted(() => {
  removeBefore?.()
  removeAfter?.()
})

onMounted(async () => {
  displayStore.initialize()
  layoutStore.initializeStore()
  pageStore.initialize()
  if (!userStore.initialized) await userStore.initialize()
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>
