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
        <div class="left-wing" :style="leftWingStyle">
          <div class="top" :style="{ background: wingTopColor }" />
          <div class="bottom" :style="{ background: wingBottomColor }" />
        </div>
        <div class="right-wing" :style="rightWingStyle">
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
type ToggleMode = 'approaching' | 'perched' | 'fleeing' | 'returning'

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
    perchRadiusX: 3,
    perchRadiusY: 2,
  },
)

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

const hydrated = ref(false)
const mode = ref<ToggleMode>('approaching')
const animationFrameId = ref<number | null>(null)
const returnTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
const disturbedUntil = ref(0)

const x = ref(0)
const y = ref(0)
const vx = ref(0)
const vy = ref(0)
const anchorX = ref(0)
const anchorY = ref(0)
const rotation = ref(90)
const bodyScale = ref(1)
const wingAngle = ref(16)
const wingLift = ref(0)
const idlePose = ref(0)
const lastTime = ref(0)

const idleSeed = Math.random() * Math.PI * 2
const spawnSeed = Math.random()
const flutterSeed = Math.random() * 1000
const perchLeanSeed = Math.random() > 0.5 ? 1 : -1

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
  opacity: '1',
  zIndex: '50',
}))

const butterflyStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  transform: `rotate(${rotation.value}deg) scale(${bodyScale.value})`,
  opacity: '1',
}))

const leftWingStyle = computed(() => ({
  transform: `rotate3d(0, 1, 0, ${wingAngle.value + wingLift.value}deg) rotate(${idlePose.value * 0.35}deg)`,
  opacity: '1',
}))

const rightWingStyle = computed(() => ({
  transform: `rotate3d(0, 1, 0, ${-wingAngle.value - wingLift.value}deg) rotate(${-idlePose.value * 0.35}deg)`,
  opacity: '1',
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

function getClosedHeaderAnchor() {
  const viewport = getViewportBounds()
  const fallbackY = 28 + props.size * 0.12
  const fallbackX = viewport.width * 0.5 + props.perchOffsetX

  const displayAny = displayStore as unknown as {
    headerHeight?: number
    sectionPaddingSize?: number
  }

  const headerHeight =
    typeof displayAny.headerHeight === 'number' ? displayAny.headerHeight : 0

  const sectionPaddingSize =
    typeof displayAny.sectionPaddingSize === 'number'
      ? displayAny.sectionPaddingSize
      : 1.25

  const estimatedClosedCenterY =
    Math.max(20, headerHeight * 0.5) +
    sectionPaddingSize * 2 +
    props.perchOffsetY

  return {
    x: fallbackX,
    y: estimatedClosedCenterY || fallbackY,
  }
}

function syncAnchor(resetPosition = false) {
  const rect = getTargetRect()
  const viewport = getViewportBounds()

  if (props.toggleKey === 'header') {
    const closedAnchor = getClosedHeaderAnchor()
    anchorX.value = closedAnchor.x
    anchorY.value = closedAnchor.y
  } else if (rect) {
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
      y: -props.size * 0.8,
    }
  }

  if (props.toggleKey === 'footer') {
    return {
      x: width * (0.15 + spawnSeed * 0.7),
      y: height + props.size * 0.8,
    }
  }

  if (props.toggleKey === 'left-sidebar') {
    return {
      x: -props.size * 0.8,
      y: height * (0.2 + spawnSeed * 0.6),
    }
  }

  return {
    x: width + props.size * 0.8,
    y: height * (0.2 + spawnSeed * 0.6),
  }
}

function getFleePoint(width: number, height: number) {
  const overshoot = props.size * 1.5

  if (props.toggleKey === 'header') {
    return {
      x: clamp(
        anchorX.value + randomRange(-width * 0.28, width * 0.28),
        -overshoot,
        width + overshoot,
      ),
      y: -overshoot,
    }
  }

  if (props.toggleKey === 'footer') {
    return {
      x: clamp(
        anchorX.value + randomRange(-width * 0.28, width * 0.28),
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
        anchorY.value + randomRange(-height * 0.24, height * 0.24),
        -overshoot,
        height + overshoot,
      ),
    }
  }

  return {
    x: width + overshoot,
    y: clamp(
      anchorY.value + randomRange(-height * 0.24, height * 0.24),
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

function startFleeAndReturn() {
  const viewport = getViewportBounds()
  const flee = getFleePoint(viewport.width, viewport.height)

  disturbedUntil.value = Date.now() + 1800
  mode.value = 'fleeing'

  const horizontalBias =
    props.toggleKey === 'left-sidebar'
      ? -1
      : props.toggleKey === 'right-sidebar'
        ? 1
        : Math.random() > 0.5
          ? 1
          : -1

  const verticalBias =
    props.toggleKey === 'header'
      ? -1
      : props.toggleKey === 'footer'
        ? 1
        : Math.random() > 0.5
          ? 1
          : -1

  vx.value = horizontalBias * randomRange(4.5, 7.5)
  vy.value = verticalBias * randomRange(4.5, 7.5)
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
    randomRange(950, 1500),
  )
}

async function handleClick() {
  triggerDisplayToggle()
  startFleeAndReturn()
}

function updatePerchedMotion(time: number) {
  const settleX =
    anchorX.value + Math.cos(time * 0.17 + idleSeed) * props.perchRadiusX
  const settleY =
    anchorY.value + Math.sin(time * 0.19 + idleSeed) * props.perchRadiusY

  x.value += (settleX - x.value) * 0.08
  y.value += (settleY - y.value) * 0.08

  const lean =
    perchLeanSeed *
    (4 +
      Math.sin(time * 0.35 + idleSeed) * 2 +
      Math.sin(time * 0.11 + idleSeed) * 1.5)

  rotation.value += (90 + lean - rotation.value) * 0.08
  bodyScale.value += (1 - bodyScale.value) * 0.08

  const flutterGate = Math.sin(time * 0.55 + flutterSeed)
  const microFlutterGate = Math.sin(time * 0.19 + flutterSeed * 0.3)

  if (flutterGate > 0.985) {
    wingLift.value = Math.sin(time * 16) * 22
  } else if (microFlutterGate > 0.96) {
    wingLift.value = Math.sin(time * 8) * 8
  } else {
    wingLift.value += (0 - wingLift.value) * 0.18
  }

  idlePose.value = Math.sin(time * 0.45 + idleSeed) * 6
  wingAngle.value += (16 - wingAngle.value) * 0.18
  vx.value *= 0.82
  vy.value *= 0.82
}

function updateTravelMotion(time: number) {
  const dx = anchorX.value - x.value
  const dy = anchorY.value - y.value
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  const speed =
    mode.value === 'fleeing' ? 0.42 : mode.value === 'returning' ? 0.2 : 0.15

  vx.value += (dx / dist) * speed
  vy.value += (dy / dist) * speed

  const maxVelocity =
    mode.value === 'fleeing' ? 10 : mode.value === 'returning' ? 5.5 : 4

  vx.value = clamp(vx.value, -maxVelocity, maxVelocity)
  vy.value = clamp(vy.value, -maxVelocity, maxVelocity)

  x.value += vx.value
  y.value += vy.value

  const travelRotation = Math.atan2(vy.value, vx.value) * (180 / Math.PI) + 90
  rotation.value += (travelRotation - rotation.value) * 0.2
  bodyScale.value +=
    ((mode.value === 'fleeing' ? 1.04 : 1) - bodyScale.value) * 0.12

  wingAngle.value = 24
  wingLift.value =
    Math.sin(time * (mode.value === 'fleeing' ? 18 : 14) + idleSeed) * 24
  idlePose.value = Math.sin(time * 2.2 + idleSeed) * 4

  if (
    (mode.value === 'approaching' || mode.value === 'returning') &&
    dist < 10
  ) {
    mode.value = 'perched'
    vx.value *= 0.2
    vy.value *= 0.2
    syncAnchor(false)
  }

  const viewport = getViewportBounds()
  const offscreenBuffer = props.size * 1.2

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
    vx.value = randomRange(-1.2, 1.2)
    vy.value = randomRange(-1.2, 1.2)
  }
}

function updateMotion(now: number) {
  const time = now * 0.001

  if (mode.value === 'perched') {
    updatePerchedMotion(time)
    return
  }

  updateTravelMotion(time)
}

function tick(now: number) {
  if (!lastTime.value) {
    lastTime.value = now
  }

  updateMotion(now)
  lastTime.value = now
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

    if (mode.value === 'fleeing') return

    syncAnchor(false)

    if (Date.now() < disturbedUntil.value) {
      return
    }

    if (mode.value === 'perched') {
      startFleeAndReturn()
      return
    }

    mode.value = 'returning'
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
.butterfly {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  pointer-events: none;
  opacity: 1;
}

.left-wing,
.right-wing {
  position: absolute;
  width: 24px;
  height: 42px;
  top: 10px;
  pointer-events: none;
  opacity: 1;
  transition: transform 0.16s ease-out;
}

.left-wing {
  left: 10px;
  transform-origin: 24px 50%;
}

.right-wing {
  left: 34px;
  transform-origin: 0px 50%;
}

.top,
.bottom {
  position: absolute;
  opacity: 1;
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
