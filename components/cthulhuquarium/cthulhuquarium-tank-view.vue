<!-- components/cthulhuquarium/cthulhuquarium-tank-view.vue
     Someone else's tank, alive and read-only: "like looking in someone's
     window". Same stage, steering, ambience, sprites and background as the
     owner's canvas (cthulhuquarium-game.vue), with none of its economy --
     no coins, food, decor dragging or writes. A visitor may tap the glass. -->
<template>
  <div
    ref="rootRef"
    class="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-base-300 bg-base-300 shadow-xl"
  >
    <canvas
      ref="canvasRef"
      class="block h-full w-full cursor-pointer"
      :width="STAGE_WIDTH * RENDER_SCALE"
      :height="STAGE_HEIGHT * RENDER_SCALE"
      role="img"
      :aria-label="label"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { artForSpecies } from '~/utils/cthulhuquariumArt'
import {
  drawAnimatedSprite,
  motionForSpecies,
  spriteForSpecies,
} from '~/utils/cthulhuquariumSprites'
import {
  facingOf,
  packmatePositions,
  pitchOf,
  spawnSwimState,
  startle,
  stepSwimState,
  type SwimState,
} from '~/utils/cthulhuquariumMotion'
import {
  createAmbience,
  drawAmbienceBack,
  drawAmbienceFront,
  stepAmbience,
} from '~/utils/cthulhuquariumAmbience'
import {
  decorIcon,
  fallbackHue,
  tankBackground,
  type StageCrop,
  type TankViewDecor,
  type TankViewOccupant,
} from '~/utils/cthulhuquariumStage'

const props = withDefaults(
  defineProps<{
    occupants: TankViewOccupant[]
    backgroundKey?: string | null
    decor?: TankViewDecor[]
  }>(),
  { backgroundKey: null, decor: () => [] },
)

const STAGE_WIDTH = 640
const STAGE_HEIGHT = 360
const RENDER_SCALE = 2
const CLINGER_SCALE = 1.35

type Swimmer = SwimState & { id: number; facing: number }

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const label = computed(() => {
  const count = props.occupants.length
  const who =
    count === 0
      ? 'An empty tank.'
      : `A tank with ${count} ${count === 1 ? 'occupant' : 'occupants'}.`
  return `${who} Tap the glass to startle the fish.`
})

const swimmers = new Map<number, Swimmer>()
const ambience = createAmbience(STAGE_WIDTH, STAGE_HEIGHT)
let pointer: { x: number; y: number } | null = null

let backgroundImage: HTMLImageElement | null = null
let backgroundCrop: StageCrop | null = null

function loadBackground(key: string | null) {
  if (!import.meta.client) return
  const { url, crop } = tankBackground(key)
  backgroundCrop = crop
  backgroundImage = url ? Object.assign(new Image(), { src: url }) : null
}

const spriteCache = new Map<string, HTMLImageElement | null>()
const cardCache = new Map<string, HTMLImageElement | null>()

function cachedImage(
  cache: Map<string, HTMLImageElement | null>,
  slug: string,
  url: string | null,
): HTMLImageElement | null {
  if (cache.has(slug)) return cache.get(slug) ?? null
  cache.set(slug, null)
  if (!url) return null
  const image = new Image()
  image.onload = () => cache.set(slug, image)
  image.src = url
  return null
}

function syncSwimmers() {
  const wanted = new Set<number>()
  for (const occupant of props.occupants) {
    wanted.add(occupant.id)
    if (swimmers.has(occupant.id)) continue
    const state = spawnSwimState(occupant.behavior, STAGE_WIDTH, STAGE_HEIGHT)
    swimmers.set(occupant.id, {
      ...state,
      id: occupant.id,
      facing: state.vx >= 0 ? 1 : -1,
    })
  }
  for (const id of swimmers.keys()) {
    if (!wanted.has(id)) swimmers.delete(id)
  }
}

function waterGradient(context: CanvasRenderingContext2D): CanvasGradient {
  const gradient = context.createLinearGradient(0, 0, 0, STAGE_HEIGHT)
  gradient.addColorStop(0, 'rgba(13, 43, 42, 0.22)')
  gradient.addColorStop(1, 'rgba(4, 16, 15, 0.5)')
  return gradient
}

let gradient: CanvasGradient | null = null
let gradientContext: CanvasRenderingContext2D | null = null

function drawSpriteAt(
  context: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  slug: string,
  x: number,
  y: number,
  facing: number,
  pitch: number,
  d: number,
  offset: number,
) {
  context.save()
  context.translate(x, y)
  context.scale(facing, 1)
  context.rotate(pitch)
  drawAnimatedSprite(
    context,
    sprite,
    motionForSpecies(slug),
    performance.now(),
    d,
    d,
    offset,
  )
  context.restore()
}

function drawOccupant(
  context: CanvasRenderingContext2D,
  swimmer: Swimmer,
  occupant: TankViewOccupant,
  scale = 1,
) {
  const hunger = occupant.hunger ?? 100
  const size = (10 + (occupant.size ?? 1) * 4) * scale
  const life = 0.3 + (hunger / 100) * 0.7
  const facing = swimmer.facing
  const sprite = cachedImage(
    spriteCache,
    occupant.slug,
    spriteForSpecies(occupant.slug),
  )
  const card = sprite
    ? null
    : cachedImage(cardCache, occupant.slug, artForSpecies(occupant.slug))

  context.globalAlpha = life
  context.filter = hunger < 100 ? `saturate(${40 + hunger * 0.6}%)` : 'none'

  if (sprite) {
    const d = size * 3
    const pitch = pitchOf(swimmer)
    for (const mate of packmatePositions(swimmer, facing)) {
      drawSpriteAt(
        context,
        sprite,
        occupant.slug,
        mate.x,
        mate.y,
        facing,
        pitch,
        d * mate.scale,
        mate.offset,
      )
    }
    drawSpriteAt(
      context,
      sprite,
      occupant.slug,
      swimmer.x,
      swimmer.y,
      facing,
      pitch,
      d,
      (occupant.id % 17) / 17,
    )
  } else {
    context.save()
    context.translate(swimmer.x, swimmer.y)
    context.scale(facing, 1)
    if (card) {
      const d = size * 2.6
      context.drawImage(card, -d / 2, -d / 2, d, d)
    } else {
      const hue = occupant.hue ?? fallbackHue(occupant.slug)
      context.fillStyle = `hsl(${hue}, ${28 + hunger * 0.35}%, ${20 + hunger * 0.14}%)`
      context.beginPath()
      context.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2)
      context.fill()
      context.beginPath()
      context.moveTo(-size, 0)
      context.lineTo(-size * 1.7, -size * 0.5)
      context.lineTo(-size * 1.7, size * 0.5)
      context.closePath()
      context.fill()
      context.fillStyle = 'rgb(240, 250, 245)'
      context.beginPath()
      context.arc(
        size * 0.45,
        -size * 0.12,
        Math.max(1.6, size * 0.13),
        0,
        Math.PI * 2,
      )
      context.fill()
    }
    context.restore()
  }

  context.filter = 'none'
  context.globalAlpha = 1
}

function render(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
  if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
    if (backgroundCrop) {
      const w = backgroundImage.naturalWidth
      const h = backgroundImage.naturalHeight
      context.drawImage(
        backgroundImage,
        backgroundCrop.x * w,
        backgroundCrop.y * h,
        backgroundCrop.w * w,
        backgroundCrop.h * h,
        0,
        0,
        STAGE_WIDTH,
        STAGE_HEIGHT,
      )
    } else {
      context.drawImage(backgroundImage, 0, 0, STAGE_WIDTH, STAGE_HEIGHT)
    }
  }

  if (!gradient || gradientContext !== context) {
    gradient = waterGradient(context)
    gradientContext = context
  }
  context.fillStyle = gradient
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

  drawAmbienceBack(context, ambience, STAGE_WIDTH, STAGE_HEIGHT)

  context.font = '28px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  for (const item of props.decor) {
    context.fillText(
      decorIcon(item.kind),
      (item.x / 100) * STAGE_WIDTH,
      (item.y / 100) * STAGE_HEIGHT,
    )
  }

  const clingers: Array<[Swimmer, TankViewOccupant]> = []
  for (const occupant of props.occupants) {
    const swimmer = swimmers.get(occupant.id)
    if (!swimmer) continue
    if (swimmer.mode === 'cling') clingers.push([swimmer, occupant])
    else drawOccupant(context, swimmer, occupant)
  }

  drawAmbienceFront(context, ambience, STAGE_WIDTH, STAGE_HEIGHT)

  for (const [swimmer, occupant] of clingers) {
    drawOccupant(context, swimmer, occupant, CLINGER_SCALE)
  }
}

function step(delta: number) {
  syncSwimmers()
  for (const swimmer of swimmers.values()) {
    stepSwimState(swimmer, {
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      delta,
      speedMultiplier: 1,
      pointer,
      food: null,
    })
    swimmer.facing = facingOf(swimmer, swimmer.facing)
  }
  stepAmbience(ambience, STAGE_WIDTH, STAGE_HEIGHT, delta)
}

let frame = 0
let lastFrameAt = 0
let onScreen = false

function loop(timestamp: number) {
  const context = canvasRef.value?.getContext('2d')
  if (!context) {
    frame = 0
    return
  }
  context.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0)
  const delta = Math.min((timestamp - lastFrameAt) / 1000 || 0, 0.1)
  lastFrameAt = timestamp
  step(delta)
  render(context)
  frame = window.requestAnimationFrame(loop)
}

function start() {
  if (frame !== 0) return
  frame = window.requestAnimationFrame((timestamp) => {
    lastFrameAt = timestamp
    frame = window.requestAnimationFrame(loop)
  })
}

function stop() {
  if (frame !== 0) window.cancelAnimationFrame(frame)
  frame = 0
}

function updateRunning() {
  if (onScreen && !document.hidden) start()
  else stop()
}

function stageCoords(event: PointerEvent): { x: number; y: number } | null {
  const bounds = canvasRef.value?.getBoundingClientRect()
  if (!bounds || !bounds.width || !bounds.height) return null
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * STAGE_WIDTH,
    y: ((event.clientY - bounds.top) / bounds.height) * STAGE_HEIGHT,
  }
}

function onPointerDown(event: PointerEvent) {
  const coords = stageCoords(event)
  if (!coords) return
  for (const swimmer of swimmers.values()) startle(swimmer, coords.x, coords.y)
}

function onPointerMove(event: PointerEvent) {
  pointer = stageCoords(event)
}

function onPointerLeave() {
  pointer = null
}

let observer: IntersectionObserver | null = null

watch(
  () => props.backgroundKey,
  (key) => loadBackground(key),
)

onMounted(() => {
  loadBackground(props.backgroundKey)
  syncSwimmers()
  document.addEventListener('visibilitychange', updateRunning)
  observer = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting)
    updateRunning()
  })
  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', updateRunning)
  observer?.disconnect()
  stop()
})
</script>
