<!-- /app.vue -->
<template>
  <div
    class="kr-shell relative h-dvh min-h-dvh w-full overflow-hidden text-base-content"
    :class="showLoader ? 'bg-black' : 'bg-base-100'"
    :style="shellVars"
  >
    <ClientOnly>
      <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-50">
        <kind-loader @pageReady="handlePageReady" />
      </div>
    </ClientOnly>

    <ClientOnly>
      
      <animation-layer />
<butterfly-layer class="pointer-events-none fixed inset-0 z-60" />
      <fx-clear-all />
      <milestone-popup />
    </ClientOnly>

    <section
      class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl p-3 sm:p-4"
    >
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
          class="pointer-events-none absolute inset-y-0 right-0 z-110 transition-[width] duration-300 ease-out"
          :style="{ width: narratorRailWidth }"
          :open="narratorOpen"
          :coexist="isXl"
          @update:open="setNarratorOpen"
          @update:rendered="setNarratorRendered"
        />
      </section>
    </section>

    <ClientOnly>
      <section
        class="kr-footer pointer-events-none fixed bottom-0 z-90 flex flex-col gap-2 px-2 sm:px-3 lg:flex-row lg:items-end"
        :style="footerVars"
      >
        <Transition name="kr-chat-slide">
          <div
            v-if="narratorRendered && narratorChatOpen"
            class="pointer-events-auto min-w-0 w-full lg:w-96 lg:max-w-[34vw]"
            :style="{ height: 'var(--narrator-chat-h)' }"
          >
            <narrator-chat compact @close="setNarratorChatOpen(false)" />
          </div>
        </Transition>

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
          aria-label="Toggle narrator musings"
          title="Toggle narrator musings"
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
const isLg = ref(false)
const isXl = ref(false)
let mdMedia: MediaQueryList | null = null
let lgMedia: MediaQueryList | null = null
let xlMedia: MediaQueryList | null = null

function syncBreakpoints(): void {
  if (mdMedia) isMd.value = mdMedia.matches
  if (lgMedia) isLg.value = lgMedia.matches
  if (xlMedia) isXl.value = xlMedia.matches
}

const handOpen = ref(false)
const narratorChatOpen = ref(false)
const narratorOpen = ref(false)
const narratorRendered = ref(false)

const SHEET_W_MD = '20rem'
const SHEET_W_XL = '24rem'
const NARRATOR_W = '22rem'
const NARRATOR_W_XL = '24rem'
const NARRATOR_CIRCLE_MD = '4.5rem'
const NARRATOR_CIRCLE_MOBILE = '5.25rem'
const HAND_PANEL_H = '11.5rem'
const NARRATOR_CHAT_H = '12rem'
const FOOTER_GAP = '0.5rem'

const narratorCircle = computed(() => {
  if (!narratorRendered.value) return '0px'
  return isMd.value ? NARRATOR_CIRCLE_MD : NARRATOR_CIRCLE_MOBILE
})

const sheetWidth = computed(() => {
  if (!workspaceSheetOpen.value || !isMd.value) return '0px'
  return isXl.value ? SHEET_W_XL : SHEET_W_MD
})

const narratorWidth = computed(() => {
  if (!narratorOpen.value) return '0px'
  if (!isMd.value) return '100vw'
  return isXl.value ? NARRATOR_W_XL : NARRATOR_W
})

const narratorRailWidth = computed(() => {
  if (!narratorRendered.value) return '0px'

  return narratorOpen.value
    ? 'min(100%, var(--narrator-w))'
    : 'var(--narrator-circle)'
})

const footerOpen = computed(() => handOpen.value || narratorChatOpen.value)

const footerHeight = computed(() => {
  if (!footerOpen.value) return '0px'

  if (handOpen.value && narratorChatOpen.value) {
    return isLg.value
      ? `max(${HAND_PANEL_H}, ${NARRATOR_CHAT_H})`
      : `calc(${HAND_PANEL_H} + ${NARRATOR_CHAT_H} + ${FOOTER_GAP})`
  }

  if (handOpen.value) return HAND_PANEL_H
  if (narratorChatOpen.value) return NARRATOR_CHAT_H

  return '0px'
})

const shellVars = computed<CSSProperties>(() => {
  return {
    '--sheet-w': sheetWidth.value,
    '--narrator-w': narratorWidth.value,
    '--narrator-circle': narratorCircle.value,
    '--footer-h': footerHeight.value,
    '--hand-panel-h': handOpen.value ? HAND_PANEL_H : '0px',
    '--narrator-chat-h': narratorChatOpen.value ? NARRATOR_CHAT_H : '0px',
    '--footer-gap': handOpen.value && narratorChatOpen.value ? FOOTER_GAP : '0px',
  } as CSSProperties
})

const footerVars = computed<CSSProperties>(() => {
  const right = !isMd.value
    ? '0px'
    : narratorOpen.value
      ? 'var(--narrator-w)'
      : 'var(--narrator-circle)'

  return {
    left: 'var(--sheet-w)',
    right,
    height: 'var(--footer-h)',
  } as CSSProperties
})

function toggleHand(): void {
  handOpen.value = !handOpen.value
}

function toggleNarratorChat(): void {
  if (!narratorRendered.value) return
  narratorChatOpen.value = !narratorChatOpen.value
}

function setNarratorChatOpen(value: boolean): void {
  narratorChatOpen.value = narratorRendered.value ? value : false
}

function setNarratorOpen(value: boolean): void {
  narratorOpen.value = value
}

function setNarratorRendered(value: boolean): void {
  narratorRendered.value = value

  if (!value) {
    narratorOpen.value = false
    narratorChatOpen.value = false
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
  pageStore.initialize()
  await navStore.initialize()

  mdMedia = window.matchMedia('(min-width: 768px)')
  lgMedia = window.matchMedia('(min-width: 1024px)')
  xlMedia = window.matchMedia('(min-width: 1280px)')
  syncBreakpoints()

  mdMedia.addEventListener('change', syncBreakpoints)
  lgMedia.addEventListener('change', syncBreakpoints)
  xlMedia.addEventListener('change', syncBreakpoints)

  if (isXl.value) handOpen.value = true

  failsafeTimeoutId = setTimeout(() => {
    showLoader.value = false
    failsafeTimeoutId = null
  }, 8000)
})

onBeforeUnmount(() => {
  mdMedia?.removeEventListener('change', syncBreakpoints)
  lgMedia?.removeEventListener('change', syncBreakpoints)
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
    padding-right: max(var(--narrator-w), var(--narrator-circle));
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