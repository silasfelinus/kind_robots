<template>
  <div
    v-if="forge.draft"
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(18rem,1.3fr)_minmax(0,1fr)] gap-3 @5xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)] @5xl:grid-rows-[auto_minmax(0,1fr)] @5xl:gap-4"
  >
    <header class="flex min-w-0 flex-col gap-2 @5xl:col-span-2">
      <div class="flex shrink-0 items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="pf-kicker text-secondary">
            {{
              forge.existing
                ? `Analyze · ${forge.existing.title}`
                : forge.draft.title
            }}
          </p>
          <p class="pf-display mt-1 hidden text-2xl @3xl:block @3xl:text-3xl">
            {{ tabInfo.label }}
          </p>
          <p class="mt-1 text-sm opacity-70">{{ tabInfo.blurb }}</p>
        </div>
        <button
          v-if="forge.existing"
          type="button"
          class="pf-label btn btn-ghost btn-sm shrink-0"
          @click="forge.resetPlan()"
        >
          Reset plan
        </button>
      </div>

      <p
        v-if="forge.existing"
        class="hidden shrink-0 text-xs opacity-70 @3xl:block"
      >
        <template v-if="forge.loadingBuilt">Counting what is built…</template>
        <template v-else-if="forge.built">
          Built is counted from {{ forge.built.source }}; plan is the
          {{ forge.existing.planSource }}. Rows without a count are carried from
          the plan.
        </template>
        <template v-else>{{ forge.status }}</template>
      </p>

      <div
        v-if="forge.tab === 'pitch' && !forge.existing"
        class="grid shrink-0 gap-2 @3xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
      >
        <input
          :value="forge.draft.title"
          data-nav
          maxlength="80"
          aria-label="Title"
          class="pf-field pf-display text-xl"
          @input="
            forge.setText('title', ($event.target as HTMLInputElement).value)
          "
        />
        <textarea
          :value="forge.draft.idea"
          data-nav
          rows="2"
          maxlength="1200"
          aria-label="Idea"
          placeholder="The idea, in plain words"
          class="pf-field resize-none text-sm"
          @input="
            forge.setText('idea', ($event.target as HTMLTextAreaElement).value)
          "
        />
      </div>
    </header>

    <PlaybookForgeDesigns />

    <section class="flex min-h-0 min-w-0 flex-col gap-3">
      <ul
        class="kr-scroll -mx-1 flex min-h-0 flex-col gap-1.5 px-1 py-1"
        aria-label="Factors"
      >
        <li v-for="(row, i) in forge.rows" :key="row.key">
          <button
            type="button"
            data-nav
            data-adjust
            :data-autofocus="i === 0 ? '' : undefined"
            class="pf-row pf-focusable"
            :class="forge.focus === i ? 'pf-row-on' : ''"
            :aria-label="`${row.label}: ${displayValue(row, forge.draft)}`"
            @focus="forge.focus = i"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
            @click="forge.step(1, row)"
            @pf-adjust="forge.step(($event as CustomEvent<1 | -1>).detail, row)"
          >
            <span class="pf-label min-w-0 flex-1 truncate text-left text-sm">{{
              row.label
            }}</span>
            <span
              v-if="forge.existing"
              class="pf-built"
              :class="builtClass(row)"
            >
              <span class="pf-kicker text-[0.55rem] opacity-70">Built</span>
              <span class="tabular-nums">{{ builtValue(row) }}</span>
            </span>
            <span class="pf-value">
              <span
                class="pf-chev"
                aria-hidden="true"
                @click.stop="forge.step(-1, row)"
                >◀</span
              >
              <span
                class="pf-display min-w-[3.25rem] text-center text-base"
                :class="
                  row.kind === 'toggle' && !forge.draft[row.key]
                    ? 'opacity-50'
                    : ''
                "
                >{{ displayValue(row, forge.draft) }}</span
              >
              <span
                class="pf-chev"
                aria-hidden="true"
                @click.stop="forge.step(1, row)"
                >▶</span
              >
            </span>
          </button>
        </li>
      </ul>

      <div v-if="forge.focusedRow" class="pf-help shrink-0" aria-live="polite">
        <p class="pf-label text-xs text-primary">
          {{ forge.focusedRow.label }}
        </p>
        <p class="mt-1 text-sm leading-snug opacity-90">
          {{ forge.focusedRow.help }}
        </p>
      </div>

      <PlaybookForgeHud compact />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import {
  FORGE_TABS,
  displayValue,
  type FactorRow,
} from '~/utils/playbookForge/factors'

const forge = usePlaybookForgeStore()

const tabInfo = computed(
  () => FORGE_TABS.find((t) => t.id === forge.tab) ?? FORGE_TABS[0]!,
)

function measured(row: FactorRow): boolean {
  return !!forge.built?.measured.includes(row.key)
}

function builtValue(row: FactorRow): string {
  if (forge.loadingBuilt) return '…'
  return measured(row) && forge.builtPlan
    ? displayValue(row, forge.builtPlan)
    : '—'
}

function builtClass(row: FactorRow): string {
  if (
    !measured(row) ||
    !forge.builtPlan ||
    !forge.draft ||
    row.kind !== 'stepper'
  )
    return 'opacity-60'
  const built = forge.builtPlan[row.key] as number
  const plan = forge.draft[row.key] as number
  return built >= plan ? 'text-success' : 'text-warning'
}
</script>
