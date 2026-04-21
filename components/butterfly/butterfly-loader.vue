<!-- /components/content/butterfly/butterfly-loader.vue -->
<template>
  <div
    v-for="butterfly in butterflies"
    :key="butterfly.id"
    class="butterfly"
    :style="{
      left: butterfly.x + '%',
      top: butterfly.y + '%',
      transform: `rotate3d(1, 0.5, 0, ${butterfly.rotation}deg) scale(${butterfly.scale * butterfly.scaleMod})`,
    }"
  >
    <div class="left-wing">
      <div class="top" :style="{ background: butterfly.wingTopColor }" />
      <div class="bottom" :style="{ background: butterfly.wingTopColor }" />
    </div>
    <div class="right-wing">
      <div class="top" :style="{ background: butterfly.wingBottomColor }" />
      <div class="bottom" :style="{ background: butterfly.wingBottomColor }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()
const butterflies = computed(() => butterflyStore.getAllButterflies)

onMounted(async () => {
  if (!butterflyStore.initialized) {
    await butterflyStore.initialize()
  }
})
</script>

<style scoped>
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
