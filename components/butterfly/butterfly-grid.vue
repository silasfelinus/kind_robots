<template>
  <section class="rounded-2xl border border-base-300 bg-base-200 p-4 shadow-sm">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="text-2xl font-bold">Butterfly Orientation Grid</h2>
        <p class="text-sm opacity-80">
          Click any card to mark it ugly. This gives you a fast little butterfly lineup.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 font-semibold">Step size</div>
          <select v-model="stepSize" class="select select-bordered w-full rounded-2xl">
            <option :value="15">15°</option>
            <option :value="30">30°</option>
            <option :value="60">60°</option>
          </select>
        </label>

        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 font-semibold">Spread</div>
          <select v-model="spreadMode" class="select select-bordered w-full rounded-2xl">
            <option value="tight">[-step, 0, step]</option>
            <option value="wide">[-2step, -step, 0, step, 2step]</option>
          </select>
        </label>

        <label class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 font-semibold">Scale</div>
          <input
            v-model="scale"
            type="range"
            min="0.55"
            max="1.4"
            step="0.05"
            class="range range-info"
          />
          <div class="mt-2 text-sm font-mono">{{ scale.toFixed(2) }}</div>
        </label>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-2 font-semibold">Grid summary</div>
          <div class="text-sm">Combos: {{ combinations.length }}</div>
          <div class="text-sm">Marked ugly: {{ uglyCombos.length }}</div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button class="btn btn-sm rounded-2xl" type="button" @click="clearUgly">
              Clear
            </button>
            <button class="btn btn-sm rounded-2xl" type="button" @click="copyUglyCombos">
              Copy ugly list
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-2 font-semibold">Selected ugly combos</div>
        <pre class="max-h-56 overflow-auto rounded-2xl bg-base-200 p-3 text-xs font-mono">{{ uglyCombosJson }}</pre>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <button
          v-for="combo in combinations"
          :key="combo.id"
          type="button"
          class="group rounded-2xl border p-4 text-left transition hover:scale-[1.01]"
          :class="
            isUgly(combo.id)
              ? 'border-error bg-error/10'
              : 'border-base-300 bg-base-100 hover:bg-base-200'
          "
          @click="toggleUgly(combo.id)"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <div class="text-sm font-semibold">
              x: {{ combo.x }} | y: {{ combo.y }} | z: {{ combo.z }}
            </div>
            <div
              class="rounded-xl px-2 py-1 text-xs font-bold"
              :class="isUgly(combo.id) ? 'bg-error text-error-content' : 'bg-base-200'"
            >
              {{ isUgly(combo.id) ? 'ugly' : 'ok' }}
            </div>
          </div>

          <div
            class="relative flex min-h-[12rem] items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200"
          >
            <div class="grid-stage">
              <div class="grid-guides" />
              <div class="butterfly" :style="getButterflyStyle(combo.x, combo.y, combo.z)">
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

          <div class="mt-3 rounded-2xl bg-base-200 p-2 text-xs font-mono">
            rotateX({{ combo.x }}deg) rotateY({{ combo.y }}deg) rotateZ({{ combo.z }}deg)
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'

type StepSize = 15 | 30 | 60
type SpreadMode = 'tight' | 'wide'

type OrientationCombo = {
  id: string
  x: number
  y: number
  z: number
}

type ButterflyStyle = CSSProperties & {
  '--flutter-duration': string
}

const stepSize = ref<StepSize>(30)
const spreadMode = ref<SpreadMode>('tight')
const scale = ref(1)

const wingTopColor = ref('hsl(320, 80%, 60%)')
const wingBottomColor = ref('hsl(200, 80%, 60%)')

const uglyIds = ref<string[]>([])

const axisValues = computed<number[]>(() => {
  const step = stepSize.value

  if (spreadMode.value === 'wide') {
    return [-2 * step, -step, 0, step, 2 * step]
  }

  return [-step, 0, step]
})

const combinations = computed<OrientationCombo[]>(() => {
  const values = axisValues.value
  const results: OrientationCombo[] = []

  for (const x of values) {
    for (const y of values) {
      for (const z of values) {
        results.push({
          id: `${x}:${y}:${z}`,
          x,
          y,
          z,
        })
      }
    }
  }

  return results
})

const uglyCombos = computed(() =>
  combinations.value.filter((combo) => uglyIds.value.includes(combo.id)),
)

const uglyCombosJson = computed(() =>
  JSON.stringify(
    uglyCombos.value.map(({ x, y, z }) => ({ x, y, z })),
    null,
    2,
  ),
)

function isUgly(id: string) {
  return uglyIds.value.includes(id)
}

function toggleUgly(id: string) {
  if (isUgly(id)) {
    uglyIds.value = uglyIds.value.filter((entry) => entry !== id)
    return
  }

  uglyIds.value = [...uglyIds.value, id]
}

function clearUgly() {
  uglyIds.value = []
}

async function copyUglyCombos() {
  if (import.meta.server) return

  try {
    await navigator.clipboard.writeText(uglyCombosJson.value)
  } catch {
    console.warn('Could not copy ugly combos.')
  }
}

function getButterflyStyle(x: number, y: number, z: number): ButterflyStyle {
  return {
    '--flutter-duration': '0.3s',
    transform: [
      'translate3d(-50%, -50%, 0)',
      `rotateX(${x}deg)`,
      `rotateY(${y}deg)`,
      `rotateZ(${z}deg)`,
      `scale(${scale.value})`,
    ].join(' '),
  }
}
</script>

<style scoped>
.grid-stage {
  position: relative;
  width: 12rem;
  height: 12rem;
  perspective: 1000px;
}

.grid-guides {
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.06) 1px, transparent 1px);
  background-size: 1.5rem 1.5rem;
}

.grid-guides::before,
.grid-guides::after {
  content: '';
  position: absolute;
  background: rgb(255 255 255 / 0.12);
}

.grid-guides::before {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

.grid-guides::after {
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