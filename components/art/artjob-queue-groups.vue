<!-- /components/art/artjob-queue-groups.vue -->
<template>
  <section
    class="grid gap-2 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm"
    aria-label="Pending ArtJob groups"
  >
    <div class="flex flex-wrap items-center gap-1.5 text-xs">
      <strong class="mr-1">Pending groups</strong>
      <span class="kr-badge-secondary-sm rounded-2xl">
        {{ summary?.groups.length ?? 0 }} groups
      </span>
      <span class="kr-badge-secondary-sm rounded-2xl">
        {{ summary?.totalJobs ?? 0 }} jobs
      </span>
      <span class="kr-badge-secondary-sm rounded-2xl">
        priority
        {{
          formatArtJobPriorityRange(
            summary?.minPriority ?? null,
            summary?.maxPriority ?? null,
          )
        }}
      </span>
      <button
        type="button"
        class="kr-btn-ghost-xs-2xl ml-auto"
        :disabled="priorityStore.loadingGroups"
        @click="priorityStore.fetchGroups()"
      >
        <span v-if="priorityStore.loadingGroups" class="kr-spinner-xs" />
        Refresh groups
      </button>
    </div>

    <div
      v-if="priorityStore.groupError"
      class="kr-note kr-note-error p-2 text-xs font-normal"
    >
      {{ priorityStore.groupError }}
    </div>
    <div
      v-else-if="priorityStore.groupMessage"
      class="rounded-xl border border-success/30 bg-success/10 p-2 text-xs"
      role="status"
    >
      {{ priorityStore.groupMessage }}
    </div>

    <div
      v-if="priorityStore.loadingGroups && !summary"
      class="flex justify-center p-4"
    >
      <span class="kr-loading-primary-md" />
    </div>

    <p
      v-else-if="summary && !summary.groups.length"
      class="kr-text-dim-sm-50 p-2 text-center"
    >
      No pending jobs.
    </p>

    <ul v-else class="grid max-h-[22rem] gap-1.5 overflow-y-auto pr-1">
      <li
        v-for="group in summary?.groups ?? []"
        :key="group.name"
        class="grid gap-1.5 rounded-xl border border-base-200 p-2"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-2">
          <span class="truncate text-sm font-bold" :title="group.name">
            {{ group.name }}
          </span>
          <span class="text-[11px] text-base-content/60">
            {{ group.count }} {{ group.count === 1 ? 'job' : 'jobs' }} ·
            priority
            {{
              formatArtJobPriorityRange(group.minPriority, group.maxPriority)
            }}
            · #{{ group.oldestJobId }}–#{{ group.newestJobId }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1">
          <button
            v-for="preset in presets"
            :key="preset.label"
            type="button"
            class="kr-btn-xs-2xl"
            :class="preset.className"
            :disabled="isBusy(group.name) || isAt(group, preset.priority)"
            :title="`Set all ${group.count} pending ${group.name} jobs to priority ${preset.priority}`"
            @click="apply(group.name, preset.priority)"
          >
            {{ preset.label }} ({{ preset.priority }})
          </button>

          <form
            class="ml-auto flex items-center gap-1"
            @submit.prevent="applyDraft(group.name)"
          >
            <input
              v-model="drafts[group.name]"
              type="number"
              inputmode="numeric"
              step="1"
              :min="MIN_ART_JOB_PRIORITY"
              :max="MAX_ART_JOB_PRIORITY"
              :placeholder="String(group.maxPriority)"
              class="input input-bordered input-xs w-20 rounded-2xl font-mono"
              :aria-label="`Priority for every pending ${group.name} job`"
              :title="`Priority from ${MIN_ART_JOB_PRIORITY} to ${MAX_ART_JOB_PRIORITY}; higher jobs run first`"
            />
            <button
              type="submit"
              class="kr-btn-xs-2xl btn-accent"
              :disabled="
                isBusy(group.name) || draftPriority(group.name) === null
              "
            >
              <span v-if="isBusy(group.name)" class="kr-spinner-xs" />
              Set all
            </button>
          </form>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useArtJobPriorityStore } from '@/stores/artJobPriorityStore'
import {
  BACK_OF_QUEUE_PRIORITY,
  FRONT_OF_QUEUE_PRIORITY,
  MAX_ART_JOB_PRIORITY,
  MIN_ART_JOB_PRIORITY,
  NORMAL_QUEUE_PRIORITY,
  parseArtJobPriority,
} from '@/utils/artJobPriority'
import {
  formatArtJobPriorityRange,
  type ArtJobQueueGroup,
} from '@/utils/artJobQueueGroups'

const priorityStore = useArtJobPriorityStore()
const summary = computed(() => priorityStore.groupSummary)
const drafts = reactive<Record<string, string | number>>({})

const presets = [
  {
    label: 'Highest',
    priority: FRONT_OF_QUEUE_PRIORITY,
    className: 'btn-success',
  },
  { label: 'Normal', priority: NORMAL_QUEUE_PRIORITY, className: 'btn-ghost' },
  {
    label: 'Lowest',
    priority: BACK_OF_QUEUE_PRIORITY,
    className: 'btn-warning',
  },
]

function isBusy(name: string): boolean {
  return priorityStore.updatingGroupNames.includes(name)
}

function isAt(group: ArtJobQueueGroup, priority: number): boolean {
  return group.minPriority === priority && group.maxPriority === priority
}

function draftPriority(name: string): number | null {
  const parsed = parseArtJobPriority(String(drafts[name] ?? ''))
  return parsed.ok ? parsed.priority : null
}

async function apply(name: string, priority: number): Promise<void> {
  await priorityStore.setGroupPriority(name, priority)
}

async function applyDraft(name: string): Promise<void> {
  const priority = draftPriority(name)
  if (priority === null) return
  if (await priorityStore.setGroupPriority(name, priority)) {
    drafts[name] = ''
  }
}

onMounted(() => {
  priorityStore.fetchGroups()
})
</script>
