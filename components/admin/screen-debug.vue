<!-- /components/content/utils/screen-debug.vue -->
<template>
  <!-- Toggle Button (Admins only) -->
  <div v-if="isAdmin" class="fixed top-4 right-4 z-1000 pointer-events-auto">
    <button
      class="bg-gray-800 text-white p-2 rounded-full shadow-md"
      @click="toggleDebug"
    >
      {{ isDebugVisible ? '❌' : '🛠️' }}
    </button>
  </div>

  <!-- Overlay Debug Layer -->
  <div
    v-if="isDebugVisible"
    class="fixed inset-0 z-999 bg-black/80 text-white font-mono text-xs pointer-events-none"
  >
    <!-- Region outlines — use store styles directly -->
    <div
      v-if="displayStore.headerState !== 'hidden'"
      :style="displayStore.headerStyle"
      class="absolute border border-white bg-white/10 flex items-center justify-center z-1001"
    >
      Header ({{ headerHeight }}vh)
    </div>

    <div
      v-if="displayStore.footerState !== 'hidden'"
      :style="displayStore.footerStyle"
      class="absolute border border-white bg-white/10 flex items-center justify-center z-1001"
    >
      Footer ({{ footerHeight }}vh)
    </div>

    <div
      v-if="displayStore.leftSidebarVisible"
      :style="displayStore.leftSidebarStyle"
      class="absolute border border-cyan-400 bg-cyan-400/10 flex items-center justify-center text-cyan-200 z-1001"
    >
      Left ({{ sidebarLeftWidth }}vw)
    </div>

    <div
      v-if="displayStore.rightSidebarVisible"
      :style="displayStore.rightSidebarStyle"
      class="absolute border border-pink-400 bg-pink-400/10 flex items-center justify-center text-pink-200 z-1001"
    >
      Right ({{ sidebarRightWidth }}vw)
    </div>

    <div
      :style="displayStore.mainContentStyle"
      class="absolute border border-yellow-300 bg-yellow-300/10 flex items-center justify-center text-yellow-200 text-center z-1001"
    >
      Center ({{ mainContentHeight }}vh × {{ mainContentWidth }}vw)
    </div>

    <!-- Debug Readout (click-enabled) -->
    <div
      class="fixed bottom-4 left-4 bg-base-100 text-base-content p-4 rounded-xl shadow-xl w-[90vw] max-w-2xl max-h-[40vh] overflow-y-auto text-xs z-1002 space-y-2 pointer-events-auto"
    >
      <div class="font-bold text-lg mb-1">🧪 Display Store Debug</div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 leading-relaxed">
        <!-- States -->
        <div><strong>Header State:</strong> {{ displayStore.headerState }}</div>
        <div><strong>Footer State:</strong> {{ displayStore.footerState }}</div>
        <div>
          <strong>Left State:</strong> {{ displayStore.sidebarLeftState }}
        </div>
        <div>
          <strong>Right State:</strong> {{ displayStore.sidebarRightState }}
        </div>

        <!-- Priority booleans -->
        <div>
          <strong>L Header Priority:</strong>
          {{ displayStore.sidebarLeftHeaderPriority }}
        </div>
        <div>
          <strong>L Footer Priority:</strong>
          {{ displayStore.sidebarLeftFooterPriority }}
        </div>
        <div>
          <strong>R Header Priority:</strong>
          {{ displayStore.sidebarRightHeaderPriority }}
        </div>
        <div>
          <strong>R Footer Priority:</strong>
          {{ displayStore.sidebarRightFooterPriority }}
        </div>

        <!-- Dimensions -->
        <div><strong>Header:</strong> {{ headerHeight }}vh</div>
        <div><strong>Footer:</strong> {{ footerHeight }}vh</div>
        <div><strong>Padding:</strong> {{ sectionPadding }}vh</div>
        <div><strong>Main Height:</strong> {{ mainContentHeight }}vh</div>
        <div><strong>Main Width:</strong> {{ mainContentWidth }}vw</div>
        <div><strong>Left Width:</strong> {{ sidebarLeftWidth }}vw</div>
        <div><strong>Right Width:</strong> {{ sidebarRightWidth }}vw</div>

        <!-- Viewport / device -->
        <div><strong>Viewport:</strong> {{ displayStore.viewportSize }}</div>
        <div><strong>Touch:</strong> {{ displayStore.isTouchDevice }}</div>
        <div><strong>CSS --vh:</strong> {{ vhValue }}</div>

        <!-- App state -->
        <div>
          <strong>Fullscreen:</strong> {{ displayStore.fullscreenState }}
        </div>
        <div><strong>Big Mode:</strong> {{ displayStore.bigMode }}</div>
        <div><strong>Flip:</strong> {{ displayStore.flipState }}</div>
        <div><strong>Animating:</strong> {{ displayStore.isAnimating }}</div>
        <div>
          <strong>Animation:</strong> {{ displayStore.currentAnimation }}
        </div>
        <div><strong>Display Mode:</strong> {{ displayStore.displayMode }}</div>
        <div>
          <strong>Display Action:</strong> {{ displayStore.displayAction }}
        </div>
        <div>
          <strong>Main Component:</strong> {{ displayStore.mainComponent }}
        </div>
      </div>

      <details class="mt-3">
        <summary class="cursor-pointer font-bold text-sm">
          🧾 Computed Styles (click to expand)
        </summary>
        <pre class="whitespace-pre-wrap mt-2 text-[0.65rem] leading-relaxed">
<strong>headerStyle:</strong>
{{ fmt(displayStore.headerStyle) }}

<strong>footerStyle:</strong>
{{ fmt(displayStore.footerStyle) }}

<strong>leftSidebarStyle:</strong>
{{ fmt(displayStore.leftSidebarStyle) }}

<strong>rightSidebarStyle:</strong>
{{ fmt(displayStore.rightSidebarStyle) }}

<strong>mainContentStyle:</strong>
{{ fmt(displayStore.mainContentStyle) }}
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

// Flat computed refs for the readout grid — all from the store
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainContentHeight = computed(() => displayStore.mainContentHeight)
const mainContentWidth = computed(() => displayStore.mainContentWidth)
const sectionPadding = computed(() => displayStore.sectionPaddingSize)

const vhValue = ref('unset')
onMounted(() => {
  if (typeof window !== 'undefined') {
    vhValue.value =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--vh')
        .trim() || 'unset'
  }
})

// Pretty-print a CSSProperties object for the <pre> readout
function fmt(style: CSSProperties): string {
  return Object.entries(style)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')
}
</script>
