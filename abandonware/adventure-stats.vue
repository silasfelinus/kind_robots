<!-- components/adventure/adventure-stats.vue -->
<!--
  Tactile 1–6 stat block assignment grid.
  Number blocks along the top: tap to select.
  Stat rows below: tap to assign the selected number.
  No emits. All state via adventureStore.
-->
<template>
  <div class="flex flex-col gap-5">
    <!-- Number blocks -->
    <div class="flex flex-col gap-2">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Select a number
      </p>

      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="block in store.statBlocks"
          :key="block"
          type="button"
          class="stat-block group relative flex flex-col items-center justify-center rounded-2xl border-2 py-3 font-black transition-all duration-150 select-none"
          :class="blockClass(block)"
          @click="store.selectStatBlock(block)"
        >
          <!-- The number -->
          <span class="text-2xl leading-none tabular-nums">{{ block }}</span>

          <!-- Rarity label beneath -->
          <span
            class="mt-1 text-[0.6rem] font-bold uppercase tracking-wider opacity-60"
          >
            {{ tierLabel(block) }}
          </span>

          <!-- Selected ring pulse -->
          <span
            v-if="store.selectedStatBlock === block"
            class="absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-1 ring-offset-base-100 animate-pulse"
          />
        </button>
      </div>
    </div>

    <!-- Divider with instruction -->
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-base-300" />
      <p class="text-xs text-base-content/40">
        {{
          store.selectedStatBlock
            ? `Assign ${store.selectedStatBlock} to a stat`
            : 'pick a number above'
        }}
      </p>
      <div class="h-px flex-1 bg-base-300" />
    </div>

    <!-- Stat rows -->
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        v-for="stat in store.draftStats"
        :key="stat.key"
        type="button"
        class="stat-row group flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-150"
        :class="statRowClass(stat)"
        :disabled="!store.selectedStatBlock && !stat.value"
        @click="store.assignStat(stat.key)"
      >
        <!-- Emoji icon -->
        <span class="text-2xl" role="img" :aria-label="stat.name">
          {{ stat.display }}
        </span>

        <!-- Name + tier -->
        <div class="min-w-0 flex-1">
          <p class="font-black text-base-content leading-tight">
            {{ stat.name }}
          </p>
          <p
            v-if="stat.value"
            class="text-xs font-bold uppercase tracking-wider transition-colors"
            :class="tierColor(stat.value)"
          >
            {{ tierLabel(stat.value) }}
          </p>
          <p v-else class="text-xs text-base-content/30">unassigned</p>
        </div>

        <!-- Value badge -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 font-black text-xl tabular-nums transition-all duration-200"
          :class="valueBadgeClass(stat)"
        >
          {{ stat.value || '—' }}
        </div>
      </button>
    </div>

    <!-- Progress + roll row -->
    <div class="flex items-center justify-between gap-3">
      <!-- Completion dots -->
      <div class="flex items-center gap-1.5">
        <div
          v-for="i in 6"
          :key="i"
          class="h-2 w-2 rounded-full transition-all duration-300"
          :class="
            store.draftStats.filter((s) => s.value > 0).length >= i
              ? 'bg-primary scale-110'
              : 'bg-base-300'
          "
        />
        <span class="ml-1 text-xs text-base-content/40">
          {{ store.draftStats.filter((s) => s.value > 0).length }}/6
        </span>
      </div>

      <!-- Roll all -->
      <button
        type="button"
        class="btn btn-sm btn-ghost gap-2 rounded-xl border border-base-300 hover:border-secondary hover:bg-secondary/10"
        @click="store.rollAllStats"
      >
        <Icon name="kind-icon:dice" class="h-3.5 w-3.5" />
        Roll All
      </button>
    </div>

    <!-- Allocation complete indicator -->
    <Transition name="complete-pop">
      <div
        v-if="store.statAllocationComplete"
        class="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3"
      >
        <Icon name="kind-icon:check" class="h-4 w-4 shrink-0 text-success" />
        <p class="text-sm font-bold text-success">
          All six numbers placed. The cosmos has updated its records.
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useAdventureStore } from '@/stores/adventureStore'
import type { StatEntry } from '@/stores/adventureStore'

const store = useAdventureStore()

// ── Rarity tier helpers ─────────────────────────────────────────────────────

const TIER_LABELS: Record<number, string> = {
  1: 'common',
  2: 'uncommon',
  3: 'rare',
  4: 'epic',
  5: 'legendary',
  6: 'mythic',
}

function tierLabel(value: number): string {
  return TIER_LABELS[value] ?? '—'
}

function tierColor(value: number): string {
  if (value >= 6) return 'text-warning'
  if (value === 5) return 'text-warning/70'
  if (value === 4) return 'text-secondary'
  if (value === 3) return 'text-primary'
  if (value === 2) return 'text-success'
  return 'text-base-content/40'
}

// ── Block styling ───────────────────────────────────────────────────────────

function blockClass(block: number): string {
  const isSelected = store.selectedStatBlock === block
  const isUsed = store.usedStatValues.includes(block)

  if (isSelected) {
    return 'border-primary bg-primary text-primary-content shadow-lg shadow-primary/30 scale-105 z-10'
  }
  if (isUsed) {
    return 'border-base-300 bg-base-200 text-base-content/40 cursor-default'
  }
  return 'border-base-300 bg-base-100 text-base-content hover:border-primary/50 hover:bg-primary/8 hover:text-primary hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
}

// ── Stat row styling ────────────────────────────────────────────────────────

function statRowClass(stat: StatEntry): string {
  const isTarget = Boolean(store.selectedStatBlock) && !stat.value
  const hasValue = stat.value > 0

  if (hasValue && !store.selectedStatBlock) {
    // Filled, no number selected — show tier color subtly
    return 'border-base-300 bg-base-100 cursor-pointer hover:border-primary/40'
  }
  if (isTarget) {
    // Primed: a number is selected, this slot is empty
    return 'border-primary/40 bg-primary/5 cursor-pointer hover:border-primary hover:bg-primary/12 hover:shadow-sm hover:shadow-primary/10'
  }
  if (store.selectedStatBlock && hasValue) {
    // A number is selected, this slot is already filled — still clickable (reassign)
    return 'border-base-300 bg-base-100 cursor-pointer hover:border-warning/50 hover:bg-warning/5'
  }
  return 'border-base-300 bg-base-100'
}

function valueBadgeClass(stat: StatEntry): string {
  if (!stat.value) {
    return 'border-base-300 bg-base-200 text-base-content/20'
  }
  if (stat.value >= 6) return 'border-warning/50 bg-warning/10 text-warning'
  if (stat.value === 5) return 'border-warning/30 bg-warning/5 text-warning/70'
  if (stat.value === 4)
    return 'border-secondary/40 bg-secondary/8 text-secondary'
  if (stat.value === 3) return 'border-primary/40 bg-primary/8 text-primary'
  if (stat.value === 2) return 'border-success/40 bg-success/8 text-success'
  return 'border-base-300 bg-base-200 text-base-content/50'
}
</script>

<style scoped>
.stat-block {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.stat-row {
  -webkit-tap-highlight-color: transparent;
}

.complete-pop-enter-active {
  transition:
    opacity 300ms ease,
    transform 300ms cubic-bezier(0.34, 1.4, 0.64, 1);
}
.complete-pop-leave-active {
  transition: opacity 150ms ease;
}
.complete-pop-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
.complete-pop-leave-to {
  opacity: 0;
}
</style>
