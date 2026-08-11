<!-- /app.vue -->
<template>
  <div
    class="kr-shell relative h-dvh min-h-dvh w-full overflow-hidden text-base-content"
    :class="showLoader ? 'bg-black' : 'bg-base-100'"
    :style="shellVars"
    :data-kr-backdrop="hasPageBackdrop ? '' : undefined"
  >
    <!--
      ai-art-academy/t-062+t-063: @vite-pwa/nuxt does not inject the
      <link rel="manifest"> tag automatically -- it only ships one via this
      renderless component (module source: dist/runtime/components/
      VitePwaManifest.js), which nuxt.config.ts's `pwa` block never mounted
      anywhere. Without a linked manifest, browsers never satisfy the
      installability criteria and `beforeinstallprompt` never fires, even
      though /manifest.webmanifest itself resolves fine. Renders nothing;
      mount once, root-level, so every route gets the link.
    -->
    <VitePwaManifest />

    <!--
      FULL PAGE, not just the content well. Silas, 2026-08-06: "I'm more
      interested in why we aren't doing backgrounds from the full page spread,
      and instead still starting in main content, so the dashboard section and
      gutters are independent. I think it would look better if backgrounds were
      full page."

      This lives on .kr-shell rather than inside <main> for exactly that reason:
      <main> sits below the header and inside the shell's p-3/p-4, so a backdrop
      mounted there can never reach the nav bar or the gutters. Absolute
      inset-0 against the shell covers the viewport instead.

      First child, and unpositioned in the stack, so every later sibling — the
      header, the content, the overlays — paints above it.
    -->
    <kr-page-backdrop
      :mobile="pageStore.backgroundMobile"
      :tablet="pageStore.backgroundTablet"
      :desktop="pageStore.backgroundDesktop"
    />
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
        <!--
          The "?" that opened this sheet USED TO LIVE HERE, as `absolute left-0
          top-0 z-40`. It is now the left-most button in workspace-header.vue --
          see the long note beside it there.

          Short version: out of flow means over the page, always. Silas,
          2026-08-10: "It renders OUTSIDE the layout and overlaps content below
          the header." On /characters it landed on the Cards/Heroes/Icons bar,
          on /resources on gallery items, on /facets in dead space. No page can
          reserve room for an overlay it does not know about, so there is no
          per-page fix -- only moving it back into the one row that is already
          reserved for chrome.

          Nothing replaces it here. The close control inside the sheet below is
          still the sheet's own; the header button is what opens it.
        -->
        <Transition name="kr-sheet-slide">
          <aside
            v-if="workspaceSheetOpen"
            class="absolute inset-y-0 left-0 z-30 flex h-full min-h-0 w-full flex-col overflow-hidden kr-panel-flat shadow-xl md:w-(--sheet-w)"
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
          `data-kr-backdrop` now lives on .kr-shell, not here — the header and
          the gutters need the translucent tokens too, and they are outside
          <main>. It flips the surface tokens (assets/css/tailwind.css) for
          everything inside, so panels go translucent and the art reads through.
          Present ONLY when the page actually declares art; otherwise every
          surface resolves to the same opaque theme colour it always had.
        -->
        <!--
          NO BACKGROUND AT ALL. This is a structural container, not a surface —
          the page root inside it is the surface, and every page root already
          reads a translucent token.
          
          Giving <main> a token too stacked two translucent layers over the art:
          66% and then 66% of what was left is ~88% opaque, which is why the
          first full-page attempt looked like no backdrop at all. Opacity
          multiplies down a stack; only one layer in it may paint.
          
          Pages with no backdrop are unaffected — .kr-shell paints base-100
          behind this, and the page root resolves to the same colour it always
          had.
        -->
        <main
          class="kr-main relative z-10 h-full min-h-0 overflow-hidden rounded-2xl transition-[padding] duration-300 ease-out"
          :class="workspaceSheetOpen ? 'hidden md:block' : 'block'"
        >
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

      <!--
        THE FLOATING CARD DOCK USED TO LIVE HERE, as a `fixed bottom-3 right-3`
        circle that toggled the hand. Silas, 2026-08-11: "remove the front end
        toggle for the card view, and put it in the login-manager menu ... no
        other conditionals, just a toggle that controls whether the user sees
        our hand navigation menu on the bottom of the page".

        It was the last floating control on the page, and it cost more than its
        own footprint: the hand had to stop short of it horizontally (see the
        note on `right` in footerVars below), so a button that only ever said
        "show cards / hide cards" was permanently eating a corner of the cards
        it toggled. Moving it into the account hub gives the hand the full
        width back and puts the switch where every other app-level preference
        already lives.
      -->

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
import { retireBootCover } from '@/utils/startupLaunch'

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

/*
 * ARMED IN SETUP, NOT onMounted -- and that distinction is the whole bug.
 *
 * Silas, 2026-08-09: "Whenever I load the site from a non-root address of
 * kind-robots.vercel.app/ we are seeing our loading animation on loop."
 *
 * The z-48 black base below is SSR-rendered and gated on `showLoader`, and only
 * two things ever clear it: kind-loader's `pageReady` (inside <ClientOnly>, so
 * it needs a mounted app) and this timer. Parking the timer in `onMounted` put
 * BOTH escapes behind the same door.
 *
 * pages/[...slug].vue -- the page component for nearly every route, including
 * `/` -- has a top-level `await useAsyncData(...)` in <script setup>. Nuxt
 * wraps a page in `Suspense` with `suspensible: true`, which propagates to the
 * root Suspense that `deferHydration()` is waiting on. So while that content
 * query is outstanding the root never finishes hydrating, `onMounted` never
 * fires, the failsafe is never armed, and the black cover has no upper bound at
 * all. Production has been logging exactly that outstanding query since
 * 2026-08-06: `[performFetch] Failed after 1 attempt(s): AbortError` on the
 * `/[...slug]` route, alongside 40s function timeouts.
 *
 * setup() DOES run in that state -- hydration walks the root before it reaches
 * the suspended child -- so a timer started here survives a page that never
 * settles. A failsafe downstream of the thing it exists to catch is not a
 * failsafe.
 *
 * The delay still clears the graceful path: loading-messages fades by ~5.7s
 * worst case (INTRO_MAX_MS + the 650ms fade), so at 9s this only ever fires
 * when the normal handoff did not.
 */
if (import.meta.client) {
  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null

    /*
     * The server cover normally retires on its own 6s keyframe, or early via
     * markAppReady() once kind-loader runs. Neither is guaranteed here -- this
     * branch exists precisely for the case where the app never reached
     * kind-loader, and the keyframe shares an inline <style> block that has
     * been observed not to apply. Removing the node needs neither.
     */
    retireBootCover()
  }, 9000)
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
 * The hand is a plain two-state preference: cards shown, or cards hidden. It
 * reads from navStore rather than a local ref because the switch that flips it
 * now lives in the account hub -- a sibling several levels down, not an
 * ancestor -- and because the preference is remembered across reloads.
 */
const { workspaceHandOpen: handOpen } = storeToRefs(navStore)

function syncBreakpoints(): void {
  if (mdMedia) isMd.value = mdMedia.matches
  if (xlMedia) isXl.value = xlMedia.matches
}

const SHEET_W_MD = '20rem'
const SHEET_W_XL = '24rem'
const HAND_PANEL_H = '11.5rem'

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
     * FULL WIDTH AGAIN. This used to read
     * `calc(var(--dock-circle) + 0.75rem + 0.5rem)` so the hand would stop
     * short of the floating card dock rather than run underneath it — measured
     * at 390px, 88px of cards sat under the button and the last card could not
     * be reached. That dock is gone (Silas moved the toggle into the account
     * hub, 2026-08-11), so there is nothing in the bottom-right corner left to
     * dodge and the cards get the width back.
     */
    right: '0px',
    height: 'var(--footer-h)',
  } as CSSProperties
})

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
   * The loader failsafe used to be armed HERE. It moved into setup() -- see the
   * note beside `showLoader` -- because reaching this hook is precisely what a
   * stalled page prevents.
   */
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

/*
 * This rule used to be a dangling selector list — `.kr-hand-slide-enter-active,
 * .kr-hand-slide-leave-active,` with a comma running straight into the
 * @media below and no declaration block of its own. The parser swallowed
 * both selectors into the at-rule's prelude, so the hand had no transition at
 * all and the reduced-motion guard had nothing to guard. The guard existing is
 * the evidence motion was intended here; this restores it, matching the
 * sheet's timing above.
 */
.kr-hand-slide-enter-active,
.kr-hand-slide-leave-active {
  transition:
    opacity 240ms ease,
    transform 240ms ease;
}

.kr-hand-slide-enter-from,
.kr-hand-slide-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

@media (prefers-reduced-motion: reduce) {
  .kr-hand-slide-enter-active,
  .kr-hand-slide-leave-active {
    transition: none;
  }
}
</style>
