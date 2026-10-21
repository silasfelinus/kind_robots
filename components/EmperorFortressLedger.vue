<template>
  <div
    class="kr-scroll mt-2 grid max-h-72 grid-cols-[minmax(0,1fr)] gap-2 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-6"
  >
    <div class="eod-chip p-2 text-xs">
      <p class="eod-display text-sm text-warning">{{ dayLine }}</p>
      <p v-if="run.hideout" class="mt-1 opacity-80">
        {{ run.brass }} brass in the treasury. In hiding no region pays the
        crown. {{ hostShareLine(run, factionName) }}
      </p>
      <p v-else class="mt-1 opacity-80">
        {{ run.brass }} brass in the treasury. Taxes come in at dawn and wages
        go out; the map room shows who pays.
      </p>
      <p class="mt-1 font-semibold">
        {{ run.hideout ? 'Host share' : 'Taxes' }} +{{ dailyIncome(run) }} ·
        {{ run.hideout ? 'half wages' : 'wages' }} −{{ dailyWages(run) }} a day
      </p>
    </div>
    <div
      v-if="dues.length || laws.length || candles"
      class="eod-chip p-2 text-xs @xl:col-span-2 @5xl:col-span-3 @7xl:col-span-6"
    >
      <p class="eod-display text-sm text-warning">Owed and in force</p>
      <ul class="mt-1 grid gap-1 @3xl:grid-cols-2">
        <li v-for="law in laws" :key="law.id" class="leading-snug">
          <strong>{{ law.title }}</strong>
          <span class="font-semibold">
            · taxes {{ law.taxes > 0 ? '+' : '−' }}{{ Math.abs(law.taxes) }} a
            day</span
          >
          <span class="block opacity-75">{{ law.text }}</span>
        </li>
        <li
          v-for="due in dues"
          :key="due.def.id"
          class="leading-snug"
          :class="due.daysLeft <= 1 ? 'text-error' : ''"
        >
          <strong>Day {{ due.day }} · {{ due.def.title }}</strong>
          <span v-if="due.def.cost" class="font-semibold">
            · {{ due.def.cost }} brass</span
          >
          <span v-if="due.def.warning" class="block opacity-75">{{
            due.def.warning
          }}</span>
        </li>
        <li v-if="candles" class="leading-snug text-error">
          <strong>{{ candles.source }}</strong>
          <span class="block">{{ candles.text }}</span>
        </li>
      </ul>
    </div>
    <div
      v-for="faction in LOCAL_FACTION_DEFS"
      :key="faction.id"
      class="eod-chip p-2 text-xs"
    >
      <p class="flex items-center gap-1.5">
        <Icon
          :name="LOCAL_FACTION_ICONS[faction.id]"
          class="h-4 w-4 shrink-0 text-warning"
        />
        <strong class="min-w-0 flex-1 truncate">{{ faction.name }}</strong>
        <strong :class="run.local[faction.id] <= 3 ? 'text-error' : ''"
          >{{ run.local[faction.id] }} / {{ LOCAL_MAX }}</strong
        >
      </p>
      <span
        class="mt-1 block h-1 overflow-hidden rounded-full bg-base-content/15"
        aria-hidden="true"
      >
        <span
          class="block h-full rounded-full"
          :class="run.local[faction.id] <= 3 ? 'bg-error' : 'bg-warning'"
          :style="{
            width: (100 * run.local[faction.id]) / LOCAL_MAX + '%',
          }"
        />
      </span>
      <p class="mt-1 opacity-75">
        {{ faction.who }}. Wants {{ faction.wants.toLowerCase() }}.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
} from '~/utils/emperorOfDust/fortress/factions'
import { LOCAL_FACTION_ICONS } from '~/utils/emperorOfDust/fortress/rooms'
import {
  dailyIncome,
  dailyWages,
  factionName,
  pendingDues,
} from '~/utils/emperorOfDust/fortress/engine'
import { lawsInForce } from '~/utils/emperorOfDust/fortress/laws'
import { candlesLine } from '~/utils/emperorOfDust/fortress/endings'
import { hostShareLine } from '~/utils/emperorOfDust/fortress/betrayal'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

// The court ledger the header toggle opens: the day, the treasury and every
// fortress faction spelled out, so the header icons have touch-sized answers.
const props = defineProps<{ run: FortressRun; dayLine: string }>()
const dues = computed(() => pendingDues(props.run))
const laws = computed(() => lawsInForce(props.run))
const candles = computed(() => candlesLine(props.run))
</script>
