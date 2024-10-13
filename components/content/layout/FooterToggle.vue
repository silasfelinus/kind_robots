<template>
  <div class="relative z-50">
    <button
      class="footer-arc-button shadow-lg bg-accent hover:bg-secondary border-2 border-solid border-gray-300 text-lg text-white flex items-center justify-center"
      :style="buttonStyle"
      @click="toggleFooter"
    >
      <!-- Footer toggle character (▼ or ▲) -->
      <span class="toggle-character">{{ footerCharacter }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the button size dynamically
const buttonStyle = computed(() => {
  const iconSize = 6
  return {
    width: `${iconSize}vh`,
    height: `${iconSize}vh`,
  }
})

// Determine the footer character based on footer state
const footerCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▼' : '▲'
})

// Toggle the footer's open/closed state
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>

<style scoped>
.footer-arc-button {
  width: 50px;
  height: 50px;
  border-radius: 100% 0 0 0; /* Quarter arc effect for bottom-left corner */
  position: absolute;
  bottom: 0;
  left: 0;
  transform: translate(
    -25%,
    25%
  ); /* Adjusts the button slightly into the corner */
}

.toggle-character {
  font-size: 2rem; /* Matches the icon size you want */
  line-height: 1;
  display: inline-block;
}
</style>
