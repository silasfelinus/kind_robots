<template>
  <div ref="card" class="grab-card draggable">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import interact from '@interactjs/interact'
import type { InteractEvent } from '@interactjs/types'

// Define the card element reference
const card = ref<HTMLElement | null>(null)

onMounted(() => {
  const position = { x: 0, y: 0 }

  if (card.value) {
    interact(card.value).draggable({
      listeners: {
        start(event: InteractEvent) {
          console.log(event.type, event.target)
        },
        move(event: InteractEvent) {
          position.x += event.dx
          position.y += event.dy

          event.target.style.transform = `translate(${position.x}px, ${position.y}px)`
        },
      },
    })
  }
})
</script>

<style scoped>
.grab-card {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  padding: 20px;
  margin: 1rem;
  background-color: white;
  touch-action: none;
  box-sizing: border-box;
}
</style>
