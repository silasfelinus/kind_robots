<!-- /components/butterfly/butterfly-net.vue -->
<template>
  <button
    class="net-icon-btn"
    :class="{ active: butterflyStore.gameOpen }"
    :aria-label="butterflyStore.gameOpen ? 'Put net down' : 'Pick up butterfly net'"
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
      <line x1="8" y1="76" x2="36" y2="46" stroke-width="5" stroke-linecap="round" class="handle" />
      <ellipse cx="44" cy="34" rx="24" ry="20" fill="none" stroke-width="3.5" class="hoop" />
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
      <path d="M22,34 Q44,76 66,34" fill="none" stroke-width="2" class="bag-outline" />
    </svg>
    <span class="close-x" aria-hidden="true">×</span>
  </button>

  <Teleport to="body">
    <Transition name="net-fade">
      <div v-if="butterflyStore.gameOpen" class="butterfly-overlay">
        <div v-show="cursorVisible" class="net-cursor" :style="netCursorStyle" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="78" viewBox="0 0 72 88">
            <line x1="8" y1="76" x2="36" y2="46" stroke="#7f77dd" stroke-width="5" stroke-linecap="round" />
            <ellipse cx="44" cy="34" rx="24" ry="20" fill="none" stroke="#1d9e75" stroke-width="3" />
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
            <path d="M22,34 Q44,76 66,34" fill="none" stroke="#0f6e56" stroke-width="1.5" />
          </svg>
        </div>

        <Transition name="flash">
          <div v-if="flashMessage" class="catch-flash">{{ flashMessage }}</div>
        </Transition>

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
import { computed, onUnmounted, ref, watch } from 'vue'
import ButterflyModal from './butterfly-modal.vue'
import { useButterflyStore } from '~/stores/butterflyStore'
import type { Butterfly } from '~/stores/helpers/butterflyHelper'

const butterflyStore = useButterflyStore()

const mouseX = ref(0)
const mouseY = ref(0)
const netX = ref(0)
const netY = ref(0)
const cursorVisible = ref(false)
const captureTarget = ref<Butterfly | null>(null)
const flashMessage = ref('')

let flashTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null

const NET_RADIUS = 48

const netCursorStyle = computed(() => ({
  left: `${netX.value}px`,
  top: `${netY.value}px`,
  transform: 'translate(-44px, -34px)',
}))

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
  if (butterflyStore.discoveryButterfly) return
  if ((e.target as HTMLElement).closest('.net-icon-btn')) return

  for (const butterfly of butterflyStore.butterflies) {
    if (butterfly.isExiting) continue
    if (butterflyStore.capturedButterflyIds.has(butterfly.id)) continue

    const butterflyX = (butterfly.x / 100) * window.innerWidth
    const butterflyY = (butterfly.y / 100) * window.innerHeight
    const distanceX = butterflyX - netX.value
    const distanceY = butterflyY - netY.value

    if (Math.sqrt(distanceX * distanceX + distanceY * distanceY) < NET_RADIUS) {
      captureTarget.value = butterfly
      e.stopPropagation()
      return
    }
  }
}

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

function attachListeners() {
  document.addEventListener('mousemove', onDocMouseMove)
  document.addEventListener('mouseleave', onDocMouseLeave)
  document.addEventListener('click', onDocClick, true)
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

async function onConfirmCapture() {
  if (!captureTarget.value) return

  const butterfly = captureTarget.value
  await butterflyStore.recordCapture(butterfly)
  captureTarget.value = null
  flashMessage.value = `✓ ${butterfly.name ?? butterfly.id} observed`

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

.butterfly-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none;
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

.net-fade-enter-active,
.net-fade-leave-active,
.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.2s;
}

.net-fade-enter-from,
.net-fade-leave-to,
.flash-enter-from,
.flash-leave-to {
  opacity: 0;
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

  .bag-outline,
  .close-x {
    color: #5dcaa5;
    stroke: #5dcaa5;
  }
}
</style>
