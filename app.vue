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
      <!--
        Header owns its own full/compact density (xl-default-full) and toggles
        itself. The header toggle and the hand toggle are fully independent.
      -->
      <workspace-header class="relative z-90" />

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

        <main
          class="relative z-10 flex h-full min-h-0 overflow-x-visible overflow-y-hidden md:overflow-hidden"
        >
          <div
            class="relative z-10 flex min-h-0 flex-1 overflow-x-visible overflow-y-hidden pb-20 md:flex-row md:gap-3 md:overflow-hidden md:pb-(--hand-h)"
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
                  class="relative z-10 h-full min-h-0 w-full overflow-x-visible overflow-y-auto overscroll-y-contain"
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
        class="pointer-events-none fixed inset-x-0 bottom-0 z-90 flex items-end justify-between gap-2 px-2 sm:px-3 md:h-(--hand-h)"
      >
        <!--
          HAND
          - Hidden by default (handOpen starts false).
          - Revealed by the bottom-left card toggle.
          - At < xl, opening the hand closes the narrator panel (mutually
            exclusive). At xl, hand + narrator may coexist.
        -->
        <Transition name="workspace-hand-slide">
          <div
            v-if="handOpen"
            class="pointer-events-auto min-w-0 flex-1"
            :style="{ height: 'var(--hand-h)' }"
          >
            <workspace-hand />
          </div>
          <div v-else class="min-w-0 flex-1" />
        </Transition>

        <!--
          NARRATOR (lg/xl rail, bottom-right)
          On lg and up this sits in the bottom-right of the footer rail.
          Its small portrait button is always tappable; opening the panel
          lets the narrator borrow the footer space.
        -->
        <div class="hidden shrink-0 items-end justify-end lg:flex">
          <workspace-narrator
            rail-mode
            :close-signal="narratorCloseSignal"
            @panel-open-change="setNarratorPanelOpen"
          />
        </div>
      </section>

      <!--
        MOBILE / sm-md CONTROLS
        Card toggle: bottom-left (all sizes via this block on < lg).
        Narrator toggle: right side, just above the hand region.
      -->
      <section
        class="pointer-events-none fixed inset-x-0 bottom-0 z-100 lg:hidden"
      >
        <!-- Narrator toggle + panel: bottom-right, above the hand -->
        <div
          class="pointer-events-auto fixed bottom-[calc(var(--hand-h)+0.75rem)] right-3 z-100"
        >
          <workspace-narrator
            rail-mode
            mobile-toggle
            :close-signal="narratorCloseSignal"
            @panel-open-change="setNarratorPanelOpen"
          />
        </div>

        <!-- Card toggle: bottom-left -->
        <div class="pointer-events-auto fixed bottom-3 left-3 z-120">
          <button
            type="button"
            class="btn btn-primary btn-circle btn-sm shadow-2xl"
            :class="handOpen ? 'btn-active' : ''"
            :aria-expanded="handOpen"
            aria-label="Toggle workspace hand"
            title="Toggle workspace hand"
            @click="toggleHand"
          >
            <Icon name="kind-icon:card" class="h-5 w-5" />
          </button>
        </div>
      </section>

      <!--
        DESKTOP (lg+) card toggle: bottom-left.
        Kept separate from the narrator rail so the two toggles are
        positioned independently per the breakpoint rules.
      -->
      <div
        class="pointer-events-auto fixed bottom-3 left-3 z-120 hidden lg:block"
      >
        <button
          type="button"
          class="btn btn-primary btn-circle btn-sm shadow-2xl"
          :class="handOpen ? 'btn-active' : ''"
          :aria-expanded="handOpen"
          aria-label="Toggle workspace hand"
          title="Toggle workspace hand"
          @click="toggleHand"
        >
          <Icon name="kind-icon:card" class="h-5 w-5" />
        </button>
      </div>

      <template #fallback>
        <div
          class="fixed inset-x-0 bottom-0 z-60 border-t border-base-300 bg-base-100/90 p-3 text-center text-xs font-black uppercase tracking-widest text-primary shadow-xl backdrop-blur"
        >
          Loading workspace tools...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const navStore = useNavStore()

const { workspaceSheetOpen } = storeToRefs(navStore)

// Start TRUE so the first paint (SSR + initial client frame, pre-hydration)
// renders bg-black on the root. handlePageReady flips it off.
const showLoader = ref(true)

let failsafeTimeoutId: ReturnType<typeof setTimeout> | null = null

function handlePageReady(): void {
  showLoader.value = false

  if (failsafeTimeoutId) {
    clearTimeout(failsafeTimeoutId)
    failsafeTimeoutId = null
  }
}

// ---------------------------------------------------------------------------
// Hand / Narrator toggle orchestration
//
// Rules:
//  - Hand is hidden by default.
//  - Each toggle flips ONLY its own panel, so turning the active one off
//    (while the other is already off) reaches the "both off" state.
//  - Below xl, the two are mutually exclusive: opening one closes the other.
//  - At xl, they may coexist, so opening one leaves the other untouched.
// ---------------------------------------------------------------------------

const handOpen = ref(false)
const narratorPanelOpen = ref(false)
const narratorCloseSignal = ref(0)

// xl breakpoint (>= 1280px) governs whether the two panels coexist.
const isXl = ref(false)
let xlMedia: MediaQueryList | null = null

function syncIsXl(): void {
  if (xlMedia) isXl.value = xlMedia.matches
}

function closeNarrator(): void {
  // narratorPanelOpen will follow via the child's panel-open-change emit,
  // but we also bump the close signal to drive the child's closePanel().
  narratorCloseSignal.value += 1
}

function toggleHand(): void {
  const next = !handOpen.value
  handOpen.value = next

  // Below xl, an open hand and an open narrator can't coexist.
  if (next && !isXl.value && narratorPanelOpen.value) {
    closeNarrator()
  }
}

function setNarratorPanelOpen(value: boolean): void {
  narratorPanelOpen.value = value

  // Below xl, opening the narrator hides the hand.
  if (value && !isXl.value) {
    handOpen.value = false
  }
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

  // Wire up xl breakpoint tracking.
  xlMedia = window.matchMedia('(min-width: 1280px)')
  syncIsXl()
  xlMedia.addEventListener('change', syncIsXl)

  // At xl the hand can default open alongside the narrator; below xl it
  // stays hidden until the card toggle reveals it.
  if (isXl.value) {
    handOpen.value = true
  }

  // Failsafe so a hung store init never traps the user on black forever.
  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null
  }, 8000)
})

onBeforeUnmount(() => {
  xlMedia?.removeEventListener('change', syncIsXl)
})
</script>
