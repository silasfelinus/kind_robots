<template>
  <div ref="card" class="grab-card">
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import interact from '@interactjs/interact'

const card = ref(null)

onMounted(() => {
  interact(card.value)
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move(event) {
          let target = event.target
          let x = parseFloat(target.getAttribute('data-x')) || 0
          let y = parseFloat(target.getAttribute('data-y')) || 0

          target.style.width = event.rect.width + 'px'
          target.style.height = event.rect.height + 'px'

          x += event.deltaRect.left
          y += event.deltaRect.top

          target.style.transform = `translate(${x}px,${y}px)`

          target.setAttribute('data-x', x)
          target.setAttribute('data-y', y)
        }
      },
      modifiers: [
        interact.modifiers.restrictEdges({ outer: 'parent' }),
        interact.modifiers.restrictSize({ min: { width: 100, height: 50 } })
      ],
      inertia: true
    })
    .draggable({
      listeners: {
        move(event) {
          let target = event.target
          let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
          let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

          target.style.transform = `translate(${x}px,${y}px)`

          target.setAttribute('data-x', x)
          target.setAttribute('data-y', y)
        }
      },
      inertia: true,
      modifiers: [interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true })]
    })
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
