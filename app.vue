<template>
  <div class="main-layout absolute inset-0 pointer-events-none">
    <!-- Header -->
    <header
      class="header-overlay debug-box pointer-events-none"
      :style="{ height: '6vh' }"
    >
      <p>Header</p>
      <p>Header VH: 6vh</p>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div class="content-area">
      <aside
        class="sidebar-left-overlay debug-box pointer-events-none"
        :style="{ width: '19vw', height: '92vh' }"
      >
        <p>Left Sidebar</p>
        <p>Sidebar VW: 19vw</p>
        <p>Sidebar VH: 92vh</p>
      </aside>

      <main
        class="main-content-overlay debug-box pointer-events-none"
        :style="{ height: '92vh', width: '79vw' }"
      >
        <p>Main Content</p>
        <p>Main Content VH: 92vh</p>
        <p>Main Content VW: 79vw</p>
      </main>

      <aside
        class="sidebar-right-overlay debug-box pointer-events-none"
        :style="{ width: '2vw', height: '92vh' }"
      >
        <p>Right Sidebar</p>
        <p>Sidebar VW: 2vw</p>
        <p>Sidebar VH: 92vh</p>
      </aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay debug-box pointer-events-none"
      :style="{ height: '2vh' }"
    >
      <p>Footer</p>
      <p>Footer VH: 2vh</p>
    </footer>

    <!-- Tick Overlay for every 20vh/20vw -->
    <div class="tick-overlay pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
// No JavaScript logic required since we're using hardcoded values
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto; /* Header, Main Content, Footer */
  height: 100vh; /* Ensure the total height is always 100vh */
}

.content-area {
  display: grid;
  grid-template-columns: 19vw 79vw 2vw; /* Left Sidebar, Main Content, Right Sidebar */
  height: 92vh; /* Consistent height for main content area */
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  text-align: center;
  color: white;
}

.header-overlay {
  background-color: #ff6f61; /* Red for header */
}

.sidebar-left-overlay {
  background-color: #6fa8dc; /* Blue for left sidebar */
}

.main-content-overlay {
  background-color: #76dd71; /* Green for main content */
}

.sidebar-right-overlay {
  background-color: #f4d03f; /* Yellow for right sidebar */
}

.footer-overlay {
  background-color: #f39c12; /* Orange for footer */
}

.debug-box {
  border: 2px dashed rgba(255, 255, 255, 0.8); /* Visible debug border */
}

.tick-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 20vw 20vh;
  pointer-events: none;
}
</style>
