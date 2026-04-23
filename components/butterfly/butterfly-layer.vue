<template>
  <!-- /components/content/butterfly/butterfly-layer.vue -->
  <div
    v-if="showSwarm"
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
      :style="{
        left: butterfly.x + '%',
        top: butterfly.y + '%',
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
// /components/content/butterfly/butterfly-layer.vue
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useButterflyStore } from '@/stores/butterflyStore'

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

type ButterflyStoreLike = {
  initialized?: boolean
  initialize?: () => Promise<void> | void
  butterflies?: unknown[]
  spawnButterflies?: (count?: number) => void
  spawnLoaderButterflies?: (count?: number) => void
  removeRandomButterfly?: () => void
  triggerRandomExit?: () => void
  sendRandomButterflyOffscreen?: () => void
  signalRandomButterflyExit?: () => void
  releaseButterflies?: () => void
}

const butterflyStore = useButterflyStore()
const storeApi = butterflyStore as unknown as ButterflyStoreLike
const { butterflies } = storeToRefs(butterflyStore)

const showSwarm = computed(() => butterflyStore.showSwarm)

let exitIntervalId: ReturnType<typeof setInterval> | null = null

function spawnInitialButterflies() {
  if (storeApi.spawnLoaderButterflies) {
    storeApi.spawnLoaderButterflies(20)
    return
  }
  if (storeApi.spawnButterflies) {
    storeApi.spawnButterflies(20)
  }
}

function sendOneButterflyOut() {
  if (storeApi.signalRandomButterflyExit) {
    storeApi.signalRandomButterflyExit()
    return
  }
  if (storeApi.sendRandomButterflyOffscreen) {
    storeApi.sendRandomButterflyOffscreen()
    return
  }
  if (storeApi.triggerRandomExit) {
    storeApi.triggerRandomExit()
    return
  }
  if (storeApi.removeRandomButterfly) {
    storeApi.removeRandomButterfly()
  }
}

function startExitSequence() {
  if (exitIntervalId) return
  if (storeApi.releaseButterflies) {
    storeApi.releaseButterflies()
  }
  exitIntervalId = setInterval(() => {
    if (!butterflies.value.length) {
      stopExitSequence()
      return
    }
    sendOneButterflyOut()
  }, 260)
}

function stopExitSequence() {
  if (!exitIntervalId) return
  clearInterval(exitIntervalId)
  exitIntervalId = null
}

onMounted(async () => {
  if (!storeApi.initialized && storeApi.initialize) {
    await storeApi.initialize()
  }
  if (!butterflies.value.length) {
    spawnInitialButterflies()
  }
  if (props.beginExit) {
    startExitSequence()
  }
})

watch(
  () => props.beginExit,
  (shouldExit) => {
    if (shouldExit) {
      startExitSequence()
      return
    }
    stopExitSequence()
  },
)

onBeforeUnmount(() => {
  stopExitSequence()
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
  pointer-events: none;
  will-change: transform, left, top;
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
  opacity: 0.72;
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
