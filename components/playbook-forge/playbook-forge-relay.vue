<template>
  <div class="flex flex-col gap-1 text-xs" aria-label="Relay record">
    <template v-if="jobs">
      <p class="pf-kicker text-[0.6rem] opacity-70">
        Relay · {{ jobs.project }}
      </p>
      <p class="tabular-nums">
        {{ jobs.counts.DONE }} done ·
        {{ jobs.counts.PENDING + jobs.counts.RUNNING }} in queue ·
        <span :class="jobs.counts.FAILED ? 'text-error' : ''"
          >{{ jobs.counts.FAILED }} failed</span
        >
        · median
        {{
          jobs.medianSeconds === null ? '—' : formatDuration(jobs.medianSeconds)
        }}
      </p>
      <p v-if="jobs.byEngine.length" class="truncate tabular-nums opacity-70">
        {{
          jobs.byEngine
            .map((e) => `${e.engine} ${e.count} · ${formatDuration(e.seconds)}`)
            .join('  ·  ')
        }}
      </p>
      <p
        v-if="jobs.failures[0]"
        class="truncate text-error opacity-80"
        :title="jobs.failures[0].error"
      >
        Last failure #{{ jobs.failures[0].id }}: {{ jobs.failures[0].error }}
      </p>
    </template>
    <p v-else class="opacity-60">
      {{ forge.ledgerLoading ? 'Reading the relay…' : 'No relay record.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { formatDuration } from '~/utils/playbookForge/estimate'

// What the art relay has done for the open playbook's project, from its ArtJobs.
const forge = usePlaybookForgeStore()
const jobs = computed(() => forge.ledgerRelay?.jobs ?? null)
</script>
