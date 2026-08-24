<!-- components/cthulhuquarium/cthulhuquarium-game.vue
     The Cthulhuquarium play-loop prototype, dropped into the /play/aquarium
     scaffold's #interactive slot (conductor cthulhuquarium/t-010).

     Client-only and localStorage-backed on purpose: it makes the Play tab
     playable the day it lands rather than shipping an empty shell. Fish are
     drawn shapes, not art, and the species list is a placeholder subset of the
     canonical fish bible. cthulhuquarium/t-009 and t-011 replace the store and
     the renderer with the server-authoritative loop and real generated art;
     this component's job until then is to prove the loop is fun. -->
<template>
  <ClientOnly>
    <div class="kr-container flex max-w-3xl flex-col gap-3">
      <div
        v-if="store.offlineEarnings > 0"
        class="alert rounded-xl border border-info/40 bg-info/10 py-2 text-sm"
      >
        <Icon name="kind-icon:coin" class="size-4 shrink-0" />
        <span>
          Something was collected while you were gone:
          <b>{{ store.offlineEarnings }}</b> coins. Nobody says by whom.
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-3 text-sm font-bold">
          <span class="flex items-center gap-1">
            <Icon name="kind-icon:coin" class="size-4 text-warning" />
            {{ store.coins }}
          </span>
          <span class="flex items-center gap-1 opacity-70">
            <Icon name="kind-icon:fish" class="size-4" />
            {{ store.stock.length }}
          </span>
          <span class="flex items-center gap-1 opacity-70">
            🍖 {{ store.food }}
          </span>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm"
            :disabled="store.coins < store.foodCost"
            @click="store.buyFood()"
          >
            Buy food ({{ store.foodCost }})
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="store.food <= 0"
            @click="onFeed"
          >
            Feed
          </button>
        </div>
      </div>

      <canvas
        ref="canvasRef"
        class="w-full cursor-pointer rounded-2xl border border-base-300 bg-base-300"
        :width="STAGE_WIDTH"
        :height="STAGE_HEIGHT"
        aria-label="Aquarium tank. Click drifting motes to collect coins."
        @click="onCanvasClick"
      />

      <p class="text-xs opacity-60">
        Click the drifting motes for coins. Feed buys something live and drops
        it in. Fed occupants pay out on their own; hungry ones stop, but nothing
        you have earned is ever lost. Progress saves in this browser only — a
        real account-backed tank arrives with the aquarium API.
      </p>

      <div class="flex flex-col gap-2">
        <p class="text-xs font-black uppercase tracking-wide opacity-60">
          The tank
        </p>
        <!-- Column count follows the host panel's real width, not the viewport:
             this is a shared component and the layout contract's viewport-grid
             rule forbids sm:/md: grid-cols here. -->
        <div class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
          <div
            v-for="species in PROTOTYPE_SPECIES"
            :key="species.slug"
            class="rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-bold">
                  {{ store.unlocked.has(species.slug) ? species.name : '???' }}
                </p>
                <p class="mt-0.5 text-xs italic opacity-70">
                  {{
                    store.unlocked.has(species.slug)
                      ? species.note
                      : 'Not yet observed.'
                  }}
                </p>
              </div>
              <button
                v-if="!store.unlocked.has(species.slug)"
                type="button"
                class="btn btn-outline btn-xs shrink-0"
                :disabled="store.coins < species.unlockCost"
                @click="store.unlock(species.slug)"
              >
                {{ species.unlockCost }}
              </button>
            </div>
            <p
              v-if="store.unlocked.has(species.slug)"
              class="mt-1 text-xs opacity-60"
            >
              {{ species.yield }} coins every {{ species.interval }}s
            </p>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  PROTOTYPE_SPECIES,
  useCthulhuquariumStore,
} from '~/stores/cthulhuquariumStore'

/* Fixed logical resolution; CSS scales it to the host width so the canvas
   survives phone widths without its own breakpoint logic. */
const STAGE_WIDTH = 640
const STAGE_HEIGHT = 360

const MOTE_RADIUS = 9
const MOTE_VALUE = 4
const MOTE_SPAWN_SECONDS = 2.4
const MAX_MOTES = 6
const FOOD_FALL_SPEED = 70

type Swimmer = {
  slug: string
  x: number
  y: number
  vx: number
  vy: number
  phase: number
}

type Mote = { x: number; y: number; drift: number; born: number }
/* The food is ALIVE (Silas, 2026-08-24) -- "our fish food should be wriggling". It is
   livestock bought by the handful, not a pellet: it squirms on the way down and stops
   when eaten. `phase` drives the wriggle, `lean` gives each one its own bias so a
   handful never moves in unison. */
type FeedCreature = { x: number; y: number; phase: number; lean: number }

const store = useCthulhuquariumStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const swimmers = ref<Swimmer[]>([])
const motes = ref<Mote[]>([])
const feed = ref<FeedCreature[]>([])

let frame = 0
let lastFrameAt = 0
let sinceMote = 0
let sincePersist = 0

function spawnSwimmer(slug: string): Swimmer {
  const species = store.speciesBySlug.get(slug)
  const speed =
    species?.behavior === 'dart' ? 62 : species?.behavior === 'lurk' ? 16 : 34
  return {
    slug,
    x: Math.random() * STAGE_WIDTH,
    y: 60 + Math.random() * (STAGE_HEIGHT - 110),
    vx: Math.random() < 0.5 ? -speed : speed,
    vy: 0,
    phase: Math.random() * Math.PI * 2,
  }
}

/** Keep one drawn swimmer per stocked occupant. */
function syncSwimmers() {
  const want = store.stock.map((entry) => entry.slug)
  const have = swimmers.value.map((entry) => entry.slug)
  for (const slug of want) {
    const index = have.indexOf(slug)
    if (index === -1) swimmers.value.push(spawnSwimmer(slug))
    else have[index] = ''
  }
  swimmers.value = swimmers.value.filter((swimmer) =>
    want.includes(swimmer.slug),
  )
}

function drawFish(
  context: CanvasRenderingContext2D,
  swimmer: Swimmer,
  hunger: number,
) {
  const species = store.speciesBySlug.get(swimmer.slug)
  if (!species) return
  const facing = swimmer.vx >= 0 ? 1 : -1
  const size = 10 + species.tier * 5
  // Hungry occupants desaturate and dim rather than vanishing, so a neglected
  // tank reads as neglected at a glance.
  const life = 0.3 + (hunger / 100) * 0.7

  context.save()
  context.translate(swimmer.x, swimmer.y)
  context.scale(facing, 1)
  context.fillStyle = `hsla(${species.hue}, ${28 + hunger * 0.35}%, ${20 + hunger * 0.14}%, ${life})`

  context.beginPath()
  context.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.moveTo(-size, 0)
  context.lineTo(-size - size * 0.7, -size * 0.5)
  context.lineTo(-size - size * 0.7, size * 0.5)
  context.closePath()
  context.fill()

  context.fillStyle = `rgba(240, 250, 245, ${life})`
  context.beginPath()
  context.arc(
    size * 0.45,
    -size * 0.12,
    Math.max(1.6, size * 0.13),
    0,
    Math.PI * 2,
  )
  context.fill()

  if (species.behavior === 'lurk') {
    // The angler's lure — the one light in the tank that is bait.
    context.fillStyle = `rgba(190, 255, 140, ${life})`
    context.beginPath()
    context.arc(size * 1.1, -size * 0.75, 2.6, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function render(context: CanvasRenderingContext2D) {
  const water = context.createLinearGradient(0, 0, 0, STAGE_HEIGHT)
  water.addColorStop(0, '#0d2b2a')
  water.addColorStop(1, '#04100f')
  context.fillStyle = water
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)

  context.fillStyle = 'rgba(150, 255, 210, 0.06)'
  context.beginPath()
  context.moveTo(STAGE_WIDTH * 0.35, 0)
  context.lineTo(STAGE_WIDTH * 0.62, 0)
  context.lineTo(STAGE_WIDTH * 0.78, STAGE_HEIGHT)
  context.lineTo(STAGE_WIDTH * 0.2, STAGE_HEIGHT)
  context.closePath()
  context.fill()

  for (const creature of feed.value) {
    // Three segments hinged off a shared phase: enough to read as something
    // struggling, cheap enough to draw a handful of at 60fps.
    context.strokeStyle = 'rgba(226, 196, 148, 0.92)'
    context.lineWidth = 2.4
    context.lineCap = 'round'
    context.beginPath()
    for (let segment = 0; segment <= 3; segment += 1) {
      const bend = Math.sin(creature.phase + segment * 0.9) * 2.6
      const x = creature.x + bend + creature.lean * segment
      const y = creature.y + segment * 2.4
      if (segment === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }

  for (const swimmer of swimmers.value) {
    const entry = store.stock.find((item) => item.slug === swimmer.slug)
    drawFish(context, swimmer, entry?.hunger ?? 0)
  }

  for (const mote of motes.value) {
    context.fillStyle = 'rgba(255, 236, 160, 0.85)'
    context.beginPath()
    context.arc(mote.x, mote.y, MOTE_RADIUS, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = 'rgba(255, 236, 160, 0.35)'
    context.lineWidth = 2
    context.beginPath()
    context.arc(mote.x, mote.y, MOTE_RADIUS + 4, 0, Math.PI * 2)
    context.stroke()
  }
}

function step(delta: number) {
  store.tick(delta)
  syncSwimmers()

  for (const swimmer of swimmers.value) {
    const target = feed.value[0]
    if (target) {
      // Fish path toward food rather than ignoring it — the feed button has to
      // visibly do something or nobody presses it twice.
      const dx = target.x - swimmer.x
      const dy = target.y - swimmer.y
      const distance = Math.hypot(dx, dy) || 1
      swimmer.x += (dx / distance) * 55 * delta
      swimmer.y += (dy / distance) * 55 * delta
      swimmer.vx = dx >= 0 ? Math.abs(swimmer.vx) : -Math.abs(swimmer.vx)
    } else {
      swimmer.phase += delta
      swimmer.x += swimmer.vx * delta
      swimmer.y += Math.sin(swimmer.phase) * 9 * delta
      if (swimmer.x < 20 || swimmer.x > STAGE_WIDTH - 20) swimmer.vx *= -1
      swimmer.y = Math.min(Math.max(swimmer.y, 40), STAGE_HEIGHT - 30)
    }
  }

  feed.value = feed.value.filter((creature) => {
    creature.y += FOOD_FALL_SPEED * delta
    // It struggles the whole way down, and drifts slightly as it does.
    creature.phase += delta * 9
    creature.x += Math.sin(creature.phase * 0.7) * 6 * delta
    const eaten = swimmers.value.some(
      (swimmer) =>
        Math.hypot(swimmer.x - creature.x, swimmer.y - creature.y) < 14,
    )
    return !eaten && creature.y < STAGE_HEIGHT - 8
  })

  sinceMote += delta
  if (sinceMote >= MOTE_SPAWN_SECONDS && motes.value.length < MAX_MOTES) {
    sinceMote = 0
    motes.value.push({
      x: 30 + Math.random() * (STAGE_WIDTH - 60),
      y: STAGE_HEIGHT - 20,
      drift: (Math.random() - 0.5) * 14,
      born: 0,
    })
  }
  motes.value = motes.value.filter((mote) => {
    mote.born += delta
    mote.y -= 26 * delta
    mote.x += mote.drift * delta
    return mote.y > 10
  })

  sincePersist += delta
  if (sincePersist >= 5) {
    sincePersist = 0
    store.persist()
  }
}

function loop(timestamp: number) {
  const context = canvasRef.value?.getContext('2d')
  if (!context) return
  // Clamp the delta so a backgrounded tab returning does not simulate one giant
  // step — offline time is settled by the store on init, not by the frame loop.
  const delta = Math.min((timestamp - lastFrameAt) / 1000 || 0, 0.1)
  lastFrameAt = timestamp
  step(delta)
  render(context)
  frame = window.requestAnimationFrame(loop)
}

function onCanvasClick(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const bounds = canvas.getBoundingClientRect()
  const x = ((event.clientX - bounds.left) / bounds.width) * STAGE_WIDTH
  const y = ((event.clientY - bounds.top) / bounds.height) * STAGE_HEIGHT
  const index = motes.value.findIndex(
    (mote) => Math.hypot(mote.x - x, mote.y - y) <= MOTE_RADIUS + 8,
  )
  if (index === -1) return
  motes.value.splice(index, 1)
  store.collect(MOTE_VALUE)
}

function onFeed() {
  if (!store.feed()) return
  feed.value.push({
    x: 60 + Math.random() * (STAGE_WIDTH - 120),
    y: 12,
    phase: Math.random() * Math.PI * 2,
    lean: (Math.random() - 0.5) * 1.6,
  })
}

onMounted(() => {
  store.init()
  syncSwimmers()
  frame = window.requestAnimationFrame((timestamp) => {
    lastFrameAt = timestamp
    frame = window.requestAnimationFrame(loop)
  })
})

onBeforeUnmount(() => {
  if (frame) window.cancelAnimationFrame(frame)
  store.persist()
})
</script>
