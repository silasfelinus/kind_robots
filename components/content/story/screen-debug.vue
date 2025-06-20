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

    <!-- Fullscreen Debug Overlay -->
    <div
      v-if="isDebugVisible"
      class="fixed inset-0 z-[999] bg-black/80 text-white font-mono text-xs"
    >
      <!-- Header Box -->
      <div :style="headerStyle" class="absolute border border-white bg-white/10 flex items-center justify-center">
        Header ({{ headerHeight }}vh)
      </div>

      <!-- Footer Box -->
      <div :style="footerStyle" class="absolute border border-white bg-white/10 flex items-center justify-center">
        Footer ({{ footerHeight }}vh)
      </div>

      <!-- Left Sidebar -->
      <div :style="leftSidebarStyle" class="absolute border border-cyan-400 bg-cyan-400/10 flex items-center justify-center text-cyan-200">
        Left Sidebar ({{ sidebarLeftWidth }}vw)
      </div>

      <!-- Right Sidebar -->
      <div :style="rightSidebarStyle" class="absolute border border-pink-400 bg-pink-400/10 flex items-center justify-center text-pink-200">
        Right Sidebar ({{ sidebarRightWidth }}vw)
      </div>

      <!-- Main Content Area -->
      <div :style="mainContentStyle" class="absolute border border-yellow-300 bg-yellow-300/10 flex items-center justify-center text-yellow-200 text-center">
        Main Content ({{ mainContentHeight }}vh x {{ mainContentWidth }}vw)
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
  zIndex: 1001,
}))

const footerStyle = computed(() => ({
  bottom: `calc(var(--vh) * ${displayStore.sectionPaddingSize.value})`,
  left: `${displayStore.sectionPaddingSize.value}vw`,
  width: `calc(100vw - ${displayStore.sectionPaddingSize.value * 2}vw)`,
  height: `calc(var(--vh) * ${displayStore.footerHeight.value})`,
  zIndex: 1001,
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

const headerHeight = computed(() => displayStore.headerHeight.value)
const footerHeight = computed(() => displayStore.footerHeight.value)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth.value)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth.value)
const mainContentHeight = computed(() => displayStore.mainContentHeight.value)
const mainContentWidth = computed(() => displayStore.mainContentWidth.value)
</script>
