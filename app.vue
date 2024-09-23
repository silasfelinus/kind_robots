<template>
  <div class="main-layout">
    <!-- Header Overlay -->
    <header
      class="header-overlay"
      :style="{ height: displayStore.headerVh + 'vh' }"
    >
      <p>Header</p>
    </header>

    <div class="content-area">
      <!-- Left Sidebar Overlay -->
      <aside
        v-if="displayStore.sidebarLeft === 'open'"
        class="sidebar-left-overlay"
        :style="{ width: displayStore.sidebarVw + 'vw' }"
      >
        <p>Left Sidebar</p>
      </aside>

      <!-- Main Content with Flip Card -->
      <main class="main-content-overlay">
        <div class="flip-card" @click="flipped = !flipped">
          <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
            <card-front key="front" class="flip-card-front" :bot="currentBot" />
            <card-back key="back" class="flip-card-back" :bot="currentBot" />
          </div>
        </div>
      </main>

      <!-- Right Sidebar Overlay -->
      <aside
        v-if="displayStore.sidebarRight === 'open'"
        class="sidebar-right-overlay"
        :style="{ width: displayStore.sidebarVw + 'vw' }"
      >
        <p>Right Sidebar</p>
      </aside>
    </div>

    <!-- Footer Overlay -->
    <footer
      class="footer-overlay"
      :style="{ height: displayStore.footerVh + 'vh' }"
    >
      <p>Footer</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { useBotStore } from '../../../stores/botStore'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// Initialize stores
const displayStore = useDisplayStore()
const botsStore = useBotStore()

// Flip card state
const currentBot = computed(() => botsStore.currentBot)
const flipped = ref(false)

// Set up viewport watcher
onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.content-area {
  display: flex;
  flex: 1;
}

.header-overlay {
  background-color: rgba(0, 128, 255, 0.5); /* Light Blue */
  text-align: center;
  color: white;
}

.sidebar-left-overlay,
.sidebar-right-overlay {
  background-color: rgba(255, 165, 0, 0.5); /* Light Orange */
  text-align: center;
  color: white;
  padding: 1rem;
}

.main-content-overlay {
  flex: 1;
  background-color: rgba(144, 238, 144, 0.5); /* Light Green */
  text-align: center;
  color: white;
  padding: 1rem;
}

.footer-overlay {
  background-color: rgba(255, 69, 0, 0.5); /* Light Red */
  text-align: center;
  color: white;
}

/* Flip Card Styles */
.flip-card {
  perspective: 1000px;
  width: 100%;
  max-width: 300px; /* Ensures flip card remains responsive */
  height: 100%;
  max-height: 500px;
  margin: auto; /* Centering the flip card */
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border: 2px solid var(--bg-base);
  border-radius: 5px;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
