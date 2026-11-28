<template>
  <div
    class="mq-rig"
    :data-character="rig.id"
    :data-base="pose.base"
    :data-gesture="pose.gesture ?? 'none'"
    :data-mouth="pose.mouth"
    :data-eyes="pose.eyes"
    :data-motion="reduced ? 'reduced' : 'full'"
    :style="{ aspectRatio: rig.frame.w + ' / ' + rig.frame.h }"
    role="img"
    :aria-label="rig.name"
  >
    <svg
      :viewBox="'0 0 ' + rig.frame.w + ' ' + rig.frame.h"
      class="size-full overflow-visible"
    >
      <defs v-if="clipIds.size">
        <clipPath
          v-for="[source, id] in clipIds"
          :id="id"
          :key="id"
          clipPathUnits="userSpaceOnUse"
        >
          <polygon :points="(source.clip ?? []).join(' ')" />
        </clipPath>
      </defs>
      <ellipse
        :cx="rig.frame.w / 2"
        :cy="rig.frame.ground + 1"
        :rx="rig.frame.w * 0.2"
        ry="3.5"
        fill="#000"
        opacity=".35"
      />
      <g :transform="flip">
        <g
          v-for="part in pose.parts"
          :key="part.id"
          :transform="'matrix(' + part.matrix.join(' ') + ')'"
          :data-part="part.id"
        >
          <template v-if="part.source.kind === 'svg'">
            <component
              :is="shape.tag"
              v-for="(shape, index) in part.source.shapes"
              :key="index"
              v-bind="shape.attrs"
              :transform="shape.readable && flip ? readable(shape) : undefined"
            >
              {{ shape.text }}
            </component>
          </template>
          <svg
            v-else
            :x="part.box.x"
            :y="part.box.y"
            :width="part.box.w"
            :height="part.box.h"
            :viewBox="
              [
                part.source.rect.x,
                part.source.rect.y,
                part.source.rect.w,
                part.source.rect.h,
              ].join(' ')
            "
            preserveAspectRatio="none"
          >
            <image
              :href="part.source.src"
              :width="part.source.sheet.w"
              :height="part.source.sheet.h"
              :clip-path="
                clipIds.get(part.source)
                  ? 'url(#' + clipIds.get(part.source) + ')'
                  : undefined
              "
            />
          </svg>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useId,
  watch,
} from 'vue'
import { leadRigFor } from '~/utils/monstrique/leadRigs'
import {
  poseRig,
  sourcesOf,
  type CutoutRig,
  type RigGesture,
  type RigImageSource,
  type RigShape,
} from '~/utils/monstrique/rig'

const props = defineProps<{
  character: 'iris' | 'norb'
  facing?: 'left' | 'right'
  walking?: boolean
  walkSpeed?: number
  stride?: number
  talking?: boolean
  gesture?: { id: RigGesture; key: number } | null
  rig?: CutoutRig
}>()

const rig = computed(() => props.rig ?? leadRigFor(props.character)!)
const uid = 'mq-rig-' + useId()
const clipIds = computed(() => {
  const ids = new Map<RigImageSource, string>()
  for (const part of rig.value.parts)
    for (const source of sourcesOf(part.art))
      if (source.kind === 'image' && source.clip?.length)
        ids.set(source, uid + '-' + ids.size)
  return ids
})
const flip = computed(() =>
  props.facing === 'left'
    ? 'matrix(-1 0 0 1 ' + rig.value.frame.w + ' 0)'
    : undefined,
)
function readable(shape: RigShape): string {
  return 'matrix(-1 0 0 1 ' + 2 * Number(shape.attrs.x ?? 0) + ' 0)'
}

const reduced = ref(false)
const clock = shallowRef({ timeMs: 0, distance: 0 })
const active = shallowRef<{
  clip: CutoutRig['gestures'][RigGesture]
  startedMs: number
} | null>(null)
let origin = 0
let last = 0
let raf = 0
let stillTimer: ReturnType<typeof setTimeout> | null = null
let motionQuery: MediaQueryList | null = null

const pose = computed(() =>
  poseRig(rig.value, {
    timeMs: clock.value.timeMs,
    distance: clock.value.distance,
    walking: props.walking === true,
    stride: props.stride ?? 0,
    talking: props.talking === true,
    gesture: active.value,
    reducedMotion: reduced.value,
  }),
)

function elapsed(): number {
  return typeof performance === 'undefined' ? 0 : performance.now() - origin
}

function frame(stamp: number): void {
  const dt = Math.min(100, Math.max(0, stamp - last))
  last = stamp
  const distance =
    clock.value.distance +
    (props.walking ? dt * Math.max(0, props.walkSpeed ?? 0) : 0)
  clock.value = { timeMs: stamp - origin, distance }
  raf = requestAnimationFrame(frame)
}

function start(): void {
  if (raf || reduced.value || document.visibilityState === 'hidden') return
  last = performance.now()
  raf = requestAnimationFrame(frame)
}

function stop(): void {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function refreshStill(): void {
  clock.value = { timeMs: elapsed(), distance: clock.value.distance }
}

function onVisibility(): void {
  if (document.visibilityState === 'hidden') stop()
  else start()
}

function onMotion(): void {
  reduced.value = motionQuery?.matches === true
  if (reduced.value) {
    stop()
    refreshStill()
  } else start()
}

watch(
  () => props.gesture?.key,
  () => {
    const gesture = props.gesture
    if (stillTimer) clearTimeout(stillTimer)
    stillTimer = null
    if (!gesture) {
      active.value = null
      return
    }
    const clip = rig.value.gestures[gesture.id]
    active.value = { clip, startedMs: elapsed() }
    if (reduced.value) {
      refreshStill()
      stillTimer = setTimeout(
        refreshStill,
        (rig.value.clips[clip]?.durationMs ?? 0) + 20,
      )
    }
  },
)
watch(
  () => [props.talking, props.walking],
  () => {
    if (reduced.value) refreshStill()
  },
)

onMounted(() => {
  origin = performance.now()
  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  reduced.value = motionQuery?.matches === true
  motionQuery?.addEventListener?.('change', onMotion)
  document.addEventListener('visibilitychange', onVisibility)
  start()
})
onBeforeUnmount(() => {
  stop()
  if (stillTimer) clearTimeout(stillTimer)
  motionQuery?.removeEventListener?.('change', onMotion)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.mq-rig {
  transform-origin: 50% 100%;
}
</style>
