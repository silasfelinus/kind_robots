<template>
  <!-- /components/content/butterfly/butterfly-layer.vue -->
  <div
    v-show="showSwarm"
    class="butterfly-layer"
    :class="{
      'butterfly-layer--overlay': overlayVisible,
      'butterfly-layer--released': !overlayVisible,
    }"
  >
    <div
      v-for="butterfly in butterflies"
      :key="butterfly.id"
      class="butterfly"
      :style="getButterflyStyle(butterfly)"
    >
      <div class="butterfly-body">
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
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-layer.vue
import { computed, onMounted, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useButterflyStore, type Butterfly } from '@/stores/butterflyStore'

const props = withDefaults(
  defineProps<{
    beginExit?: boolean
    overlayVisible?: boolean
  }>(),
  {
    beginExit: false,
    overlayVisible: true,
  },
)

const butterflyStore = useButterflyStore()
const { butterflies } = storeToRefs(butterflyStore)

const showSwarm = computed(() => butterflyStore.showSwarm)

type ButterflyStyle = CSSProperties & {
  '--flutter-duration': string
}

function getFacingDirection(rotation: number) {
  return rotation >= 75 ? 1 : -1
}

function getVisualBank(rotation: number) {
  return getFacingDirection(rotation) === 1 ? 10 : -10
}

function getVisualYaw(rotation: number) {
  return getFacingDirection(rotation) === 1 ? 12 : -12
}

function getVisualDirection(rotation: number) {
  return getFacingDirection(rotation) === 1 ? 14 : -14
}

function getFlutterDuration(wingSpeed: number) {
  const safeWingSpeed = Math.max(0.5, Math.min(8, wingSpeed || 3))
  return `${Math.max(0.12, 0.42 / safeWingSpeed)}s`
}

function getButterflyStyle(butterfly: Butterfly): ButterflyStyle {
  const scale = butterfly.scale * butterfly.scaleMod
  const visualDirection = getVisualDirection(butterfly.rotation)
  const visualYaw = getVisualYaw(butterfly.rotation)
  const visualBank = getVisualBank(butterfly.rotation)

  return {
    left: `${butterfly.x}%`,
    top: `${butterfly.y}%`,
    zIndex: butterfly.zIndex,
    '--flutter-duration': getFlutterDuration(butterfly.wingSpeed),
    transform: [
      'translate3d(-50%, -50%, 0)',
      `rotateZ(${visualDirection}deg)`,
      `rotateY(${visualYaw}deg)`,
      `rotateX(${visualBank}deg)`,
      `scale(${scale})`,
    ].join(' '),
  }
}

onMounted(async () => {
  await butterflyStore.spawnStartupSwarm(20)
})
</script>

<style scoped>
@keyframes flutter-left {
  0% {
    transform: rotateY(18deg);
  }

  50% {
    transform: rotateY(72deg);
  }

  100% {
    transform: rotateY(18deg);
  }
}

@keyframes flutter-right {
  0% {
    transform: rotateY(-18deg);
  }

  50% {
    transform: rotateY(-72deg);
  }

  100% {
    transform: rotateY(-18deg);
  }
}

.butterfly-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  perspective: 900px;
  transition: z-index 0s linear 0.2s;
}

.butterfly-layer--overlay {
  z-index: 84;
}

.butterfly-layer--released {
  z-index: 5;
}

.butterfly {
  position: absolute;
  width: 100px;
  height: 100px;
  transform-style: preserve-3d;
  transform-origin: center;
  pointer-events: none;
  will-change: transform, left, top;
}

.butterfly-body {
  position: relative;
  width: 68px;
  height: 64px;
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
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform;
}

.left-wing {
  left: 10px;
  transform-origin: 24px 50%;
  animation: flutter-left var(--flutter-duration) infinite ease-in-out;
}

.right-wing {
  left: 34px;
  transform-origin: 0 50%;
  animation: flutter-right var(--flutter-duration) infinite ease-in-out;
}

.left-wing .top {
  right: 0;
}

.top,
.bottom {
  position: absolute;
  opacity: 0.72;
  pointer-events: none;
  backface-visibility: hidden;
}

.top {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
}

.bottom {
  top: 18px;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
}
</style>
