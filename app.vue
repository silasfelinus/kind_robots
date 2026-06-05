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
            class="flex min-h-0 flex-1 overflow-hidden pb-(--hand-h,4rem) md:flex-row md:gap-3"
          >
            <aside
              v-show="showWorkspaceSheet"
              class="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden md:basis-1/2 md:max-w-[50%] lg:basis-1/3 lg:max-w-[33.333%] xl:basis-1/4 xl:max-w-[25%]"
            >
              <div
                class="flex shrink-0 items-center justify-between border-b border-base-300 px-3 py-2"
              >
                <span
                  class="text-xs font-black uppercase tracking-widest text-primary"
                  >Workspace</span
                >
                <button
                  class="btn btn-ghost btn-xs"
                  aria-label="Close workspace"
                  @click="navStore.closeWorkspaceSheet()"
                >
                  <Icon name="kind-icon:close" class="h-4 w-4" />
                  <span class="md:hidden">Back to page</span>
                </button>
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto">
                <workspace-sheet />
              </div>
            </aside>

            <main
              v-show="showWorkspacePage"
              class="relative h-full min-h-0 flex-1 overflow-y-auto"
              :class="showWorkspaceSheet ? 'hidden md:block' : 'block'"
            >
              <button
                v-show="!showWorkspaceSheet"
                class="btn btn-primary btn-sm fixed left-3 top-[calc(var(--header-h,3.5rem)+0.5rem)] z-20"
                aria-label="Open workspace"
                @click="navStore.toggleWorkspaceSheet()"
              >
                <Icon name="kind-icon:panel-left" class="h-4 w-4" />
              </button>
              <NuxtPage />
            </main>
          </div>
        </section>
      </template>
    </dashboard-shell>

    <workspace-hand
      class="absolute inset-x-0 bottom-0 z-30 h-(--hand-h,4rem)"
    />
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

const contentPath = computed(() => route.path.replace(/\/$/, '') || '/')

const navState = computed(
  () => navStore as unknown as NavStoreWithWorkspaceSheet,
)

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

const showWorkspaceSheet = computed(() => navStore.workspaceSheetOpen)
const showWorkspacePage = computed(() => !navStore.workspaceSheetOpen)

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
