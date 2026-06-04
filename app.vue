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
      <nuxt-page />
    </dashboard-shell>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const displayStore = useDisplayStore()
const milestoneStore = useMilestoneStore()
const navStore = useNavStore()
const userStore = useUserStore()

const showLoader = ref(true)
const isNavigating = ref(false)

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

  window.setTimeout(() => {
    isNavigating.value = false
  }, 250)
})

onMounted(async () => {
  try {
    displayStore.initialize?.()
    await userStore.initialize?.()
    await navStore.initialize?.()

    if (userStore.user?.id && userStore.user.id !== 10) {
      await milestoneStore.initialize?.()
    }
  } catch (error) {
    console.error('App initialization failed:', error)
  } finally {
    window.setTimeout(() => {
      showLoader.value = false
    }, 1200)
  }
})
</script>
