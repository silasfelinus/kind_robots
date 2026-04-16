<!-- /components/content/utils/screen-debug.vue -->
<template>
  <!-- Toggle button — admins only -->
  <div
    v-if="isAdmin"
    style="position: fixed; top: 1rem; right: 1rem; z-index: 50"
    class="pointer-events-auto"
  >
    <button
      class="bg-base-300 text-base-content p-2 rounded-full shadow-md text-sm"
      @click="toggleDebug"
    >
      {{ isDebugVisible ? '❌' : '🛠️' }}
    </button>
  </div>

  <!-- Full-screen overlay: pointer-events:none so it never blocks the layout -->
  <div
    v-if="isDebugVisible"
    style="position: fixed; inset: 0; z-index: 50; pointer-events: none"
    class="bg-black/70 font-mono text-xs text-white"
  >
    <!-- Region outlines — all always rendered (regions never disappear) -->
    <div
      :style="displayStore.headerStyle"
      class="absolute flex items-center justify-center border-2 border-white bg-white/10"
    >
      Header · {{ headerHeight }}vh · {{ displayStore.headerState }}
    </div>

    <div
      :style="displayStore.footerStyle"
      class="absolute flex items-center justify-center border-2 border-white bg-white/10"
    >
      Footer · {{ footerHeight }}vh · {{ displayStore.footerState }}
    </div>

    <div
      :style="displayStore.leftSidebarStyle"
      class="absolute flex items-center justify-center border-2 border-cyan-400 bg-cyan-400/10 text-cyan-200"
    >
      Left · {{ sidebarLeftWidth }}vw · {{ displayStore.sidebarLeftState }}
    </div>

    <div
      :style="displayStore.rightSidebarStyle"
      class="absolute flex items-center justify-center border-2 border-pink-400 bg-pink-400/10 text-pink-200"
    >
      Right · {{ sidebarRightWidth }}vw · {{ displayStore.sidebarRightState }}
    </div>

    <div
      :style="displayStore.mainContentStyle"
      class="absolute flex items-center justify-center border-2 border-yellow-300 bg-yellow-300/10 text-yellow-200 text-center"
    >
      Center · {{ mainContentHeight }}vh × {{ mainContentWidth }}vw
    </div>

    <!-- Debug readout — pointer-events:auto so it's scrollable -->
    <div
      style="
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        z-index: 410;
        pointer-events: auto;
      "
      class="bg-base-100 text-base-content p-4 rounded-xl shadow-xl w-[90vw] max-w-2xl max-h-[40vh] overflow-y-auto space-y-2"
    >
      <div class="font-bold text-base mb-1">🧪 Display Store Debug</div>

      <div
        class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 leading-relaxed"
      >
        <div>
          <strong>Header:</strong> {{ displayStore.headerState }} ·
          {{ headerHeight }}vh
        </div>
        <div>
          <strong>Footer:</strong> {{ displayStore.footerState }} ·
          {{ footerHeight }}vh
        </div>
        <div>
          <strong>Left:</strong> {{ displayStore.sidebarLeftState }} ·
          {{ sidebarLeftWidth }}vw
        </div>
        <div>
          <strong>Right:</strong> {{ displayStore.sidebarRightState }} ·
          {{ sidebarRightWidth }}vw
        </div>
        <div>
          <strong>L ↑H priority:</strong>
          {{ displayStore.sidebarLeftHeaderPriority }}
        </div>
        <div>
          <strong>L ↓F priority:</strong>
          {{ displayStore.sidebarLeftFooterPriority }}
        </div>
        <div>
          <strong>R ↑H priority:</strong>
          {{ displayStore.sidebarRightHeaderPriority }}
        </div>
        <div>
          <strong>R ↓F priority:</strong>
          {{ displayStore.sidebarRightFooterPriority }}
        </div>
        <div><strong>Padding:</strong> {{ sectionPadding }}vh</div>
        <div><strong>Center H:</strong> {{ mainContentHeight }}vh</div>
        <div><strong>Center W:</strong> {{ mainContentWidth }}vw</div>
        <div><strong>Viewport:</strong> {{ displayStore.viewportSize }}</div>
        <div><strong>Touch:</strong> {{ displayStore.isTouchDevice }}</div>
        <div><strong>--vh:</strong> {{ vhValue }}</div>
        <div><strong>Big Mode:</strong> {{ displayStore.bigMode }}</div>
        <div>
          <strong>Fullscreen:</strong> {{ displayStore.fullscreenState }}
        </div>
        <div><strong>Animating:</strong> {{ displayStore.isAnimating }}</div>
        <div><strong>Mode:</strong> {{ displayStore.displayMode }}</div>
        <div><strong>Action:</strong> {{ displayStore.displayAction }}</div>
      </div>

      <details class="mt-2">
        <summary class="cursor-pointer font-bold text-sm">
          🧾 Raw styles
        </summary>
        <pre
          class="whitespace-pre-wrap mt-2 text-[0.6rem] leading-relaxed opacity-80"
        >
headerStyle:       {{ fmt(displayStore.headerStyle) }}
footerStyle:       {{ fmt(displayStore.footerStyle) }}
leftSidebarStyle:  {{ fmt(displayStore.leftSidebarStyle) }}
rightSidebarStyle: {{ fmt(displayStore.rightSidebarStyle) }}
mainContentStyle:  {{ fmt(displayStore.mainContentStyle) }}
        </pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/utils/screen-debug.vue
import { computed, ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'
import type { CSSProperties } from 'vue'

const displayStore = useDisplayStore()
const userStore = useUserStore()

const isDebugVisible = ref(false)
const toggleDebug = () => (isDebugVisible.value = !isDebugVisible.value)
const isAdmin = computed(() => userStore.isAdmin === true)

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainContentHeight = computed(() => displayStore.mainContentHeight)
const mainContentWidth = computed(() => displayStore.mainContentWidth)
const sectionPadding = computed(() => displayStore.sectionPaddingSize)

const vhValue = ref('unset')
onMounted(() => {
  vhValue.value =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--vh')
      .trim() || 'unset'
})

function fmt(style: CSSProperties): string {
  return Object.entries(style)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
}
</script>
