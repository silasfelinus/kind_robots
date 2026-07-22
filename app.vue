<!-- /app.vue -->
<template>
  <div
    class="kr-shell relative h-dvh min-h-dvh w-full overflow-hidden text-base-content"
    :class="showLoader ? 'bg-black' : 'bg-base-100'"
    :style="shellVars"
  >
    <div
      v-if="showBootCurtain && showLoader"
      class="kr-boot-curtain"
      aria-hidden="true"
    />

    <ClientOnly>
      <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-50">
        <kind-loader
          @covered="handleLoaderCovered"
          @pageReady="handlePageReady"
        />
      </div>
    </ClientOnly>

    <ClientOnly>
      <animation-layer />
      <butterfly-layer class="pointer-events-none fixed inset-0 z-60" />
      <fx-clear-all />
      <achievement-popup />
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

        <workspace-narrator
          class="pointer-events-none absolute inset-y-0 right-0 z-40 transition-[width] duration-300 ease-out"
          :style="{ width: narratorRailWidth }"
          :coexist="isXl"
          :open="narratorPanelOpen"
          :dock-visible="false"
          @update:open="setNarratorOpen"
          @update:rendered="setNarratorRendered"
        />
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
            <workspace-hand />
          </div>
        </Transition>
      </section>

      <div
        class="pointer-events-auto fixed bottom-3 right-3 z-60 flex items-end gap-2"
      >
        <Transition name="kr-dock-message">
          <article
            v-if="visibleDockMessage"
            class="kr-dock-message mb-1 rounded-2xl border border-primary/25 bg-base-100/95 px-3 py-2 text-sm shadow-2xl backdrop-blur"
          >
            <div class="flex items-start gap-2">
              <span
                v-if="visibleDockMessage.emoticon"
                class="mt-0.5 text-base leading-none"
                aria-hidden="true"
              >
                {{ visibleDockMessage.emoticon }}
              </span>

              <div class="min-w-0 flex-1">
                <p
                  class="text-[0.65rem] font-black uppercase tracking-wide text-primary/70"
                >
                  {{ visibleDockMessage.label }}
                </p>

                <p class="mt-1 line-clamp-2 leading-relaxed text-base-content/80">
                  {{ visibleDockMessage.message }}
                </p>
              </div>
            </div>
          </article>
        </Transition>

        <button
          type="button"
          class="kr-workspace-dock group relative shrink-0 overflow-hidden rounded-full border-2 border-primary/40 bg-base-300/95 shadow-2xl transition duration-200 hover:scale-105 hover:border-primary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="bottomDockLabel"
          :title="bottomDockLabel"
          :aria-expanded="narratorPanelOpen"
          @click="cycleBottomMode"
        >
          <div
            class="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur-xl transition group-hover:opacity-100"
          />

          <img
            v-if="narratorImage"
            :src="narratorImage"
            :alt="narratorName || 'Navigator'"
            class="relative h-full w-full object-cover"
            loading="lazy"
          />

          <span
            v-else
            class="relative flex h-full w-full items-center justify-center bg-primary/10 text-primary"
          >
            <Icon name="kind-icon:robot-color" class="h-8 w-8" />
          </span>

          <span
            v-if="currentEmotionRow?.emoticon"
            class="absolute -right-0.5 -top-0.5 rounded-full border border-base-300 bg-base-100 px-1 py-0.5 text-xs shadow"
            aria-hidden="true"
          >
            {{ currentEmotionRow.emoticon }}
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
import { useNarratorStore } from '@/stores/narratorStore'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const navStore = useNavStore()
const narratorStore = useNarratorStore()
const route = useRoute()

const { workspaceSheetOpen } = storeToRefs(navStore)
const {
  activeBubble,
  currentEmotionLabel,
  currentEmotionRow,
  narratorImage,
  narratorIntro,
  narratorName,
} = storeToRefs(narratorStore)

const showLoader = ref(true)
const showBootCurtain = ref(true)

let failsafeTimeoutId: ReturnType<typeof setTimeout> | null = null
let bootCurtainTimeoutId: ReturnType<typeof setTimeout> | null = null

function releaseBootCurtain(): void {
  if (!showBootCurtain.value) return

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      showBootCurtain.value = false
    })
  })
}

function handleLoaderCovered(): void {
  releaseBootCurtain()
}

function handlePageReady(): void {
  showBootCurtain.value = false
  showLoader.value = false

  if (failsafeTimeoutId) {
    clearTimeout(failsafeTimeoutId)
    failsafeTimeoutId = null
  }

  if (bootCurtainTimeoutId) {
    clearTimeout(bootCurtainTimeoutId)
    bootCurtainTimeoutId = null
  }
}

const isMd = ref(false)
const isXl = ref(false)

let mdMedia: MediaQueryList | null = null
let xlMedia: MediaQueryList | null = null

type BottomMode = 'narrator-compact' | 'narrator-open' | 'hand'
type DockMessage = {
  label: string
  message: string
  emoticon: string | null
}

const bottomMode = ref<BottomMode>('narrator-compact')
const narratorRendered = ref(false)
const dockMessage = ref<DockMessage | null>(null)

let dockMessageTimer: ReturnType<typeof setTimeout> | null = null

function syncBreakpoints(): void {
  if (mdMedia) isMd.value = mdMedia.matches
  if (xlMedia) isXl.value = xlMedia.matches
}

const handOpen = computed(() => bottomMode.value === 'hand')
const narratorPanelOpen = computed(() => bottomMode.value === 'narrator-open')

const SHEET_W_MD = '20rem'
const SHEET_W_XL = '24rem'
const NARRATOR_W = '22rem'
const NARRATOR_W_XL = '24rem'
const NARRATOR_CIRCLE_MD = '4.5rem'
const NARRATOR_CIRCLE_MOBILE = '5.25rem'
const HAND_PANEL_H = '11.5rem'

const narratorCircle = computed(() => {
  return isMd.value ? NARRATOR_CIRCLE_MD : NARRATOR_CIRCLE_MOBILE
})

const sheetWidth = computed(() => {
  if (!workspaceSheetOpen.value || !isMd.value) return '0px'

  return isXl.value ? SHEET_W_XL : SHEET_W_MD
})

const narratorWidth = computed(() => {
  if (!narratorPanelOpen.value) return '0px'
  if (!isMd.value) return '100vw'

  return isXl.value ? NARRATOR_W_XL : NARRATOR_W
})

const narratorRailWidth = computed(() => {
  if (!narratorRendered.value || !narratorPanelOpen.value) return '0px'

  return 'min(100%, var(--narrator-w))'
})

const narratorFooterReserve = computed(() => {
  if (!isMd.value) return '0px'

  return narratorPanelOpen.value ? 'var(--narrator-w)' : '0px'
})

const footerOpen = computed(() => handOpen.value)

const footerHeight = computed(() => {
  if (!footerOpen.value) return '0px'
  if (handOpen.value) return HAND_PANEL_H

  return '0px'
})

const shellVars = computed<CSSProperties>(() => {
  return {
    '--sheet-w': sheetWidth.value,
    '--narrator-w': narratorWidth.value,
    '--narrator-circle': narratorCircle.value,
    '--narrator-footer-reserve': narratorFooterReserve.value,
    '--footer-h': footerHeight.value,
    '--hand-panel-h': handOpen.value ? HAND_PANEL_H : '0px',
    '--footer-gap': '0px',
  } as CSSProperties
})

const footerVars = computed<CSSProperties>(() => {
  return {
    left: 'var(--sheet-w)',
    right: 'var(--narrator-footer-reserve)',
    height: 'var(--footer-h)',
  } as CSSProperties
})

const BOTTOM_MODES: BottomMode[] = [
  'narrator-compact',
  'narrator-open',
  'hand',
]

const bottomDockLabel = computed(() => {
  switch (bottomMode.value) {
    case 'narrator-open':
      return 'Navigator open — show cards'
    case 'hand':
      return 'Cards open — return to navigator dock'
    default:
      return 'Navigator docked — open navigator'
  }
})

const bottomDockActionIcon = computed(() => {
  switch (bottomMode.value) {
    case 'narrator-open':
      return 'kind-icon:card'
    case 'hand':
      return 'kind-icon:close'
    default:
      return 'kind-icon:message'
  }
})

const visibleDockMessage = computed(() => {
  return narratorPanelOpen.value ? null : dockMessage.value
})

function presentDockMessage(
  message: string | null | undefined,
  label: string | null | undefined,
  emoticon: string | null | undefined,
): void {
  const trimmed = message?.trim()
  if (!trimmed) return

  dockMessage.value = {
    label: label?.trim() || 'Navigator',
    message: trimmed,
    emoticon: emoticon || null,
  }

  if (dockMessageTimer) clearTimeout(dockMessageTimer)

  dockMessageTimer = setTimeout(() => {
    dockMessage.value = null
    dockMessageTimer = null
  }, 6500)
}

function cycleBottomMode(): void {
  const idx = BOTTOM_MODES.indexOf(bottomMode.value)
  bottomMode.value = BOTTOM_MODES[(idx + 1) % BOTTOM_MODES.length]!
}

function setNarratorOpen(value: boolean): void {
  if (value) {
    bottomMode.value = 'narrator-open'
  } else if (bottomMode.value === 'narrator-open') {
    bottomMode.value = 'narrator-compact'
  }
}

function setNarratorRendered(value: boolean): void {
  narratorRendered.value = value

  if (!value && bottomMode.value === 'narrator-open') {
    bottomMode.value = 'narrator-compact'
  }
}

function setWorkspaceSheetOpen(value: boolean): void {
  navStore.setWorkspaceSheetOpen(value)
}

watch(
  () => route.fullPath,
  (path) => {
    navStore.recordVisit(path)
  },
  { immediate: true },
)

watch(activeBubble, (message) => {
  presentDockMessage(
    message,
    currentEmotionLabel.value,
    currentEmotionRow.value?.emoticon,
  )
})

watch(
  () => currentEmotionRow.value?.message,
  (message, previousMessage) => {
    if (!message || message === previousMessage) return

    presentDockMessage(
      message,
      currentEmotionLabel.value,
      currentEmotionRow.value?.emoticon,
    )
  },
)

watch(
  narratorIntro,
  (message) => {
    if (!dockMessage.value) {
      presentDockMessage(message, 'Narrator', currentEmotionRow.value?.emoticon)
    }
  },
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
  bootCurtainTimeoutId = setTimeout(() => {
    showBootCurtain.value = false
    bootCurtainTimeoutId = null
  }, 1500)

  pageStore.initialize()
  await navStore.initialize()

  mdMedia = window.matchMedia('(min-width: 768px)')
  xlMedia = window.matchMedia('(min-width: 1280px)')

  syncBreakpoints()

  mdMedia.addEventListener('change', syncBreakpoints)
  xlMedia.addEventListener('change', syncBreakpoints)

  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null
  }, 8000)
})

onBeforeUnmount(() => {
  mdMedia?.removeEventListener('change', syncBreakpoints)
  xlMedia?.removeEventListener('change', syncBreakpoints)

  if (dockMessageTimer) {
    clearTimeout(dockMessageTimer)
    dockMessageTimer = null
  }

  if (bootCurtainTimeoutId) {
    clearTimeout(bootCurtainTimeoutId)
    bootCurtainTimeoutId = null
  }

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
  height: var(--narrator-circle);
  width: var(--narrator-circle);
}

.kr-dock-message {
  width: clamp(
    12rem,
    calc((100vw - var(--sheet-w, 0px)) / 2 - var(--narrator-circle) - 1rem),
    24rem
  );
  max-width: calc(100vw - var(--narrator-circle) - 2rem);
}

@media (min-width: 768px) {
  .kr-main {
    padding-left: var(--sheet-w);
    padding-right: var(--narrator-w);
  }
}

.kr-boot-curtain {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: #000;
  pointer-events: none;
  contain: layout paint style;
  transform: translateZ(0);
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
.kr-dock-message-enter-active,
.kr-dock-message-leave-active {
  transition:
    opacity 240ms ease,
    transform 240ms ease;
}

.kr-hand-slide-enter-from,
.kr-hand-slide-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

.kr-dock-message-enter-from,
.kr-dock-message-leave-to {
  opacity: 0;
  transform: translateX(0.75rem) translateY(0.25rem) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .kr-workspace-dock,
  .kr-hand-slide-enter-active,
  .kr-hand-slide-leave-active,
  .kr-dock-message-enter-active,
  .kr-dock-message-leave-active {
    transition: none;
  }
}
</style>
