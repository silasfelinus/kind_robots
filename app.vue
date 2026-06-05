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
            Page title: {{ pageStore.page?.title || 'none' }}
            Path: {{ contentPath }}
          </div>

          <div class="min-h-0 flex-1 overflow-hidden">
            <NuxtPage />
          </div>
        </section>

        <workspace-hand />
      </template>
    </dashboard-shell>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from '#app'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const showLoader = ref(true)
const isNavigating = ref(false)
const showPageSlotDebug = ref(true)

const contentPath = computed(() => route.path.replace(/\/$/, '') || '/')

if (import.meta.client && route.query.token && !userStore.user) {
  await userStore.initialize({ token: String(route.query.token), force: true })
}

const { data: page } = await useAsyncData(
  'current-content-page',
  () => queryCollection('content').path(contentPath.value).first(),
  {
    default: () => null,
    watch: [contentPath],
  },
)

watch(
  contentPath,
  () => {
    pageStore.clearPage()
    navStore.clearDashboardShell()
  },
  { flush: 'sync' },
)

watch(
  page,
  (val) => {
    if (val) {
      pageStore.setPage(val)
      navStore.setDashboardShellFromContent(val)
      return
    }

    pageStore.clearPage()
    navStore.clearDashboardShell()
  },
  { immediate: true },
)

function handlePageReady(): void {
  showLoader.value = false
}

router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) {
    isNavigating.value = true
    pageStore.clearPage()
    navStore.clearDashboardShell()
  }
})

router.afterEach((to) => {
  navStore.recordVisit(to.fullPath)
  isNavigating.value = false
})

router.onError(() => {
  isNavigating.value = false
})

useSeoMeta({
  title: () => page.value?.title || 'Kind Robots',
  description: () =>
    page.value?.description ||
    'A friendly AI playground for humans and robots.',
})
</script>