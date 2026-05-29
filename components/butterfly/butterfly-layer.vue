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
    <butterfly-animation
      v-if="useLegacyStartupButterflies && overlayVisible"
      class="butterfly-layer__legacy"
    />

    <template v-else>
      <div
        v-for="butterfly in butterflies"
        :key="butterfly.id"
        class="butterfly"
        :style="{
          transform: `translate3d(${butterfly.x}vw, ${butterfly.y}vh, 0) rotateZ(${butterfly.heading ?? 0}deg) rotate3d(1, 0.5, 0, ${butterfly.rotation}deg) scale(${butterfly.scale * butterfly.scaleMod})`,
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
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-layer.vue
import { computed, onMounted, watch } from 'vue'
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

const butterflyStore = useButterflyStore()
const { butterflies, useLegacyStartupButterflies } = storeToRefs(butterflyStore)

const showSwarm = computed(() => butterflyStore.showSwarm)

function afterNextPaint(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

onMounted(() => {
  afterNextPaint(() => {
    void butterflyStore.spawnStartupSwarm(8)
  })
})

watch(
  () => [props.beginExit, props.overlayVisible] as const,
  ([beginExit, overlayVisible]) => {
    if (!beginExit && overlayVisible) return

    butterflyStore.triggerLoaderButterflyExit(
      useLegacyStartupButterflies.value ? 250 : 0,
    )
  },
)
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

.butterfly-layer--overlay {
  z-index: 84;
}

.butterfly-layer--released {
  z-index: 5;
}

.butterfly-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  transition: z-index 0s linear 0.2s;
  contain: layout paint style;
  transform: translateZ(0);
}

.butterfly-layer__legacy {
  position: absolute;
  inset: 0;
}

.butterfly {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 100px;
  transform-style: preserve-3d;
  pointer-events: none;
  will-change: transform;
  contain: layout paint style;
  backface-visibility: hidden;
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
