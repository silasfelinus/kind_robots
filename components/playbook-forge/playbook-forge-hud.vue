<template>
  <aside
    v-if="f"
    class="pf-panel @container flex min-h-0 flex-col gap-3 overflow-hidden p-3 @5xl:gap-4 @5xl:p-5"
    aria-label="Forecast"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="pf-kicker text-secondary">
          {{ forge.existing ? 'Plan forecast' : 'Forecast' }}
        </p>
        <p
          class="pf-display mt-1 text-xl @[26rem]:text-2xl"
          :class="f.tier ? 'text-primary' : 'text-error'"
        >
          {{ f.tier ? TIER_INFO[f.tier].label : 'Over every cap' }}
        </p>
      </div>
      <p
        v-if="!compact"
        class="hidden max-w-[12rem] text-right text-xs leading-snug opacity-70 @[26rem]:block"
      >
        {{ f.tier ? TIER_INFO[f.tier].length : 'Cut, or write allowances.' }}
      </p>
      <button
        v-else
        type="button"
        class="pf-kicker text-[0.6rem] text-secondary"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Hide breakdown' : 'Breakdown' }}
      </button>
    </div>

    <ul
      class="grid gap-x-4 gap-y-3"
      :class="
        compact
          ? 'grid-cols-2 @sm:grid-cols-4'
          : 'grid-cols-2 @sm:grid-cols-4 @[26rem]:grid-cols-2'
      "
    >
      <li
        v-for="stat in stats"
        :key="stat.label"
        class="flex min-w-0 flex-col gap-1"
      >
        <span class="pf-kicker text-[0.6rem] opacity-70">{{ stat.label }}</span>
        <span
          class="pf-display tabular-nums"
          :class="compact ? 'text-xl' : 'text-2xl @[26rem]:text-4xl'"
          >{{ stat.value }}</span
        >
        <span
          class="flex flex-wrap gap-1 text-[0.7rem] font-semibold tabular-nums"
        >
          <span v-if="stat.less" class="pf-delta" :class="stat.less.cls"
            >◀ {{ stat.less.text }}</span
          >
          <span v-if="stat.more" class="pf-delta" :class="stat.more.cls"
            >▶ {{ stat.more.text }}</span
          >
          <span v-if="stat.left" class="pf-delta text-secondary">{{
            stat.left
          }}</span>
        </span>
      </li>
    </ul>

    <div
      v-if="!compact || expanded"
      class="hidden min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain @[26rem]:flex"
    >
      <div v-if="f.overBudget.length" class="flex flex-wrap gap-1.5">
        <span class="pf-kicker self-center text-[0.6rem] text-error"
          >Over cap</span
        >
        <span
          v-for="d in f.overBudget"
          :key="d"
          class="pf-chip border-error/50 text-error"
          >{{ DIMENSION_LABELS[d] }}</span
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <p class="pf-kicker text-[0.6rem] opacity-70">
          Pictures × {{ forge.draft?.artStyles }} style{{
            forge.draft?.artStyles === 1 ? '' : 's'
          }}
          × {{ (1 + forge.assumptions.rerollRate).toFixed(1) }} rerolls ·
          {{ lane.label }} {{ formatDuration(lane.secondsPerImage) }} each
        </p>
        <ul class="flex flex-col gap-1">
          <li
            v-for="line in topImages"
            :key="line.label"
            class="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs"
          >
            <span class="truncate opacity-80" :title="line.detail">{{
              line.label
            }}</span>
            <span class="h-1.5 bg-base-content/10">
              <span
                class="block h-full bg-secondary"
                :style="{ width: `${(line.count / maxImage) * 100}%` }"
              />
            </span>
            <span class="text-right tabular-nums">{{ line.count }}</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-1.5">
        <p class="pf-kicker text-[0.6rem] opacity-70">
          Words · {{ f.qaRuns }} seeded QA playthroughs
        </p>
        <ul class="flex flex-col gap-1">
          <li
            v-for="line in topWords"
            :key="line.label"
            class="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs"
          >
            <span class="truncate opacity-80" :title="line.detail">{{
              line.label
            }}</span>
            <span class="h-1.5 bg-base-content/10">
              <span
                class="block h-full bg-primary"
                :style="{ width: `${(line.count / maxWords) * 100}%` }"
              />
            </span>
            <span class="text-right tabular-nums">{{
              formatCount(line.count)
            }}</span>
          </li>
        </ul>
      </div>

      <ul v-if="f.notes.length" class="flex flex-col gap-1.5">
        <li
          v-for="note in f.notes"
          :key="note"
          class="flex gap-2 text-xs leading-snug"
        >
          <Icon
            name="kind-icon:alert-triangle"
            class="mt-0.5 size-3.5 shrink-0 text-warning"
          />
          <span class="opacity-90">{{ note }}</span>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { DIMENSION_LABELS, TIER_INFO } from '~/utils/playbookKit/budget'
import { checkpointClass } from '~/utils/playbookForge/calibration'
import { formatCount, formatDuration } from '~/utils/playbookForge/estimate'
import type { Forecast } from '~/utils/playbookForge/types'

// Compact: the totals beside the design board, with the breakdown on request.
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const expanded = ref(false)
const forge = usePlaybookForgeStore()
const f = computed(() => forge.current)
const lane = computed(() =>
  checkpointClass(forge.draft?.checkpoint ?? 'illustrious'),
)

type Pick = (x: Forecast) => number

function delta(pick: Pick, other: Forecast | null, fmt: (n: number) => string) {
  if (!other || !f.value) return null
  const d = pick(other) - pick(f.value)
  if (!d) return null
  return {
    text: `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}`,
    cls: d > 0 ? 'text-accent' : 'text-success',
  }
}

function remaining(pick: Pick, fmt: (n: number) => string): string | null {
  if (!forge.builtForecast || !f.value) return null
  const left = pick(f.value) - pick(forge.builtForecast)
  return left > 0 ? `${fmt(left)} to go` : 'built'
}

const stats = computed(() => {
  const defs: { label: string; pick: Pick; fmt: (n: number) => string }[] = [
    { label: 'Images', pick: (x) => x.totalImages, fmt: formatCount },
    {
      label: 'Render',
      pick: (x) => x.renderSeconds + x.queueSeconds,
      fmt: formatDuration,
    },
    { label: 'Words', pick: (x) => x.totalWords, fmt: formatCount },
    { label: 'Sessions', pick: (x) => x.sessions, fmt: String },
  ]
  return defs.map((def) => ({
    label: def.label,
    value: f.value ? def.fmt(def.pick(f.value)) : '',
    less: delta(def.pick, forge.preview.less, def.fmt),
    more: delta(def.pick, forge.preview.more, def.fmt),
    left: remaining(def.pick, def.fmt),
  }))
})

const topImages = computed(() =>
  [...(f.value?.images ?? [])].sort((a, b) => b.count - a.count).slice(0, 7),
)
const maxImage = computed(() =>
  Math.max(1, ...topImages.value.map((l) => l.count)),
)
const topWords = computed(() =>
  [...(f.value?.words ?? [])].sort((a, b) => b.count - a.count).slice(0, 6),
)
const maxWords = computed(() =>
  Math.max(1, ...topWords.value.map((l) => l.count)),
)
</script>
