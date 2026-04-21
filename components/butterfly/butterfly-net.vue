<!-- /components/butterfly/butterfly-net.vue -->
<template>
  <!-- ── toggle button ───────────────────────────────────────────────────── -->
  <button
    class="net-icon-btn"
    :class="{ active: butterflyStore.gameOpen }"
    :aria-label="
      butterflyStore.gameOpen ? 'Put net down' : 'Pick up butterfly net'
    "
    :title="butterflyStore.gameOpen ? 'Put net down' : 'Catch butterflies'"
    @click.stop="butterflyStore.gameOpen = !butterflyStore.gameOpen"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="30"
      viewBox="0 0 72 88"
      class="net-icon-svg"
      aria-hidden="true"
    >
      <line
        x1="8"
        y1="76"
        x2="36"
        y2="46"
        stroke-width="5"
        stroke-linecap="round"
        class="handle"
      />
      <ellipse
        cx="44"
        cy="34"
        rx="24"
        ry="20"
        fill="none"
        stroke-width="3.5"
        class="hoop"
      />
      <g class="mesh" stroke-width="1.2" fill="none" opacity="0.75">
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
        stroke-width="2"
        class="bag-outline"
      />
    </svg>
    <span class="close-x" aria-hidden="true">×</span>
  </button>

  <!-- ── cursor overlay — pointer-events: none so UI stays clickable ──────── -->
  <Teleport to="body">
    <Transition name="net-fade">
      <div v-if="butterflyStore.gameOpen" class="butterfly-overlay">
        <!-- net cursor tracks mouse, pointer-events: none throughout -->
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

        <!-- catch flash -->
        <Transition name="flash">
          <div v-if="flashMessage" class="catch-flash">{{ flashMessage }}</div>
        </Transition>

        <!-- modal — has its own backdrop with pointer-events when open -->
        <ButterflyModal
          :butterfly="captureTarget"
          @confirm="onConfirmCapture"
          @cancel="onCancel"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useButterflyStore } from '~/stores/butterflyStore'
import type { Butterfly } from '~/stores/helpers/butterflyHelper'
import ButterflyModal from './butterfly-modal.vue'

const butterflyStore = useButterflyStore()

// ── cursor tracking ────────────────────────────────────────────────────────────

const mouseX = ref(0)
const mouseY = ref(0)
const netX = ref(0)
const netY = ref(0)
const cursorVisible = ref(false)

const netCursorStyle = computed(() => ({
  left: `${netX.value}px`,
  top: `${netY.value}px`,
  transform: 'translate(-44px, -34px)',
}))

// ── capture state ──────────────────────────────────────────────────────────────

const captureTarget = ref<Butterfly | null>(null)
const flashMessage = ref('')
let flashTimer: ReturnType<typeof setTimeout> | null = null

const NET_RADIUS = 48 // px in viewport space — generous for usability

// ── document-level listeners — attached when game is open ─────────────────────
// Using document listeners instead of an overlay div means the UI stays
// fully interactive. The cursor style on <html> signals game mode visually.

function onDocMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
  cursorVisible.value = true
}

function onDocMouseLeave() {
  cursorVisible.value = false
}

function onDocClick(e: MouseEvent) {
  if (captureTarget.value) return
  if (butterflyStore.discoveryButterfly) return // discovery modal is open
  if ((e.target as HTMLElement).closest('.net-icon-btn')) return

  // Don't intercept clicks on the toggle button itself
  if ((e.target as HTMLElement).closest('.net-icon-btn')) return

  const netCx = netX.value
  const netCy = netY.value

  for (const b of butterflyStore.butterflies) {
    // Skip already-caught butterflies
    if (butterflyStore.userCaughtIds.has(b.rarity ?? -1)) continue

    // b.x and b.y are 0–100 percentages of the viewport
    const bpx = (b.x / 100) * window.innerWidth
    const bpy = (b.y / 100) * window.innerHeight

    const dx = bpx - netCx
    const dy = bpy - netCy

    if (Math.sqrt(dx * dx + dy * dy) < NET_RADIUS) {
      captureTarget.value = b
      e.stopPropagation()
      return
    }
  }
}

// ── net lag RAF ────────────────────────────────────────────────────────────────

let rafId: number | null = null

function startNetLag() {
  function tick() {
    netX.value += (mouseX.value - netX.value) * 0.18
    netY.value += (mouseY.value - netY.value) * 0.18
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function stopNetLag() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

// ── lifecycle ──────────────────────────────────────────────────────────────────

function attachListeners() {
  document.addEventListener('mousemove', onDocMouseMove)
  document.addEventListener('mouseleave', onDocMouseLeave)
  document.addEventListener('click', onDocClick, true) // capture phase
  document.documentElement.style.cursor = 'none'
  startNetLag()
}

function detachListeners() {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseleave', onDocMouseLeave)
  document.removeEventListener('click', onDocClick, true)
  document.documentElement.style.cursor = ''
  stopNetLag()
  cursorVisible.value = false
}

watch(
  () => butterflyStore.gameOpen,
  (open) => {
    if (open) attachListeners()
    else detachListeners()
  },
  { immediate: true },
)

onUnmounted(detachListeners)

// ── capture handlers ───────────────────────────────────────────────────────────

function onConfirmCapture() {
  if (!captureTarget.value) return
  const b = captureTarget.value
  butterflyStore.recordCapture(b)
  captureTarget.value = null
  flashMessage.value = `✓ ${b.name ?? b.id} collected`
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flashMessage.value = ''
  }, 1800)
}

function onCancel() {
  captureTarget.value = null
}
</script>

<style scoped>
/* ── button ─────────────────────────────────────────────────────────────────── */

.net-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s,
    transform 0.14s;
}

.net-icon-btn:hover {
  background: rgba(29, 158, 117, 0.1);
  border-color: rgba(29, 158, 117, 0.35);
  transform: scale(1.08);
}

.net-icon-btn.active {
  background: rgba(29, 158, 117, 0.14);
  border-color: #1d9e75;
}

.net-icon-svg {
  display: block;
  transition:
    opacity 0.18s,
    transform 0.18s;
}

.net-icon-btn.active .net-icon-svg {
  opacity: 0.35;
  transform: scale(0.85);
}

.handle {
  stroke: #7f77dd;
}
.hoop {
  stroke: #1d9e75;
}
.mesh {
  stroke: #5dcaa5;
}
.bag-outline {
  stroke: #0f6e56;
}

.close-x {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
  color: #0f6e56;
  opacity: 0;
  transition: opacity 0.18s;
  pointer-events: none;
}

.net-icon-btn.active .close-x {
  opacity: 1;
}

@media (prefers-color-scheme: dark) {
  .handle {
    stroke: #afa9ec;
  }
  .hoop {
    stroke: #5dcaa5;
  }
  .mesh {
    stroke: #9fe1cb;
  }
  .bag-outline {
    stroke: #5dcaa5;
  }
  .close-x {
    color: #5dcaa5;
  }
}

/* ── overlay — pointer-events: none so nothing is blocked ───────────────────── */

.butterfly-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none; /* UI stays fully interactive */
}

.net-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 9100;
  will-change: left, top;
}

.catch-flash {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(4, 52, 44, 0.85);
  color: #9fe1cb;
  font-size: 15px;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 9200;
  white-space: nowrap;
}

/* ── transitions ────────────────────────────────────────────────────────────── */

.net-fade-enter-active,
.net-fade-leave-active {
  transition: opacity 0.2s;
}
.net-fade-enter-from,
.net-fade-leave-to {
  opacity: 0;
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.3s;
}
.flash-enter-from,
.flash-leave-to {
  opacity: 0;
}
</style>
