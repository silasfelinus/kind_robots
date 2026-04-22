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
type ToggleMode =
  | 'approaching'
  | 'settling'
  | 'perched'
  | 'fleeing'
  | 'returning'

const props = withDefaults(
  defineProps<{
    toggleKey: ToggleKey
    targetRef: HTMLElement | null
    size?: number
    perchOffsetX?: number
    perchOffsetY?: number
  }>(),
  {
    size: 100,
    perchOffsetX: 0,
    perchOffsetY: 0,
  },
)

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

function getClosedHeaderAnchor() {
  return {
    x: 5 + props.perchOffsetX,
    y: 5 + props.perchOffsetY,
  }
}

function getFooterAnchor() {
  const displayAny = displayStore as unknown as {
    footerLeftInset?: number
    footerWidth?: number
    footerHeight?: number
  }

  const leftInset =
    typeof displayAny.footerLeftInset === 'number'
      ? displayAny.footerLeftInset
      : 5

  const width =
    typeof displayAny.footerWidth === 'number' ? displayAny.footerWidth : 90

  const height =
    typeof displayAny.footerHeight === 'number' ? displayAny.footerHeight : 12

  const viewport = getViewportBounds()

  const xPercent = leftInset + width / 2
  const xPixels = (viewport.width * xPercent) / 100

  const yPixels = viewport.height - (viewport.height * height) / 200

  return {
    x: xPixels + props.perchOffsetX,
    y: yPixels + props.perchOffsetY,
  }
}

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
const settleProgress = ref(0)

const spawnSeed = Math.random()
const flutterSeed = Math.random() * 1000
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

function syncAnchor(resetPosition = false) {
  const rect = getTargetRect()
  const viewport = getViewportBounds()

  if (props.toggleKey === 'header') {
    const closedAnchor = getClosedHeaderAnchor()
    anchorX.value = closedAnchor.x
    anchorY.value = closedAnchor.y
  } else if (props.toggleKey === 'footer') {
    const footerAnchor = getFooterAnchor()
    anchorX.value = footerAnchor.x
    anchorY.value = footerAnchor.y
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

function lockToAnchor() {
  x.value = anchorX.value
  y.value = anchorY.value
  vx.value = 0
  vy.value = 0
  wingLift.value = 0
  wingAngle.value = 8
  idlePose.value = 0
  bodyScale.value = 0.9
  rotation.value = 90
  settleProgress.value = 1
  mode.value = 'perched'
}

function startSettling() {
  mode.value = 'settling'
  settleProgress.value = 0
  vx.value *= 0.2
  vy.value *= 0.2
}

function startFleeAndReturn() {
  const viewport = getViewportBounds()
  const flee = getFleePoint(viewport.width, viewport.height)

  disturbedUntil.value = Date.now() + 1800
  mode.value = 'fleeing'
  settleProgress.value = 0

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
  bodyScale.value = 1
  wingAngle.value = 24

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

function updateSettlingMotion() {
  const dx = anchorX.value - x.value
  const dy = anchorY.value - y.value
  const dist = Math.sqrt(dx * dx + dy * dy)

  x.value += dx * 0.22
  y.value += dy * 0.22

  settleProgress.value = clamp(settleProgress.value + 0.08, 0, 1)

  const settleScale =
    settleProgress.value < 0.7
      ? 1 - settleProgress.value * 0.08
      : 0.944 - (settleProgress.value - 0.7) * 0.1466667

  bodyScale.value = settleScale
  wingLift.value *= 0.7
  wingAngle.value += (8 - wingAngle.value) * 0.18
  idlePose.value *= 0.7
  rotation.value += (90 - rotation.value) * 0.16
  vx.value *= 0.5
  vy.value *= 0.5

  if (dist < 1.5 && settleProgress.value >= 1) {
    lockToAnchor()
  }
}

function updatePerchedMotion(now: number) {
  const time = now * 0.001
  const flutterGate = Math.sin(time * 0.5 + flutterSeed)

  x.value = anchorX.value
  y.value = anchorY.value
  vx.value = 0
  vy.value = 0
  bodyScale.value += (0.9 - bodyScale.value) * 0.18
  rotation.value += (90 - rotation.value) * 0.18
  idlePose.value = 0

  if (flutterGate > 0.992) {
    wingLift.value = Math.sin(time * 16) * 12
  } else {
    wingLift.value += (0 - wingLift.value) * 0.24
  }

  wingAngle.value += (8 - wingAngle.value) * 0.2
}

function updateTravelMotion(now: number) {
  const time = now * 0.001
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
  wingLift.value = Math.sin(time * (mode.value === 'fleeing' ? 18 : 14)) * 24
  idlePose.value = 0

  if (
    (mode.value === 'approaching' || mode.value === 'returning') &&
    dist < 18
  ) {
    startSettling()
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
  if (mode.value === 'perched') {
    updatePerchedMotion(now)
    return
  }

  if (mode.value === 'settling') {
    updateSettlingMotion()
    return
  }

  updateTravelMotion(now)
}

function tick(now: number) {
  updateMotion(now)
  animationFrameId.value = window.requestAnimationFrame(tick)
}

function handleResize() {
  syncAnchor(false)

  if (mode.value === 'perched') {
    lockToAnchor()
  }
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
  transition: transform 0.12s ease-out;
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
