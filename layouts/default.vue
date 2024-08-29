<template>
  <div>
    <header-upgrade />
    <kind-sidebar />
    <div class="absolute bottom-0 center z-50 text-gray-200">Desktop</div>
    <main class="flex-grow rounded-2xl p-1 m-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import KindSidebar from './../components/content/navigation/KindSidebar.vue'
</script>

<style>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.content-container {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  overflow: hidden;
}

.kind-sidebar {
  flex-shrink: 0;
  overflow-y: scroll;
}

.main-content {
  flex-grow: 1;
  overflow-y: scroll;
}
</style>
