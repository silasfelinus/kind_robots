<template>
  <Transition name="game-fade">
    <div
      v-if="active"
      ref="fieldRef"
      class="butterfly-field"
      :class="{ 'is-catching': !!captureTarget }"
      @mousemove="onMouseMove"
      @click="onFieldClick"
      @mouseleave="onMouseLeave"
    >
      <!-- butterflies -->
      <ButterflySprite
        v-for="b in runtimeButterflies"
        :key="b.id"
        :butterfly="b"
        :class="{ caught: caughtIds.has(b.id) }"
      />

      <!-- cursor net -->
      <div
        v-show="cursorVisible"
        class="net-cursor"
        :style="netCursorStyle"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="78"
          viewBox="0 0 72 88"
        >
          <line
            x1="8"
            y1="76"
            x2="36"
            y2="46"
            stroke="#7f77dd"
            stroke-width="5"
            stroke-linecap="round"
          />
          <ellipse
            cx="44"
            cy="34"
            rx="24"
            ry="20"
            fill="none"
            stroke="#1d9e75"
            stroke-width="3"
          />
          <g stroke="#5dcaa5" stroke-width="1.2" fill="none" opacity="0.7">
            <line x1="32" y1="34" x2="30" y2="70" />
            <line x1="44" y1="34" x2="44" y2="74" />
            <line x1="56" y1="34" x2="58" y2="70" />
            <line x1="38" y1="34" x2="37" y2="72" />
            <line x1="50" y1="34" x2="51" y2="72" />
            <path d="M22,38 Q44,62 66,38" />
            <path d="M24,46 Q44,68 64,46" />
            <path d="M27,54 Q44,72 61,54" />
            <path d="M31,62 Q44,74 57,62" />
          </g>
          <path
            d="M22,34 Q44,76 66,34"
            fill="none"
            stroke="#0f6e56"
            stroke-width="1.5"
          />
        </svg>
      </div>

      <!-- capture flash -->
      <Transition name="flash">
        <div v-if="flashMessage" class="catch-flash">{{ flashMessage }}</div>
      </Transition>

      <!-- close button -->
      <button
        class="close-btn"
        aria-label="Close butterfly game"
        @click.stop="$emit('close')"
      >
        ×
      </button>

      <!-- modal -->
      <ButterflyModal
        :butterfly="captureTarget"
        @release="onRelease"
        @cancel="onCancel"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import ButterflySprite, { type RuntimeButterfly } from './butterfly-sprite.vue'
import ButterflyModal from './butterfly-modal.vue'
import type { Butterfly } from '~/stores/helpers/butterflyHelper'

// ─── props / emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  /** show/hide the field */
  active: boolean
  /**
   * Butterfly records sourced from your Prisma/API layer.
   * The game assigns runtime positions — no position data in the DB.
   */
  butterflies: Butterfly[]
}>()

const emit = defineEmits<{
  close: []
  /** emitted when user confirms capture; parent persists to DB via UserButterfly */
  captured: [butterfly: Butterfly]
}>()

// ─── field ref ────────────────────────────────────────────────────────────────

const fieldRef = ref<HTMLElement | null>(null)

// ─── runtime state ────────────────────────────────────────────────────────────

interface FlightState {
  rx: number
  ry: number
  vx: number
  vy: number
  wingPhase: number
  flapScale: number
}

const flightMap = ref<Map<string, FlightState>>(new Map())
const caughtIds = ref<Set<string>>(new Set())
const captureTarget = ref<RuntimeButterfly | null>(null)

const flashMessage = ref('')
let flashTimer: ReturnType<typeof setTimeout> | null = null

// ─── cursor tracking ──────────────────────────────────────────────────────────

const mouseX = ref(0)
const mouseY = ref(0)
const netX = ref(0)
const netY = ref(0)
const cursorVisible = ref(false)

const netCursorStyle = computed(() => ({
  left: `${netX.value}px`,
  top: `${netY.value}px`,
  transform: 'translate(-44px, -34px)', // center hoop on cursor
}))

function onMouseMove(e: MouseEvent) {
  if (!fieldRef.value) return
  const r = fieldRef.value.getBoundingClientRect()
  mouseX.value = e.clientX - r.left
  mouseY.value = e.clientY - r.top
  cursorVisible.value = true
}

function onMouseLeave() {
  cursorVisible.value = false
}

// ─── runtime butterflies (merge DB props + flight state) ──────────────────────

const runtimeButterflies = computed<RuntimeButterfly[]>(() =>
  props.butterflies.map((b) => {
    const f = flightMap.value.get(b.id) ?? {
      rx: 10 + Math.random() * 78,
      ry: 10 + Math.random() * 78,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.18,
      wingPhase: Math.random() * Math.PI * 2,
      flapScale: 1,
    }
    return { ...b, ...f }
  }),
)

// ─── animation loop ───────────────────────────────────────────────────────────

let rafId: number | null = null

function startLoop() {
  // seed flight state for any butterflies not yet in map
  props.butterflies.forEach((b) => {
    if (!flightMap.value.has(b.id)) {
      flightMap.value.set(b.id, {
        rx: 10 + Math.random() * 78,
        ry: 10 + Math.random() * 78,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.18,
        wingPhase: Math.random() * Math.PI * 2,
        flapScale: 1,
      })
    }
  })

  function tick() {
    if (!fieldRef.value) {
      rafId = requestAnimationFrame(tick)
      return
    }

    const W = fieldRef.value.offsetWidth
    const H = fieldRef.value.offsetHeight

    // smooth net lag
    netX.value += (mouseX.value - netX.value) * 0.18
    netY.value += (mouseY.value - netY.value) * 0.18

    const netCx = netX.value
    const netCy = netY.value

    const nextMap = new Map(flightMap.value)

    for (const b of props.butterflies) {
      if (caughtIds.value.has(b.id)) continue
      const f = nextMap.get(b.id)
      if (!f) continue

      const bpx = (f.rx / 100) * W
      const bpy = (f.ry / 100) * H
      const dx = bpx - netCx
      const dy = bpy - netCy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // flee from net
      if (dist < 90 && cursorVisible.value) {
        f.vx += (dx / dist) * 0.045
        f.vy += (dy / dist) * 0.045
      }

      // wander
      f.vx += (Math.random() - 0.5) * 0.022
      f.vy += (Math.random() - 0.5) * 0.016

      // dampen + speed clamp
      f.vx *= 0.96
      f.vy *= 0.96
      const spd = Math.sqrt(f.vx * f.vx + f.vy * f.vy)
      if (spd > 0.55) {
        f.vx = (f.vx / spd) * 0.55
        f.vy = (f.vy / spd) * 0.55
      }

      f.rx += f.vx
      f.ry += f.vy

      // bounce off edges
      if (f.rx < 2) f.vx += 0.12
      if (f.rx > 96) f.vx -= 0.12
      if (f.ry < 2) f.vy += 0.12
      if (f.ry > 94) f.vy -= 0.12
      f.rx = Math.max(1, Math.min(97, f.rx))
      f.ry = Math.max(1, Math.min(95, f.ry))

      // wing flap
      f.wingPhase += b.wingSpeed
      f.flapScale = 0.38 + Math.abs(Math.sin(f.wingPhase)) * 0.62

      nextMap.set(b.id, { ...f })
    }

    flightMap.value = nextMap
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

watch(
  () => props.active,
  (val) => {
    if (val) startLoop()
    else stopLoop()
  },
  { immediate: true },
)

onUnmounted(stopLoop)

// ─── capture logic ────────────────────────────────────────────────────────────

const NET_RADIUS = 30 // px — must be within hoop

function onFieldClick(e: MouseEvent) {
  if (captureTarget.value) return // modal open
  if (!fieldRef.value) return
  if ((e.target as HTMLElement).closest('.close-btn')) return

  const r = fieldRef.value.getBoundingClientRect()
  const cx = e.clientX - r.left
  const cy = e.clientY - r.top
  const W = fieldRef.value.offsetWidth
  const H = fieldRef.value.offsetHeight

  for (const b of runtimeButterflies.value) {
    if (caughtIds.value.has(b.id)) continue
    const bpx = (b.rx / 100) * W
    const bpy = (b.ry / 100) * H
    const dx = bpx - cx
    const dy = bpy - cy
    if (Math.sqrt(dx * dx + dy * dy) < NET_RADIUS) {
      captureTarget.value = b
      return
    }
  }
}

function onRelease() {
  if (!captureTarget.value) return
  const b = captureTarget.value
  caughtIds.value.add(b.id)
  emit('captured', b)
  captureTarget.value = null

  flashMessage.value = `✓ ${b.name} collected`
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flashMessage.value = ''
  }, 1800)
}

function onCancel() {
  // butterfly returns to field — just close modal, keep flight state
  captureTarget.value = null
}
</script>

<style scoped>
.butterfly-field {
  position: relative;
  width: 100%;
  height: 520px;
  background: linear-gradient(155deg, #e1f5ee 0%, #e6f1fb 55%, #faeeda 100%);
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  cursor: none;
  user-select: none;
}

/* show default cursor when modal is open */
.butterfly-field.is-catching {
  cursor: default;
}

.net-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 200;
  will-change: left, top;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(15, 110, 86, 0.3);
  background: rgba(255, 255, 255, 0.7);
  color: #0f6e56;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
  transition: background 0.15s;
}

.close-btn:hover {
  background: rgba(225, 245, 238, 0.9);
}

.catch-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(4, 52, 44, 0.82);
  color: #9fe1cb;
  font-size: 15px;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 400;
  white-space: nowrap;
}

/* transitions */
.game-fade-enter-active,
.game-fade-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.game-fade-enter-from,
.game-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.3s;
}
.flash-enter-from,
.flash-leave-to {
  opacity: 0;
}

/* propagate caught fade into sprite */
:deep(.butterfly-sprite.caught) {
  opacity: 0;
  pointer-events: none;
}
</style>
