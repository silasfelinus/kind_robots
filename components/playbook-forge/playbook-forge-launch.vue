<template>
  <div
    v-if="forge.draft && f"
    class="kr-scroll -mx-1 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-5 px-1 pb-2 @5xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @5xl:content-center"
  >
    <section class="flex min-w-0 flex-col gap-4">
      <p class="pf-kicker text-secondary">
        {{ forge.existing ? 'Plan revision' : 'Ready to forge' }}
      </p>
      <p class="pf-display text-4xl @3xl:text-6xl">{{ forge.draft.title }}</p>
      <p v-if="forge.draft.idea" class="max-w-2xl text-base opacity-85">
        {{ forge.draft.idea }}
      </p>

      <ul
        v-if="forge.draft.sparks?.length"
        class="flex flex-wrap gap-1.5"
        aria-label="Sparks from Facets"
      >
        <li
          v-for="spark in forge.draft.sparks"
          :key="spark.slot"
          class="pf-chip border-secondary/40 text-xs"
          :title="spark.description"
        >
          <span class="opacity-60">{{ sparkLabel(spark.slot) }}</span>
          {{ spark.title }}
        </li>
      </ul>

      <ul class="flex flex-wrap gap-2">
        <li
          v-for="fact in facts"
          :key="fact"
          class="pf-chip border-base-content/20"
        >
          {{ fact }}
        </li>
      </ul>

      <div v-if="forge.existing" class="pf-panel flex flex-col gap-2 p-4">
        <p class="pf-kicker text-[0.6rem] opacity-70">
          Changes from the current plan
        </p>
        <ul v-if="changes.length" class="flex flex-col gap-1 text-sm">
          <li v-for="c in changes" :key="c.key" class="flex flex-wrap gap-2">
            <span class="pf-label">{{ c.label }}</span>
            <span class="opacity-60">{{ c.from }}</span>
            <span class="text-primary">→ {{ c.to }}</span>
          </li>
        </ul>
        <p v-else class="text-sm opacity-70">
          No factor changed: sending re-confirms the plan as it stands.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-nav
          data-autofocus
          class="pf-cta pf-focusable"
          :disabled="forge.busy || !!forge.result"
          @click="forge.existing ? forge.sendPlan() : forge.launch()"
        >
          <Icon
            :name="forge.existing ? 'kind-icon:send' : 'kind-icon:sparkles'"
            class="size-5"
          />
          <span class="pf-display text-lg">
            {{ forge.existing ? 'Send plan to agents' : 'Forge the project' }}
          </span>
        </button>
        <button
          type="button"
          data-nav
          class="pf-label btn btn-ghost pf-focusable"
          @click="copy"
        >
          {{ copied ? 'Copied' : 'Copy blueprint' }}
        </button>
      </div>
      <p
        v-if="forge.status"
        class="text-sm"
        :class="forge.result ? 'text-success' : 'opacity-80'"
        role="status"
      >
        {{ forge.status }}
      </p>
      <p class="max-w-2xl text-xs opacity-60">
        {{
          forge.existing
            ? 'Creates a high-priority agent Todo carrying the diff and the full blueprint. Agents take Todos before any roadmap work and update the Conductor plan.'
            : `Creates the Kind Robots project (${placementLabel}). Its scaffold Todo carries the blueprint to Conductor, where new_playbook.py builds the roadmap and design brief from it.`
        }}
      </p>
    </section>

    <section class="pf-panel flex flex-col gap-3 p-5">
      <p class="pf-kicker text-secondary">Forecast</p>
      <dl class="grid grid-cols-2 gap-x-6 gap-y-4">
        <div
          v-for="stat in summary"
          :key="stat.label"
          class="flex flex-col gap-1"
        >
          <dt class="pf-kicker text-[0.6rem] opacity-70">{{ stat.label }}</dt>
          <dd class="pf-display text-3xl tabular-nums">{{ stat.value }}</dd>
        </div>
      </dl>
      <p class="text-xs opacity-60">
        Render time is {{ lane.label }} at
        {{ formatDuration(lane.secondsPerImage) }} per image ({{
          lane.evidence
        }}), plus one cold start. Queue wait is set in Assumptions.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { TIER_INFO } from '~/utils/playbookKit/budget'
import { checkpointClass } from '~/utils/playbookForge/calibration'
import { formatCount, formatDuration } from '~/utils/playbookForge/estimate'
import {
  blueprintBrief,
  blueprintPitch,
  planDiff,
} from '~/utils/playbookForge/handoff'
import { SPARK_SLOTS } from '~/utils/playbookForge/facets'

const forge = usePlaybookForgeStore()

function sparkLabel(slot: string) {
  return slot === 'genre'
    ? 'Genre'
    : (SPARK_SLOTS.find((s) => s.id === slot)?.label ?? slot)
}
const copied = ref(false)
const f = computed(() => forge.current)
const lane = computed(() =>
  checkpointClass(forge.draft?.checkpoint ?? 'illustrious'),
)

const changes = computed(() =>
  forge.existing && forge.draft
    ? planDiff(forge.existing.plan, forge.draft)
    : [],
)

const PLACEMENTS = {
  admin: 'Admin preview',
  play: 'Play',
  projects: 'Projects',
} as const
const placementLabel = computed(
  () => PLACEMENTS[forge.draft?.placement ?? 'admin'],
)

const facts = computed(() => {
  const b = forge.draft
  if (!b) return []
  return [
    placementLabel.value,
    f.value?.tier ? TIER_INFO[f.value.tier].label : 'Over every cap',
    `${b.acts} acts`,
    `${b.encounters} encounters`,
    `${b.followers} followers`,
    `${b.villains} villain${b.villains === 1 ? '' : 's'}`,
    `${b.endings} endings`,
    b.failForward ? 'Always interesting' : 'Pass / fail',
  ]
})

const summary = computed(() => {
  const x = f.value
  if (!x) return []
  return [
    { label: 'Images', value: formatCount(x.totalImages) },
    {
      label: 'Render',
      value: formatDuration(x.renderSeconds + x.queueSeconds),
    },
    { label: 'Words', value: formatCount(x.totalWords) },
    { label: 'Agent sessions', value: String(x.sessions) },
    { label: 'Seeded QA runs', value: String(x.qaRuns) },
    { label: 'Endings', value: String(forge.draft?.endings ?? 0) },
  ]
})

async function copy() {
  const b = forge.draft
  const x = f.value
  if (!b || !x) return
  const text = forge.existing
    ? blueprintBrief(b, x, changes.value)
    : blueprintPitch(b, x)
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    copied.value = false
  }
}
</script>
