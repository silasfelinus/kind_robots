<!-- components/cthulhuquarium/cthulhuquarium-game.vue
     The real Cthulhuquarium play loop (conductor cthulhuquarium/t-011),
     replacing the t-010 localStorage prototype. Coins, hunger, and species
     ownership are the server's Aquarium/AquariumStock rows
     (server/api/aquarium/**) -- this component never invents an economy
     number, it only renders what the store last loaded and asks the store
     to feed/unlock/settle.

     Design notes for the reviewer (t-011's task note calls for "collectibles
     drift up and pay coins on click", but economy.yaml has no click-for-
     coins income path -- production is entirely tick-settled server-side,
     see server/utils/aquariumEconomy.ts's settleTick). Rather than invent a
     client-authoritative click economy, a settled tick's coinsEarned spawns
     drifting motes as a VISUAL reveal of coins the server already credited;
     clicking one just dismisses it. No extra request, no new balance path.

     Fish are still hand-drawn shapes, not art -- t-015 (full art pass) is
     the task that changes that. What's real now is the swim behavior itself:
     each occupant's Monster.behavior (the fish bible's own vocabulary --
     drift/dart/lurk/school/anchor/surface/hover/tumble/cling) selects a
     movement profile instead of a hardcoded three-value switch, and hue
     comes from Monster.hue when a balance pass has set it, falling back to
     a slug-derived hue so an unassigned species still reads consistently
     rather than defaulting to one color. -->
<template>
  <ClientOnly>
    <div class="kr-container flex max-w-3xl flex-col gap-3">
      <p v-if="tankStore.error" class="alert alert-error text-sm">
        {{ tankStore.error }}
      </p>

      <div
        v-if="tankStore.offlineEarnings > 0"
        class="alert rounded-xl border border-info/40 bg-info/10 py-2 text-sm"
      >
        <Icon name="kind-icon:coin" class="size-4 shrink-0" />
        <span>
          Something was collected while you were gone:
          <b>{{ tankStore.offlineEarnings }}</b> coins. Nobody says by whom.
        </span>
        <button
          type="button"
          class="btn btn-ghost btn-xs ml-auto"
          @click="tankStore.clearOfflineEarnings()"
        >
          Dismiss
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-3 text-sm font-bold">
          <span class="flex items-center gap-1">
            <Icon name="kind-icon:coin" class="size-4 text-warning" />
            {{ tankStore.coins }}
          </span>
          <span class="flex items-center gap-1 opacity-70">
            <Icon name="kind-icon:fish" class="size-4" />
            {{ tankStore.stock.length }}
          </span>
          <span class="flex items-center gap-1 text-xs opacity-60">
            {{ tankStore.occupantSize }}/{{ tankStore.sizeCap }} capacity
          </span>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="!tankStore.hungriest"
          @click="onFeed"
        >
          Feed hungriest
        </button>
      </div>

      <canvas
        ref="canvasRef"
        class="w-full cursor-pointer rounded-2xl border border-base-300 bg-base-300"
        :width="STAGE_WIDTH"
        :height="STAGE_HEIGHT"
        aria-label="Aquarium tank. Click drifting coins to collect them."
        @click="onCanvasClick"
      />

      <p v-if="tankStore.loading" class="text-xs opacity-60">
        Settling into your tank…
      </p>
      <p v-else class="text-xs opacity-60">
        Feed the hungriest occupant to keep it paying out. Coins accrue on their
        own while you're away and settle the moment you return -- nothing here
        is saved in this browser, it's all your tank.
      </p>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-xs font-black uppercase tracking-wide opacity-60">
            The tank
          </p>
        </div>
        <!-- Column count follows the host panel's real width, not the
             viewport: this is a shared component and the layout contract's
             viewport-grid rule forbids sm:/md: grid-cols here. -->
        <div class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
          <div
            v-for="entry in tankStore.stock"
            :key="entry.id"
            class="rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-bold">{{ entry.Monster.name }}</p>
                <p class="mt-0.5 text-xs italic opacity-70">
                  {{ entry.Monster.species || entry.Monster.behavior || '—' }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-outline btn-xs shrink-0"
                :disabled="entry.hunger >= 100"
                @click="tankStore.feed(entry.id)"
              >
                Feed
              </button>
            </div>
            <div
              class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-base-300"
            >
              <div
                class="h-full rounded-full bg-success transition-all"
                :class="{
                  'bg-warning': entry.hunger < 50,
                  'bg-error': entry.hunger < 20,
                }"
                :style="{ width: `${entry.hunger}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xs font-black uppercase tracking-wide opacity-60">
          Unlock a new occupant
        </p>
        <p v-if="tankStore.catalogLoading" class="text-xs opacity-60">
          Reading the bestiary…
        </p>
        <div
          v-else
          class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2"
        >
          <div
            v-for="entry in tankStore.catalog"
            :key="entry.id"
            class="flex items-start gap-2 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <kr-art-plate
              :source="entry"
              variant="icon"
              shape="plate"
              frame="thin"
              fit="cover"
              class="size-12 shrink-0"
              placeholder-icon="kind-icon:fish"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ entry.name }}</p>
              <!-- Deliberately never the field note here -- the server
                   doesn't even send it for unowned species
                   (cthulhuquarium/t-012). It reveals in the dialog below,
                   once, on unlock. -->
              <p class="mt-0.5 line-clamp-2 text-xs italic opacity-70">
                Not yet observed.
              </p>
              <button
                type="button"
                class="btn btn-outline btn-xs mt-1"
                :disabled="!canUnlock(entry)"
                @click="tankStore.unlock(entry.id)"
              >
                Unlock ({{ entry.cost }})
              </button>
            </div>
          </div>
          <p v-if="!tankStore.catalog.length" class="text-xs opacity-60">
            Nothing left to discover right now.
          </p>
        </div>
      </div>
    </div>

    <!-- The unlock reveal beat (cthulhuquarium/t-012): the field note is
         real information the player earned by paying for it, not shop
         copy -- so it gets a moment of its own instead of quietly sitting
         in a shrinking catalog card. -->
    <Teleport to="body">
      <dialog
        v-if="tankStore.revealedUnlock"
        class="modal modal-open"
        aria-modal="true"
        @cancel.prevent="tankStore.dismissReveal()"
      >
        <div
          class="modal-box flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-base-300 bg-base-100 text-center shadow-2xl"
        >
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            New occupant
          </p>
          <kr-art-plate
            :source="tankStore.revealedUnlock.Monster"
            variant="card"
            shape="plate"
            frame="thin"
            fit="cover"
            class="h-32 w-24"
            placeholder-icon="kind-icon:fish"
          />
          <h3 class="text-lg font-black">
            {{ tankStore.revealedUnlock.Monster.name }}
          </h3>
          <p
            v-if="tankStore.revealedUnlock.Monster.species"
            class="text-xs italic opacity-60"
          >
            {{ tankStore.revealedUnlock.Monster.species }}
          </p>
          <p class="text-sm opacity-80">
            {{
              tankStore.revealedUnlock.Monster.fieldNote ||
              'Nothing is written about this one yet.'
            }}
          </p>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-1"
            @click="tankStore.dismissReveal()"
          >
            Add it to the tank
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="tankStore.dismissReveal()">
            close
          </button>
        </form>
      </dialog>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  TANK_POLL_INTERVAL_MS,
  useCthulhuquariumTankStore,
  type CatalogEntry,
  type TankStock,
} from '~/stores/cthulhuquariumTankStore'

/* Fixed logical resolution; CSS scales it to the host width so the canvas
   survives phone widths without its own breakpoint logic. */
const STAGE_WIDTH = 640
const STAGE_HEIGHT = 360

const MOTE_RADIUS = 9
const FOOD_FALL_SPEED = 70
/* Caps how many motes one settled tick can spawn at once -- a long-idle
   catch-up shouldn't paper the tank in coins, just show a satisfying handful. */
const MAX_MOTE_BATCH = 6

type BehaviorProfile = {
  speed: number
  vBand: readonly [number, number]
  wobble: number
  wallCling: boolean
  stationary: boolean
  lure: boolean
}

// The fish bible's own movement vocabulary (schema.prisma's Monster.behavior
// doc comment). Unknown/missing behavior falls back to DRIFT_PROFILE rather
// than failing to render -- a data gap should never mean an invisible fish.
const DRIFT_PROFILE: BehaviorProfile = {
  speed: 34,
  vBand: [0.15, 0.85],
  wobble: 9,
  wallCling: false,
  stationary: false,
  lure: false,
}

const BEHAVIOR_PROFILES: Record<string, BehaviorProfile> = {
  drift: DRIFT_PROFILE,
  dart: {
    speed: 62,
    vBand: [0.15, 0.85],
    wobble: 9,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  lurk: {
    speed: 14,
    vBand: [0.15, 0.85],
    wobble: 3,
    wallCling: false,
    stationary: false,
    lure: true,
  },
  school: {
    speed: 40,
    vBand: [0.25, 0.7],
    wobble: 7,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  anchor: {
    speed: 4,
    vBand: [0.7, 0.92],
    wobble: 1.5,
    wallCling: false,
    stationary: true,
    lure: false,
  },
  surface: {
    speed: 26,
    vBand: [0.05, 0.22],
    wobble: 6,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  hover: {
    speed: 10,
    vBand: [0.3, 0.6],
    wobble: 2,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  tumble: {
    speed: 20,
    vBand: [0.15, 0.85],
    wobble: 14,
    wallCling: false,
    stationary: false,
    lure: false,
  },
  cling: {
    speed: 5,
    vBand: [0.15, 0.85],
    wobble: 1,
    wallCling: true,
    stationary: false,
    lure: false,
  },
}

function behaviorProfile(behavior: string | null): BehaviorProfile {
  return BEHAVIOR_PROFILES[(behavior || '').toLowerCase()] ?? DRIFT_PROFILE
}

// Deterministic fallback hue for a species Monster.hue hasn't been assigned
// yet -- same slug always reads the same color instead of shifting on
// every reload/re-render.
function hashHue(slug: string): number {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0
  }
  return hash % 360
}

type Swimmer = {
  stockId: number
  monsterId: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  profile: BehaviorProfile
}

type Mote = { x: number; y: number; drift: number }
/* The food is ALIVE (Silas, 2026-08-24) -- it wriggles on the way down and
   stops when eaten. `phase` drives the wriggle, `lean` gives each one its
   own bias so a handful never moves in unison. */
type FeedCreature = { x: number; y: number; phase: number; lean: number }

const tankStore = useCthulhuquariumTankStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const swimmers = ref<Swimmer[]>([])
const motes = ref<Mote[]>([])
const feed = ref<FeedCreature[]>([])

let frame = 0
let lastFrameAt = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

function canUnlock(entry: CatalogEntry): boolean {
  return (
    tankStore.coins >= entry.cost &&
    tankStore.occupantSize + (entry.size ?? 1) <= tankStore.sizeCap
  )
}

function spawnSwimmer(stock: TankStock): Swimmer {
  const profile = behaviorProfile(stock.Monster.behavior)
  return {
    stockId: stock.id,
    monsterId: stock.monsterId,
    x: Math.random() * STAGE_WIDTH,
    y:
      STAGE_HEIGHT *
      (profile.vBand[0] +
        Math.random() * (profile.vBand[1] - profile.vBand[0])),
    vx: Math.random() < 0.5 ? -profile.speed : profile.speed,
    vy: 0,
    phase: Math.random() * Math.PI * 2,
    profile,
  }
}

/** Keep one drawn swimmer per stocked occupant. */
function syncSwimmers() {
  const want = tankStore.stock.map((entry) => entry.id)
  const have = swimmers.value.map((entry) => entry.stockId)
  for (const entry of tankStore.stock) {
    if (!have.includes(entry.id)) swimmers.value.push(spawnSwimmer(entry))
  }
  swimmers.value = swimmers.value.filter((swimmer) =>
    want.includes(swimmer.stockId),
  )
}

function stockFor(swimmer: Swimmer): TankStock | undefined {
  return tankStore.stock.find((entry) => entry.id === swimmer.stockId)
}

function drawFish(
  context: CanvasRenderingContext2D,
  swimmer: Swimmer,
  hunger: number,
  monster: TankStock['Monster'],
) {
  const hue = monster.hue ?? hashHue(monster.slug)
  const facing = swimmer.vx >= 0 ? 1 : -1
  const size = 10 + (monster.size ?? 1) * 4
  // Hungry occupants desaturate and dim rather than vanishing, so a
  // neglected tank reads as neglected at a glance.
  const life = 0.3 + (hunger / 100) * 0.7

  context.save()
  context.translate(swimmer.x, swimmer.y)
  context.scale(facing, 1)
  context.fillStyle = `hsla(${hue}, ${28 + hunger * 0.35}%, ${20 + hunger * 0.14}%, ${life})`

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

  if (swimmer.profile.lure) {
    // The angler's lure -- the one light in the tank that is bait.
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

  // Debris tints the water -- ambient only, no interaction wired here.
  const debris = tankStore.tank?.debrisLevel ?? 0
  if (debris > 0) {
    context.fillStyle = `rgba(120, 110, 70, ${Math.min(0.22, debris / 400)})`
    context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
  }

  context.fillStyle = 'rgba(150, 255, 210, 0.06)'
  context.beginPath()
  context.moveTo(STAGE_WIDTH * 0.35, 0)
  context.lineTo(STAGE_WIDTH * 0.62, 0)
  context.lineTo(STAGE_WIDTH * 0.78, STAGE_HEIGHT)
  context.lineTo(STAGE_WIDTH * 0.2, STAGE_HEIGHT)
  context.closePath()
  context.fill()

  for (const creature of feed.value) {
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
    const entry = stockFor(swimmer)
    if (!entry) continue
    drawFish(context, swimmer, entry.hunger, entry.Monster)
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
  syncSwimmers()

  for (const swimmer of swimmers.value) {
    const target = feed.value[0]
    if (target && !swimmer.profile.stationary) {
      // Fish path toward food rather than ignoring it.
      const dx = target.x - swimmer.x
      const dy = target.y - swimmer.y
      const distance = Math.hypot(dx, dy) || 1
      swimmer.x += (dx / distance) * 55 * delta
      swimmer.y += (dy / distance) * 55 * delta
      swimmer.vx = dx >= 0 ? Math.abs(swimmer.vx) : -Math.abs(swimmer.vx)
    } else {
      const [minY, maxY] = swimmer.profile.vBand
      const bandTop = STAGE_HEIGHT * minY
      const bandBottom = STAGE_HEIGHT * maxY
      swimmer.phase += delta
      swimmer.x += swimmer.vx * delta
      swimmer.y += Math.sin(swimmer.phase) * swimmer.profile.wobble * delta
      if (swimmer.profile.wallCling) {
        // Clings near whichever wall it's closest to rather than crossing
        // the whole tank.
        const nearLeft = swimmer.x < STAGE_WIDTH / 2
        swimmer.x += ((nearLeft ? 30 : STAGE_WIDTH - 30) - swimmer.x) * 0.02
      }
      if (swimmer.x < 20 || swimmer.x > STAGE_WIDTH - 20) swimmer.vx *= -1
      swimmer.y = Math.min(Math.max(swimmer.y, bandTop), bandBottom)
    }
  }

  feed.value = feed.value.filter((creature) => {
    creature.y += FOOD_FALL_SPEED * delta
    creature.phase += delta * 9
    creature.x += Math.sin(creature.phase * 0.7) * 6 * delta
    const eaten = swimmers.value.some(
      (swimmer) =>
        Math.hypot(swimmer.x - creature.x, swimmer.y - creature.y) < 14,
    )
    return !eaten && creature.y < STAGE_HEIGHT - 8
  })

  motes.value = motes.value.filter((mote) => {
    mote.y -= 26 * delta
    mote.x += mote.drift * delta
    return mote.y > 10
  })
}

function loop(timestamp: number) {
  const context = canvasRef.value?.getContext('2d')
  if (!context) return
  // Clamp the delta so a backgrounded tab returning does not simulate one
  // giant step -- coins/hunger are settled server-side, not by this loop.
  const delta = Math.min((timestamp - lastFrameAt) / 1000 || 0, 0.1)
  lastFrameAt = timestamp
  step(delta)
  render(context)
  frame = window.requestAnimationFrame(loop)
}

function spawnMotes(coinsEarned: number) {
  const count = Math.min(
    MAX_MOTE_BATCH,
    Math.max(1, Math.round(coinsEarned / 5)),
  )
  for (let index = 0; index < count; index += 1) {
    motes.value.push({
      x: 30 + Math.random() * (STAGE_WIDTH - 60),
      y: STAGE_HEIGHT - 20 - Math.random() * 30,
      drift: (Math.random() - 0.5) * 14,
    })
  }
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
  // Clicking a mote just dismisses it -- the coins it represents were
  // already credited by the tick settlement that spawned it.
  if (index !== -1) motes.value.splice(index, 1)
}

async function onFeed() {
  const target = tankStore.hungriest
  if (!target) return
  const ok = await tankStore.feed(target.id)
  if (!ok) return
  const swimmer = swimmers.value.find((entry) => entry.stockId === target.id)
  feed.value.push({
    x: swimmer?.x ?? 60 + Math.random() * (STAGE_WIDTH - 120),
    y: 12,
    phase: Math.random() * Math.PI * 2,
    lean: (Math.random() - 0.5) * 1.6,
  })
}

async function pollTick() {
  const earned = await tankStore.settleTick()
  if (earned > 0) spawnMotes(earned)
}

onMounted(async () => {
  await tankStore.load()
  await tankStore.loadCatalog()
  syncSwimmers()
  pollTimer = setInterval(pollTick, TANK_POLL_INTERVAL_MS)
  frame = window.requestAnimationFrame((timestamp) => {
    lastFrameAt = timestamp
    frame = window.requestAnimationFrame(loop)
  })
})

onBeforeUnmount(() => {
  if (frame) window.cancelAnimationFrame(frame)
  if (pollTimer) clearInterval(pollTimer)
})
</script>
