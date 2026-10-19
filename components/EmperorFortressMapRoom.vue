<template>
  <div class="grid gap-3 @4xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
    <section class="@container kr-panel p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-serif text-2xl font-bold">The map room</h2>
        <span class="text-sm font-bold text-warning">
          {{ dailyTaxes(run) }} brass a day in taxes
        </span>
      </div>
      <figure
        class="@container relative mt-3 overflow-hidden rounded-xl border border-base-content/15"
      >
        <img
          src="/emperor-of-dust/map/wasteland-base.svg"
          alt="Illustrated map of the wasteland around the fortress"
          class="block aspect-[8/5] w-full object-cover"
        />
        <div
          v-for="fog in fogs"
          :key="fog.id"
          class="pointer-events-none absolute rounded-3xl bg-base-100/70 backdrop-blur-sm"
          :style="{
            left: fog.left + '%',
            top: fog.top + '%',
            width: fog.width + '%',
            height: fog.height + '%',
          }"
        />
        <span
          class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-base-content/80 px-2 py-0.5 font-serif text-[10px] font-bold text-base-100 @md:text-xs"
          :style="{
            left: FORTRESS_ON_MAP.x + '%',
            top: FORTRESS_ON_MAP.y + '%',
          }"
          >The fortress</span
        >
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
          :aria-pressed="focused === region.id"
          @click="focused = focused === region.id ? null : region.id"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="tierDot(region.tier, region.wiped)"
            aria-hidden="true"
          />
          <span class="hidden @md:inline">{{ region.name }}</span>
        </button>
      </figure>
      <ul class="mt-3 grid gap-2 @md:grid-cols-2">
        <li
          v-for="region in regions"
          :key="region.id"
          class="rounded-xl border p-3 text-sm"
          :class="[
            region.fogged
              ? 'border-dashed border-base-content/20 bg-base-200/50 opacity-60'
              : region.wiped
                ? 'border-error/40 bg-error/5'
                : 'border-base-content/15 bg-base-100',
            focused === region.id ? 'ring-2 ring-warning' : '',
          ]"
        >
          <template v-if="region.fogged">
            <strong class="font-serif">Unmapped land</strong>
            <span class="block text-xs">Fog lies over this region.</span>
          </template>
          <template v-else>
            <strong class="font-serif text-lg">{{ region.name }}</strong>
            <span class="block text-xs opacity-70">{{
              region.factionName
            }}</span>
            <span class="mt-1 block text-xs">
              <template v-if="region.wiped">Gone from the map</template>
              <template v-else>
                <span
                  :class="tierClass(region.tier)"
                  class="font-bold capitalize"
                  >{{ region.tier }}</span
                >
                ·
                {{
                  region.paying
                    ? `pays ${region.tax} brass a day`
                    : `withholds ${region.tax} brass`
                }}
              </template>
            </span>
          </template>
        </li>
      </ul>
    </section>

    <section class="space-y-3">
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
  FORTRESS_ON_MAP,
  KINGDOM_FACTION_DEFS,
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
  MAP_FOG,
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
const fogs = computed(() =>
  Object.entries(MAP_FOG)
    .filter(
      ([id]) =>
        !props.run.revealedFactions.includes(
          id as FortressRun['revealedFactions'][number],
        ),
    )
    .map(([id, box]) => ({ id, ...box })),
)
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
