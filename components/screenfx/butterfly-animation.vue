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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from 'vue'
import type { CSSProperties } from 'vue'
import { useAnimationPreferenceStore } from '@/stores/animationPreferenceStore'
import { useButterflyStore } from '@/stores/butterflyStore'

type AdaptiveProfileName = 'off' | 'low' | 'balanced' | 'high' | 'ultra'
type PerformanceProfileName = AdaptiveProfileName | 'custom'

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
  flapVariance: number
  fadePhase: number
  fadeVariance: number
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

const PROFILE_ORDER: AdaptiveProfileName[] = [
  'off',
  'low',
  'balanced',
  'high',
  'ultra'
]

const PROFILE_COUNT_RATIOS: Record<AdaptiveProfileName, number> = {
  off: 0,
  low: 0.12,
  balanced: 0.38,
  high: 0.7,
  ultra: 1
}

const PROFILE_SIZE_RATIOS: Record<AdaptiveProfileName, number> = {
  off: 0,
  low: 1.14,
  balanced: 1,
  high: 0.9,
  ultra: 0.82
}

const PROFILE_SPEED_RATIOS: Record<AdaptiveProfileName, number> = {
  off: 0,
  low: 0.76,
  balanced: 0.92,
  high: 1.02,
  ultra: 1.1
}

const SAMPLE_SIZE = 36
const PROFILE_CHANGE_COOLDOWN_MS = 600
const STARTUP_GRACE_MS = 750
const BAD_WINDOWS_BEFORE_DOWNGRADE = 3
const HEALTHY_WINDOWS_BEFORE_UPGRADE = 2
const BUTTERFLY_HALF_WIDTH = 32
const BUTTERFLY_HALF_HEIGHT = 29

const butterflyStore = useButterflyStore()
const preferenceStore = useAnimationPreferenceStore()
const stage = ref<HTMLElement | null>(null)
const profile = ref<PerformanceProfile>({
  name: 'custom',
  count: 0,
  fps: 60,
  size: 0.82,
  speed: 1
})
const butterflies = shallowRef<ButterflyParticle[]>([])

const settings = computed(() => preferenceStore.butterflies)

let butterflyElements: HTMLElement[] = []
let animationFrameId: number | null = null
let resizeTimeoutId: number | null = null
let settingsTimeoutId: number | null = null
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
let mounted = false
let nextParticleId = 0
let hardwareCeiling: AdaptiveProfileName = 'balanced'

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function profileIndex(name: AdaptiveProfileName): number {
  return PROFILE_ORDER.indexOf(name)
}

function shiftProfile(
  name: AdaptiveProfileName,
  steps: number
): AdaptiveProfileName {
  const nextIndex = Math.min(
    PROFILE_ORDER.length - 1,
    Math.max(0, profileIndex(name) + steps)
  )

  return PROFILE_ORDER[nextIndex] || 'off'
}

function clampProfileToCeiling(
  name: AdaptiveProfileName,
  ceiling: AdaptiveProfileName
): AdaptiveProfileName {
  return PROFILE_ORDER[Math.min(profileIndex(name), profileIndex(ceiling))] || 'off'
}

function respectsReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function detectPerformanceProfile(): AdaptiveProfileName {
  const navigatorHints = navigator as NavigatorPerformanceHints
  const connection = navigatorHints.connection
  const cores = navigatorHints.hardwareConcurrency || 0
  const memory = navigatorHints.deviceMemory

  if (respectsReducedMotion()) return 'off'
  if (connection?.saveData || connection?.effectiveType === 'slow-2g') {
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

function getAdaptiveCount(name: AdaptiveProfileName): number {
  const maximum = Math.max(0, Math.round(settings.value.count))
  if (name === 'off' || maximum === 0) return 0

  const minimums: Record<AdaptiveProfileName, number> = {
    off: 0,
    low: 4,
    balanced: 12,
    high: 24,
    ultra: 1
  }

  return Math.min(
    maximum,
    Math.max(Math.min(minimums[name], maximum), Math.round(maximum * PROFILE_COUNT_RATIOS[name]))
  )
}

function getAdaptiveFps(name: AdaptiveProfileName): number {
  const requested = Math.max(15, settings.value.fps)
  if (name === 'off') return 0
  if (name === 'low') return Math.min(requested, 30)
  if (name === 'balanced') return Math.min(requested, 60)
  return requested
}

function buildAdaptiveProfile(name: AdaptiveProfileName): PerformanceProfile {
  return {
    name,
    count: getAdaptiveCount(name),
    fps: getAdaptiveFps(name),
    size: settings.value.size * PROFILE_SIZE_RATIOS[name],
    speed: settings.value.movementSpeed * PROFILE_SPEED_RATIOS[name]
  }
}

function buildCustomProfile(): PerformanceProfile {
  return {
    name: 'custom',
    count: respectsReducedMotion() ? 0 : Math.max(0, Math.round(settings.value.count)),
    fps: Math.max(15, settings.value.fps),
    size: settings.value.size,
    speed: settings.value.movementSpeed
  }
}

function createWingStyle(flapVariance: number): CSSProperties {
  return {
    background: '',
    animationDuration: `${Math.round(settings.value.flapSpeedMs * flapVariance)}ms`
  }
}

function createParticle(activeProfile: PerformanceProfile): ButterflyParticle {
  const primaryColor = butterflyStore.randomColor()
  const secondaryColor =
    Math.random() > 0.5
      ? butterflyStore.complementaryColor(primaryColor)
      : butterflyStore.analogousColor(primaryColor)
  const flapVariance = randomRange(0.78, 1.22)

  return {
    id: nextParticleId++,
    x: randomRange(0, viewportWidth),
    y: randomRange(0, viewportHeight),
    angle: randomRange(0, Math.PI * 2),
    speed: randomRange(26, 62) * activeProfile.speed,
    turnRate: randomRange(0.28, 0.78),
    phase: randomRange(0, Math.PI * 2),
    bob: randomRange(4, 11),
    scale: activeProfile.size * randomRange(0.8, 1.14),
    flapVariance,
    fadePhase: randomRange(0, Math.PI * 2),
    fadeVariance: randomRange(0.72, 1.34),
    wingStyle: {
      ...createWingStyle(flapVariance),
      background: `radial-gradient(ellipse at 30% 30%, ${primaryColor}, ${secondaryColor} 78%)`
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

function currentAdaptiveProfileName(): AdaptiveProfileName | null {
  return profile.value.name === 'custom' ? null : profile.value.name
}

function samplePerformance(rawDelta: number, now: number): number {
  const adaptiveName = currentAdaptiveProfileName()

  if (!settings.value.adaptive || !adaptiveName) return 0
  if (adaptiveName === 'off') return 0
  if (rawDelta <= 0) return 0
  if (now - animationStartedAt < STARTUP_GRACE_MS) return 0
  if (now - lastProfileChangeAt < PROFILE_CHANGE_COOLDOWN_MS) return 0

  if (rawDelta >= 220) {
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

  const currentBudget = Math.max(1000 / Math.max(profile.value.fps, 1), 1000 / 60)
  const average =
    samples.reduce((total, delta) => total + delta, 0) / samples.length
  const p90 = getPercentile(samples, 0.9)
  const longFrameRatio =
    samples.filter((delta) => delta > currentBudget * 1.9).length /
    samples.length

  const severe =
    average > currentBudget * 2 ||
    p90 > currentBudget * 2.6 ||
    longFrameRatio > 0.2
  const struggling =
    average > currentBudget * 1.55 ||
    p90 > currentBudget * 2 ||
    longFrameRatio > 0.12

  if (severe || struggling) {
    healthySampleWindows = 0
    badSampleWindows += severe ? 2 : 1

    if (badSampleWindows < BAD_WINDOWS_BEFORE_DOWNGRADE) return 0

    badSampleWindows = 0
    return -1
  }

  badSampleWindows = 0

  const nextProfileName = shiftProfile(adaptiveName, 1)
  if (
    nextProfileName === adaptiveName ||
    profileIndex(nextProfileName) > profileIndex(hardwareCeiling)
  ) {
    healthySampleWindows = 0
    return 0
  }

  const nextProfile = buildAdaptiveProfile(nextProfileName)
  const nextBudget = Math.max(1000 / Math.max(nextProfile.fps, 1), 1000 / 60)
  const canSustainNextProfile =
    average <= nextBudget * 1.25 &&
    p90 <= nextBudget * 1.65 &&
    longFrameRatio <= 0.06

  if (!canSustainNextProfile) {
    healthySampleWindows = 0
    return 0
  }

  healthySampleWindows += 1
  if (healthySampleWindows < HEALTHY_WINDOWS_BEFORE_UPGRADE) return 0

  healthySampleWindows = 0
  return 1
}

async function applyProfile(nextProfile: PerformanceProfile): Promise<void> {
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
      butterfly.wingStyle = {
        ...butterfly.wingStyle,
        ...createWingStyle(butterfly.flapVariance)
      }
    }
  }

  const nextParticles = [...retainedParticles]

  while (nextParticles.length < nextProfile.count) {
    nextParticles.push(createParticle(nextProfile))
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

function applyAdaptiveProfile(name: AdaptiveProfileName): void {
  void applyProfile(buildAdaptiveProfile(name))
}

function lowerProfile(): void {
  const adaptiveName = currentAdaptiveProfileName()
  if (!adaptiveName || adaptiveName === 'off' || adaptiveName === 'low') return
  applyAdaptiveProfile(shiftProfile(adaptiveName, -1))
}

function raiseProfile(): void {
  const adaptiveName = currentAdaptiveProfileName()
  if (!adaptiveName) return

  const nextProfileName = clampProfileToCeiling(
    shiftProfile(adaptiveName, 1),
    hardwareCeiling
  )

  if (nextProfileName === adaptiveName) return
  applyAdaptiveProfile(nextProfileName)
}

function getFadeOpacity(butterfly: ButterflyParticle, now: number): number {
  const cycleMs = Math.max(
    1000,
    settings.value.fadeCycleMs * butterfly.fadeVariance
  )
  const phase = (now / cycleMs) * Math.PI * 2 + butterfly.fadePhase
  const wave = 0.5 - Math.cos(phase) * 0.5
  const eased = wave * wave * (3 - 2 * wave)
  const minimum = Math.min(settings.value.minOpacity, settings.value.maxOpacity)
  const maximum = Math.max(settings.value.minOpacity, settings.value.maxOpacity)

  return minimum + (maximum - minimum) * eased
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

    element.style.opacity = getFadeOpacity(butterfly, now).toFixed(3)
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

  const frameInterval = 1000 / Math.max(profile.value.fps, 1)
  const elapsed = lastAnimationTime ? now - lastAnimationTime : frameInterval

  if (elapsed >= frameInterval - 1) {
    const deltaSeconds = Math.min(elapsed, 50) / 1000
    lastAnimationTime = now - Math.max(0, elapsed % frameInterval)
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

function applyPreferredProfile(): void {
  if (respectsReducedMotion()) {
    applyAdaptiveProfile('off')
    return
  }

  if (!settings.value.adaptive) {
    void applyProfile(buildCustomProfile())
    return
  }

  hardwareCeiling = detectPerformanceProfile()
  const startupProfile = hardwareCeiling === 'ultra' ? 'high' : hardwareCeiling
  applyAdaptiveProfile(startupProfile)
}

function scheduleSettingsApply(): void {
  if (!mounted) return

  if (settingsTimeoutId !== null) {
    window.clearTimeout(settingsTimeoutId)
  }

  settingsTimeoutId = window.setTimeout(() => {
    settingsTimeoutId = null
    applyPreferredProfile()
  }, 80)
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

    if (!settings.value.adaptive) return

    hardwareCeiling = detectPerformanceProfile()
    const adaptiveName = currentAdaptiveProfileName()

    if (
      adaptiveName &&
      profileIndex(adaptiveName) > profileIndex(hardwareCeiling)
    ) {
      applyAdaptiveProfile(hardwareCeiling)
    }
  }, 150)
}

watch(
  () => [
    settings.value.adaptive,
    settings.value.count,
    settings.value.fps,
    settings.value.flapSpeedMs,
    settings.value.movementSpeed,
    settings.value.size,
    settings.value.fadeCycleMs,
    settings.value.minOpacity,
    settings.value.maxOpacity
  ],
  scheduleSettingsApply
)

onMounted(() => {
  preferenceStore.initialize()
  syncViewport()
  mounted = true
  animationStartedAt = performance.now()
  applyPreferredProfile()

  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  mounted = false
  stopAnimation()

  if (resizeTimeoutId !== null) {
    window.clearTimeout(resizeTimeoutId)
    resizeTimeoutId = null
  }

  if (settingsTimeoutId !== null) {
    window.clearTimeout(settingsTimeoutId)
    settingsTimeoutId = null
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
  opacity: 0;
  pointer-events: none;
  transform-origin: center;
  transform-style: preserve-3d;
  contain: layout paint style;
  will-change: transform, opacity;
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

@media (prefers-reduced-motion: reduce) {
  .butterfly {
    display: none;
  }
}
</style>
