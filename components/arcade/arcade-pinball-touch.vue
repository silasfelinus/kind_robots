<template>
  <!-- Kind Pinball's touch layout (conductor kind-pinball/t-010): the whole
       screen is the controls, so no d-pad covers the table. -->
  <div
    ref="padRef"
    class="pinball-touch"
    role="group"
    aria-label="Pinball touch controls"
    @pointerdown.prevent="onDown"
    @pointermove.prevent="onMove"
    @pointerup.prevent="onUp"
    @pointercancel="onUp"
    @lostpointercapture="onUp"
  >
    <div
      class="pinball-touch-hints"
      :class="{ 'pinball-touch-hints--gone': !hints }"
      aria-hidden="true"
    >
      <span class="pinball-touch-hint pinball-touch-hint--left">FLIP</span>
      <span class="pinball-touch-hint pinball-touch-hint--right">FLIP</span>
      <span class="pinball-touch-hint pinball-touch-hint--plunger">
        PULL<br />&darr;
      </span>
      <span class="pinball-touch-hint pinball-touch-hint--nudge">
        &uarr; SWIPE UP TO NUDGE
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/arcade/arcade-pinball-touch.vue
//
// Feeds pointer events to the pinball gesture logic
// (utils/arcade/pinballTouch.ts) as fractions of this overlay, and passes on
// what it decides: flipper buttons, a nudge's tap, and the plunger's pull.
// The hints fade once the first ball is gone (the cabinet says when).

import { onBeforeUnmount, ref } from 'vue'
import { PinballTouch } from '~/utils/arcade/pinballTouch'
import type { ArcadeButton } from '~/utils/arcade/types'

defineProps<{ hints: boolean }>()
const emit = defineEmits<{
  press: [button: ArcadeButton, down: boolean]
  plunger: [depth: number | null]
}>()

const padRef = ref<HTMLElement | null>(null)
const touch = new PinballTouch({
  press: (button, down) => emit('press', button, down),
  plunger: (depth) => emit('plunger', depth),
})

function at(event: PointerEvent): [number, number] {
  const rect = padRef.value?.getBoundingClientRect()
  if (!rect || rect.width === 0 || rect.height === 0) return [0.5, 0]
  return [
    (event.clientX - rect.left) / rect.width,
    (event.clientY - rect.top) / rect.height,
  ]
}

function onDown(event: PointerEvent) {
  try {
    padRef.value?.setPointerCapture?.(event.pointerId)
  } catch {
    // The touch still counts; it just isn't captured.
  }
  touch.down(event.pointerId, ...at(event), event.timeStamp)
}

function onMove(event: PointerEvent) {
  touch.move(event.pointerId, ...at(event), event.timeStamp)
}

function onUp(event: PointerEvent) {
  touch.up(event.pointerId)
}

/** Let every finger go (the cabinet calls this when the overlay hides). */
function release() {
  touch.release()
}

defineExpose({ release })
onBeforeUnmount(release)
</script>

<style scoped>
.pinball-touch {
  position: absolute;
  inset: 0;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.pinball-touch-hints {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 1;
  transition: opacity 1.5s ease;
}

.pinball-touch-hints--gone {
  opacity: 0;
}

.pinball-touch-hint {
  position: absolute;
  font:
    700 0.8rem/1.2 ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-align: center;
  color: rgba(253, 230, 138, 0.9);
  background: rgba(15, 10, 46, 0.45);
  border: 1px dashed rgba(253, 230, 138, 0.55);
  border-radius: 0.6rem;
  padding: 0.35rem 0.6rem;
}

/* The zones match utils/arcade/pinballTouch.ts: flippers below 40%, the
   plunger strip at the right edge below 55%. */
.pinball-touch-hint--left {
  left: max(0.75rem, env(safe-area-inset-left));
  bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.pinball-touch-hint--right {
  right: calc(14% + 0.5rem);
  bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.pinball-touch-hint--plunger {
  right: max(0.4rem, env(safe-area-inset-right));
  bottom: 22%;
}

.pinball-touch-hint--nudge {
  left: 50%;
  top: 46%;
  transform: translateX(-50%);
  white-space: nowrap;
}
</style>
