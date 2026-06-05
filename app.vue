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
          <div
            v-if="showPageSlotDebug"
            class="mb-3 shrink-0 rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-xs font-bold text-info"
          >
            Page slot mounted · active tab: {{ activeTab || 'none' }} · title:
            {{ activeTabConfig?.title || activeTabConfig?.label || 'none' }}
            Page title: {{ pageStore.page?.title || 'none' }}
            Path: {{ contentPath }}
            Loading: {{ pageStore.isLoading ? 'yes' : 'no' }}
          </div>

          <div
            class="flex min-h-0 flex-1 overflow-hidden md:flex-row md:gap-3"
          >
            <aside
              v-show="showWorkspaceSheet"
              class="h-full min-h-0 w-full shrink-0 overflow-hidden md:block md:max-w-[50%] md:basis-1/2 lg:max-w-[33.333333%] lg:basis-1/3 xl:max-w-[25%] xl:basis-1/4"
            >
              <workspace-sheet />
            </aside>

            <main
              v-show="showWorkspacePage"
              class="h-full min-h-0 w-full flex-1 overflow-hidden md:block"
            >
              <NuxtPage />
            </main>
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

type NavStoreWithWorkspaceSheet = {
  workspaceSheetOpen?: boolean
  sheetVisible?: boolean
  showWorkspaceSheet?: boolean
  dashboardShell?: {
    workspaceSheetOpen?: boolean
    sheetVisible?: boolean
    showWorkspaceSheet?: boolean
  }
}

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const showLoader = ref(true)
const isNavigating = ref(false)
const showPageSlotDebug = ref(true)

const contentPath = computed(() => route.path.replace(/\/$/, '') || '/')

const navState = computed(() => navStore as unknown as NavStoreWithWorkspaceSheet)

const mobileSheetOpen = computed(() => {
  return Boolean(
    navState.value.workspaceSheetOpen ??
      navState.value.sheetVisible ??
      navState.value.showWorkspaceSheet ??
      navState.value.dashboardShell?.workspaceSheetOpen ??
      navState.value.dashboardShell?.sheetVisible ??
      navState.value.dashboardShell?.showWorkspaceSheet ??
      false,
  )
})

const showWorkspaceSheet = computed(() => {
  return mobileSheetOpen.value
})

const showWorkspacePage = computed(() => {
  return !mobileSheetOpen.value
})

if (import.meta.client && route.query.token && !userStore.user) {
  await userStore.initialize({ token: String(route.query.token), force: true })
}

const {
  data: page,
  status: contentStatus,
  refresh: refreshPage,
} = await useAsyncData(
  () => `current-content-page:${contentPath.value}`,
  () => queryCollection('content').path(contentPath.value).first(),
  {
    default: () => null,
    watch: [contentPath],
    dedupe: 'cancel',
  },
)

watch(
  contentStatus,
  (status) => {
    pageStore.setLoading(status === 'pending' || status === 'idle')
  },
  { immediate: true },
)

watch(
  page,
  (val) => {
    if (val) {
      pageStore.setPage(val)
      navStore.setDashboardShellFromContent(val)
      return
    }

    if (contentStatus.value === 'success') {
      pageStore.clearPage()
      navStore.clearDashboardShell()
      pageStore.setLoading(false)
    }
  },
  { immediate: true },
)

watch(
  contentPath,
  () => {
    pageStore.setLoading(true)
  },
  { flush: 'sync' },
)

function handlePageReady(): void {
  showLoader.value = false
}

router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) {
    isNavigating.value = true
    pageStore.setLoading(true)
    pageStore.clearPage()
    navStore.clearDashboardShell()
  }
})

router.afterEach(async (to) => {
  navStore.recordVisit(to.fullPath)
  await refreshPage()
  isNavigating.value = false
})

router.onError(() => {
  isNavigating.value = false
  pageStore.setLoading(false)
})

useSeoMeta({
  title: () => page.value?.title || 'Kind Robots',
  description: () =>
    page.value?.description ||
    'A friendly AI playground for humans and robots.',
})
</script>