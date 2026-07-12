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
  low: { name: 'low', count: 6, fps: 24, size: 0.96, speed: 0.72 },
  balanced: { name: 'balanced', count: 18, fps: 30, size: 0.84, speed: 0.88 },
  high: { name: 'high', count: 32, fps: 45, size: 0.74, speed: 1 },
  ultra: { name: 'ultra', count: 48, fps: 60, size: 0.66, speed: 1.06 },
}

const PROFILE_ORDER: PerformanceProfileName[] = [
  'off',
  'low',
  'balanced',
  'high',
  'ultra',
]

const QUALITY_STORAGE_KEY = 'kind-loader-butterfly-quality'
const SAMPLE_SIZE = 30
const PROFILE_CHANGE_COOLDOWN_MS = 350
const BUTTERFLY_HALF_SIZE = 35

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
let viewportWidth = 0
let viewportHeight = 0
let frameSamples: number[] = []
let healthySampleWindows = 0
let rebuilding = false
let profileCeiling: PerformanceProfileName = 'balanced'

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function profileIndex(name: PerformanceProfileName): number {
  return PROFILE_ORDER.indexOf(name)
}

function isPerformanceProfileName(
  value: string | null,
): value is PerformanceProfileName {
  return value !== null && PROFILE_ORDER.includes(value as PerformanceProfileName)
}

function clampProfileToCeiling(
  name: PerformanceProfileName,
  ceiling: PerformanceProfileName,
): PerformanceProfileName {
  return PROFILE_ORDER[Math.min(profileIndex(name), profileIndex(ceiling))] || 'off'
}

function shiftProfile(
  name: PerformanceProfileName,
  steps: number,
): PerformanceProfileName {
  const nextIndex = Math.min(
    PROFILE_ORDER.length - 1,
    Math.max(0, profileIndex(name) + steps),
  )

  return PROFILE_ORDER[nextIndex] || 'off'
}

function readStoredProfileLimit(): PerformanceProfileName | null {
  try {
    const stored = window.sessionStorage.getItem(QUALITY_STORAGE_KEY)
    return isPerformanceProfileName(stored) ? stored : null
  } catch {
    return null
  }
}

function storeProfileLimit(name: PerformanceProfileName): void {
  try {
    window.sessionStorage.setItem(QUALITY_STORAGE_KEY, name)
  } catch {
    return
  }
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

  if (cores >= 12) score += 1
  else if (cores >= 8) score += 1
  else if (cores > 0 && cores <= 4) score -= 1

  if (memory !== undefined) {
    if (memory >= 8) score += 1
    else if (memory <= 2) score -= 2
    else if (memory <= 4) score -= 1
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelLoad = window.innerWidth * window.innerHeight * pixelRatio ** 2

  if (pixelLoad >= 12_000_000) score -= 2
  else if (pixelLoad >= 6_000_000) score -= 1

  if (connection?.effectiveType === '2g') score -= 1

  let detected: PerformanceProfileName

  if (score >= 4) detected = 'ultra'
  else if (score >= 3) detected = 'high'
  else if (score >= 2) detected = 'balanced'
  else detected = 'low'

  const storedLimit = readStoredProfileLimit()
  return storedLimit
    ? clampProfileToCeiling(detected, storedLimit)
    : detected
}

function getWarmupProfile(
  ceiling: PerformanceProfileName,
): PerformanceProfileName {
  if (ceiling === 'off' || ceiling === 'low') return ceiling
  return clampProfileToCeiling('balanced', ceiling)
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
  const wingSpeed = Math.round(randomRange(480, 780))

  return {
    id: index,
    x: randomRange(0, viewportWidth),
    y: randomRange(0, viewportHeight),
    angle: randomRange(0, Math.PI * 2),
    speed: randomRange(24, 58) * activeProfile.speed,
    turnRate: randomRange(0.3, 0.9),
    phase: randomRange(0, Math.PI * 2),
    bob: randomRange(5, 14),
    scale: activeProfile.size * randomRange(0.78, 1.16),
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
  frameSamples = []
  healthySampleWindows = 0
}

function getPercentile(samples: number[], percentile: number): number {
  if (!samples.length) return 0

  const ordered = [...samples].sort((a, b) => a - b)
  const index = Math.min(
    ordered.length - 1,
    Math.floor(ordered.length * percentile),
  )

  return ordered[index] || 0
}

function samplePerformance(rawDelta: number, now: number): number {
  if (rawDelta <= 0) return 0
  if (now - lastProfileChangeAt < PROFILE_CHANGE_COOLDOWN_MS) return 0

  if (rawDelta >= 180) {
    frameSamples = []
    healthySampleWindows = 0
    return -1
  }

  frameSamples.push(Math.min(rawDelta, 180))
  if (frameSamples.length < SAMPLE_SIZE) return 0

  const samples = frameSamples
  frameSamples = []

  const currentBudget = 1000 / profile.value.fps
  const average =
    samples.reduce((total, delta) => total + delta, 0) / samples.length
  const p90 = getPercentile(samples, 0.9)
  const slowRatio =
    samples.filter((delta) => delta > currentBudget * 1.45).length /
    samples.length
  const severeRatio =
    samples.filter((delta) => delta > currentBudget * 2.2).length /
    samples.length

  if (
    severeRatio > 0.12 ||
    average > currentBudget * 1.75 ||
    p90 > currentBudget * 2.4
  ) {
    healthySampleWindows = 0
    return -2
  }

  if (
    slowRatio > 0.22 ||
    average > currentBudget * 1.28 ||
    p90 > currentBudget * 1.7
  ) {
    healthySampleWindows = 0
    return -1
  }

  const nextProfileName = shiftProfile(profile.value.name, 1)
  if (
    nextProfileName === profile.value.name ||
    profileIndex(nextProfileName) > profileIndex(profileCeiling)
  ) {
    healthySampleWindows = 0
    return 0
  }

  const nextBudget = 1000 / PROFILES[nextProfileName].fps
  const canSustainNextProfile =
    average <= nextBudget * 1.08 && p90 <= nextBudget * 1.3

  if (!canSustainNextProfile) {
    healthySampleWindows = 0
    return 0
  }

  healthySampleWindows += 1
  if (healthySampleWindows < 1) return 0

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
  const previousParticles = butterflies.value
  const retainedParticles = previousParticles.slice(0, nextProfile.count)

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

function lowerAndLockProfile(steps: number): void {
  const nextProfileName = shiftProfile(profile.value.name, -Math.abs(steps))
  profileCeiling = clampProfileToCeiling(profileCeiling, nextProfileName)
  storeProfileLimit(profileCeiling)
  void applyProfile(nextProfileName)
}

function raiseProfile(steps: number): void {
  const requestedProfile = shiftProfile(profile.value.name, Math.abs(steps))
  const nextProfileName = clampProfileToCeiling(
    requestedProfile,
    profileCeiling,
  )

  if (nextProfileName === profile.value.name) return
  void applyProfile(nextProfileName)
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
    const pitch = 48 + Math.sin(now * 0.0007 + butterfly.phase) * 6
    const bank = Math.sin(now * 0.001 + butterfly.phase) * 10

    element.style.transform = `translate3d(${butterfly.x - BUTTERFLY_HALF_SIZE}px, ${butterfly.y - BUTTERFLY_HALF_SIZE}px, 0) rotateZ(${heading}deg) rotateX(${pitch}deg) rotateY(${bank}deg) scale(${butterfly.scale})`
  }
}

function animate(now: number): void {
  animationFrameId = null

  if (rebuilding || document.hidden || profile.value.count === 0) return

  const rawDelta = lastRafTime ? now - lastRafTime : 0
  lastRafTime = now

  const profileAdjustment = samplePerformance(rawDelta, now)

  if (profileAdjustment < 0) {
    lowerAndLockProfile(Math.abs(profileAdjustment))
    return
  }

  if (profileAdjustment > 0) {
    raiseProfile(profileAdjustment)
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

function handleResize(): void {
  syncViewport()

  if (resizeTimeoutId !== null) {
    window.clearTimeout(resizeTimeoutId)
  }

  resizeTimeoutId = window.setTimeout(() => {
    resizeTimeoutId = null
    const detectedCeiling = detectPerformanceProfile()

    if (profileIndex(detectedCeiling) >= profileIndex(profileCeiling)) return

    profileCeiling = detectedCeiling
    storeProfileLimit(profileCeiling)

    if (profileIndex(profile.value.name) > profileIndex(profileCeiling)) {
      void applyProfile(profileCeiling)
    }
  }, 150)
}

onMounted(async () => {
  syncViewport()
  profileCeiling = detectPerformanceProfile()
  await applyProfile(getWarmupProfile(profileCeiling))

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
    transform: rotateY(16deg);
  }

  50% {
    transform: rotateY(66deg);
  }
}

@keyframes flutter-right {
  0%,
  100% {
    transform: rotateY(-16deg);
  }

  50% {
    transform: rotateY(-66deg);
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
  transform-origin: center;
  transform-style: preserve-3d;
  backface-visibility: visible;
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
  backface-visibility: visible;
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

.butterfly-animation--ultra .butterfly {
  opacity: 0.68;
}

@media (prefers-reduced-motion: reduce) {
  .butterfly {
    display: none;
  }
}
</style>
