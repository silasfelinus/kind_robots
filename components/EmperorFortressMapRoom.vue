<template>
  <div class="grid gap-3 @4xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
    <section class="@container kr-panel self-start p-4 @4xl:sticky @4xl:top-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="sr-only">The map room</h2>
        <span
          class="tooltip tooltip-bottom tooltip-warning text-sm font-bold text-warning"
          :data-tip="
            run.hideout
              ? `${hostShareLine(run, factionName)} Half wages in hiding: ${wages} a day.`
              : `Collected every dawn from the land of Neutral, Friendly and Allied holders. Wages are ${wages} a day.`
          "
        >
          <template v-if="run.hideout"
            >{{ dailyIncome(run) }} brass a day from your host</template
          >
          <template v-else>{{ dailyTaxes(run) }} brass a day in taxes</template>
        </span>
        <span
          v-if="nextMap"
          class="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70"
        >
          The Day {{ nextMap - 1 }} map · {{ nextMap - run.day }} day{{
            nextMap - run.day === 1 ? '' : 's'
          }}
        </span>
      </div>
      <figure
        class="@container relative mt-3 overflow-hidden rounded-xl border border-base-content/15"
      >
        <img
          src="/emperor-of-dust/map/wasteland.webp"
          alt="Illustrated map of the wasteland around the fortress"
          class="block aspect-[1447/950] w-full object-cover"
        />
        <button
          v-for="region in mapped"
          :key="region.id"
          type="button"
          class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border bg-base-100/90 px-1.5 py-0.5 text-[10px] font-semibold shadow @md:text-xs"
          :class="[
            focused === region.id
              ? 'border-warning ring-2 ring-warning'
              : region.threatened
                ? 'border-error ring-2 ring-error/70'
                : 'border-base-content/30',
            region.wiped ? 'line-through opacity-60' : '',
          ]"
          :style="{ left: region.x + '%', top: region.y + '%' }"
          :aria-label="markerLabel(region)"
          :title="markerLabel(region)"
          :aria-pressed="focused === region.id"
          @click="focus(region.id)"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="tierDot(region.tier, region.wiped)"
            aria-hidden="true"
          />
          <span
            v-if="region.threatened"
            class="font-bold text-error"
            aria-hidden="true"
            >!</span
          >
        </button>
      </figure>
    </section>

    <section class="space-y-3">
      <div
        v-if="warnings.length"
        class="kr-panel border-error/50 p-4"
        aria-label="Warnings for the next map"
      >
        <h3 class="font-serif text-xl font-bold text-error">
          Before the Day {{ warnings[0]!.dueDay - 1 }} map
        </h3>
        <ul class="mt-2 space-y-2">
          <li
            v-for="warning in warnings"
            :key="warning.kind + warning.faction + (warning.region ?? '')"
            class="rounded-md border border-error/30 bg-error/5 p-2 text-sm"
          >
            <button
              type="button"
              class="block w-full text-left"
              @click="focus(warning.region ?? homeOf(warning.faction))"
            >
              <strong class="block font-serif text-base">{{
                warning.title
              }}</strong>
              <span class="block font-serif italic leading-snug">{{
                warning.text
              }}</span>
              <span class="mt-1 block text-xs font-semibold text-warning">{{
                warning.remedy
              }}</span>
            </button>
          </li>
        </ul>
      </div>

      <div
        v-if="forecast"
        class="kr-panel border-warning/40 p-4 text-sm"
        aria-label="Where the court would run"
      >
        <h3 class="font-serif text-xl font-bold">If the tower fell tonight</h3>
        <p v-if="forecast.first" class="mt-1 font-serif">
          The court would run to
          <strong>{{ hideoutName(forecast.first.hideout) }}</strong
          >. {{ factionName(forecast.first.host) }}:
          <span class="capitalize" :class="tierClass(forecast.first.tier)">{{
            forecast.first.tier
          }}</span
          >, {{ pledgeWords(forecast.first.pledges) }}.
        </p>
        <p v-else class="mt-1 font-serif">
          No friend on the map has a roof to offer. The court would hide in
          {{ hideoutName('nameless-cave') }}.
        </p>
        <p v-if="forecast.next" class="mt-1 text-xs opacity-80">
          Next: {{ hideoutName(forecast.next.hideout) }},
          {{ pledgeWords(forecast.next.pledges) }}.
        </p>
        <p class="mt-1 text-xs italic opacity-70">
          Only a Friendly or Allied banner takes the court in. Promises kept to
          one side weigh more than goodwill.
        </p>
      </div>

      <div class="kr-panel p-3">
        <h3 class="font-serif text-xl font-bold">The kingdom</h3>
        <ul
          class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2"
          aria-label="Kingdom banners"
        >
          <li
            v-for="region in regions"
            :key="region.id"
            :class="focused === region.id ? 'eod-banner-focused' : ''"
          >
            <button
              type="button"
              class="flex w-full flex-col items-center gap-1 text-center"
              :title="region.fogged ? 'Unmapped land' : markerLabel(region)"
              :aria-pressed="focused === region.id"
              :disabled="region.fogged"
              @click="focus(region.id)"
            >
              <span
                class="eod-banner relative grid h-20 w-14 place-items-center pb-3 font-serif text-xl font-bold"
                :class="
                  region.fogged
                    ? 'eod-banner-fog'
                    : region.wiped
                      ? 'eod-banner-gone'
                      : bannerClass(region.tier)
                "
                aria-hidden="true"
                >{{ region.fogged ? '?' : region.initial }}</span
              >
              <template v-if="region.fogged">
                <strong class="text-[11px] leading-tight">Unmapped</strong>
                <span class="text-[10px] uppercase tracking-wider opacity-60"
                  >Fog</span
                >
              </template>
              <template v-else>
                <strong class="text-[11px] leading-tight">{{
                  region.name
                }}</strong>
                <span
                  class="text-[10px] font-bold uppercase tracking-wider"
                  :class="region.wiped ? 'opacity-60' : tierClass(region.tier)"
                  >{{ region.wiped ? 'Gone' : region.tier }}</span
                >
                <span
                  v-if="!region.wiped"
                  class="text-[10px]"
                  :class="region.paid ? 'opacity-80' : 'text-error'"
                >
                  {{ region.paid ? `+${region.paid}` : `−${region.tax}` }}
                  brass
                </span>
                <span
                  v-if="region.taken"
                  class="text-[10px] italic text-warning"
                  >{{ region.holderName }}</span
                >
                <span
                  v-if="region.threatened"
                  class="text-[10px] font-bold uppercase text-error"
                  >Warned</span
                >
              </template>
            </button>
          </li>
        </ul>
      </div>

      <div v-if="focusedRegion" class="kr-panel overflow-hidden p-0 text-sm">
        <div
          class="relative h-28 bg-base-300"
          :style="regionCropStyle(focusedRegion.id)"
          role="img"
          :aria-label="`The painted map around ${focusedRegion.name}`"
        >
          <span
            class="eod-display absolute bottom-2 left-3 rounded bg-black/60 px-2 py-0.5 text-base text-amber-50"
            >{{ focusedRegion.name }}</span
          >
        </div>
        <div class="space-y-2 p-3">
          <p v-if="focusedRegion.wiped">
            Its banner is gone from the map. This land pays nobody now.
          </p>
          <template v-else>
            <p>
              Held by <strong>{{ focusedRegion.holderName }}</strong
              ><span v-if="focusedRegion.taken"
                >, taken from {{ focusedRegion.firstName }}</span
              >. With the throne:
              <strong
                class="capitalize"
                :class="tierClass(focusedRegion.tier)"
                >{{ focusedRegion.tier }}</strong
              >.
            </p>
            <ul class="grid grid-cols-5 gap-1 text-center text-[10px]">
              <li
                v-for="entry in LEGEND"
                :key="entry.tier"
                class="tooltip rounded border px-1 py-1"
                :class="
                  entry.tier === focusedRegion.tier
                    ? 'border-warning bg-warning/15 font-bold'
                    : 'border-base-content/15 opacity-70'
                "
                :data-tip="`${entry.tier}: ${entry.text}`"
              >
                <span class="block capitalize">{{ entry.tier }}</span>
                <span class="block text-xs">{{
                  taxAtTier(focusedRegion.tax, entry.tier)
                }}</span>
              </li>
            </ul>
            <p class="text-xs opacity-75">
              Rate {{ focusedRegion.tax }} brass a day. At
              {{ focusedRegion.tier }} it pays {{ focusedRegion.paid }}.
            </p>
          </template>
          <p
            v-for="warning in focusedWarnings"
            :key="warning.kind + warning.faction"
            class="text-xs font-semibold text-error"
          >
            {{ warning.title }}. {{ warning.remedy }}
          </p>
        </div>
      </div>

      <div v-if="history.length" class="kr-panel p-4 text-sm">
        <h3 class="font-serif text-xl font-bold">What changed</h3>
        <section v-for="act in history" :key="act.day" class="mt-2">
          <h4
            class="text-[10px] font-semibold uppercase tracking-[0.2em] text-warning"
          >
            {{ act.label }}
          </h4>
          <ul class="mt-1 space-y-1">
            <li
              v-for="(entry, i) in act.events"
              :key="i"
              class="border-l-2 pl-2"
              :class="
                entry.warning
                  ? 'border-error/40 text-xs opacity-75'
                  : 'border-warning/60'
              "
            >
              <strong>{{ entry.title }}.</strong> {{ entry.text }}
            </li>
          </ul>
        </section>
      </div>

      <div class="kr-panel p-4 text-sm">
        <h3 class="font-serif text-xl font-bold">Kingdom ledgers</h3>
        <p class="text-xs italic opacity-75">
          Each border is a promise made to someone.
        </p>
        <ul class="mt-2 space-y-1 text-xs">
          <li
            v-for="entry in LEGEND"
            :key="entry.tier"
            class="flex items-center gap-2"
          >
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              :class="tierDot(entry.tier, false)"
            />
            <span class="font-semibold capitalize">{{ entry.tier }}</span>
            <span class="opacity-70">{{ entry.text }}</span>
          </li>
        </ul>
      </div>
      <div class="kr-panel p-4">
        <h3 class="font-serif text-xl font-bold">The fortress</h3>
        <ul class="mt-2 space-y-2">
          <li
            v-for="faction in LOCAL_FACTION_DEFS"
            :key="faction.id"
            class="text-sm"
          >
            <span class="flex items-center justify-between">
              <strong>{{ faction.name }}</strong>
              <span class="font-bold">{{ run.local[faction.id] }}</span>
            </span>
            <progress
              class="progress progress-warning h-1.5 w-full"
              :value="run.local[faction.id]"
              :max="LOCAL_MAX"
              :aria-label="faction.name + ' support'"
            />
            <span class="block text-xs opacity-65">{{ faction.wants }}</span>
          </li>
        </ul>
      </div>
      <div v-if="run.hideout" class="kr-panel p-4 text-sm">
        <h3 class="font-serif text-xl font-bold">In hiding</h3>
        <p class="mt-1">
          The court now hides at: {{ hideoutName(run.hideout) }}.
        </p>
        <p v-if="buyerOf(run)" class="mt-1">
          The tower flies {{ BUYERS[buyerOf(run)!].banner }}.
        </p>
        <p class="mt-1 opacity-80">
          {{ hostShareLine(run, factionName) }} No region pays a crown in
          hiding.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  dailyIncome,
  dailyTaxes,
  dailyWages,
  factionName,
  hideoutForecast,
  mapEventText,
  mapWarnings,
  nextActEnd,
  regionHolder,
  regionTax,
} from '~/utils/emperorOfDust/fortress/engine'
import {
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
  REGIONS,
  taxAtTier,
} from '~/utils/emperorOfDust/fortress/factions'
import {
  BUYERS,
  buyerOf,
  hostShareLine,
} from '~/utils/emperorOfDust/fortress/betrayal'
import { regionCropStyle } from '~/utils/emperorOfDust/fortress/questArt'
import type {
  AffinityTier,
  FortressRun,
  KingdomFactionId,
} from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun }>()

const warnings = computed(() => mapWarnings(props.run))
const nextMap = computed(() =>
  props.run.day <= 40 ? nextActEnd(props.run.day) : undefined,
)
const wages = computed(() => dailyWages(props.run))
/** From Granny Umber's two roads (Day 35) to the last night: the court's likely host. */
const FORECAST_FROM = 35
const forecast = computed(() => {
  const { day, hideout } = props.run
  if (hideout || day < FORECAST_FROM || day > 40) return undefined
  const [first, next] = hideoutForecast(props.run)
  return { first, next }
})
const pledgeWords = (count: number) =>
  count === 1 ? 'one promise kept' : `${count || 'no'} promises kept`

const regions = computed(() =>
  REGIONS.map((region) => {
    const holder = regionHolder(props.run, region.id) ?? region.controller
    const { tier = 'neutral', paid } = regionTax(props.run, region.id)
    const wiped = props.run.wipedOut.includes(holder)
    return {
      ...region,
      holder,
      tier: tier as AffinityTier,
      paid,
      wiped,
      taken: holder !== region.controller,
      fogged: !props.run.revealedFactions.includes(holder),
      holderName: factionName(holder),
      initial: factionName(holder).replace(/^The /, '').charAt(0),
      firstName: factionName(region.controller),
      threatened: warnings.value.some(
        (warning) =>
          warning.region === region.id ||
          (warning.kind === 'wipe' && warning.faction === holder),
      ),
    }
  }),
)

const homeOf = (faction: KingdomFactionId) =>
  regions.value.find((region) => region.holder === faction)?.id ??
  REGIONS.find((region) => region.controller === faction)?.id ??
  ''

const focused = ref<string | null>(null)
const focus = (id: string) => {
  focused.value = focused.value === id ? null : id
}
const mapped = computed(() => regions.value.filter((region) => !region.fogged))
const focusedRegion = computed(() =>
  regions.value.find((region) => region.id === focused.value && !region.fogged),
)
const focusedWarnings = computed(() =>
  warnings.value.filter(
    (warning) =>
      warning.region === focused.value ||
      (warning.kind === 'wipe' &&
        warning.faction === focusedRegion.value?.holder),
  ),
)

const ACT_NAMES = ['', 'Act I', 'Act II', 'Act III', 'Act IV']
const history = computed(() => {
  const acts = new Map<
    number,
    { title: string; text: string; warning: boolean }[]
  >()
  for (const event of props.run.mapLog ?? []) {
    const list = acts.get(event.day) ?? []
    list.push({
      ...mapEventText(event),
      warning: event.kind.startsWith('warned'),
    })
    acts.set(event.day, list)
  }
  return [...acts.entries()]
    .sort(([a], [b]) => b - a)
    .map(([day, events]) => ({
      day,
      label: `End of ${ACT_NAMES[Math.floor((day - 1) / 10)] ?? 'the act'} · Dawn of Day ${day}`,
      events,
    }))
})

const markerLabel = (region: (typeof regions.value)[number]) =>
  region.wiped
    ? `${region.name}: gone from the map`
    : `${region.name}: held by ${region.holderName}, ${region.tier}. Rate ${region.tax}; ${region.paid ? `pays ${region.paid}` : 'withholds'} brass a day`
const tierDot = (tier: AffinityTier, wiped: boolean) =>
  wiped
    ? 'bg-base-content/40'
    : {
        hostile: 'bg-error',
        wary: 'bg-warning',
        neutral: 'bg-base-content/50',
        friendly: 'bg-success',
        allied: 'bg-success ring-2 ring-success/40',
      }[tier]

const LEGEND: { tier: AffinityTier; text: string }[] = [
  { tier: 'allied', text: 'pays the rate and half again in tithe' },
  { tier: 'friendly', text: 'pays the full rate' },
  { tier: 'neutral', text: 'pays the full rate, and watches' },
  { tier: 'wary', text: 'withholds taxes' },
  { tier: 'hostile', text: 'withholds taxes; its doors stay shut' },
]

const bannerClass = (tier: AffinityTier) =>
  ({
    hostile: 'eod-banner-hostile',
    wary: 'eod-banner-wary',
    neutral: 'eod-banner-neutral',
    friendly: 'eod-banner-friendly',
    allied: 'eod-banner-allied',
  })[tier]

const tierClass = (tier: AffinityTier) =>
  ({
    hostile: 'text-error',
    wary: 'text-warning',
    neutral: 'opacity-80',
    friendly: 'text-success',
    allied: 'text-success',
  })[tier]

const HIDEOUTS: Record<string, string> = {
  'mole-tunnels': 'the Mole tunnels beneath the badlands',
  'crow-cave': 'a Storm Crow cave',
  'bell-cellars': 'the cellars under Hollow Bell’s chapel',
  'wagon-circle': 'a circle of painted wagons in the rail canyon',
  'moving-caravan': 'a Saltroad caravan that never stops moving',
  'freehold-barn': 'a Freehold barn and its root cellar',
  'rail-station': 'a collapsed Rustline rail station',
  'nameless-cave': 'a nameless cave, with a handful of revolutionaries',
}
const hideoutName = (id: string) => HIDEOUTS[id] ?? id
</script>
