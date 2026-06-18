<!-- /app.vue -->
<template>
  <div
    class="relative h-dvh min-h-dvh w-full overflow-hidden text-base-content"
    :class="showLoader ? 'bg-black' : 'bg-base-100'"
    style="--hand-h: 11.5rem"
  >
    <ClientOnly>
      <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-120">
        <kind-loader @pageReady="handlePageReady" />
      </div>
    </ClientOnly>

    <ClientOnly>
      <butterfly-layer class="pointer-events-none fixed inset-0 z-130" />
      <animation-layer />
      <fx-clear-all />
      <milestone-popup />
    </ClientOnly>

    <section
      class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl p-3 sm:p-4"
    >
      <workspace-header
        class="relative z-90"
        :chrome-minimized="chromeMinimized"
        @toggle-chrome="toggleChrome"
      />

      <section class="relative z-10 min-h-0 flex-1 overflow-hidden">
        <button
          v-if="!workspaceSheetOpen"
          type="button"
          class="btn btn-xs btn-square absolute left-0 top-0 z-80 shadow-lg"
          aria-label="Open workspace"
          :aria-expanded="workspaceSheetOpen"
          @click="setWorkspaceSheetOpen(true)"
        >
          <Icon name="kind-icon:question" class="h-4 w-4" />
        </button>

        <main class="relative z-10 flex h-full min-h-0 overflow-hidden">
          <div
            class="relative z-10 flex min-h-0 flex-1 overflow-hidden md:flex-row md:gap-3"
            :class="chromeMinimized ? 'pb-10' : 'pb-(--hand-h)'"
          >
            <Transition name="workspace-sheet-slide">
              <aside
                v-if="workspaceSheetOpen"
                class="relative z-70 flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 md:basis-1/2 md:max-w-[50%] lg:basis-1/3 lg:max-w-[33.333%] xl:basis-1/4 xl:max-w-[25%]"
              >
                <fx-region region="sheet" />

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
                        class="rounded-2xl border border-dashed border-base-300 p-4 text-sm text-base-content/60"
                      >
                        Loading workspace...
                      </div>
                    </template>
                  </ClientOnly>
                </div>
              </aside>
            </Transition>

            <section
              class="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4"
              :class="workspaceSheetOpen ? 'hidden md:flex' : 'flex'"
            >
              <div
                class="relative z-10 min-h-0 flex-1 overflow-hidden rounded-2xl bg-base-100"
              >
                <fx-region region="page" />

                <main
                  class="relative z-10 h-full min-h-0 w-full overflow-y-auto overscroll-contain"
                >
                  <NuxtPage />
                </main>
              </div>
            </section>
          </div>
        </main>
      </section>
    </section>

    <ClientOnly>
      <section
        v-if="!chromeMinimized"
        class="pointer-events-none fixed inset-x-0 bottom-0 z-90 flex items-end gap-2 px-2 sm:px-3"
        style="height: var(--hand-h)"
      >
        <div class="relative min-w-0 flex-1">
          <Transition name="workspace-hand-slide">
            <workspace-hand />
          </Transition>
        </div>

        <div class="relative z-100 flex shrink-0 items-end justify-end">
          <workspace-narrator rail-mode />
        </div>
      </section>

      <workspace-narrator
        v-else
        :chrome-minimized="chromeMinimized"
        rail-mode
      />

      <template #fallback>
        <div
          class="fixed inset-x-0 bottom-0 z-60 border-t border-base-300 bg-base-100/90 p-3 text-center text-xs font-black uppercase tracking-widest text-primary shadow-xl backdrop-blur"
        >
          Loading workspace tools...
        </div>
      </template>
    </ClientOnly>

    <button
      type="button"
      class="btn btn-sm btn-circle fixed left-1/2 z-100 -translate-x-1/2 shadow-xl transition-all duration-300"
      :class="
        chromeMinimized ? 'bottom-3' : 'bottom-[calc(var(--hand-h)+0.5rem)]'
      "
      :aria-label="
        chromeMinimized ? 'Restore header and footer' : 'Hide header and footer'
      "
      :title="
        chromeMinimized ? 'Restore header and footer' : 'Hide header and footer'
      "
      @click="toggleChrome"
    >
      <Icon
        :name="
          chromeMinimized ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
        "
        class="h-5 w-5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const navStore = useNavStore()

const { workspaceSheetOpen } = storeToRefs(navStore)

// Start TRUE so the first paint (SSR + initial client frame, pre-hydration)
// renders bg-black on the root. handlePageReady flips it off.
const showLoader = ref(true)
const chromeMinimized = ref(false)

let failsafeTimeoutId: ReturnType<typeof setTimeout> | null = null

function handlePageReady(): void {
  showLoader.value = false

  if (failsafeTimeoutId) {
    clearTimeout(failsafeTimeoutId)
    failsafeTimeoutId = null
  }
}

function persist(key: string, value: boolean): void {
  if (!import.meta.client) return

  window.localStorage.setItem(key, value ? 'true' : 'false')
}

function minimizeChrome(): void {
  chromeMinimized.value = true
  persist('kindrobots:chrome-minimized', true)
}

function restoreChrome(): void {
  chromeMinimized.value = false
  persist('kindrobots:chrome-minimized', false)
}

function toggleChrome(): void {
  if (chromeMinimized.value) restoreChrome()
  else minimizeChrome()
}

function setWorkspaceSheetOpen(value: boolean): void {
  navStore.setWorkspaceSheetOpen(value)
}

useSeoMeta({
  title: () => pageStore.title || 'Kind Robots',
  description: () =>
    pageStore.description ||
    pageStore.subtitle ||
    'A friendly AI playground for humans and robots.',
})

onMounted(async () => {
  // Do NOT set showLoader here — it must already be true from SSR.

  pageStore.initialize()

  await navStore.initialize()

  const storedChromeMinimized = window.localStorage.getItem(
    'kindrobots:chrome-minimized',
  )

  if (storedChromeMinimized) {
    chromeMinimized.value = storedChromeMinimized === 'true'
  }

  // Failsafe so a hung store init never traps the user on black forever.
  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null
  }, 8000)
})
</script>
