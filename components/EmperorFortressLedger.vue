<template>
  <div
    class="kr-scroll mt-2 grid max-h-72 grid-cols-[minmax(0,1fr)] gap-2 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-6"
  >
    <div class="eod-chip p-2 text-xs">
      <p class="eod-display text-sm text-warning">{{ dayLine }}</p>
      <p class="mt-1 opacity-80">
        {{ run.brass }} brass in the treasury. Taxes come in at dawn and wages
        go out; the map room shows who pays.
      </p>
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
import {
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
} from '~/utils/emperorOfDust/fortress/factions'
import { LOCAL_FACTION_ICONS } from '~/utils/emperorOfDust/fortress/rooms'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

// The court ledger the header toggle opens: the day, the treasury and every
// fortress faction spelled out, so the header icons have touch-sized answers.
defineProps<{ run: FortressRun; dayLine: string }>()
</script>
