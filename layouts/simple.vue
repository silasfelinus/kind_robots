<template>
  <div>
    <home-link />
    <!-- Toggle Button -->
    <layout-selector />
    <login-window />

    <slot />
    <streaming-tooltip :tooltip="page.tooltip" />

    <!-- Footer -->
    <footer>
      <highlight-nav />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { page } = useContent()
</script>

<style scoped>
.chat-window.small {
  max-width: 300px;
  min-height: 100px;
}

.chat-window.large {
  max-width: 600px;
  min-height: 300px;
}

.chat-bubble {
  padding: 10px;
  border-radius: 10px;
  margin: 5px;
}

.sender {
  background-color: #f1f1f1;
}
</style>
