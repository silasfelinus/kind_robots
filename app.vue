<!-- /app.vue -->
<!--
  LAYOUT MODEL — one writer, shared geometry.

  app.vue owns three CSS custom properties on the root and is the ONLY place
  that writes them. Every region reads them; none of them set their own width
  against the others. This is what keeps the panels from fighting.

    --sheet-w     left sidebar (workspace-sheet) width; 0 when closed
    --narrator-w  right sidebar (workspace-narrator) width; 0 when collapsed
    --hand-h      footer height (hand / narrator-chat); 0 when both closed

  Consequences that fall out for free:
  - Main content pads by all three, so it always reflows.
  - The footer zone spans  left:var(--sheet-w)  right:var(--narrator-w),
    so on xl the sheet runs full height and the footer starts to its right —
    your xl requirement, with no breakpoint special-casing.
  - Hand and narrator-chat share the footer slot. Below xl they're mutually
    exclusive; at xl they split the row.

  Toggles are independent: each flips only its own region, so turning the
  active one off (while the other is already off) reaches the all-closed state.
-->
<template>
  <div
    class="kr-shell relative h-dvh min-h-dvh w-full overflow-hidden text-base-content"
    :class="showLoader ? 'bg-black' : 'bg-base-100'"
    :style="shellVars"
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
      <!-- Header: owns its own full/compact density and toggle. -->
      <workspace-header class="relative z-90" />

      <!-- BODY: sheet (left) · main (center) · narrator (right) · footer slot -->
      <section class="relative z-10 min-h-0 flex-1 overflow-hidden">
        <!-- Open-sheet affordance when the sheet is closed -->
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

        <!-- LEFT SIDEBAR — workspace-sheet.
             Full height of the body region at every breakpoint. On < md it
             takes the whole width (overlay-style); from md it sits in its
             column and main content pads left by --sheet-w. -->
        <Transition name="kr-sheet-slide">
          <aside
            v-if="workspaceSheetOpen"
            class="absolute inset-y-0 left-0 z-70 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl md:w-(--sheet-w)"
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

        <!-- CENTER — main content. Pads to clear sheet (L), narrator (R),
             footer (B). On < md the sheet is an overlay, so we only pad-left
             from md upward. -->
        <main
          class="kr-main relative z-10 h-full min-h-0 overflow-hidden transition-[padding] duration-300 ease-out"
          :class="workspaceSheetOpen ? 'hidden md:block' : 'block'"
        >
          <div
            class="relative z-10 h-full min-h-0 overflow-hidden rounded-2xl bg-base-100"
          >
            <fx-region region="page" />

            <div
              class="relative z-10 h-full min-h-0 w-full overflow-x-visible overflow-y-auto overscroll-y-contain"
            >
              <NuxtPage />
            </div>
          </div>
        </main>

        <!-- RIGHT SIDEBAR — workspace-narrator (open state) + circle toggle.
             The component manages its own open/collapsed visuals; app.vue only
             tells it how wide the rail is via --narrator-w and listens for its
             open/close to update the var. -->
        <workspace-narrator
          class="pointer-events-none absolute inset-y-0 right-0 z-110 transition-[width] duration-300 ease-out"
          :style="{ width: narratorRailWidth }"
          :open="narratorOpen"
          :coexist="isXl"
          @update:open="setNarratorOpen"
          @update:rendered="setNarratorRendered"
        />
      </section>
    </section>

    <!-- FOOTER ZONE — spans between the sheet and the narrator rail.
         Holds the hand and/or narrator-chat. -->
    <ClientOnly>
      <section
        class="kr-footer pointer-events-none fixed bottom-0 z-90 flex items-end gap-2 px-2 sm:px-3"
        :style="footerVars"
      >
        <!-- HAND (left/grow). Hidden until toggled (handOpen). -->
        <Transition name="kr-hand-slide">
          <div
            v-if="handOpen"
            class="pointer-events-auto min-w-0 flex-1"
            :style="{ height: 'var(--hand-h)' }"
          >
            <workspace-hand />
          </div>
        </Transition>

        <!-- NARRATOR-CHAT (right/fixed-ish). Swaps with the hand below xl;
             at xl it can sit beside it. -->
        <Transition name="kr-chat-slide">
          <div
            v-if="narratorRendered && narratorChatOpen"
            class="pointer-events-auto min-w-0"
            :class="isXl ? 'w-104 max-w-[42vw]' : 'flex-1'"
            :style="{ height: 'var(--hand-h)' }"
          >
            <narrator-chat
              :compact="!isXl"
              @close="setNarratorChatOpen(false)"
            />
          </div>
        </Transition>
      </section>

      <!-- BOTTOM-LEFT card toggle (hand). All breakpoints. -->
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

      <!-- BOTTOM-RIGHT chat toggle (narrator-chat). Sits just left of the
           narrator circle so the two right-side controls don't overlap. -->
      <div
        v-if="narratorRendered"
        class="pointer-events-auto fixed bottom-3 z-120"
        :style="{ right: 'calc(var(--narrator-circle) + 1.25rem)' }"
      >
        <button
          type="button"
          class="btn btn-secondary btn-circle btn-sm shadow-2xl"
          :class="narratorChatOpen ? 'btn-active' : ''"
          :aria-expanded="narratorChatOpen"
          aria-label="Toggle narrator chat"
          title="Toggle narrator chat"
          @click="toggleNarratorChat"
        >
          <Icon name="kind-icon:message" class="h-5 w-5" />
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const navStore = useNavStore()

const { workspaceSheetOpen } = storeToRefs(navStore)

// ── Loader ────────────────────────────────────────────────────────────────
// Start TRUE so the first paint (SSR + initial client frame) is bg-black.
const showLoader = ref(true)
let failsafeTimeoutId: ReturnType<typeof setTimeout> | null = null

function handlePageReady(): void {
  showLoader.value = false
  if (failsafeTimeoutId) {
    clearTimeout(failsafeTimeoutId)
    failsafeTimeoutId = null
  }
}

// ── Breakpoint ──────────────────────────────────────────────────────────────
// xl (>= 1280px) governs whether footer regions may coexist and how wide the
// sidebars are allowed to grow.
const isMd = ref(false)
const isXl = ref(false)
let mdMedia: MediaQueryList | null = null
let xlMedia: MediaQueryList | null = null

function syncBreakpoints(): void {
  if (mdMedia) isMd.value = mdMedia.matches
  if (xlMedia) isXl.value = xlMedia.matches
}

// ── Region open-state ────────────────────────────────────────────────────────
// Hand + narrator-chat share the footer; narrator (right sidebar) is its own.
const handOpen = ref(false)
const narratorChatOpen = ref(false)
const narratorOpen = ref(false)
// Whether the narrator component is actually rendering (Dream workspaces only).
// When false we don't reserve the circle footprint on the right.
const narratorRendered = ref(false)

// ── Shared geometry ──────────────────────────────────────────────────────────
// app.vue is the single writer of these. Components read them; they never set
// their own width against a sibling.
//
//  --sheet-w        left sidebar width (md+), 0 when closed
//  --narrator-w     right sidebar width when narrator is OPEN, 0 when collapsed
//  --narrator-circle the collapsed circle footprint (always reserved on the
//                    right so toggles/footer never sit under the avatar)
//  --hand-h         footer height; 0 when neither footer region is open

const SHEET_W_MD = '20rem'
const SHEET_W_XL = '24rem'
const NARRATOR_W = '22rem'
const NARRATOR_W_XL = '24rem'
const NARRATOR_CIRCLE = '4.5rem'
const HAND_H = '11.5rem'

// The collapsed-circle footprint reserved on the right. Zero when the narrator
// isn't rendering (non-Dream pages) so the footer/toggles reach the corner.
const narratorCircle = computed(() =>
  narratorRendered.value ? NARRATOR_CIRCLE : '0px',
)

const sheetWidth = computed(() => {
  if (!workspaceSheetOpen.value || !isMd.value) return '0px'
  return isXl.value ? SHEET_W_XL : SHEET_W_MD
})

const narratorWidth = computed(() => {
  if (!narratorOpen.value) return '0px'
  return isXl.value ? NARRATOR_W_XL : NARRATOR_W
})

const narratorRailWidth = computed(() => {
  if (!narratorRendered.value) return '0px'
  return narratorOpen.value
    ? 'min(100%, var(--narrator-w))'
    : 'var(--narrator-circle)'
})

const footerOpen = computed(() => handOpen.value || narratorChatOpen.value)

const handHeight = computed(() => (footerOpen.value ? HAND_H : '0px'))

// Root vars consumed by main padding + sidebars.
const shellVars = computed<CSSProperties>(() => {
  return {
    '--sheet-w': sheetWidth.value,
    '--narrator-w': narratorWidth.value,
    '--narrator-circle': narratorCircle.value,
    '--hand-h': handHeight.value,
  } as CSSProperties
})

// Footer slot spans between the sheet and the narrator rail. We reserve the
// collapsed circle on the right even when the narrator panel is closed, so the
// footer never tucks under the avatar.
const footerVars = computed<CSSProperties>(() => {
  const right = narratorOpen.value
    ? 'var(--narrator-w)'
    : 'var(--narrator-circle)'

  return {
    left: 'var(--sheet-w)',
    right,
    height: 'var(--hand-h)',
  } as CSSProperties
})

// ── Toggles ──────────────────────────────────────────────────────────────────
// Below xl, the two footer regions are mutually exclusive. At xl they coexist.

function toggleHand(): void {
  const next = !handOpen.value
  handOpen.value = next
  if (next && !isXl.value) narratorChatOpen.value = false
}

function toggleNarratorChat(): void {
  if (!narratorRendered.value) return

  const next = !narratorChatOpen.value
  narratorChatOpen.value = next
  if (next && !isXl.value) handOpen.value = false
}

function setNarratorChatOpen(value: boolean): void {
  narratorChatOpen.value = narratorRendered.value ? value : false
}

// Right sidebar. Opening it on small screens reclaims width that would crush
// the footer, so below xl we close any open footer chat to avoid a sliver.
function setNarratorOpen(value: boolean): void {
  narratorOpen.value = value
  if (value && !isXl.value) narratorChatOpen.value = false
}

function setNarratorRendered(value: boolean): void {
  narratorRendered.value = value
  // If the narrator stops rendering while open, release its width and controls.
  if (!value) {
    narratorOpen.value = false
    narratorChatOpen.value = false
  }
}

function setWorkspaceSheetOpen(value: boolean): void {
  navStore.setWorkspaceSheetOpen(value)
}

// ── Meta ─────────────────────────────────────────────────────────────────────
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

  // At xl the hand can default open; below xl it stays hidden until toggled.
  if (isXl.value) handOpen.value = true

  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null
  }, 8000)
})

onBeforeUnmount(() => {
  mdMedia?.removeEventListener('change', syncBreakpoints)
  xlMedia?.removeEventListener('change', syncBreakpoints)
})
</script>

<style scoped>
/* Main content reflows around all three regions. Sheet padding only applies
   from md (below md the sheet is a full-width overlay). */
.kr-main {
  padding-right: max(var(--narrator-w), var(--narrator-circle));
  padding-bottom: var(--hand-h);
}

@media (min-width: 768px) {
  .kr-main {
    padding-left: var(--sheet-w);
  }
}

/* Sheet slide (from the left) */
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

/* Hand slide (from the bottom) */
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

/* Chat slide (from the right) */
.kr-chat-slide-enter-active,
.kr-chat-slide-leave-active {
  transition:
    opacity 240ms ease,
    transform 240ms ease;
}

.kr-chat-slide-enter-from,
.kr-chat-slide-leave-to {
  opacity: 0;
  transform: translateY(1rem) translateX(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .kr-sheet-slide-enter-active,
  .kr-sheet-slide-leave-active,
  .kr-hand-slide-enter-active,
  .kr-hand-slide-leave-active,
  .kr-chat-slide-enter-active,
  .kr-chat-slide-leave-active {
    transition: none;
  }
}
</style>
