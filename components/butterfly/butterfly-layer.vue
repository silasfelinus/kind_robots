<!-- /components/content/butterfly/butterfly-layer.vue -->
<template>
  <div class="butterfly-layer">
    <div
      v-for="butterfly in butterflies"
      :key="butterfly.id"
      class="butterfly"
      :style="{
        left: butterfly.x + '%',
        top: butterfly.y + '%',
        zIndex: Math.round(butterfly.zIndex),
        transform: `rotate3d(1, 0.5, 0, ${butterfly.rotation}deg) scale(${butterfly.scale * butterfly.scaleMod})`,
      }"
    >
      <div class="left-wing">
        <div class="top" :style="{ background: butterfly.wingTopColor }" />
        <div
          class="bottom"
          :style="{ background: butterfly.wingBottomColor }"
        />
      </div>
      <div class="right-wing">
        <div class="top" :style="{ background: butterfly.wingTopColor }" />
        <div
          class="bottom"
          :style="{ background: butterfly.wingBottomColor }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()
const { butterflies } = storeToRefs(butterflyStore)

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

.butterfly-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
}

.butterfly {
  position: absolute;
  width: 100px;
  height: 100px;
  transform-style: preserve-3d;
  pointer-events: none;
}

.left-wing,
.right-wing {
  position: absolute;
  width: 24px;
  height: 42px;
  top: 10px;
  pointer-events: none;
}

.left-wing {
  left: 10px;
  transform-origin: 24px 50%;
  animation: flutter-left 0.3s infinite;
}

.right-wing {
  left: 34px;
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
}

.left-wing .top {
  right: 0;
}

.top,
.bottom {
  position: absolute;
  opacity: 0.7;
  pointer-events: none;
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
