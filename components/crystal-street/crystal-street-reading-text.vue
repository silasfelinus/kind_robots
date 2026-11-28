<template>
  <div>
    <p class="sr-only">{{ text }}</p>
    <p aria-hidden="true">
      <span>{{ text.slice(0, visible) }}</span
      ><span class="invisible">{{ text.slice(visible) }}</span>
    </p>
    <button
      v-if="delay"
      type="button"
      class="btn btn-ghost btn-xs mt-1"
      :disabled="visible >= text.length"
      @click="finish"
    >
      Show all text
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  readingDelay,
  readingStops,
  type ReadingSpeed,
} from '~/utils/crystalStreet/reading'

const props = defineProps<{
  text: string
  speed: ReadingSpeed
  reduced: boolean
}>()
const visible = ref(props.text.length)
const systemReduced = ref(false)
const delay = computed(() =>
  readingDelay(props.speed, props.reduced || systemReduced.value),
)
let media: MediaQueryList | undefined
let timer: ReturnType<typeof setInterval> | undefined
let mounted = false

function finish(): void {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
  visible.value = props.text.length
}
function restart(): void {
  finish()
  if (!mounted || !delay.value) return
  const stops = readingStops(props.text)
  if (!stops.length) return
  visible.value = stops[0]!
  let index = 1
  if (index >= stops.length) return
  timer = setInterval(() => {
    visible.value = stops[index++] ?? props.text.length
    if (index >= stops.length) finish()
  }, delay.value)
}
function updateMotion(): void {
  systemReduced.value = media?.matches ?? false
}
watch(() => [props.text, delay.value] as const, restart)
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  media.addEventListener('change', updateMotion)
  mounted = true
  restart()
})
onBeforeUnmount(() => {
  mounted = false
  finish()
  media?.removeEventListener('change', updateMotion)
})
</script>
