<!-- /components/navigation/butterfly-toggle.vue -->
<template>
  <div
    v-if="hydrated"
    class="pointer-events-none fixed inset-0 overflow-visible z-50"
  >
    <button
      type="button"
      class="absolute border-0 bg-transparent p-0 pointer-events-auto cursor-pointer"
      :style="buttonStyle"
      :title="title"
      @click.stop="handleClick"
    >
      <div class="butterfly" :style="butterflyStyle">
        <div class="left-wing">
          <div class="top" :style="{ background: wingTopColor }" />
          <div class="bottom" :style="{ background: wingBottomColor }" />
        </div>
        <div class="right-wing">
          <div class="top" :style="{ background: wingTopColor }" />
          <div class="bottom" :style="{ background: wingBottomColor }" />
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/butterfly-toggle.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

type ToggleKey = 'header' | 'footer' | 'left-sidebar' | 'right-sidebar'
type ToggleMode = 'approaching' | 'hover' | 'fleeing' | 'returning'

const props = withDefaults(
  defineProps<{
    toggleKey: ToggleKey
    targetRef: HTMLElement | null
    size?: number
    perchOffsetX?: number
    perchOffsetY?: number
    perchRadiusX?: number
    perchRadiusY?: number
  }>(),
  {
    size: 100,
    perchOffsetX: 0,
    perchOffsetY: 0,
    perchRadiusX: 6,
    perchRadiusY: 4,
  },
)

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

const hydrated = ref(false)
const mode = ref<ToggleMode>('approaching')
const animationFrameId = ref<number | null>(null)
const returnTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)

const x = ref(0)
const y = ref(0)
const vx = ref(0)
const vy = ref(0)
const anchorX = ref(0)
const anchorY = ref(0)
const rotation = ref(110)
const scale = ref(1)
const wingScale = ref(1)

const idleSeed = Math.random() * Math.PI * 2
const spawnSeed = Math.random()

const wingColorType = Math.floor(Math.random() * 3)
const primaryColor = butterflyStore.randomColor()
const wingTopColor = primaryColor
const wingBottomColor =
  wingColorType === 1
    ? butterflyStore.complementaryColor(primaryColor)
    : wingColorType === 2
      ? butterflyStore.analogousColor(primaryColor)
      : primaryColor

const title = computed(() => {
  if (props.toggleKey === 'header') return 'Toggle header'
  if (props.toggleKey === 'footer') return 'Toggle footer'
  if (props.toggleKey === 'left-sidebar') return 'Toggle left sidebar'
  return 'Toggle right sidebar'
})

const buttonStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${props.size}px`,
  height: `${props.size}px`,
  transform: 'translate(-50%, -50%)',
}))

const butterflyStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  transform: `rotate3d(1, 0.5, 0, ${rotation.value}deg) scale(${scale.value * wingScale.value})`,
}))

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function getViewportBounds() {
  return {
    width: window.innerWidth || 0,
    height: window.innerHeight || 0,
  }
}

function getTargetRect() {
  const target = props.targetRef
  if (!target) return null
  return target.getBoundingClientRect()
}

function syncAnchor(resetPosition = false) {
  const rect = getTargetRect()
  const viewport = getViewportBounds()

  if (rect) {
    anchorX.value = rect.left + rect.width / 2 + props.perchOffsetX
    anchorY.value = rect.top + rect.height / 2 + props.perchOffsetY
  } else {
    anchorX.value = viewport.width / 2 + props.perchOffsetX
    anchorY.value = viewport.height / 2 + props.perchOffsetY
  }

  if (resetPosition) {
    const spawn = getSpawnPoint(viewport.width, viewport.height)
    x.value = spawn.x
    y.value = spawn.y
    vx.value = randomRange(-0.8, 0.8)
    vy.value = randomRange(-0.8, 0.8)
  }
}

function getSpawnPoint(width: number, height: number) {
  if (props.toggleKey === 'header') {
    return {
      x: width * (0.15 + spawnSeed * 0.7),
      y: -props.size * 0.7,
    }
  }

  if (props.toggleKey === 'footer') {
    return {
      x: width * (0.15 + spawnSeed * 0.7),
      y: height + props.size * 0.7,
    }
  }

  if (props.toggleKey === 'left-sidebar') {
    return {
      x: -props.size * 0.7,
      y: height * (0.2 + spawnSeed * 0.6),
    }
  }

  return {
    x: width + props.size * 0.7,
    y: height * (0.2 + spawnSeed * 0.6),
  }
}

function getFleePoint(width: number, height: number) {
  const overshoot = props.size

  if (props.toggleKey === 'header') {
    return {
      x: clamp(
        anchorX.value + randomRange(-width * 0.2, width * 0.2),
        -overshoot,
        width + overshoot,
      ),
      y: -overshoot,
    }
  }

  if (props.toggleKey === 'footer') {
    return {
      x: clamp(
        anchorX.value + randomRange(-width * 0.2, width * 0.2),
        -overshoot,
        width + overshoot,
      ),
      y: height + overshoot,
    }
  }

  if (props.toggleKey === 'left-sidebar') {
    return {
      x: -overshoot,
      y: clamp(
        anchorY.value + randomRange(-height * 0.2, height * 0.2),
        -overshoot,
        height + overshoot,
      ),
    }
  }

  return {
    x: width + overshoot,
    y: clamp(
      anchorY.value + randomRange(-height * 0.2, height * 0.2),
      -overshoot,
      height + overshoot,
    ),
  }
}

function triggerDisplayToggle() {
  if (props.toggleKey === 'header') {
    displayStore.toggleHeader()
    return
  }

  if (props.toggleKey === 'footer') {
    displayStore.toggleFooter()
    return
  }

  if (props.toggleKey === 'left-sidebar') {
    displayStore.toggleLeftSidebar()
    return
  }

  displayStore.toggleRightSidebar()
}

async function handleClick() {
  const viewport = getViewportBounds()
  const flee = getFleePoint(viewport.width, viewport.height)

  triggerDisplayToggle()

  mode.value = 'fleeing'
  vx.value += randomRange(1.8, 3.2) * (Math.random() > 0.5 ? 1 : -1)
  vy.value += randomRange(1.8, 3.2) * (Math.random() > 0.5 ? 1 : -1)
  anchorX.value = flee.x
  anchorY.value = flee.y

  if (returnTimeoutId.value) {
    clearTimeout(returnTimeoutId.value)
  }

  returnTimeoutId.value = setTimeout(
    async () => {
      await nextTick()
      syncAnchor(false)
      mode.value = 'returning'
    },
    randomRange(900, 1500),
  )
}

function updateHoverMotion(time: number) {
  const targetX =
    anchorX.value + Math.cos(time * 1.6 + idleSeed) * props.perchRadiusX
  const targetY =
    anchorY.value + Math.sin(time * 2.1 + idleSeed) * props.perchRadiusY

  x.value += (targetX - x.value) * 0.14
  y.value += (targetY - y.value) * 0.14

  const dx = targetX - x.value
  rotation.value += ((dx >= 0 ? 120 : 30) - rotation.value) * 0.1
  scale.value = 0.96 + Math.sin(time * 2.4 + idleSeed) * 0.03
  wingScale.value = 1 + Math.sin(time * 10 + idleSeed) * 0.06
}

function updateTravelMotion(time: number) {
  const dx = anchorX.value - x.value
  const dy = anchorY.value - y.value
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  const speed =
    mode.value === 'fleeing' ? 0.28 : mode.value === 'returning' ? 0.16 : 0.13

  vx.value += (dx / dist) * speed
  vy.value += (dy / dist) * speed

  const maxVelocity =
    mode.value === 'fleeing' ? 8 : mode.value === 'returning' ? 5 : 4

  vx.value = clamp(vx.value, -maxVelocity, maxVelocity)
  vy.value = clamp(vy.value, -maxVelocity, maxVelocity)

  x.value += vx.value
  y.value += vy.value

  rotation.value += ((vx.value >= 0 ? 120 : 30) - rotation.value) * 0.1
  scale.value += ((mode.value === 'fleeing' ? 1.05 : 1) - scale.value) * 0.08
  wingScale.value = 1 + Math.sin(time * 14 + idleSeed) * 0.08

  if (
    (mode.value === 'approaching' || mode.value === 'returning') &&
    dist < 10
  ) {
    mode.value = 'hover'
    vx.value *= 0.35
    vy.value *= 0.35
    syncAnchor(false)
  }

  const viewport = getViewportBounds()
  const offscreenBuffer = props.size

  if (
    mode.value === 'fleeing' &&
    (x.value < -offscreenBuffer ||
      x.value > viewport.width + offscreenBuffer ||
      y.value < -offscreenBuffer ||
      y.value > viewport.height + offscreenBuffer)
  ) {
    const spawn = getSpawnPoint(viewport.width, viewport.height)
    x.value = spawn.x
    y.value = spawn.y
    vx.value = randomRange(-1, 1)
    vy.value = randomRange(-1, 1)
  }
}

function updateMotion() {
  const time = Date.now() * 0.002

  if (mode.value === 'hover') {
    updateHoverMotion(time)
    return
  }

  updateTravelMotion(time)
}

function tick() {
  updateMotion()
  animationFrameId.value = window.requestAnimationFrame(tick)
}

function handleResize() {
  syncAnchor(false)
}

onMounted(async () => {
  await nextTick()
  syncAnchor(true)
  hydrated.value = true
  mode.value = 'approaching'
  window.addEventListener('resize', handleResize)
  animationFrameId.value = window.requestAnimationFrame(tick)
})

watch(
  () => props.targetRef,
  async () => {
    await nextTick()
    syncAnchor(false)

    if (
      mode.value === 'hover' ||
      mode.value === 'approaching' ||
      mode.value === 'returning'
    ) {
      mode.value = mode.value === 'hover' ? 'hover' : 'returning'
    }
  },
)

onBeforeUnmount(() => {
  if (animationFrameId.value != null) {
    cancelAnimationFrame(animationFrameId.value)
  }

  if (returnTimeoutId.value) {
    clearTimeout(returnTimeoutId.value)
  }

  window.removeEventListener('resize', handleResize)
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
  position: absolute;
  inset: 0;
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
