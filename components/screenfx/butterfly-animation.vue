<!-- /components/content/screenfx/butterfly-animation.vue -->
<template>
  <div
    ref="stage"
    class="butterfly-animation pointer-events-none fixed inset-0 z-50 h-dvh w-dvw overflow-hidden"
    :class="`butterfly-animation--${profile.name}`"
    :data-butterfly-quality="profile.name"
    aria-hidden="true"
  >
    <div
      v-for="butterfly in butterflies"
      :key="butterfly.id"
      class="butterfly"
    >
      <div class="left-wing" :style="butterfly.wingStyle" />
      <div class="right-wing" :style="butterfly.wingStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { CSSProperties } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

type PerformanceProfileName = 'off' | 'low' | 'balanced' | 'high' | 'ultra'

interface PerformanceProfile {
  name: PerformanceProfileName
  count: number
  fps: number
  size: number
  speed: number
}

interface ButterflyParticle {
  id: number
  x: number
  y: number
  angle: number
  speed: number
  turnRate: number
  phase: number
  bob: number
  scale: number
  wingStyle: CSSProperties
}

interface NavigatorConnectionHints {
  saveData?: boolean
  effectiveType?: string
}

interface NavigatorPerformanceHints extends Navigator {
  deviceMemory?: number
  connection?: NavigatorConnectionHints
}

const PROFILES: Record<PerformanceProfileName, PerformanceProfile> = {
  off: { name: 'off', count: 0, fps: 0, size: 0, speed: 0 },
  low: { name: 'low', count: 5, fps: 24, size: 1.2, speed: 0.68 },
  balanced: { name: 'balanced', count: 24, fps: 30, size: 0.82, speed: 0.86 },
  high: { name: 'high', count: 56, fps: 45, size: 0.58, speed: 1 },
  ultra: { name: 'ultra', count: 100, fps: 60, size: 0.42, speed: 1.08 },
}

const PROFILE_ORDER: PerformanceProfileName[] = [
  'off',
  'low',
  'balanced',
  'high',
  'ultra',
]

const butterflyStore = useButterflyStore()
const stage = ref<HTMLElement | null>(null)
const profile = ref<PerformanceProfile>(PROFILES.balanced)
const butterflies = shallowRef<ButterflyParticle[]>([])

let butterflyElements: HTMLElement[] = []
let animationFrameId: number | null = null
let lastAnimationTime = 0
let lastRafTime = 0
let viewportWidth = 0
let viewportHeight = 0
let frameSamples: number[] = []
let hasBenchmarked = false
let rebuilding = false

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function detectPerformanceProfile(): PerformanceProfileName {
  const navigatorHints = navigator as NavigatorPerformanceHints
  const connection = navigatorHints.connection
  const cores = navigatorHints.hardwareConcurrency || 0
  const memory = navigatorHints.deviceMemory
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (reducedMotion || connection?.saveData) return 'off'
  if (connection?.effectiveType === 'slow-2g') return 'off'
  if (cores > 0 && cores <= 2 && (memory === undefined || memory <= 2)) {
    return 'off'
  }

  let score = 2

  if (cores >= 12) score += 2
  else if (cores >= 8) score += 1
  else if (cores > 0 && cores <= 4) score -= 1

  if (memory !== undefined) {
    if (memory >= 8) score += 1
    else if (memory <= 2) score -= 2
    else if (memory <= 4) score -= 1
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelLoad = window.innerWidth * window.innerHeight * pixelRatio ** 2

  if (pixelLoad >= 16_000_000) score -= 2
  else if (pixelLoad >= 8_000_000) score -= 1

  if (connection?.effectiveType === '2g') score -= 1

  if (score >= 5) return 'ultra'
  if (score >= 3) return 'high'
  if (score >= 2) return 'balanced'
  return 'low'
}

function createParticle(
  index: number,
  activeProfile: PerformanceProfile,
): ButterflyParticle {
  const primaryColor = butterflyStore.randomColor()
  const secondaryColor =
    Math.random() > 0.5
      ? butterflyStore.complementaryColor(primaryColor)
      : butterflyStore.analogousColor(primaryColor)
  const wingSpeed = Math.round(randomRange(360, 680))

  return {
    id: index,
    x: randomRange(0, viewportWidth),
    y: randomRange(0, viewportHeight),
    angle: randomRange(0, Math.PI * 2),
    speed: randomRange(24, 58) * activeProfile.speed,
    turnRate: randomRange(0.3, 0.9),
    phase: randomRange(0, Math.PI * 2),
    bob: randomRange(5, 14),
    scale: activeProfile.size * randomRange(0.72, 1.18),
    wingStyle: {
      background: `radial-gradient(circle at 30% 28%, ${primaryColor}, ${secondaryColor} 76%)`,
      animationDuration: `${wingSpeed}ms`,
    },
  }
}

function syncViewport(): void {
  viewportWidth = window.innerWidth
  viewportHeight = window.innerHeight
}

function cacheButterflyElements(): void {
  butterflyElements = stage.value
    ? Array.from(stage.value.querySelectorAll<HTMLElement>('.butterfly'))
    : []
}

function stopAnimation(): void {
  if (animationFrameId === null) return
  cancelAnimationFrame(animationFrameId)
  animationFrameId = null
}

function resetFrameTiming(): void {
  lastAnimationTime = 0
  lastRafTime = 0
}

function benchmarkFrame(rawDelta: number): number {
  if (hasBenchmarked || rawDelta <= 0 || rawDelta >= 250) return 0

  frameSamples.push(rawDelta)
  if (frameSamples.length < 45) return 0

  hasBenchmarked = true

  const average =
    frameSamples.reduce((total, delta) => total + delta, 0) /
    frameSamples.length
  const slowRatio =
    frameSamples.filter((delta) => delta > 24).length / frameSamples.length

  frameSamples = []

  if (average > 34 || slowRatio > 0.4) return 2
  if (average > 23 || slowRatio > 0.18) return 1
  return 0
}

function getDowngradedProfile(steps: number): PerformanceProfileName {
  const currentIndex = PROFILE_ORDER.indexOf(profile.value.name)
  return PROFILE_ORDER[Math.max(0, currentIndex - steps)] || 'off'
}

async function applyProfile(name: PerformanceProfileName): Promise<void> {
  if (profile.value.name === name && butterflies.value.length) return

  rebuilding = true
  stopAnimation()
  profile.value = PROFILES[name]
  butterflies.value = Array.from({ length: profile.value.count }, (_, index) =>
    createParticle(index, profile.value),
  )

  await nextTick()
  cacheButterflyElements()
  updateParticles(performance.now(), 0)
  resetFrameTiming()
  rebuilding = false
  startAnimation()
}

function updateParticles(now: number, deltaSeconds: number): void {
  const margin = 80

  for (let index = 0; index < butterflies.value.length; index += 1) {
    const butterfly = butterflies.value[index]
    const element = butterflyElements[index]
    if (!butterfly || !element) continue

    const wander = Math.sin(now * 0.00042 + butterfly.phase)
    butterfly.angle += wander * butterfly.turnRate * deltaSeconds
    butterfly.x += Math.cos(butterfly.angle) * butterfly.speed * deltaSeconds
    butterfly.y +=
      Math.sin(butterfly.angle) * butterfly.speed * deltaSeconds +
      Math.sin(now * 0.0012 + butterfly.phase) *
        butterfly.bob *
        deltaSeconds

    if (butterfly.x < -margin) butterfly.x = viewportWidth + margin
    if (butterfly.x > viewportWidth + margin) butterfly.x = -margin
    if (butterfly.y < -margin) butterfly.y = viewportHeight + margin
    if (butterfly.y > viewportHeight + margin) butterfly.y = -margin

    const heading = (butterfly.angle * 180) / Math.PI + 90
    const tilt = Math.cos(butterfly.angle) >= 0 ? 118 : 32

    element.style.transform = `translate3d(${butterfly.x}px, ${butterfly.y}px, 0) rotateZ(${heading}deg) rotate3d(1, 0.5, 0, ${tilt}deg) scale(${butterfly.scale})`
  }
}

function animate(now: number): void {
  animationFrameId = null

  if (rebuilding || document.hidden || profile.value.count === 0) return

  const rawDelta = lastRafTime ? now - lastRafTime : 0
  lastRafTime = now

  const downgradeSteps = benchmarkFrame(rawDelta)
  if (downgradeSteps > 0) {
    void applyProfile(getDowngradedProfile(downgradeSteps))
    return
  }

  const frameInterval = 1000 / profile.value.fps
  const elapsed = lastAnimationTime ? now - lastAnimationTime : frameInterval

  if (elapsed >= frameInterval) {
    const deltaSeconds = Math.min(elapsed, 50) / 1000
    lastAnimationTime = now - (elapsed % frameInterval)
    updateParticles(now, deltaSeconds)
  }

  animationFrameId = requestAnimationFrame(animate)
}

function startAnimation(): void {
  if (
    animationFrameId !== null ||
    rebuilding ||
    document.hidden ||
    profile.value.count === 0
  ) {
    return
  }

  animationFrameId = requestAnimationFrame(animate)
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    stopAnimation()
    return
  }

  resetFrameTiming()
  startAnimation()
}

onMounted(async () => {
  syncViewport()
  await applyProfile(detectPerformanceProfile())

  window.addEventListener('resize', syncViewport, { passive: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopAnimation()
  window.removeEventListener('resize', syncViewport)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
@keyframes flutter-left {
  0%,
  100% {
    transform: rotateY(18deg);
  }

  50% {
    transform: rotateY(72deg);
  }
}

@keyframes flutter-right {
  0%,
  100% {
    transform: rotateY(-18deg);
  }

  50% {
    transform: rotateY(-72deg);
  }
}

.butterfly-animation {
  contain: strict;
  transform: translateZ(0);
}

.butterfly {
  position: absolute;
  left: 0;
  top: 0;
  width: 70px;
  height: 70px;
  opacity: 0.74;
  pointer-events: none;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  contain: layout paint style;
  will-change: transform;
}

.left-wing,
.right-wing {
  position: absolute;
  top: 12px;
  width: 28px;
  height: 42px;
  border-radius: 72% 42% 68% 38%;
  opacity: 0.78;
  backface-visibility: hidden;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  will-change: transform;
}

.left-wing {
  left: 7px;
  transform-origin: 100% 52%;
  animation-name: flutter-left;
}

.right-wing {
  left: 35px;
  border-radius: 42% 72% 38% 68%;
  transform-origin: 0 52%;
  animation-name: flutter-right;
}

.butterfly-animation--low .left-wing,
.butterfly-animation--low .right-wing {
  animation-timing-function: steps(4, end);
}

.butterfly-animation--ultra .butterfly {
  opacity: 0.68;
}

@media (prefers-reduced-motion: reduce) {
  .butterfly {
    display: none;
  }
}
</style>
