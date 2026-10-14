<template>
  <div ref="box" class="relative">
    <canvas ref="canvas" class="absolute inset-0 h-full w-full" />
    <div v-if="!drawn" class="absolute inset-0 grid place-items-center">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { drawSprite, keyedSprite } from '~/utils/arcade/games/savePlumberArt'
import {
  drawSheetFrame,
  keyedSheet,
} from '~/utils/arcade/games/savePlumberSheets'
import type { SheetAnimation } from '~/utils/arcade/games/savePlumberAnimations'

const props = withDefaults(
  defineProps<{
    animation: SheetAnimation
    acting?: boolean
    fps?: number
    flip?: boolean
  }>(),
  { acting: false, fps: 6, flip: false },
)

const box = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const drawn = ref(false)

let raf = 0
let visible = true
let still = false
let actStart = 0
let lastFrame = -1
let observer: IntersectionObserver | null = null
let resizer: ResizeObserver | null = null

watch(
  () => props.acting,
  (on) => {
    if (on) actStart = performance.now()
    lastFrame = -1
  },
)
watch(
  () => props.animation.src,
  () => {
    drawn.value = false
    lastFrame = -1
  },
)

function size(): [number, number] {
  const el = canvas.value
  if (!el) return [0, 0]
  const ratio = Math.min(2, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.round(el.clientWidth * ratio))
  const h = Math.max(1, Math.round(el.clientHeight * ratio))
  if (el.width !== w || el.height !== h) {
    el.width = w
    el.height = h
    lastFrame = -1
  }
  return [w, h]
}

function pose(now: number): number {
  const anim = props.animation
  if (still) return anim.loop[0]!
  const step = (from: number) => Math.floor(((now - from) * props.fps) / 1000)
  if (props.acting && anim.act.length)
    return anim.act[step(actStart) % anim.act.length]!
  return anim.loop[step(0) % anim.loop.length]!
}

function paint(now: number) {
  const el = canvas.value
  const g = el?.getContext('2d')
  if (!el || !g) return
  const [w, h] = size()
  const anim = props.animation
  const sheet = keyedSheet(anim.src, anim.frames)
  const frame = pose(now)
  if (sheet && frame === lastFrame && drawn.value) return
  g.clearRect(0, 0, w, h)
  if (sheet) {
    const widest = Math.max(...sheet.frames.map((f) => f.width))
    const tall = Math.min(h * 0.92, (w * 0.92 * sheet.height) / widest)
    drawSheetFrame(g, anim.src, anim.frames, frame, w / 2, h * 0.96, tall, {
      flipX: props.flip,
    })
    lastFrame = frame
    drawn.value = true
    return
  }
  const sprite = keyedSprite(anim.still)
  if (!sprite) return
  const tall = Math.min(h * 0.9, (w * 0.9 * sprite.height) / sprite.width)
  drawn.value = drawSprite(g, anim.still, w / 2, h * 0.95, tall, {
    flipX: props.flip,
  })
}

function loop(now: number) {
  if (visible) paint(now)
  const settled = still && drawn.value && lastFrame !== -1
  if (!settled) raf = requestAnimationFrame(loop)
}

onMounted(() => {
  still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (typeof IntersectionObserver !== 'undefined' && box.value) {
    observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
    })
    observer.observe(box.value)
  }
  if (typeof ResizeObserver !== 'undefined' && box.value) {
    resizer = new ResizeObserver(() => {
      lastFrame = -1
    })
    resizer.observe(box.value)
  }
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  resizer?.disconnect()
})
</script>
