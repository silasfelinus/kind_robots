<template>
  <section class="rounded-2xl border border-base-300 bg-base-200 p-4 shadow-sm">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="text-2xl font-bold">Butterfly Orientation Lab</h2>
        <p class="text-sm opacity-80">
          Manually dial X, Y, and Z rotation in step-5 increments and inspect the butterfly.
        </p>
      </div>

      <div
        class="relative flex min-h-[24rem] items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="orientation-stage">
          <div class="orientation-guides" />
          <div class="butterfly" :style="butterflyStyle">
            <div class="butterfly-body">
              <div class="left-wing">
                <div class="top" :style="{ background: wingTopColor }" />
                <div class="bottom" :style="{ background: wingBottomColor }" />
              </div>

              <div class="right-wing">
                <div class="top" :style="{ background: wingTopColor }" />
                <div class="bottom" :style="{ background: wingBottomColor }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold">Rotate X</span>
            <span class="rounded-xl bg-base-200 px-3 py-1 text-sm font-mono">
              {{ rotateX }}°
            </span>
          </div>
          <input
            v-model="rotateX"
            type="range"
            min="-180"
            max="180"
            step="5"
            class="range range-primary"
          />
        </label>

        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold">Rotate Y</span>
            <span class="rounded-xl bg-base-200 px-3 py-1 text-sm font-mono">
              {{ rotateY }}°
            </span>
          </div>
          <input
            v-model="rotateY"
            type="range"
            min="-180"
            max="180"
            step="5"
            class="range range-secondary"
          />
        </label>

        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold">Rotate Z</span>
            <span class="rounded-xl bg-base-200 px-3 py-1 text-sm font-mono">
              {{ rotateZ }}°
            </span>
          </div>
          <input
            v-model="rotateZ"
            type="range"
            min="-180"
            max="180"
            step="5"
            class="range range-accent"
          />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold">Scale</span>
            <span class="rounded-xl bg-base-200 px-3 py-1 text-sm font-mono">
              {{ scale.toFixed(2) }}
            </span>
          </div>
          <input
            v-model="scale"
            type="range"
            min="0.4"
            max="2"
            step="0.05"
            class="range range-info"
          />
        </label>

        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold">Wing Speed</span>
            <span class="rounded-xl bg-base-200 px-3 py-1 text-sm font-mono">
              {{ wingSpeed.toFixed(2) }}s
            </span>
          </div>
          <input
            v-model="wingSpeed"
            type="range"
            min="0.12"
            max="1"
            step="0.02"
            class="range range-warning"
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <button class="btn rounded-2xl" type="button" @click="setPreset(0, 0, 0)">
          Reset
        </button>
        <button class="btn rounded-2xl" type="button" @click="setPreset(0, 90, 0)">
          Side Y 90
        </button>
        <button class="btn rounded-2xl" type="button" @click="setPreset(0, -90, 0)">
          Side Y -90
        </button>
        <button class="btn rounded-2xl" type="button" @click="setPreset(90, 0, 0)">
          Top X 90
        </button>
        <button class="btn rounded-2xl" type="button" @click="setPreset(0, 0, 90)">
          Spin Z 90
        </button>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-2 text-sm font-semibold">Current transform</div>
        <pre class="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-base-200 p-3 text-xs font-mono">{{ transformString }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'

type ButterflyStyle = CSSProperties & {
  '--flutter-duration': string
}

const rotateX = ref(0)
const rotateY = ref(0)
const rotateZ = ref(0)
const scale = ref(1)
const wingSpeed = ref(0.3)

const wingTopColor = ref('hsl(320, 80%, 60%)')
const wingBottomColor = ref('hsl(200, 80%, 60%)')

function setPreset(x: number, y: number, z: number) {
  rotateX.value = x
  rotateY.value = y
  rotateZ.value = z
}

const transformString = computed(() => {
  return [
    'translate3d(-50%, -50%, 0)',
    `rotateX(${rotateX.value}deg)`,
    `rotateY(${rotateY.value}deg)`,
    `rotateZ(${rotateZ.value}deg)`,
    `scale(${scale.value})`,
  ].join(' ')
})

const butterflyStyle = computed<ButterflyStyle>(() => ({
  '--flutter-duration': `${wingSpeed.value}s`,
  transform: transformString.value,
}))
</script>

<style scoped>
.orientation-stage {
  position: relative;
  width: 20rem;
  height: 20rem;
  perspective: 1000px;
}

.orientation-guides {
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.06) 1px, transparent 1px);
  background-size: 2rem 2rem;
}

.orientation-guides::before,
.orientation-guides::after {
  content: '';
  position: absolute;
  background: rgb(255 255 255 / 0.12);
}

.orientation-guides::before {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

.orientation-guides::after {
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}

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

.butterfly {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100px;
  height: 100px;
  transform-style: preserve-3d;
  transform-origin: center;
  will-change: transform;
}

.butterfly-body {
  position: relative;
  width: 68px;
  height: 64px;
  transform-style: preserve-3d;
}

.left-wing,
.right-wing {
  position: absolute;
  width: 24px;
  height: 42px;
  top: 10px;
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