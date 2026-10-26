<template>
  <div class="flex flex-col gap-3">
    <div
      class="flex flex-wrap items-start gap-3 rounded-2xl border border-base-content/10 bg-base-100/80 p-3"
    >
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          class="text-[10px] font-semibold uppercase tracking-[.2em] opacity-70"
          >Complexity tier</span
        >
        <span class="pk-display text-lg font-black">{{
          TIER_INFO[report.tier].label
        }}</span>
        <span class="text-xs opacity-80"
          >{{ TIER_INFO[report.tier].length }}.
          {{ TIER_INFO[report.tier].blurb }}</span
        >
      </span>
      <span
        class="badge badge-lg gap-1"
        :class="report.ok ? 'badge-success' : 'badge-error'"
      >
        <Icon
          :name="report.ok ? 'kind-icon:check' : 'kind-icon:alert-triangle'"
          class="size-4"
        />
        {{ report.ok ? 'Within budget' : `${errors.length} to fix` }}
      </span>
    </div>

    <div
      v-if="report.next"
      class="flex items-start gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3"
    >
      <Icon
        name="kind-icon:arrow-right"
        class="mt-0.5 size-4 shrink-0 text-primary"
      />
      <span class="text-sm">
        <span class="font-bold">Next rung: {{ report.next.label }}.</span>
        {{ report.next.goal }}
      </span>
    </div>

    <ol
      class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))] gap-1.5"
      aria-label="Build ladder"
    >
      <li
        v-for="(rung, i) in report.ladder"
        :key="rung.id"
        class="flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs"
        :class="RUNG[rung.status]"
        :title="rung.goal"
      >
        <span
          class="grid size-5 shrink-0 place-items-center rounded-full bg-base-content/10 text-[10px] font-bold"
        >
          <Icon
            v-if="rung.status === 'done'"
            name="kind-icon:check"
            class="size-3"
          />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="truncate">{{ rung.label }}</span>
      </li>
    </ol>

    <ul
      class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-x-4 gap-y-2"
      aria-label="Budget"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="flex flex-col gap-1"
        :title="row.allowance"
      >
        <span class="flex items-baseline justify-between gap-2 text-xs">
          <span class="font-semibold">{{ row.label }}</span>
          <span class="tabular-nums" :class="TEXT[row.status]">
            {{ row.count }}
            <span class="opacity-60">/ {{ row.min }}–{{ row.max }}</span>
          </span>
        </span>
        <span
          class="relative h-2 overflow-hidden rounded-full bg-base-content/10"
        >
          <span
            class="absolute inset-y-0 left-0 rounded-full"
            :class="BAR[row.status]"
            :style="{
              width: `${Math.min(100, (row.count / Math.max(row.max, 1)) * 100)}%`,
            }"
          />
          <span
            v-if="row.min > 0"
            class="absolute inset-y-0 w-px bg-base-content/50"
            :style="{ left: `${(row.min / Math.max(row.max, 1)) * 100}%` }"
          />
        </span>
      </li>
    </ul>

    <p class="text-xs opacity-75">
      Rendered art: {{ report.art.rendered }} of {{ report.art.total }} briefs.
      <template v-if="report.fitsTier && report.fitsTier !== report.tier">
        Fits a {{ TIER_INFO[report.fitsTier].label }} today.
      </template>
    </p>

    <ul
      v-if="report.issues.length"
      class="flex flex-col gap-1.5"
      aria-label="Audit findings"
    >
      <li
        v-for="(issue, i) in report.issues"
        :key="i"
        class="flex items-start gap-2 rounded-xl px-2.5 py-1.5 text-xs"
        :class="ISSUE[issue.level]"
      >
        <Icon
          :name="ISSUE_ICON[issue.level]"
          class="mt-0.5 size-3.5 shrink-0"
        />
        <span>{{ issue.message }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DIMENSION_LABELS,
  TIER_INFO,
  auditPlaybookKit,
  type BudgetDimension,
  type DimensionReport,
  type IssueLevel,
  type Rung,
} from '~/utils/playbookKit/budget'
import type { PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()

const report = computed(() => auditPlaybookKit(props.spec))
const errors = computed(() =>
  report.value.issues.filter((i) => i.level === 'error'),
)
const rows = computed(() =>
  (Object.keys(report.value.counts) as BudgetDimension[]).map((id) => ({
    id,
    label: DIMENSION_LABELS[id],
    ...report.value.counts[id],
  })),
)

const RUNG: Record<Rung['status'], string> = {
  done: 'border-success/40 bg-success/10',
  todo: 'border-base-content/15',
  optional: 'border-dashed border-base-content/15 opacity-70',
}
const BAR: Record<DimensionReport['status'], string> = {
  under: 'bg-base-content/35',
  ok: 'bg-success',
  near: 'bg-warning',
  over: 'bg-error',
  stretched: 'bg-accent',
}
const TEXT: Record<DimensionReport['status'], string> = {
  under: 'opacity-70',
  ok: 'text-success',
  near: 'text-warning',
  over: 'text-error font-bold',
  stretched: 'text-accent',
}
const ISSUE: Record<IssueLevel, string> = {
  error: 'bg-error/15 text-error',
  warn: 'bg-warning/15',
  info: 'bg-info/10',
}
const ISSUE_ICON: Record<IssueLevel, string> = {
  error: 'kind-icon:alert-triangle',
  warn: 'kind-icon:alert',
  info: 'kind-icon:info',
}
</script>
