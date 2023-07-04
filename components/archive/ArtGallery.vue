<template>
  <div id="art-container">
    <input v-model="artSize" type="range" min="5" max="40" />
    <div v-for="art in arts" :key="art.id" :ref="(el) => initInteract(el)" class="art-asset">
      <div :style="{ transform: `scale(${artSize / 10})` }">
        <ArtAsset :src="art.src" :size="100" />
      </div>
    </div>
  </div>
</template>

<script setup>
import interact from 'interactjs'

const artSize = ref(10)

const arts = ref([
  { id: 1, src: '/images/flower/flower1.png' },
  { id: 2, src: '/images/flower/flower2.png' }
  // add more art assets here
])

const initInteract = (el) => {
  if (!el) return

  interact(el).draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    autoScroll: true,
    onmove: dragMoveListener,
    onstart: () => el.firstChild.classList.add('large'),
    onend: () => el.firstChild.classList.remove('large')
  })
}

function dragMoveListener(event) {
  let { x, y } = event.target.dataset

  x = (parseFloat(x) || 0) + event.dx
  y = (parseFloat(y) || 0) + event.dy

  event.target.style.transform = `translate(${x}px, ${y}px)`

  event.target.dataset.x = x
  event.target.dataset.y = y
}
</script>

<style scoped>
#art-container {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: auto;
}

.art-asset {
  position: absolute;
  touch-action: none;
  user-select: none;
  box-sizing: border-box;
  transform-origin: top left;
}
</style>
