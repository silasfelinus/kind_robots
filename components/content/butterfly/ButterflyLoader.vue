<template>
  <div
    v-for="butterfly in butterflies"
    :key="butterfly.id"
    class="butterfly"
    :style="{
      left: butterfly.x + 'px',
      top: butterfly.y + 'px',
      transform:
        'rotate3d(1, 0.5, 0, ' +
        butterfly.rotation +
        'deg) scale(' +
        butterfly.scale +
        ')',
    }"
  >
    <div class="left-wing">
      <div class="top" :style="{ background: butterfly.wingColor }" />
      <div class="bottom" :style="{ background: butterfly.wingColor }" />
    </div>
    <div class="right-wing">
      <div class="top" :style="{ background: butterfly.wingColor }" />
      <div class="bottom" :style="{ background: butterfly.wingColor }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRandomColor } from '@/utils/useRandomColor'

const centerX = window.innerWidth / 2
const centerY = window.innerHeight / 2
let butterflyId = 0
class Butterfly {
  id = butterflyId++
  x = ref(Math.random() * window.innerWidth)
  y = ref(Math.random() * window.innerHeight)
  rotation = ref(110)
  speedX = ref(Math.random() * 5 - 2.5) // Random speed between -2.5 and 2.5
  speedY = ref(Math.random() * 5 - 2.5)
  scale = ref(1)
  wingColor = useRandomColor().randomColor.value

  updatePosition() {
    this.x.value += this.speedX.value
    this.y.value += this.speedY.value

    // If the butterfly is outside the screen bounds, reverse its direction
    if (this.x.value < 0 || this.x.value > window.innerWidth) {
      this.speedX.value = -this.speedX.value
    }

    if (this.y.value < 0 || this.y.value > window.innerHeight) {
      this.speedY.value = -this.speedY.value
    }

    // Update the rotation based on the direction
    this.rotation.value =
      Math.atan2(this.speedY.value, this.speedX.value) * (180 / Math.PI) + 90

    // Update the scale based on the distance from the center
    const distanceFromCenter = Math.sqrt(
      Math.pow(this.x.value - centerX, 2) + Math.pow(this.y.value - centerY, 2),
    )
    const maxDistance = Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2),
    )
    this.scale.value = 1 + (distanceFromCenter / maxDistance) * 2
  }
}

const butterflies = Array(10)
  .fill(null)
  .map(() => new Butterfly())
function animate() {
  butterflies.forEach((butterfly) => butterfly.updatePosition())
  requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
})
</script>

<style scoped>
body {
  background: #111;
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

.butterfly {
  width: 100px;
  height: 100px;
  position: absolute;
  transform-style: preserve-3d;
  transform: rotate3d(1, 0.5, 0, 110deg);
}

.left-wing,
.right-wing {
  width: 24px;
  height: 42px;
  position: absolute;
  top: 10px;
}

.left-wing {
  left: 10px;
  top: 10px;
  transform-origin: 24px 50%;
  transform: rotate3d(0, 1, 0, 20deg);
  animation: flutter-left 0.3s infinite;
}

.right-wing {
  left: 34px;
  transform: rotate3d(0, 1, 0, -20deg);
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
}

.left-wing .top {
  right: 0;
}

.top,
.bottom {
  opacity: 0.7;
  position: absolute;
}
.top {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}

.bottom {
  top: 18px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
}
</style>
utils/useRandomColor
