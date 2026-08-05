<!-- /app.vue -->
<template>
  <div
    class="kr-shell relative h-dvh min-h-dvh w-full overflow-hidden text-base-content"
    :class="showLoader ? 'bg-black' : 'bg-base-100'"
    :style="shellVars"
  >
    <div
      v-if="showLoader"
      class="pointer-events-none fixed inset-0 z-48 bg-black"
      aria-hidden="true"
    />

    <ClientOnly>
      <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-50">
        <kind-loader @pageReady="handlePageReady" />
      </div>
    </ClientOnly>

    <ClientOnly>
      <animation-layer />
      <butterfly-layer class="pointer-events-none fixed inset-0 z-60" />
      <fx-clear-all />
      <achievement-popup />
      <first-launch-intro />
    </ClientOnly>

    <section
      class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl p-3 sm:p-4"
    >
      <workspace-header class="relative z-30" />

      <section class="relative z-10 min-h-0 flex-1 overflow-hidden">
        <button
          v-if="!workspaceSheetOpen"
          type="button"
          class="btn btn-xs btn-square absolute left-0 top-0 z-40 shadow-lg"
          aria-label="Open workspace"
          :aria-expanded="workspaceSheetOpen"
          @click="setWorkspaceSheetOpen(true)"
        >
          <Icon name="kind-icon:question" class="h-4 w-4" />
        </button>

        <Transition name="kr-sheet-slide">
          <aside
            v-if="workspaceSheetOpen"
            class="absolute inset-y-0 left-0 z-30 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl md:w-(--sheet-w)"
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

            <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
              <ClientOnly>
                <LazyWorkspaceSheet />

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

        <!--
          `data-kr-backdrop` flips the surface tokens (assets/css/tailwind.css)
          for everything inside, so the shared kit's panels go translucent and
          the art reads through them. Present ONLY when the page actually
          declares backdrop art — otherwise the attribute is absent and every
          surface resolves to the same opaque theme colour it always had.

          It sits on <main> rather than on the backdrop element because the
          backdrop is a sibling of the page content, not its ancestor; the
          tokens have to be inherited by the cards, which live under <main>.
        -->
        <main
          class="kr-main relative z-10 h-full min-h-0 overflow-hidden rounded-2xl bg-base-100 transition-[padding] duration-300 ease-out"
          :class="workspaceSheetOpen ? 'hidden md:block' : 'block'"
          :data-kr-backdrop="hasPageBackdrop ? '' : undefined"
        >
          <!--
            Page backdrop art, BEFORE fx-region deliberately. Both layers sit
            at z-0, so DOM order decides: the backdrop paints first, fx-region's
            effects paint over it, and the z-10 <NuxtPage /> wrapper below sits
            above both. Renders nothing at all unless the page declares art.
          -->
          <kr-page-backdrop
            :mobile="pageStore.backgroundMobile"
            :tablet="pageStore.backgroundTablet"
            :desktop="pageStore.backgroundDesktop"
          />

          <fx-region region="page" />

          <div
            class="relative z-10 h-full min-h-0 w-full overflow-x-visible overflow-hidden"
          >
            <NuxtPage />
          </div>
        </main>
      </section>
    </section>

    <ClientOnly>
      <section
        class="kr-footer pointer-events-none fixed bottom-0 z-40 flex flex-col gap-2 px-2 sm:px-3 lg:flex-row lg:items-end"
        :style="footerVars"
      >
        <Transition name="kr-hand-slide">
          <div
            v-if="handOpen"
            class="pointer-events-auto min-w-0 w-full flex-1"
            :style="{ height: 'var(--hand-panel-h)' }"
          >
            <LazyWorkspaceHand @resting-height="handRestingHeight = $event" />
          </div>
        </Transition>
      </section>

      <div
        class="pointer-events-auto fixed bottom-3 right-3 z-40 flex items-end gap-2"
      >
        <button
          type="button"
          class="kr-workspace-dock group relative shrink-0 overflow-hidden rounded-full border-2 border-primary/70 bg-base-100 shadow-2xl ring-2 ring-base-100/80 transition duration-200 hover:scale-105 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="bottomDockLabel"
          :title="bottomDockLabel"
          :aria-expanded="handOpen"
          @click="toggleCards"
        >
          <div
            class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-xl transition group-hover:opacity-100"
          />

          <span
            class="relative flex h-full w-full items-center justify-center bg-primary/10 text-primary"
          >
            <Icon name="kind-icon:card" class="h-8 w-8" />
          </span>

          <span
            class="absolute bottom-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-base-300 bg-base-100/95 text-primary shadow"
            aria-hidden="true"
          >
            <Icon :name="bottomDockActionIcon" class="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      <template #fallback>
        <div
          class="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/90 p-3 text-center text-xs font-black uppercase tracking-widest text-primary shadow-xl backdrop-blur"
        >
          Loading workspace tools...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import { useIntroStore } from '@/stores/introStore'

const pageStore = usePageStore()

/**
 * Whether the current page declares any backdrop art.
 *
 * Mirrors kr-page-backdrop's own `hasBackdrop` rather than reading it off the
 * child, because the attribute it drives belongs on <main> — the cards that
 * inherit the surface tokens are siblings of the backdrop, not its children.
 */
const hasPageBackdrop = computed(() =>
  Boolean(
    pageStore.backgroundMobile ||
      pageStore.backgroundTablet ||
      pageStore.backgroundDesktop,
  ),
)
const navStore = useNavStore()
const userStore = useUserStore()
const introStore = useIntroStore()
const route = useRoute()

const { workspaceSheetOpen } = storeToRefs(navStore)

const showLoader = ref(true)

let failsafeTimeoutId: ReturnType<typeof setTimeout> | null = null

function handlePageReady(): void {
  showLoader.value = false

  if (failsafeTimeoutId) {
    clearTimeout(failsafeTimeoutId)
    failsafeTimeoutId = null
  }
}

const isMd = ref(false)
const isXl = ref(false)

let mdMedia: MediaQueryList | null = null
let xlMedia: MediaQueryList | null = null

/*
 * The narrator is no longer part of the global chrome. It used to render on
 * every page with Ami as a default voice, which was distracting, and it made
 * app.vue import narratorStore — which pulls dreamStore, chatStore, serverStore
 * and sceneChoices into the eager first-paint bundle for every visitor. It now
 * belongs to the dream interact surface, which loads it on demand.
 *
 * The dock is a plain two-state toggle: cards shown, or cards hidden.
 */
const handOpen = ref(false)

function syncBreakpoints(): void {
  if (mdMedia) isMd.value = mdMedia.matches
  if (xlMedia) isXl.value = xlMedia.matches
}

const SHEET_W_MD = '20rem'
const SHEET_W_XL = '24rem'
const DOCK_CIRCLE_MD = '4.5rem'
const DOCK_CIRCLE_MOBILE = '5.25rem'
const HAND_PANEL_H = '11.5rem'

const dockCircle = computed(() => {
  return isMd.value ? DOCK_CIRCLE_MD : DOCK_CIRCLE_MOBILE
})

const sheetWidth = computed(() => {
  if (!workspaceSheetOpen.value || !isMd.value) return '0px'

  return isXl.value ? SHEET_W_XL : SHEET_W_MD
})

const footerOpen = computed(() => handOpen.value)

/**
 * What the hand reports it actually needs. HAND_PANEL_H is only the fallback
 * for the frame or two before the first measurement lands — reserving a
 * constant outright left a 67px dead band between the page content and the
 * cards (measured at 428px: 129px of cards inside a 184px reservation), which
 * is the empty space Silas photographed.
 */
const handRestingHeight = ref<number | null>(null)

const footerHeight = computed(() => {
  if (!footerOpen.value) return '0px'
  if (!handOpen.value) return '0px'

  return handRestingHeight.value ? `${handRestingHeight.value}px` : HAND_PANEL_H
})

const shellVars = computed<CSSProperties>(() => {
  return {
    '--sheet-w': sheetWidth.value,
    '--dock-circle': dockCircle.value,
    '--footer-h': footerHeight.value,
    // Same measured height as --footer-h: the slot the hand sits in and the
    // padding the page reserves for it must be the same number, or the
    // difference shows up as dead space.
    '--hand-panel-h': handOpen.value ? footerHeight.value : '0px',
    '--footer-gap': '0px',
  } as CSSProperties
})

const footerVars = computed<CSSProperties>(() => {
  return {
    left: 'var(--sheet-w)',
    /*
     * Stop the hand before the dock button instead of running underneath it.
     * The dock is a sibling overlay pinned bottom-right, so a footer ending at
     * right:0 necessarily passes behind it — measured at 390px, the hand's
     * right edge was 382 while the dock started at 294, so 88px of cards sat
     * under the button and the last card could not be reached. Silas: "the
     * toggle is still over the hand display ... [it] should stop horizontally
     * before it hits the toggle."
     *
     * --dock-circle is the button's own size and 0.75rem matches its `right-3`
     * inset, so this tracks the dock at every breakpoint rather than hardcoding
     * a width that would drift the moment the button is resized.
     */
    right: 'calc(var(--dock-circle) + 0.75rem + 0.5rem)',
    height: 'var(--footer-h)',
  } as CSSProperties
})

const bottomDockLabel = computed(() =>
  handOpen.value ? 'Hide cards' : 'Show cards',
)

const bottomDockActionIcon = computed(() =>
  handOpen.value ? 'kind-icon:close' : 'kind-icon:card',
)

function toggleCards(): void {
  handOpen.value = !handOpen.value
}

function setWorkspaceSheetOpen(value: boolean): void {
  navStore.setWorkspaceSheetOpen(value)
}

watch(
  () => route.fullPath,
  (path, previousPath) => {
    navStore.recordVisit(path)

    if (previousPath !== undefined) {
      void import('@/stores/achievementStore').then(({ useAchievementStore }) =>
        useAchievementStore().rewardAchievementForPath(path),
      )
    }
  },
  { immediate: true },
)

watch(
  () => [userStore.user?.id, userStore.isGuest] as const,
  () => introStore.maybeAutoOpen(),
  { immediate: true },
)

useSeoMeta({
  title: () => pageStore.title || 'Kind Robots',
  description: () =>
    pageStore.description ||
    pageStore.subtitle ||
    'A friendly AI playground for humans and robots.',
})

onMounted(async () => {
  pageStore.initialize()
  await navStore.initialize()

  mdMedia = window.matchMedia('(min-width: 768px)')
  xlMedia = window.matchMedia('(min-width: 1280px)')

  syncBreakpoints()

  mdMedia.addEventListener('change', syncBreakpoints)
  xlMedia.addEventListener('change', syncBreakpoints)

  /*
   * Last-resort only. The intro fades on its own by ~5.7s worst case
   * (loading-messages.vue: INTRO_MAX_MS + the 650ms fade), so this must sit
   * well clear of that — at 8s it used to rip the loader out mid-sequence and
   * pre-empt the graceful fade on every slow load.
   */
  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null
  }, 9000)
})

onBeforeUnmount(() => {
  mdMedia?.removeEventListener('change', syncBreakpoints)
  xlMedia?.removeEventListener('change', syncBreakpoints)

  if (failsafeTimeoutId) {
    clearTimeout(failsafeTimeoutId)
    failsafeTimeoutId = null
  }
})
</script>

<style scoped>
.kr-main {
  padding-right: 0;
  padding-bottom: var(--footer-h);
}

.kr-workspace-dock {
  height: var(--dock-circle);
  width: var(--dock-circle);
}

@media (min-width: 768px) {
  .kr-main {
    padding-left: var(--sheet-w);
  }
}

.kr-sheet-slide-enter-active,
.kr-sheet-slide-leave-active {
  transition:
    opacity 240ms ease,
    transform 240ms ease;
}

.kr-sheet-slide-enter-from,
.kr-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

.kr-hand-slide-enter-active,
.kr-hand-slide-leave-active,
@media (prefers-reduced-motion: reduce) {
  .kr-workspace-dock,
  .kr-hand-slide-enter-active,
  .kr-hand-slide-leave-active {
    transition: none;
  }
}
</style>
