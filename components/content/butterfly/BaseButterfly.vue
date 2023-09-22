<script setup lang="ts">
import { ref } from 'vue'

export interface Butterfly {
  wingTopColor: string
  wingBottomColor: string
  wingSpeed: number
}

const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 50 + 50) // keep saturation between 50 and 100
  const l = Math.floor(Math.random() * 40 + 30) // keep lightness between 30 and 70
  return `hsl(${h},${s}%,${l}%)`
}

const butterfly = ref<Butterfly>({
  wingTopColor: randomColor(),
  wingBottomColor: randomColor(),
  wingSpeed: 0.3
})
</script>

<template>
  <div class="butterfly">
    <div class="left-wing">
      <div class="top" :style="{ background: butterfly.wingTopColor }"></div>
      <div class="bottom" :style="{ background: butterfly.wingBottomColor }"></div>
    </div>
    <div class="right-wing">
      <div class="top" :style="{ background: butterfly.wingTopColor }"></div>
      <div class="bottom" :style="{ background: butterfly.wingBottomColor }"></div>
    </div>
  </div>
</template>

<style scoped>
.butterfly {
  width: 100px;
  height: 100px;
  position: absolute;
  pointer-events: none;
}

.left-wing,
.right-wing {
  width: 24px;
  height: 42px;
  position: absolute;
  top: 10px;
  pointer-events: none;
}

.left-wing {
  left: 10px;
  top: 10px;
  transform-origin: 24px 50%;
  animation: flutter-left 0.3s infinite;
}

.right-wing {
  left: 34px;
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
}

@keyframes flutter-left {
  0% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, 70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
}

@keyframes flutter-right {
  0% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, -70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
}
</style>
