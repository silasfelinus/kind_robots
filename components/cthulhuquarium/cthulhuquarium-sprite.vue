<!-- components/cthulhuquarium/cthulhuquarium-sprite.vue
     One species' cut-out sprite, playing its own motion (fish bible
     `sprite.motion`, utils/cthulhuquariumSprites.ts). Used wherever a
     creature is listed so the listing shows the same animal the tank does.
     A species whose swimming clip has been rendered and cut out (canon
     clips/) plays that instead; until a sprite exists it falls back to the
     card. -->
<template>
  <div ref="rootRef" class="relative flex items-center justify-center">
    <img
      v-if="clipUrl && !still && !reducedMotion"
      :src="clipUrl"
      :alt="label"
      loading="lazy"
      class="h-full w-full object-contain"
    />
    <canvas
      v-else-if="spriteUrl"
      ref="canvasRef"
      class="h-full w-full"
      :width="pixelSize"
      :height="pixelSize"
      role="img"
      :aria-label="label"
    />
    <kr-art-plate
      v-else
      :source="fallback"
      variant="icon"
      shape="square"
      frame="none"
      fit="cover"
      placeholder-icon="kind-icon:fish"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  clipForSpecies,
  drawAnimatedSprite,
  motionForSpecies,
  prefersReducedMotion,
  spriteForSpecies,
} from '~/utils/cthulhuquariumSprites'

const props = withDefaults(
  defineProps<{
    slug: string
    label?: string
    fallback?: Record<string, unknown> | null
    size?: number
    still?: boolean
  }>(),
  { label: '', fallback: null, size: 96, still: false },
)

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const spriteUrl = computed(() => spriteForSpecies(props.slug))
const clipUrl = computed(() => clipForSpecies(props.slug))
const reducedMotion = prefersReducedMotion()
const motion = computed(() => motionForSpecies(props.slug))
const pixelSize = computed(() => Math.round(props.size * 2))
const offset = computed(
  () =>
    ([...props.slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 97) /
    97,
)

let image: HTMLImageElement | null = null
let frame = 0
let visible = false
let observer: IntersectionObserver | null = null

function paint(timestamp: number) {
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')
  if (!canvas || !context || !image?.complete || !image.naturalWidth) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.save()
  context.translate(canvas.width / 2, canvas.height / 2)
  drawAnimatedSprite(
    context,
    image,
    props.still ? 'rigid' : motion.value,
    timestamp,
    canvas.width * 0.84,
    canvas.height * 0.84,
    offset.value,
  )
  context.restore()
}

function loop(timestamp: number) {
  paint(timestamp)
  if (visible && !props.still) frame = window.requestAnimationFrame(loop)
}

function start() {
  window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(loop)
}

function loadImage() {
  if (!spriteUrl.value) return
  if (clipUrl.value && !props.still && !reducedMotion) return
  image = new Image()
  image.onload = start
  image.src = spriteUrl.value
}

onMounted(() => {
  loadImage()
  observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting)
    if (visible) start()
  })
  if (rootRef.value) observer.observe(rootRef.value)
})

watch(spriteUrl, loadImage)

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frame)
  observer?.disconnect()
})
</script>
