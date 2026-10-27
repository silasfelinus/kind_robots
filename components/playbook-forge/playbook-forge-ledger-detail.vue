<template>
  <aside
    class="pf-panel @container flex min-h-0 flex-col gap-3 overflow-hidden p-3 @5xl:p-5"
    :class="ledger?.shine === 'super' ? 'pf-panel-super' : ''"
    aria-label="Section detail"
  >
    <template v-if="section">
      <div class="flex shrink-0 items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="pf-kicker text-secondary">
            {{ section.units.length }}
            {{ section.units.length === 1 ? 'beat' : 'beats' }}
          </p>
          <p class="pf-display mt-1 flex items-center gap-2 text-2xl">
            <span
              :class="section.starred ? 'pf-star-on' : 'opacity-40'"
              aria-hidden="true"
              >{{ section.starred ? '★' : '☆' }}</span
            >
            {{ section.label }}
          </p>
        </div>
        <p class="text-right text-xs leading-snug tabular-nums opacity-80">
          <template v-if="section.takenSeconds"
            >Spent {{ formatDuration(section.takenSeconds) }}<br
          /></template>
          <template v-if="section.starred">Starred</template>
          <template v-else>
            Left {{ formatDuration(section.remainingSeconds) }} ·
            {{ formatCount(section.remainingWords) }} words
          </template>
        </p>
      </div>

      <div class="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          data-nav
          data-adjust
          class="pf-row pf-focusable"
          :aria-label="`Art lane: ${lane?.label}`"
          @click="forge.cycleLane(1)"
          @pf-adjust="forge.cycleLane(($event as CustomEvent<1 | -1>).detail)"
          @mouseenter="($event.currentTarget as HTMLElement).focus()"
        >
          <span class="pf-label flex-1 truncate text-left text-sm"
            ><span class="hidden @md:inline">Art </span>Lane</span
          >
          <span class="pf-value">
            <span
              class="pf-chev"
              aria-hidden="true"
              @click.stop="forge.cycleLane(-1)"
              >◀</span
            >
            <span
              class="pf-display min-w-[5rem] text-center text-sm @md:min-w-[7rem]"
              >{{ shortLane }}</span
            >
            <span
              class="pf-chev"
              aria-hidden="true"
              @click.stop="forge.cycleLane(1)"
              >▶</span
            >
          </span>
        </button>

        <div
          v-if="forge.ledgerConfirm"
          class="pf-help flex flex-col gap-2"
          role="alertdialog"
          aria-label="Confirm submit"
        >
          <p class="text-sm leading-snug">{{ confirmText }}</p>
          <div class="flex gap-2">
            <button
              type="button"
              data-nav
              data-autofocus
              class="pf-label btn btn-primary btn-sm pf-focusable"
              :disabled="forge.busy"
              @click="forge.confirmSubmit()"
            >
              Send
            </button>
            <button
              type="button"
              data-nav
              class="pf-label btn btn-ghost btn-sm pf-focusable"
              @click="forge.ledgerConfirm = null"
            >
              Cancel
            </button>
          </div>
        </div>
        <div v-else class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm pf-focusable"
            :class="toPaint ? 'btn-primary' : 'btn-ghost'"
            :disabled="forge.busy || !forge.ledgerBook"
            @click="forge.askSubmit('art')"
          >
            Submit art · {{ toPaint }}
          </button>
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm pf-focusable"
            :class="toWrite ? 'btn-secondary' : 'btn-ghost'"
            :disabled="forge.busy || !forge.ledgerBook"
            @click="forge.askSubmit('text')"
          >
            Send writing · {{ toWrite }}
          </button>
        </div>
      </div>
    </template>
    <p v-else-if="ledger" class="pf-kicker shrink-0 text-secondary">
      Relay record
    </p>

    <div class="kr-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-4 px-1">
      <ul v-if="section" class="flex flex-col gap-1" aria-label="Beats">
        <li v-for="unit in units" :key="unit.key">
          <button
            type="button"
            class="pf-focusable flex w-full items-center gap-2 border-l-2 py-1 pl-2 text-left text-sm hover:bg-base-content/5"
            :class="BORDER[unit.art]"
            :title="`Open ${unit.title} in the gallery`"
            @click="
              forge.existing &&
              forge.openGallery(
                forge.existing.slug,
                { type: 'section', id: section.id },
                unit.key,
              )
            "
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ unit.title }}</span>
              <span class="block truncate text-[0.7rem] opacity-60">
                {{ unitNote(unit) }}
              </span>
            </span>
            <span
              class="pf-kicker shrink-0 text-[0.6rem]"
              :class="TEXT[unit.art]"
              >{{ LABEL[unit.art] }}</span
            >
          </button>
        </li>
      </ul>
      <p v-else-if="ledger" class="text-sm opacity-80">
        This game has no Playbook Studio adapter yet, so the ledger reads its
        plan factors from code and its spend from the relay's project jobs.
      </p>

      <section
        v-if="ledger?.discrepancies.length"
        class="flex flex-col gap-1"
        aria-label="Discrepancies"
      >
        <p class="pf-kicker text-[0.6rem] text-warning">
          {{ ledger.discrepancies.length }} discrepancies in this game
        </p>
        <p
          v-for="line in ledger.discrepancies"
          :key="line"
          class="border-l-2 border-warning pl-2 text-xs leading-snug"
        >
          {{ line }}
        </p>
      </section>
    </div>

    <PlaybookForgeRelay class="hidden shrink-0 @md:flex" />
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore, SUBMIT_CAP } from '~/stores/playbookForgeStore'
import { PLAYBOOK_ART_LANES } from '~/utils/playbook/artLanes'
import { formatCount, formatDuration } from '~/utils/playbookForge/estimate'
import {
  unitsToPaint,
  unitsToWrite,
  type ArtState,
  type LedgerUnit,
} from '~/utils/playbookForge/ledger'

const forge = usePlaybookForgeStore()
const ledger = computed(() => forge.ledger)
const section = computed(() => forge.ledgerFocused)

const LABEL: Record<ArtState, string> = {
  delivered: 'Delivered',
  rendered: 'Not wired',
  queued: 'Queued',
  failed: 'Failed',
  missing: 'No art',
}
const TEXT: Record<ArtState, string> = {
  delivered: 'text-success',
  rendered: 'text-warning',
  queued: 'text-info',
  failed: 'text-error',
  missing: 'opacity-60',
}
const BORDER: Record<ArtState, string> = {
  delivered: 'border-success',
  rendered: 'border-warning',
  queued: 'border-info',
  failed: 'border-error',
  missing: 'border-base-content/20',
}
const ORDER: ArtState[] = [
  'failed',
  'missing',
  'rendered',
  'queued',
  'delivered',
]

const lane = computed(() =>
  PLAYBOOK_ART_LANES.find((l) => l.key === forge.ledgerLane),
)
const shortLane = computed(() => lane.value?.label.replace(/ \(.*\)$/, ''))
const toPaint = computed(() =>
  section.value ? Math.min(unitsToPaint(section.value).length, SUBMIT_CAP) : 0,
)
const toWrite = computed(() =>
  section.value ? unitsToWrite(section.value).length : 0,
)

/** Missing and failed first, so what needs a hand is on top. */
const units = computed(() =>
  [...(section.value?.units ?? [])].sort(
    (a, b) =>
      ORDER.indexOf(a.art) - ORDER.indexOf(b.art) ||
      Number(a.written) - Number(b.written),
  ),
)

function unitNote(unit: LedgerUnit): string {
  const parts: string[] = []
  if (!unit.written) parts.push('no scene text')
  if (unit.outcomes.written < unit.outcomes.expected)
    parts.push(
      `${unit.outcomes.expected - unit.outcomes.written} outcomes unwritten`,
    )
  const failed = unit.jobs.find((j) => j.status === 'FAILED' && j.error)
  if (unit.art === 'failed' && failed?.error) parts.push(failed.error)
  if (unit.takenSeconds)
    parts.push(`${formatDuration(unit.takenSeconds)} on the relay`)
  if (unit.art === 'rendered') parts.push('rendered; wire it into the game')
  return parts.join(' · ') || unit.key
}

const confirmText = computed(() => {
  const pending = forge.ledgerConfirm
  if (!pending) return ''
  if (pending.kind === 'art') {
    const ready = Math.max(0, pending.count - pending.unprompted)
    const parts = [
      ready
        ? `Send ${ready} picture${ready === 1 ? '' : 's'} with written prompts to the relay on ${shortLane.value} (about ${formatDuration((pending.seconds / Math.max(1, pending.count)) * ready)} of render time)`
        : '',
      pending.unprompted
        ? `queue prompt writing for ${pending.unprompted} beat${pending.unprompted === 1 ? '' : 's'} that ${pending.unprompted === 1 ? 'has' : 'have'} no art prompt yet (no art is made from titles)`
        : '',
    ].filter(Boolean)
    return `${parts.join(', and ')}?`.replace(/^./, (c) => c.toUpperCase())
  }
  return `Send ${pending.count} beat${pending.count === 1 ? '' : 's'} of missing writing (about ${formatCount(pending.words)} words) to the next agent as a Todo?`
})
</script>
