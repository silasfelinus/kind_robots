<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader -->
    <KindLoader @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      class="w-full bg-base-200 flex justify-between items-center sticky top-0 z-30"
      :style="{ height: `${displayStore.headerVh}vh` }"
    >
      <!-- Sidebar Toggle -->
      <div class="absolute top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle
          class="text-4xl"
          @click="displayStore.toggleSidebar('sidebarLeft')"
        />
      </div>

      <!-- Navigation Links -->
      <NavLinks />
    </header>

    <!-- Main Layout -->
    <div class="flex-1 w-full flex">
      <!-- Sidebar (Left) without transitions and conditionally rendered -->
      <aside
        v-if="displayStore.sidebarLeft !== 'hidden'"
        class="bg-base-200 hide-scrollbar"
        :class="{
          'w-64': displayStore.sidebarLeft === 'open',
          'w-14': displayStore.sidebarLeft === 'compact',
          'w-0': displayStore.sidebarLeft === 'hidden'
        }"
        :style="{ maxHeight: `calc(100vh - ${displayStore.headerVh}vh)` }"
      >
        <kind-sidebar v-if="displayStore.sidebarLeft !== 'hidden'" />
      </aside>

      <!-- Main Content -->
      <main class="flex-grow overflow-y-auto">
        <div class="flex justify-center items-center">
          <div class="w-full max-w-4xl rounded-2xl p-1 bg-base-200">
            <nuxt-page />
          </div>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <footer
      v-if="displayStore.footer !== 'hidden'"
      :style="{ height: `${displayStore.footerVh}vh` }"
      class="w-full bg-gray-800 text-accent mt-auto flex-none"
    >
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup>
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
/* Sidebar */
aside {
  width: 0;
  background-color: var(--bg-base-200);
}

/* Scrollable area for the main content */
main {
  overflow-y: auto;
}

/* Hide scrollbar but allow scrolling */
.hide-scrollbar {
  overflow-y: auto;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
