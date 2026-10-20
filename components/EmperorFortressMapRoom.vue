<template>
  <div class="grid gap-3 @4xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
    <section class="@container kr-panel p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="sr-only">The map room</h2>
        <span class="text-sm font-bold text-warning">
          {{ dailyTaxes(run) }} brass a day in taxes
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
              : 'border-base-content/30',
            region.wiped ? 'line-through opacity-60' : '',
          ]"
          :style="{ left: region.x + '%', top: region.y + '%' }"
          :aria-label="markerLabel(region)"
          :title="markerLabel(region)"
          :aria-pressed="focused === region.id"
          @click="focused = focused === region.id ? null : region.id"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="tierDot(region.tier, region.wiped)"
            aria-hidden="true"
          />
        </button>
      </figure>
    </section>

    <section class="space-y-3">
      <div class="kr-panel p-3">
        <h3 class="font-serif text-xl font-bold">The kingdom</h3>
        <ul
          class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2"
          aria-label="Kingdom banners"
        >
          <li
            v-for="region in regions"
            :key="region.id"
            class="flex flex-col items-center gap-1 text-center"
            :class="focused === region.id ? 'eod-banner-focused' : ''"
          >
            <span
              class="eod-banner grid h-20 w-14 place-items-center pb-3 font-serif text-xl font-bold"
              :class="
                region.fogged
                  ? 'eod-banner-fog'
                  : region.wiped
                    ? 'eod-banner-gone'
                    : bannerClass(region.tier)
              "
              aria-hidden="true"
              >{{ region.fogged ? '?' : region.name.charAt(0) }}</span
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
              <span v-if="!region.wiped" class="text-[10px] opacity-70">
                {{ region.paying ? '+' : '−' }}{{ region.tax }} brass
              </span>
            </template>
          </li>
        </ul>
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
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { dailyTaxes } from '~/utils/emperorOfDust/fortress/engine'
import {
  KINGDOM_FACTION_DEFS,
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
  REGIONS,
  affinityTier,
} from '~/utils/emperorOfDust/fortress/factions'
import type {
  AffinityTier,
  FortressRun,
} from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun }>()

const regions = computed(() =>
  REGIONS.map((region) => {
    const tier = affinityTier(props.run.affinity[region.controller])
    const wiped = props.run.wipedOut.includes(region.controller)
    return {
      ...region,
      tier,
      wiped,
      fogged: !props.run.revealedFactions.includes(region.controller),
      paying: !wiped && ['neutral', 'friendly', 'allied'].includes(tier),
      factionName:
        KINGDOM_FACTION_DEFS.find((def) => def.id === region.controller)
          ?.name ?? region.controller,
    }
  }),
)

const focused = ref<string | null>(null)
const mapped = computed(() => regions.value.filter((region) => !region.fogged))
const markerLabel = (region: (typeof regions.value)[number]) =>
  region.wiped
    ? `${region.name}: gone from the map`
    : `${region.name}: ${region.tier}, ${region.paying ? 'pays' : 'withholds'} ${region.tax} brass`
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
  { tier: 'allied', text: 'pays taxes and sends help' },
  { tier: 'friendly', text: 'pays taxes' },
  { tier: 'neutral', text: 'pays, and watches' },
  { tier: 'wary', text: 'withholds taxes' },
  { tier: 'hostile', text: 'withholds, and may move against you' },
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
