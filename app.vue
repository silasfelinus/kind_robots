<!-- /app.vue -->
<template>
  <div class="app-shell">
    <footer-toggle />
    <kind-loader />
    <milestone-popup />

    <animation-loader class="pointer-events-none fixed z-50" />

    <ClientOnly>
      <div
        v-if="showSwarm"
        class="pointer-events-none fixed inset-0 overflow-hidden"
        style="z-index: 9000"
        aria-hidden="true"
      >
        <butterfly-animation />
      </div>
    </ClientOnly>

    <Transition
      enter-active-class="transition-opacity duration-[220ms] ease-in-out"
      leave-active-class="transition-opacity duration-[220ms] ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isNavigating"
        class="pointer-events-none fixed inset-0 flex items-center justify-center backdrop-blur-sm"
        style="z-index: 9500"
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

    <div class="layout-shell bg-accent">
      <NuxtLayout>
        main content
      </NuxtLayout>
    </div>

    <ClientOnly>
      <div
        class="pointer-events-none fixed bottom-3 viewport-badge-wrap"
        style="
          left: 0;
          right: 0;
          z-index: 10001;
          display: flex;
          justify-content: center;
        "
      >
        <div class="viewport-badge">
          {{ displayStore.viewportSize }}
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const showSwarm = computed(() => smartbarStore.showSwarm)

let removeAfter: (() => void) | null = null
let removeBefore: (() => void) | null = null
let navigationTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  removeBefore = router.beforeEach(() => {
    if (navigationTimer) {
      clearTimeout(navigationTimer)
      navigationTimer = null
    }
    isNavigating.value = true
  })

  removeAfter = router.afterEach(() => {
    if (navigationTimer) clearTimeout(navigationTimer)
    navigationTimer = setTimeout(() => {
      isNavigating.value = false
      navigationTimer = null
    }, 450)
  })

  if (!displayStore.isInitialized) displayStore.initialize()
  layoutStore.initializeStore()
  pageStore.initialize()
  if (!userStore.initialized) await userStore.initialize()
})

onUnmounted(() => {
  if (navigationTimer) {
    clearTimeout(navigationTimer)
    navigationTimer = null
  }
  removeBefore?.()
  removeAfter?.()
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>

<style>
html,
body,
#__nuxt {
  width: 100%;
  min-width: 100%;
  height: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background: oklch(var(--b2));
  overflow: hidden;
}

.app-shell {
  position: relative;
  width: 100vw;
  height: 100dvh;
  min-width: 100vw;
  min-height: 100dvh;
  overflow: hidden;
  background: oklch(var(--b2));
  color: oklch(var(--bc));
}

.layout-shell {
  position: relative;
  width: 100vw;
  height: 100dvh;
  min-width: 100vw;
  min-height: 100dvh;
  overflow: hidden;
}

.layout-shell > * {
  width: 100%;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
}

.viewport-badge {
  background: oklch(var(--b2, 0.2 0 0) / 0.75);
  backdrop-filter: blur(6px);
  border: 1px solid oklch(var(--bc, 0.5 0 0) / 0.12);
  border-radius: 9999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: oklch(var(--bc, 0.5 0 0) / 0.35);
  user-select: none;
  white-space: nowrap;
}
</style>