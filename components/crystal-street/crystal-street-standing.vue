<template>
  <ul
    class="flex items-center gap-1.5"
    :class="full ? 'flex-col items-stretch' : ''"
    aria-label="Standing in town"
    data-testid="cs-standing"
  >
    <li
      v-for="f in FACTIONS"
      :key="f"
      class="flex items-center gap-1"
      :class="full ? 'cs-card gap-2 p-2' : ''"
      :title="`${FACTION_LABELS[f]} ${standing[f]} of ${MAX_STANDING}. ${FACTION_HINTS[f]}`"
    >
      <icon
        :name="FACTION_ICONS[f]"
        class="h-4 w-4 shrink-0"
        :class="standing[f] <= 1 ? 'text-error' : 'opacity-80'"
      />
      <span v-if="full" class="w-20 text-xs font-semibold">{{
        FACTION_LABELS[f]
      }}</span>
      <span class="flex gap-0.5" aria-hidden="true">
        <span
          v-for="n in MAX_STANDING"
          :key="n"
          class="rounded-full"
          :class="[
            full ? 'h-2 w-4' : 'h-1.5 w-1.5',
            n <= standing[f]
              ? standing[f] <= 1
                ? 'bg-error'
                : 'bg-secondary'
              : 'bg-base-content/20',
          ]"
        />
      </span>
      <span class="sr-only"
        >{{ FACTION_LABELS[f] }} {{ standing[f] }} of {{ MAX_STANDING }}</span
      >
      <span v-if="full" class="cs-label leading-snug opacity-70">{{
        FACTION_HINTS[f]
      }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  FACTION_HINTS,
  FACTION_ICONS,
  FACTION_LABELS,
  MAX_STANDING,
  standingOf,
  type RunState,
} from '~/utils/crystalStreet/rules'
import { FACTIONS } from '~/utils/crystalStreet/types'

const props = defineProps<{ run: RunState; full?: boolean }>()

const standing = computed(() => standingOf(props.run))
</script>
