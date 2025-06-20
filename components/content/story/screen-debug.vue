<template>
    <!-- Floating Toggle Button -->
    <div class="fixed top-4 right-4 z-[1000] pointer-events-auto">
      <button
        class="bg-gray-800 text-white p-2 rounded-full shadow-md"
        @click="toggleDebug"
      >
        {{ isDebugVisible ? '❌' : '🛠️' }}
      </button>
    </div>

    <!-- Fullscreen Overlay -->
    <div
      v-if="isDebugVisible"
      class="fixed inset-0 z-[999] bg-black/80 text-white font-mono text-xs"
    >
      <!-- Layout Region Boxes -->
      <div :style="headerStyle" class="absolute border border-white bg-white/10 flex items-center justify-center z-[1001]">
        Header ({{ headerHeight }}vh)
      </div>

      <div :style="footerStyle" class="absolute border border-white bg-white/10 flex items-center justify-center z-[1001]">
        Footer ({{ footerHeight }}vh)
      </div>

      <div :style="leftSidebarStyle" class="absolute border border-cyan-400 bg-cyan-400/10 flex items-center justify-center text-cyan-200 z-[1001]">
        Left Sidebar ({{ sidebarLeftWidth }}vw)
      </div>

      <div :style="rightSidebarStyle" class="absolute border border-pink-400 bg-pink-400/10 flex items-center justify-center text-pink-200 z-[1001]">
        Right Sidebar ({{ sidebarRightWidth }}vw)
      </div>

      <div :style="mainContentStyle" class="absolute border border-yellow-300 bg-yellow-300/10 flex items-center justify-center text-yellow-200 text-center z-[1001]">
        Main Content ({{ mainContentHeight }}vh × {{ mainContentWidth }}vw)
      </div>

      <!-- Debug Readout Panel -->
      <div class="fixed bottom-4 left-4 bg-base-100 text-base-content p-4 rounded-xl shadow-xl w-[90vw] max-w-2xl max-h-[40vh] overflow-y-auto text-xs z-[1002] space-y-2">
        <div class="font-bold text-lg mb-1">🧪 Display Store Debug</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 leading-relaxed">
          <div><strong>Header:</strong> {{ headerHeight }}vh</div>
          <div><strong>Footer:</strong> {{ footerHeight }}vh</div>
          <div><strong>Padding:</strong> {{ sectionPadding }}vw</div>
          <div><strong>Main Height:</strong> {{ mainContentHeight }}vh</div>
          <div><strong>Main Width:</strong> {{ mainContentWidth }}vw</div>
          <div><strong>Left Sidebar:</strong> {{ sidebarLeftWidth }}vw</div>
          <div><strong>Right Sidebar:</strong> {{ sidebarRightWidth }}vw</div>
          <div><strong>Viewport:</strong> {{ viewportSize }}</div>
          <div><strong>Touch Device:</strong> {{ isTouchDevice }}</div>
          <div><strong>Fullscreen:</strong> {{ fullscreenState }}</div>
          <div><strong>Flip:</strong> {{ flipState }}</div>
          <div><strong>Big Mode:</strong> {{ bigMode }}</div>
          <div><strong>Animating:</strong> {{ isAnimating }}</div>
          <div><strong>Animation:</strong> {{ currentAnimation }}</div>
          <div><strong>Display Mode:</strong> {{ displayMode }}</div>
          <div><strong>Display Action:</strong> {{ displayAction }}</div>
          <div><strong>Main Component:</strong> {{ mainComponent }}</div>
        </div>
      </div>
    </div>
 
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const isDebugVisible = ref(false)
const toggleDebug = () => (isDebugVisible.value = !isDebugVisible.value)

const headerStyle = computed(() => ({
  top: `calc(var(--vh) * ${displayStore.sectionPaddingSize.value})`,
  left: `${displayStore.sectionPaddingSize.value}vw`,
  width: `calc(100vw - ${displayStore.sectionPaddingSize.value * 2}vw)`,
  height: `calc(var(--vh) * ${displayStore.headerHeight.value})`,
}))

const footerStyle = computed(() => ({
  bottom: `calc(var(--vh) * ${displayStore.sectionPaddingSize.value})`,
  left: `${displayStore.sectionPaddingSize.value}vw`,
  width: `calc(100vw - ${displayStore.sectionPaddingSize.value * 2}vw)`,
  height: `calc(var(--vh) * ${displayStore.footerHeight.value})`,
}))

const leftSidebarStyle = computed(() => ({
  top: `calc(var(--vh) * (${displayStore.headerHeight.value} + ${displayStore.sectionPaddingSize.value * 2}))`,
  left: `${displayStore.sectionPaddingSize.value}vw`,
  width: `${displayStore.sidebarLeftWidth.value}vw`,
  height: `calc(var(--vh) * ${displayStore.mainContentHeight.value})`,
}))

const rightSidebarStyle = computed(() => ({
  top: `calc(var(--vh) * (${displayStore.headerHeight.value} + ${displayStore.sectionPaddingSize.value * 2}))`,
  right: `${displayStore.sectionPaddingSize.value}vw`,
  width: `${displayStore.sidebarRightWidth.value}vw`,
  height: `calc(var(--vh) * ${displayStore.mainContentHeight.value})`,
}))

const mainContentStyle = computed(() => ({
  top: `calc(var(--vh) * (${displayStore.headerHeight.value} + ${displayStore.sectionPaddingSize.value * 2}))`,
  left: `${displayStore.sectionPaddingSize.value}vw`,
  width: `calc(${displayStore.mainContentWidth.value}vw)`,
  height: `calc(var(--vh) * ${displayStore.mainContentHeight.value})`,
}))

// Individual Value Bindings
const headerHeight = computed(() => displayStore.headerHeight.value)
const footerHeight = computed(() => displayStore.footerHeight.value)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth.value)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth.value)
const mainContentHeight = computed(() => displayStore.mainContentHeight.value)
const mainContentWidth = computed(() => displayStore.mainContentWidth.value)
const sectionPadding = computed(() => displayStore.sectionPaddingSize.value)

const viewportSize = computed(() => displayStore.viewportSize)
const isTouchDevice = computed(() => displayStore.isTouchDevice)
const fullscreenState = computed(() => displayStore.fullscreenState)
const isAnimating = computed(() => displayStore.isAnimating)
const currentAnimation = computed(() => displayStore.currentAnimation)
const flipState = computed(() => displayStore.flipState)
const bigMode = computed(() => displayStore.bigMode)
const displayMode = computed(() => displayStore.displayMode)
const displayAction = computed(() => displayStore.displayAction)
const mainComponent = computed(() => displayStore.mainComponent)
</script>
