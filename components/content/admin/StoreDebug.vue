<template>
  <div class="main-layout absolute inset-0">
    <!-- Header -->
    <header
      class="header-overlay"
      :style="{ height: displayStore.headerVh + 'vh' }"
    >
      <p>Header</p>
    </header>

    <!-- Main content area with sidebars -->
    <div class="content-area">
      <!-- Left Sidebar -->
      <aside
        class="sidebar-left-overlay"
        :style="{
          width: displayStore.sidebarLeftVw + 'vw',
          height: displayStore.mainVh + 'vh',
        }"
      >
        <p>Left Sidebar</p>
      </aside>

      <!-- Main Content -->
      <main
        class="main-content-overlay"
        :style="{ height: displayStore.mainVh + 'vh' }"
      >
        <p>Main Content</p>
      </main>

      <!-- Right Sidebar -->
      <aside
        class="sidebar-right-overlay"
        :style="{
          width: displayStore.sidebarRightVw + 'vw',
          height: displayStore.mainVh + 'vh',
        }"
      >
        <p>Right Sidebar</p>
      </aside>
    </div>

    <!-- Footer -->
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
import { onMounted, onBeforeUnmount } from 'vue'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto; /* Header, Main Content, Footer */
  height: 100vh;
  box-sizing: border-box; /* Ensure padding and borders don't overflow */
}

.content-area {
  display: grid;
  grid-template-columns: auto 1fr auto; /* Left Sidebar, Main Content, Right Sidebar */
  height: 100%;
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  background-color: rgba(0, 128, 255, 0.3); /* Transparent light blue */
  text-align: center;
  padding: 1rem;
}
</style>
