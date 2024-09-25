<template>
  <div class="main-layout absolute inset-0 pointer-events-none">
    <!-- Unified layout and debug overlay -->
    <header
      class="header-overlay debug-box pointer-events-none"
      :class="{ 'debug-active': displayStore.showInfo }"
      :style="{ height: displayStore.headerVh + 'vh' }"
    >
      <p>Header</p>
      <p v-if="displayStore.showInfo">
        Header VH: {{ displayStore.headerVh }}vh
      </p>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div class="content-area">
      <aside
        class="sidebar-left-overlay debug-box pointer-events-none"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="{
          width: displayStore.sidebarLeftVw + 'vw',
          height: displayStore.mainVh + 'vh',
        }"
      >
        <p>Left Sidebar</p>
        <p v-if="displayStore.showInfo">
          Sidebar VW: {{ displayStore.sidebarLeftVw }}vw
        </p>
        <p v-if="displayStore.showInfo">
          Sidebar VH: {{ displayStore.mainVh }}vh
        </p>
      </aside>

      <main
        class="main-content-overlay debug-box pointer-events-none"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="{
          height: displayStore.mainVh + 'vh',
          width: displayStore.mainVw + 'vw',
        }"
      >
        <p>Main Content</p>
        <p v-if="displayStore.showInfo">
          Main Content VH: {{ displayStore.mainVh }}vh
        </p>
        <p v-if="displayStore.showInfo">
          Main Content VW: {{ displayStore.mainVw }}vw
        </p>
      </main>

      <aside
        class="sidebar-right-overlay debug-box pointer-events-none"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="{
          width: displayStore.sidebarRightVw + 'vw',
          height: displayStore.mainVh + 'vh',
        }"
      >
        <p>Right Sidebar</p>
        <p v-if="displayStore.showInfo">
          Right Sidebar VW: {{ displayStore.sidebarRightVw }}vw
        </p>
        <p v-if="displayStore.showInfo">
          Right Sidebar VH: {{ displayStore.mainVh }}vh
        </p>
      </aside>
    </div>

    <footer
      class="footer-overlay debug-box pointer-events-none"
      :class="{ 'debug-active': displayStore.showInfo }"
      :style="{ height: displayStore.footerVh + 'vh' }"
    >
      <p>Footer</p>
      <p v-if="displayStore.showInfo">
        Footer VH: {{ displayStore.footerVh }}vh
      </p>
    </footer>

    <!-- Tick Overlay for every 20vh/20vw -->
    <div class="tick-overlay pointer-events-none"></div>

    <!-- Debug Toggle Button -->
    <button class="debug-toggle pointer-events-auto" @click="toggleDebugMode">
      {{ displayStore.showInfo ? 'Hide Debug Info' : 'Show Debug Info' }}
    </button>

    <!-- Info Sheet Toggle -->
    <button
      v-if="displayStore.showInfo"
      class="info-toggle pointer-events-auto"
      @click="toggleInfoSheet"
    >
      Toggle Info Sheet
    </button>

    <!-- Info Sheet Display -->
    <div
      v-if="displayStore.showInfoSheet && displayStore.showInfo"
      class="info-sheet pointer-events-auto"
    >
      <p>Header VH: {{ displayStore.headerVh }}vh</p>
      <p>Sidebar Left VW: {{ displayStore.sidebarLeftVw }}vw</p>
      <p>Sidebar Left VH: {{ displayStore.mainVh }}vh</p>
      <p>Sidebar Right VW: {{ displayStore.sidebarRightVw }}vw</p>
      <p>Sidebar Right VH: {{ displayStore.mainVh }}vh</p>
      <p>Main Content VH: {{ displayStore.mainVh }}vh</p>
      <p>Main Content VW: {{ displayStore.mainVw }}vw</p>
      <p>Footer VH: {{ displayStore.footerVh }}vh</p>
      <p>Viewport: {{ displayStore.viewportSize }}</p>
      <p>Touch Device: {{ displayStore.isTouchDevice ? 'Yes' : 'No' }}</p>
      <p>Vertical Layout: {{ displayStore.isVertical ? 'Yes' : 'No' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { onMounted, onBeforeUnmount } from 'vue'

const displayStore = useDisplayStore()

const toggleDebugMode = () => {
  displayStore.showInfo = !displayStore.showInfo
}

const toggleInfoSheet = () => {
  displayStore.showInfoSheet = !displayStore.showInfoSheet
}

const handleKeyPress = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  const isInteractiveElement =
    ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

  if (!isInteractiveElement && (event.key === 'd' || event.key === 'D')) {
    toggleDebugMode()
  }
}

onMounted(() => {
  displayStore.initializeViewportWatcher()
  window.addEventListener('keydown', handleKeyPress)
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

.content-area {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 100%;
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  background-color: rgba(0, 128, 255, 0.3); /* Transparent light blue */
  text-align: center;
  color: white;
  padding: 0; /* No padding */
}

.debug-box {
  border: none;
}

.debug-active {
  border: 2px dashed rgba(255, 255, 255, 0.8);
  background-color: rgba(
    0,
    0,
    0,
    0.1
  ); /* Transparent highlight during debug mode */
}

.tick-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.5) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 20vw 20vh;
  pointer-events: none;
}

.debug-toggle {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.info-toggle {
  position: absolute;
  bottom: 60px;
  right: 20px;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.info-sheet {
  position: absolute;
  bottom: 100px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 20px;
  border-radius: 10px;
  font-size: 1rem;
  z-index: 1000;
}
</style>
