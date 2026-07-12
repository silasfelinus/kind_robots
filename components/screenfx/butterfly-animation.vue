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
  low: { name: 'low', count: 8, fps: 30, size: 0.94, speed: 0.78 },
  balanced: { name: 'balanced', count: 28, fps: 60, size: 0.82, speed: 0.94 },
  high: { name: 'high', count: 52, fps: 60, size: 0.72, speed: 1.05 },
  ultra: { name: 'ultra', count: 76, fps: 60, size: 0.64, speed: 1.12 }
}

const PROFILE_ORDER: PerformanceProfileName[] = [
  'off',
  'low',
  'balanced',
  'high',
  'ultra'
]

const SAMPLE_SIZE = 30
const PROFILE_CHANGE_COOLDOWN_MS = 450
const STARTUP_GRACE_MS = 650
const BAD_WINDOWS_BEFORE_DOWNGRADE = 2
const HEALTHY_WINDOWS_BEFORE_UPGRADE = 2
const BUTTERFLY_HALF_WIDTH = 32
const BUTTERFLY_HALF_HEIGHT = 29

const butterflyStore = useButterflyStore()
const stage = ref<HTMLElement | null>(null)
const profile = ref<PerformanceProfile>(PROFILES.balanced)
const butterflies = shallowRef<ButterflyParticle[]>([])

let butterflyElements: HTMLElement[] = []
let animationFrameId: number | null = null
let resizeTimeoutId: number | null = null
let lastAnimationTime = 0
let lastRafTime = 0
let lastProfileChangeAt = 0
let animationStartedAt = 0
let viewportWidth = 0
let viewportHeight = 0
let frameSamples: number[] = []
let healthySampleWindows = 0
let badSampleWindows = 0
let rebuilding = false
let hardwareCeiling: PerformanceProfileName = 'balanced'

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function profileIndex(name: PerformanceProfileName): number {
  return PROFILE_ORDER.indexOf(name)
}

function clampProfileToCeiling(
  name: PerformanceProfileName,
  ceiling: PerformanceProfileName
): PerformanceProfileName {
  return PROFILE_ORDER[Math.min(profileIndex(name), profileIndex(ceiling))] || 'off'
}

function shiftProfile(
  name: PerformanceProfileName,
  steps: number
): PerformanceProfileName {
  const nextIndex = Math.min(
    PROFILE_ORDER.length - 1,
    Math.max(0, profileIndex(name) + steps)
  )

  return PROFILE_ORDER[nextIndex] || 'off'
}

function detectPerformanceProfile(): PerformanceProfileName {
  const navigatorHints = navigator as NavigatorPerformanceHints
  const connection = navigatorHints.connection
  const cores = navigatorHints.hardwareConcurrency || 0
  const memory = navigatorHints.deviceMemory
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (reducedMotion || connection?.saveData) return 'off'
  if (connection?.effectiveType === 'slow-2g') return 'off'
  if (cores > 0 && cores <= 2 && (memory === undefined || memory <= 2)) {
    return 'low'
  }

  let score = 2

  if (cores >= 12) score += 3
  else if (cores >= 8) score += 2
  else if (cores >= 6) score += 1
  else if (cores > 0 && cores <= 4) score -= 1

  if (memory !== undefined) {
    if (memory >= 8) score += 1
    else if (memory <= 2) score -= 2
    else if (memory <= 4) score -= 1
  }

  const cssPixelArea = window.innerWidth * window.innerHeight
  const pixelRatioCost = Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.5)
  const renderLoad = cssPixelArea * pixelRatioCost

  if (renderLoad >= 20_000_000) score -= 2
  else if (renderLoad >= 12_000_000) score -= 1

  if (connection?.effectiveType === '2g') score -= 1

  if (score >= 5) return 'ultra'
  if (score >= 3) return 'high'
  if (score >= 2) return 'balanced'
  return 'low'
}

function getStartupProfile(
  ceiling: PerformanceProfileName
): PerformanceProfileName {
  if (ceiling === 'ultra') return 'high'
  return ceiling
}

function createParticle(
  index: number,
  activeProfile: PerformanceProfile
): ButterflyParticle {
  const primaryColor = butterflyStore.randomColor()
  const secondaryColor =
    Math.random() > 0.5
      ? butterflyStore.complementaryColor(primaryColor)
      : butterflyStore.analogousColor(primaryColor)
  const wingSpeed = Math.round(randomRange(320, 560))

  return {
    id: index,
    x: randomRange(0, viewportWidth),
    y: randomRange(0, viewportHeight),
    angle: randomRange(0, Math.PI * 2),
    speed: randomRange(26, 62) * activeProfile.speed,
    turnRate: randomRange(0.28, 0.78),
    phase: randomRange(0, Math.PI * 2),
    bob: randomRange(4, 11),
    scale: activeProfile.size * randomRange(0.8, 1.14),
    wingStyle: {
      background: `radial-gradient(ellipse at 30% 30%, ${primaryColor}, ${secondaryColor} 78%)`,
      animationDuration: `${wingSpeed}ms`
    }
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
  frameSamples = []
  healthySampleWindows = 0
  badSampleWindows = 0
}

function getPercentile(samples: number[], percentile: number): number {
  if (!samples.length) return 0

  const ordered = [...samples].sort((a, b) => a - b)
  const index = Math.min(
    ordered.length - 1,
    Math.floor(ordered.length * percentile)
  )

  return ordered[index] || 0
}

function samplePerformance(rawDelta: number, now: number): number {
  if (rawDelta <= 0) return 0
  if (now - animationStartedAt < STARTUP_GRACE_MS) return 0
  if (now - lastProfileChangeAt < PROFILE_CHANGE_COOLDOWN_MS) return 0

  if (rawDelta >= 180) {
    frameSamples = []
    healthySampleWindows = 0
    badSampleWindows += 1

    if (badSampleWindows < BAD_WINDOWS_BEFORE_DOWNGRADE) return 0

    badSampleWindows = 0
    return -1
  }

  frameSamples.push(rawDelta)
  if (frameSamples.length < SAMPLE_SIZE) return 0

  const samples = frameSamples
  frameSamples = []

  const currentBudget = 1000 / profile.value.fps
  const average =
    samples.reduce((total, delta) => total + delta, 0) / samples.length
  const p90 = getPercentile(samples, 0.9)
  const longFrameRatio =
    samples.filter((delta) => delta > currentBudget * 1.8).length /
    samples.length

  const severe =
    average > currentBudget * 1.9 ||
    p90 > currentBudget * 2.4 ||
    longFrameRatio > 0.18
  const struggling =
    average > currentBudget * 1.45 ||
    p90 > currentBudget * 1.85 ||
    longFrameRatio > 0.1

  if (severe || struggling) {
    healthySampleWindows = 0
    badSampleWindows += severe ? 2 : 1

    if (badSampleWindows < BAD_WINDOWS_BEFORE_DOWNGRADE) return 0

    badSampleWindows = 0
    return -1
  }

  badSampleWindows = 0

  const nextProfileName = shiftProfile(profile.value.name, 1)
  if (
    nextProfileName === profile.value.name ||
    profileIndex(nextProfileName) > profileIndex(hardwareCeiling)
  ) {
    healthySampleWindows = 0
    return 0
  }

  const nextBudget = 1000 / PROFILES[nextProfileName].fps
  const canSustainNextProfile =
    average <= nextBudget * 1.2 &&
    p90 <= nextBudget * 1.55 &&
    longFrameRatio <= 0.04

  if (!canSustainNextProfile) {
    healthySampleWindows = 0
    return 0
  }

  healthySampleWindows += 1
  if (healthySampleWindows < HEALTHY_WINDOWS_BEFORE_UPGRADE) return 0

  healthySampleWindows = 0
  return 1
}

async function applyProfile(name: PerformanceProfileName): Promise<void> {
  const nextProfile = PROFILES[name]

  if (
    profile.value.name === name &&
    butterflies.value.length === nextProfile.count
  ) {
    return
  }

  rebuilding = true
  stopAnimation()

  const previousProfile = profile.value
  const retainedParticles = butterflies.value.slice(0, nextProfile.count)

  if (
    retainedParticles.length &&
    previousProfile.size > 0 &&
    previousProfile.speed > 0
  ) {
    const sizeRatio = nextProfile.size / previousProfile.size
    const speedRatio = nextProfile.speed / previousProfile.speed

    for (const butterfly of retainedParticles) {
      butterfly.scale *= sizeRatio
      butterfly.speed *= speedRatio
    }
  }

  const nextParticles = [...retainedParticles]

  for (
    let index = nextParticles.length;
    index < nextProfile.count;
    index += 1
  ) {
    nextParticles.push(createParticle(index, nextProfile))
  }

  profile.value = nextProfile
  butterflies.value = nextParticles

  await nextTick()
  cacheButterflyElements()
  updateParticles(performance.now(), 0)
  resetFrameTiming()
  lastProfileChangeAt = performance.now()
  rebuilding = false
  startAnimation()
}

function lowerProfile(): void {
  if (profile.value.name === 'off' || profile.value.name === 'low') return
  void applyProfile(shiftProfile(profile.value.name, -1))
}

function raiseProfile(): void {
  const nextProfileName = clampProfileToCeiling(
    shiftProfile(profile.value.name, 1),
    hardwareCeiling
  )

  if (nextProfileName === profile.value.name) return
  void applyProfile(nextProfileName)
}

function updateParticles(now: number, deltaSeconds: number): void {
  const margin = 72

  for (let index = 0; index < butterflies.value.length; index += 1) {
    const butterfly = butterflies.value[index]
    const element = butterflyElements[index]
    if (!butterfly || !element) continue

    const wander = Math.sin(now * 0.00038 + butterfly.phase)
    butterfly.angle += wander * butterfly.turnRate * deltaSeconds
    butterfly.x += Math.cos(butterfly.angle) * butterfly.speed * deltaSeconds
    butterfly.y +=
      Math.sin(butterfly.angle) * butterfly.speed * deltaSeconds +
      Math.sin(now * 0.0011 + butterfly.phase) *
        butterfly.bob *
        deltaSeconds

    if (butterfly.x < -margin) butterfly.x = viewportWidth + margin
    if (butterfly.x > viewportWidth + margin) butterfly.x = -margin
    if (butterfly.y < -margin) butterfly.y = viewportHeight + margin
    if (butterfly.y > viewportHeight + margin) butterfly.y = -margin

    const heading = (butterfly.angle * 180) / Math.PI + 90
    const pitch = 30 + Math.sin(now * 0.00065 + butterfly.phase) * 4
    const bank = Math.sin(now * 0.0009 + butterfly.phase) * 6

    element.style.transform = `translate3d(${butterfly.x - BUTTERFLY_HALF_WIDTH}px, ${butterfly.y - BUTTERFLY_HALF_HEIGHT}px, 0) rotateZ(${heading}deg) rotateX(${pitch}deg) rotateY(${bank}deg) scale(${butterfly.scale})`
  }
}

function animate(now: number): void {
  animationFrameId = null

  if (rebuilding || document.hidden || profile.value.count === 0) return

  const rawDelta = lastRafTime ? now - lastRafTime : 0
  lastRafTime = now

  const profileAdjustment = samplePerformance(rawDelta, now)

  if (profileAdjustment < 0) {
    lowerProfile()
    return
  }

  if (profileAdjustment > 0) {
    raiseProfile()
    return
  }

  if (profile.value.fps >= 55) {
    const deltaSeconds = Math.min(rawDelta || 1000 / 60, 34) / 1000
    lastAnimationTime = now
    updateParticles(now, deltaSeconds)
  } else {
    const frameInterval = 1000 / profile.value.fps
    const elapsed = lastAnimationTime ? now - lastAnimationTime : frameInterval

    if (elapsed >= frameInterval) {
      const deltaSeconds = Math.min(elapsed, 50) / 1000
      lastAnimationTime = now - (elapsed % frameInterval)
      updateParticles(now, deltaSeconds)
    }
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
  animationStartedAt = performance.now()
  startAnimation()
}

function handleResize(): void {
  syncViewport()

  if (resizeTimeoutId !== null) {
    window.clearTimeout(resizeTimeoutId)
  }

  resizeTimeoutId = window.setTimeout(() => {
    resizeTimeoutId = null
    hardwareCeiling = detectPerformanceProfile()

    if (profileIndex(profile.value.name) > profileIndex(hardwareCeiling)) {
      void applyProfile(hardwareCeiling)
    }
  }, 150)
}

onMounted(async () => {
  syncViewport()
  hardwareCeiling = detectPerformanceProfile()
  animationStartedAt = performance.now()
  await applyProfile(getStartupProfile(hardwareCeiling))

  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopAnimation()

  if (resizeTimeoutId !== null) {
    window.clearTimeout(resizeTimeoutId)
    resizeTimeoutId = null
  }

  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
@keyframes flutter-left {
  0%,
  100% {
    transform: rotateY(10deg);
  }

  50% {
    transform: rotateY(64deg);
  }
}

@keyframes flutter-right {
  0%,
  100% {
    transform: rotateY(-10deg);
  }

  50% {
    transform: rotateY(-64deg);
  }
}

.butterfly-animation {
  contain: strict;
  perspective: 900px;
  transform: translateZ(0);
}

.butterfly {
  position: absolute;
  left: 0;
  top: 0;
  width: 64px;
  height: 58px;
  opacity: 0.76;
  pointer-events: none;
  transform-origin: center;
  transform-style: preserve-3d;
  contain: layout paint style;
  will-change: transform;
}

.butterfly::after {
  position: absolute;
  top: 17px;
  left: 30px;
  z-index: 2;
  width: 4px;
  height: 25px;
  border-radius: 999px;
  background: rgba(12, 12, 18, 0.78);
  content: '';
  transform: translateZ(1px);
}

.left-wing,
.right-wing {
  position: absolute;
  top: 11px;
  width: 29px;
  height: 32px;
  opacity: 0.82;
  backface-visibility: hidden;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-fill-mode: both;
  will-change: transform;
}

.left-wing {
  left: 3px;
  border-radius: 72% 34% 62% 42% / 58% 42% 64% 38%;
  transform-origin: 100% 52%;
  animation-name: flutter-left;
}

.right-wing {
  left: 32px;
  border-radius: 34% 72% 42% 62% / 42% 58% 38% 64%;
  transform-origin: 0 52%;
  animation-name: flutter-right;
}

.butterfly-animation--ultra .butterfly {
  opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {
  .butterfly {
    display: none;
  }
}
</style>
