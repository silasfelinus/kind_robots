<template>
  <div
    class="mq-objects pointer-events-none absolute inset-0"
    data-testid="monstrique-stage-objects"
    :data-motion="reduced ? 'reduced' : 'full'"
    aria-hidden="true"
  >
    <div
      v-for="view in views"
      :key="view.object.id"
      class="mq-object"
      data-testid="monstrique-stage-object"
      :data-object="view.object.id"
      :data-state="view.state"
      :data-cue="active[view.object.id]?.cue ?? 'none'"
    >
      <template v-if="view.object.id === 'room-205-door'">
        <template v-if="view.state === 'open' && view.object.layer">
          <img
            v-if="view.object.behind"
            :src="view.object.behind.src"
            alt=""
            class="mq-layer"
            :style="boxStyle(view.object.behind.px)"
          />
          <img
            :key="'door-' + (active[view.object.id]?.key ?? 0)"
            :src="view.object.layer.src"
            alt=""
            class="mq-layer mq-door"
            :class="{ 'is-swinging': active[view.object.id] }"
            :style="boxStyle(view.object.layer.px)"
          />
        </template>
      </template>

      <template v-else-if="view.object.id === 'ice-machine'">
        <img
          v-if="view.object.layer && active[view.object.id]"
          :key="'ice-' + active[view.object.id]!.key"
          :src="view.object.layer.src"
          alt=""
          class="mq-layer mq-shudder"
          :style="boxStyle(view.object.layer.px)"
        />
      </template>

      <template v-else-if="view.object.id === 'vending-machine'">
        <template v-if="view.object.layer && active[view.object.id]">
          <img
            :key="'vend-' + active[view.object.id]!.key"
            :src="view.object.layer.src"
            alt=""
            class="mq-layer mq-thump"
            :style="boxStyle(view.object.layer.px)"
          />
          <div
            v-if="view.object.piece"
            class="mq-tray"
            :style="boxStyle(VENDING_TRAY)"
          />
          <img
            v-if="view.object.piece"
            :key="'pack-' + active[view.object.id]!.key"
            :src="view.object.piece.src"
            alt=""
            class="mq-layer mq-dispense"
            :style="boxStyle(view.object.piece.px)"
          />
        </template>
      </template>

      <template v-else-if="view.object.id === 'odette-purse'">
        <template v-if="view.state === 'gone'">
          <img
            v-if="view.object.gone"
            :src="view.object.gone.src"
            alt=""
            class="mq-layer"
            :style="boxStyle(view.object.gone.px)"
          />
          <div
            v-if="view.object.layer && active[view.object.id]"
            :key="'purse-' + active[view.object.id]!.key"
            class="mq-layer mq-taken"
            :style="{
              ...boxStyle(view.object.layer.px),
              ...flightTo(view.object.layer.px),
            }"
          >
            <img :src="view.object.layer.src" alt="" class="size-full" />
            <svg
              class="mq-bag-wrap"
              :viewBox="
                '0 0 ' + view.object.layer.px[2] + ' ' + view.object.layer.px[3]
              "
              preserveAspectRatio="none"
            >
              <g class="mq-bag-in">
                <rect
                  x="-5"
                  y="-8"
                  :width="view.object.layer.px[2] + 10"
                  :height="view.object.layer.px[3] + 14"
                  rx="6"
                  class="mq-bag"
                />
                <path
                  :d="'M-5 4 H' + (view.object.layer.px[2] + 5)"
                  class="mq-bag-zip"
                />
                <rect x="10" y="12" width="52" height="20" class="mq-tag" />
                <text x="36" y="26" class="mq-tag-text">EVIDENCE</text>
              </g>
            </svg>
          </div>
        </template>
      </template>
    </div>

    <svg
      v-if="knife && knife.object.bag && knife.state === 'bagged'"
      class="mq-layer inset-0 size-full"
      :viewBox="'0 0 ' + STAGE_WIDTH + ' ' + STAGE_HEIGHT"
      preserveAspectRatio="none"
      data-testid="monstrique-evidence-bag"
    >
      <g
        :key="'bag-' + (active['prop-knife']?.key ?? 0)"
        :transform="
          'translate(' +
          knife.object.bag.cx +
          ' ' +
          knife.object.bag.cy +
          ') rotate(' +
          knife.object.bag.angle +
          ')'
        "
      >
        <g :class="{ 'mq-bag-in': active['prop-knife'] }">
          <rect
            :x="-knife.object.bag.length / 2"
            :y="-knife.object.bag.width / 2"
            :width="knife.object.bag.length"
            :height="knife.object.bag.width"
            rx="7"
            class="mq-bag"
          />
          <path
            :d="
              'M' +
              (-knife.object.bag.length / 2 + 14) +
              ' ' +
              -knife.object.bag.width / 2 +
              ' V' +
              knife.object.bag.width / 2
            "
            class="mq-bag-zip"
          />
          <path
            :d="
              'M' +
              (-knife.object.bag.length / 2 + 100) +
              ' ' +
              (-knife.object.bag.width / 2 + 9) +
              ' H' +
              (knife.object.bag.length / 2 - 20)
            "
            class="mq-bag-shine"
          />
          <rect
            :x="-knife.object.bag.length / 2 + 26"
            :y="-knife.object.bag.width / 2 + 7"
            width="64"
            height="20"
            class="mq-tag"
          />
          <text
            :x="-knife.object.bag.length / 2 + 58"
            :y="-knife.object.bag.width / 2 + 21"
            class="mq-tag-text"
          >
            EVIDENCE
          </text>
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
  watch,
} from 'vue'
import { STAGE_HEIGHT, STAGE_WIDTH } from '~/utils/monstrique/stageArt'
import {
  CUE_MS,
  ICE_CLANK_EVERY_MS,
  VENDING_TRAY,
  toStageBox,
  type ObjectCue,
  type PaintingBox,
  type StageObjectCue,
  type StageObjectId,
  type StageObjectView,
} from '~/utils/monstrique/stageObjects'

const props = defineProps<{
  views: StageObjectView[]
  cues: Array<ObjectCue & { key: number }>
  irisX?: number
  irisY?: number
}>()

const reduced = ref(false)
type Playing = Partial<
  Record<StageObjectId, { cue: StageObjectCue; key: number }>
>
const active = shallowRef<Playing>({})
function settle(id: StageObjectId): void {
  const { [id]: _done, ...rest } = active.value
  active.value = rest
}
const timers = new Map<StageObjectId, ReturnType<typeof setTimeout>>()
let ambientTimer: ReturnType<typeof setInterval> | null = null
let ambientKey = 1_000_000
let motionQuery: MediaQueryList | null = null

const knife = computed(() =>
  props.views.find((view) => view.object.id === 'prop-knife'),
)
const hasIceMachine = computed(() =>
  props.views.some((view) => view.object.id === 'ice-machine'),
)

function boxStyle(px: PaintingBox): Record<string, string> {
  const box = toStageBox(px)
  return {
    left: box.x + '%',
    top: box.y + '%',
    width: box.w + '%',
    height: box.h + '%',
  }
}

function flightTo(px: PaintingBox): Record<string, string> {
  const box = toStageBox(px)
  const dx = ((props.irisX ?? 50) - (box.x + box.w / 2)) / box.w
  const dy = ((props.irisY ?? 80) - 30 - (box.y + box.h / 2)) / box.h
  return { '--to-x': dx * 100 + '%', '--to-y': dy * 100 + '%' }
}

function play(id: StageObjectId, cue: StageObjectCue, key: number, ms: number) {
  if (reduced.value || ms <= 0) return
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  active.value = { ...active.value, [id]: { cue, key } }
  timers.set(
    id,
    setTimeout(() => {
      if (active.value[id]?.key === key) settle(id)
      timers.delete(id)
    }, ms),
  )
}

watch(
  () => props.cues,
  (cues) => {
    for (const item of cues) play(item.id, item.cue, item.key, item.durationMs)
  },
)

function stopAmbient(): void {
  if (ambientTimer) clearInterval(ambientTimer)
  ambientTimer = null
}
function startAmbient(): void {
  stopAmbient()
  if (reduced.value || !hasIceMachine.value) return
  ambientTimer = setInterval(() => {
    if (document.visibilityState === 'hidden' || active.value['ice-machine'])
      return
    ambientKey += 1
    play('ice-machine', 'shudder', ambientKey, CUE_MS.shudder)
  }, ICE_CLANK_EVERY_MS)
}
watch(hasIceMachine, startAmbient)

function onMotion(): void {
  reduced.value = motionQuery?.matches === true
  if (reduced.value) active.value = {}
  startAmbient()
}

onMounted(() => {
  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  reduced.value = motionQuery?.matches === true
  motionQuery?.addEventListener?.('change', onMotion)
  startAmbient()
})
onBeforeUnmount(() => {
  stopAmbient()
  for (const timer of timers.values()) clearTimeout(timer)
  motionQuery?.removeEventListener?.('change', onMotion)
})
</script>

<style scoped>
.mq-objects {
  z-index: 1;
}
.mq-layer {
  position: absolute;
  max-width: none;
}
.mq-door {
  transform-origin: 100% 50%;
  transform: perspective(calc(var(--world-w, 1344px) * 0.5)) rotateY(-68deg);
}
.mq-door.is-swinging {
  animation: mq-swing 1.1s cubic-bezier(0.3, 0.1, 0.2, 1) both;
}
@keyframes mq-swing {
  0% {
    transform: perspective(calc(var(--world-w, 1344px) * 0.5)) rotateY(0deg);
  }
  18% {
    transform: perspective(calc(var(--world-w, 1344px) * 0.5)) rotateY(-6deg);
  }
  100% {
    transform: perspective(calc(var(--world-w, 1344px) * 0.5)) rotateY(-68deg);
  }
}
.mq-shudder {
  transform-origin: 50% 100%;
  animation: mq-clank 0.76s linear both;
}
@keyframes mq-clank {
  0%,
  24%,
  50%,
  76%,
  100% {
    transform: none;
  }
  6% {
    transform: translate(-1.1%, 0.4%) rotate(-0.7deg);
  }
  13% {
    transform: translate(0.9%, -0.3%) rotate(0.5deg);
  }
  19% {
    transform: translate(-0.4%, 0) rotate(-0.2deg);
  }
  56% {
    transform: translate(1.1%, 0.4%) rotate(0.7deg);
  }
  63% {
    transform: translate(-0.9%, -0.3%) rotate(-0.5deg);
  }
  69% {
    transform: translate(0.4%, 0) rotate(0.2deg);
  }
}
.mq-thump {
  transform-origin: 50% 100%;
  animation: mq-thump 1.3s ease-out both;
}
@keyframes mq-thump {
  0%,
  30%,
  100% {
    transform: none;
  }
  6% {
    transform: translateX(-1.4%) rotate(-0.5deg);
  }
  14% {
    transform: translateX(1%) rotate(0.3deg);
  }
  22% {
    transform: translateX(-0.4%);
  }
}
.mq-tray {
  position: absolute;
  border-radius: 0.2rem;
  background: radial-gradient(
    ellipse at 50% 70%,
    #ffd6ef55 0%,
    transparent 70%
  );
  opacity: 0;
  animation: mq-tray 1.3s ease-out both;
}
@keyframes mq-tray {
  0%,
  60% {
    opacity: 0;
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
.mq-dispense {
  transform-origin: 50% 0%;
  animation: mq-drop 1.3s cubic-bezier(0.5, 0, 0.8, 0.6) both;
}
@keyframes mq-drop {
  0%,
  18% {
    transform: none;
    opacity: 1;
  }
  32% {
    transform: rotate(14deg) translateY(6%);
    opacity: 1;
  }
  62% {
    transform: translateY(300%) rotate(48deg);
    opacity: 1;
  }
  78% {
    transform: translateY(300%) rotate(48deg);
    opacity: 0.7;
  }
  100% {
    transform: translateY(300%) rotate(48deg);
    opacity: 0;
  }
}
.mq-taken {
  animation: mq-taken 0.9s ease-in both;
}
@keyframes mq-taken {
  0% {
    transform: none;
    opacity: 1;
  }
  35% {
    transform: translateY(-10%);
    opacity: 1;
  }
  60% {
    transform: translateY(-12%) scale(0.92);
    opacity: 1;
  }
  100% {
    transform: translate(var(--to-x, 300%), var(--to-y, 0%)) scale(0.35);
    opacity: 0;
  }
}
.mq-bag-wrap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.mq-bag-wrap .mq-bag-in {
  animation-delay: 0.25s;
}
.mq-bag-in {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation: mq-bag-in 0.45s ease-out both;
}
@keyframes mq-bag-in {
  0% {
    transform: scale(1.35);
    opacity: 0;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}
.mq-bag {
  fill: #dceaff;
  fill-opacity: 0.16;
  stroke: #1a1016;
  stroke-width: 2.2;
  stroke-linejoin: round;
}
.mq-bag-zip {
  fill: none;
  stroke: #6fa2d8;
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.85;
}
.mq-bag-shine {
  fill: none;
  stroke: #ffffff;
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.35;
}
.mq-tag {
  fill: #c8323c;
  stroke: #1a1016;
  stroke-width: 1.5;
}
.mq-tag-text {
  fill: #fff7ec;
  font:
    800 9px / 1 ui-sans-serif,
    system-ui,
    sans-serif;
  letter-spacing: 0.06em;
  text-anchor: middle;
}
@media (prefers-reduced-motion: reduce) {
  .mq-door.is-swinging,
  .mq-shudder,
  .mq-thump,
  .mq-tray,
  .mq-dispense,
  .mq-taken,
  .mq-bag-in {
    animation: none;
  }
}
</style>
