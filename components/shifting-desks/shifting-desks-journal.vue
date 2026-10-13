<template>
  <ol v-if="entries.length" class="flex flex-col gap-2">
    <li
      v-for="(entry, i) in newestFirst"
      :key="`${entries.length - i}-${entry.cardId}`"
      class="rounded-xl bg-base-100 p-3 text-sm"
    >
      <p class="font-mono text-xs font-bold uppercase opacity-70">
        {{ entry.employee }} · {{ entry.cardTitle }}
      </p>
      <p class="font-semibold">
        {{ entry.choiceLabel }}
        <span v-if="entry.total !== null" class="font-normal opacity-70">
          (rolled {{ entry.total }} vs {{ entry.target }},
          {{ entry.success ? 'approved' : 'denied' }})
        </span>
      </p>
      <p class="opacity-80">{{ entry.text }}</p>
      <p
        v-for="(event, j) in entry.events"
        :key="j"
        class="text-xs font-semibold text-warning"
      >
        {{ event }}
      </p>
    </li>
  </ol>
  <p v-else class="text-sm opacity-60">No entries yet.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LogEntry } from '~/utils/shiftingDesks/rules'

const props = defineProps<{ entries: LogEntry[] }>()

const newestFirst = computed(() => [...props.entries].reverse())
</script>
