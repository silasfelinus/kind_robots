<template>
  <section
    class="overflow-hidden rounded-3xl border border-base-content/20 bg-base-200"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 p-5">
      <h3 class="font-serif text-2xl font-bold">The imperial roads</h3>
      <p class="text-xs font-semibold uppercase tracking-widest opacity-70">
        Tower departures · one-way hours
      </p>
    </div>
    <div
      class="relative mx-3 min-h-[430px] overflow-hidden rounded-2xl border-4 border-amber-900/40 bg-[radial-gradient(ellipse_at_65%_30%,#e3d1a0,transparent_60%),linear-gradient(140deg,#526f67,#bea87b_45%,#996c4c_78%,#514547)] sm:min-h-[560px]"
      role="group"
      aria-label="Regional destinations linked by straight roads to the Emperor's Tower"
    >
      <div
        class="pointer-events-none absolute -left-10 top-[25%] h-48 w-52 rounded-full bg-[#405e59]/50 blur-2xl"
      />
      <div
        class="pointer-events-none absolute right-0 top-[35%] h-40 w-32 rounded-full bg-[#d2c08e]/55 blur-xl"
      />
      <div
        class="pointer-events-none absolute -bottom-16 left-[20%] h-56 w-52 rounded-full bg-[#a66d51]/60 blur-2xl"
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          v-for="region in IMPERIAL_REGIONS"
          :key="region.id"
          :d="pathFromTower(region)"
          fill="none"
          :stroke="region.id === selectedRegionId ? '#f9dc84' : '#604631'"
          :stroke-width="region.id === selectedRegionId ? 1.25 : 0.75"
          stroke-linecap="round"
          stroke-dasharray="2 0.6"
        />
        <circle
          :cx="TOWER.x"
          :cy="TOWER.y"
          r="2.5"
          fill="#593728"
          stroke="#f4d68f"
          stroke-width="0.75"
        />
      </svg>
      <span
        class="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-amber-200/80 bg-[#382e29] px-3 py-1 font-serif text-xs font-black text-amber-100 shadow-md sm:text-sm"
        :style="{ left: TOWER.x + '%', top: '1%' }"
      >
        <span aria-hidden="true">♜</span> Emperor's Tower
      </span>
      <button
        v-for="region in IMPERIAL_REGIONS"
        :key="region.id"
        type="button"
        :style="{ left: region.x + '%', top: region.y + '%' }"
        :aria-pressed="selectedRegionId === region.id"
        class="absolute z-10 max-w-[32%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-2 py-2 text-center text-[11px] font-black leading-tight shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-primary sm:px-3 sm:text-sm"
        :class="
          selectedRegionId === region.id
            ? 'border-amber-300 bg-[#382e29] text-amber-100'
            : 'border-[#876340] bg-[#f1d9a7] text-[#392d23]'
        "
        @click="emit('select', region.id)"
      >
        {{ region.name }}
        <span class="mt-0.5 block text-[10px] font-medium">
          {{ region.outwardHours }}h outbound
        </span>
        <span
          v-if="activeTrips(region.id)"
          class="mt-1 block rounded bg-warning/90 px-1 text-[10px] text-warning-content"
        >
          {{ activeTrips(region.id) }} expedition(s)
        </span>
        <span
          v-else-if="openIncidents(region.id)"
          class="mt-1 block rounded bg-success/80 px-1 text-[10px] text-success-content"
        >
          {{ openIncidents(region.id) }} petition(s)
        </span>
      </button>
      <p
        class="pointer-events-none absolute bottom-2 right-2 rounded bg-[#3b2f28]/85 px-2 py-1 text-xs text-amber-100"
      >
        Prototype roads · not to scale
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  IMPERIAL_REGIONS,
  TOWER,
  pathFromTower,
} from '~/utils/emperorOfDust/map'
import type { Dispatch, Incident } from '~/utils/emperorOfDust/types'

const props = defineProps<{
  selectedRegionId: string
  hour: number
  missions: Dispatch[]
  incidents: readonly Incident[]
}>()

const emit = defineEmits<{ select: [id: string] }>()

const activeTrips = (id: string): number =>
  props.missions.filter(
    (mission) =>
      mission.incident.destinationId === id && mission.returnsAt > props.hour,
  ).length

const openIncidents = (id: string): number =>
  props.incidents.filter(
    (incident) =>
      incident.destinationId === id &&
      props.hour >= (incident.day - 1) * 24 + incident.opensAtHour &&
      props.hour <= (incident.day - 1) * 24 + incident.deadlineHour &&
      !props.missions.some((mission) => mission.incidentId === incident.id),
  ).length
</script>
