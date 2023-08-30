<template>
  <div class="art-frame" :class="{ dragging: dragging }">
    <img
      :src="src"
      alt="Art asset"
      :style="{ transform: dragging ? 'scale(1.2)' : 'none' }"
      @mousedown="startDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  src: {
    type: String,
    default: '/images/backtree.webp'
  }
})

let dragging = ref(false)

const startDrag = () => {
  dragging.value = true
}

const stopDrag = () => {
  dragging.value = false
}
</script>

<style scoped>
.art-frame.dragging {
  cursor: move;
}

img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.3s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
