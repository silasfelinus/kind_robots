<!-- /components/navigation/flip-card.vue -->
<template>
  <div
    class="flip-card-stage"
    :class="{ 'is-disabled': disabled }"
    :style="stageVars"
  >
    <div
      ref="cardRef"
      class="flip-card-inner"
      :class="{ 'is-flipping': isFlipping }"
    >
      <div class="flip-card-face flip-card-front">
        <slot name="front" />
      </div>

      <div class="flip-card-face flip-card-back">
        <slot name="back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    triggerKey?: string | number
    durationMs?: number
    radius?: string
    scale?: number
    disabled?: boolean
  }>(),
  {
    triggerKey: 0,
    durationMs: 650,
    radius: '1.75rem',
    scale: 1.06,
    disabled: false,
  },
)

const emit = defineEmits<{
  start: []
  halfway: []
  done: []
}>()

const cardRef = ref<HTMLElement | null>(null)
const isFlipping = ref(false)

let startTimer: ReturnType<typeof setTimeout> | null = null
let halfwayTimer: ReturnType<typeof setTimeout> | null = null
let doneTimer: ReturnType<typeof setTimeout> | null = null

const stageVars = computed<CSSProperties>(() => {
  return {
    '--flip-duration': `${props.durationMs}ms`,
    '--flip-half-duration': `${Math.round(props.durationMs / 2)}ms`,
    '--flip-radius': props.radius,
    '--flip-scale': String(props.scale),
  } as CSSProperties
})

function clearTimers(): void {
  if (startTimer) clearTimeout(startTimer)
  if (halfwayTimer) clearTimeout(halfwayTimer)
  if (doneTimer) clearTimeout(doneTimer)

  startTimer = null
  halfwayTimer = null
  doneTimer = null
}

async function play(): Promise<void> {
  if (props.disabled) {
    emit('halfway')
    return
  }

  clearTimers()
  isFlipping.value = false

  await nextTick()

  startTimer = setTimeout(() => {
    isFlipping.value = true
    emit('start')
  }, 20)

  halfwayTimer = setTimeout(() => {
    emit('halfway')
  }, Math.round(props.durationMs / 2))

  doneTimer = setTimeout(() => {
    isFlipping.value = false
    emit('done')
    clearTimers()
  }, props.durationMs + 40)
}

watch(
  () => props.triggerKey,
  () => {
    void play()
  },
)

onBeforeUnmount(() => {
  clearTimers()
})

defineExpose({
  play,
})
</script>

<style scoped>
.flip-card-stage {
  height: 100%;
  width: 100%;
  perspective: 1400px;
}

.flip-card-inner {
  position: relative;
  height: 100%;
  width: 100%;
  transform-style: preserve-3d;
}

.flip-card-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--flip-radius);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-front {
  transform: rotateY(0deg);
}

.flip-card-back {
  transform: rotateY(180deg);
}

.flip-card-inner.is-flipping {
  animation: flip-card-spin var(--flip-duration) cubic-bezier(0.4, 0.1, 0.2, 1);
}

@keyframes flip-card-spin {
  0% {
    transform: rotateY(0deg) scale(1);
  }

  50% {
    transform: rotateY(180deg) scale(var(--flip-scale));
  }

  100% {
    transform: rotateY(360deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flip-card-inner.is-flipping {
    animation: none;
  }
}
</style>