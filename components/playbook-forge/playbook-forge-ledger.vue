<template>
  <div
    v-if="forge.existing && ledger"
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 @5xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,1fr)] @5xl:grid-rows-[auto_minmax(0,1fr)] @5xl:gap-4"
    :class="
      forge.ledgerPanel === 'adjust'
        ? 'grid-rows-[auto_minmax(0,1fr)]'
        : 'grid-rows-[auto_minmax(7.5rem,1fr)_minmax(0,1.25fr)]'
    "
  >
    <header class="flex min-w-0 flex-col gap-3 @5xl:col-span-2">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="pf-kicker text-secondary">
            Ledger · {{ forge.existing.title }}
          </p>
          <p
            class="pf-display mt-1 flex items-center gap-3 text-2xl @3xl:text-4xl"
          >
            <span :class="shineClass">{{ shineLabel }}</span>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-if="forge.existing.studio"
            type="button"
            data-nav
            class="pf-label btn btn-sm btn-primary pf-focusable"
            title="Every section and person as large art: prompts, renders and comments"
            @click="forge.openGallery(forge.existing.slug)"
          >
            Gallery
          </button>
          <button
            v-if="forge.existing.studio"
            type="button"
            data-nav
            class="pf-label btn btn-sm btn-ghost pf-focusable"
            title="Every beat with the scene editor: overlays, notes and art requests"
            @click="forge.openBeats(forge.existing.slug)"
          >
            Beats
          </button>
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm pf-focusable"
            :class="
              forge.ledgerPanel === 'adjust' ? 'btn-secondary' : 'btn-ghost'
            "
            :aria-pressed="forge.ledgerPanel === 'adjust'"
            title="Change plan numbers, add elements and post direction to the game's GitHub issue"
            @click="
              forge.ledgerPanel =
                forge.ledgerPanel === 'adjust' ? 'detail' : 'adjust'
            "
          >
            Adjust
          </button>
          <button
            v-if="kitSpec"
            type="button"
            data-nav
            class="pf-label btn btn-sm btn-ghost pf-focusable"
            title="Rehearse this kit game's moments, reveals and endings"
            @click="forge.openKit(kitSpec.id)"
          >
            Rehearse in the kit
          </button>
        </div>
        <p
          class="hidden max-w-md basis-full text-xs leading-snug opacity-70 @3xl:block"
        >
          <template v-if="forge.ledgerLoading"
            >Counting beats and reading the relay…</template
          >
          <template v-else-if="forge.status">{{ forge.status }}</template>
          <template v-else-if="forge.ledgerRelay">
            Counted from the {{ forge.built?.source ?? 'game code' }}; spend
            from {{ forge.ledgerRelay.jobs.counts.DONE }} rendered
            {{ forge.ledgerRelay.project }} jobs.
          </template>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span
          class="pf-progress relative h-2 flex-1 overflow-hidden bg-base-content/10"
          role="progressbar"
          :aria-valuenow="completionPercent(ledger.progress)"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Verified writing and artwork completion"
        >
          <span
            class="absolute inset-y-0 left-0"
            :class="ledger.shine === 'super' ? 'pf-shine-bar' : 'bg-primary'"
            :style="{ width: `${ledger.progress * 100}%` }"
          />
        </span>
        <span class="pf-display w-14 text-right tabular-nums"
          >{{ completionPercent(ledger.progress) }}%</span
        >
        <span
          class="pf-kicker hidden shrink-0 text-[0.6rem] opacity-70 @3xl:inline"
          title="Half authored writing, half verified delivered raster art (including extra outcome and portrait slots)"
          >Written {{ Math.round(ledger.writtenShare * 100) }}% · painted
          {{ Math.round(ledger.paintedShare * 100) }}%</span
        >
        <span
          class="pf-kicker hidden shrink-0 text-[0.6rem] opacity-70 @3xl:inline"
          title="Progress is half writing, half art, averaged over every beat"
          >Written {{ Math.round(ledger.writtenShare * 100) }}% · painted
          {{ Math.round(ledger.paintedShare * 100) }}%</span
        >
      </div>

      <div
        v-if="ledger.unbuiltUnits"
        class="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-snug"
        role="status"
      >
        <span class="text-warning"
          >{{ formatCount(ledger.unbuiltUnits) }} planned
          {{
            forge.existing.slug === 'memory-dungeon'
              ? 'realm positions'
              : 'beats'
          }}
          not authored or painted</span
        >
        <span
          >{{ formatCount(ledger.units) }} authored beats inspected ·
          {{ formatCount(ledger.plannedUnits) }} total estimated slots</span
        >
        <span v-if="memoryRealms"
          >{{ memoryRealms.built }} of {{ memoryRealms.planned }} realm maps
          represented ·
          {{ Math.max(0, memoryRealms.planned - memoryRealms.built) }}
          remain</span
        >
      </div>
      <p
        v-if="ledger.extraArt.total"
        class="text-xs leading-snug tabular-nums text-warning"
        role="status"
      >
        Extra game images verified:
        {{ formatCount(ledger.extraArt.delivered) }} /
        {{ formatCount(ledger.extraArt.total) }} (choice outcomes, portraits,
        villain art and items). SVG fallback scenes are not completed paintings.
      </p>
      <ul
        class="grid grid-cols-3 gap-x-4 gap-y-2 @3xl:grid-cols-6"
        aria-label="Totals"
      >
        <li
          v-for="stat in totals"
          :key="stat.label"
          class="flex min-w-0 flex-col"
        >
          <span class="pf-kicker text-[0.6rem] opacity-70">{{
            stat.label
          }}</span>
          <span
            class="pf-display text-xl tabular-nums @3xl:text-2xl"
            :class="stat.cls"
            >{{ stat.value }}</span
          >
        </li>
      </ul>

      <p
        v-if="ledger.discrepancies.length"
        class="hidden min-w-0 items-baseline gap-2 text-xs @3xl:flex"
        role="status"
      >
        <span class="pf-kicker shrink-0 text-[0.6rem] text-warning"
          >{{ ledger.discrepancies.length }} discrepancies</span
        >
        <span class="truncate opacity-80">{{
          ledger.discrepancies.join(' · ')
        }}</span>
      </p>
    </header>

    <section
      class="min-h-0 min-w-0 flex-col gap-2"
      :class="forge.ledgerPanel === 'adjust' ? 'hidden @5xl:flex' : 'flex'"
    >
      <p class="pf-kicker shrink-0 text-secondary">
        {{
          ledger.sections.length
            ? `${ledger.starred} of ${ledger.sections.length} sections starred`
            : 'Plan against code'
        }}
      </p>
      <ul
        class="kr-scroll -mx-1 flex min-h-0 flex-col gap-1.5 px-1 py-1"
        aria-label="Sections"
      >
        <li v-for="(section, i) in ledger.sections" :key="section.id">
          <button
            type="button"
            data-nav
            :data-autofocus="i === 0 ? '' : undefined"
            class="pf-row pf-focusable"
            :class="[
              forge.ledgerSection === i ? 'pf-row-on' : '',
              section.starred ? 'pf-row-starred' : '',
            ]"
            :aria-label="`${section.label}: ${section.starred ? 'starred' : `${section.units.length - section.art.delivered} pictures to go`}`"
            @click="
              forge.existing &&
              forge.openGallery(forge.existing.slug, {
                type: 'section',
                id: section.id,
              })
            "
            @focus="forge.focusSection(i)"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
          >
            <span
              class="pf-star w-6 shrink-0 text-center text-xl"
              :class="section.starred ? 'pf-star-on' : 'opacity-30'"
              aria-hidden="true"
              >{{ section.starred ? '★' : '☆' }}</span
            >
            <span class="flex min-w-0 flex-1 flex-col gap-1 text-left">
              <span class="flex items-baseline justify-between gap-2">
                <span class="pf-label truncate text-sm @3xl:text-base">{{
                  section.label
                }}</span>
                <span class="text-xs tabular-nums opacity-70"
                  >{{ section.art.delivered }}/{{ section.units.length }}</span
                >
              </span>
              <span class="flex h-1.5 w-full gap-px overflow-hidden">
                <span
                  v-for="seg in segments(section.art, section.units.length)"
                  :key="seg.state"
                  :class="seg.cls"
                  :style="{ flexGrow: seg.count }"
                />
              </span>
            </span>
            <span class="pf-built w-20">
              <span class="pf-kicker text-[0.55rem] opacity-70">{{
                sideFor(section).label
              }}</span>
              <span class="tabular-nums">{{ sideFor(section).value }}</span>
            </span>
          </button>
        </li>
        <li
          v-for="gap in planRows"
          :key="gap.label"
          class="pf-row"
          :class="gap.built >= gap.planned ? 'pf-row-starred' : ''"
        >
          <span
            class="pf-star w-6 shrink-0 text-center text-xl"
            :class="gap.built >= gap.planned ? 'pf-star-on' : 'opacity-30'"
            aria-hidden="true"
            >{{ gap.built >= gap.planned ? '★' : '☆' }}</span
          >
          <span class="pf-label min-w-0 flex-1 truncate text-sm">{{
            gap.label
          }}</span>
          <span
            class="pf-display tabular-nums"
            :class="gap.built >= gap.planned ? 'text-success' : 'text-warning'"
            >{{ gap.built }} / {{ gap.planned }}</span
          >
        </li>
      </ul>
    </section>

    <PlaybookForgeAdjust v-if="forge.ledgerPanel === 'adjust'" />
    <PlaybookForgeLedgerDetail v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { formatCount, formatDuration } from '~/utils/playbookForge/estimate'
import { FACTOR_ROWS } from '~/utils/playbookForge/factors'
import { kitPlaybook } from '~/utils/playbookKit/games'
import { completionPercent } from '~/utils/playbookForge/ledger'
import type {
  ArtState,
  LedgerSection,
  SectionCounts,
} from '~/utils/playbookForge/ledger'

const forge = usePlaybookForgeStore()
const ledger = computed(() => forge.ledger)
const memoryRealms = computed(() => {
  const entry = forge.existing
  if (entry?.slug !== 'memory-dungeon') return null
  const perRealm = 64 + 36
  return {
    built: Math.floor(Number(forge.built?.values.encounters ?? 0) / perRealm),
    planned: Math.ceil(forge.planFor(entry).encounters / perRealm),
  }
})
const kitSpec = computed(() =>
  forge.existing ? kitPlaybook(forge.existing.slug) : undefined,
)

const STATE_CLASS: Record<ArtState, string> = {
  delivered: 'bg-success',
  rendered: 'bg-warning',
  queued: 'bg-info',
  failed: 'bg-error',
  missing: 'bg-base-content/15',
}

function segments(art: SectionCounts, total: number) {
  return (Object.keys(STATE_CLASS) as ArtState[])
    .filter((state) => art[state] > 0 || (!total && state === 'missing'))
    .map((state) => ({
      state,
      count: art[state] || 1,
      cls: STATE_CLASS[state],
    }))
}

const shineLabel = computed(() => {
  const l = ledger.value
  if (!l) return ''
  if (l.shine === 'super') return '★ Super shiny'
  if (!l.sections.length) return l.gaps.length ? 'In production' : '★ Plan met'
  if (l.shine === 'star') return `★ ${l.starred} starred`
  return 'In production'
})
const shineClass = computed(() =>
  ledger.value?.shine === 'super'
    ? 'pf-shine-text'
    : ledger.value?.shine === 'star'
      ? 'text-primary'
      : '',
)

/** The right-hand figure on a section row: what is left, else what it cost, else done. */
function sideFor(section: LedgerSection) {
  if (section.remainingSeconds)
    return { label: 'Left', value: formatDuration(section.remainingSeconds) }
  if (section.remainingWords)
    return { label: 'Words', value: formatCount(section.remainingWords) }
  if (section.takenSeconds)
    return { label: 'Spent', value: formatDuration(section.takenSeconds) }
  return section.starred
    ? { label: 'Status', value: 'Done' }
    : { label: 'Waiting', value: 'Relay' }
}

/** Studio-less games list their measured factors against the plan instead of beats. */
const planRows = computed(() => {
  const entry = forge.existing
  const built = forge.built
  if (!entry || !built || ledger.value?.sections.length) return []
  const plan = forge.planFor(entry)
  return FACTOR_ROWS.flatMap((row) =>
    row.kind === 'stepper' && built.measured.includes(row.key)
      ? [
          {
            label: row.label,
            built: Number(built.values[row.key] ?? 0),
            planned: Number(plan[row.key] ?? 0),
          },
        ]
      : [],
  )
})

const totals = computed(() => {
  const l = ledger.value
  if (!l) return []
  const spent = forge.ledgerRelay?.jobs.renderSeconds ?? l.takenSeconds
  return [
    {
      label: 'Art delivered',
      value:
        l.plannedUnits + l.extraArt.total
          ? `${l.art.delivered}/${l.plannedUnits + l.extraArt.total}`
          : '—',
      cls:
        l.plannedUnits + l.extraArt.total > 0 &&
        l.art.delivered === l.plannedUnits + l.extraArt.total
          ? 'text-success'
          : '',
    },
    {
      label: 'Not wired',
      value: String(l.art.rendered),
      cls: l.art.rendered ? 'text-warning' : 'opacity-50',
    },
    {
      label: 'Failed',
      value: String(l.art.failed),
      cls: l.art.failed ? 'text-error' : 'opacity-50',
    },
    { label: 'Relay time spent', value: formatDuration(spent), cls: '' },
    {
      label: 'Render left',
      value: formatDuration(l.remainingSeconds),
      cls: l.remainingSeconds ? 'text-primary' : 'opacity-50',
    },
    {
      label: 'Words left',
      value: formatCount(l.remainingWords),
      cls: l.remainingWords ? 'text-primary' : 'opacity-50',
    },
  ]
})
</script>
