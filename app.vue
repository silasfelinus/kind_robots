<!-- /app.vue -->
<template>
  <div class="relative min-h-dvh w-full overflow-hidden bg-base-200 text-base-content">
    <NuxtLoadingIndicator />

    <div
      v-if="showSwarm"
      class="pointer-events-none fixed inset-0 z-[9000] overflow-hidden"
      aria-hidden="true"
    >
      <div
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        class="absolute animate-butterfly-float text-secondary/70"
        :style="{
          left: butterfly.left,
          top: butterfly.top,
          animationDelay: butterfly.delay,
          animationDuration: butterfly.duration,
          fontSize: butterfly.size,
          transform: `rotate(${butterfly.rotate})`,
        }"
      >
        🦋
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="isNavigating"
        class="pointer-events-none fixed inset-0 z-[9500] flex items-center justify-center bg-base-200/55 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-4 rounded-2xl border border-info bg-base-100/90 px-6 py-5 shadow-2xl">
          <Icon name="kind-icon:loading" class="h-12 w-12 animate-spin text-info" />
          <div class="text-center">
            <div class="text-xs font-black uppercase tracking-[0.3em] text-info">
              Loading
            </div>
            <p class="mt-2 text-sm opacity-80">
              Butterflies are pretending this is absolutely under control.
            </p>
          </div>
        </div>
      </div>
    </transition>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <milestone-popup />

    <div class="pointer-events-none fixed bottom-3 right-3 z-[10000]">
      <div class="rounded-2xl border border-primary bg-base-100/90 px-4 py-2 shadow-xl backdrop-blur">
        <div class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          App Shell
        </div>
      </div>
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

interface ButterflyItem {
  id: number
  left: string
  top: string
  delay: string
  duration: string
  size: string
  rotate: string
}

const router = useRouter()
const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const layoutStore = useLayoutStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const isNavigating = ref(false)

const showSwarm = computed(() => smartbarStore.showSwarm)

const butterflies = computed<ButterflyItem[]>(() => [
  {
    id: 1,
    left: '6%',
    top: '14%',
    delay: '0s',
    duration: '12s',
    size: '1.6rem',
    rotate: '-12deg',
  },
  {
    id: 2,
    left: '18%',
    top: '62%',
    delay: '1.2s',
    duration: '15s',
    size: '2rem',
    rotate: '8deg',
  },
  {
    id: 3,
    left: '32%',
    top: '28%',
    delay: '2.4s',
    duration: '13s',
    size: '1.4rem',
    rotate: '-4deg',
  },
  {
    id: 4,
    left: '48%',
    top: '70%',
    delay: '0.8s',
    duration: '16s',
    size: '1.9rem',
    rotate: '10deg',
  },
  {
    id: 5,
    left: '58%',
    top: '18%',
    delay: '1.8s',
    duration: '14s',
    size: '1.5rem',
    rotate: '-10deg',
  },
  {
    id: 6,
    left: '72%',
    top: '54%',
    delay: '3s',
    duration: '17s',
    size: '2.1rem',
    rotate: '6deg',
  },
  {
    id: 7,
    left: '84%',
    top: '22%',
    delay: '2.1s',
    duration: '12.5s',
    size: '1.5rem',
    rotate: '-14deg',
  },
  {
    id: 8,
    left: '90%',
    top: '74%',
    delay: '0.4s',
    duration: '18s',
    size: '1.8rem',
    rotate: '12deg',
  },
])

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach(() => {
  window.setTimeout(() => {
    isNavigating.value = false
  }, 450)
})

onMounted(async () => {
  displayStore.initialize()
  layoutStore.initializeStore()
  pageStore.initialize()

  if (!userStore.initialized) {
    await userStore.initialize()
  }
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>

<style scoped>
@keyframes butterfly-float {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    opacity: 0.2;
  }
  20% {
    opacity: 0.7;
  }
  50% {
    transform: translate3d(28px, -36px, 0) rotate(6deg) scale(1.06);
    opacity: 0.9;
  }
  80% {
    opacity: 0.65;
  }
  100% {
    transform: translate3d(-22px, -84px, 0) rotate(-8deg) scale(0.98);
    opacity: 0.15;
  }
}

.animate-butterfly-float {
  animation-name: butterfly-float;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>