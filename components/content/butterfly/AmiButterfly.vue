<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { makeNoise2D } from 'open-simplex-noise';
import { randomColor, analogousColor, complementaryColor } from '@/stores/butterflyStore';

interface Butterfly {
  wingTopColor: string;
  wingBottomColor: string;
  rotation: number;
  speed: number;
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear';
  goal: { x: number; y: number };
  hasReachedGoal: boolean;
  wingSpeed: number;
  scale: number;
  countdown: number;
}

interface WindowSize {
  width: number;
  height: number;
}

const hydrated = ref(false);
const windowSize = reactive<WindowSize>({ width: 0, height: 0 });

const randomRange = (min: number, max: number): number => Math.random() * (max - min) + min;

const wingColorType = Math.floor(Math.random() * 3); // 0: same, 1: complementary, 2: analogous
const primaryColor = randomColor();
const secondaryColor =
  wingColorType === 1
    ? complementaryColor(primaryColor)
    : wingColorType === 2
    ? analogousColor(primaryColor)
    : primaryColor;

const butterfly = reactive<Butterfly>({
  wingTopColor: primaryColor,
  wingBottomColor: secondaryColor,
  rotation: 110,
  speed: randomRange(1, 3),
  status: 'random',
  goal: { x: randomRange(0, window.innerWidth), y: randomRange(0, window.innerHeight) },
  hasReachedGoal: false,
  wingSpeed: Math.floor(randomRange(0, 3)),
  scale: randomRange(0.75, 1.25),
  countdown: 0,
});

const noise2D = makeNoise2D(Date.now());
let animationFrameId: number;

const handleResize = () => {
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;
};

const updatePosition = () => {
  const t = Date.now() * 0.001;
  const angle =
    noise2D(butterfly.goal.x * 0.01, butterfly.goal.y * 0.01 + t) * Math.PI * 2;
  const dx = Math.cos(angle) * butterfly.speed;
  const dy = Math.sin(angle) * butterfly.speed;

  butterfly.goal.x = Math.max(0, Math.min(butterfly.goal.x + dx, windowSize.width - 100));
  butterfly.goal.y = Math.max(0, Math.min(butterfly.goal.y + dy, windowSize.height - 100));

  butterfly.scale = 0.33 + (1 - (butterfly.goal.x / windowSize.width + butterfly.goal.y / windowSize.height) / 2) * 0.67;
  butterfly.rotation = dx >= 0 ? 120 : 30;
};

const animate = () => {
  updatePosition();
  animationFrameId = requestAnimationFrame(animate);
};

onMounted(() => {
  hydrated.value = true;
  windowSize.width = window.innerWidth;
  windowSize.height = window.innerHeight;
  window.addEventListener('resize', handleResize);
  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
});
</script>


<template>
  <div
    v-if="hydrated"
    class="butterfly z-50"
    :style="{
      left: butterfly.goal.x + 'px',
      top: butterfly.goal.y + 'px',
      transform:
        'rotate3d(1, 0.5, 0, ' +
        butterfly.rotation +
        'deg) scale(' +
        butterfly.scale +
        ')',
    }"
  >
    <div class="left-wing z-50">
      <div class="top" :style="{ background: butterfly.wingTopColor }"></div>
      <div
        class="bottom"
        :style="{ background: butterfly.wingBottomColor }"
      ></div>
    </div>
    <div class="right-wing z-50">
      <div class="top" :style="{ background: butterfly.wingTopColor }"></div>
      <div
        class="bottom"
        :style="{ background: butterfly.wingBottomColor }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
body {
  background: #111;
  pointer-events: none;
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
  transform: rotate3d(0, 1, 0, 20deg);
  animation: flutter-left 0.3s infinite;
  pointer-events: none;
}

.right-wing {
  left: 34px;
  transform: rotate3d(0, 1, 0, -20deg);
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
  pointer-events: none;
}

.top,
.bottom {
  opacity: 0.7;
  position: absolute;
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
