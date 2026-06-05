<!-- /app.vue -->
<template>
  <div
    class="relative h-dvh min-h-dvh w-full overflow-hidden bg-base-100 text-base-content"
    style="--hand-h: 11.5rem"
  >
    <dashboard-shell>
      <section
        class="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      >
        <button
          v-if="!workspaceSheetOpen"
          type="button"
          class="btn btn-primary btn-xs btn-square absolute left-3 top-2 z-40 shadow-lg"
          aria-label="Open workspace"
          :aria-expanded="workspaceSheetOpen"
          @click="setWorkspaceSheetOpen(true)"
        >
          <Icon name="kind-icon:panel-left" class="h-4 w-4" />
        </button>

        <div
          class="flex min-h-0 flex-1 overflow-hidden pb-(--hand-h) md:flex-row md:gap-3"
        >
          <Transition name="workspace-sheet-slide">
            <aside
              v-if="workspaceSheetOpen"
              class="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 md:basis-1/2 md:max-w-[50%] lg:basis-1/3 lg:max-w-[33.333%] xl:basis-1/4 xl:max-w-[25%]"
            >
              <div
                class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-3 py-2"
              >
                <p
                  class="truncate text-xs font-black uppercase tracking-widest text-primary"
                >
                  Workspace
                </p>

                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  aria-label="Close workspace"
                  @click="setWorkspaceSheetOpen(false)"
                >
                  <Icon name="kind-icon:close" class="h-4 w-4" />
                </button>
              </div>

              <div
                class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
              >
                <ClientOnly>
                  <workspace-sheet />

                  <template #fallback>
                    <div
                      class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-sm text-base-content/60"
                    >
                      Loading workspace...
                    </div>
                  </template>
                </ClientOnly>
              </div>
            </aside>
          </Transition>

          <main
            class="relative h-full min-h-0 flex-1 overflow-y-auto"
            :class="workspaceSheetOpen ? 'hidden md:block' : 'block'"
          >
            <NuxtPage />
          </main>
        </div>
      </section>
    </dashboard-shell>

    <ClientOnly>
      <workspace-hand />

      <template #fallback>
        <div
          class="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/90 p-3 text-center text-xs font-black uppercase tracking-widest text-primary shadow-xl backdrop-blur"
        >
          Loading workspace hand...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import { usePageStore } from '@/stores/pageStore'

type WorkspaceContentPage = ContentCollectionItem & {
  title?: string
  description?: string
  subtitle?: string
  room?: string
  image?: string
  icon?: string
  tooltip?: string
  dottitip?: string
  amitip?: string
  dashboardKey?: string
  dashboardTab?: string
  loadingMessage?: string
  refreshLabel?: string
  cards?: unknown
  body?: unknown
}

const route = useRoute()
const pageStore = usePageStore()

const workspaceSheetOpen = ref(true)

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return path || '/'
})

const asyncKey = computed(() => `app-content:${contentPath.value}`)

pageStore.initialize()

const {
  data: pageData,
  status,
  refresh,
} = await useAsyncData(
  asyncKey.value,
  async () => {
    const result = await queryCollection('content')
      .path(contentPath.value)
      .first()

    return result as WorkspaceContentPage | null
  },
  {
    default: () => null,
    watch: [contentPath],
    server: true,
    lazy: false,
    immediate: true,
    dedupe: 'defer',
  },
)

const page = computed(() => pageData.value)

function setWorkspaceSheetOpen(value: boolean): void {
  workspaceSheetOpen.value = value

  if (import.meta.client) {
    window.localStorage.setItem(
      'kindrobots:workspace-sheet-open',
      value ? 'true' : 'false',
    )
  }
}

function syncPageStore(): void {
  if (status.value === 'pending' || status.value === 'idle') {
    pageStore.setLoading(true)
    return
  }

  if (page.value) {
    pageStore.setPage(page.value)
    return
  }

  if (status.value === 'success') {
    pageStore.clearPage()
    pageStore.setLoading(false)
  }
}

watch(
  status,
  () => {
    syncPageStore()
  },
  { immediate: true },
)

watch(
  page,
  () => {
    syncPageStore()
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

useSeoMeta({
  title: () => pageStore.title || 'Kind Robots',
  description: () =>
    pageStore.description ||
    pageStore.subtitle ||
    'A friendly AI playground for humans and robots.',
})

onMounted(async () => {
  const storedSheetOpen = window.localStorage.getItem(
    'kindrobots:workspace-sheet-open',
  )

  if (storedSheetOpen) {
    workspaceSheetOpen.value = storedSheetOpen === 'true'
  }

  await nextTick()
  syncPageStore()

  if (!page.value && status.value !== 'pending') {
    await refresh()
    syncPageStore()
  }
})
</script>

<style scoped>
.workspace-sheet-slide-enter-active,
.workspace-sheet-slide-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.workspace-sheet-slide-enter-from,
.workspace-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

.workspace-sheet-slide-enter-to,
.workspace-sheet-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
