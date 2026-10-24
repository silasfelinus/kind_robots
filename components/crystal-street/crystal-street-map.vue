<template>
  <section
    v-if="run"
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @3xl:grid-rows-1"
    aria-label="Glimmer Falls by day"
  >
    <div class="cs-frame cs-map relative min-h-0 overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        class="absolute inset-0 h-full w-full"
        role="group"
        aria-label="Town map"
      >
        <rect width="100" height="100" fill="#8fd6a8" />
        <path
          d="M0 46 Q30 40 50 55 T100 50"
          stroke="#f4efe0"
          stroke-width="4"
          fill="none"
        />
        <path
          d="M40 0 Q46 30 50 55 T46 100"
          stroke="#f4efe0"
          stroke-width="4"
          fill="none"
        />
        <path
          d="M12 56 Q30 72 64 74 T88 88"
          stroke="#f4efe0"
          stroke-width="2.6"
          fill="none"
        />
        <path
          d="M22 30 Q50 22 75 28"
          stroke="#f4efe0"
          stroke-width="2.6"
          fill="none"
        />
        <circle
          cx="50"
          cy="55"
          r="6"
          fill="#6fbf86"
          stroke="#f4efe0"
          stroke-width="1.5"
        />
        <path
          d="M48 57 L49 53.5 L50.3 52.5 L51.8 53.6 L52.4 57 Z"
          fill="#9b3dff"
        />
        <path d="M70 0 Q78 20 100 24 V0 Z" fill="#5ec8e5" opacity="0.7" />
        <g
          v-for="loc in LOCATIONS"
          :key="loc.id"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          :aria-label="`${loc.name}${hasClue(loc.id) ? ', a lead is here' : ''}`"
          :aria-pressed="selected === loc.id"
          @click="selected = loc.id as LocationId"
          @keydown.enter.prevent="selected = loc.id as LocationId"
          @keydown.space.prevent="selected = loc.id as LocationId"
        >
          <circle
            :cx="loc.x"
            :cy="loc.y"
            :r="selected === loc.id ? 4.6 : 3.4"
            :fill="loc.id === 'pawnshop' ? '#ffd23d' : '#ff3d8b'"
            stroke="#1b0b33"
            stroke-width="1"
          />
          <circle
            v-if="hasClue(loc.id)"
            :cx="loc.x + 3"
            :cy="loc.y - 3"
            r="1.6"
            fill="#4df2ff"
            stroke="#1b0b33"
            stroke-width="0.5"
          />
          <text
            :x="loc.x"
            :y="loc.y + (loc.y > 80 ? -5.5 : 7)"
            text-anchor="middle"
            font-size="3"
            font-weight="700"
            fill="#1b0b33"
            paint-order="stroke"
            stroke="#f4efe0"
            stroke-width="0.8"
          >
            {{ PIN_LABELS[loc.id] ?? loc.name }}
          </text>
        </g>
      </svg>
      <p
        class="absolute bottom-2 left-2 rounded-xl bg-black/60 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
      >
        {{ dayName }} · {{ run.actions }} action{{
          run.actions === 1 ? '' : 's'
        }}
        left
      </p>
      <button
        type="button"
        class="btn btn-sm btn-secondary absolute right-2 top-2 rounded-2xl"
        data-testid="cs-nightfall"
        @click="store.nightfall()"
      >
        <icon name="kind-icon:moon" class="h-4 w-4" />
        {{ run.actions ? 'End the day early' : 'Nightfall' }}
      </button>
    </div>

    <div v-if="location" class="kr-pane cs-frame">
      <div class="kr-pane-scroll space-y-3 p-3">
        <crystal-street-art
          class="rounded-xl"
          frame="aspect-[16/7]"
          kind="location"
          :seed="location.id"
          :src="`/crystal-street/locations/${location.id}.webp`"
          :alt="location.art"
        />
        <header>
          <h2 class="cs-display text-xl leading-tight">{{ location.name }}</h2>
          <p class="text-sm opacity-85">
            {{
              location.id === 'pawnshop'
                ? `Today Oddment and Daughters is parked at ${run.pawnshopSpot}.`
                : location.blurb
            }}
          </p>
        </header>
        <ul class="grid gap-2" aria-label="Things to do here">
          <li v-for="(activity, i) in activities" :key="i">
            <button
              type="button"
              class="cs-choice flex w-full items-center gap-3 text-left"
              :disabled="disabled(activity)"
              :data-testid="`cs-activity-${activity.kind}`"
              @click="store.activity(location.id as LocationId, activity)"
            >
              <crystal-street-portrait
                v-if="activity.kind === 'meet' || activity.kind === 'rejoin'"
                class="w-12 shrink-0"
                :companion="companionById(activity.companionId)!"
              />
              <icon
                v-else
                :name="iconFor(activity.kind)"
                class="h-8 w-8 shrink-0 opacity-80"
              />
              <span>
                <span class="block font-semibold leading-tight">{{
                  titleFor(activity)
                }}</span>
                <span class="block text-xs opacity-75">{{
                  subFor(activity)
                }}</span>
              </span>
            </button>
          </li>
          <li v-if="!activities.length" class="text-sm opacity-70">
            Nothing left to do here today.
          </li>
        </ul>
        <div
          v-if="run.shopOpen && location.id === 'pawnshop'"
          class="space-y-2"
        >
          <h3 class="cs-kicker">
            On the counter · you have {{ run.quarters }} quarters
          </h3>
          <ul class="grid grid-cols-1 gap-2 @lg:grid-cols-2">
            <li v-for="id in run.stock" :key="id">
              <button
                type="button"
                class="cs-choice w-full text-left"
                :disabled="!canBuy(id)"
                @click="store.buy(id)"
              >
                <span class="block font-semibold"
                  >{{ itemById(id)?.name }} · {{ itemById(id)?.price }}¢25</span
                >
                <span class="block text-xs opacity-75">{{
                  itemById(id)?.text
                }}</span>
                <span
                  v-if="run.items.includes(id)"
                  class="cs-pill cs-pill-good mt-1 inline-block"
                  >In your pack</span
                >
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  CREW_LIMIT,
  DAY_NAMES,
  LOCATIONS,
  GROCERY_COST,
  HEAL_NERVE,
  SKILL_LABELS,
  activitiesAt,
  companionById,
  encounterById,
  itemById,
  locationById,
  villainOf,
  type DayActivity,
} from '~/utils/crystalStreet/rules'
import type { ItemId, LocationId } from '~/utils/crystalStreet/ids'

const store = useCrystalStreetStore()
const run = computed(() => store.run)
const selected = ref<LocationId>('crystal-street')
const location = computed(() => locationById(selected.value))
const activities = computed(() =>
  run.value ? activitiesAt(run.value, selected.value) : [],
)
const dayName = computed(() => DAY_NAMES[(run.value?.day ?? 1) - 1] ?? '')

function hasClue(id: string): boolean {
  const r = run.value
  if (!r?.revealed) return false
  return villainOf(r).clues.some(
    (c) => c.location === id && !r.clues.includes(c.id),
  )
}

const PIN_LABELS: Record<string, string> = {
  'crystal-street': 'Crystal Street',
  library: 'Library',
  gym: 'Pump Iron Gym',
  'high-school': 'High School',
  'rewind-video': 'Rewind Video',
  'starlight-mall': 'Starlight Mall',
  'glitter-box': 'Glitter Box',
  pinecrest: 'Pinecrest',
  'kglm-radio': 'KGLM 103.3',
  junkyard: "Rusty's Junkyard",
  pawnshop: 'Pawnshop',
}

function disabled(activity: DayActivity): boolean {
  const r = run.value
  if (!r || r.actions <= 0) return true
  if (
    (activity.kind === 'meet' || activity.kind === 'rejoin') &&
    r.crew.length >= CREW_LIMIT
  )
    return true
  return false
}

function canBuy(id: ItemId): boolean {
  const r = run.value
  const item = itemById(id)
  return !!r && !!item && r.quarters >= item.price && !r.items.includes(id)
}

function iconFor(kind: DayActivity['kind']): string {
  return (
    {
      beat: 'kind-icon:sparkles',
      clue: 'kind-icon:search',
      meet: 'kind-icon:person',
      rejoin: 'kind-icon:person',
      train: 'kind-icon:lightning',
      shop: 'kind-icon:cart',
      rest: 'kind-icon:heart',
      heal: 'kind-icon:plus',
      groceries: 'kind-icon:bag',
    } as const
  )[kind]
}

function titleFor(activity: DayActivity): string {
  if (activity.kind === 'beat')
    return encounterById(activity.encounterId)?.title ?? 'Explore'
  if (activity.kind === 'clue') return 'Follow the lead'
  if (activity.kind === 'meet')
    return `Meet ${companionById(activity.companionId)?.name}`
  if (activity.kind === 'rejoin')
    return `Ask ${companionById(activity.companionId)?.name} back`
  if (activity.kind === 'train') return `Train ${SKILL_LABELS[activity.skill]}`
  if (activity.kind === 'shop') return 'Browse the pawnshop'
  if (activity.kind === 'heal') return 'See the nurse'
  if (activity.kind === 'groceries') return 'Stock up on comfort food'
  return 'Rest at home'
}

function subFor(activity: DayActivity): string {
  if (activity.kind === 'clue') {
    const v = run.value ? villainOf(run.value) : null
    return v?.clues.find((c) => c.id === activity.clueId)?.title ?? ''
  }
  if (activity.kind === 'meet')
    return companionById(activity.companionId)?.role ?? ''
  if (activity.kind === 'rejoin') return 'Rejoins your crew, no roll'
  if (activity.kind === 'train') return '+1 skill, once a day, up to 4'
  if (activity.kind === 'shop') return 'Spend quarters on gear'
  if (activity.kind === 'rest') return '+2 nerve'
  if (activity.kind === 'heal')
    return `+${HEAL_NERVE} nerve, shaken friends steady again`
  if (activity.kind === 'groceries')
    return `${GROCERY_COST} quarters: +1 nerve, −1 dread`
  return 'A daylight adventure'
}
</script>
