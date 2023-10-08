<template>
  <div ref="container" class="jellybean-container">
    <div
      v-for="(bean, index) in jellybeans"
      :key="index"
      class="jellybean"
      :style="{ backgroundColor: bean.color, transform: `translate(${bean.x}px, ${bean.y}px)` }"
      @mousedown="startDrag(index)"
      @mouseup="endDrag(index)"
    >
      <!-- Jellybean SVG path here -->
      <icon :name="jellybeanIcon" class="w-6 h-6 text-white" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const maxJellybeans = 10 // Maximum jellybeans

const jellybeans = ref<Array<{ color: string; x: number; y: number; isDragging: boolean }>>(
  Array.from({ length: maxJellybeans }, () => ({
    color: getRandomColor(),
    x: 0,
    y: 0,
    isDragging: false
  }))
)

const jellybeanIcon = 'fluent-emoji-high-contrast:beans' // Icon reference

for (let i = 0; i < maxJellybeans; i++) {
  jellybeans.value.push({
    color: getRandomColor(),
    x: 0,
    y: 0,
    isDragging: false
  })
}

// Helper function to get a random color
function getRandomColor() {
  // Generate a random hex color code
  return '#' + Math.floor(Math.random() * 16777215).toString(16)
}

// Function to start dragging a jellybean
function startDrag(index: number) {
  // Mark the jellybean as being dragged
  jellybeans.value[index].isDragging = true
}

// Function to end dragging a jellybean
function endDrag(index: number) {
  // Mark the jellybean as not being dragged
  jellybeans.value[index].isDragging = false
}

// Function to handle mousemove for dragging
window.addEventListener('mousemove', (event) => {
  jellybeans.value.forEach((bean, index) => {
    if (bean.isDragging) {
      // Update the jellybean's position while dragging
      bean.x += event.movementX
      bean.y += event.movementY
    }
  })
})
</script>

<style scoped>
.jellybean-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 300px;
}

.jellybean {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
}

.jellybean-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
}
</style>
